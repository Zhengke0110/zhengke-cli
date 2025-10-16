import { GitHubClient } from './github-client.js';
import {
    GitHubSearchQuery,
    RepositorySortOrder,
    SortDirection,
    DefaultSearchConfig,
    GitHubErrorMessages,
    RepositoryDefaults,
} from './constants.js';

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
            userOnly = DefaultSearchConfig.USER_ONLY,
            templateOnly = DefaultSearchConfig.TEMPLATE_ONLY,
            maxResults = DefaultSearchConfig.MAX_RESULTS,
        } = options;

        try {
            const octokit = this.client.getOctokit();

            // 构建搜索查询
            const queryParts: string[] = [];

            // 如果只搜索模板仓库，必须加上 is:template
            if (templateOnly) {
                queryParts.push(GitHubSearchQuery.IS_TEMPLATE);
            }

            if (userOnly) {
                const username = await this.client.getAuthenticatedUser();
                queryParts.push(`${GitHubSearchQuery.USER_PREFIX}${username}`);
            }

            if (keyword) {
                queryParts.push(keyword);
            }

            if (language) {
                queryParts.push(`${GitHubSearchQuery.LANGUAGE_PREFIX}${language}`);
            }

            const query = queryParts.join(' ');

            if (!query) {
                throw new Error(GitHubErrorMessages.NO_SEARCH_CRITERIA);
            }

            // 执行搜索
            const { data } = await octokit.search.repos({
                q: query,
                sort: DefaultSearchConfig.SORT,
                order: DefaultSearchConfig.ORDER,
                per_page: Math.min(maxResults, DefaultSearchConfig.PER_PAGE),
            });

            // 转换为模板格式
            const results = data.items.map((repo) => ({
                fullName: repo.full_name,
                name: repo.name,
                owner: repo.owner?.login || RepositoryDefaults.OWNER,
                description: repo.description,
                language: repo.language,
                stars: repo.stargazers_count || RepositoryDefaults.STARS,
                isTemplate: repo.is_template || RepositoryDefaults.IS_TEMPLATE,
                updatedAt: repo.updated_at || RepositoryDefaults.UPDATED_AT,
                url: repo.html_url,
            }));

            // 如果指定了 templateOnly，进行二次过滤确保只返回模板仓库
            if (templateOnly) {
                return results.filter(repo => repo.isTemplate);
            }

            return results;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(GitHubErrorMessages.SEARCH_TEMPLATES_FAILED(error.message));
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
                sort: DefaultSearchConfig.SORT,
                per_page: DefaultSearchConfig.PER_PAGE,
            });

            return data.map((repo) => ({
                fullName: repo.full_name,
                name: repo.name,
                owner: repo.owner?.login || RepositoryDefaults.OWNER,
                description: repo.description,
                language: repo.language || RepositoryDefaults.LANGUAGE,
                stars: repo.stargazers_count || RepositoryDefaults.STARS,
                isTemplate: repo.is_template || RepositoryDefaults.IS_TEMPLATE,
                updatedAt: repo.updated_at || RepositoryDefaults.UPDATED_AT,
                url: repo.html_url,
            }));
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(GitHubErrorMessages.GET_USER_REPOS_FAILED(error.message));
            }
            throw error;
        }
    }
}
