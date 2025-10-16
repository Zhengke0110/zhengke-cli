import logger from './logger.js';
import type { CommandDefinition } from '@zhengke0110/command';
import { wrapAsyncHandler } from '@zhengke0110/utils';
import { handleInit, type InitOptions } from './init-handler.js';
import { CliArguments } from './constants.js';

/**
 * 检测是否为 debug 模式
 */
const isDebugMode = (): boolean => process.argv.includes(CliArguments.DEBUG);

/**
 * 命令描述常量
 */
const CommandDescriptions = {
    INIT: '初始化一个新项目',
    OPTION_NAME: '项目名称',
    OPTION_TEMPLATE: '项目模板（可选，不指定则交互式选择）',
    OPTION_GITHUB: '从个人 GitHub 账号搜索模板',
} as const;

/**
 * 命令选项标志
 */
const CommandFlags = {
    NAME: '-n, --name <name>',
    TEMPLATE: '-t, --template <template>',
    GITHUB: '-g, --github',
} as const;

/**
 * init 命令定义
 */
export const initCommand: CommandDefinition = {
  name: 'init',
  description: CommandDescriptions.INIT,
  options: [
    { flags: CommandFlags.NAME, description: CommandDescriptions.OPTION_NAME },
    { flags: CommandFlags.TEMPLATE, description: CommandDescriptions.OPTION_TEMPLATE },
    { flags: CommandFlags.GITHUB, description: CommandDescriptions.OPTION_GITHUB },
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
