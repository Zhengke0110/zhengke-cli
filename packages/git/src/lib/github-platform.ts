/**
 * GitHub 平台实现
 */

import { Octokit } from '@octokit/rest';
import { GitPlatform } from './constants.js';
import {
  IGitPlatformClient,
  UserInfo,
  OrgInfo,
  RepoInfo,
  CreateRepoOptions,
  GitPlatformConfig,
} from './git-platform.js';
import { createLogger, success, type Logger } from '@zhengke0110/utils';

export class GitHubPlatform implements IGitPlatformClient {
  readonly platform = GitPlatform.GITHUB;
  private octokit: Octokit;
  private logger: Logger;

  constructor(config: GitPlatformConfig) {
    this.logger = createLogger({ service: 'GitHubPlatform' });
    
    this.octokit = new Octokit({
      auth: config.token,
      baseUrl: config.baseUrl || 'https://api.github.com',
    });

    if (config.token) {
      this.logger.info(success('GitHub 客户端初始化成功'));
    }
  }

  setToken(token: string): void {
    this.octokit = new Octokit({
      auth: token,
      baseUrl: this.octokit.request.endpoint.DEFAULTS.baseUrl,
    });
    this.logger.info(success('GitHub Token 已更新'));
  }

  async getCurrentUser(): Promise<UserInfo> {
    try {
      const { data } = await this.octokit.users.getAuthenticated();
      return {
        login: data.login,
        name: data.name || data.login,
        email: data.email || undefined,
        avatar: data.avatar_url,
      };
    } catch (error) {
      this.logger.error('获取 GitHub 用户信息失败', error);
      throw error;
    }
  }

  async getUserOrgs(): Promise<OrgInfo[]> {
    try {
      const { data } = await this.octokit.orgs.listForAuthenticatedUser();
      return data.map((org) => ({
        login: org.login,
        name: org.login,
        description: org.description || undefined,
        avatar: org.avatar_url,
      }));
    } catch (error) {
      this.logger.error('获取 GitHub 组织列表失败', error);
      throw error;
    }
  }

  async repoExists(owner: string, repo: string): Promise<boolean> {
    try {
      await this.octokit.repos.get({ owner, repo });
      return true;
    } catch (error: any) {
      if (error.status === 404) {
        return false;
      }
      this.logger.error('检查 GitHub 仓库是否存在失败', error);
      throw error;
    }
  }

  async createUserRepo(options: CreateRepoOptions): Promise<RepoInfo> {
    try {
      const { data } = await this.octokit.repos.createForAuthenticatedUser({
        name: options.name,
        description: options.description,
        private: options.private ?? false,
        auto_init: options.autoInit ?? false,
        gitignore_template: options.gitignoreTemplate,
      });

      this.logger.info(success(`GitHub 个人仓库创建成功: ${data.full_name}`));

      return this.mapRepoData(data);
    } catch (error) {
      this.logger.error('创建 GitHub 个人仓库失败', error);
      throw error;
    }
  }

  async createOrgRepo(org: string, options: CreateRepoOptions): Promise<RepoInfo> {
    try {
      const { data } = await this.octokit.repos.createInOrg({
        org,
        name: options.name,
        description: options.description,
        private: options.private ?? false,
        auto_init: options.autoInit ?? false,
        gitignore_template: options.gitignoreTemplate,
      });

      this.logger.info(success(`GitHub 组织仓库创建成功: ${data.full_name}`));

      return this.mapRepoData(data);
    } catch (error) {
      this.logger.error('创建 GitHub 组织仓库失败', error);
      throw error;
    }
  }

  async getRepo(owner: string, repo: string): Promise<RepoInfo> {
    try {
      const { data } = await this.octokit.repos.get({ owner, repo });
      return this.mapRepoData(data);
    } catch (error) {
      this.logger.error('获取 GitHub 仓库信息失败', error);
      throw error;
    }
  }

  async deleteRepo(owner: string, repo: string): Promise<void> {
    try {
      await this.octokit.repos.delete({ owner, repo });
      this.logger.info(success(`GitHub 仓库删除成功: ${owner}/${repo}`));
    } catch (error) {
      this.logger.error('删除 GitHub 仓库失败', error);
      throw error;
    }
  }

  async getRepoSshUrl(owner: string, repo: string): Promise<string> {
    const repoInfo = await this.getRepo(owner, repo);
    return repoInfo.sshUrl;
  }

  async getRepoHttpsUrl(owner: string, repo: string): Promise<string> {
    const repoInfo = await this.getRepo(owner, repo);
    return repoInfo.cloneUrl;
  }

  /**
   * 映射 GitHub API 返回的仓库数据
   */
  private mapRepoData(data: any): RepoInfo {
    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description || undefined,
      private: data.private,
      url: data.html_url,
      sshUrl: data.ssh_url,
      cloneUrl: data.clone_url,
      defaultBranch: data.default_branch || 'main',
      owner: {
        login: data.owner.login,
        type: data.owner.type === 'Organization' ? 'Organization' : 'User',
      },
    };
  }

  /**
   * 更新仓库的默认分支
   */
  async updateDefaultBranch(owner: string, repo: string, defaultBranch: string): Promise<void> {
    try {
      await this.octokit.rest.repos.update({
        owner,
        repo,
        default_branch: defaultBranch,
      });
    } catch (error) {
      throw new Error(`更新默认分支失败: ${error}`);
    }
  }

  /**
   * 获取原始 Octokit 实例（用于高级操作）
   */
  getRawClient(): Octokit {
    return this.octokit;
  }
}
