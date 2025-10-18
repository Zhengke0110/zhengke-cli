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

// 提交信息模板
export const COMMIT_MESSAGES = {
  INITIAL: 'chore: initial commit',
  RELEASE: 'chore: release',
  DEFAULT: 'chore: update',
  INITIAL_COMMIT: 'chore: initial commit',
  RELEASE_COMMIT: (version: string) => `chore: release ${version}`,
  TAG_MESSAGE: (version: string) => `Release ${version}`,
  RELEASE_PREFIX: 'Release',
} as const;

// 配置相关
export const CONFIG = {
  DIR_NAME: '.zhengke-git',
  ENCODING: 'utf-8',
  JSON_INDENT: 2,
  DEVELOP_BRANCH_PREFIX: 'develop/',
  DEFAULT_REMOTE: 'origin',
  PATH_SEPARATOR: '/',
  OWNER_KEY: 'owner',
} as const;

// 版本管理
export const VERSION_CONFIG = {
  DEFAULT_VERSION: '0.0.0',
  PREFIX: 'v',
  TAG_PREFIX: 'v',
  REGEX_PATTERN: /^v?(\d+\.\d+\.\d+)/,
  CLEAN_PATTERN: /^v/,
} as const;

// Git 操作相关
export const GIT_OPERATIONS = {
  ADD_ALL: '.',
  BRANCH_LIST_OPTIONS: ['-a'],
  TAG_OPTIONS: {
    ANNOTATED: '-a',
    MESSAGE: '-m',
  },
  MERGE_OPTIONS: {
    NO_FF: '--no-ff',
  },
  NO_FF_MERGE: '--no-ff',
  PUSH_OPTIONS: {
    DELETE: '--delete',
    SET_UPSTREAM: '-u',
  },
  CHECKOUT_OPTIONS: {
    NEW_BRANCH: '-b',
  },
} as const;

// 日志消息模板
export const LOG_MESSAGES = {
  // 初始化相关
  REPO_INIT_START: '🚀 开始仓库初始化...',
  REPO_INIT_SUCCESS: '✅ 仓库初始化完成',
  REPO_INIT_FAILED: '❌ 仓库初始化失败',

  GIT_INIT_START: '🚀 开始 Git 初始化...',
  GIT_INIT_SUCCESS: '✅ Git 初始化完成',
  GIT_INIT_FAILED: '❌ Git 初始化失败',

  // 提交相关
  COMMIT_START: '🚀 开始 Git 提交...',
  COMMIT_SUCCESS: (version: string) => `✅ Git 提交完成，版本: ${version}`,
  COMMIT_SUCCESS_NO_VERSION: '✅ Git 提交成功',
  COMMIT_FAILED: '❌ Git 提交失败',

  // 发布相关
  PUBLISH_START: '🚀 开始 Git 推送...',
  PUBLISH_SUCCESS: (version: string) => `✅ Git 推送完成，版本: ${version}`,
  PUBLISH_FAILED: '❌ Git 推送失败',

  // 警告信息
  EXISTING_REPO_WARNING: '⚠️  当前目录已是 Git 仓库',
  CONFIG_IMPACT_WARNING: '⚠️  继续操作可能会影响现有的 Git 配置！',
  STASH_WARNING: '检测到 stash 区有未提交的内容',
  STASH_DETECTED: '检测到 stash 区有未提交的内容',

  // 操作成功信息
  GITFLOW_INIT_SUCCESS: 'GitFlow 初始化成功',
  CODE_DETECTED: '检测到未提交的代码',
  UNCOMMITTED_CODE: '检测到未提交的代码',
  INITIAL_PUSH_SUCCESS: '初始提交已推送到主分支',
  INITIAL_COMMIT_PUSHED: '初始提交已推送到主分支',
  MAIN_BRANCH_SET: (branch: string) => `已设置 ${branch} 为默认分支`,

  // 分支相关
  DEVELOP_BRANCH_EXISTS: (branch: string) => `开发分支 ${branch} 已存在，切换到该分支`,
  AUTO_SELECT_BRANCH: (branch: string) => `自动选择开发分支: ${branch}`,
  AUTO_SELECT_DEVELOP: '自动选择开发分支',
  REMOTE_BRANCH_CHECKOUT: (branch: string) => `检出远程开发分支: ${branch}`,
  CHECKOUT_REMOTE_DEVELOP: '检出远程开发分支',
  BRANCH_MERGED: (source: string) => `开发分支 ${source} 已合并到主分支`,
  DEVELOP_MERGED: '开发分支',
  MERGED_TO_MAIN: '已合并到主分支',

  // 删除分支相关
  SKIP_DELETE_DEFAULT: (branch: string) => `⚠️ 跳过删除远程分支 ${branch}：该分支可能是仓库的默认分支`,

  // 错误信息
  CONFLICTS_ERROR: '存在代码冲突，请先解决冲突',
  NO_DEVELOP_BRANCH: '未找到开发分支，请先执行 git:commit 创建开发分支',
  MERGE_MAIN_WARNING: '合并主分支时出现问题，可能是首次提交',

  // 配置相关
  CONFIG_OWNER_MISSING: '无法获取仓库所有者信息，跳过设置默认分支',
  NO_OWNER_INFO: '无法获取仓库所有者信息，跳过设置默认分支',
  CONFIG_REPO_MISSING: '无法获取仓库名称，跳过设置默认分支',
  NO_REPO_NAME: '无法获取仓库名称，跳过设置默认分支',
  DEFAULT_BRANCH_SET: '✓ 已设置',
  AS_DEFAULT_BRANCH: '为默认分支',
  SET_DEFAULT_BRANCH_FAILED: (error: any) => `设置默认分支失败: ${error}`,

  // 工作流相关
  FULL_FLOW_START: '🚀 开始完整 GitFlow 工作流...',
  GIT_REPO_INIT_SUCCESS: '✅ Git 仓库初始化成功',

  // .gitignore 相关
  GITIGNORE_EXISTS: '✓ .gitignore 文件已存在',
  GITIGNORE_CREATED: '✓ .gitignore 文件创建成功',
} as const;

