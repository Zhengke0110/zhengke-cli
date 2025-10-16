/**
 * Utils 包常量定义
 */

/**
 * 日志级别枚举
 */
export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug',
    VERBOSE = 'verbose',
}

/**
 * 环境变量名称
 */
export enum EnvironmentVariables {
    LOG_LEVEL = 'LOG_LEVEL',
}

/**
 * 日志级别标签
 */
export const LogLevelLabels: Record<LogLevel, string> = {
    [LogLevel.ERROR]: '[error]',
    [LogLevel.WARN]: '[warn]',
    [LogLevel.INFO]: '[info]',
    [LogLevel.DEBUG]: '[debug]',
    [LogLevel.VERBOSE]: '[verbose]',
};

/**
 * 日志图标
 */
export const LogIcons = {
    ERROR: '✗',
    WARN: '⚠',
    INFO: 'ℹ',
    SUCCESS: '✓',
} as const;

/**
 * 时间格式
 */
export const TimeFormats = {
    DEFAULT: 'YYYY-MM-DD HH:mm:ss',
} as const;

/**
 * 默认配置
 */
export const DefaultLoggerConfig = {
    SERVICE: 'app',
    LEVEL: LogLevel.INFO,
} as const;

/**
 * 文件扩展名验证
 */
export const FileExtensions = {
    JSON: '.json',
    JS: '.js',
    TS: '.ts',
} as const;

/**
 * 默认错误消息
 */
export const ErrorMessages = {
    NODE_VERSION_CHECK_FAILED: '请升级 Node.js 版本后再试',
    CONFIG_SAVE_FAILED: 'Failed to save config',
    CONFIG_LOAD_FAILED: 'Failed to load config',
} as const;