import * as winston from 'winston';

export interface LoggerOptions {
  service?: string;
  level?: string;
  logFilePath?: string;
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
          winston.format.uncolorize(),
          winston.format.printf((info: winston.Logform.TransformableInfo) => {
            const { level, message, timestamp } = info;
            return `${timestamp} [${level}]: ${message}`;
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
      winston.format.colorize(),
      winston.format.printf((info: winston.Logform.TransformableInfo) => {
        const { level, message, timestamp } = info;
        return `${timestamp} [${level}]: ${message}`;
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

// 导出类型
export type Logger = winston.Logger;
