#!/bin/bash

# 发布脚本 - 自动检查版本冲突并发布包
# 使用方法: ./scripts/publish-packages.sh [--patch|--minor|--major]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 包列表（按依赖顺序）
PACKAGES=(
  "packages/command"
  "packages/utils"
  "packages/cli"
)

# 获取版本更新类型
VERSION_TYPE="${1:-patch}" # 默认 patch

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  ZK-CLI 包发布脚本${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# 函数：获取包的远程版本
get_remote_version() {
  local package_name=$1
  local remote_version=$(npm view "$package_name" version 2>/dev/null || echo "0.0.0")
  echo "$remote_version"
}

# 函数：获取包的本地版本
get_local_version() {
  local package_path=$1
  local local_version=$(node -p "require('./$package_path/package.json').version")
  echo "$local_version"
}

# 函数：获取包名
get_package_name() {
  local package_path=$1
  local package_name=$(node -p "require('./$package_path/package.json').name")
  echo "$package_name"
}

# 函数：比较版本号
version_gt() {
  test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1"
}

# 函数：更新版本号
update_version() {
  local package_path=$1
  local version_type=$2
  
  cd "$package_path"
  npm version "$version_type" --no-git-tag-version
  local new_version=$(node -p "require('./package.json').version")
  cd - > /dev/null
  
  echo "$new_version"
}

# 函数：询问用户是否继续
ask_continue() {
  local message=$1
  echo -e "${YELLOW}${message}${NC}"
  read -p "是否继续发布? (y/N): " REPLY
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}已取消发布${NC}"
    exit 1
  fi
}

# 第一步：检查所有包的版本
echo -e "${BLUE}步骤 1: 检查包版本...${NC}"
echo ""

CONFLICTS=0
# 使用普通数组存储包信息
PACKAGE_NAMES=()
LOCAL_VERSIONS=()
REMOTE_VERSIONS=()

for package_path in "${PACKAGES[@]}"; do
  package_name=$(get_package_name "$package_path")
  local_version=$(get_local_version "$package_path")
  remote_version=$(get_remote_version "$package_name")
  
  # 保存到数组
  PACKAGE_NAMES+=("$package_name")
  LOCAL_VERSIONS+=("$local_version")
  REMOTE_VERSIONS+=("$remote_version")
  
  echo -e "📦 ${GREEN}$package_name${NC}"
  echo -e "   本地版本: ${BLUE}$local_version${NC}"
  echo -e "   远程版本: ${BLUE}$remote_version${NC}"
  
  # 检查版本冲突
  if [[ "$local_version" == "$remote_version" ]]; then
    echo -e "   ${YELLOW}⚠️  版本冲突: 本地版本与远程版本相同${NC}"
    CONFLICTS=$((CONFLICTS + 1))
  elif version_gt "$remote_version" "$local_version"; then
    echo -e "   ${RED}⚠️  版本冲突: 远程版本更高${NC}"
    CONFLICTS=$((CONFLICTS + 1))
  else
    echo -e "   ${GREEN}✓ 版本正常${NC}"
  fi
  echo ""
done

# 第二步：处理版本冲突
if [ $CONFLICTS -gt 0 ]; then
  echo -e "${YELLOW}================================================${NC}"
  echo -e "${YELLOW}检测到 $CONFLICTS 个包存在版本冲突${NC}"
  echo -e "${YELLOW}================================================${NC}"
  echo ""
  
  ask_continue "将自动更新所有包的版本号 ($VERSION_TYPE)"
  
  echo ""
  echo -e "${BLUE}步骤 2: 更新版本号...${NC}"
  echo ""
  
  for i in "${!PACKAGES[@]}"; do
    package_path="${PACKAGES[$i]}"
    package_name="${PACKAGE_NAMES[$i]}"
    local_version="${LOCAL_VERSIONS[$i]}"
    remote_version="${REMOTE_VERSIONS[$i]}"
    
    # 如果本地版本不高于远程版本，则更新
    if [[ "$local_version" == "$remote_version" ]] || version_gt "$remote_version" "$local_version"; then
      echo -e "📦 更新 ${GREEN}$package_name${NC}"
      new_version=$(update_version "$package_path" "$VERSION_TYPE")
      echo -e "   ${local_version} → ${GREEN}${new_version}${NC}"
      LOCAL_VERSIONS[$i]=$new_version
    fi
  done
  
  echo ""
  echo -e "${GREEN}✓ 版本号更新完成${NC}"
  echo ""
else
  echo -e "${GREEN}✓ 所有包版本正常${NC}"
  echo ""
  
  # 询问是否要更新版本
  echo -e "${YELLOW}当前所有包版本都高于远程版本${NC}"
  read -p "是否需要更新版本号? (y/N): " REPLY
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${BLUE}步骤 2: 更新版本号...${NC}"
    echo ""
    
    for i in "${!PACKAGES[@]}"; do
      package_path="${PACKAGES[$i]}"
      package_name="${PACKAGE_NAMES[$i]}"
      local_version="${LOCAL_VERSIONS[$i]}"
      
      echo -e "📦 更新 ${GREEN}$package_name${NC}"
      new_version=$(update_version "$package_path" "$VERSION_TYPE")
      echo -e "   ${local_version} → ${GREEN}${new_version}${NC}"
      LOCAL_VERSIONS[$i]=$new_version
    done
    
    echo ""
    echo -e "${GREEN}✓ 版本号更新完成${NC}"
    echo ""
  fi
fi

# 第三步：构建项目
echo -e "${BLUE}步骤 3: 构建项目...${NC}"
echo ""

npm run build

if [[ $? -ne 0 ]]; then
  echo -e "${RED}✗ 构建失败${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✓ 构建成功${NC}"
echo ""

# 第四步：发布包
echo -e "${BLUE}步骤 4: 发布包到 npm...${NC}"
echo ""

ask_continue "即将按以下顺序发布包: ${PACKAGES[*]}"

echo ""

for i in "${!PACKAGES[@]}"; do
  package_path="${PACKAGES[$i]}"
  package_name="${PACKAGE_NAMES[$i]}"
  version="${LOCAL_VERSIONS[$i]}"
  
  echo -e "${BLUE}发布 ${package_name}@${version}...${NC}"
  
  cd "$package_path"
  npm publish --access public
  
  if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✓ ${package_name}@${version} 发布成功${NC}"
  else
    echo -e "${RED}✗ ${package_name} 发布失败${NC}"
    cd - > /dev/null
    exit 1
  fi
  
  cd - > /dev/null
  echo ""
done

# 第五步：总结
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  发布完成！${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "已发布的包："
echo ""

for i in "${!PACKAGES[@]}"; do
  package_name="${PACKAGE_NAMES[$i]}"
  version="${LOCAL_VERSIONS[$i]}"
  echo -e "  ✓ ${GREEN}${package_name}@${version}${NC}"
done

echo ""
echo -e "${YELLOW}提示: 请不要忘记提交版本更新并推送到 Git 仓库${NC}"
echo ""
echo -e "运行以下命令："
echo -e "  ${BLUE}git add .${NC}"
echo -e "  ${BLUE}git commit -m \"chore: bump version to $(get_local_version 'packages/cli')\"${NC}"
echo -e "  ${BLUE}git push${NC}"
echo ""
