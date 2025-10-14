#!/bin/bash

# 构建脚本：自动化构建和链接管理

set -e

echo "🔨 Building all packages..."
npx nx run-many -t build --projects=utils,command,cli

echo "🔗 Updating workspace symlinks to point to dist..."
# 自动处理所有 @zhengke0110 包
for pkg in utils command cli; do
  if [ -L "node_modules/@zhengke0110/$pkg" ] || [ -e "node_modules/@zhengke0110/$pkg" ]; then
    rm -f "node_modules/@zhengke0110/$pkg"
  fi
  if [ -d "dist/packages/$pkg" ]; then
    ln -sf "../../dist/packages/$pkg" "node_modules/@zhengke0110/$pkg"
    echo "  ✓ Linked @zhengke0110/$pkg → dist/packages/$pkg"
  fi
done

# 添加执行权限
chmod +x dist/packages/cli/src/index.js

echo ""
echo "✅ Build complete!"
echo "📦 All packages are now linked to dist/"
echo ""
echo "🚀 Usage:"
echo "  • Test locally:  node dist/packages/cli/src/index.js --help"
echo "  • Install globally:  cd dist/packages/cli && npm link"
echo ""
echo "📝 To restore source links (for development):"
echo "  npm install  # Will recreate workspace symlinks to source"
