import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import ora from 'ora';
import inquirer from 'inquirer';
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
 * 可用的模板列表
 */
export const AVAILABLE_TEMPLATES: TemplateInfo[] = [
  {
    name: 'react-ts',
    displayName: 'React + TypeScript',
    packageName: '@zhengke0110/template-react-ts',
    description: 'React 19 + TypeScript + Vite 7',
  },
  {
    name: 'vue-ts',
    displayName: 'Vue + TypeScript',
    packageName: '@zhengke0110/template-vue-ts',
    description: 'Vue 3 + TypeScript + Vite 7',
  },
];

/**
 * 获取缓存目录
 */
export function getCacheDir(): string {
  const cacheDir = path.join(os.homedir(), '.zhengke-cli', 'templates');
  return cacheDir;
}

/**
 * 从 npm 获取模板列表
 */
export async function fetchAvailableTemplates(): Promise<TemplateInfo[]> {
  const spinner = ora('正在获取可用模板...').start();
  
  try {
    const templates = [...AVAILABLE_TEMPLATES];
    
    // 获取每个模板的最新版本
    for (const template of templates) {
      try {
        const version = execSync(
          `npm view ${template.packageName} version`,
          { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
        ).trim();
        template.version = version;
      } catch {
        // 如果获取版本失败，使用默认值
        template.version = 'latest';
      }
    }
    
    spinner.succeed('模板列表获取成功');
    return templates;
  } catch (error) {
    spinner.fail('获取模板列表失败');
    throw new NetworkError(
      '无法从 npm 获取模板列表',
      error as Error
    );
  }
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

    // 解压 tarball
    execSync(`tar -xzf "${tarballName}" -C "${templateCacheDir}" --strip-components=1`, {
      cwd: cacheDir,
      stdio: 'pipe',
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

    // 更新 package.json 中的项目名称
    const packageJsonPath = path.join(targetPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      packageJson.name = projectName;
      packageJson.version = '0.0.1';
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

  const spinner = ora('正在安装项目依赖...').start();

  try {
    execSync('npm install', {
      cwd: projectPath,
      stdio: 'inherit',
    });
    spinner.succeed('项目依赖安装成功');
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
