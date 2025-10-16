import { Octokit } from '@octokit/rest';
import { GitHubErrorMessages } from './constants.js';

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
}
