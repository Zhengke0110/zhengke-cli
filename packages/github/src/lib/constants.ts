/**
 * GitHub 包常量定义
 */

/**
 * GitHub API 常量
 */
export const GitHubApi = {
    BASE_URL: 'https://github.com',
    GIT_EXTENSION: '.git',
    DEFAULT_BRANCH: 'main',
    MAX_RESULTS_PER_PAGE: 100,
} as const;

/**
 * Git 相关常量
 */
export const GitConstants = {
    GIT_DIR: '.git',
    CLONE_DEPTH: 1,
} as const;

/**
 * 搜索查询关键字
 */
export const GitHubSearchQuery = {
    IS_TEMPLATE: 'is:template',
    USER_PREFIX: 'user:',
    LANGUAGE_PREFIX: 'language:',
} as const;

/**
 * 仓库排序选项
 */
export enum RepositorySortOrder {
    UPDATED = 'updated',
    CREATED = 'created',
    STARS = 'stars',
    FORKS = 'forks',
}

/**
 * 排序方向
 */
export enum SortDirection {
    ASC = 'asc',
    DESC = 'desc',
}

/**
 * 默认搜索配置
 */
export const DefaultSearchConfig = {
    USER_ONLY: true,
    TEMPLATE_ONLY: false,
    MAX_RESULTS: 30,
    SORT: RepositorySortOrder.UPDATED,
    ORDER: SortDirection.DESC,
    PER_PAGE: 100,
} as const;

/**
 * 默认下载配置
 */
export const DefaultDownloadConfig = {
    FORCE: false,
    CACHE: false,
    VERBOSE: false,
} as const;

/**
 * 错误消息常量
 */
export const GitHubErrorMessages = {
    NO_SEARCH_CRITERIA: 'At least one search criteria must be provided',
    SEARCH_TEMPLATES_FAILED: (error: string) => `Failed to search GitHub templates: ${error}`,
    GET_USER_REPOS_FAILED: (error: string) => `Failed to get user repositories: ${error}`,
    GET_AUTHENTICATED_USER_FAILED: 'Failed to get authenticated user. Please check your GitHub token.',
    DOWNLOAD_TEMPLATE_FAILED: (error: string) => `Failed to download template: ${error}`,
    TARGET_DIR_EXISTS: (dir: string) => `Target directory ${dir} already exists. Use force option to overwrite.`,
    CREATE_RELEASE_FAILED: (error: string) => `Failed to create GitHub release: ${error}`,
    GET_LATEST_RELEASE_FAILED: (error: string) => `Failed to get latest release: ${error}`,
} as const;

/**
 * Git 命令模板
 */
export const GitCommands = {
    CLONE_SHALLOW: (url: string, targetDir: string) =>
        `git clone --depth ${GitConstants.CLONE_DEPTH} ${url} "${targetDir}"`,
} as const;

/**
 * URL 正则表达式
 */
export const UrlPatterns = {
    GITHUB_HTTP: /github\.com\/([^/]+\/[^/]+)/,
    GITHUB_SSH: /github\.com:([^/]+\/[^/]+)/,
    GIT_EXTENSION: /\.git$/,
} as const;

/**
 * 仓库信息默认值
 */
export const RepositoryDefaults = {
    OWNER: '',
    DESCRIPTION: null,
    LANGUAGE: null,
    STARS: 0,
    IS_TEMPLATE: false,
    UPDATED_AT: '',
} as const;