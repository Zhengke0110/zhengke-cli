# zhengke-cli

基于 Nx Monorepo 的 CLI 工具，提供项目初始化和 Git 工作流管理。

## 核心功能

| 功能           | 描述                               |
| -------------- | ---------------------------------- |
| **项目初始化** | 支持内置模板和 GitHub 模板创建项目 |
| **Git 工作流** | 完整的 Git 仓库管理和发布流程      |
| **多平台支持** | 支持 GitHub 和 Gitee               |
| **模板搜索**   | 智能搜索和下载 GitHub 模板仓库     |

## 安装使用

```bash
# 安装
npm install -g @zhengke0110/cli

# 初始化项目（多种方式）
zhengke-cli init my-app                    # 推荐用法
zhengke-cli init --name my-app             # 向后兼容
zhengke-cli init                           # 交互式输入

# 使用指定模板
zhengke-cli init my-app --template react-ts

# 从 GitHub 搜索模板
zhengke-cli init my-app --github

# Git 工作流
zhengke-cli git:init                       # 初始化 Git 仓库
zhengke-cli git:commit -m "feat: feature"  # 提交代码（不涉及版本号）
zhengke-cli git:publish --type patch      # 发布版本（此时确定版本号）
```

## Git 工作流特点

- **commit**: 专注代码提交，支持多次迭代
- **publish**: 确定版本号并发布，支持 major/minor/patch

## 项目架构

```text
zhengke-cli/
├── packages/
│   ├── cli/          # CLI 主程序
│   ├── command/      # 命令框架
│   ├── git/          # Git 工作流管理
│   ├── github/       # GitHub 集成
│   └── utils/        # 工具函数
└── template/         # 项目模板
    ├── react-ts-template/
    └── vue-ts-template/
```

## 开发

```bash
# 安装依赖
npm install

# 构建所有包
npm run build

# 本地测试
node dist/packages/cli/src/index.js init my-test

# 发布版本
npm run release:patch
```

## 系统要求

- **Node.js**: >= 16.0.0
- **Git**: >= 2.0.0

## 许可证

MIT
