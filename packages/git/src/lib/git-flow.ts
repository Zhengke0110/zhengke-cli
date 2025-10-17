/**
 * GitFlow 核心逻辑
 * 整合四个阶段：仓库初始化、Git初始化、提交、推送
 */

import { GitClient } from './git-client.js';
import { VersionManager } from './version-manager.js';
import { BranchManager } from './branch-manager.js';
import { RemoteManager } from './remote-manager.js';
import { IGitPlatformClient, RepoInfo } from './git-platform.js';
import { GitPlatform, RepoType, VersionType, GIT_CONFIG_FILES } from './constants.js';
import { createLogger, success, type Logger } from '@zhengke0110/utils';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

/**
 * GitFlow 配置选项
 */
export interface GitFlowOptions {
  workDir?: string;
  platform?: GitPlatform;
  token?: string;
}

/**
 * 仓库初始化选项
 */
export interface RepoInitOptions {
  repoName: string;
  repoType: RepoType;
  owner: string;
  description?: string;
  private?: boolean;
}

/**
 * 提交选项
 */
export interface CommitOptions {
  message: string;
  versionType?: VersionType;
  version?: string;
}

/**
 * GitFlow 主类
 */
export class GitFlow {
  private gitClient: GitClient;
  private versionManager: VersionManager;
  private branchManager: BranchManager;
  private remoteManager: RemoteManager;
  private platform: IGitPlatformClient;
  private logger: Logger;
  private workDir: string;

  constructor(
    platform: IGitPlatformClient,
    options: GitFlowOptions = {}
  ) {
    this.workDir = options.workDir || process.cwd();
    this.platform = platform;
    this.logger = createLogger({ service: 'GitFlow' });

    // 初始化各个管理器
    this.gitClient = new GitClient({ baseDir: this.workDir });
    this.versionManager = new VersionManager();
    this.branchManager = new BranchManager({ gitClient: this.gitClient });
    this.remoteManager = new RemoteManager({
      gitClient: this.gitClient,
      platform: this.platform,
    });

    this.logger.info(success('GitFlow 初始化成功'));
  }

  /**
   * 获取配置文件路径
   */
  private getConfigPath(filename: string): string {
    return path.join(os.homedir(), filename);
  }

