/**
 * 分支管理器 - 支持 GitFlow 分支管理
 */

import { GitClient } from './git-client.js';
import { BranchType, GIT_DEFAULTS } from './constants.js';
import { createLogger, success, type Logger } from '@zhengke0110/utils';

export interface BranchManagerOptions {
  gitClient: GitClient;
  mainBranch?: string;
  developBranch?: string;
}

export class BranchManager {
  private gitClient: GitClient;
  private mainBranch: string;
  private developBranch: string;
  private logger: Logger;

  constructor(options: BranchManagerOptions) {
    this.gitClient = options.gitClient;
    this.mainBranch = options.mainBranch || GIT_DEFAULTS.MAIN_BRANCH;
    this.developBranch = options.developBranch || GIT_DEFAULTS.DEVELOP_BRANCH;
    this.logger = createLogger({ service: 'BranchManager' });
  }

  /**
   * 获取主分支名称
   */
  getMainBranch(): string {
    return this.mainBranch;
  }

  /**
   * 获取开发分支名称
   */
  getDevelopBranch(): string {
    return this.developBranch;
  }

  /**
   * 设置主分支名称
   */
  setMainBranch(branch: string): void {
    this.mainBranch = branch;
    this.logger.info(success(`主分支设置为: ${branch}`));
  }

  /**
   * 设置开发分支名称
   */
  setDevelopBranch(branch: string): void {
    this.developBranch = branch;
    this.logger.info(success(`开发分支设置为: ${branch}`));
  }

  /**
   * 生成功能分支名称
   */
  generateBranchName(type: BranchType, name: string, version?: string): string {
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    switch (type) {
      case BranchType.FEATURE:
        return `feature/${sanitizedName}`;
      case BranchType.BUGFIX:
        return `bugfix/${sanitizedName}`;
      case BranchType.HOTFIX:
        return version ? `hotfix/${version}` : `hotfix/${sanitizedName}`;
      case BranchType.RELEASE:
        return version ? `release/${version}` : `release/${sanitizedName}`;
      default:
        return sanitizedName;
    }
  }

  /**
   * 创建开发分支
   */
  async createDevelopBranch(branchName?: string, version?: string): Promise<string> {
    let fullBranchName: string;

    if (version) {
      // 如果有版本号，使用 develop/version 格式
      fullBranchName = `${this.developBranch}/${version}`;
    } else if (branchName && branchName !== this.developBranch) {
      // 如果有功能名称且不是 develop，使用 develop/branchName 格式
      fullBranchName = `${this.developBranch}/${branchName}`;
    } else {
      // 否则直接使用 develop
      fullBranchName = this.developBranch;
    }

    // 检查分支是否已存在
    const exists = await this.branchExists(fullBranchName);

    if (exists) {
      this.logger.info(`开发分支 ${fullBranchName} 已存在，切换到该分支`);
      await this.gitClient.checkout(fullBranchName);
    } else {
      await this.gitClient.checkoutNewBranch(fullBranchName);
      this.logger.info(success(`创建开发分支: ${fullBranchName}`));
    }

    return fullBranchName;
  }

  /**
   * 创建功能分支
   */
  async createFeatureBranch(name: string): Promise<string> {
    const branchName = this.generateBranchName(BranchType.FEATURE, name);
    await this.gitClient.checkoutNewBranch(branchName);
    return branchName;
  }

  /**
   * 创建修复分支
   */
  async createBugfixBranch(name: string): Promise<string> {
    const branchName = this.generateBranchName(BranchType.BUGFIX, name);
    await this.gitClient.checkoutNewBranch(branchName);
    return branchName;
  }

  /**
   * 创建热修复分支
   */
  async createHotfixBranch(version: string): Promise<string> {
    // 热修复分支从主分支创建
    await this.gitClient.checkout(this.mainBranch);
    const branchName = this.generateBranchName(BranchType.HOTFIX, '', version);
    await this.gitClient.checkoutNewBranch(branchName);
    return branchName;
  }

  /**
   * 创建发布分支
   */
  async createReleaseBranch(version: string): Promise<string> {
    const branchName = this.generateBranchName(BranchType.RELEASE, '', version);
    await this.gitClient.checkoutNewBranch(branchName);
    return branchName;
  }

  /**
   * 切换到主分支
   */
  async checkoutMain(): Promise<void> {
    await this.gitClient.checkout(this.mainBranch);
  }

  /**
   * 切换到开发分支
   */
  async checkoutDevelop(version?: string): Promise<void> {
    const branchName = version ? `${this.developBranch}/${version}` : this.developBranch;
    await this.gitClient.checkout(branchName);
  }

