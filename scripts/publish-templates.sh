#!/bin/bash

# 发布模板到 npm
# 使用方法: 
#   ./scripts/publish-templates.sh <模板路径>
#   ./scripts/publish-templates.sh template/react-ts-template
#   ./scripts/publish-templates.sh template/vue-ts-template

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_step() {
  echo -e "${BLUE}▶ $1${NC}"
}

# 显示使用帮助
show_help() {
  echo "发布模板到 npm"
  echo ""
  echo "使用方法:"
  echo "  $0 <模板路径>"
  echo ""
  echo "示例:"
  echo "  $0 template/react-ts-template"
  echo "  $0 template/vue-ts-template"
  echo ""
  echo "说明:"
  echo "  - 模板路径可以是相对路径或绝对路径"
  echo "  - 脚本会自动读取模板的 package.json"
  echo "  - 发布前会提示确认版本信息"
  echo ""
}

# 检查参数
if [ $# -eq 0 ]; then
  print_error "错误: 缺少模板路径参数"
  echo ""
  show_help
  exit 1
fi

if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
  show_help
  exit 0
fi

TEMPLATE_PATH=$1

# 获取脚本所在目录的父目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# 处理模板路径
if [[ "$TEMPLATE_PATH" = /* ]]; then
  # 绝对路径
  TEMPLATE_DIR="$TEMPLATE_PATH"
else
  # 相对路径，基于项目根目录
  TEMPLATE_DIR="$ROOT_DIR/$TEMPLATE_PATH"
fi

# 检查模板目录是否存在
if [ ! -d "$TEMPLATE_DIR" ]; then
  print_error "模板目录不存在: $TEMPLATE_DIR"
  exit 1
fi

# 检查 package.json 是否存在
PACKAGE_JSON="$TEMPLATE_DIR/package.json"
if [ ! -f "$PACKAGE_JSON" ]; then
  print_error "package.json 不存在: $PACKAGE_JSON"
  exit 1
fi

# 检查是否登录 npm
if ! npm whoami &> /dev/null; then
  print_error "你还没有登录 npm"
  print_info "请先运行: npm login"
  exit 1
fi

NPM_USER=$(npm whoami)
print_success "npm 登录检查通过 (用户: $NPM_USER)"
echo ""

# 递增版本号函数
increment_patch_version() {
  local version=$1
  IFS='.' read -ra VERSION_PARTS <<< "$version"
  local major="${VERSION_PARTS[0]}"
  local minor="${VERSION_PARTS[1]}"
  local patch="${VERSION_PARTS[2]}"
  patch=$((patch + 1))
  echo "$major.$minor.$patch"
}

# 更新 package.json 版本号
update_package_version() {
  local package_json=$1
  local new_version=$2
  
  # 使用 node 更新版本号
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('$package_json', 'utf8'));
    pkg.version = '$new_version';
    fs.writeFileSync('$package_json', JSON.stringify(pkg, null, 2) + '\n');
  "
}

# 读取 package.json 信息
PACKAGE_NAME=$(node -p "require('$PACKAGE_JSON').name")
LOCAL_VERSION=$(node -p "require('$PACKAGE_JSON').version")
PACKAGE_DESC=$(node -p "require('$PACKAGE_JSON').description || ''")

# 显示模板信息
echo "================================================"
echo "  📦 模板信息"
echo "================================================"
print_info "模板路径:   $TEMPLATE_PATH"
print_info "包名称:     $PACKAGE_NAME"
print_info "本地版本:   $LOCAL_VERSION"
if [ -n "$PACKAGE_DESC" ]; then
  print_info "描述:       $PACKAGE_DESC"
fi
echo ""

# 检查远程版本
print_step "检查远程版本..."
REMOTE_VERSION=""
if npm view "$PACKAGE_NAME" version &> /dev/null; then
  REMOTE_VERSION=$(npm view "$PACKAGE_NAME" version 2>/dev/null || echo "")
  if [ -n "$REMOTE_VERSION" ]; then
    print_info "远程版本:   $REMOTE_VERSION"
  else
    print_info "远程版本:   未发布"
  fi
else
  print_info "远程版本:   未发布"
fi
echo ""

# 版本比对和处理
PUBLISH_VERSION=$LOCAL_VERSION

if [ -n "$REMOTE_VERSION" ] && [ "$LOCAL_VERSION" == "$REMOTE_VERSION" ]; then
  print_warning "本地版本 ($LOCAL_VERSION) 与远程版本相同"
  NEW_VERSION=$(increment_patch_version "$LOCAL_VERSION")
  print_info "自动递增版本号: $LOCAL_VERSION -> $NEW_VERSION"
  echo ""
  
  read -p "是否更新本地版本号为 $NEW_VERSION 并发布? (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "已取消发布"
    exit 0
  fi
  
  # 更新本地版本号
  print_step "更新本地 package.json 版本号..."
  update_package_version "$PACKAGE_JSON" "$NEW_VERSION"
  print_success "版本号已更新: $LOCAL_VERSION -> $NEW_VERSION"
  echo ""
  
  PUBLISH_VERSION=$NEW_VERSION
elif [ -n "$REMOTE_VERSION" ] && npm view "$PACKAGE_NAME@$LOCAL_VERSION" &> /dev/null; then
  print_warning "版本 $LOCAL_VERSION 已经发布到 npm"
  echo ""
  read -p "是否强制发布（可能会失败）? (y/N): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "已取消发布"
    exit 0
  fi
else
  print_success "版本 $LOCAL_VERSION 可以发布"
  echo ""
fi

# 显示将要发布的文件
print_step "预览发布内容..."
cd "$TEMPLATE_DIR"
npm pack --dry-run 2>&1 | grep -A 100 "npm notice"
echo ""

# 确认发布
echo "================================================"
print_warning "即将发布:"
echo "  包名: $PACKAGE_NAME"
echo "  版本: $PUBLISH_VERSION"
echo "================================================"
echo ""
read -p "确认发布到 npm? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  print_warning "已取消发布"
  exit 0
fi

echo ""
print_step "正在发布 $PACKAGE_NAME@$PUBLISH_VERSION ..."
echo ""

# 发布到 npm
if npm publish --access public; then
  echo ""
  echo "================================================"
  print_success "发布成功!"
  echo "================================================"
  echo ""
  print_info "包信息:"
  echo "  名称: $PACKAGE_NAME"
  echo "  版本: $PUBLISH_VERSION"
  echo ""
  print_info "查看包信息:"
  echo "  npm info $PACKAGE_NAME"
  echo ""
  print_info "查看 npm 页面:"
  echo "  https://www.npmjs.com/package/$PACKAGE_NAME"
  echo ""
  print_info "使用模板:"
  echo "  npx degit npm:$PACKAGE_NAME my-app"
  echo ""
else
  echo ""
  print_error "发布失败!"
  exit 1
fi

cd "$ROOT_DIR"
