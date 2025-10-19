/**
 * Git 命令处理器
 */

import {
  GitFlow,
  GitHubPlatform,
  GiteePlatform,
  GitPlatform,
  RepoType,
  VersionType,
  type IGitPlatformClient,
  type RepoInitOptions,
  type CommitOptions,
} from '@zhengke0110/git';
import { ConfigManager, success } from '@zhengke0110/utils';
import { logger } from './logger.js';
import inquirer from 'inquirer';

/**
 * Git init 命令选项
 */
export interface GitInitOptions {
  platform?: string;
  token?: string;
  repo?: string;
  owner?: string;
  type?: string;
  private?: boolean;
}

/**
 * Git commit 命令选项
 */
export interface GitCommitOptions {
  message?: string;
}

/**
 * Git publish 命令选项
 */
export interface GitPublishOptions {
  type?: string;
  version?: string;
}

/**
 * Git switch 命令选项
 */
export interface GitSwitchOptions {
  branch?: string;
}

/**
 * 创建 Git 平台客户端
 */
async function createPlatformClient(platform?: string, token?: string): Promise<IGitPlatformClient> {
  const configManager = new ConfigManager();

  // 1. 选择平台
  const selectedPlatform = platform || (await inquirer.prompt([{
    type: 'list',
    name: 'platform',
    message: '选择 Git 托管平台:',
    choices: [
      { name: 'GitHub', value: GitPlatform.GITHUB },
      { name: 'Gitee', value: GitPlatform.GITEE },
    ],
  }])).platform;

  // 2. 获取 Token - 首先尝试从配置文件读取
  let platformToken = token;

  if (!platformToken && selectedPlatform === GitPlatform.GITHUB) {
    platformToken = configManager.getGitHubToken();
  }

  if (!platformToken) {
    platformToken = (await inquirer.prompt([{
      type: 'password',
      name: 'token',
      message: `请输入 ${selectedPlatform} Token:`,
      validate: (input: string) => input.trim() !== '' || 'Token 不能为空',
    }])).token;
  }

  // 3. 创建平台客户端
  if (selectedPlatform === GitPlatform.GITHUB) {
    return new GitHubPlatform({ platform: GitPlatform.GITHUB, token: platformToken });
  } else {
    return new GiteePlatform({ platform: GitPlatform.GITEE, token: platformToken });
  }
}

/**
 * 处理 git init 命令
 * 对应 GitFlow 阶段1和2：仓库初始化 + Git初始化
 */
export async function handleGitInit(options: GitInitOptions): Promise<void> {
  logger.info('🚀 开始 Git 仓库初始化...');

  try {
    // 安全检查：确认用户了解风险
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: '⚠️  此操作将初始化 Git 仓库并可能修改现有配置。是否继续？',
      default: false,
    }]);

    if (!confirm) {
      logger.info('操作已取消');
      return;
    }

    // 创建平台客户端
    const platform = await createPlatformClient(options.platform, options.token);

    // 创建 GitFlow 实例
    const gitFlow = new GitFlow(platform);

    // 获取用户信息
    const user = await platform.getCurrentUser();
    const orgs = await platform.getUserOrgs();

    // 选择仓库类型和所有者
    let repoType: RepoType;
    let owner: string;

    if (options.type && options.owner) {
      repoType = options.type === 'org' ? RepoType.ORG : RepoType.USER;
      owner = options.owner;
    } else {
      const choices = [
        { name: `个人 (${user.login})`, value: { type: RepoType.USER, owner: user.login } },
        ...orgs.map(org => ({ name: `组织 (${org.login})`, value: { type: RepoType.ORG, owner: org.login } })),
      ];

      const { selected } = await inquirer.prompt([{
        type: 'list',
        name: 'selected',
        message: '选择仓库类型:',
        choices,
      }]);

      repoType = selected.type;
      owner = selected.owner;
    }

    // 获取仓库名称
    const repoName = options.repo || (await inquirer.prompt([{
      type: 'input',
      name: 'repo',
      message: '请输入仓库名称:',
      validate: (input: string) => input.trim() !== '' || '仓库名称不能为空',
    }])).repo;

    // 阶段1: 初始化远程仓库
    const repoInfo = await gitFlow.initRepository({
      repoName,
      repoType,
      owner,
      private: options.private,
    });

    // 阶段2: Git 初始化
    await gitFlow.initGit(repoInfo.cloneUrl);

    logger.info(success(`Git 仓库初始化成功: ${repoInfo.url}`));
  } catch (error) {
    logger.error('Git 仓库初始化失败', error);
    throw error;
  }
}

/**
 * 处理 git commit 命令
 * 对应 GitFlow 阶段3：提交
 * 注意：此阶段不涉及版本号管理，仅提交代码到开发分支
 */
export async function handleGitCommit(options: GitCommitOptions): Promise<void> {
  logger.info('🚀 开始 Git 提交...');

  try {
    // 创建平台客户端 - 优先使用GitHub和配置的token
    const platform = await createPlatformClient(GitPlatform.GITHUB);
    const gitFlow = new GitFlow(platform);

    // 获取提交信息
    const message = options.message || (await inquirer.prompt([{
      type: 'input',
      name: 'message',
      message: '请输入提交信息:',
      default: 'chore: update',
    }])).message;

    // 阶段3: 提交（不涉及版本号）
    const commitOptions: CommitOptions = {
      message,
    };

    const branch = await gitFlow.commit(commitOptions);

    logger.info(success(`Git 提交成功，分支: ${branch}`));
  } catch (error) {
    logger.error('Git 提交失败', error);
    throw error;
  }
}

