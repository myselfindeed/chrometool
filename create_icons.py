#!/usr/bin/env python3
"""
Chrome扩展图标生成器
为Web元素数据采集器生成各种尺寸的PNG图标
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    """创建指定尺寸的图标"""
    # 创建一个新的RGBA图像
    img = Image.new('RGBA', (size, size), (66, 133, 244, 255))  # Google蓝背景
    draw = ImageDraw.Draw(img)

    # 计算元素尺寸
    padding = int(size * 0.1)
    inner_size = size - 2 * padding

    # 绘制外框
    draw.rectangle([padding, padding, size - padding, size - padding],
                  fill=(255, 255, 255, 255), outline=(52, 168, 83, 255), width=2)

    # 绘制数据采集图标元素
    # 绘制一个简化的数据表格图标

    # 绘制表头
    header_height = int(inner_size * 0.25)
    draw.rectangle([padding + 2, padding + 2, size - padding - 2, padding + header_height],
                  fill=(52, 168, 83, 200))

    # 绘制表格线条
    line_color = (52, 168, 83, 255)
    line_width = max(1, int(size / 64))

    # 垂直线
    v1_x = padding + int(inner_size * 0.4)
    v2_x = padding + int(inner_size * 0.7)

    draw.line([v1_x, padding, v1_x, size - padding], fill=line_color, width=line_width)
    draw.line([v2_x, padding, v2_x, size - padding], fill=line_color, width=line_width)

    # 水平线
    h1_y = padding + header_height
    h2_y = padding + int(inner_size * 0.5)
    h3_y = padding + int(inner_size * 0.75)

    draw.line([padding, h1_y, size - padding, h1_y], fill=line_color, width=line_width)
    draw.line([padding, h2_y, size - padding, h2_y], fill=line_color, width=line_width)
    draw.line([padding, h3_y, size - padding, h3_y], fill=line_color, width=line_width)

    # 在表格中添加一些简单的"数据点"
    dot_radius = max(1, int(size / 32))
    dot_color = (234, 67, 53, 255)  # 红色数据点

    # 在不同单元格中绘制数据点
    cells = [
        (int(padding + inner_size * 0.2), int(h1_y + (h2_y - h1_y) * 0.5)),
        (int(v1_x + (v2_x - v1_x) * 0.3), int(h2_y + (h3_y - h2_y) * 0.5)),
        (int(v2_x + (size - padding - v2_x) * 0.4), int(h3_y + (size - padding - h3_y) * 0.5)),
        (int(padding + inner_size * 0.15), int(h2_y + (h3_y - h2_y) * 0.3)),
        (int(v1_x + (v2_x - v1_x) * 0.7), int(h1_y + (h2_y - h1_y) * 0.7))
    ]

    for x, y in cells:
        draw.ellipse([x - dot_radius, y - dot_radius, x + dot_radius, y + dot_radius],
                    fill=dot_color)

    return img

def generate_icons():
    """生成所有尺寸的图标"""
    sizes = [16, 32, 48, 128]
    assets_dir = "extension/assets"

    # 确保目录存在
    os.makedirs(assets_dir, exist_ok=True)

    print("开始生成Chrome扩展图标...")

    for size in sizes:
        icon_path = f"{assets_dir}/icon{size}.png"

        # 生成图标
        icon = create_icon(size)

        # 保存为PNG
        icon.save(icon_path, "PNG")

        print(f"✓ 已生成 {size}x{size} 图标: {icon_path}")

        # 验证文件
        file_size = os.path.getsize(icon_path)
        print(f"  文件大小: {file_size} bytes")

    print("\n🎉 所有图标生成完成！")
    print("\n现在您可以重新加载Chrome扩展了。")

if __name__ == "__main__":
    generate_icons()
