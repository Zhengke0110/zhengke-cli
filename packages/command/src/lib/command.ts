import { Command } from 'commander';

/**
 * 创建命令程序实例的配置
 */
export interface CreateProgramConfig {
  name?: string;
  description?: string;
  version?: string;
  /**
   * 在执行任何命令之前运行的钩子函数
   */
  preAction?: () => void | Promise<void>;
}

/**
 * 创建命令程序实例
 */
export function createProgram(config?: CreateProgramConfig) {
  const program = new Command();

  program
    .name(config?.name || 'zk-cli')
    .description(config?.description || 'ZK CLI - 一个基于 Nx 和 TypeScript 的命令行工具')
    .version(config?.version || '0.0.1')
    // 添加全局 --debug 选项
    .option('--debug', '启用调试模式，显示详细日志', false);

  // 如果提供了 preAction hook，则添加到 program 上
  if (config?.preAction) {
    program.hook('preAction', config.preAction);
  }

  return program;
}

/**
 * 命令选项类型
 */
export interface CommandOption {
  flags: string;
  description: string;
  defaultValue?: string | boolean;
}

/**
 * 命令定义类型
 */
export interface CommandDefinition {
  name: string;
  description: string;
  options?: CommandOption[];
  action: (...args: any[]) => void | Promise<void>;
}

/**
 * 注册单个命令
 * @param program Commander 实例
 * @param definition 命令定义
 */
export function registerCommand(program: Command, definition: CommandDefinition) {
  const cmd = program
    .command(definition.name)
    .description(definition.description);

  // 添加选项
  if (definition.options) {
    definition.options.forEach(opt => {
      if (opt.defaultValue !== undefined) {
        cmd.option(opt.flags, opt.description, opt.defaultValue);
      } else {
        cmd.option(opt.flags, opt.description);
      }
    });
  }

  // 设置 action
  cmd.action(definition.action);

  return cmd;
}

/**
 * 批量注册命令
 * @param program Commander 实例
 * @param definitions 命令定义数组
 */
export function registerCommands(program: Command, definitions: CommandDefinition[]) {
  definitions.forEach(def => registerCommand(program, def));
  return program;
}

/**
 * 运行命令程序
 * @param program Commander 实例
 * @param argv 命令行参数
 */
export function runProgram(program: Command, argv = process.argv) {
  program.parse(argv);

  // 如果没有提供任何命令，显示帮助信息
  if (!argv.slice(2).length) {
    program.outputHelp();
  }
}

export default createProgram;
