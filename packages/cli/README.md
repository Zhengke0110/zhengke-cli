# @zhengke0110/cli

CLI 主程序包，提供命令行入口和命令定义。

## 命令概览

| 命令          | 描述           | 功能                           |
| ------------- | -------------- | ------------------------------ |
| `init`        | 项目初始化     | 从内置模板或 GitHub 创建新项目 |
| `git:init`    | Git 仓库初始化 | 创建远程仓库并初始化本地 Git   |
| `git:commit`  | Git 提交       | 提交代码并自动管理版本号       |
| `git:publish` | Git 发布       | 发布到主分支                   |

## init - 项目初始化

创建一个新的项目，支持内置模板和 GitHub 模板。

```bash
zhengke-cli init --name <project-name> [选项]
```

**选项:**

- `-n, --name <name>` - 项目名称（必需）
- `-t, --template <template>` - 指定内置模板名称
- `-g, --github` - 使用 GitHub 模板搜索

**使用示例:**

```bash
# 交互式选择模板
zhengke-cli init --name my-app

# 使用指定的内置模板
zhengke-cli init --name my-app --template react-ts

# 从 GitHub 搜索模板
zhengke-cli init --name my-app --github
```

## git:init - Git 仓库初始化

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

## git:commit - Git 提交

提交代码到开发分支，支持自动版本管理。

```bash
zhengke-cli git:commit [选项]
```

**选项:**

- `-m, --message <message>` - 提交信息
- `--type <type>` - 版本类型（major/minor/patch）
- `-v, --version <version>` - 指定版本号

## git:publish - Git 发布

发布代码到主分支。

```bash
zhengke-cli git:publish [选项]
```

**选项:**

- `-v, --version <version>` - 指定发布版本

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
