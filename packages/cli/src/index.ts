#!/usr/bin/env node

import { createProgram, registerCommands, runProgram } from '@zhengke0110/command';
import { ensureNodeVersion, setLoggerLevel, setupGlobalErrorHandlers, handleError } from '@zhengke0110/utils';
import { commands } from './lib/commands.js';
import { logger } from './lib/logger.js';
import { CLI_CONFIG } from './lib/config.js';
import { CliArguments, LogLevel, CliMessages } from './lib/constants.js';

// ============================================
// 1. 处理 --debug 选项（需要在创建 program 之前）
// ============================================
const args = process.argv;
const isDebugMode = args.includes(CliArguments.DEBUG);

// ============================================
// 2. 设置全局错误处理器（需要知道 debug 模式）
// ============================================
setupGlobalErrorHandlers({ logger, debug: isDebugMode });

// 根据 debug 模式设置日志级别
if (isDebugMode) {
  setLoggerLevel(logger, LogLevel.DEBUG);
  logger.debug(CliMessages.DEBUG_ENABLED);
  logger.debug(CliMessages.NODE_VERSION(process.version));
} else {
  setLoggerLevel(logger, LogLevel.INFO);
}

// ============================================
// 3. 创建并配置命令程序（包含 preAction hook）
// ============================================
try {
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
  // 4. 运行程序
  // ============================================
  runProgram(program);
} catch (error) {
  handleError(error as Error, logger);
}
