# @zhengke0110/cli

CLI 主程序包，提供命令行入口和命令定义。

## 命令概览

| 命令          | 描述           | 功能                           |
| ------------- | -------------- | ------------------------------ |
| `init [name]` | 项目初始化     | 从内置模板或 GitHub 创建新项目 |
| `git:init`    | Git 仓库初始化 | 创建远程仓库并初始化本地 Git   |
| `git:commit`  | Git 提交       | 提交代码到开发分支             |
| `git:publish` | Git 发布       | 发布版本到主分支               |

## init - 项目初始化

创建一个新的项目，支持位置参数、交互式输入和多种模板源。

```bash
zhengke-cli init [name] [选项]
```

**参数:**

- `name` - 项目名称（可选，支持位置参数）

**选项:**

- `-n, --name <name>` - 项目名称（向后兼容）
- `-t, --template <template>` - 指定内置模板名称
- `-g, --github` - 使用 GitHub 模板搜索

**使用方式:**

```bash
# 推荐用法：位置参数
zhengke-cli init my-app

# 交互式输入
zhengke-cli init
? 请输入项目名称: my-app

# 向后兼容
zhengke-cli init --name my-app

# 指定内置模板
zhengke-cli init my-app --template react-ts

# 从 GitHub 搜索模板
zhengke-cli init my-app --github
```

## Git 工作流

### git:init - 仓库初始化

初始化 Git 仓库，创建远程仓库并配置本地 Git。

```bash
zhengke-cli git:init [选项]
```

**选项:**

- `-p, --platform <platform>` - Git 平台（github/gitee）
- `-t, --token <token>` - Git Token
- `-r, --repo <repo>` - 仓库名称
- `-o, --owner <owner>` - 仓库所有者
- `--type <type>` - 仓库类型（user/org）
- `--private` - 创建私有仓库

### git:commit - 代码提交

提交代码到开发分支，专注于代码管理，不涉及版本号。

```bash
zhengke-cli git:commit [选项]
```

**选项:**

- `-m, --message <message>` - 提交信息

**特点:**

- 自动创建并切换到 `develop` 分支
- 支持多次提交到同一开发分支
- 不涉及版本号管理，专注代码提交

### git:publish - 版本发布

发布版本到主分支，此时确定版本号。

```bash
zhengke-cli git:publish [选项]
```

**选项:**

- `--type <type>` - 版本类型（major/minor/patch）

**特点:**

- 合并 `develop` 分支到 `main` 分支
- 根据 `--type` 参数确定版本号
- 创建 Git 标签并推送
- 自动清理开发分支

## 完整工作流示例

```bash
# 1. 初始化项目
zhengke-cli init my-project

# 2. 初始化 Git 仓库
zhengke-cli git:init

# 3. 开发阶段（可多次提交）
zhengke-cli git:commit -m "feat: add feature A"
zhengke-cli git:commit -m "fix: fix bug in feature A"
zhengke-cli git:commit -m "docs: update documentation"

# 4. 发布版本
zhengke-cli git:publish --type patch
```

## 调试模式

添加 `--debug` 参数启用详细日志：

```bash
zhengke-cli init --name test --debug
```

## 系统要求

- **Node.js**: >= 16.0.0
- **Git**: >= 2.0.0（Git 相关功能）

## 开发

```bash
# 构建
nx build cli

# 测试
nx test cli

# 本地运行
node dist/packages/cli/src/index.js init --name test
```
