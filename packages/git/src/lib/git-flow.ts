/**
 * GitFlow 核心逻辑
 * 整合四个阶段：仓库初始化、Git初始化、提交、推送
 */

import { GitClient } from './git-client.js';
import { VersionManager } from './version-manager.js';
import { BranchManager } from './branch-manager.js';
import { RemoteManager } from './remote-manager.js';
import { IGitPlatformClient, RepoInfo } from './git-platform.js';
import {
  GitPlatform,
  RepoType,
  VersionType,
  GIT_CONFIG_FILES,
  COMMIT_MESSAGES,
  CONFIG,
  VERSION_CONFIG,
  LOG_MESSAGES,
  GIT_OPERATIONS,
  ERROR_MESSAGES,
  GITIGNORE_TEMPLATE,
  RELEASE_CONFIG,
  RELEASE_MESSAGES,
  RELEASE_YML_TEMPLATE,
  SMART_CATEGORIZATION_KEYWORDS
} from './constants.js';
import { createLogger, success, type Logger } from '@zhengke0110/utils';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

/**
 * GitFlow 配置选项
 */
export interface GitFlowOptions {
  workDir?: string;
  platform?: GitPlatform;
  token?: string;
}

/**
 * 仓库初始化选项
 */
export interface RepoInitOptions {
  repoName: string;
  repoType: RepoType;
  owner: string;
  description?: string;
  private?: boolean;
}

/**
 * 提交选项
 */
export interface CommitOptions {
  message: string;
  versionType?: VersionType;
  version?: string;
}

/**
 * GitFlow 主类
 */
export class GitFlow {
  private gitClient: GitClient;
  private versionManager: VersionManager;
  private branchManager: BranchManager;
  private remoteManager: RemoteManager;
  private platform: IGitPlatformClient;
  private logger: Logger;
  private workDir: string;

  constructor(
    platform: IGitPlatformClient,
    options: GitFlowOptions = {}
  ) {
    this.workDir = options.workDir || process.cwd();
    this.platform = platform;
    this.logger = createLogger({ service: 'GitFlow' });

    // 初始化各个管理器
    this.gitClient = new GitClient({ baseDir: this.workDir });
    this.versionManager = new VersionManager();
    this.branchManager = new BranchManager({ gitClient: this.gitClient });
    this.remoteManager = new RemoteManager({
      gitClient: this.gitClient,
      platform: this.platform,
    });

    this.logger.info(success(LOG_MESSAGES.GITFLOW_INIT_SUCCESS));
  }

  /**
   * 获取配置文件路径
   */
  private getConfigPath(filename: string): string {
    return path.join(os.homedir(), filename);
  }

