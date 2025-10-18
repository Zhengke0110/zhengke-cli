# @zhengke0110/git

Git 工作流管理包，提供完整的 Git 仓库初始化、代码提交和发布流程。

## 核心功能

| 功能           | 描述                                           |
| -------------- | ---------------------------------------------- |
| **GitFlow**    | 三阶段工作流：仓库初始化 → 代码提交 → 版本发布 |
| **多平台支持** | 支持 GitHub 和 Gitee                           |
| **版本管理**   | 发布时确定版本号，支持语义化版本控制           |
| **分支管理**   | 开发分支和主分支的自动管理                     |

## 重新设计的工作流

我们重新设计了 Git 工作流，解决了传统流程的痛点：

### 新的三阶段流程

1. **`initRepository()`** - 创建远程仓库并初始化本地 Git
2. **`commit()`** - 专注代码提交，不涉及版本号
3. **`publish()`** - 确定版本号并发布到主分支

### 核心改进

- **commit 阶段**：专注代码提交，支持多次迭代
- **publish 阶段**：确定版本号，完成发布流程
- **灵活性**：开发过程中可以多次 commit，最后统一 publish

## 主要类

### GitFlow

完整的 Git 工作流管理器。

```typescript
import { GitFlow, GitHubPlatform, GitPlatform } from '@zhengke0110/git';

const platform = new GitHubPlatform({
  platform: GitPlatform.GITHUB,
  token: 'your-token',
});

const gitFlow = new GitFlow(platform);

// 工作流程
const repoInfo = await gitFlow.initRepository({
  repoName: 'my-project',
  repoType: RepoType.USER,
  owner: 'username',
  private: false,
});

await gitFlow.commit({ message: 'feat: add new feature' });
await gitFlow.commit({ message: 'fix: fix bug' });
await gitFlow.publish({ versionType: VersionType.MINOR });
```

### 平台客户端

支持 GitHub 和 Gitee 平台。

```typescript
import { GitHubPlatform, GiteePlatform, GitPlatform } from '@zhengke0110/git';

const github = new GitHubPlatform({
  platform: GitPlatform.GITHUB,
  token: 'github-token',
});

const gitee = new GiteePlatform({
  platform: GitPlatform.GITEE,
  token: 'gitee-token',
});
```

### 管理器

独立的 Git 操作管理器。

```typescript
import {
  GitClient,
  VersionManager,
  BranchManager,
  RemoteManager,
} from '@zhengke0110/git';

const gitClient = new GitClient({ baseDir: process.cwd() });
const versionManager = new VersionManager();
const branchManager = new BranchManager({ gitClient });
const remoteManager = new RemoteManager({ gitClient, platform });
```

## 枚举类型

```typescript
// Git 平台
enum GitPlatform {
  GITHUB = 'github',
  GITEE = 'gitee',
}

// 仓库类型
enum RepoType {
  USER = 'user',
  ORG = 'org',
}

// 版本类型
enum VersionType {
  MAJOR = 'major',
  MINOR = 'minor',
  PATCH = 'patch',
}
```

## 工作流程

1. **`initRepository()`** - 创建远程仓库，初始化本地 Git，推送初始代码
2. **`commit()`** - 创建/切换到 develop 分支，提交代码，推送到远程
3. **`publish()`** - 确定版本号，合并到 main 分支，创建标签，删除 develop 分支

## 系统要求

- **Node.js**: >= 16.0.0
- **Git**: >= 2.0.0

## 开发

```bash
# 构建
nx build git

# 测试
nx test git
```
