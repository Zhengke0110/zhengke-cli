import logger from './logger.js';
import type { CommandDefinition } from '@zhengke0110/command';
import { wrapAsyncHandler } from '@zhengke0110/utils';
import { handleInit, type InitOptions } from './init-handler.js';
import {
  handleGitInit,
  handleGitCommit,
  handleGitPublish,
  handleGitSwitch,
  type GitInitOptions,
  type GitCommitOptions,
  type GitPublishOptions,
  type GitSwitchOptions,
} from './git-handler.js';
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

  // Git 命令
  GIT_INIT: '初始化 Git 仓库',
  GIT_COMMIT: '提交代码到开发分支',
  GIT_PUBLISH: '发布到主分支',
  GIT_SWITCH: '切换到开发分支',

  // Git 选项
  OPTION_PLATFORM: 'Git 平台（github/gitee）',
  OPTION_TOKEN: 'Git Token',
  OPTION_REPO: '仓库名称',
  OPTION_OWNER: '仓库所有者',
  OPTION_TYPE: '仓库类型（user/org）',
  OPTION_PRIVATE: '私有仓库',
  OPTION_MESSAGE: '提交信息',
  OPTION_VERSION_TYPE: '版本类型（major/minor/patch）',
  OPTION_VERSION: '指定版本号',
  OPTION_BRANCH: '分支名称（默认: develop）',
} as const;

/**
 * 命令选项标志
 */
const CommandFlags = {
  NAME: '-n, --name <name>',
  TEMPLATE: '-t, --template <template>',
  GITHUB: '-g, --github',

  // Git 选项
  PLATFORM: '-p, --platform <platform>',
  TOKEN: '-t, --token <token>',
  REPO: '-r, --repo <repo>',
  OWNER: '-o, --owner <owner>',
  TYPE: '--type <type>',
  PRIVATE: '--private',
  MESSAGE: '-m, --message <message>',
  VERSION_TYPE: '--type <type>',
  VERSION: '-v, --version <version>',
  BRANCH: '-b, --branch <branch>',
} as const;

/**
 * init 命令定义
 * 支持三种用法：
 * 1. zhengke-cli init [项目名]            - 位置参数
 * 2. zhengke-cli init --name 项目名       - 选项参数（向后兼容）
 * 3. zhengke-cli init                     - 交互式输入
 */
export const initCommand: CommandDefinition = {
  name: 'init [name]',
  description: CommandDescriptions.INIT,
  options: [
    { flags: CommandFlags.NAME, description: CommandDescriptions.OPTION_NAME },
    { flags: CommandFlags.TEMPLATE, description: CommandDescriptions.OPTION_TEMPLATE },
    { flags: CommandFlags.GITHUB, description: CommandDescriptions.OPTION_GITHUB },
  ],
  action: wrapAsyncHandler(async (name?: string, options?: InitOptions) => {
    // 如果通过位置参数提供了 name，使用它
    // 否则使用 options.name（如果通过 --name 提供）
    const finalOptions: InitOptions = {
      ...options,
      name: name || options?.name,
    };
    await handleInit(finalOptions);
  }, { logger, debug: isDebugMode() }),
};

/**
 * git:init 命令定义
 */
export const gitInitCommand: CommandDefinition = {
  name: 'git:init',
  description: CommandDescriptions.GIT_INIT,
  options: [
    { flags: '-p, --platform <platform>', description: CommandDescriptions.OPTION_PLATFORM },
    { flags: '-t, --token <token>', description: CommandDescriptions.OPTION_TOKEN },
    { flags: '-r, --repo <repo>', description: CommandDescriptions.OPTION_REPO },
    { flags: '-o, --owner <owner>', description: CommandDescriptions.OPTION_OWNER },
    { flags: '--type <type>', description: CommandDescriptions.OPTION_TYPE },
    { flags: '--private', description: CommandDescriptions.OPTION_PRIVATE },
  ],
  action: wrapAsyncHandler(async (options: GitInitOptions) => {
    await handleGitInit(options);
  }, { logger, debug: isDebugMode() }),
};

/**
 * git:commit 命令定义
 */
export const gitCommitCommand: CommandDefinition = {
  name: 'git:commit',
  description: CommandDescriptions.GIT_COMMIT,
  options: [
    { flags: '-m, --message <message>', description: CommandDescriptions.OPTION_MESSAGE },
  ],
  action: wrapAsyncHandler(async (options: GitCommitOptions) => {
    await handleGitCommit(options);
  }, { logger, debug: isDebugMode() }),
};

/**
 * git:publish 命令定义
 */
export const gitPublishCommand: CommandDefinition = {
  name: 'git:publish',
  description: CommandDescriptions.GIT_PUBLISH,
  options: [
    { flags: '--type <type>', description: CommandDescriptions.OPTION_VERSION_TYPE },
    { flags: '-v, --version <version>', description: CommandDescriptions.OPTION_VERSION },
  ],
  action: wrapAsyncHandler(async (options: GitPublishOptions) => {
    await handleGitPublish(options);
  }, { logger, debug: isDebugMode() }),
};

/**
 * git:switch 命令定义
 */
export const gitSwitchCommand: CommandDefinition = {
  name: 'git:switch',
  description: CommandDescriptions.GIT_SWITCH,
  options: [
    { flags: '-b, --branch <branch>', description: CommandDescriptions.OPTION_BRANCH },
  ],
  action: wrapAsyncHandler(async (options: GitSwitchOptions) => {
    await handleGitSwitch(options);
  }, { logger, debug: isDebugMode() }),
};

/**
 * 所有命令定义
 */
export const commands: CommandDefinition[] = [
  initCommand,
  gitInitCommand,
  gitCommitCommand,
  gitPublishCommand,
  gitSwitchCommand,
];
