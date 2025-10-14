import * as semver from 'semver';

export interface VersionCheckResult {
  isValid: boolean;
  currentVersion: string;
  requiredVersion: string;
  message?: string;
}

/**
 * 检查当前 Node.js 版本是否满足最低要求
 * @param requiredVersion 最低要求的版本 (例如: '16.0.0', '>=14.0.0')
 * @returns 版本检查结果
 */
export function checkNodeVersion(requiredVersion: string): VersionCheckResult {
  const currentVersion = process.version;
  
  // 如果 requiredVersion 不包含比较运算符，默认添加 >=
  const versionRange = requiredVersion.startsWith('>') || requiredVersion.startsWith('<') || requiredVersion.startsWith('=')
    ? requiredVersion
    : `>=${requiredVersion}`;

  const isValid = semver.satisfies(currentVersion, versionRange);

  return {
    isValid,
    currentVersion,
    requiredVersion: versionRange,
    message: isValid
      ? `✓ Node.js 版本检查通过 (当前: ${currentVersion}, 要求: ${versionRange})`
      : `✗ Node.js 版本不满足要求 (当前: ${currentVersion}, 要求: ${versionRange})`,
  };
}

/**
 * 检查 Node.js 版本，如果不满足则退出程序
 * @param requiredVersion 最低要求的版本
 * @param logger 可选的 logger 实例用于输出日志
 */
export function ensureNodeVersion(
  requiredVersion: string,
  logger?: {
    error: (message: string) => void;
    debug?: (message: string) => void;
  }
): void {
  const result = checkNodeVersion(requiredVersion);

  if (logger?.debug) {
    logger.debug(result.message || '');
  }

  if (!result.isValid) {
    if (logger) {
      logger.error(result.message || '');
      logger.error('请升级 Node.js 版本后再试');
    } else {
      console.error(result.message);
      console.error('请升级 Node.js 版本后再试');
    }
    process.exit(1);
  }
}

/**
 * 获取当前 Node.js 版本
 * @returns 当前 Node.js 版本字符串
 */
export function getCurrentNodeVersion(): string {
  return process.version;
}

/**
 * 比较两个版本号
 * @param version1 版本1
 * @param version2 版本2
 * @returns 1 表示 version1 > version2, 0 表示相等, -1 表示 version1 < version2
 */
export function compareVersions(version1: string, version2: string): number {
  return semver.compare(version1, version2);
}
