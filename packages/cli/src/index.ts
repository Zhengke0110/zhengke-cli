#!/usr/bin/env node

import { createProgram, registerCommands, runProgram } from '@zhengke0110/command';
import { commands } from './lib/commands';
import { logger } from './lib/logger';
import { setLoggerLevel } from '@zhengke0110/utils';

// 创建命令程序
const program = createProgram({
  name: 'zk-cli',
  description: 'ZK CLI - 一个基于 Nx 和 TypeScript 的命令行工具',
  version: '0.0.1',
});

// 注册所有命令
registerCommands(program, commands);

// 在解析命令之前，先处理 --debug 选项
const args = process.argv;
const isDebugMode = args.includes('--debug');

// 根据 debug 模式设置日志级别
if (isDebugMode) {
  setLoggerLevel(logger, 'debug');
  logger.debug('Debug 模式已启用');
} else {
  setLoggerLevel(logger, 'info');
}

// 运行程序
runProgram(program);
