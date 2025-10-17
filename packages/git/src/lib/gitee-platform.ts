/**
 * Gitee 平台实现
 */

import axios, { AxiosInstance } from 'axios';
import { GitPlatform, API_ENDPOINTS } from './constants.js';
import {
  IGitPlatformClient,
  UserInfo,
  OrgInfo,
  RepoInfo,
  CreateRepoOptions,
  GitPlatformConfig,
} from './git-platform.js';
import { createLogger, success, type Logger } from '@zhengke0110/utils';

export class GiteePlatform implements IGitPlatformClient {
  readonly platform = GitPlatform.GITEE;
  private client: AxiosInstance;
  private token: string;
  private logger: Logger;

  constructor(config: GitPlatformConfig) {
    this.logger = createLogger({ service: 'GiteePlatform' });
    this.token = config.token || '';

    this.client = axios.create({
      baseURL: config.baseUrl || API_ENDPOINTS.GITEE,
      timeout: 10000,
    });

    if (config.token) {
      this.logger.info(success('Gitee 客户端初始化成功'));
    }
  }

  setToken(token: string): void {
    this.token = token;
    this.logger.info(success('Gitee Token 已更新'));
  }

  async getCurrentUser(): Promise<UserInfo> {
    try {
      const { data } = await this.client.get('/user', {
        params: { access_token: this.token },
      });

      return {
        login: data.login,
        name: data.name || data.login,
        email: data.email || undefined,
        avatar: data.avatar_url,
      };
    } catch (error) {
      this.logger.error('获取 Gitee 用户信息失败', error);
      throw error;
    }
  }

  async getUserOrgs(): Promise<OrgInfo[]> {
    try {
      const { data } = await this.client.get('/user/orgs', {
        params: { access_token: this.token },
      });

      return data.map((org: any) => ({
        login: org.login,
        name: org.name || org.login,
        description: org.description || undefined,
        avatar: org.avatar_url,
      }));
    } catch (error) {
      this.logger.error('获取 Gitee 组织列表失败', error);
      throw error;
    }
  }

  async repoExists(owner: string, repo: string): Promise<boolean> {
    try {
      await this.client.get(`/repos/${owner}/${repo}`, {
        params: { access_token: this.token },
      });
      return true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false;
      }
      this.logger.error('检查 Gitee 仓库是否存在失败', error);
      throw error;
    }
  }

  async createUserRepo(options: CreateRepoOptions): Promise<RepoInfo> {
    try {
      const { data } = await this.client.post(
        '/user/repos',
        {
          name: options.name,
          description: options.description,
          private: options.private ?? false,
          auto_init: options.autoInit ?? false,
          gitignore_template: options.gitignoreTemplate,
        },
        {
          params: { access_token: this.token },
        }
      );

      this.logger.info(success(`Gitee 个人仓库创建成功: ${data.full_name}`));

      return this.mapRepoData(data);
    } catch (error) {
      this.logger.error('创建 Gitee 个人仓库失败', error);
      throw error;
    }
  }

  async createOrgRepo(org: string, options: CreateRepoOptions): Promise<RepoInfo> {
    try {
      const { data } = await this.client.post(
        `/orgs/${org}/repos`,
        {
          name: options.name,
          description: options.description,
          private: options.private ?? false,
          auto_init: options.autoInit ?? false,
          gitignore_template: options.gitignoreTemplate,
        },
        {
          params: { access_token: this.token },
        }
      );

      this.logger.info(success(`Gitee 组织仓库创建成功: ${data.full_name}`));

      return this.mapRepoData(data);
    } catch (error) {
      this.logger.error('创建 Gitee 组织仓库失败', error);
      throw error;
    }
  }

  async getRepo(owner: string, repo: string): Promise<RepoInfo> {
    try {
      const { data } = await this.client.get(`/repos/${owner}/${repo}`, {
        params: { access_token: this.token },
      });

      return this.mapRepoData(data);
    } catch (error) {
      this.logger.error('获取 Gitee 仓库信息失败', error);
      throw error;
    }
  }

  async deleteRepo(owner: string, repo: string): Promise<void> {
    try {
      await this.client.delete(`/repos/${owner}/${repo}`, {
        params: { access_token: this.token },
      });

      this.logger.info(success(`Gitee 仓库删除成功: ${owner}/${repo}`));
    } catch (error) {
      this.logger.error('删除 Gitee 仓库失败', error);
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
   * 映射 Gitee API 返回的仓库数据
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
      defaultBranch: data.default_branch || 'master',
      owner: {
        login: data.owner.login,
        type: data.owner.type === 'organization' ? 'Organization' : 'User',
      },
    };
  }

  /**
   * 更新仓库的默认分支
   */
  async updateDefaultBranch(owner: string, repo: string, defaultBranch: string): Promise<void> {
    try {
      await this.client.patch(`/repos/${owner}/${repo}`, {
        default_branch: defaultBranch,
      });
    } catch (error) {
      throw new Error(`更新默认分支失败: ${error}`);
    }
  }

  /**
   * 获取原始 Axios 实例（用于高级操作）
   */
  getRawClient(): AxiosInstance {
    return this.client;
  }
}