// 错误信息
export const ERROR_MESSAGES = {
  REFUSING_DELETE_BRANCH: 'refusing to delete the current branch',
  REMOTE_REJECTED: 'remote rejected',
  CONFLICTS_EXIST: '存在代码冲突，请先解决冲突',
  NO_DEVELOP_BRANCH: '未找到开发分支，请先执行 git:commit 创建开发分支',
  COMMIT_FAILED: '❌ Git 提交失败',
  PUBLISH_FAILED: '❌ Git 推送失败',
  DEFAULT_BRANCH_FAILED: '设置默认分支失败',
  GITFLOW_FAILED: '❌ GitFlow 工作流失败',
} as const;

// .gitignore 默认模板
export const GITIGNORE_TEMPLATE = `# Dependencies
node_modules/
bower_components/
jspm_packages/

# Build outputs
dist/
build/
out/
*.log
*.pid
*.seed
*.pid.lock

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Environment
.env
.env.local
.env.*.local

# Test coverage
coverage/
.nyc_output/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Misc
*.pem
.cache/
.temp/
.tmp/
`;

// .github/release.yml 默认模板
export const RELEASE_YML_TEMPLATE = `# GitHub Release Notes 自动生成配置
# https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes

changelog:
  exclude:
    labels:
      - ignore-for-release
      - duplicate
      - invalid
      - wontfix
    authors:
      - dependabot

  categories:
    - title: 💥 Breaking Changes
      labels:
        - breaking
        - breaking-change
        - semver-major

    - title: ✨ New Features
      labels:
        - feat
        - feature
        - enhancement
        - semver-minor

    - title: 🐛 Bug Fixes
      labels:
        - fix
        - bug
        - bugfix
        - semver-patch

    - title: 📚 Documentation
      labels:
        - docs
        - documentation

    - title: 🔧 Chores & Maintenance
      labels:
        - chore
        - refactor
        - style
        - test
        - ci

    - title: 📦 Dependencies
      labels:
        - dependencies
        - deps

    - title: Other Changes
      labels:
        - "*"
`;

// Release 相关配置
export const RELEASE_CONFIG = {
  ENABLED: true,
  AUTO_GENERATE_NOTES: true,
  USE_CUSTOM_BODY: true, // 使用自定义 Release Body（基于提交记录）
  CREATE_DISCUSSION: false,
  SKIP_ON_ERROR: true, // Release 创建失败不中断发布流程
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000, // 毫秒
  PRERELEASE_PATTERN: /-(alpha|beta|rc|pre)/i,
} as const;

// Release 消息模板
export const RELEASE_MESSAGES = {
  CREATING: '正在创建 GitHub Release...',
  SUCCESS: (url: string) => `GitHub Release 创建成功: ${url}`,
  FAILED: (error: string) => `创建 GitHub Release 失败: ${error}`,
  SKIPPED: 'GitHub Release 创建失败，但不影响发布流程',
  CHECKING: '检查 Release 配置...',
  NO_CONFIG: '未找到 .github/release.yml 配置文件，将使用 GitHub 默认配置',
} as const;
