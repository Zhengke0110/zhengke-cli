import * as winston from 'winston';

// 创建 Winston logger 实例
export const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.printf((info: winston.Logform.TransformableInfo) => {
      const { level, message, timestamp, } = info;
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  defaultMeta: { service: 'zk-cli' },
  transports: [
    // 控制台输出
    new winston.transports.Console(),
  ],
});

// 如果不是生产环境，输出更详细的日志
if (process.env['NODE_ENV'] !== 'production') {
  logger.level = 'debug';
}

// 导出便捷方法
export default logger;