  /**
   * 写入配置文件
   */
  private async writeConfig(filePath: string, data: Record<string, any>): Promise<void> {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 读取配置文件
   */
  private async readConfig(filePath: string): Promise<Record<string, any>> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  /**
   * 检查当前目录是否已是 Git 仓库
   */
  private async checkExistingRepo(): Promise<boolean> {
    const isRepo = await this.gitClient.isRepo();
    if (isRepo) {
      const remotes = await this.gitClient.getRemotes();
      if (remotes.length > 0) {
        this.logger.warn('⚠️  当前目录已是 Git 仓库');
        this.logger.warn(`   远程仓库: ${remotes.map(r => `${r.name} -> ${r.refs.fetch}`).join(', ')}`);
        return true;
      }
    }
    return false;
  }

  /**
   * 阶段1: 仓库初始化
   * 包括：平台选择、Token设置、用户/组织选择、创建远程仓库
   */
  async initRepository(options: RepoInitOptions): Promise<RepoInfo> {
    this.logger.info('🚀 开始仓库初始化...');

    // 安全检查：警告用户如果已存在 Git 仓库
    const hasExistingRepo = await this.checkExistingRepo();
    if (hasExistingRepo) {
      this.logger.warn('⚠️  继续操作可能会影响现有的 Git 配置！');
    }

    try {
      // 1. 保存平台配置
      const platformPath = this.getConfigPath(GIT_CONFIG_FILES.PLATFORM);
      await this.writeConfig(platformPath, { platform: this.platform.platform });

      // 2. 保存仓库类型
      const ownPath = this.getConfigPath(GIT_CONFIG_FILES.OWN);
      await this.writeConfig(ownPath, { type: options.repoType });

      // 3. 保存登录信息
      const loginPath = this.getConfigPath(GIT_CONFIG_FILES.LOGIN);
      await this.writeConfig(loginPath, { owner: options.owner });

      // 4. 创建远程仓库
      const repoInfo = await this.remoteManager.initRemote(
        options.repoName,
        options.repoType,
        options.owner,
        {
          description: options.description,
          private: options.private,
          autoInit: false,
        }
      );

      this.logger.info(success('✅ 仓库初始化完成'));
      return repoInfo;
    } catch (error) {
      this.logger.error('❌ 仓库初始化失败', error);
      throw error;
    }
  }

  /**
   * 阶段2: Git 初始化
   * 包括：初始化本地仓库、添加远程地址、拉取远程分支
   */
  async initGit(remoteUrl: string): Promise<void> {
    this.logger.info('🚀 开始 Git 初始化...');

    try {
      // 1. 检查是否已经是 Git 仓库
      const isRepo = await this.gitClient.isRepo();

      if (!isRepo) {
        // 2. 初始化 Git 仓库
        await this.gitClient.init();
      }

      // 3. 添加远程仓库地址
      await this.remoteManager.addRemoteIfNotExists(remoteUrl);

      // 4. 检查是否有未提交的代码
      const hasChanges = await this.gitClient.hasUncommittedChanges();
      if (hasChanges) {
        this.logger.info('检测到未提交的代码');
        
        // 5. 如果有代码变更，创建初始提交并推送到main分支
        await this.gitClient.add('.');
        await this.gitClient.commit('chore: initial commit');
        
        // 6. 推送main分支，确保它成为默认分支
        await this.remoteManager.push(this.branchManager.getMainBranch());
        this.logger.info('初始提交已推送到主分支');
      }

      this.logger.info(success('✅ Git 初始化完成'));
    } catch (error) {
      this.logger.error('❌ Git 初始化失败', error);
      throw error;
    }
  }

  /**
   * 阶段3: Git 提交
   * 包括：版本号管理、代码提交、分支合并、推送到开发分支
   */
  async commit(options: CommitOptions): Promise<string> {
    this.logger.info('🚀 开始 Git 提交...');

    try {
      // 1. 确定版本号
      let version: string;
      if (options.version) {
        version = options.version;
        this.versionManager.setCurrentVersion(options.version);
      } else {
        // 从已有标签获取最新版本
        const tags = await this.gitClient.getTags();
        const suggestions = this.versionManager.suggestNextVersion(tags);
        
        // 根据版本类型递增
        if (options.versionType) {
          version = this.versionManager.incrementVersion(options.versionType);
        } else {
          // 默认使用 patch
          version = this.versionManager.incrementPatch();
        }
      }

      const formattedVersion = this.versionManager.getFormattedVersion();

      // 2. 检查 stash 区
      const stashList = await this.gitClient.stashList();
      if (stashList.total > 0) {
        this.logger.warn('检测到 stash 区有未提交的内容');
      }

      // 3. 检查代码冲突
      const hasConflicts = await this.gitClient.hasConflicts();
      if (hasConflicts) {
        throw new Error('存在代码冲突，请先解决冲突');
      }

      // 4. 自动提交未提交代码
      const hasChanges = await this.gitClient.hasUncommittedChanges();
      if (hasChanges) {
        await this.gitClient.add('.');
        await this.gitClient.commit(options.message || `chore: release ${formattedVersion}`);
      }

      // 5. 创建或切换到开发分支
      const developBranch = await this.branchManager.createDevelopBranch('dev', version);

      // 6. 合并远程 master 分支
      try {
        await this.remoteManager.syncMainBranch(this.branchManager.getMainBranch());
        await this.branchManager.mergeFromMain(['--no-ff']);
      } catch (error) {
        this.logger.warn('合并主分支时出现问题，可能是首次提交');
      }

      // 7. 推送到远程开发分支
      await this.remoteManager.pushAndSetUpstream(developBranch);

      this.logger.info(success(`✅ Git 提交完成，版本: ${formattedVersion}`));
      return formattedVersion;
    } catch (error) {
      this.logger.error('❌ Git 提交失败', error);
      throw error;
    }
  }

  /**
   * 阶段4: Git 推送（发布）
   * 包括：合并到主分支、创建标签、推送、删除开发分支
   */
  async publish(version?: string): Promise<void> {
    this.logger.info('🚀 开始 Git 推送...');

    try {
      // 1. 获取当前分支
      const currentBranch = await this.gitClient.getCurrentBranch();
      const isDevelopBranch = await this.branchManager.isOnDevelopBranch();

      let developBranch = currentBranch;

      // 如果不在开发分支，尝试找到最新的开发分支
      if (!isDevelopBranch) {
        const branches = await this.gitClient.getBranches();
        
        // 检查本地分支
        let developBranches = branches.local.filter(b => b.startsWith('develop/'));
        
        // 如果本地没有开发分支，检查远程分支
        if (developBranches.length === 0) {
          const remoteDevelopBranches = branches.remote
            .filter(b => b.includes('/develop/'))
            .map(b => b.replace(/^remotes\/[^/]+\//, '')); // 移除 remotes/origin/ 前缀
          
          if (remoteDevelopBranches.length === 0) {
            throw new Error('未找到开发分支，请先执行 git:commit 创建开发分支');
          }
          
          // 选择最新的远程开发分支（按版本号排序）
          developBranch = remoteDevelopBranches.sort().pop()!;
          this.logger.info(`检出远程开发分支: ${developBranch}`);
          
          // 从远程分支创建本地分支并切换
          await this.gitClient.checkoutFromRemote(developBranch, `origin/${developBranch}`);
        } else {
          // 选择最新的本地开发分支（按版本号排序）
          developBranch = developBranches.sort().pop()!;
          this.logger.info(`自动选择开发分支: ${developBranch}`);
          
          // 切换到开发分支
          await this.gitClient.checkout(developBranch);
        }
      }

      // 2. 切换到主分支
      await this.branchManager.checkoutMain();

      // 3. 合并开发分支到主分支
      await this.gitClient.merge(developBranch, ['--no-ff']);
      this.logger.info(success(`开发分支 ${developBranch} 已合并到主分支`));

      // 4. 创建并推送标签 - 从开发分支名称解析版本号
      let tagVersion: string;
      if (version) {
        tagVersion = version;
      } else {
        // 从开发分支名称提取版本号（例如 develop/0.0.1 -> 0.0.1）
        const versionMatch = developBranch.match(/develop\/(.+)$/);
        if (versionMatch) {
          tagVersion = `v${versionMatch[1]}`;
        } else {
          tagVersion = this.versionManager.getFormattedVersion();
        }
      }
      
      await this.remoteManager.createAndPushTag(tagVersion, `Release ${tagVersion}`);

      // 5. 推送主分支
      await this.remoteManager.push(this.branchManager.getMainBranch());

      // 6. 确保main分支成为默认分支
      try {
        await this.ensureMainAsDefaultBranch();
      } catch (error) {
        this.logger.warn('设置默认分支时出现警告:', error);
      }

      // 7. 删除本地开发分支
      await this.branchManager.deleteBranch(developBranch, { local: true, remote: true });

      this.logger.info(success(`✅ Git 推送完成，版本: ${tagVersion}`));
    } catch (error) {
      this.logger.error('❌ Git 推送失败', error);
      throw error;
    }
  }

  /**
   * 确保main分支成为默认分支
   */
  private async ensureMainAsDefaultBranch(): Promise<void> {
    try {
      // 从配置文件中读取仓库信息
      const loginPath = this.getConfigPath(GIT_CONFIG_FILES.LOGIN);
      const loginConfig = await this.readConfig(loginPath);
      
      if (!loginConfig?.['owner']) {
        this.logger.warn('无法获取仓库所有者信息，跳过设置默认分支');
        return;
      }

      // 获取仓库名称（假设当前目录名就是仓库名）
      const repoName = process.cwd().split('/').pop() || '';
      if (!repoName) {
        this.logger.warn('无法获取仓库名称，跳过设置默认分支');
        return;
      }

      // 更新默认分支
      await this.platform.updateDefaultBranch(loginConfig['owner'], repoName, this.branchManager.getMainBranch());
      this.logger.info(`✓ 已设置 ${this.branchManager.getMainBranch()} 为默认分支`);
    } catch (error) {
      // 不抛出错误，只记录警告
      this.logger.warn(`设置默认分支失败: ${error}`);
    }
  }

  /**
   * 完整的 GitFlow 工作流
   * 一键完成：初始化仓库 -> Git初始化 -> 提交 -> 发布
   */
  async fullFlow(
    repoOptions: RepoInitOptions,
    commitOptions: CommitOptions
  ): Promise<void> {
    this.logger.info('🚀 开始完整 GitFlow 工作流...');

    try {
      // 阶段1: 仓库初始化
      const repoInfo = await this.initRepository(repoOptions);

      // 阶段2: Git 初始化
      await this.initGit(repoInfo.cloneUrl); // 使用 HTTPS URL

      this.logger.info(success(`✅ Git 仓库初始化成功: ${repoInfo.url}`));
    } catch (error) {
      this.logger.error('❌ GitFlow 工作流失败', error);
      throw error;
    }
  }

  /**
   * 获取 GitClient 实例
   */
  getGitClient(): GitClient {
    return this.gitClient;
  }

  /**
   * 获取 VersionManager 实例
   */
  getVersionManager(): VersionManager {
    return this.versionManager;
  }

  /**
   * 获取 BranchManager 实例
   */
  getBranchManager(): BranchManager {
    return this.branchManager;
  }

  /**
   * 获取 RemoteManager 实例
   */
  getRemoteManager(): RemoteManager {
    return this.remoteManager;
  }

  /**
   * 获取 Platform 实例
   */
  getPlatform(): IGitPlatformClient {
    return this.platform;
  }
}
