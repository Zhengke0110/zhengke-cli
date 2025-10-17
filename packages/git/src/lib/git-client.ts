/**
 * Git 客户端 - 封装 simple-git 的基础操作
 */

import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import { createLogger, success, type Logger } from '@zhengke0110/utils';
import { GIT_DEFAULTS } from './constants.js';

export interface GitClientOptions {
  baseDir?: string;
  binary?: string;
  maxConcurrentProcesses?: number;
}

export class GitClient {
  private git: SimpleGit;
  private logger: Logger;

  constructor(options: GitClientOptions = {}) {
    const gitOptions: Partial<SimpleGitOptions> = {
      baseDir: options.baseDir || process.cwd(),
      binary: options.binary || 'git',
      maxConcurrentProcesses: options.maxConcurrentProcesses || 6,
    };

    this.git = simpleGit(gitOptions);
    this.logger = createLogger({ service: 'GitClient' });
  }

  /**
   * 初始化 Git 仓库
   */
  async init(): Promise<void> {
    try {
      await this.git.init();
      this.logger.info(success('Git 仓库初始化成功'));
    } catch (error) {
      this.logger.error('Git 仓库初始化失败', error);
      throw error;
    }
  }

  /**
   * 检查是否是 Git 仓库
   */
  async isRepo(): Promise<boolean> {
    try {
      await this.git.revparse(['--is-inside-work-tree']);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 添加远程仓库
   */
  async addRemote(name: string, url: string): Promise<void> {
    try {
      await this.git.addRemote(name, url);
      this.logger.info(success(`添加远程仓库: ${name} -> ${url}`));
    } catch (error) {
      this.logger.error('添加远程仓库失败', error);
      throw error;
    }
  }

  /**
   * 获取远程仓库列表
   */
  async getRemotes(): Promise<{ name: string; refs: { fetch: string; push: string } }[]> {
    try {
      const remotes = await this.git.getRemotes(true);
      return remotes;
    } catch (error) {
      this.logger.error('获取远程仓库列表失败', error);
      throw error;
    }
  }

  /**
   * 检查远程仓库是否存在
   */
  async hasRemote(name: string = GIT_DEFAULTS.REMOTE_NAME): Promise<boolean> {
    const remotes = await this.getRemotes();
    return remotes.some((remote) => remote.name === name);
  }

  /**
   * 获取当前分支
   */
  async getCurrentBranch(): Promise<string> {
    try {
      const branch = await this.git.branch();
      return branch.current;
    } catch (error) {
      this.logger.error('获取当前分支失败', error);
      throw error;
    }
  }

  /**
   * 获取所有分支
   */
  async getBranches(): Promise<{ local: string[]; remote: string[]; all: string[] }> {
    try {
      const result = await this.git.branch(['-a']);
      const local = result.branches
        ? Object.keys(result.branches).filter((b) => !b.startsWith('remotes/'))
        : [];
      const remote = result.branches
        ? Object.keys(result.branches).filter((b) => b.startsWith('remotes/'))
        : [];
      const all = result.all || [];

      return { local, remote, all };
    } catch (error) {
      this.logger.error('获取分支列表失败', error);
      throw error;
    }
  }

  /**
   * 创建并切换到新分支
   */
  async checkoutNewBranch(branchName: string): Promise<void> {
    try {
      await this.git.checkoutLocalBranch(branchName);
      this.logger.info(success(`创建并切换到新分支: ${branchName}`));
    } catch (error) {
      this.logger.error(`创建分支失败: ${branchName}`, error);
      throw error;
    }
  }

  /**
   * 切换分支
   */
  async checkout(branchName: string): Promise<void> {
    try {
      await this.git.checkout(branchName);
      this.logger.info(success(`切换到分支: ${branchName}`));
    } catch (error) {
      this.logger.error(`切换分支失败: ${branchName}`, error);
      throw error;
    }
  }

  /**
   * 从远程分支创建本地分支并切换
   */
  async checkoutFromRemote(localBranch: string, remoteBranch: string): Promise<void> {
    try {
      await this.git.checkout(['-b', localBranch, remoteBranch]);
      this.logger.info(success(`从远程分支 ${remoteBranch} 创建并切换到本地分支: ${localBranch}`));
    } catch (error) {
      this.logger.error(`从远程分支创建本地分支失败: ${localBranch} <- ${remoteBranch}`, error);
      throw error;
    }
  }

  /**
   * 删除本地分支
   */
  async deleteLocalBranch(branchName: string, force: boolean = false): Promise<void> {
    try {
      await this.git.deleteLocalBranch(branchName, force);
      this.logger.info(success(`删除本地分支: ${branchName}`));
    } catch (error) {
      this.logger.error(`删除本地分支失败: ${branchName}`, error);
      throw error;
    }
  }

  /**
   * 删除远程分支
   */
  async deleteRemoteBranch(branchName: string, remote: string = GIT_DEFAULTS.REMOTE_NAME): Promise<void> {
    try {
      await this.git.push([remote, '--delete', branchName]);
      this.logger.info(success(`删除远程分支: ${remote}/${branchName}`));
    } catch (error) {
      this.logger.error(`删除远程分支失败: ${branchName}`, error);
      throw error;
    }
  }

  /**
   * 添加文件到暂存区
   */
  async add(files: string | string[] = '.'): Promise<void> {
    try {
      await this.git.add(files);
      this.logger.info(success('文件已添加到暂存区'));
    } catch (error) {
      this.logger.error('添加文件到暂存区失败', error);
      throw error;
    }
  }

  /**
   * 提交代码
   */
  async commit(message: string): Promise<void> {
    try {
      await this.git.commit(message);
      this.logger.info(success(`提交成功: ${message}`));
    } catch (error) {
      this.logger.error('提交失败', error);
      throw error;
    }
  }

  /**
   * 获取状态
   */
  async status(): Promise<any> {
    try {
      return await this.git.status();
    } catch (error) {
      this.logger.error('获取状态失败', error);
      throw error;
    }
  }

  /**
   * 检查是否有未提交的代码
   */
  async hasUncommittedChanges(): Promise<boolean> {
    const status = await this.status();
    return !status.isClean();
  }

  /**
   * 拉取远程分支
   */
  async pull(remote: string = GIT_DEFAULTS.REMOTE_NAME, branch?: string): Promise<void> {
    try {
      await this.git.pull(remote, branch);
      this.logger.info(success(`拉取远程分支成功: ${remote}${branch ? `/${branch}` : ''}`));
    } catch (error) {
      this.logger.error('拉取远程分支失败', error);
      throw error;
    }
  }

  /**
   * 推送到远程分支
   */
  async push(remote: string = GIT_DEFAULTS.REMOTE_NAME, branch?: string, options: string[] = []): Promise<void> {
    try {
      const args = [remote];
      if (branch) args.push(branch);
      args.push(...options);
      await this.git.push(args);
      this.logger.info(success(`推送到远程分支成功: ${remote}${branch ? `/${branch}` : ''}`));
    } catch (error) {
      this.logger.error('推送到远程分支失败', error);
      throw error;
    }
  }

  /**
   * 合并分支
   */
  async merge(branchName: string, options: string[] = []): Promise<void> {
    try {
      await this.git.merge([branchName, ...options]);
      this.logger.info(success(`合并分支成功: ${branchName}`));
    } catch (error) {
      this.logger.error(`合并分支失败: ${branchName}`, error);
      throw error;
    }
  }

  /**
   * 创建标签
   */
  async createTag(tagName: string, message?: string): Promise<void> {
    try {
      if (message) {
        await this.git.tag(['-a', tagName, '-m', message]);
      } else {
        await this.git.tag([tagName]);
      }
      this.logger.info(success(`创建标签成功: ${tagName}`));
    } catch (error) {
      this.logger.error(`创建标签失败: ${tagName}`, error);
      throw error;
    }
  }

  /**
   * 推送标签
   */
  async pushTags(remote: string = GIT_DEFAULTS.REMOTE_NAME): Promise<void> {
    try {
      await this.git.pushTags(remote);
      this.logger.info(success('推送标签成功'));
    } catch (error) {
      this.logger.error('推送标签失败', error);
      throw error;
    }
  }

  /**
   * 获取所有标签
   */
  async getTags(): Promise<string[]> {
    try {
      const tags = await this.git.tags();
      return tags.all;
    } catch (error) {
      this.logger.error('获取标签列表失败', error);
      throw error;
    }
  }

  /**
   * 检查 stash
   */
  async stashList(): Promise<any> {
    try {
      return await this.git.stashList();
    } catch (error) {
      this.logger.error('获取 stash 列表失败', error);
      throw error;
    }
  }

  /**
   * 保存到 stash
   */
  async stash(message?: string): Promise<void> {
    try {
      if (message) {
        await this.git.stash(['save', message]);
      } else {
        await this.git.stash();
      }
      this.logger.info(success('保存到 stash 成功'));
    } catch (error) {
      this.logger.error('保存到 stash 失败', error);
      throw error;
    }
  }

  /**
   * 从 stash 恢复
   */
  async stashPop(): Promise<void> {
    try {
      await this.git.stash(['pop']);
      this.logger.info(success('从 stash 恢复成功'));
    } catch (error) {
      this.logger.error('从 stash 恢复失败', error);
      throw error;
    }
  }

  /**
   * 检查是否有冲突
   */
  async hasConflicts(): Promise<boolean> {
    const status = await this.status();
    return status.conflicted.length > 0;
  }

  /**
   * 获取原始 git 实例（用于高级操作）
   */
  getRawGit(): SimpleGit {
    return this.git;
  }
}
