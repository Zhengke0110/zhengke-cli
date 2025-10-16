import { createLogger } from '@zhengke0110/utils';
import { LogLevel, EnvironmentVariables } from './constants.js';

/**
 * Logger 配置常量
 */
const LoggerConfig = {
    SERVICE_NAME: 'zk-cli',
    DEFAULT_LEVEL: LogLevel.INFO,
} as const;

// 创建 CLI 的 logger 实例
export const logger = createLogger({
  service: LoggerConfig.SERVICE_NAME,
  level: process.env[EnvironmentVariables.LOG_LEVEL] || LoggerConfig.DEFAULT_LEVEL,
});

// 导出便捷方法
export default logger;
