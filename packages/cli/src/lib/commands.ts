import logger from './logger.js';
import type { CommandDefinition } from '@zhengke0110/command';
import { success, wrapAsyncHandler, ValidationError } from '@zhengke0110/utils';

/**
 * 检测是否为 debug 模式
 */
const isDebugMode = (): boolean => process.argv.includes('--debug');

/**
 * init 命令定义
 */
export const initCommand: CommandDefinition = {
  name: 'init',
  description: '初始化一个新项目',
  options: [
    { flags: '-n, --name <name>', description: '项目名称' },
    { flags: '-t, --template <template>', description: '项目模板', defaultValue: 'default' },
  ],
  action: wrapAsyncHandler(async (options: { name?: string; template?: string }) => {
    logger.debug('开始执行 init 命令');

    // 使用自定义错误类进行验证
    if (!options.name) {
      throw new ValidationError(
        'name',
        '项目名称不能为空，请使用 --name 参数指定'
      );
    }

    // 模拟异步操作
    logger.info('执行 init 命令');
    logger.info(`项目名称: ${options.name}`);
    logger.info(`项目模板: ${options.template}`);

    // 模拟文件系统操作
    const projectPath = `./${options.name}`;
    logger.debug(`准备创建项目目录: ${projectPath}`);

    // 这里可以添加实际的文件系统操作
    // 如果操作失败,抛出 FileSystemError
    // throw new FileSystemError(`无法创建目录: ${projectPath}`, { path: projectPath });

    logger.info(success('项目初始化成功！'));
    logger.debug('init 命令执行完成');
  }, { logger, debug: isDebugMode() }),
};

/**
 * create 命令定义
 */
export const createCommand: CommandDefinition = {
  name: 'create <name>',
  description: '创建一个新的模块',
  options: [
    { flags: '-t, --type <type>', description: '模块类型', defaultValue: 'component' },
  ],
  action: wrapAsyncHandler(async (name: string, options: { type?: string }) => {
    logger.debug(`开始执行 create 命令, 参数: name=${name}, type=${options.type}`);

    // 验证模块名称
    if (!name || name.trim() === '') {
      throw new ValidationError(
        'name',
        '模块名称不能为空'
      );
    }

    // 验证模块类型
    const validTypes = ['component', 'service', 'controller', 'module'];
    if (!validTypes.includes(options.type || '')) {
      throw new ValidationError(
        'type',
        `无效的模块类型: ${options.type}，有效值: ${validTypes.join(', ')}`
      );
    }

    logger.info('执行 create 命令');
    logger.info(`模块名称: ${name}`);
    logger.info(`模块类型: ${options.type}`);
    logger.info(success(`模块 ${name} 创建成功！`));
    logger.debug('create 命令执行完成');
  }, { logger, debug: isDebugMode() }),
};

/**
 * build 命令定义
 */
export const buildCommand: CommandDefinition = {
  name: 'build',
  description: '构建项目',
  options: [
    { flags: '-e, --env <env>', description: '环境', defaultValue: 'production' },
    { flags: '-w, --watch', description: '监听模式', defaultValue: false },
  ],
  action: wrapAsyncHandler(async (options: { env?: string; watch?: boolean }) => {
    logger.debug(`开始执行 build 命令, 参数: env=${options.env}, watch=${options.watch}`);

    logger.info('执行 build 命令');
    logger.info(`环境: ${options.env}`);
    logger.info(`监听模式: ${options.watch ? '是' : '否'}`);

    // 模拟构建过程
    logger.info('正在构建项目...');

    // 模拟警告
    if (options.env !== 'production') {
      logger.warn('当前不是生产环境，构建产物未压缩');
    }

    // 模拟可能的构建错误
    // throw new FileSystemError('构建输出目录不存在', { path: './dist' });

    logger.info(success('项目构建完成！'));
    logger.debug('build 命令执行完成');
  }, { logger, debug: isDebugMode() }),
};

/**
 * 所有命令定义
 */
export const commands: CommandDefinition[] = [
  initCommand,
  createCommand,
  buildCommand,
];
