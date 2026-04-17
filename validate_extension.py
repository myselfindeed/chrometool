#!/usr/bin/env python3
"""
Chrome扩展验证脚本
检查扩展文件是否完整且格式正确
"""

import os
import json
from PIL import Image

def validate_extension():
    """验证Chrome扩展的完整性"""
    extension_dir = "extension"

    print("🔍 开始验证Chrome扩展...")
    print("=" * 50)

    # 检查manifest.json
    manifest_path = os.path.join(extension_dir, "manifest.json")
    if not os.path.exists(manifest_path):
        print("❌ manifest.json 文件不存在")
        return False

    try:
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)

        print("✅ manifest.json 格式正确")
        print(f"   扩展名称: {manifest.get('name', 'Unknown')}")
        print(f"   版本: {manifest.get('version', 'Unknown')}")
        print(f"   Manifest版本: {manifest.get('manifest_version', 'Unknown')}")

    except json.JSONDecodeError as e:
        print(f"❌ manifest.json 格式错误: {e}")
        return False

    # 检查必需的文件
    required_files = [
        "manifest.json",
        "pages/sidepanel.html",
        "scripts/background.js",
        "scripts/content.js",
        "scripts/sidepanel.js",
        "assets/styles.css"
    ]

    print("\n📁 检查必需文件:")
    all_files_exist = True

    for file_path in required_files:
        full_path = os.path.join(extension_dir, file_path)
        if os.path.exists(full_path):
            file_size = os.path.getsize(full_path)
            print(f"✅ {file_path} ({file_size} bytes)")
        else:
            print(f"❌ {file_path} - 文件不存在")
            all_files_exist = False

    # 检查图标文件
    print("\n🖼️  检查图标文件:")
    icon_sizes = [16, 32, 48, 128]
    all_icons_valid = True

    for size in icon_sizes:
        icon_path = os.path.join(extension_dir, f"assets/icon{size}.png")
        if os.path.exists(icon_path):
            file_size = os.path.getsize(icon_path)
            if file_size > 0:
                # 验证PNG格式
                try:
                    with Image.open(icon_path) as img:
                        if img.format == 'PNG' and img.size == (size, size):
                            print(f"✅ icon{size}.png - {file_size} bytes, {img.mode}模式")
                        else:
                            print(f"⚠️  icon{size}.png - 格式或尺寸不匹配 ({img.size}, {img.format})")
                except Exception as e:
                    print(f"❌ icon{size}.png - 无法读取图片: {e}")
                    all_icons_valid = False
            else:
                print(f"❌ icon{size}.png - 文件为空")
                all_icons_valid = False
        else:
            print(f"❌ icon{size}.png - 文件不存在")
            all_icons_valid = False

    # 检查HTML文件的JavaScript引用
    print("\n🔗 检查文件引用:")

    # 检查sidepanel.html中的脚本引用
    sidepanel_path = os.path.join(extension_dir, "pages/sidepanel.html")
    if os.path.exists(sidepanel_path):
        with open(sidepanel_path, 'r', encoding='utf-8') as f:
            content = f.read()

        scripts_in_html = []
        if 'scripts/sidepanel.js' in content:
            scripts_in_html.append('sidepanel.js')
        if 'scripts/background.js' in content:
            scripts_in_html.append('background.js')

        if scripts_in_html:
            print(f"✅ sidepanel.html 引用了脚本: {', '.join(scripts_in_html)}")
        else:
            print("ℹ️  sidepanel.html 未引用脚本文件")

    # 检查manifest中的文件引用
    print("\n📋 检查manifest配置:")

    # 检查action图标
    if 'action' in manifest and 'default_icon' in manifest['action']:
        action_icons = manifest['action']['default_icon']
        print(f"✅ Action图标配置: {list(action_icons.keys())}")

    # 检查icons配置
    if 'icons' in manifest:
        extension_icons = manifest['icons']
        print(f"✅ Extension图标配置: {list(extension_icons.keys())}")

    # 检查权限
    if 'permissions' in manifest:
        print(f"✅ 权限配置: {manifest['permissions']}")

    # 检查side_panel
    if 'side_panel' in manifest:
        print(f"✅ 侧边栏配置: {manifest['side_panel']}")

    # 最终结果
    print("\n" + "=" * 50)
    if all_files_exist and all_icons_valid:
        print("🎉 扩展验证通过！所有文件完整且格式正确")
        print("\n📝 安装步骤:")
        print("1. 打开Chrome浏览器")
        print("2. 访问 chrome://extensions/")
        print("3. 开启'开发者模式'")
        print("4. 点击'加载已解压的扩展程序'")
        print(f"5. 选择目录: {os.path.abspath(extension_dir)}")
        print("\n🚀 现在可以安装扩展了！")
        return True
    else:
        print("❌ 扩展验证失败，请检查上述错误")
        return False

if __name__ == "__main__":
    validate_extension()
