# Web元素数据采集器 - Chrome扩展

根据需求文档完整实现的Chrome浏览器扩展，适配苹果M2芯片，支持从网页中提取指定元素内容并导出为Excel文件。

## 📁 项目结构

```
chrometool/
├── extension/                    # Chrome扩展主目录
│   ├── manifest.json            # 扩展配置文件
│   ├── package.json             # 项目依赖配置
│   ├── README.md               # 扩展使用说明
│   ├── test.html               # 测试页面
│   ├── assets/                 # 静态资源
│   │   ├── styles.css          # 主样式文件
│   │   ├── content.css         # 内容脚本样式
│   │   └── icon*.png           # 扩展图标
│   ├── pages/                  # HTML页面
│   │   ├── sidepanel.html      # 侧边栏主界面
│   │   └── welcome.html        # 欢迎页面
│   └── scripts/                # JavaScript文件
│       ├── background.js       # 后台脚本
│       ├── content.js          # 内容脚本
│       └── sidepanel.js        # 侧边栏逻辑
└── tool_download.md           # 原始需求文档
```

## 🎯 功能实现

### ✅ 核心功能
- **元素选取**：鼠标点击选取网页元素，最多10个
- **元素排序**：拖拽调整采集顺序
- **别名设置**：自定义元素名称作为Excel列名
- **内容采集**：支持文本、链接、图片等多种内容类型
- **Excel导出**：一键生成并下载Excel文件

### ✅ 界面设计
- **侧边栏布局**：右侧悬浮面板，宽度约400px
- **Material Design**：现代化UI设计风格
- **响应式设计**：适配不同屏幕尺寸
- **Vue.js框架**：使用Vue 3 + JavaScript

### ✅ 技术实现
- **Chrome APIs**：使用Manifest V3规范
- **元素选择器**：智能生成CSS选择器和XPath
- **数据存储**：chrome.storage本地存储
- **文件下载**：chrome.downloads API

## 🚀 安装使用

### 安装步骤
1. 打开Chrome浏览器，访问 `chrome://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `chrometool/extension/` 文件夹

### 基本使用
1. 访问目标网页
2. 点击扩展图标或按 `Alt+W`
3. 点击"开始选取"进入元素选择模式
4. 在页面上点击要采集的元素
5. 设置别名并调整顺序
6. 点击"开始采集"获取数据
7. 点击"导出Excel"下载文件

## 🧪 测试

项目包含完整的测试页面 `test.html`，包含：
- 商品信息展示
- 各种元素类型（文本、链接、图片、自定义属性）
- 用户信息和统计数据

## 🛠️ 开发技术

### 前端技术栈
- **Vue.js 3** - 响应式前端框架
- **JavaScript ES6+** - 现代JavaScript语法
- **CSS3** - 现代化样式
- **SortableJS** - 拖拽排序功能

### Chrome扩展技术
- **Manifest V3** - 最新扩展规范
- **Side Panel API** - 侧边栏界面
- **Content Scripts** - 页面内容注入
- **Service Worker** - 后台处理

### 数据处理
- **SheetJS (xlsx)** - Excel文件生成
- **DOM API** - 元素选择和内容提取
- **chrome.storage** - 本地数据存储

## 📋 需求覆盖

### ✅ 完全实现的功能
- [x] 元素选取与排序（1-10个元素）
- [x] 鼠标点击/悬停高亮显示
- [x] 拖拽排序功能
- [x] 别名设置（Excel列名）
- [x] 多种内容类型采集
- [x] Excel文件导出
- [x] 本地文件保存
- [x] 自定义文件名

### ✅ 界面设计
- [x] 右侧悬浮面板布局
- [x] Google Material Design风格
- [x] 简洁扁平化设计
- [x] 响应式适配

### ✅ 技术实现
- [x] Vue.js 3 + TypeScript准备
- [x] SheetJS Excel处理
- [x] SortableJS拖拽功能
- [x] Chrome APIs集成

## 🔧 权限配置

扩展需要的权限已在 `manifest.json` 中正确配置：
- `activeTab` - 访问当前标签页
- `storage` - 数据存储
- `downloads` - 文件下载
- `scripting` - 内容脚本注入

## 📱 兼容性

- **Chrome 88+** - 支持Manifest V3
- **macOS** - 完整兼容
- **Windows/Linux** - 跨平台支持

## 🎨 设计特色

- **直观的交互流程**：引导式操作，降低使用门槛
- **实时视觉反馈**：元素高亮、进度显示
- **优雅的错误处理**：友好的错误提示和恢复机制
- **现代化的UI**：符合Google设计规范

## 📈 项目优势

1. **功能完整**：覆盖所有需求文档中的功能点
2. **技术先进**：使用最新的Web技术和Chrome扩展规范
3. **用户友好**：直观易用的界面和操作流程
4. **性能优化**：高效的数据处理和内存管理
5. **扩展性强**：模块化设计，易于功能扩展

## 🔄 后续优化

- [ ] 添加多页自动采集功能
- [ ] 支持更多文件格式导出（CSV、JSON）
- [ ] 添加数据预览和编辑功能
- [ ] 实现批量元素选择
- [ ] 添加导入/导出配置功能

---

**项目状态**：✅ 完成
**兼容性测试**：✅ 通过
**功能验证**：✅ 完成
**文档完善**：✅ 完成
