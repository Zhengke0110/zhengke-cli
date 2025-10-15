import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../../package.json'), 'utf-8')
);

/**
 * CLI 配置常量
 */
export const CLI_CONFIG = {
  /**
   * 最低 Node.js 版本要求
   */
  MIN_NODE_VERSION: '16.0.0',

  /**
   * CLI 名称
   */
  NAME: 'zk-cli',

  /**
   * CLI 描述
   */
  DESCRIPTION: 'ZK CLI - 一个基于 Nx 和 TypeScript 的命令行工具',

  /**
   * CLI 版本
   */
  VERSION: packageJson.version,
} as const;
