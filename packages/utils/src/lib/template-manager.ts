import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import ora from 'ora';
import inquirer from 'inquirer';
import { extract as tarExtract } from 'tar';
import { FileSystemError, NetworkError } from './errors.js';

/**
 * 模板信息接口
 */
export interface TemplateInfo {
  name: string;
  displayName: string;
  packageName: string;
  description: string;
  version?: string;
}

/**
 * 模板 scope (npm 组织名称)
 */
const TEMPLATE_SCOPE = '@zhengke0110';

/**
 * 模板包名前缀
 */
const TEMPLATE_PREFIX = 'template-';

/**
 * 获取缓存目录
 */
export function getCacheDir(): string {
  const cacheDir = path.join(os.homedir(), '.zhengke-cli', 'templates');
  return cacheDir;
}

/**
 * npm 包数据接口
 */
interface NpmPackageData {
  name: string;
  version: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * 从包名解析模板信息
 */
function parseTemplateInfo(packageName: string, packageData: NpmPackageData): TemplateInfo | null {
  // 检查是否是模板包
  if (!packageName.startsWith(`${TEMPLATE_SCOPE}/${TEMPLATE_PREFIX}`)) {
    return null;
  }

  // 提取模板名称 (去掉 scope 和 template- 前缀)
  const fullName = packageName.replace(`${TEMPLATE_SCOPE}/`, '');
  const name = fullName.replace(TEMPLATE_PREFIX, '');

  // 从 description 或包名生成 displayName
  let displayName = name;
  if (name === 'react-ts') {
    displayName = 'React + TypeScript';
  } else if (name === 'vue-ts') {
    displayName = 'Vue + TypeScript';
  } else {
    // 将 kebab-case 转换为 Title Case
    displayName = name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return {
    name,
    displayName,
    packageName,
    description: packageData.description || `${displayName} template for zhengke-cli`,
    version: packageData.version,
  };
}

/**
 * 从 npm 获取模板列表
 */
export async function fetchAvailableTemplates(): Promise<TemplateInfo[]> {
  const spinner = ora('正在获取可用模板...').start();
  
  try {
    // 搜索 @zhengke0110 scope 下的所有包
    const searchOutput = execSync(
      `npm search ${TEMPLATE_SCOPE} --json`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 10 * 1024 * 1024 }
    ).trim();

    if (!searchOutput || searchOutput === '[]') {
      spinner.info('npm search 未返回结果，使用备用方案...');
      return fetchTemplatesFallback();
    }

    const packages = JSON.parse(searchOutput) as NpmPackageData[];
    const templates: TemplateInfo[] = [];

    // 解析每个包的信息，只保留模板包
    for (const pkg of packages) {
      // 只处理模板包
      if (pkg.name.startsWith(`${TEMPLATE_SCOPE}/${TEMPLATE_PREFIX}`)) {
        const templateInfo = parseTemplateInfo(pkg.name, pkg);
        if (templateInfo) {
          templates.push(templateInfo);
        }
      }
    }

    if (templates.length === 0) {
      spinner.info('未找到模板包，使用备用方案...');
      return fetchTemplatesFallback();
    }

    spinner.succeed(`找到 ${templates.length} 个可用模板`);
    return templates;
  } catch {
    spinner.info('npm search 失败，使用备用方案...');
    return fetchTemplatesFallback();
  }
}

/**
 * 备用方案：从已知的模板列表获取
 */
async function fetchTemplatesFallback(): Promise<TemplateInfo[]> {
  const spinner = ora('正在获取模板详情...').start();
  
  const knownTemplates = [
    '@zhengke0110/template-react-ts',
    '@zhengke0110/template-vue-ts',
  ];

  const templates: TemplateInfo[] = [];

  for (const packageName of knownTemplates) {
    try {
      const viewOutput = execSync(
        `npm view ${packageName} --json`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 10 * 1024 * 1024 }
      ).trim();

      if (!viewOutput) {
        continue;
      }

      const packageData = JSON.parse(viewOutput) as NpmPackageData;
      const templateInfo = parseTemplateInfo(packageName, packageData);
      
      if (templateInfo) {
        templates.push(templateInfo);
      }
    } catch {
      // 跳过无法获取的包
      continue;
    }
  }

