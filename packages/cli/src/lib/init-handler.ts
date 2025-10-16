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
import {
    TemplateSource,
    ProgrammingLanguage,
    ProgrammingLanguageLabels,
    Messages,
    Prompts,
    ValidationErrorType,
    ValidationErrors,
    GitHub,
} from './constants.js';

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
    logger.info(chalk.green(`\n${Messages.SUCCESS.PROJECT_INITIALIZED}\n`));
    logger.info(chalk.cyan(Messages.INFO.NEXT_STEPS));
    logger.info(chalk.white(Messages.INFO.CD_PROJECT(projectName)));
    logger.info(chalk.white(Messages.INFO.READ_README));
    logger.info('');
}

/**
 * 执行项目初始化
 */
export async function handleInit(options: InitOptions): Promise<void> {
    logger.debug(Messages.DEBUG.INIT_START);

    // 1. 验证项目名称
    if (!options.name) {
        throw new ValidationError(
            ValidationErrorType.PROJECT_NAME,
            ValidationErrors.PROJECT_NAME_REQUIRED
        );
    }

    const projectName = options.name;
    const projectPath = path.resolve(process.cwd(), projectName);

    logger.info(chalk.cyan(`\n${Messages.INFO.INITIALIZING}\n`));

    try {
        // 如果命令行指定了 --github 参数，直接使用 GitHub 模板
        if (options.github) {
            await handleGitHubTemplateSearch(projectPath);
        }
        // 如果指定了 --template 参数，使用内置模板
        else if (options.template) {
            await handleBuiltinTemplate(options, projectName, projectPath);
        }
        // 否则交互式选择模板来源
        else {
            const { source } = await inquirer.prompt<{ source: TemplateSource }>([
                {
                    type: 'list',
                    name: 'source',
                    message: Prompts.SELECT_TEMPLATE_SOURCE,
                    choices: [
                        {
                            name: `${chalk.cyan('📦 npm')}`,
                            value: TemplateSource.NPM,
                            short: 'npm',
                        },
                        {
                            name: `${chalk.cyan('🐙 GitHub')}`,
                            value: TemplateSource.GITHUB,
                            short: 'GitHub',
                        },
                    ],
                    default: TemplateSource.NPM,
                },
            ]);

            if (source === TemplateSource.GITHUB) {
                await handleGitHubTemplateSearch(projectPath);
            } else {
                await handleBuiltinTemplate(options, projectName, projectPath);
            }
        }

        // 显示后续步骤
        showNextSteps(projectName);
    } catch (error) {
        logger.error(chalk.red(Messages.ERROR.PROJECT_INIT_FAILED));
        throw error;
    }

    logger.debug(Messages.DEBUG.INIT_END);
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
    logger.debug(Messages.DEBUG.FETCH_TEMPLATES);
    const templates = await fetchAvailableTemplates();

    // 3. 让用户选择模板（如果未指定）
    let selectedTemplate;
    if (options.template) {
        selectedTemplate = templates.find((t) => t.name === options.template);
        if (!selectedTemplate) {
            throw new ValidationError(
                ValidationErrorType.TEMPLATE,
                Messages.ERROR.TEMPLATE_NOT_EXIST(
                    options.template,
                    templates.map((t) => t.name).join(', ')
                )
            );
        }
        logger.info(chalk.blue(Messages.SUCCESS.TEMPLATE_SELECTED(selectedTemplate.displayName)));
    } else {
        logger.debug(Messages.DEBUG.SELECT_TEMPLATE);
        selectedTemplate = await selectTemplate(templates);
    }

    // 4. 下载模板到缓存目录
    logger.debug(Messages.DEBUG.DOWNLOAD_TEMPLATE);
    const templateCachePath = await downloadTemplate(selectedTemplate);

    // 5. 安装模板到项目目录
    logger.debug(Messages.DEBUG.INSTALL_TEMPLATE);
    await installTemplate(templateCachePath, projectPath, projectName);

    // 6. 安装项目依赖
    logger.debug(Messages.DEBUG.INSTALL_DEPS);
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
        logger.warn(chalk.yellow(`\n${Messages.WARNING.NO_GITHUB_TOKEN}`));
        logger.info(chalk.cyan(Messages.INFO.GITHUB_TOKEN_GUIDE));
        logger.info(chalk.gray(`${Messages.INFO.GITHUB_TOKEN_PERMISSION}\n`));

        const { inputToken } = await inquirer.prompt<{ inputToken: string }>([
            {
                type: 'password',
                name: 'inputToken',
                message: Prompts.ENTER_GITHUB_TOKEN,
                mask: '*',
                validate: (input) => {
                    if (!input || input.trim() === '') {
                        return ValidationErrors.GITHUB_TOKEN_REQUIRED;
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
                message: Prompts.SAVE_TOKEN,
                default: true,
            },
        ]);

        if (saveToken) {
            configManager.setGitHubToken(token);
            logger.info(chalk.green(`${Messages.SUCCESS.TOKEN_SAVED}\n`));
        }
    }

    const client = new GitHubClient(token);
    const searcher = new TemplateSearcher(client);

    // 验证 Token
    const isValid = await client.validateToken();
    if (!isValid) {
        logger.error(chalk.red(Messages.ERROR.INVALID_GITHUB_TOKEN));
        throw new ValidationError(
            ValidationErrorType.GITHUB_TOKEN,
            ValidationErrors.GITHUB_TOKEN_INVALID
        );
    }

    const username = await client.getAuthenticatedUser();
    logger.info(chalk.green(`${Messages.SUCCESS.GITHUB_LOGGED_IN(username)}\n`));

    // 输入搜索条件
    const { keyword, language } = await inquirer.prompt<{
        keyword: string;
        language: ProgrammingLanguage;
    }>([
        {
            type: 'input',
            name: 'keyword',
            message: Prompts.SEARCH_KEYWORD,
            default: '',
        },
        {
            type: 'list',
            name: 'language',
            message: Prompts.SELECT_LANGUAGE,
            choices: Object.values(ProgrammingLanguage).map((lang) => ({
                name: ProgrammingLanguageLabels[lang],
                value: lang,
            })),
        },
    ]);

    // 搜索模板
    logger.info(chalk.cyan(`\n${Messages.INFO.SEARCHING_GITHUB}\n`));
    const templates = await searcher.searchTemplates({
        keyword: keyword || undefined,
        language: language || undefined,
        userOnly: true,
        templateOnly: true, // 只搜索 GitHub Template Repository
        maxResults: GitHub.MAX_SEARCH_RESULTS,
    });

    if (templates.length === 0) {
        logger.error(chalk.red(Messages.ERROR.NO_TEMPLATES_FOUND));
        logger.info(chalk.yellow(`\n${Messages.INFO.CREATE_TEMPLATE_TIP}`));
        throw new ValidationError(
            ValidationErrorType.TEMPLATE_SEARCH,
            ValidationErrors.NO_TEMPLATES_FOUND
        );
    }

    logger.info(chalk.green(Messages.SUCCESS.FOUND_REPOS(templates.length) + '\n'));

    // 选择模板
    const { selectedTemplate } = await inquirer.prompt<{
        selectedTemplate: GitHubTemplate;
    }>([
        {
            type: 'list',
            name: 'selectedTemplate',
            message: Prompts.SELECT_TEMPLATE,
            choices: templates.map((t) => ({
                name: `${chalk.bold(t.name)} ${t.language ? chalk.blue(`[${t.language}]`) : ''} ${t.isTemplate ? chalk.yellow('⭐') : ''
                    }\n  ${chalk.gray(t.description || '无描述')} ${chalk.gray(`(⭐ ${t.stars})`)}`,
                value: t,
                short: t.name,
            })),
            pageSize: GitHub.LIST_PAGE_SIZE,
        },
    ]);

    logger.info(chalk.cyan(`\n${Messages.INFO.DOWNLOADING_TEMPLATE(selectedTemplate.fullName)}\n`));

    // 下载模板
    const downloader = new TemplateDownloader();
    await downloader.downloadFromTemplate(selectedTemplate, {
        targetDir: projectPath,
        force: false,
        cache: true,
        verbose: false,
    });

    logger.info(chalk.green(Messages.SUCCESS.TEMPLATE_DOWNLOADED));

    // 尝试自动安装 Node.js 项目依赖
    if (existsSync(path.join(projectPath, 'package.json'))) {
        try {
            await installDependencies(projectPath);
        } catch {
            logger.warn(chalk.yellow(Messages.WARNING.DEPS_INSTALL_FAILED));
        }
    }
}
