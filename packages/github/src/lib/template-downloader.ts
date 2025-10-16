import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { GitHubTemplate } from './template-searcher.js';

/**
 * 下载选项
 */
export interface DownloadOptions {
  /** 目标目录 */
  targetDir: string;
  /** 是否强制覆盖 */
  force?: boolean;
  /** 是否缓存 */
  cache?: boolean;
  /** 详细模式 */
  verbose?: boolean;
}

/**
 * GitHub 模板下载器
 */
export class TemplateDownloader {
  /**
   * 下载 GitHub 仓库模板
   * @param repoFullName 仓库全名 (owner/repo) 或完整的 GitHub URL
   * @param options 下载选项
   */
  async download(
    repoFullName: string,
    options: DownloadOptions
  ): Promise<void> {
    const { targetDir, force = false, verbose = false } = options;

    try {
      // 从 URL 或完整名称提取仓库信息
      const repo = this.parseRepoIdentifier(repoFullName);

      // 检查目标目录是否存在
      if (existsSync(targetDir)) {
        if (force) {
          rmSync(targetDir, { recursive: true, force: true });
        } else {
          throw new Error(`Target directory ${targetDir} already exists. Use force option to overwrite.`);
        }
      }

      // 构建 GitHub URL
      const githubUrl = `https://github.com/${repo}.git`;

      // 使用 git clone --depth 1 下载
      const cloneCmd = `git clone --depth 1 ${githubUrl} "${targetDir}"`;

      if (verbose) {
        console.log(`执行命令: ${cloneCmd}`);
      }

      execSync(cloneCmd, {
        stdio: verbose ? 'inherit' : 'pipe',
        encoding: 'utf-8'
      });

      // 删除 .git 目录
      const gitDir = join(targetDir, '.git');
      if (existsSync(gitDir)) {
        rmSync(gitDir, { recursive: true, force: true });
      }

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to download template: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 从 GitHubTemplate 对象下载
   */
  async downloadFromTemplate(
    template: GitHubTemplate,
    options: DownloadOptions
  ): Promise<void> {
    return this.download(template.fullName, options);
  }

  /**
   * 解析仓库标识符
   * 支持以下格式:
   * - owner/repo
   * - https://github.com/owner/repo
   * - git@github.com:owner/repo.git
   */
  private parseRepoIdentifier(identifier: string): string {
    // 如果是 URL，提取 owner/repo
    if (identifier.startsWith('http')) {
      const match = identifier.match(/github\.com\/([^/]+\/[^/]+)/);
      if (match) {
        return match[1].replace(/\.git$/, '');
      }
    }

    // 如果是 git@ 格式
    if (identifier.startsWith('git@')) {
      const match = identifier.match(/github\.com:([^/]+\/[^/]+)/);
      if (match) {
        return match[1].replace(/\.git$/, '');
      }
    }

    // 默认认为是 owner/repo 格式
    return identifier;
  }
}
