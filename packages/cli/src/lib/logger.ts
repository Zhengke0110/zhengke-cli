import { createLogger } from '@zhengke0110/utils';

// 创建 CLI 的 logger 实例
export const logger = createLogger({
  service: 'zk-cli',
  level: process.env['LOG_LEVEL'] || 'info',
});

// 导出便捷方法
export default logger;
