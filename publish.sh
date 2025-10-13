#!/bin/bash

# 快速发布 npm 包的脚本
# 使用方法: ./publish.sh <包文件夹路径> [发布类型] [--yes]
# 发布类型: patch(默认) | minor | major | prerelease
# --yes: 跳过确认直接发布

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'          # 红色 - 错误
GREEN='\033[0;32m'        # 绿色 - 成功
YELLOW='\033[1;33m'       # 黄色 - 警告
BLUE='\033[0;34m'         # 蓝色 - 信息
CYAN='\033[0;36m'         # 青色 - 特殊信息
MAGENTA='\033[0;35m'      # 紫色 - 重要信息
BOLD='\033[1m'            # 粗体
NC='\033[0m'              # 无颜色

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${BOLD}${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${BOLD}${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${BOLD}${RED}[ERROR]${NC} $1"
}

log_highlight() {
    echo -e "${BOLD}${CYAN}[PUBLISH]${NC} $1"
}

# 解析参数
AUTO_YES=false
PACKAGE_DIR=""
VERSION_TYPE="patch"

# 解析命令行参数
for arg in "$@"; do
    case $arg in
        --yes|-y)
            AUTO_YES=true
            shift
            ;;
        *)
            if [ -z "$PACKAGE_DIR" ]; then
                PACKAGE_DIR="$arg"
            elif [ "$VERSION_TYPE" = "patch" ]; then
                VERSION_TYPE="$arg"
            fi
            shift
            ;;
    esac
done

# 检查参数
if [ -z "$PACKAGE_DIR" ]; then
    log_error "请提供包文件夹路径!"
    echo "使用方法: $0 <包文件夹路径> [发布类型] [--yes]"
    echo "发布类型: patch(默认) | minor | major | prerelease"
    echo "选项: --yes 或 -y 跳过确认直接发布"
    echo "示例: $0 ./test patch --yes"
    exit 1
fi

# 检查目录是否存在
if [ ! -d "$PACKAGE_DIR" ]; then
    log_error "目录不存在: $PACKAGE_DIR"
    exit 1
fi

# 检查是否存在 package.json
if [ ! -f "$PACKAGE_DIR/package.json" ]; then
    log_error "在 $PACKAGE_DIR 中没有找到 package.json 文件"
    exit 1
fi

# 获取绝对路径
PACKAGE_DIR=$(cd "$PACKAGE_DIR" && pwd)
log_info "准备发布包: $PACKAGE_DIR"

# 进入包目录
cd "$PACKAGE_DIR"

# 显示当前包信息
PACKAGE_NAME=$(node -p "require('./package.json').name")
CURRENT_VERSION=$(node -p "require('./package.json').version")
log_info "包名: $PACKAGE_NAME"
log_info "当前版本: $CURRENT_VERSION"

# 检查是否已登录 npm
log_info "检查 npm 登录状态..."
if ! npm whoami > /dev/null 2>&1; then
    log_error "您尚未登录 npm，请先运行: npm login"
    exit 1
fi

NPM_USER=$(npm whoami)
log_success "已登录为: $NPM_USER"

# 检查包是否已存在
log_info "检查包名可用性..."
if npm view "$PACKAGE_NAME" version > /dev/null 2>&1; then
    REMOTE_VERSION=$(npm view "$PACKAGE_NAME" version)
    log_warning "包 $PACKAGE_NAME 已存在，远程版本: $REMOTE_VERSION"
    
    # 比较版本
    if [ "$CURRENT_VERSION" = "$REMOTE_VERSION" ]; then
        log_info "版本相同，将自动升级版本..."
        npm version "$VERSION_TYPE" --no-git-tag-version
        NEW_VERSION=$(node -p "require('./package.json').version")
        log_success "版本已升级至: $NEW_VERSION"
    else
        log_info "本地版本与远程版本不同，继续发布..."
    fi
else
    log_info "这是一个新包"
fi

# 确认发布
NEW_VERSION=$(node -p "require('./package.json').version")
echo
log_warning "即将发布:"
echo "  包名: $PACKAGE_NAME"
echo "  版本: $NEW_VERSION"
echo "  目录: $PACKAGE_DIR"
echo

# 检查是否自动确认
if [ "$AUTO_YES" = true ]; then
    log_info "使用 --yes 参数，跳过确认直接发布"
else
    read -p "确认发布? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "发布已取消"
        exit 0
    fi
fi

# 发布包
log_info "开始发布包..."

# 检查是否是作用域包
if [[ "$PACKAGE_NAME" == @* ]]; then
    log_info "检测到作用域包，使用 --access=public 发布..."
    npm publish --access=public
else
    npm publish
fi

if [ $? -eq 0 ]; then
    echo
    log_highlight "===================="
    log_success "包发布成功!"
    log_success "包名: $PACKAGE_NAME@$NEW_VERSION"
    log_highlight "===================="
    echo
    log_info "您可以通过以下方式安装:"
    echo -e "  ${CYAN}npm install $PACKAGE_NAME${NC}"
    if [ -f "package.json" ] && grep -q '"bin"' package.json; then
        echo -e "  ${CYAN}npm install -g $PACKAGE_NAME${NC}  # 全局安装CLI工具"
    fi
else
    echo
    echo -e "${BOLD}${RED}===================="
    log_error "发布失败!"
    echo -e "${BOLD}${RED}====================${NC}"
    echo
    exit 1
fi