# @zhengke0110/cli

CLI 主程序包，提供命令行入口和命令定义。

## 功能

- **命令行入口**: 作为整个 CLI 工具的入口程序
- **命令定义**: 定义和注册所有可用的命令（init、create、build 等）
- **版本检查**: 检查 Node.js 版本兼容性
- **全局错误处理**: 设置全局错误捕获和处理
- **初始化命令**: 提供项目初始化功能，从 npm 下载模板并创建项目

## 主要命令

### init

初始化一个新项目

```bash
zk-cli init --name <project-name> [--template <template-name>]
```

**选项:**

- `-n, --name <name>` - 项目名称（必需）
- `-t, --template <template>` - 项目模板（可选，不指定则交互式选择）

**示例:**

```bash
# 交互式选择模板
zk-cli init --name my-app

# 使用指定模板
zk-cli init --name my-app --template react-ts
zk-cli init --name my-app --template vue-ts
```

## 工作流程

1. 检查 Node.js 版本（>= 16.0.0）
2. 设置全局错误处理器
3. 解析命令行参数
4. 执行对应的命令处理器
5. 错误时显示友好的错误信息

## 依赖

- `@zhengke0110/command` - 命令框架
- `@zhengke0110/utils` - 工具函数和模板管理

## 开发

```bash
# 构建
nx build cli

# 测试
nx test cli

# 运行
node dist/packages/cli/src/index.js init --name test
```
