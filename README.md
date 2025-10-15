# zhengke-cli

一个简单易用的项目脚手架工具，帮助快速创建前端项目。

## 功能特性

- 🚀 快速初始化项目
- 📦 从 npm 自动获取最新模板
- 💾 智能缓存机制，加快二次使用
- 🎨 交互式模板选择
- ✨ 自动安装依赖
- 🛡️ 完善的错误处理

## 快速开始

### 安装

```bash
npm install -g @zhengke0110/cli
```

### 使用

#### 初始化项目（交互式）

```bash
zk-cli init --name my-app
```

#### 指定模板初始化

```bash
# React 项目
zk-cli init --name my-react-app --template react-ts

# Vue 项目
zk-cli init --name my-vue-app --template vue-ts
```

#### Debug 模式

```bash
zk-cli init --name my-app --debug
```

## 项目结构

```
zhengke-cli/
├── packages/
│   ├── cli/          # CLI 主程序
│   ├── command/      # 命令框架
│   └── utils/        # 工具函数
├── template/         # 项目模板
│   ├── react-ts-template/
│   └── vue-ts-template/
└── scripts/          # 构建和发布脚本
```

## 开发

### 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装依赖

```bash
npm install
```

### 构建

```bash
npm run build
```

### 本地测试

```bash
node dist/packages/cli/src/index.js init --name test-app
```

## 发布

### 发布流程

使用自动化脚本发布新版本:

```bash
npm run release          # 默认发布 patch 版本
npm run release:patch    # 补丁版本 (1.0.0 -> 1.0.1)
npm run release:minor    # 次要版本 (1.0.0 -> 1.1.0)
npm run release:major    # 主要版本 (1.0.0 -> 2.0.0)
```

脚本会自动执行:检查工作区、运行测试、构建、创建版本、发布到 npm、推送到 GitHub。

### 版本语义化

遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/):

- **patch**: Bug 修复
- **minor**: 新功能
- **major**: 破坏性更新

## 许可证

MIT
