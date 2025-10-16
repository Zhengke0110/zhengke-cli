import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

/**
 * CLI 配置
 */
export interface CliConfig {
    /** GitHub Personal Access Token */
    githubToken?: string;
    /** 默认模板来源 (builtin, npm, github) */
    defaultTemplateSource?: 'builtin' | 'npm' | 'github';
    /** 其他配置 */
    [key: string]: unknown;
}

/**
 * 配置管理器
 */
export class ConfigManager {
    private configDir: string;
    private configPath: string;
    private config: CliConfig;

    constructor() {
        this.configDir = join(homedir(), '.zhengke-cli');
        this.configPath = join(this.configDir, 'config.json');
        this.config = this.loadConfig();
    }

    /**
     * 加载配置
     */
    private loadConfig(): CliConfig {
        try {
            if (!existsSync(this.configPath)) {
                return {};
            }
            const content = readFileSync(this.configPath, 'utf-8');
            return JSON.parse(content);
        } catch {
            return {};
        }
    }

    /**
     * 保存配置
     */
    private saveConfig(): void {
        try {
            if (!existsSync(this.configDir)) {
                mkdirSync(this.configDir, { recursive: true });
            }
            writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to save config: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * 获取配置项
     */
    get<K extends keyof CliConfig>(key: K): CliConfig[K] {
        return this.config[key];
    }

    /**
     * 设置配置项
     */
    set<K extends keyof CliConfig>(key: K, value: CliConfig[K]): void {
        this.config[key] = value;
        this.saveConfig();
    }

    /**
     * 获取所有配置
     */
    getAll(): CliConfig {
        return { ...this.config };
    }

    /**
     * 删除配置项
     */
    delete(key: keyof CliConfig): void {
        delete this.config[key];
        this.saveConfig();
    }

    /**
     * 清空所有配置
     */
    clear(): void {
        this.config = {};
        this.saveConfig();
    }

    /**
     * 获取 GitHub Token
     */
    getGitHubToken(): string | undefined {
        return this.config.githubToken;
    }

    /**
     * 设置 GitHub Token
     */
    setGitHubToken(token: string): void {
        this.set('githubToken', token);
    }

    /**
     * 获取默认模板来源
     */
    getDefaultTemplateSource(): 'builtin' | 'npm' | 'github' | undefined {
        return this.config.defaultTemplateSource;
    }

    /**
     * 设置默认模板来源
     */
    setDefaultTemplateSource(source: 'builtin' | 'npm' | 'github'): void {
        this.set('defaultTemplateSource', source);
    }
}
