/**
 * 错误代码枚举
 */
export enum ErrorCode {
  // 通用错误 (1000-1999)
  UNKNOWN_ERROR = 'E1000',
  INTERNAL_ERROR = 'E1001',
  NOT_IMPLEMENTED = 'E1002',

  // 参数错误 (2000-2999)
  INVALID_ARGUMENT = 'E2000',
  MISSING_ARGUMENT = 'E2001',
  INVALID_OPTION = 'E2002',

  // 文件系统错误 (3000-3999)
  FILE_NOT_FOUND = 'E3000',
  FILE_READ_ERROR = 'E3001',
  FILE_WRITE_ERROR = 'E3002',
  DIRECTORY_NOT_FOUND = 'E3003',
  PERMISSION_DENIED = 'E3004',

  // 网络错误 (4000-4999)
  NETWORK_ERROR = 'E4000',
  TIMEOUT_ERROR = 'E4001',
  CONNECTION_ERROR = 'E4002',

  // 环境错误 (5000-5999)
  NODE_VERSION_ERROR = 'E5000',
  DEPENDENCY_ERROR = 'E5001',
  CONFIG_ERROR = 'E5002',

  // 业务逻辑错误 (6000-6999)
  VALIDATION_ERROR = 'E6000',
  OPERATION_FAILED = 'E6001',
}

/**
 * CLI 自定义错误类
 */
export class CLIError extends Error {
  public readonly code: ErrorCode;
  public readonly userMessage: string;
  public readonly details?: unknown;
  public readonly suggestions?: string[];

  constructor(options: {
    code: ErrorCode;
    message: string;
    userMessage?: string;
    details?: unknown;
    suggestions?: string[];
  }) {
    super(options.message);
    this.name = 'CLIError';
    this.code = options.code;
    this.userMessage = options.userMessage || options.message;
    this.details = options.details;
    this.suggestions = options.suggestions;

    // 维护正确的堆栈跟踪（仅在 V8 引擎中）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CLIError);
    }
  }
}

/**
 * 参数错误
 */
export class ArgumentError extends CLIError {
  constructor(message: string, suggestions?: string[]) {
    super({
      code: ErrorCode.INVALID_ARGUMENT,
      message,
      userMessage: `参数错误: ${message}`,
      suggestions,
    });
    this.name = 'ArgumentError';
  }
}

/**
 * 文件系统错误
 */
export class FileSystemError extends CLIError {
  constructor(operation: string, path: string, originalError?: Error) {
    super({
      code: ErrorCode.FILE_READ_ERROR,
      message: `文件系统操作失败: ${operation} - ${path}`,
      userMessage: `无法${operation}文件: ${path}`,
      details: originalError,
      suggestions: [
        '检查文件路径是否正确',
        '确认是否有足够的权限',
        '确保文件存在',
      ],
    });
    this.name = 'FileSystemError';
  }
}

/**
 * 网络错误
 */
export class NetworkError extends CLIError {
  constructor(message: string, originalError?: Error) {
    super({
      code: ErrorCode.NETWORK_ERROR,
      message,
      userMessage: `网络请求失败: ${message}`,
      details: originalError,
      suggestions: [
        '检查网络连接是否正常',
        '确认是否需要代理设置',
        '稍后重试',
      ],
    });
    this.name = 'NetworkError';
  }
}

/**
 * 环境错误
 */
export class EnvironmentError extends CLIError {
  constructor(message: string, suggestions?: string[]) {
    super({
      code: ErrorCode.NODE_VERSION_ERROR,
      message,
      userMessage: `环境检查失败: ${message}`,
      suggestions,
    });
    this.name = 'EnvironmentError';
  }
}

/**
 * 验证错误
 */
export class ValidationError extends CLIError {
  constructor(field: string, message: string) {
    super({
      code: ErrorCode.VALIDATION_ERROR,
      message: `验证失败: ${field} - ${message}`,
      userMessage: `${field}: ${message}`,
    });
    this.name = 'ValidationError';
  }
}
