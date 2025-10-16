import chalk from 'chalk';
import type { Logger } from './logger.js';
import { CLIError, ErrorCode } from './errors.js';

/**
 * 错误处理配置
 */
export interface ErrorHandlerOptions {
  logger?: Logger;
  debug?: boolean;
  exitOnError?: boolean;
}

/**
 * 格式化错误消息供用户查看
 */
export function formatErrorForUser(error: Error | CLIError, debug = false): string {
  const lines: string[] = [];

  // 错误标题
  lines.push('');
  lines.push(chalk.red.bold('❌ 发生错误'));
  lines.push('');

  // 如果是 CLIError，显示详细信息
  if (error instanceof CLIError) {
    // 错误代码
    lines.push(chalk.gray(`错误代码: ${error.code}`));
    lines.push('');

    // 用户友好的错误消息
    lines.push(chalk.red(error.userMessage));

    // 建议
    if (error.suggestions && error.suggestions.length > 0) {
      lines.push('');
      lines.push(chalk.yellow('💡 建议:'));
      error.suggestions.forEach((suggestion) => {
        lines.push(chalk.yellow(`  • ${suggestion}`));
      });
    }

    // Debug 模式下显示详细信息
    if (debug) {
      lines.push('');
      lines.push(chalk.gray('详细信息:'));
      lines.push(chalk.gray(`  消息: ${error.message}`));

      if (error.details) {
        lines.push(chalk.gray(`  详情: ${JSON.stringify(error.details, null, 2)}`));
      }

      if (error.stack) {
        lines.push('');
        lines.push(chalk.gray('堆栈跟踪:'));
        lines.push(chalk.gray(error.stack));
      }
    }
  } else {
    // 普通错误
    lines.push(chalk.red(error.message));

    if (debug && error.stack) {
      lines.push('');
      lines.push(chalk.gray('堆栈跟踪:'));
      lines.push(chalk.gray(error.stack));
    }
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * 处理错误并输出
 */
export function handleError(
  error: Error | CLIError,
  loggerOrOptions?: Logger | ErrorHandlerOptions
): void {
  const options = loggerOrOptions && 'info' in loggerOrOptions
    ? { logger: loggerOrOptions }
    : (loggerOrOptions as ErrorHandlerOptions | undefined) || {};

  const { logger, debug = false, exitOnError = true } = options;

  // 格式化错误消息
  const errorMessage = formatErrorForUser(error, debug);

  // 如果有 logger，使用 logger 输出
  if (logger) {
    logger.error(errorMessage);

    // 在 debug 模式下记录完整错误
    if (debug && error.stack) {
      logger.debug('完整错误堆栈:');
      logger.debug(error.stack);
    }
  } else {
    // 否则直接输出到 console
    console.error(errorMessage);
  }

  // 如果需要退出进程
  if (exitOnError) {
    const exitCode = error instanceof CLIError && error.code ? 1 : 1;
    process.exit(exitCode);
  }
}

/**
 * 设置全局错误处理器
 */
export function setupGlobalErrorHandlers(loggerOrOptions?: Logger | ErrorHandlerOptions): void {
  const options = loggerOrOptions && 'info' in loggerOrOptions
    ? { logger: loggerOrOptions }
    : (loggerOrOptions as ErrorHandlerOptions | undefined) || {};

  const { logger, debug = false } = options;

  // 捕获未处理的 Promise rejection
  process.on('unhandledRejection', (reason: unknown) => {
    const error = reason instanceof Error
      ? reason
      : new CLIError({
        code: ErrorCode.UNKNOWN_ERROR,
        message: String(reason),
        userMessage: '发生未知错误',
      });

    if (logger) {
      logger.error('未处理的 Promise rejection:');
    } else {
      console.error('未处理的 Promise rejection:');
    }

    handleError(error, { ...options, exitOnError: true });
  });

  // 捕获未捕获的异常
  process.on('uncaughtException', (error: Error) => {
    if (logger) {
      logger.error('未捕获的异常:');
    } else {
      console.error('未捕获的异常:');
    }

    handleError(error, { ...options, exitOnError: true });
  });

  // 捕获进程警告
  process.on('warning', (warning) => {
    if (debug && logger) {
      logger.warn(`进程警告: ${warning.name} - ${warning.message}`);
      if (warning.stack) {
        logger.debug(warning.stack);
      }
    }
  });

  // 优雅退出处理
  const gracefulShutdown = (signal: string) => {
    if (logger) {
      logger.info(`收到 ${signal} 信号，正在优雅退出...`);
    }
    process.exit(0);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

/**
 * 创建安全的异步函数包装器
 * 自动捕获异步函数中的错误
 */
export function wrapAsyncHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  loggerOrOptions?: Logger | ErrorHandlerOptions
): T {
  return (async (...args: Parameters<T>): Promise<any> => {
    try {
      return await handler(...args);
    } catch (error) {
      const options = loggerOrOptions && 'info' in loggerOrOptions
        ? { logger: loggerOrOptions }
        : (loggerOrOptions as ErrorHandlerOptions | undefined);

      handleError(
        error instanceof Error ? error : new Error(String(error)),
        options
      );
    }
  }) as T;
}

/**
 * 创建安全的同步函数包装器
 */
export function wrapSyncHandler<T extends (...args: any[]) => any>(
  handler: T,
  loggerOrOptions?: Logger | ErrorHandlerOptions
): T {
  return ((...args: Parameters<T>): any => {
    try {
      return handler(...args);
    } catch (error) {
      const options = loggerOrOptions && 'info' in loggerOrOptions
        ? { logger: loggerOrOptions }
        : (loggerOrOptions as ErrorHandlerOptions | undefined);

      handleError(
        error instanceof Error ? error : new Error(String(error)),
        options
      );
    }
  }) as T;
}
