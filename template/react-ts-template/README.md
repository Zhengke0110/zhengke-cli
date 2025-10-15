# @zhengke0110/template-react-ts

React + TypeScript + Vite 项目模板

## 特性

- ⚡️ **Vite** - 极速的开发服务器和构建工具
- ⚛️ **React 19** - 最新版本的 React
- 🎨 **TypeScript** - 类型安全的 JavaScript
- 📦 **ESLint** - 代码质量检查
- 🔥 **热模块替换 (HMR)** - 快速开发体验

## 使用方式

### 通过 zhengke-cli 创建项目

```bash
npx @zhengke0110/cli init --name my-app --template react-ts
```

### 手动使用

```bash
# 克隆模板
npx degit zhengke0110/template-react-ts my-app

# 进入项目目录
cd my-app

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 项目结构

```
.
├── src/
│   ├── assets/       # 静态资源
│   ├── App.tsx       # 根组件
│   └── main.tsx      # 应用入口
├── public/           # 公共静态文件
├── index.html        # HTML 模板
├── vite.config.ts    # Vite 配置
└── tsconfig.json     # TypeScript 配置
```

## 可用脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run preview` - 预览生产构建
- `npm run lint` - 运行 ESLint 检查

## 技术栈

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [ESLint](https://eslint.org/)

## License

MIT
