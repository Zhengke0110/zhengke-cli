/**
 * Git 平台抽象接口
 * 支持 GitHub 和 Gitee
 */

import { GitPlatform, RepoType } from './constants.js';

/**
 * 用户信息
 */
export interface UserInfo {
  login: string;
  name: string;
  email?: string;
  avatar?: string;
}

/**
 * 组织信息
 */
export interface OrgInfo {
  login: string;
  name: string;
  description?: string;
  avatar?: string;
}

/**
 * 仓库信息
 */
export interface RepoInfo {
  name: string;
  fullName: string;
  description?: string;
  private: boolean;
  url: string;
  sshUrl: string;
  cloneUrl: string;
  defaultBranch: string;
  owner: {
    login: string;
    type: 'User' | 'Organization';
  };
}

/**
 * 创建仓库的选项
 */
export interface CreateRepoOptions {
  name: string;
  description?: string;
  private?: boolean;
  autoInit?: boolean;
  gitignoreTemplate?: string;
  owner?: string; // 组织名称，如果是组织仓库
}

/**
 * Git 平台客户端接口
 */
export interface IGitPlatformClient {
  /**
   * 平台类型
   */
  readonly platform: GitPlatform;

  /**
   * 设置访问令牌
   */
  setToken(token: string): void;

  /**
   * 获取当前用户信息
   */
  getCurrentUser(): Promise<UserInfo>;

  /**
   * 获取用户的组织列表
   */
  getUserOrgs(): Promise<OrgInfo[]>;

  /**
   * 检查仓库是否存在
   */
  repoExists(owner: string, repo: string): Promise<boolean>;

  /**
   * 创建个人仓库
   */
  createUserRepo(options: CreateRepoOptions): Promise<RepoInfo>;

  /**
   * 创建组织仓库
   */
  createOrgRepo(org: string, options: CreateRepoOptions): Promise<RepoInfo>;

  /**
   * 获取仓库信息
   */
  getRepo(owner: string, repo: string): Promise<RepoInfo>;

  /**
   * 删除仓库
   */
  deleteRepo(owner: string, repo: string): Promise<void>;

  /**
   * 获取仓库的 SSH URL
   */
  getRepoSshUrl(owner: string, repo: string): Promise<string>;

  /**
   * 获取仓库 HTTPS URL
   */
  getRepoHttpsUrl(owner: string, repo: string): Promise<string>;

  /**
   * 更新仓库的默认分支
   */
  updateDefaultBranch(owner: string, repo: string, defaultBranch: string): Promise<void>;
}

/**
 * Git 平台配置
 */
export interface GitPlatformConfig {
  platform: GitPlatform;
  token?: string;
  baseUrl?: string; // 用于企业版或私有部署
}
