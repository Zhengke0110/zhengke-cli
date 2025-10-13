# 快速发布 NPM 包脚本

## 使用方法

```bash
# 基本用法
./publish.sh <包文件夹路径> [发布类型] [--yes]

# 发布类型选项:
# - patch (默认): 修复版本 1.0.0 -> 1.0.1
# - minor: 功能版本 1.0.0 -> 1.1.0
# - major: 重大版本 1.0.0 -> 2.0.0
# - prerelease: 预发布版本 1.0.0 -> 1.0.1-0

# 可选参数:
# - --yes 或 -y: 跳过确认直接发布
```

## 使用示例

````bash
# 发布 test 文件夹中的包（使用默认 patch 版本升级）
./publish.sh ./test

# 发布时升级 minor 版本
./publish.sh ./test minor

# 发布时升级 major 版本
./publish.sh ./test major

# 发布预发布版本
./publish.sh ./test prerelease

# 跳过确认直接发布（适合 CI/CD 环境）
./publish.sh ./test patch --yes

# 使用短参数形式
./publish.sh ./test -y
```
````