  /**
   * 合并分支到主分支
   */
  async mergeToMain(sourceBranch: string, options: string[] = []): Promise<void> {
    await this.checkoutMain();
    await this.gitClient.merge(sourceBranch, options);
    this.logger.info(success(`分支 ${sourceBranch} 已合并到 ${this.mainBranch}`));
  }

  /**
   * 合并主分支到当前分支
   */
  async mergeFromMain(options: string[] = []): Promise<void> {
    const currentBranch = await this.gitClient.getCurrentBranch();
    await this.gitClient.merge(this.mainBranch, options);
    this.logger.info(success(`${this.mainBranch} 已合并到 ${currentBranch}`));
  }

  /**
   * 合并开发分支到当前分支
   */
  async mergeFromDevelop(version?: string, options: string[] = []): Promise<void> {
    const developBranch = version ? `${this.developBranch}/${version}` : this.developBranch;
    const currentBranch = await this.gitClient.getCurrentBranch();
    await this.gitClient.merge(developBranch, options);
    this.logger.info(success(`${developBranch} 已合并到 ${currentBranch}`));
  }

  /**
   * 删除分支（本地和远程）
   */
  async deleteBranch(
    branchName: string,
    options: { local?: boolean; remote?: boolean; force?: boolean } = {}
  ): Promise<void> {
    const { local = true, remote = true, force = false } = options;

    if (local) {
      try {
        await this.gitClient.deleteLocalBranch(branchName, force);
      } catch (error) {
        this.logger.warn(`删除本地分支失败: ${branchName}`);
      }
    }

    if (remote) {
      try {
        await this.gitClient.deleteRemoteBranch(branchName);
      } catch (error) {
        const errorMessage = error?.toString() || '';
        if (errorMessage.includes('refusing to delete the current branch') ||
          errorMessage.includes('remote rejected')) {
          this.logger.warn(`⚠️ 无法删除远程分支 ${branchName}`);
          this.logger.warn(`   原因：该分支可能是仓库的默认分支`);
          this.logger.warn(`   建议：请在 GitHub/Gitee 网站上手动将默认分支设置为 main，然后删除 ${branchName}`);
        } else {
          this.logger.warn(`删除远程分支失败: ${branchName} - ${errorMessage}`);
        }
        // 不再抛出错误，只记录警告
      }
    }

    this.logger.info(success(`分支 ${branchName} 已删除`));
  }

  /**
   * 检查分支是否存在
   */
  async branchExists(branchName: string): Promise<boolean> {
    const branches = await this.gitClient.getBranches();
    return branches.all.includes(branchName);
  }

  /**
   * 检查是否在主分支
   */
  async isOnMainBranch(): Promise<boolean> {
    const currentBranch = await this.gitClient.getCurrentBranch();
    return currentBranch === this.mainBranch;
  }

  /**
   * 检查是否在开发分支
   */
  async isOnDevelopBranch(version?: string): Promise<boolean> {
    const currentBranch = await this.gitClient.getCurrentBranch();
    const developBranch = version ? `${this.developBranch}/${version}` : this.developBranch;
    return currentBranch === developBranch || currentBranch.startsWith(`${this.developBranch}/`);
  }

  /**
   * 获取当前分支类型
   */
  async getCurrentBranchType(): Promise<BranchType | 'main' | 'develop' | 'other'> {
    const currentBranch = await this.gitClient.getCurrentBranch();

    if (currentBranch === this.mainBranch || currentBranch === GIT_DEFAULTS.MASTER_BRANCH) {
      return 'main';
    }

    if (currentBranch === this.developBranch || currentBranch.startsWith(`${this.developBranch}/`)) {
      return 'develop';
    }

    if (currentBranch.startsWith('feature/')) {
      return BranchType.FEATURE;
    }

    if (currentBranch.startsWith('bugfix/')) {
      return BranchType.BUGFIX;
    }

    if (currentBranch.startsWith('hotfix/')) {
      return BranchType.HOTFIX;
    }

    if (currentBranch.startsWith('release/')) {
      return BranchType.RELEASE;
    }

    return 'other';
  }

  /**
   * 同步远程分支
   */
  async syncWithRemote(branch?: string): Promise<void> {
    const targetBranch = branch || (await this.gitClient.getCurrentBranch());

    try {
      await this.gitClient.pull(GIT_DEFAULTS.REMOTE_NAME, targetBranch);
      this.logger.info(success(`分支 ${targetBranch} 已与远程同步`));
    } catch (error) {
      this.logger.warn(`同步远程分支失败: ${targetBranch}`);
      throw error;
    }
  }

  /**
   * 推送分支到远程
   */
  async pushToRemote(branch?: string, options: string[] = []): Promise<void> {
    const targetBranch = branch || (await this.gitClient.getCurrentBranch());
    await this.gitClient.push(GIT_DEFAULTS.REMOTE_NAME, targetBranch, options);
  }
}
