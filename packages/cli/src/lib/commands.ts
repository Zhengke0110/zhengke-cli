import logger from './logger';
import type { CommandDefinition } from '@zhengke0110/command';
import { success } from '@zhengke0110/utils';

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
  action: (options) => {
    logger.debug('开始执行 init 命令');
    
    if (!options.name) {
      logger.error('项目名称不能为空');
      logger.warn('请使用 --name 参数指定项目名称');
      return;
    }
    
    logger.info('执行 init 命令');
    logger.info(`项目名称: ${options.name}`);
    logger.info(`项目模板: ${options.template}`);
    logger.info(success('项目初始化成功！'));
    logger.debug('init 命令执行完成');
  },
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
  action: (name, options) => {
    logger.debug(`开始执行 create 命令, 参数: name=${name}, type=${options.type}`);
    logger.info('执行 create 命令');
    logger.info(`模块名称: ${name}`);
    logger.info(`模块类型: ${options.type}`);
    logger.info(success(`模块 ${name} 创建成功！`));
    logger.debug('create 命令执行完成');
  },
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
  action: (options) => {
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
    
    logger.info(success('项目构建完成！'));
    logger.debug('build 命令执行完成');
  },
};

/**
 * 所有命令定义
 */
export const commands: CommandDefinition[] = [
  initCommand,
  createCommand,
  buildCommand,
];
