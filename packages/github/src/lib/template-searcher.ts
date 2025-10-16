import { GitHubClient } from './github-client.js';

/**
 * GitHub 仓库模板信息
 */
export interface GitHubTemplate {
    /** 仓库全名 (owner/repo) */
    fullName: string;
    /** 仓库名称 */
    name: string;
    /** 所有者 */
    owner: string;
    /** 描述 */
    description: string | null;
    /** 主要语言 */
    language: string | null;
    /** Star 数量 */
    stars: number;
    /** 是否是模板仓库 */
    isTemplate: boolean;
    /** 更新时间 */
    updatedAt: string;
    /** 仓库 URL */
    url: string;
}

/**
 * 搜索选项
 */
export interface SearchOptions {
    /** 搜索关键字 */
    keyword?: string;
    /** 编程语言 */
    language?: string;
    /** 只搜索当前用户的仓库 */
    userOnly?: boolean;
    /** 只搜索模板仓库 */
    templateOnly?: boolean;
    /** 最大返回数量 */
    maxResults?: number;
}

/**
 * GitHub 模板搜索器
 */
export class TemplateSearcher {
    constructor(private client: GitHubClient) { }

    /**
     * 搜索 GitHub 模板
     */
    async searchTemplates(options: SearchOptions = {}): Promise<GitHubTemplate[]> {
        const {
            keyword = '',
            language,
            userOnly = true,
            templateOnly = false,
            maxResults = 30,
        } = options;

        try {
            const octokit = this.client.getOctokit();

            // 构建搜索查询
            const queryParts: string[] = [];

            if (keyword) {
                queryParts.push(keyword);
            }

            if (language) {
                queryParts.push(`language:${language}`);
            }

            if (templateOnly) {
                queryParts.push('is:template');
            }

            if (userOnly) {
                const username = await this.client.getAuthenticatedUser();
                queryParts.push(`user:${username}`);
            }

            const query = queryParts.join(' ');

            if (!query) {
                throw new Error('At least one search criteria must be provided');
            }

            // 执行搜索
            const { data } = await octokit.search.repos({
                q: query,
                sort: 'updated',
                order: 'desc',
                per_page: Math.min(maxResults, 100),
            });

            // 转换为模板格式
            return data.items.map((repo) => ({
                fullName: repo.full_name,
                name: repo.name,
                owner: repo.owner?.login || '',
                description: repo.description,
                language: repo.language,
                stars: repo.stargazers_count || 0,
                isTemplate: repo.is_template || false,
                updatedAt: repo.updated_at || '',
                url: repo.html_url,
            }));
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to search GitHub templates: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * 获取用户的所有仓库
     */
    async getUserRepositories(): Promise<GitHubTemplate[]> {
        try {
            const octokit = this.client.getOctokit();
            const username = await this.client.getAuthenticatedUser();

            const { data } = await octokit.repos.listForUser({
                username,
                sort: 'updated',
                per_page: 100,
            });

            return data.map((repo) => ({
                fullName: repo.full_name,
                name: repo.name,
                owner: repo.owner?.login || '',
                description: repo.description,
                language: repo.language || null,
                stars: repo.stargazers_count || 0,
                isTemplate: repo.is_template || false,
                updatedAt: repo.updated_at || '',
                url: repo.html_url,
            }));
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to get user repositories: ${error.message}`);
            }
            throw error;
        }
    }
}