/**
 * 处理 git publish 命令
 * 对应 GitFlow 阶段4：推送
 * 注意：版本号在此阶段确定
 */
export async function handleGitPublish(options: GitPublishOptions): Promise<void> {
  logger.info('🚀 开始 Git 发布...');

  try {
    // 创建平台客户端 - 优先使用GitHub和配置的token
    const platform = await createPlatformClient(GitPlatform.GITHUB);
    const gitFlow = new GitFlow(platform);

    // 获取版本类型（如果没有指定版本号）
    let versionType: VersionType | undefined;
    let version: string | undefined = options.version;

    // 如果指定了 --type 参数，直接使用
    if (options.type) {
      versionType = options.type as VersionType;
    } else if (!version) {
      // 如果没有指定版本号也没有指定类型，交互式询问
      const { type } = await inquirer.prompt([{
        type: 'list',
        name: 'type',
        message: '选择版本类型:',
        choices: [
          { name: 'Patch (修订版本, x.x.X)', value: VersionType.PATCH },
          { name: 'Minor (次版本, x.X.0)', value: VersionType.MINOR },
          { name: 'Major (主版本, X.0.0)', value: VersionType.MAJOR },
        ],
      }]);
      versionType = type;
    }

    // 阶段4: 发布
    await gitFlow.publish({ version, versionType });

    logger.info(success('Git 发布成功'));
  } catch (error) {
    logger.error('Git 发布失败', error);
    throw error;
  }
}

/**
 * 处理 git switch 命令
 * 切换到开发分支（develop）
 */
export async function handleGitSwitch(options: GitSwitchOptions): Promise<void> {
  logger.info('🔄 切换到开发分支...');

  try {
    // 创建平台客户端 - 优先使用GitHub和配置的token
    const platform = await createPlatformClient(GitPlatform.GITHUB);
    const gitFlow = new GitFlow(platform);
    const gitClient = gitFlow.getGitClient();

    // 获取当前分支
    const currentBranch = await gitClient.getCurrentBranch();
    logger.info(`当前分支: ${currentBranch}`);

    // 检查是否有未提交的改动
    const hasChanges = await gitClient.hasUncommittedChanges();
    if (hasChanges) {
      const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: '⚠️  检测到未提交的改动，请选择操作:',
        choices: [
          { name: '暂存改动并切换 (git stash)', value: 'stash' },
          { name: '放弃改动并切换 (git checkout -f)', value: 'force' },
          { name: '取消操作', value: 'cancel' },
        ],
      }]);

      if (action === 'cancel') {
        logger.info('操作已取消');
        return;
      }

      if (action === 'stash') {
        logger.info('💾 暂存未提交的改动...');
        await gitClient.stash('Auto stash before switching to develop');
        logger.info(success('改动已暂存，稍后可使用 git stash pop 恢复'));
      }
    }

    // 获取所有分支
    const branches = await gitClient.getBranches();
    const developBranch = options.branch || 'develop';

    // 检查本地是否有 develop 分支
    const hasLocalDevelop = branches.local.includes(developBranch);
    // 检查远程是否有 develop 分支
    const hasRemoteDevelop = branches.remote.some((b: string) =>
      b.includes(`origin/${developBranch}`)
    );

    if (hasLocalDevelop) {
      // 本地有 develop 分支，直接切换
      logger.info(`切换到本地 ${developBranch} 分支...`);
      await gitClient.checkout(developBranch);
      logger.info(success(`✓ 已切换到分支: ${developBranch}`));
    } else if (hasRemoteDevelop) {
      // 本地没有但远程有，从远程创建
      logger.info(`从远程创建 ${developBranch} 分支...`);
      await gitClient.checkoutFromRemote(developBranch, `origin/${developBranch}`);
      logger.info(success(`✓ 已从远程创建并切换到分支: ${developBranch}`));
    } else {
      // 本地和远程都没有，创建新的 develop 分支
      const { createNew } = await inquirer.prompt([{
        type: 'confirm',
        name: 'createNew',
        message: `${developBranch} 分支不存在，是否创建新分支？`,
        default: true,
      }]);

      if (!createNew) {
        logger.info('操作已取消');
        return;
      }

      logger.info(`创建新的 ${developBranch} 分支...`);
      await gitClient.checkoutNewBranch(developBranch);
      logger.info(success(`✓ 已创建并切换到分支: ${developBranch}`));

      // 询问是否推送到远程
      const { pushToRemote } = await inquirer.prompt([{
        type: 'confirm',
        name: 'pushToRemote',
        message: '是否将新分支推送到远程？',
        default: true,
      }]);

      if (pushToRemote) {
        await gitClient.push('origin', developBranch, ['--set-upstream']);
        logger.info(success(`✓ ${developBranch} 分支已推送到远程`));
      }
    }    logger.info(success(`✅ 成功切换到 ${developBranch} 分支`));
  } catch (error) {
    logger.error('切换分支失败', error);
    throw error;
  }
}
