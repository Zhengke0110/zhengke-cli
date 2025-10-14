import logger from './logger';

export function cli(): string {
  logger.info('CLI 启动成功！');
  logger.debug('这是调试信息');
  logger.warn('这是警告信息');
  logger.error('这是错误信息');
  
  return 'cli';
}
