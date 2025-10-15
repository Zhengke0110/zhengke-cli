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

## 许可证

MIT
