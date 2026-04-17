#!/bin/bash

# Web元素数据采集器 - Chrome扩展安装脚本
# 适配苹果M2芯片和macOS系统

echo "======================================="
echo "  Web元素数据采集器 Chrome扩展安装脚本"
echo "======================================="

# 检查操作系统
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "⚠️  此脚本针对macOS系统优化，其他系统可能需要手动安装"
fi

# 检查Chrome是否安装
if ! command -v google-chrome &> /dev/null && ! command -v /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome &> /dev/null; then
    echo "❌ 未检测到Google Chrome浏览器"
    echo "请先安装Chrome浏览器：https://www.google.com/chrome/"
    exit 1
fi

echo "✅ 检测到Chrome浏览器"

# 检查扩展目录
EXTENSION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/extension"
if [ ! -d "$EXTENSION_DIR" ]; then
    echo "❌ 未找到扩展目录: $EXTENSION_DIR"
    exit 1
fi

echo "✅ 找到扩展目录: $EXTENSION_DIR"

# 检查必要文件
REQUIRED_FILES=(
    "manifest.json"
    "pages/sidepanel.html"
    "scripts/background.js"
    "scripts/content.js"
    "scripts/sidepanel.js"
    "assets/styles.css"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$EXTENSION_DIR/$file" ]; then
        echo "❌ 缺少必要文件: $file"
        exit 1
    fi
done

echo "✅ 所有必要文件存在"

# 创建图标文件（如果不存在）
ICON_SIZES=(16 32 48 128)
for size in "${ICON_SIZES[@]}"; do
    icon_file="$EXTENSION_DIR/assets/icon${size}.png"
    if [ ! -f "$icon_file" ]; then
        echo "⚠️  图标文件不存在: icon${size}.png"
        echo "   扩展仍可安装，但建议添加图标文件"
    fi
done

echo ""
echo "📦 扩展信息:"
echo "   名称: Web元素数据采集器"
echo "   版本: 1.0.0"
echo "   位置: $EXTENSION_DIR"
echo ""

echo "🔧 安装步骤:"
echo "1. 打开Chrome浏览器"
echo "2. 在地址栏输入: chrome://extensions/"
echo "3. 右上角开启'开发者模式'"
echo "4. 点击'加载已解压的扩展程序'"
echo "5. 选择以下目录:"
echo "   $EXTENSION_DIR"
echo ""

echo "🎯 使用方法:"
echo "1. 访问任意网页"
echo "2. 点击扩展图标或按 Alt+W"
echo "3. 点击'开始选取'选择元素"
echo "4. 设置别名后导出Excel"
echo ""

echo "🧪 测试扩展:"
echo "1. 打开 test.html 测试页面"
echo "2. 使用扩展采集各种元素"
echo "3. 测试Excel导出功能"
echo ""

echo "✅ 准备完成！请按照上述步骤安装扩展。"

# 可选：自动打开Chrome扩展页面
read -p "是否现在打开Chrome扩展页面？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v open &> /dev/null; then
        open "chrome://extensions/"
    else
        echo "请手动打开: chrome://extensions/"
    fi
fi

echo ""
echo "🎉 安装脚本执行完成！"
