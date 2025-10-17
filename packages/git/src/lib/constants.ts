/**
 * Git 相关常量
 */

// Git 平台类型
export enum GitPlatform {
  GITHUB = 'github',
  GITEE = 'gitee',
}

// 仓库类型
export enum RepoType {
  USER = 'user',
  ORG = 'org',
}

// 版本类型
export enum VersionType {
  MAJOR = 'major',
  MINOR = 'minor',
  PATCH = 'patch',
}

// 分支类型
export enum BranchType {
  FEATURE = 'feature',
  BUGFIX = 'bugfix',
  HOTFIX = 'hotfix',
  RELEASE = 'release',
}

// Git 配置文件
export const GIT_CONFIG_FILES = {
  PLATFORM: '.git_platform',
  OWN: '.git_own',
  LOGIN: '.git_login',
  TOKEN: '.git_token',
} as const;

// Git 默认配置
export const GIT_DEFAULTS = {
  MAIN_BRANCH: 'main',
  MASTER_BRANCH: 'master',
  DEVELOP_BRANCH: 'develop',
  REMOTE_NAME: 'origin',
} as const;

// Git 提交信息前缀
export const COMMIT_TYPES = {
  FEAT: 'feat',
  FIX: 'fix',
  DOCS: 'docs',
  STYLE: 'style',
  REFACTOR: 'refactor',
  PERF: 'perf',
  TEST: 'test',
  CHORE: 'chore',
} as const;

// API 端点
export const API_ENDPOINTS = {
  GITHUB: 'https://api.github.com',
  GITEE: 'https://gitee.com/api/v5',
} as const;
