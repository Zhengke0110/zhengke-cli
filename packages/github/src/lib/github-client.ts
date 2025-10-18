import { Octokit } from '@octokit/rest';
import { GitHubErrorMessages } from './constants.js';

/**
 * Release 信息接口
 */
export interface ReleaseInfo {
    id: number;
    tagName: string;
    name: string;
    body: string;
    htmlUrl: string;
    publishedAt: string;
    draft: boolean;
    prerelease: boolean;
}

/**
 * 创建 Release 选项
 */
export interface CreateReleaseOptions {
    tagName: string;
    targetCommitish?: string;
    name: string;
    body?: string;
    draft?: boolean;
    prerelease?: boolean;
    generateReleaseNotes?: boolean;
    previousTagName?: string;
}

/**
 * GitHub API 客户端
 */
export class GitHubClient {
    private octokit: Octokit;
    private authenticatedUser: string | null = null;

    constructor(token?: string) {
        this.octokit = new Octokit({
            auth: token,
        });
    }

    /**
     * 获取 Octokit 实例
     */
    getOctokit(): Octokit {
        return this.octokit;
    }

    /**
     * 获取当前认证用户信息
     */
    async getAuthenticatedUser(): Promise<string> {
        if (this.authenticatedUser) {
            return this.authenticatedUser;
        }

        try {
            const { data } = await this.octokit.users.getAuthenticated();
            this.authenticatedUser = data.login;
            return this.authenticatedUser;
        } catch {
            throw new Error(GitHubErrorMessages.GET_AUTHENTICATED_USER_FAILED);
        }
    }

    /**
     * 验证 token 是否有效
     */
    async validateToken(): Promise<boolean> {
        try {
            await this.getAuthenticatedUser();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 创建 GitHub Release
     * @param owner 仓库所有者
     * @param repo 仓库名称
     * @param options Release 选项
     * @returns Release 信息
     */
    async createRelease(
        owner: string,
        repo: string,
        options: CreateReleaseOptions
    ): Promise<ReleaseInfo> {
        try {
            const { data } = await this.octokit.repos.createRelease({
                owner,
                repo,
                tag_name: options.tagName,
                target_commitish: options.targetCommitish,
                name: options.name,
                body: options.body || '',
                draft: options.draft || false,
                prerelease: options.prerelease || false,
                generate_release_notes: options.generateReleaseNotes ?? true,
                ...(options.previousTagName && { previous_tag_name: options.previousTagName }),
            });

            return {
                id: data.id,
                tagName: data.tag_name,
                name: data.name || '',
                body: data.body || '',
                htmlUrl: data.html_url,
                publishedAt: data.published_at || '',
                draft: data.draft,
                prerelease: data.prerelease,
            };
        } catch (error: any) {
            throw new Error(
                GitHubErrorMessages.CREATE_RELEASE_FAILED(error.message || 'Unknown error')
            );
        }
    }

    /**
     * 获取最新的 Release
     * @param owner 仓库所有者
     * @param repo 仓库名称
     * @returns Release 信息，如果没有则返回 null
     */
    async getLatestRelease(owner: string, repo: string): Promise<ReleaseInfo | null> {
        try {
            const { data } = await this.octokit.repos.getLatestRelease({
                owner,
                repo,
            });

            return {
                id: data.id,
                tagName: data.tag_name,
                name: data.name || '',
                body: data.body || '',
                htmlUrl: data.html_url,
                publishedAt: data.published_at || '',
                draft: data.draft,
                prerelease: data.prerelease,
            };
        } catch (error: any) {
            if (error.status === 404) {
                return null;
            }
            throw new Error(
                GitHubErrorMessages.GET_LATEST_RELEASE_FAILED(error.message || 'Unknown error')
            );
        }
    }

    /**
     * 检查 Release 是否存在
     * @param owner 仓库所有者
     * @param repo 仓库名称
     * @param tagName 标签名称
     * @returns 是否存在
     */
    async releaseExists(owner: string, repo: string, tagName: string): Promise<boolean> {
        try {
            await this.octokit.repos.getReleaseByTag({
                owner,
                repo,
                tag: tagName,
            });
            return true;
        } catch (error: any) {
            if (error.status === 404) {
                return false;
            }
            throw error;
        }
    }
}
