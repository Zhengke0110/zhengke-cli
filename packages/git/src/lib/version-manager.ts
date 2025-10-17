/**
 * 版本管理器 - 支持语义化版本管理
 */

import * as semver from 'semver';
import { VersionType } from './constants.js';
import { createLogger, success, type Logger } from '@zhengke0110/utils';

export interface VersionManagerOptions {
  currentVersion?: string;
  prefix?: string; // 版本前缀，如 'v'
}

export class VersionManager {
  private currentVersion: string;
  private prefix: string;
  private logger: Logger;

  constructor(options: VersionManagerOptions = {}) {
    this.currentVersion = options.currentVersion || '0.0.0';
    this.prefix = options.prefix || 'v';
    this.logger = createLogger({ service: 'VersionManager' });

    // 验证当前版本
    if (!semver.valid(this.currentVersion)) {
      this.logger.warn(`无效的版本号: ${this.currentVersion}，使用默认版本 0.0.0`);
      this.currentVersion = '0.0.0';
    }
  }

  /**
   * 获取当前版本
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * 设置当前版本
   */
  setCurrentVersion(version: string): void {
    const cleanVersion = this.cleanVersion(version);
    if (!semver.valid(cleanVersion)) {
      throw new Error(`无效的版本号: ${version}`);
    }
    this.currentVersion = cleanVersion;
    this.logger.info(success(`当前版本已设置为: ${this.getFormattedVersion()}`));
  }

  /**
   * 递增版本号
   */
  incrementVersion(type: VersionType): string {
    const newVersion = semver.inc(this.currentVersion, type);
    if (!newVersion) {
      throw new Error(`无法递增版本号: ${this.currentVersion} (${type})`);
    }

    const oldVersion = this.currentVersion;
    this.currentVersion = newVersion;

    this.logger.info(success(`版本号从 ${this.formatVersion(oldVersion)} 更新到 ${this.getFormattedVersion()}`));

    return newVersion;
  }

  /**
   * 递增主版本号 (x.0.0)
   */
  incrementMajor(): string {
    return this.incrementVersion(VersionType.MAJOR);
  }

  /**
   * 递增次版本号 (x.y.0)
   */
  incrementMinor(): string {
    return this.incrementVersion(VersionType.MINOR);
  }

  /**
   * 递增修订版本号 (x.y.z)
   */
  incrementPatch(): string {
    return this.incrementVersion(VersionType.PATCH);
  }

  /**
   * 比较两个版本号
   * @returns 1: v1 > v2, 0: v1 = v2, -1: v1 < v2
   */
  compareVersions(v1: string, v2: string): number {
    const cleanV1 = this.cleanVersion(v1);
    const cleanV2 = this.cleanVersion(v2);
    return semver.compare(cleanV1, cleanV2);
  }

  /**
   * 检查版本是否大于指定版本
   */
  isGreaterThan(version: string): boolean {
    return this.compareVersions(this.currentVersion, version) > 0;
  }

  /**
   * 检查版本是否小于指定版本
   */
  isLessThan(version: string): boolean {
    return this.compareVersions(this.currentVersion, version) < 0;
  }

  /**
   * 检查版本是否等于指定版本
   */
  isEqualTo(version: string): boolean {
    return this.compareVersions(this.currentVersion, version) === 0;
  }

  /**
   * 验证版本号是否有效
   */
  isValidVersion(version: string): boolean {
    const cleanVersion = this.cleanVersion(version);
    return semver.valid(cleanVersion) !== null;
  }

  /**
   * 获取带前缀的格式化版本号
   */
  getFormattedVersion(): string {
    return this.formatVersion(this.currentVersion);
  }

  /**
   * 格式化版本号（添加前缀）
   */
  formatVersion(version: string): string {
    return `${this.prefix}${version}`;
  }

  /**
   * 清理版本号（移除前缀）
   */
  cleanVersion(version: string): string {
    return version.replace(/^v/, '');
  }

  /**
   * 解析版本号组件
   */
  parseVersion(version?: string): { major: number; minor: number; patch: number } {
    const v = version || this.currentVersion;
    const parsed = semver.parse(this.cleanVersion(v));

    if (!parsed) {
      throw new Error(`无法解析版本号: ${v}`);
    }

    return {
      major: parsed.major,
      minor: parsed.minor,
      patch: parsed.patch,
    };
  }

  /**
   * 从标签列表中获取最新版本
   */
  getLatestVersionFromTags(tags: string[]): string | null {
    const validVersions = tags
      .map((tag) => this.cleanVersion(tag))
      .filter((version) => semver.valid(version));

    if (validVersions.length === 0) {
      return null;
    }

    const latest = semver.maxSatisfying(validVersions, '*');
    return latest;
  }

  /**
   * 建议下一个版本号
   */
  suggestNextVersion(tags: string[]): {
    major: string;
    minor: string;
    patch: string;
  } {
    const latestVersion = this.getLatestVersionFromTags(tags);

    if (latestVersion) {
      this.setCurrentVersion(latestVersion);
    }

    return {
      major: this.formatVersion(semver.inc(this.currentVersion, VersionType.MAJOR)!),
      minor: this.formatVersion(semver.inc(this.currentVersion, VersionType.MINOR)!),
      patch: this.formatVersion(semver.inc(this.currentVersion, VersionType.PATCH)!),
    };
  }

  /**
   * 设置版本前缀
   */
  setPrefix(prefix: string): void {
    this.prefix = prefix;
  }

  /**
   * 获取版本前缀
   */
  getPrefix(): string {
    return this.prefix;
  }
}
