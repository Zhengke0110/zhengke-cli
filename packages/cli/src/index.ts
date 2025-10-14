#!/usr/bin/env node

import { createProgram, registerCommands, runProgram } from '@zhengke0110/command';
import { ensureNodeVersion, setLoggerLevel } from '@zhengke0110/utils';
import { commands } from './lib/commands.js';
import { logger } from './lib/logger.js';
import { CLI_CONFIG } from './lib/config.js';

// ============================================
// 1. 处理 --debug 选项（需要在创建 program 之前）
// ============================================
const args = process.argv;
const isDebugMode = args.includes('--debug');

// 根据 debug 模式设置日志级别
if (isDebugMode) {
  setLoggerLevel(logger, 'debug');
  logger.debug('Debug 模式已启用');
  logger.debug(`Node.js 版本: ${process.version}`);
} else {
  setLoggerLevel(logger, 'info');
}

// ============================================
// 2. 创建并配置命令程序（包含 preAction hook）
// ============================================
const program = createProgram({
  name: CLI_CONFIG.NAME,
  description: CLI_CONFIG.DESCRIPTION,
  version: CLI_CONFIG.VERSION,
  // 在执行任何命令之前检查 Node.js 版本
  preAction: () => {
    ensureNodeVersion(CLI_CONFIG.MIN_NODE_VERSION, logger);
  },
});

// 注册所有命令
registerCommands(program, commands);

// ============================================
// 3. 运行程序
// ============================================
runProgram(program);
