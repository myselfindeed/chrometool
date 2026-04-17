# Web元素数据采集器 Chrome扩展

一个强大的Chrome浏览器扩展，帮助用户快速从网页中提取指定元素内容，并导出为结构化Excel文件。

## 🚀 功能特点

- **智能元素选取**：鼠标点击/悬停高亮显示可选取元素
- **灵活排序**：已选元素支持拖拽上下排序
- **自定义别名**：为每个元素设置自定义名称（作为Excel列名）
- **多内容类型**：支持文本内容、链接地址、图片地址、自定义属性值
- **Excel导出**：将采集内容生成标准Excel文件
- **本地保存**：支持选择保存路径到电脑本地
- **响应式设计**：适配不同屏幕尺寸

## 📦 安装步骤

### 方法1：开发者模式安装（推荐）

1. **下载扩展文件**
   ```bash
   git clone <repository-url>
   cd chrometool/extension
   ```

2. **打开Chrome扩展管理页面**
   - 在地址栏输入：`chrome://extensions/`
   - 或者：菜单 → 更多工具 → 扩展程序

3. **启用开发者模式**
   - 右上角开启"开发者模式"

4. **加载扩展**
   - 点击"加载已解压的扩展程序"
   - 选择 `chrometool/extension` 文件夹

5. **完成安装**
   - 扩展将会出现在扩展列表中
   - 工具栏会显示扩展图标

### 方法2：打包安装

1. **压缩扩展文件**
   ```bash
   cd chrometool/extension
   zip -r extension.zip .
   ```

2. **安装ZIP包**
   - 在 `chrome://extensions/` 页面
   - 拖拽 `extension.zip` 文件到页面中

## 🎯 使用指南

### 基本操作流程

1. **打开目标网页**
   - 访问包含要采集数据的网页

2. **启动数据采集器**
   - 点击浏览器工具栏中的扩展图标
   - 或使用快捷键 `Alt+W`

3. **选择元素**
   - 点击"开始选取"按钮
   - 在页面上点击要采集的元素
   - 最多可选择10个元素

4. **设置别名**
   - 为每个元素设置自定义名称
   - 这些名称将作为Excel的列标题

5. **调整顺序**
   - 使用拖拽功能调整元素采集顺序

6. **采集数据**
   - 点击"开始采集"获取页面数据

7. **导出Excel**
   - 设置列名后点击"导出Excel"
   - 选择保存位置

### 快捷键

- `Alt+W`：打开/关闭侧边栏

### 支持的内容类型

| 类型 | 说明 | 示例 |
|------|------|------|
| 文本内容 | 元素的文本内容 | 商品名称、价格等 |
| 链接地址 | a标签的href属性 | 商品链接 |
| 图片地址 | img标签的src属性 | 商品图片 |
| 自定义属性 | 元素的任意属性值 | data-id、alt等 |

## ⚙️ 设置选项

- **默认文件名**：自定义导出文件的命名格式
- **最大元素数量**：设置最多可选择的元素数量（1-20）

## 🔧 技术实现

### 前端技术栈
- **框架**：Vue.js 3 + JavaScript
- **UI组件**：原生CSS + Flexbox/Grid
- **拖拽功能**：SortableJS
- **Excel处理**：SheetJS (xlsx)

### 浏览器API
- **内容脚本**：`chrome.scripting`
- **消息通信**：`chrome.runtime.sendMessage`
- **文件下载**：`chrome.downloads`
- **数据存储**：`chrome.storage`

### 权限说明
- `activeTab`：获取当前标签页内容
- `storage`：保存用户设置和临时数据
- `downloads`：导出文件到本地
- `scripting`：注入内容脚本

## 💻 系统要求

### 最低版本要求
- **Chrome**: 116.0+
- **Manifest**: V3
- **操作系统**: Windows 10+ / macOS 10.15+ / Linux

### API兼容性
- `chrome.sidePanel` - Chrome 114+
- `chrome.scripting` - Chrome 88+
- `chrome.downloads` - Chrome 88+

## 🐛 故障排除

### 扩展无法加载
- 确保所有文件都在正确的位置
- 检查 `manifest.json` 格式是否正确
- 尝试重新加载扩展

### 侧边栏无法打开 (TypeError: Cannot read properties of undefined)
**原因**: Chrome版本过低或API不可用
**解决方法**:
1. 检查Chrome版本 (需要116.0+)
2. 更新到最新版Chrome
3. 如果无法升级，使用降级模式 (新标签页)

### 脚本注入时机问题
**现象**: 扩展功能不生效，元素选取无效
**原因**: Content script在页面脚本（如aplus）之后执行
**解决方法**:
1. 扩展已配置为`run_at: "document_start"`，确保在页面脚本前执行
2. 如果仍有问题，检查页面是否有特殊的脚本加载顺序
3. 在隐身模式或无痕模式下测试，排除其他扩展干扰

### Content Security Policy (CSP) 错误
**现象**: `Uncaught TypeError: Cannot read properties of undefined` 或 eval相关错误
**原因**: CSP阻止字符串作为JavaScript执行，影响Vue.js、XLSX等库
**解决方法**:
1. 扩展已配置CSP策略允许必要的eval操作
2. 使用Vue.js生产版本（已配置）
3. 如果仍有问题：
   - 检查Chrome版本是否支持Manifest V3
   - 尝试在隐身模式下测试
   - 禁用其他可能影响的扩展

### 元素选取无效
- 确保页面已完全加载
- 尝试刷新页面后重新操作
- 检查是否有CSP限制

### Excel导出失败
- 检查浏览器下载权限
- 尝试更换文件名
- 查看浏览器控制台错误信息

### API权限错误
- 确保扩展有正确的权限
- 检查manifest.json中的permissions配置
- 重新安装扩展

## 📝 更新日志

### v1.0.0 (2024-12-XX)
- ✨ 初始版本发布
- 🎯 实现基础元素选取功能
- 📊 支持Excel导出
- 🎨 现代化的UI设计

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

## 📄 许可证

MIT License

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交GitHub Issue
- 发送邮件至开发者
