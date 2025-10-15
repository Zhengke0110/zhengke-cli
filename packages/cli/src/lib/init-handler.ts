import logger from './logger.js';
import path from 'path';
import chalk from 'chalk';
import {
    ValidationError,
    fetchAvailableTemplates,
    selectTemplate,
    downloadTemplate,
    installTemplate,
    installDependencies,
} from '@zhengke0110/utils';

/**
 * init 命令的选项接口
 */
export interface InitOptions {
    name?: string;
    template?: string;
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
        // 2. 获取可用的模板列表
        logger.debug('步骤 1: 获取可用模板');
        const templates = await fetchAvailableTemplates();

        // 3. 让用户选择模板（如果未指定）
        let selectedTemplate;
        if (options.template) {
            selectedTemplate = templates.find(t => t.name === options.template);
            if (!selectedTemplate) {
                throw new ValidationError(
                    '模板',
                    `模板 "${options.template}" 不存在。可用模板: ${templates.map(t => t.name).join(', ')}`
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

        // 7. 完成提示
        logger.info(chalk.green('\n✨ 项目初始化成功！\n'));
        logger.info(chalk.cyan('接下来的步骤:'));
        logger.info(chalk.white(`  cd ${projectName}`));
        logger.info(chalk.white('  npm run dev'));
        logger.info('');
    } catch (error) {
        logger.error(chalk.red('项目初始化失败'));
        throw error;
    }

    logger.debug('init 命令执行完成');
}
