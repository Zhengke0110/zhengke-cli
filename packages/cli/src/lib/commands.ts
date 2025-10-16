import logger from './logger.js';
import type { CommandDefinition } from '@zhengke0110/command';
import { wrapAsyncHandler } from '@zhengke0110/utils';
import { handleInit, type InitOptions } from './init-handler.js';

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
    { flags: '-t, --template <template>', description: '项目模板（可选，不指定则交互式选择）' },
    { flags: '-g, --github', description: '从个人 GitHub 账号搜索模板' },
  ],
  action: wrapAsyncHandler(async (options: InitOptions) => {
    await handleInit(options);
  }, { logger, debug: isDebugMode() }),
};


/**
 * 所有命令定义
 */
export const commands: CommandDefinition[] = [
  initCommand
];