  if (templates.length === 0) {
    spinner.fail('未找到任何可用模板');
    throw new NetworkError(
      '无法从 npm 获取模板列表，请检查网络连接'
    );
  }

  spinner.succeed(`找到 ${templates.length} 个可用模板`);
  return templates;
}

/**
 * 让用户选择模板
 */
export async function selectTemplate(templates: TemplateInfo[]): Promise<TemplateInfo> {
  const choices = templates.map(t => ({
    name: `${t.displayName} - ${t.description} (v${t.version})`,
    value: t.name,
  }));

  const { templateName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'templateName',
      message: '请选择项目模板:',
      choices,
    },
  ]);

  const selectedTemplate = templates.find(t => t.name === templateName);
  if (!selectedTemplate) {
    throw new Error(`模板 ${templateName} 不存在`);
  }

  return selectedTemplate;
}

/**
 * 下载模板到缓存目录
 */
export async function downloadTemplate(template: TemplateInfo): Promise<string> {
  const cacheDir = getCacheDir();
  const templateCacheDir = path.join(cacheDir, template.name, template.version || 'latest');

  // 检查缓存是否存在
  if (await fs.pathExists(templateCacheDir)) {
    const { useCache } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useCache',
        message: `检测到缓存的模板 (${template.displayName} v${template.version})，是否使用？`,
        default: true,
      },
    ]);

    if (useCache) {
      return templateCacheDir;
    }

    // 清除旧缓存
    await fs.remove(templateCacheDir);
  }

  // 确保缓存目录存在
  await fs.ensureDir(templateCacheDir);

  const spinner = ora(`正在下载模板 ${template.displayName}...`).start();

  try {
    // 使用 npm pack 下载模板
    const packOutput = execSync(
      `npm pack ${template.packageName}@${template.version || 'latest'}`,
      { 
        cwd: cacheDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }
    ).trim();

    const tarballName = packOutput.split('\n').pop()?.trim();
    if (!tarballName) {
      throw new Error('无法获取下载的 tarball 文件名');
    }

    const tarballPath = path.join(cacheDir, tarballName);

    // 使用 tar 库解压 (跨平台兼容)
    await tarExtract({
      file: tarballPath,
      cwd: templateCacheDir,
      strip: 1, // 去掉顶层的 package 目录
    });

    // 删除 tarball 文件
    await fs.remove(tarballPath);

    spinner.succeed(`模板下载成功: ${template.displayName}`);
    return templateCacheDir;
  } catch (error) {
    spinner.fail('模板下载失败');
    throw new NetworkError(
      `下载模板失败: ${template.packageName}`,
      error as Error
    );
  }
}

/**
 * 安装模板到目标目录
 */
export async function installTemplate(
  templatePath: string,
  targetPath: string,
  projectName: string
): Promise<void> {
  const spinner = ora('正在安装项目模板...').start();

  try {
    // 检查目标目录是否已存在
    if (await fs.pathExists(targetPath)) {
      spinner.stop();
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `目录 ${projectName} 已存在，是否覆盖？`,
          default: false,
        },
      ]);

      if (!overwrite) {
        throw new FileSystemError(
          '覆盖',
          targetPath,
          new Error('目标目录已存在，用户取消安装')
        );
      }

      await fs.remove(targetPath);
      spinner.start('正在安装项目模板...');
    }

    // 复制模板文件到目标目录
    await fs.copy(templatePath, targetPath, {
      filter: (src: string) => {
        // 过滤掉不需要的文件
        const basename = path.basename(src);
        return !['node_modules', '.git', 'dist', '.DS_Store'].includes(basename);
      },
    });

    // 更新 package.json 中的项目信息
    const packageJsonPath = path.join(targetPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      
      // 更新基本信息
      packageJson.name = projectName;
      packageJson.version = '0.0.1';
      packageJson.description = ''; // 清空描述,让用户自己填写
      
      // 移除模板相关的配置
      delete packageJson.repository; // 移除模板仓库信息
      delete packageJson.files; // 移除 npm 发布文件配置
      delete packageJson.publishConfig; // 移除发布配置
      delete packageJson.keywords; // 移除关键词
      delete packageJson.author; // 清空作者信息
      
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    }

    spinner.succeed('项目模板安装成功');
  } catch (error) {
    spinner.fail('项目模板安装失败');
    if (error instanceof FileSystemError) {
      throw error;
    }
    throw new FileSystemError(
      '安装',
      targetPath,
      error as Error
    );
  }
}

