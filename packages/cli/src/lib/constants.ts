/**
 * CLI 常量和枚举定义
 */

/**
 * 模板来源类型
 */
export enum TemplateSource {
    /** npm 内置模板 */
    NPM = 'npm',
    /** GitHub 仓库模板 */
    GITHUB = 'github',
}

/**
 * 日志级别枚举
 */
export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug',
    VERBOSE = 'verbose',
}

/**
 * 命令行参数
 */
export enum CliArguments {
    DEBUG = '--debug',
}

/**
 * 环境变量
 */
export enum EnvironmentVariables {
    LOG_LEVEL = 'LOG_LEVEL',
}

/**
 * 编程语言选项
 */
export enum ProgrammingLanguage {
    ALL = '',
    JAVASCRIPT = 'JavaScript',
    TYPESCRIPT = 'TypeScript',
    JAVA = 'Java',
    PYTHON = 'Python',
    GO = 'Go',
    RUST = 'Rust',
    CPP = 'C++',
    CSHARP = 'C#',
    PHP = 'PHP',
    RUBY = 'Ruby',
    VUE = 'Vue',
    HTML = 'HTML',
}

/**
 * 编程语言显示名称
 */
export const ProgrammingLanguageLabels: Record<ProgrammingLanguage, string> = {
    [ProgrammingLanguage.ALL]: '全部',
    [ProgrammingLanguage.JAVASCRIPT]: 'JavaScript',
    [ProgrammingLanguage.TYPESCRIPT]: 'TypeScript',
    [ProgrammingLanguage.JAVA]: 'Java',
    [ProgrammingLanguage.PYTHON]: 'Python',
    [ProgrammingLanguage.GO]: 'Go',
    [ProgrammingLanguage.RUST]: 'Rust',
    [ProgrammingLanguage.CPP]: 'C++',
    [ProgrammingLanguage.CSHARP]: 'C#',
    [ProgrammingLanguage.PHP]: 'PHP',
    [ProgrammingLanguage.RUBY]: 'Ruby',
    [ProgrammingLanguage.VUE]: 'Vue',
    [ProgrammingLanguage.HTML]: 'HTML',
};

/**
 * CLI 启动消息
 */
export const CliMessages = {
    DEBUG_ENABLED: 'Debug 模式已启用',
    NODE_VERSION: (version: string) => `Node.js 版本: ${version}`,
} as const;

/**
 * UI 消息常量
 */
export const Messages = {
    /** 成功消息 */
    SUCCESS: {
        PROJECT_INITIALIZED: '✨ 项目初始化成功！',
        TEMPLATE_DOWNLOADED: '✓ 模板下载完成',
        TOKEN_SAVED: '✓ Token 已保存到 ~/.zhengke-cli/config.json',
        GITHUB_LOGGED_IN: (username: string) => `✓ 已登录 GitHub: ${username}`,
        FOUND_REPOS: (count: number) => `✓ 找到 ${count} 个仓库`,
        TEMPLATE_SELECTED: (name: string) => `✓ 已选择模板: ${name}`,
    },

    /** 错误消息 */
    ERROR: {
        PROJECT_INIT_FAILED: '项目初始化失败',
        NO_TEMPLATES_FOUND: '✗ 未找到匹配的模板',
        INVALID_GITHUB_TOKEN: '✗ GitHub Token 无效，请检查后重试',
        TEMPLATE_NOT_EXIST: (template: string, available: string) =>
            `模板 "${template}" 不存在。可用模板: ${available}`,
    },

    /** 警告消息 */
    WARNING: {
        NO_GITHUB_TOKEN: '⚠️  未配置 GitHub Token',
        DEPS_INSTALL_FAILED: '⚠️  依赖安装失败，请手动运行 npm install',
    },

    /** 提示消息 */
    INFO: {
        INITIALIZING: '🚀 开始初始化项目...',
        NEXT_STEPS: '接下来的步骤:',
        CD_PROJECT: (name: string) => `  cd ${name}`,
        READ_README: '  # 请根据项目的 README.md 文件指示进行操作',
        GITHUB_TOKEN_GUIDE: '请访问 https://github.com/settings/tokens 创建一个 Personal Access Token',
        GITHUB_TOKEN_PERMISSION: 'Token 权限需要: repo (读取仓库信息)',
        SEARCHING_GITHUB: '🔍 正在搜索您的 GitHub 仓库...',
        DOWNLOADING_TEMPLATE: (name: string) => `📥 正在下载模板: ${name}...`,
        CREATE_TEMPLATE_TIP: '提示: 您可以在 GitHub 上创建模板仓库，然后重试',
    },

    /** 调试消息 */
    DEBUG: {
        INIT_START: '开始执行 init 命令',
        INIT_END: 'init 命令执行完成',
        FETCH_TEMPLATES: '步骤 1: 获取可用模板',
        SELECT_TEMPLATE: '步骤 2: 选择模板',
        DOWNLOAD_TEMPLATE: '步骤 3: 下载模板',
        INSTALL_TEMPLATE: '步骤 4: 安装项目模板',
        INSTALL_DEPS: '步骤 5: 安装项目依赖',
    },
} as const;

/**
 * Inquirer 提示消息
 */
export const Prompts = {
    SELECT_TEMPLATE_SOURCE: '请选择模板来源:',
    SELECT_TEMPLATE: '选择一个模板:',
    ENTER_GITHUB_TOKEN: '请输入 GitHub Token:',
    SAVE_TOKEN: '是否保存此 Token 以供将来使用?',
    SEARCH_KEYWORD: '搜索关键字 (可选，按 Enter 跳过):',
    SELECT_LANGUAGE: '选择编程语言 (可选):',
    SELECT_PROJECT_TEMPLATE: '请选择项目模板:',
} as const;

/**
 * 验证错误类型
 */
export enum ValidationErrorType {
    PROJECT_NAME = '项目名称',
    TEMPLATE = '模板',
    GITHUB_TOKEN = 'GitHub Token',
    TEMPLATE_SEARCH = '模板搜索',
}

/**
 * 验证错误消息
 */
export const ValidationErrors = {
    PROJECT_NAME_REQUIRED: '项目名称不能为空，请使用 --name 参数指定',
    GITHUB_TOKEN_REQUIRED: '必须提供 GitHub Token 才能搜索您的仓库',
    GITHUB_TOKEN_INVALID: 'Token 验证失败',
    NO_TEMPLATES_FOUND: '没有找到符合条件的模板',
} as const;

/**
 * 配置路径
 */
export const Paths = {
    CONFIG_DIR: '~/.zhengke-cli',
    CONFIG_FILE: '~/.zhengke-cli/config.json',
} as const;

/**
 * GitHub 相关常量
 */
export const GitHub = {
    TOKEN_SETTINGS_URL: 'https://github.com/settings/tokens',
    REQUIRED_PERMISSION: 'repo (读取仓库信息)',
    MAX_SEARCH_RESULTS: 30,
    LIST_PAGE_SIZE: 10,
} as const;
