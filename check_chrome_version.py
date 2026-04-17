#!/usr/bin/env python3
"""
Chrome版本检查脚本
检查当前Chrome版本是否支持Web元素数据采集器扩展
"""

import platform
import subprocess
import re

def get_chrome_version():
    """获取Chrome浏览器版本"""
    system = platform.system().lower()

    try:
        if system == "darwin":  # macOS
            # 使用sw_vers或直接检查应用
            result = subprocess.run([
                "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                "--version"
            ], capture_output=True, text=True, timeout=10)

            if result.returncode == 0:
                version = result.stdout.strip()
                return version

        elif system == "windows":
            # Windows系统
            import winreg
            try:
                key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Google\Chrome\BLBeacon")
                version, _ = winreg.QueryValueEx(key, "version")
                return f"Google Chrome {version}"
            except:
                pass

        elif system == "linux":
            # Linux系统
            result = subprocess.run(["google-chrome", "--version"],
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                return result.stdout.strip()

        # 通用方法：尝试运行chrome --version
        result = subprocess.run(["google-chrome", "--version"],
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            return result.stdout.strip()

    except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError):
        pass

    return None

def parse_version(version_string):
    """解析版本号"""
    if not version_string:
        return None

    # 匹配版本号模式
    match = re.search(r'(\d+)\.(\d+)\.(\d+)\.?(\d+)?', version_string)
    if match:
        major = int(match.group(1))
        minor = int(match.group(2))
        build = int(match.group(3))
        patch = int(match.group(4)) if match.group(4) else 0
        return major, minor, build, patch

    return None

def check_compatibility(version_tuple):
    """检查版本兼容性"""
    if not version_tuple:
        return False, "无法获取版本信息"

    major, minor, build, patch = version_tuple

    # 扩展要求的版本
    required_major = 116

    if major >= required_major:
        return True, f"版本 {major}.{minor}.{build} 完全兼容"
    else:
        return False, f"版本 {major}.{minor}.{build} 过低，需要 {required_major}.0+"

def main():
    print("🔍 Chrome版本兼容性检查")
    print("=" * 50)

    # 获取Chrome版本
    chrome_version = get_chrome_version()

    if chrome_version:
        print(f"✅ 检测到Chrome: {chrome_version}")

        # 解析版本
        version_tuple = parse_version(chrome_version)
        if version_tuple:
            print(f"📊 解析版本: {version_tuple[0]}.{version_tuple[1]}.{version_tuple[2]}")

            # 检查兼容性
            is_compatible, message = check_compatibility(version_tuple)

            if is_compatible:
                print(f"🎉 {message}")
                print("\n✅ 您的Chrome版本完全支持Web元素数据采集器扩展！")
                print("现在可以安全地安装和使用扩展。")
            else:
                print(f"❌ {message}")
                print("\n⚠️  建议升级Chrome到最新版本以获得最佳体验")
                print("下载地址: https://www.google.com/chrome/")

        else:
            print("❌ 无法解析版本号")
            print("请手动检查Chrome版本 (设置 → 关于Chrome)")

    else:
        print("❌ 未检测到Chrome浏览器")
        print("\n请确保：")
        print("1. Chrome浏览器已安装")
        print("2. Chrome在标准安装位置")
        print("3. 或手动检查版本 (设置 → 关于Chrome)")

    print("\n" + "=" * 50)
    print("扩展要求:")
    print("- Chrome 116.0+ (推荐最新版本)")
    print("- 支持 Manifest V3")
    print("- 支持 sidePanel API")

    print("\n故障排除:")
    print("- 如果版本检查失败，请手动确认Chrome版本")
    print("- 确保使用的是Google官方Chrome浏览器")
    print("- Edge浏览器可能不完全兼容")

if __name__ == "__main__":
    main()