/**
 * 检测系统中可用的包管理工具
 */
function detectPackageManagers(): Array<{ name: string; command: string; display: string }> {
  const packageManagers = [
    { name: 'npm', command: 'npm install', display: 'npm' },
    { name: 'yarn', command: 'yarn install', display: 'Yarn' },
    { name: 'pnpm', command: 'pnpm install', display: 'pnpm' },
    { name: 'bun', command: 'bun install', display: 'Bun' },
  ];

  const availableManagers: Array<{ name: string; command: string; display: string }> = [];

  for (const manager of packageManagers) {
    try {
      // 尝试获取版本信息来检测是否安装
      execSync(`${manager.name} --version`, { 
        stdio: 'pipe',
        encoding: 'utf-8'
      });
      availableManagers.push(manager);
    } catch {
      // 如果命令失败，说明该包管理工具未安装
      continue;
    }
  }

  return availableManagers;
}

/**
 * 安装项目依赖
 */
export async function installDependencies(projectPath: string): Promise<void> {
  const { install } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'install',
      message: '是否立即安装项目依赖？',
      default: true,
    },
  ]);

  if (!install) {
    return;
  }

  // 检测可用的包管理工具
  const availableManagers = detectPackageManagers();
  
  if (availableManagers.length === 0) {
    throw new Error('未检测到任何包管理工具，请先安装 npm、yarn、pnpm 或 bun 中的任意一个');
  }

  let selectedManager = availableManagers[0]; // 默认选择第一个

  // 如果有多个包管理工具，让用户选择
  if (availableManagers.length > 1) {
    const { packageManager } = await inquirer.prompt([
      {
        type: 'list',
        name: 'packageManager',
        message: '选择要使用的包管理工具:',
        choices: availableManagers.map(manager => ({
          name: manager.display,
          value: manager.name,
        })),
        default: availableManagers[0].name,
      },
    ]);

    selectedManager = availableManagers.find(m => m.name === packageManager)!;
  }

  const spinner = ora(`正在使用 ${selectedManager.display} 安装项目依赖...`).start();

  try {
    execSync(selectedManager.command, {
      cwd: projectPath,
      stdio: 'inherit',
    });
    spinner.succeed(`项目依赖安装成功 (使用 ${selectedManager.display})`);
  } catch (error) {
    spinner.fail('项目依赖安装失败');
    throw new FileSystemError(
      '安装依赖',
      projectPath,
      error as Error
    );
  }
}

/**
 * 清除所有模板缓存
 */
export async function clearCache(): Promise<void> {
  const cacheDir = getCacheDir();
  const spinner = ora('正在清除模板缓存...').start();

  try {
    if (await fs.pathExists(cacheDir)) {
      await fs.remove(cacheDir);
      spinner.succeed('模板缓存已清除');
    } else {
      spinner.info('没有找到模板缓存');
    }
  } catch (error) {
    spinner.fail('清除缓存失败');
    throw new FileSystemError(
      '清除缓存',
      cacheDir,
      error as Error
    );
  }
}