  /**
   * 写入配置文件
   */
  private async writeConfig(filePath: string, data: Record<string, any>): Promise<void> {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, CONFIG.JSON_INDENT), CONFIG.ENCODING);
  }

  /**
   * 读取配置文件
   */
  private async readConfig(filePath: string): Promise<Record<string, any>> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  /**
   * 检查当前目录是否已是 Git 仓库
   */
  private async checkExistingRepo(): Promise<boolean> {
    const isRepo = await this.gitClient.isRepo();
    if (isRepo) {
      const remotes = await this.gitClient.getRemotes();
      if (remotes.length > 0) {
        this.logger.warn('⚠️  当前目录已是 Git 仓库');
        this.logger.warn(`   远程仓库: ${remotes.map(r => `${r.name} -> ${r.refs.fetch}`).join(', ')}`);
        return true;
      }
    }
    return false;
  }

  /**
   * 阶段1: 仓库初始化
   * 包括：平台选择、Token设置、用户/组织选择、创建远程仓库
   */
  async initRepository(options: RepoInitOptions): Promise<RepoInfo> {
    this.logger.info('🚀 开始仓库初始化...');

    // 安全检查：警告用户如果已存在 Git 仓库
    const hasExistingRepo = await this.checkExistingRepo();
    if (hasExistingRepo) {
      this.logger.warn('⚠️  继续操作可能会影响现有的 Git 配置！');
    }

    try {
      // 1. 保存平台配置
      const platformPath = this.getConfigPath(GIT_CONFIG_FILES.PLATFORM);
      await this.writeConfig(platformPath, { platform: this.platform.platform });

      // 2. 保存仓库类型
      const ownPath = this.getConfigPath(GIT_CONFIG_FILES.OWN);
      await this.writeConfig(ownPath, { type: options.repoType });

      // 3. 保存登录信息
      const loginPath = this.getConfigPath(GIT_CONFIG_FILES.LOGIN);
      await this.writeConfig(loginPath, { owner: options.owner });

      // 4. 创建远程仓库
      const repoInfo = await this.remoteManager.initRemote(
        options.repoName,
        options.repoType,
        options.owner,
        {
          description: options.description,
          private: options.private,
          autoInit: false,
        }
      );

      // 5. 创建 .gitignore 文件（如果不存在）
      await this.createGitignoreIfNotExists();

      // 6. 创建 .github/release.yml 文件（如果不存在）
      await this.createReleaseYmlIfNotExists();

      this.logger.info(success('✅ 仓库初始化完成'));
      return repoInfo;
    } catch (error) {
      this.logger.error('❌ 仓库初始化失败', error);
      throw error;
    }
  }

  /**
   * 阶段2: Git 初始化
   * 包括：初始化本地仓库、添加远程地址、拉取远程分支
   */
  async initGit(remoteUrl: string): Promise<void> {
    this.logger.info(LOG_MESSAGES.GIT_INIT_START);

    try {
      // 1. 检查是否已经是 Git 仓库
      const isRepo = await this.gitClient.isRepo();

      if (!isRepo) {
        // 2. 初始化 Git 仓库
        await this.gitClient.init();
      }

      // 3. 添加远程仓库地址
      await this.remoteManager.addRemoteIfNotExists(remoteUrl);

      // 4. 检查是否有未提交的代码
      const hasChanges = await this.gitClient.hasUncommittedChanges();
      if (hasChanges) {
        this.logger.info(LOG_MESSAGES.UNCOMMITTED_CODE);

        // 5. 尝试拉取远程主分支（如果远程仓库已有内容）
        try {
          const mainBranch = this.branchManager.getMainBranch();

          // 先 fetch 远程分支信息
          await this.gitClient.fetch(CONFIG.DEFAULT_REMOTE);

          // 检查远程分支是否存在
          const branches = await this.gitClient.getBranches();
          // 远程分支格式是 remotes/origin/main，需要提取分支名
          const remoteBranches = branches.remote
            .map(b => b.replace(/^remotes\//, '').replace(new RegExp(`^${CONFIG.DEFAULT_REMOTE}/`), ''));

          if (remoteBranches.includes(mainBranch) || remoteBranches.includes('master')) {
            // 远程主分支存在，拉取它
            const targetBranch = remoteBranches.includes(mainBranch) ? mainBranch : 'master';

            // 切换到主分支并拉取
            try {
              await this.gitClient.checkout(targetBranch);
            } catch {
              // 如果本地没有该分支，从远程创建
              await this.gitClient.checkoutFromRemote(targetBranch, `${CONFIG.DEFAULT_REMOTE}/${targetBranch}`);
            }

            await this.remoteManager.pull(targetBranch);
            this.logger.info(success(`✅ 已拉取远程${targetBranch}分支`));
          } else {
            // 远程仓库为空，创建初始提交并推送
            await this.createInitialCommit();
          }
        } catch (error) {
          // 如果拉取失败（可能是远程仓库为空），创建初始提交
          this.logger.warn(`⚠️  拉取远程分支失败: ${error instanceof Error ? error.message : String(error)}`);
          await this.createInitialCommit();
        }
      } else {
        // 没有未提交的代码，尝试拉取远程分支
        try {
          await this.gitClient.fetch(CONFIG.DEFAULT_REMOTE);
          const mainBranch = this.branchManager.getMainBranch();
          const branches = await this.gitClient.getBranches();
          const remoteBranches = branches.remote
            .map(b => b.replace(/^remotes\//, '').replace(new RegExp(`^${CONFIG.DEFAULT_REMOTE}/`), ''));

          if (remoteBranches.includes(mainBranch) || remoteBranches.includes('master')) {
            const targetBranch = remoteBranches.includes(mainBranch) ? mainBranch : 'master';
            try {
              await this.gitClient.checkout(targetBranch);
            } catch {
              await this.gitClient.checkoutFromRemote(targetBranch, `${CONFIG.DEFAULT_REMOTE}/${targetBranch}`);
            }
            await this.remoteManager.pull(targetBranch);
            this.logger.info(success(`✅ 已拉取远程${targetBranch}分支`));
          }
        } catch (error) {
          // 远程仓库为空，无需处理
        }
      }

      this.logger.info(success(LOG_MESSAGES.GIT_INIT_SUCCESS));
    } catch (error) {
      this.logger.error('❌ Git 初始化失败', error);
      throw error;
    }
  }

  /**
   * 创建初始提交并推送到主分支
   */
  private async createInitialCommit(): Promise<void> {
    // 添加所有文件
    await this.gitClient.add(GIT_OPERATIONS.ADD_ALL);

    // 创建初始提交
    await this.gitClient.commit(COMMIT_MESSAGES.INITIAL);

    // 推送到主分支
    await this.remoteManager.push(this.branchManager.getMainBranch());

    this.logger.info(LOG_MESSAGES.INITIAL_COMMIT_PUSHED);
  }

  /**
   * 创建 .gitignore 文件（如果不存在）
   */
  private async createGitignoreIfNotExists(): Promise<void> {
    const gitignorePath = path.join(this.workDir, '.gitignore');

    try {
      // 检查 .gitignore 文件是否已存在
      await fs.promises.access(gitignorePath);
      this.logger.info(LOG_MESSAGES.GITIGNORE_EXISTS);
    } catch {
      // 文件不存在，创建它
      await fs.promises.writeFile(gitignorePath, GITIGNORE_TEMPLATE, 'utf-8');
      this.logger.info(success(LOG_MESSAGES.GITIGNORE_CREATED));
    }
  }

  /**
   * 创建 .github/release.yml 文件（如果不存在）
   */
  private async createReleaseYmlIfNotExists(): Promise<void> {
    const githubDir = path.join(this.workDir, '.github');
    const releaseYmlPath = path.join(githubDir, 'release.yml');

    try {
      // 检查 .github/release.yml 文件是否已存在
      await fs.promises.access(releaseYmlPath);
      this.logger.info('📋 .github/release.yml 文件已存在');
    } catch {
      // 文件不存在，创建 .github 目录和文件
      try {
        await fs.promises.mkdir(githubDir, { recursive: true });
      } catch (error) {
        // 目录可能已存在，忽略错误
      }

      await fs.promises.writeFile(releaseYmlPath, RELEASE_YML_TEMPLATE, 'utf-8');
      this.logger.info(success('✅ .github/release.yml 文件已创建'));
    }
  }

  /**
   * 阶段3: Git 提交
   * 包括：代码提交、分支管理、推送到开发分支
   * 注意：此阶段不涉及版本号管理，版本号在 publish 阶段确定
   */
  async commit(options: CommitOptions): Promise<string> {
    this.logger.info(LOG_MESSAGES.COMMIT_START);

    try {
      // 1. 检查 stash 区
      const stashList = await this.gitClient.stashList();
      if (stashList.total > 0) {
        this.logger.warn(LOG_MESSAGES.STASH_DETECTED);
      }

      // 2. 检查代码冲突
      const hasConflicts = await this.gitClient.hasConflicts();
      if (hasConflicts) {
        throw new Error(ERROR_MESSAGES.CONFLICTS_EXIST);
      }

      // 3. 自动提交未提交代码
      const hasChanges = await this.gitClient.hasUncommittedChanges();
      if (hasChanges) {
        await this.gitClient.add(GIT_OPERATIONS.ADD_ALL);
        await this.gitClient.commit(options.message || COMMIT_MESSAGES.DEFAULT);
      }

      // 4. 创建或切换到开发分支（不带版本号，使用纯 develop 分支）
      const developBranch = await this.branchManager.createDevelopBranch();

      // 5. 合并远程 master 分支
      try {
        await this.remoteManager.syncMainBranch(this.branchManager.getMainBranch());
        await this.branchManager.mergeFromMain(['--no-ff']);
      } catch (error) {
        this.logger.warn('合并主分支时出现问题，可能是首次提交');
      }

      // 6. 推送到远程开发分支
      await this.remoteManager.pushAndSetUpstream(developBranch);

      this.logger.info(success(LOG_MESSAGES.COMMIT_SUCCESS_NO_VERSION));
      return developBranch;
    } catch (error) {
      this.logger.error(ERROR_MESSAGES.COMMIT_FAILED, error);
      throw error;
    }
  }

  /**
   * 阶段4: Git 推送（发布）
   * 包括：确定版本号、合并到主分支、创建标签、推送、删除开发分支
   * 注意：版本号在此阶段确定
   */
  async publish(options?: { version?: string; versionType?: VersionType }): Promise<void> {
    this.logger.info(LOG_MESSAGES.PUBLISH_START);

    try {
      // 1. 确定版本号（在发布时才确定）
      let version: string;
      if (options?.version) {
        version = options.version;
        this.versionManager.setCurrentVersion(options.version);
      } else {
        // 从已有标签获取最新版本
        const tags = await this.gitClient.getTags();
        this.versionManager.suggestNextVersion(tags);

        // 根据版本类型递增
        if (options?.versionType) {
          version = this.versionManager.incrementVersion(options.versionType);
        } else {
          // 默认使用 patch
          version = this.versionManager.incrementPatch();
        }
      }

      const formattedVersion = this.versionManager.getFormattedVersion();
      this.logger.info(`📦 准备发布版本: ${formattedVersion}`);

      // 2. 获取当前分支
      const currentBranch = await this.gitClient.getCurrentBranch();
      const isDevelopBranch = await this.branchManager.isOnDevelopBranch();

      let developBranch = currentBranch;

      // 如果不在开发分支，尝试找到开发分支
      if (!isDevelopBranch) {
        const branches = await this.gitClient.getBranches();

        // 检查本地分支
        let developBranches = branches.local.filter(b => b.startsWith(CONFIG.DEVELOP_BRANCH_PREFIX) || b === this.branchManager.getDevelopBranch());

        // 如果本地没有开发分支，检查远程分支
        if (developBranches.length === 0) {
          const remoteDevelopBranches = branches.remote
            .filter(b => b.includes(this.branchManager.getDevelopBranch()))
            .map(b => b.replace(/^remotes\/[^/]+\//, '')); // 移除 remotes/origin/ 前缀

          if (remoteDevelopBranches.length === 0) {
            throw new Error(ERROR_MESSAGES.NO_DEVELOP_BRANCH);
          }

          // 选择开发分支
          developBranch = remoteDevelopBranches[0];
          this.logger.info(`${LOG_MESSAGES.CHECKOUT_REMOTE_DEVELOP}: ${developBranch}`);

          // 从远程分支创建本地分支并切换
          await this.gitClient.checkoutFromRemote(developBranch, `${CONFIG.DEFAULT_REMOTE}/${developBranch}`);
        } else {
          // 选择开发分支
          developBranch = developBranches[0];
          this.logger.info(`${LOG_MESSAGES.AUTO_SELECT_DEVELOP}: ${developBranch}`);

          // 切换到开发分支
          await this.gitClient.checkout(developBranch);
        }
      }

      // 3. 切换到主分支
      await this.branchManager.checkoutMain();

      // 4. 合并开发分支到主分支
      await this.gitClient.merge(developBranch, [GIT_OPERATIONS.NO_FF_MERGE]);
      this.logger.info(success(`${LOG_MESSAGES.DEVELOP_MERGED} ${developBranch} ${LOG_MESSAGES.MERGED_TO_MAIN}`));

      // 5. 创建并推送标签
      await this.remoteManager.createAndPushTag(formattedVersion, `${COMMIT_MESSAGES.RELEASE_PREFIX} ${formattedVersion}`);

      // 6. 推送主分支
      await this.remoteManager.push(this.branchManager.getMainBranch());

      // 7. 创建 GitHub Release
      if (RELEASE_CONFIG.ENABLED) {
        await this.createGitHubRelease(formattedVersion);
      }

      // 8. 确保main分支成为默认分支（在删除开发分支之前）
      try {
        await this.ensureMainAsDefaultBranch();
        // 等待几秒让 GitHub 处理默认分支的更改
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        this.logger.warn('设置默认分支时出现警告:', error);
      }

      // 9. 删除本地和远程开发分支
      await this.branchManager.deleteBranch(developBranch, { local: true, remote: true });

      this.logger.info(success(`${LOG_MESSAGES.PUBLISH_SUCCESS(formattedVersion)}`));
    } catch (error) {
      this.logger.error(ERROR_MESSAGES.PUBLISH_FAILED, error);
      throw error;
    }
  }

  /**
   * 创建 GitHub Release
   */
  private async createGitHubRelease(version: string): Promise<void> {
    try {
      this.logger.info(RELEASE_MESSAGES.CREATING);

      // 获取仓库信息
      const { owner, repo } = await this.getRepoInfo();

      // 检查是否为预发布版本
      const isPrerelease = RELEASE_CONFIG.PRERELEASE_PATTERN.test(version);

      // 获取上一个版本（用于生成对比）
      let previousTagName: string | undefined;
      try {
        const latestRelease = await this.platform.getLatestRelease(owner, repo);
        if (latestRelease) {
          previousTagName = latestRelease.tagName;
        }
      } catch (error) {
        // 如果获取失败，忽略（可能是第一次发布）
      }

      // 生成自定义的 Release Body
      let customBody = '';
      if (RELEASE_CONFIG.USE_CUSTOM_BODY) {
        customBody = await this.generateReleaseBody(version, previousTagName);
      }

      // 创建 Release
      const release = await this.platform.createRelease(owner, repo, {
        tagName: version,
        targetCommitish: this.branchManager.getMainBranch(),
        name: `Release ${version}`,
        body: customBody, // 如果为空，GitHub 将自动生成
        draft: false,
        prerelease: isPrerelease,
        generateReleaseNotes: customBody ? false : RELEASE_CONFIG.AUTO_GENERATE_NOTES, // 如果有自定义内容，不使用自动生成
        previousTagName,
      });

      this.logger.info(success(RELEASE_MESSAGES.SUCCESS(release.htmlUrl)));
    } catch (error: any) {
      if (RELEASE_CONFIG.SKIP_ON_ERROR) {
        this.logger.warn(RELEASE_MESSAGES.FAILED(error.message || 'Unknown error'));
        this.logger.warn(RELEASE_MESSAGES.SKIPPED);
      } else {
        throw error;
      }
    }
  }

  /**
   * 生成 Release Body 内容
   */
  private async generateReleaseBody(currentVersion: string, previousVersion?: string): Promise<string> {
    try {
      // 获取两个版本之间的提交记录
      const git = this.gitClient.getRawGit();
      let log;

      if (previousVersion) {
        log = await git.log({ from: previousVersion, to: currentVersion });
      } else {
        // 如果没有上一个版本，获取当前标签的提交
        log = await git.log({ to: currentVersion });
      }

      if (!log || log.total === 0) {
        return ''; // 返回空字符串，让 GitHub 自动生成
      }

      // 按照 Conventional Commits 规范分类提交
      const features: string[] = [];
      const fixes: string[] = [];
      const docs: string[] = [];
      const chores: string[] = [];
      const breaking: string[] = [];
      const others: string[] = [];

      // 统计符合规范的提交数量
      let conventionalCommitCount = 0;

      log.all.forEach((commit: any) => {
        const message = commit.message.split('\n')[0]; // 只取第一行
        const hash = commit.hash.substring(0, 7); // 短哈希
        let isConventional = false;

        // 检查是否有 BREAKING CHANGE
        if (commit.body && commit.body.includes('BREAKING CHANGE')) {
          breaking.push(`- ${message} (${hash})`);
          isConventional = true;
        } else if (message.startsWith('feat:') || message.startsWith('feat(')) {
          features.push(`- ${message.replace(/^feat(\([^)]*\))?:\s*/, '')} (${hash})`);
          isConventional = true;
        } else if (message.startsWith('fix:') || message.startsWith('fix(')) {
          fixes.push(`- ${message.replace(/^fix(\([^)]*\))?:\s*/, '')} (${hash})`);
          isConventional = true;
        } else if (message.startsWith('docs:') || message.startsWith('docs(')) {
          docs.push(`- ${message.replace(/^docs(\([^)]*\))?:\s*/, '')} (${hash})`);
          isConventional = true;
        } else if (message.startsWith('chore:') || message.startsWith('chore(')) {
          chores.push(`- ${message.replace(/^chore(\([^)]*\))?:\s*/, '')} (${hash})`);
          isConventional = true;
        } else {
          // 不符合规范的提交
          if (RELEASE_CONFIG.SMART_CATEGORIZATION) {
            // 智能分类：基于关键词匹配
            const lowerMessage = message.toLowerCase();
            let categorized = false;

            // 检查 Breaking Changes 关键词
            if (SMART_CATEGORIZATION_KEYWORDS.BREAKING.some(keyword => lowerMessage.includes(keyword))) {
              breaking.push(`- ${message} (${hash}) 🤖`);
              categorized = true;
            }
            // 检查 Feature 关键词
            else if (SMART_CATEGORIZATION_KEYWORDS.FEATURES.some(keyword => lowerMessage.includes(keyword))) {
              features.push(`- ${message} (${hash}) 🤖`);
              categorized = true;
            }
            // 检查 Fix 关键词
            else if (SMART_CATEGORIZATION_KEYWORDS.FIXES.some(keyword => lowerMessage.includes(keyword))) {
              fixes.push(`- ${message} (${hash}) 🤖`);
              categorized = true;
            }
            // 检查 Docs 关键词
            else if (SMART_CATEGORIZATION_KEYWORDS.DOCS.some(keyword => lowerMessage.includes(keyword))) {
              docs.push(`- ${message} (${hash}) 🤖`);
              categorized = true;
            }
            // 检查 Chores 关键词
            else if (SMART_CATEGORIZATION_KEYWORDS.CHORES.some(keyword => lowerMessage.includes(keyword))) {
              chores.push(`- ${message} (${hash}) 🤖`);
              categorized = true;
            }

            if (!categorized) {
              others.push(`- ${message} (${hash})`);
            }
          } else {
            // 不使用智能分类，直接放入 others
            others.push(`- ${message} (${hash})`);
          }
        }

        if (isConventional) {
          conventionalCommitCount++;
        }
      });

      // 检查是否满足使用自定义格式的最小要求
      if (RELEASE_CONFIG.FALLBACK_TO_AUTO &&
        conventionalCommitCount < RELEASE_CONFIG.MIN_COMMITS_FOR_CUSTOM) {
        this.logger.warn(RELEASE_MESSAGES.FALLBACK);
        return ''; // 回退到 GitHub 自动生成
      }

      // 如果启用了智能分类且有不规范的提交被分类
      if (RELEASE_CONFIG.SMART_CATEGORIZATION && others.length < log.total - conventionalCommitCount) {
        this.logger.warn(RELEASE_MESSAGES.USING_SMART);
      }

      // 构建 Release Body
      let body = '';

      if (breaking.length > 0) {
        body += '## 💥 Breaking Changes\n\n';
        body += breaking.join('\n') + '\n\n';
      }

      if (features.length > 0) {
        body += '## ✨ New Features\n\n';
        body += features.join('\n') + '\n\n';
      }

      if (fixes.length > 0) {
        body += '## 🐛 Bug Fixes\n\n';
        body += fixes.join('\n') + '\n\n';
      }

      if (docs.length > 0) {
        body += '## 📚 Documentation\n\n';
        body += docs.join('\n') + '\n\n';
      }

      if (chores.length > 0) {
        body += '## 🔧 Chores & Maintenance\n\n';
        body += chores.join('\n') + '\n\n';
      }

      if (others.length > 0 && !RELEASE_CONFIG.STRICT_CONVENTIONAL_COMMITS) {
        body += '## 📝 Other Changes\n\n';
        body += others.join('\n') + '\n\n';
      }

      // 添加说明（如果使用了智能分类）
      if (RELEASE_CONFIG.SMART_CATEGORIZATION && others.length < log.total - conventionalCommitCount) {
        body += '> 🤖 标记表示通过智能关键词匹配自动分类的提交\n\n';
      }

      // 添加完整变更日志链接
      if (previousVersion) {
        const repoInfo = await this.getRepoInfo();
        body += `---\n\n`;
        body += `**Full Changelog**: https://github.com/${repoInfo.owner}/${repoInfo.repo}/compare/${previousVersion}...${currentVersion}`;
      }

      return body.trim();
    } catch (error) {
      this.logger.warn('生成 Release Body 失败，将使用 GitHub 自动生成', error);
      return ''; // 失败时返回空，让 GitHub 自动生成
    }
  }

  /**
   * 获取仓库信息（owner 和 repo name）
   */
  private async getRepoInfo(): Promise<{ owner: string; repo: string }> {
    // 从配置文件中读取 owner
    const loginPath = this.getConfigPath(GIT_CONFIG_FILES.LOGIN);
    const loginConfig = await this.readConfig(loginPath);

    if (!loginConfig?.[CONFIG.OWNER_KEY]) {
      throw new Error('无法获取仓库所有者信息');
    }

    const owner = loginConfig[CONFIG.OWNER_KEY];

    // 从远程 URL 解析仓库名称
    const remotes = await this.gitClient.getRemotes();
    const originRemote = remotes.find(r => r.name === CONFIG.DEFAULT_REMOTE);

    if (!originRemote) {
      throw new Error('无法找到 origin 远程仓库');
    }

    const remoteUrl = originRemote.refs.fetch;
    const match = remoteUrl.match(/[:/]([^/]+\/([^/]+?))(\.git)?$/);

    if (!match || !match[2]) {
      // 备用方案：使用当前目录名
      const repo = process.cwd().split(CONFIG.PATH_SEPARATOR).pop() || '';
      if (!repo) {
        throw new Error('无法解析仓库名称');
      }
      return { owner, repo };
    }

    const repo = match[2].replace('.git', '');
    return { owner, repo };
  }

  /**
   * 确保main分支成为默认分支
   */
  private async ensureMainAsDefaultBranch(): Promise<void> {
    try {
      // 从配置文件中读取仓库信息
      const loginPath = this.getConfigPath(GIT_CONFIG_FILES.LOGIN);
      const loginConfig = await this.readConfig(loginPath);

      if (!loginConfig?.[CONFIG.OWNER_KEY]) {
        this.logger.warn(LOG_MESSAGES.NO_OWNER_INFO);
        return;
      }

      // 从远程 URL 解析仓库名称
      let repoName = '';
      try {
        const remotes = await this.gitClient.getRemotes();
        const originRemote = remotes.find(r => r.name === CONFIG.DEFAULT_REMOTE);

        if (originRemote) {
          const remoteUrl = originRemote.refs.fetch;

          // 支持多种 URL 格式:
          // - https://github.com/owner/repo.git
          // - git@github.com:owner/repo.git
          // - https://github.com/owner/repo
          const match = remoteUrl.match(/[:/]([^/]+\/([^/]+?))(\.git)?$/);
          if (match && match[2]) {
            repoName = match[2].replace('.git', '');
          }
        }
      } catch (error) {
        this.logger.warn(`获取远程仓库信息失败: ${error}`);
      }

      if (!repoName) {
        // 备用方案：使用当前目录名
        repoName = process.cwd().split(CONFIG.PATH_SEPARATOR).pop() || '';
      }

      if (!repoName) {
        this.logger.warn(LOG_MESSAGES.NO_REPO_NAME);
        return;
      }

      // 更新默认分支
      await this.platform.updateDefaultBranch(loginConfig[CONFIG.OWNER_KEY], repoName, this.branchManager.getMainBranch());
      this.logger.info(`${LOG_MESSAGES.DEFAULT_BRANCH_SET} ${this.branchManager.getMainBranch()} ${LOG_MESSAGES.AS_DEFAULT_BRANCH}`);
    } catch (error) {
      // 不抛出错误，只记录警告
      this.logger.warn(`${ERROR_MESSAGES.DEFAULT_BRANCH_FAILED}: ${error}`);
    }
  }

  /**
   * 完整的 GitFlow 工作流
   * 一键完成：初始化仓库 -> Git初始化 -> 提交 -> 发布
   */
  async fullFlow(
    repoOptions: RepoInitOptions,
    commitOptions: CommitOptions
  ): Promise<void> {
    this.logger.info(LOG_MESSAGES.FULL_FLOW_START);

    try {
      // 阶段1: 仓库初始化
      const repoInfo = await this.initRepository(repoOptions);

      // 阶段2: Git 初始化
      await this.initGit(repoInfo.cloneUrl); // 使用 HTTPS URL

      this.logger.info(success(`${LOG_MESSAGES.GIT_REPO_INIT_SUCCESS}: ${repoInfo.url}`));
    } catch (error) {
      this.logger.error(ERROR_MESSAGES.GITFLOW_FAILED, error);
      throw error;
    }
  }

  /**
   * 获取 GitClient 实例
   */
  getGitClient(): GitClient {
    return this.gitClient;
  }

  /**
   * 获取 VersionManager 实例
   */
  getVersionManager(): VersionManager {
    return this.versionManager;
  }

  /**
   * 获取 BranchManager 实例
   */
  getBranchManager(): BranchManager {
    return this.branchManager;
  }

  /**
   * 获取 RemoteManager 实例
   */
  getRemoteManager(): RemoteManager {
    return this.remoteManager;
  }

  /**
   * 获取 Platform 实例
   */
  getPlatform(): IGitPlatformClient {
    return this.platform;
  }
}
