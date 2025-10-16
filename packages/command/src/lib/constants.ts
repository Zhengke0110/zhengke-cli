/**
 * Command 包常量定义
 */

/**
 * 默认配置常量
 */
export const DefaultConfig = {
    CLI_NAME: 'zk-cli',
    CLI_DESCRIPTION: 'ZK CLI - 一个基于 Nx 和 TypeScript 的命令行工具',
    CLI_VERSION: '0.0.1',
} as const;

/**
 * 命令行选项
 */
export const GlobalOptions = {
    DEBUG_FLAG: '--debug',
    DEBUG_DESCRIPTION: '启用调试模式，显示详细日志',
    DEBUG_DEFAULT: false,
} as const;