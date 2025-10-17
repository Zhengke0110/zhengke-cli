/**
 * 远程仓库管理器
 */

import { GitClient } from './git-client.js';
import { IGitPlatformClient, RepoInfo, CreateRepoOptions } from './git-platform.js';
import { GIT_DEFAULTS, RepoType } from './constants.js';
import { createLogger, success, type Logger } from '@zhengke0110/utils';

export interface RemoteManagerOptions {
  gitClient: GitClient;
  platform: IGitPlatformClient;
  remoteName?: string;
}

export class RemoteManager {
  private gitClient: GitClient;
  private platform: IGitPlatformClient;
  private remoteName: string;
  private logger: Logger;

  constructor(options: RemoteManagerOptions) {
    this.gitClient = options.gitClient;
    this.platform = options.platform;
    this.remoteName = options.remoteName || GIT_DEFAULTS.REMOTE_NAME;
    this.logger = createLogger({ service: 'RemoteManager' });
  }

  /**
   * 初始化远程仓库
   * 如果仓库不存在则创建，如果存在则添加远程地址
   */
  async initRemote(
    repoName: string,
    repoType: RepoType,
    owner: string,
    options: Partial<CreateRepoOptions> = {}
  ): Promise<RepoInfo> {
    try {
      // 检查仓库是否存在
      const exists = await this.platform.repoExists(owner, repoName);

      let repoInfo: RepoInfo;

      if (exists) {
        this.logger.info(`远程仓库已存在: ${owner}/${repoName}`);
        repoInfo = await this.platform.getRepo(owner, repoName);
      } else {
        // 创建仓库
        const createOptions: CreateRepoOptions = {
          name: repoName,
          description: options.description,
          private: options.private ?? false,
          autoInit: options.autoInit ?? false,
          gitignoreTemplate: options.gitignoreTemplate,
        };

        if (repoType === RepoType.USER) {
          repoInfo = await this.platform.createUserRepo(createOptions);
        } else {
          repoInfo = await this.platform.createOrgRepo(owner, createOptions);
        }

        this.logger.info(success(`远程仓库创建成功: ${repoInfo.fullName}`));
      }

      // 添加远程地址
      await this.addRemoteIfNotExists(repoInfo.cloneUrl);

      return repoInfo;
    } catch (error) {
      this.logger.error('初始化远程仓库失败', error);
      throw error;
    }
  }

  /**
   * 添加远程地址（如果不存在）
   */
  async addRemoteIfNotExists(url: string): Promise<void> {
    // 先检查是否是 Git 仓库
    const isRepo = await this.gitClient.isRepo();
    
    if (!isRepo) {
      this.logger.warn('当前目录不是 Git 仓库，跳过添加远程地址');
      return;
    }

    const hasRemote = await this.gitClient.hasRemote(this.remoteName);

    if (hasRemote) {
      this.logger.info(`远程仓库 ${this.remoteName} 已存在`);
      return;
    }

    await this.gitClient.addRemote(this.remoteName, url);
    this.logger.info(success(`远程仓库已添加: ${this.remoteName} -> ${url}`));
  }

  /**
   * 获取远程仓库地址
   */
  async getRemoteUrl(remoteName?: string): Promise<string> {
    const name = remoteName || this.remoteName;
    const remotes = await this.gitClient.getRemotes();
    const remote = remotes.find((r) => r.name === name);

    if (!remote) {
      throw new Error(`远程仓库不存在: ${name}`);
    }

    return remote.refs.fetch;
  }

  /**
   * 推送到远程仓库
   */
  async push(branch: string, options: string[] = []): Promise<void> {
    await this.gitClient.push(this.remoteName, branch, options);
  }

  /**
   * 从远程仓库拉取
   */
  async pull(branch: string): Promise<void> {
    await this.gitClient.pull(this.remoteName, branch);
  }

  /**
   * 推送标签
   */
  async pushTags(): Promise<void> {
    await this.gitClient.pushTags(this.remoteName);
  }

  /**
   * 创建并推送标签
   */
  async createAndPushTag(tagName: string, message?: string): Promise<void> {
    await this.gitClient.createTag(tagName, message);
    await this.pushTags();
    this.logger.info(success(`标签 ${tagName} 已创建并推送`));
  }

  /**
   * 设置上游分支并推送
   */
  async pushAndSetUpstream(branch: string): Promise<void> {
    await this.gitClient.push(this.remoteName, branch, ['--set-upstream']);
    this.logger.info(success(`分支 ${branch} 已推送并设置上游`));
  }

  /**
   * 强制推送
   */
  async forcePush(branch: string): Promise<void> {
    this.logger.warn(`⚠️  强制推送分支: ${branch}`);
    await this.gitClient.push(this.remoteName, branch, ['--force']);
  }

  /**
   * 删除远程分支
   */
  async deleteRemoteBranch(branch: string): Promise<void> {
    await this.gitClient.deleteRemoteBranch(branch, this.remoteName);
  }

  /**
   * 获取远程名称
   */
  getRemoteName(): string {
    return this.remoteName;
  }

  /**
   * 设置远程名称
   */
  setRemoteName(name: string): void {
    this.remoteName = name;
    this.logger.info(success(`远程名称设置为: ${name}`));
  }

  /**
   * 检查远程仓库是否存在
   */
  async remoteExists(owner: string, repo: string): Promise<boolean> {
    return await this.platform.repoExists(owner, repo);
  }

  /**
   * 获取远程仓库信息
   */
  async getRemoteRepoInfo(owner: string, repo: string): Promise<RepoInfo> {
    return await this.platform.getRepo(owner, repo);
  }

  /**
   * 同步主分支
   * 从远程拉取主分支的最新代码
   */
  async syncMainBranch(mainBranch: string = GIT_DEFAULTS.MAIN_BRANCH): Promise<void> {
    try {
      await this.gitClient.checkout(mainBranch);
      await this.pull(mainBranch);
      this.logger.info(success(`主分支 ${mainBranch} 已同步`));
    } catch (error) {
      this.logger.error('同步主分支失败', error);
      throw error;
    }
  }

  /**
   * 同步开发分支
   */
  async syncDevelopBranch(developBranch: string, version?: string): Promise<void> {
    try {
      const branchName = version ? `${developBranch}/${version}` : developBranch;
      await this.gitClient.checkout(branchName);
      await this.pull(branchName);
      this.logger.info(success(`开发分支 ${branchName} 已同步`));
    } catch (error) {
      this.logger.warn(`同步开发分支失败: ${developBranch}`);
      // 开发分支可能不存在于远程，这是正常的
    }
  }
}
