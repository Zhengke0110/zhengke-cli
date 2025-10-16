import logger from './logger.js';
import path from 'path';
import chalk from 'chalk';
import { existsSync } from 'fs';
import inquirer from 'inquirer';
import {
    ValidationError,
    fetchAvailableTemplates,
    selectTemplate,
    downloadTemplate,
    installTemplate,
    installDependencies,
    ConfigManager,
} from '@zhengke0110/utils';
import {
    TemplateDownloader,
    GitHubClient,
    TemplateSearcher,
    type GitHubTemplate,
} from '@zhengke0110/github';

/**
 * init 命令的选项接口
 */
export interface InitOptions {
    name?: string;
    template?: string;
    github?: boolean;
}

/**
 * 显示项目初始化完成信息
 */
function showNextSteps(projectName: string): void {
    logger.info(chalk.green('\n✨ 项目初始化成功！\n'));
    logger.info(chalk.cyan('接下来的步骤:'));
    logger.info(chalk.white(`  cd ${projectName}`));
    logger.info(chalk.white(`  # 请根据项目的 README.md 文件指示进行操作`));
    logger.info('');
}

/**
 * 执行项目初始化
 */
export async function handleInit(options: InitOptions): Promise<void> {
    logger.debug('开始执行 init 命令');

    // 1. 验证项目名称
    if (!options.name) {
        throw new ValidationError(
            '项目名称',
            '项目名称不能为空，请使用 --name 参数指定'
        );
    }

    const projectName = options.name;
    const projectPath = path.resolve(process.cwd(), projectName);

    logger.info(chalk.cyan('\n🚀 开始初始化项目...\n'));

    try {
        // 如果指定了 --github 参数，从个人 GitHub 账号搜索模板
        if (options.github) {
            await handleGitHubTemplateSearch(projectPath);
        } else {
            // 否则使用原有的内置模板流程
            await handleBuiltinTemplate(options, projectName, projectPath);
        }

        // 显示后续步骤
        showNextSteps(projectName);
    } catch (error) {
        logger.error(chalk.red('项目初始化失败'));
        throw error;
    }

    logger.debug('init 命令执行完成');
}

/**
 * 处理内置模板（原有逻辑）
 */
async function handleBuiltinTemplate(
    options: InitOptions,
    projectName: string,
    projectPath: string
): Promise<void> {
    // 2. 获取可用的模板列表
    logger.debug('步骤 1: 获取可用模板');
    const templates = await fetchAvailableTemplates();

    // 3. 让用户选择模板（如果未指定）
    let selectedTemplate;
    if (options.template) {
        selectedTemplate = templates.find((t) => t.name === options.template);
        if (!selectedTemplate) {
            throw new ValidationError(
                '模板',
                `模板 "${options.template}" 不存在。可用模板: ${templates
                    .map((t) => t.name)
                    .join(', ')}`
            );
        }
        logger.info(chalk.blue(`✓ 已选择模板: ${selectedTemplate.displayName}`));
    } else {
        logger.debug('步骤 2: 选择模板');
        selectedTemplate = await selectTemplate(templates);
    }

    // 4. 下载模板到缓存目录
    logger.debug('步骤 3: 下载模板');
    const templateCachePath = await downloadTemplate(selectedTemplate);

    // 5. 安装模板到项目目录
    logger.debug('步骤 4: 安装项目模板');
    await installTemplate(templateCachePath, projectPath, projectName);

    // 6. 安装项目依赖
    logger.debug('步骤 5: 安装项目依赖');
    await installDependencies(projectPath);
}

/**
 * 从 GitHub 搜索并选择模板（交互式）
 */
