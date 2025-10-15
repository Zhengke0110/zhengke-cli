# @zhengke0110/command

命令框架包，提供命令定义和执行的基础架构。

## 功能

- **命令定义接口**: 定义标准化的命令结构
- **命令注册**: 提供命令注册和管理功能
- **选项解析**: 解析命令行选项和参数
- **命令执行**: 执行命令的 action 处理函数
- **类型安全**: 使用 TypeScript 提供完整的类型定义

## 核心接口

### CommandDefinition

```typescript
interface CommandDefinition {
  name: string; // 命令名称
  description: string; // 命令描述
  options?: CommandOption[]; // 命令选项
  action: (...args: any[]) => void | Promise<void>; // 命令执行函数
}
```

### CommandOption

```typescript
interface CommandOption {
  flags: string; // 选项标志 (如: '-n, --name <name>')
  description: string; // 选项描述
  defaultValue?: any; // 默认值
}
```

## 使用示例

```typescript
import type { CommandDefinition } from '@zhengke0110/command';

export const myCommand: CommandDefinition = {
  name: 'build',
  description: '构建项目',
  options: [
    {
      flags: '-e, --env <env>',
      description: '环境',
      defaultValue: 'production',
    },
    { flags: '-w, --watch', description: '监听模式', defaultValue: false },
  ],
  action: async (options) => {
    console.log('Building with env:', options.env);
  },
};
```

## 设计原则

- **声明式**: 使用声明式的方式定义命令
- **类型安全**: 完整的 TypeScript 类型定义
- **解耦**: 命令定义与执行逻辑分离
- **可扩展**: 易于添加新命令

## 开发

```bash
# 构建
nx build command

# 测试
nx test command
```
