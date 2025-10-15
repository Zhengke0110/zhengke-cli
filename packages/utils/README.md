# @zhengke0110/utils

工具函数包，提供通用工具函数、错误处理、日志记录和模板管理功能。

## 功能模块

### 1. 错误处理 (error-handler.ts, errors.ts)

提供完善的错误处理机制：

- **自定义错误类型**: CLIError、ValidationError、FileSystemError、NetworkError 等
- **错误代码**: 统一的错误代码体系 (E1000-E6000)
- **全局错误捕获**: setupGlobalErrorHandlers()
- **错误包装**: wrapAsyncHandler() 和 wrapSyncHandler()
- **友好的错误提示**: 包含错误代码、用户友好的消息和建议

### 2. 日志系统 (logger.ts)

基于 Winston 的日志系统：

- **多级别日志**: debug, info, warn, error
- **彩色输出**: 使用 chalk 美化终端输出
- **时间戳**: 自动添加时间戳
- **格式化**: 统一的日志格式

### 3. 模板管理 (template-manager.ts)

完整的项目模板管理系统：

- **动态获取模板**: 从 npm 自动获取 @zhengke0110 scope 下的模板
- **模板缓存**: 本地缓存下载的模板，加快后续使用
- **交互式选择**: 使用 inquirer 提供友好的交互界面
- **模板下载**: 使用 npm pack 和 tar 下载解压模板
- **模板安装**: 复制模板文件并清理不必要的配置
- **依赖安装**: 可选的自动安装项目依赖

### 4. 版本检查 (version-checker.ts)

Node.js 版本兼容性检查：

- 检查当前 Node.js 版本是否满足要求
- 提供友好的版本不兼容提示

## 主要 API

### 错误处理

```typescript
// 抛出验证错误
throw new ValidationError('项目名称', '项目名称不能为空');

// 包装异步函数
const wrappedAction = wrapAsyncHandler(
  async (options) => {
    // 你的异步逻辑
  },
  { logger, debug: true }
);
```

### 模板管理

```typescript
// 获取可用模板
const templates = await fetchAvailableTemplates();

// 选择模板
const template = await selectTemplate(templates);

// 下载模板
const templatePath = await downloadTemplate(template);

// 安装模板
await installTemplate(templatePath, targetPath, projectName);

// 安装依赖
await installDependencies(projectPath);
```

### 日志记录

```typescript
import logger from '@zhengke0110/utils';

logger.info('项目初始化成功');
logger.warn('当前不是生产环境');
logger.error('构建失败');
logger.debug('调试信息');
```

## 依赖

- **chalk**: 终端彩色输出
- **winston**: 日志系统
- **ora**: 加载动画
- **inquirer**: 交互式命令行
- **fs-extra**: 增强的文件系统操作
- **tar**: tar 文件解压
- **semver**: 语义化版本管理

## 缓存位置

模板缓存默认存储在:

- macOS/Linux: `~/.zhengke-cli/templates/`
- Windows: `%USERPROFILE%\.zhengke-cli\templates\`

## 错误代码

- **E1xxx**: 通用错误
- **E2xxx**: 参数错误
- **E3xxx**: 文件系统错误
- **E4xxx**: 网络错误
- **E5xxx**: 环境错误
- **E6xxx**: 业务逻辑错误

## 开发

```bash
# 构建
nx build utils
```