async function handleGitHubTemplateSearch(projectPath: string): Promise<void> {
    const configManager = new ConfigManager();

    // 获取 GitHub Token
    let token = configManager.getGitHubToken();

    if (!token) {
        logger.warn(chalk.yellow('\n⚠️  未配置 GitHub Token'));
        logger.info(chalk.cyan('请访问 https://github.com/settings/tokens 创建一个 Personal Access Token'));
        logger.info(chalk.gray('Token 权限需要: repo (读取仓库信息)\n'));

        const { inputToken } = await inquirer.prompt<{ inputToken: string }>([
            {
                type: 'password',
                name: 'inputToken',
                message: '请输入 GitHub Token:',
                mask: '*',
                validate: (input) => {
                    if (!input || input.trim() === '') {
                        return '必须提供 GitHub Token 才能搜索您的仓库';
                    }
                    return true;
                },
            },
        ]);

        token = inputToken.trim();

        const { saveToken } = await inquirer.prompt<{ saveToken: boolean }>([
            {
                type: 'confirm',
                name: 'saveToken',
                message: '是否保存此 Token 以供将来使用?',
                default: true,
            },
        ]);

        if (saveToken) {
            configManager.setGitHubToken(token);
            logger.info(chalk.green('✓ Token 已保存到 ~/.zhengke-cli/config.json\n'));
        }
    }

    const client = new GitHubClient(token);
    const searcher = new TemplateSearcher(client);

    // 验证 Token
    const isValid = await client.validateToken();
    if (!isValid) {
        logger.error(chalk.red('✗ GitHub Token 无效，请检查后重试'));
        throw new ValidationError('GitHub Token', 'Token 验证失败');
    }

    const username = await client.getAuthenticatedUser();
    logger.info(chalk.green(`✓ 已登录 GitHub: ${username}\n`));

    // 输入搜索条件
    const { keyword, language } = await inquirer.prompt<{
        keyword: string;
        language: string;
    }>([
        {
            type: 'input',
            name: 'keyword',
            message: '搜索关键字 (可选，按 Enter 跳过):',
            default: '',
        },
        {
            type: 'list',
            name: 'language',
            message: '选择编程语言 (可选):',
            choices: [
                { name: '全部', value: '' },
                { name: 'JavaScript', value: 'JavaScript' },
                { name: 'TypeScript', value: 'TypeScript' },
                { name: 'Java', value: 'Java' },
                { name: 'Python', value: 'Python' },
                { name: 'Go', value: 'Go' },
                { name: 'Rust', value: 'Rust' },
                { name: 'C++', value: 'C++' },
                { name: 'C#', value: 'C#' },
                { name: 'PHP', value: 'PHP' },
                { name: 'Ruby', value: 'Ruby' },
                { name: 'Vue', value: 'Vue' },
                { name: 'HTML', value: 'HTML' },
            ],
        },
    ]);

    // 搜索模板
    logger.info(chalk.cyan('\n🔍 正在搜索您的 GitHub 仓库...\n'));
    const templates = await searcher.searchTemplates({
        keyword: keyword || undefined,
        language: language || undefined,
        userOnly: true,
        templateOnly: true, // 只搜索 GitHub Template Repository
        maxResults: 30,
    });

    if (templates.length === 0) {
        logger.error(chalk.red('✗ 未找到匹配的模板'));
        logger.info(chalk.yellow('\n提示: 您可以在 GitHub 上创建模板仓库，然后重试'));
        throw new ValidationError('模板搜索', '没有找到符合条件的模板');
    }

    logger.info(chalk.green(`✓ 找到 ${templates.length} 个仓库\n`));

    // 选择模板
    const { selectedTemplate } = await inquirer.prompt<{
        selectedTemplate: GitHubTemplate;
    }>([
        {
            type: 'list',
            name: 'selectedTemplate',
            message: '选择一个模板:',
            choices: templates.map((t) => ({
                name: `${chalk.bold(t.name)} ${t.language ? chalk.blue(`[${t.language}]`) : ''} ${t.isTemplate ? chalk.yellow('⭐') : ''
                    }\n  ${chalk.gray(t.description || '无描述')} ${chalk.gray(`(⭐ ${t.stars})`)}`,
                value: t,
                short: t.name,
            })),
            pageSize: 10,
        },
    ]);

    logger.info(chalk.cyan(`\n📥 正在下载模板: ${selectedTemplate.fullName}...\n`));

    // 下载模板
    const downloader = new TemplateDownloader();
    await downloader.downloadFromTemplate(selectedTemplate, {
        targetDir: projectPath,
        force: false,
        cache: true,
        verbose: false,
    });

    logger.info(chalk.green('✓ 模板下载完成'));

    // 尝试自动安装 Node.js 项目依赖
    if (existsSync(path.join(projectPath, 'package.json'))) {
        try {
            await installDependencies(projectPath);
        } catch {
            logger.warn(chalk.yellow(`⚠️  依赖安装失败，请手动运行 npm install`));
        }
    }
}
