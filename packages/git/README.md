# @zhengke0110/git

Git 工作流管理包，提供完整的 Git 仓库初始化、代码提交和发布流程。

## 核心功能

| 功能           | 描述                                                |
| -------------- | --------------------------------------------------- |
| **GitFlow**    | 四阶段工作流：仓库初始化 → Git 初始化 → 提交 → 发布 |
| **多平台支持** | 支持 GitHub 和 Gitee                                |
| **版本管理**   | 自动版本号递增和语义化版本控制                      |
| **分支管理**   | 自动创建开发分支和主分支合并                        |

## 主要类

### GitFlow

完整的 Git 工作流管理器。

```typescript
import { GitFlow, GitHubPlatform, GitPlatform } from '@zhengke0110/git';

// 创建平台客户端
const platform = new GitHubPlatform({
  platform: GitPlatform.GITHUB,
  token: 'your-token',
});

// 创建 GitFlow 实例
const gitFlow = new GitFlow(platform);
```

**四阶段工作流：**

```typescript
// 阶段1: 仓库初始化
const repoInfo = await gitFlow.initRepository({
  repoName: 'my-project',
  repoType: RepoType.USER,
  owner: 'username',
  private: false,
});

// 阶段2: Git 初始化
await gitFlow.initGit(repoInfo.cloneUrl);

// 阶段3: 提交代码
const version = await gitFlow.commit({
  message: 'feat: add new feature',
  versionType: VersionType.MINOR,
});

// 阶段4: 发布
await gitFlow.publish();
```

### 平台客户端

支持 GitHub 和 Gitee 平台。

```typescript
import { GitHubPlatform, GiteePlatform, GitPlatform } from '@zhengke0110/git';

// GitHub
const github = new GitHubPlatform({
  platform: GitPlatform.GITHUB,
  token: 'github-token',
});

// Gitee
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

// Git 客户端
const gitClient = new GitClient({ baseDir: process.cwd() });

// 版本管理
const versionManager = new VersionManager();
const newVersion = versionManager.incrementVersion(VersionType.PATCH);

// 分支管理
const branchManager = new BranchManager({ gitClient });
await branchManager.createDevelopBranch('dev', '1.0.0');

// 远程管理
const remoteManager = new RemoteManager({ gitClient, platform });
await remoteManager.push('main');
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

1. **仓库初始化** - 创建远程仓库，保存配置
2. **Git 初始化** - 初始化本地 Git，关联远程仓库
3. **代码提交** - 版本管理，创建开发分支，推送代码
4. **发布** - 合并到主分支，创建标签，删除开发分支

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
