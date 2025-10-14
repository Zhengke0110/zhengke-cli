import * as winston from 'winston';
import chalk from 'chalk';

export interface LoggerOptions {
  service?: string;
  level?: string;
  logFilePath?: string;
}

/**
 * 根据日志级别返回带颜色的级别标签
 */
function getColoredLevel(level: string): string {
  switch (level) {
    case 'error':
      return chalk.red.bold('[error]');
    case 'warn':
      return chalk.yellow.bold('[warn]');
    case 'info':
      return chalk.cyan.bold('[info]');
    case 'debug':
      return chalk.gray.bold('[debug]');
    case 'verbose':
      return chalk.magenta.bold('[verbose]');
    default:
      return `[${level}]`;
  }
}

/**
 * 根据日志级别给消息添加颜色和图标
 */
function getColoredMessage(level: string, message: string): string {
  // 检测是否已经包含图标，避免重复添加
  const hasIcon = /^[✓✗⚠ℹ]/.test(message.trim());
  
  switch (level) {
    case 'error':
      return hasIcon ? chalk.red(message) : chalk.red(`✗ ${message}`);
    case 'warn':
      return hasIcon ? chalk.yellow(message) : chalk.yellow(`⚠ ${message}`);
    case 'info':
      // info 级别不自动添加图标，保持简洁
      return message;
    case 'debug':
      return chalk.gray(message);
    case 'verbose':
      return chalk.magenta(message);
    default:
      return message;
  }
}

/**
 * 创建 Winston logger 实例
 * @param options 日志配置选项
 * @returns Winston logger 实例
 */
export function createLogger(options: LoggerOptions = {}) {
  const {
    service = 'app',
    level = process.env['LOG_LEVEL'] || 'info',
    logFilePath,
  } = options;

  const transports: winston.transport[] = [
    // 控制台输出
    new winston.transports.Console(),
  ];

  // 如果提供了日志文件路径，添加文件传输
  if (logFilePath) {
    transports.push(
      new winston.transports.File({
        filename: logFilePath,
        format: winston.format.combine(
          winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
          }),
          winston.format.errors({ stack: true }),
          // 文件输出不使用颜色
          winston.format.printf((info: winston.Logform.TransformableInfo) => {
            const { level, message, timestamp, stack } = info;
            const msgStr = String(message);
            const timestampStr = String(timestamp);
            if (stack) {
              return `${timestampStr} [${level}]: ${msgStr}\n${String(stack)}`;
            }
            return `${timestampStr} [${level}]: ${msgStr}`;
          })
        ),
      })
    );
  }

  const logger = winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      winston.format.errors({ stack: true }),
      // 移除 winston 自带的 colorize，改用 chalk
      winston.format.printf((info: winston.Logform.TransformableInfo) => {
        const { level, message, timestamp, stack } = info;
        const coloredLevel = getColoredLevel(level);
        // 确保 message 是字符串类型
        const msgStr = String(message);
        const coloredMessage = getColoredMessage(level, msgStr);
        const timestampStr = chalk.gray(String(timestamp));
        
        // 如果有堆栈信息（错误），也用红色显示
        if (stack) {
          return `${timestampStr} ${coloredLevel}: ${coloredMessage}\n${chalk.red(String(stack))}`;
        }
        
        return `${timestampStr} ${coloredLevel}: ${coloredMessage}`;
      })
    ),
    defaultMeta: { service },
    transports,
  });

  return logger;
}

/**
 * 设置 logger 的日志级别
 * @param logger Winston logger 实例
 * @param level 日志级别 (error, warn, info, debug 等)
 */
export function setLoggerLevel(logger: winston.Logger, level: string) {
  logger.level = level;
}

/**
 * 创建带样式的成功消息（用于 info 级别）
 * 可以在 logger.info() 中使用，例如：logger.info(success('操作成功'))
 */
export function success(message: string): string {
  return chalk.green(`✓ ${message}`);
}

// 导出类型
export type Logger = winston.Logger;
