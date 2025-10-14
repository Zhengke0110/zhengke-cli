import logger from './logger';
import type { CommandDefinition } from '@zhengke0110/command';

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
    logger.info('执行 init 命令');
    logger.info(`项目名称: ${options.name || '未指定'}`);
    logger.info(`项目模板: ${options.template}`);
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
    logger.info('执行 create 命令');
    logger.info(`模块名称: ${name}`);
    logger.info(`模块类型: ${options.type}`);
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
    logger.info('执行 build 命令');
    logger.info(`环境: ${options.env}`);
    logger.info(`监听模式: ${options.watch ? '是' : '否'}`);
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
