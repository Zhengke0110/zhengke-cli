# @zhengke0110/github

GitHub 集成包，提供 GitHub API 客户端、模板搜索和模板下载功能。

## 核心功能

| 功能              | 描述                            |
| ----------------- | ------------------------------- |
| **GitHub 客户端** | 基于 Octokit 的 GitHub API 封装 |
| **模板搜索**      | 智能搜索 GitHub 模板仓库        |
| **模板下载**      | 快速下载 GitHub 仓库模板        |
| **Token 验证**    | GitHub Token 有效性验证         |

## 主要类

### GitHubClient

GitHub API 客户端，基于 Octokit 封装。

```typescript
import { GitHubClient } from '@zhengke0110/github';

const client = new GitHubClient('your-github-token');

// 获取当前用户
const username = await client.getAuthenticatedUser();

// 验证 Token
const isValid = await client.validateToken();

// 获取原生 Octokit 实例
const octokit = client.getOctokit();
```

### TemplateSearcher

GitHub 模板仓库搜索器。

```typescript
import { GitHubClient, TemplateSearcher } from '@zhengke0110/github';

const client = new GitHubClient('your-token');
const searcher = new TemplateSearcher(client);

// 搜索模板
const templates = await searcher.searchTemplates({
  keyword: 'react',
  language: 'typescript',
  userOnly: true, // 只搜索当前用户的仓库
  templateOnly: true, // 只搜索模板仓库
  maxResults: 10,
});

// 获取用户所有仓库
const userRepos = await searcher.getUserRepositories();
```

**搜索选项：**

```typescript
interface SearchOptions {
  keyword?: string; // 搜索关键字
  language?: string; // 编程语言过滤
  userOnly?: boolean; // 只搜索当前用户
  templateOnly?: boolean; // 只搜索模板仓库
  maxResults?: number; // 最大结果数量
}
```

### TemplateDownloader

GitHub 模板下载器，支持多种仓库标识符格式。

```typescript
import { TemplateDownloader } from '@zhengke0110/github';

const downloader = new TemplateDownloader();

// 下载仓库模板
await downloader.download('owner/repo', {
  targetDir: './my-project',
  force: true, // 强制覆盖
  verbose: true, // 显示详细信息
});

// 从 GitHubTemplate 对象下载
await downloader.downloadFromTemplate(template, {
  targetDir: './my-project',
});
```

**支持的仓库格式：**

- `owner/repo`
- `https://github.com/owner/repo`
- `git@github.com:owner/repo.git`

## 类型定义

### GitHubTemplate

```typescript
interface GitHubTemplate {
  fullName: string; // 仓库全名 (owner/repo)
  name: string; // 仓库名称
  owner: string; // 所有者
  description: string | null; // 描述
  language: string | null; // 主要语言
  stars: number; // Star 数量
  isTemplate: boolean; // 是否是模板仓库
  updatedAt: string; // 更新时间
  url: string; // 仓库 URL
}
```

### DownloadOptions

```typescript
interface DownloadOptions {
  targetDir: string; // 目标目录
  force?: boolean; // 强制覆盖
  cache?: boolean; // 是否缓存
  verbose?: boolean; // 详细模式
}
```

## 使用示例

### 完整的模板搜索和下载流程

```typescript
import {
  GitHubClient,
  TemplateSearcher,
  TemplateDownloader,
} from '@zhengke0110/github';

// 1. 创建客户端
const client = new GitHubClient('your-token');

// 2. 验证 Token
if (!(await client.validateToken())) {
  throw new Error('Invalid GitHub token');
}

// 3. 搜索模板
const searcher = new TemplateSearcher(client);
const templates = await searcher.searchTemplates({
  keyword: 'vue',
  language: 'typescript',
  templateOnly: true,
});

// 4. 选择模板并下载
const template = templates[0];
const downloader = new TemplateDownloader();
await downloader.downloadFromTemplate(template, {
  targetDir: './my-vue-app',
  force: true,
  verbose: true,
});
```

## 系统要求

- **Node.js**: >= 16.0.0
- **Git**: >= 2.0.0（下载功能需要）

## 开发

```bash
# 构建
nx build github

# 测试
nx test github
```
