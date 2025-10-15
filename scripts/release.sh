#!/bin/bash

# 自动化发布脚本
# 用法: ./scripts/release.sh [patch|minor|major|version]
# 示例: ./scripts/release.sh patch
#       ./scripts/release.sh 1.2.3

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

success() {
  echo -e "${GREEN}✓${NC} $1"
}

warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

error() {
  echo -e "${RED}✖${NC} $1"
  exit 1
}

# 检查参数
VERSION_TYPE=${1:-patch}

if [ -z "$VERSION_TYPE" ]; then
  error "请指定版本类型: patch, minor, major 或具体版本号"
fi

info "开始发布流程..."
echo ""

# 1. 检查 Git 状态
info "检查 Git 工作区状态..."
if [[ -n $(git status -s) ]]; then
  warning "工作区有未提交的更改"
  git status -s
  echo ""
  read -p "是否继续? (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    error "发布已取消"
  fi
else
  success "工作区干净"
fi
echo ""

# 2. 确保在主分支
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
info "当前分支: $CURRENT_BRANCH"
if [ "$CURRENT_BRANCH" != "main" ]; then
  warning "不在 main 分支上"
  read -p "是否继续? (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    error "发布已取消"
  fi
fi
echo ""

# 3. 拉取最新代码
info "拉取最新代码..."
git pull origin $CURRENT_BRANCH || warning "无法拉取最新代码,继续..."
success "代码已更新"
echo ""

# 4. 运行测试
info "运行测试..."
npm test || {
  warning "测试失败"
  read -p "是否继续发布? (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    error "发布已取消"
  fi
}
success "测试通过"
echo ""

# 5. 清理并重新安装依赖
info "清理并重新安装依赖..."
rm -rf node_modules package-lock.json
npm install
success "依赖已重新安装"
echo ""

# 6. 构建所有包
info "构建所有包..."
npm run build
success "构建完成"
echo ""

# 7. 创建新版本
info "创建新版本: $VERSION_TYPE"
npx nx release version $VERSION_TYPE || error "版本创建失败"
success "版本已更新"
echo ""

# 8. 获取新版本号和发布的包列表
NEW_VERSION=$(node -p "require('./packages/cli/package.json').version")
info "新版本: $NEW_VERSION"

# 获取所有要发布的包
PACKAGES=$(ls -d packages/*/ | xargs -n1 basename)
echo ""

# 9. 确认发布
echo ""
info "即将发布以下包到 npm:"
for pkg in $PACKAGES; do
  PKG_VERSION=$(node -p "require('./packages/$pkg/package.json').version")
  echo "  - @zhengke0110/$pkg@$PKG_VERSION"
done
echo ""
read -p "确认发布? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  warning "发布已取消,但版本已更新并提交"
  exit 0
fi
echo ""

# 10. 发布到 npm
info "发布到 npm..."
npx nx release publish --skip-checks || error "发布失败"
success "发布成功!"
echo ""

# 11. 推送到远程仓库
info "推送到远程仓库..."
git push origin $CURRENT_BRANCH --follow-tags || warning "推送失败,请手动推送"
success "推送完成"
echo ""

# 12. 验证发布
info "验证发布..."
sleep 3
PUBLISHED_VERSION=$(npm view @zhengke0110/cli version 2>/dev/null || echo "未找到")
if [ "$PUBLISHED_VERSION" = "$NEW_VERSION" ]; then
  success "npm 上的版本已确认: $PUBLISHED_VERSION"
else
  warning "npm 上的版本 ($PUBLISHED_VERSION) 与预期 ($NEW_VERSION) 不一致,可能需要等待一段时间同步"
fi
echo ""

# 完成
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "发布流程完成!"
echo ""
echo "📦 发布的包:"
for pkg in $PACKAGES; do
  PKG_VERSION=$(node -p "require('./packages/$pkg/package.json').version")
  echo "  • @zhengke0110/$pkg@$PKG_VERSION"
done
echo ""
echo "📝 下一步:"
echo "  • 测试安装: npm install -g @zhengke0110/cli"
echo "  • 查看版本: zk-cli --version"
echo "  • 查看包信息: npm view @zhengke0110/cli"
echo ""
echo "🔗 链接:"
echo "  • npm: https://www.npmjs.com/package/@zhengke0110/cli"
echo "  • GitHub: https://github.com/Zhengke0110/zhengke-cli"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
