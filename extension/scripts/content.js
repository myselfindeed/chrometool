// 内容脚本 - 处理网页中的元素选取和数据采集
class ElementSelector {
    constructor() {
        this.isSelecting = false;
        this.overlay = null;
        this.listeners = [];
        this.lastClickTime = 0; // 用于防抖
        this.setupMessageListener();
    }

    // 消息监听
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.action) {
                case 'startElementSelection':
                    this.startSelection({
                        maxElements: message.maxElements,
                        currentCount: message.currentCount || 0
                    });
                    sendResponse({ success: true });
                    break;
                case 'stopElementSelection':
                    this.stopSelection();
                    sendResponse({ success: true });
                    break;
                case 'collectData':
                    this.collectData(message.elements).then(result => {
                        sendResponse(result);
                    });
                    return true; // 异步响应
                case 'updateCount':
                    this.updateSelectedCount(message.count);
                    this.showNotification(`已选择元素 (${message.count}/${this.maxElements})`);
                    sendResponse({ success: true });
                    break;
                default:
                    sendResponse({ success: false });
            }
        });
    }

    // 开始元素选取
    startSelection(options = {}) {
        const { maxElements = 10, currentCount = 0 } = options;
        this.isSelecting = true;
        this.maxElements = maxElements;
        this.createOverlay();
        this.addEventListeners();
        // 初始化计数显示
        this.updateSelectedCount(currentCount);
        this.showNotification('开始元素选取，请点击要采集的元素');
    }

    // 停止元素选取
    stopSelection() {
        this.isSelecting = false;
        this.removeOverlay();
        this.removeEventListeners();
        this.showNotification('元素选取已停止');
    }

    // 创建覆盖层
    createOverlay() {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.id = 'element-selector-overlay';
        this.overlay.innerHTML = `
            <div class="selector-header">
                <div class="selector-info">
                    <span class="selector-icon">🎯</span>
                    <span>元素选取模式 - 已选: <span id="selected-count">0</span>/${this.maxElements}</span>
                </div>
                <button id="stop-selection-btn" class="selector-btn">停止选取</button>
            </div>
            <div class="selector-hint">
                点击页面元素进行选取，右键取消
            </div>
        `;

        const style = document.createElement('style');
        style.id = 'element-selector-styles';
        style.setAttribute('data-selector-style', 'true');
        style.textContent = `
            #element-selector-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 999999;
                background: rgba(66, 133, 244, 0.9);
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                pointer-events: none;
            }

            .selector-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: rgba(0, 0, 0, 0.2);
            }

            .selector-info {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .selector-icon {
                font-size: 18px;
            }

            .selector-btn {
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                pointer-events: auto;
                transition: background-color 0.2s;
            }

            .selector-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .selector-hint {
                padding: 8px 16px;
                text-align: center;
                font-size: 14px;
                opacity: 0.9;
            }

            .element-selector-highlight {
                outline: 3px solid #ea4335 !important;
                outline-offset: 2px !important;
                background-color: rgba(234, 67, 53, 0.1) !important;
                cursor: pointer !important;
            }

            .element-selector-hover {
                outline: 2px solid #4285f4 !important;
                outline-offset: 1px !important;
                background-color: rgba(66, 133, 244, 0.1) !important;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(this.overlay);

        // 绑定停止按钮事件
        document.getElementById('stop-selection-btn').addEventListener('click', () => {
            this.stopSelection();
        });
    }

    // 移除覆盖层
    removeOverlay() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }

        // 移除样式
        const style = document.querySelector('style[data-selector-style]');
        if (style) {
            style.remove();
        }

        // 清除所有高亮
        document.querySelectorAll('.element-selector-highlight, .element-selector-hover').forEach(el => {
            el.classList.remove('element-selector-highlight', 'element-selector-hover');
        });
    }

    // 添加事件监听器
    addEventListeners() {
        const handleMouseOver = (e) => {
            if (!this.isSelecting) return;

            // 移除之前的悬停高亮
            document.querySelectorAll('.element-selector-hover').forEach(el => {
                el.classList.remove('element-selector-hover');
            });

            // 添加新的悬停高亮
            if (e.target !== document.body && e.target !== document.documentElement) {
                e.target.classList.add('element-selector-hover');
            }
        };

        const handleMouseOut = (e) => {
            if (e.target.classList.contains('element-selector-hover')) {
                e.target.classList.remove('element-selector-hover');
            }
        };

        const handleClick = (e) => {
            if (!this.isSelecting) return;

            // 防抖：防止快速连续点击
            const now = Date.now();
            if (now - this.lastClickTime < 500) { // 500ms内的重复点击忽略
                return;
            }
            this.lastClickTime = now;

            e.preventDefault();
            e.stopPropagation();

            const element = e.target;

            // 跳过覆盖层内的元素
            if (element.closest('#element-selector-overlay')) {
                return;
            }

            // 首先移除临时类，确保选择器生成时元素状态是干净的
            element.classList.remove('element-selector-hover');

            // 收集元素的完整信息用于精确匹配
            const elementInfo = this.collectElementInfo(element);

            // 生成选择器
            const selector = this.generateSelector(elementInfo);
            const xpath = this.getXPath(element);

            // 验证选择器是否有效（至少能找到当前元素）
            const testElements = document.querySelectorAll(selector);
            if (testElements.length === 0) {
                console.warn(`生成的CSS选择器 "${selector}" 无法找到任何元素，使用标签选择器`);
                // 如果CSS选择器无效，使用纯标签选择器作为fallback
                const fallbackSelector = element.tagName.toLowerCase();
                const fallbackElements = document.querySelectorAll(fallbackSelector);
                if (fallbackElements.length > 0) {
                    elementInfo.fallbackSelector = selector; // 保存原始选择器用于调试
                    elementInfo.selector = fallbackSelector; // 使用标签选择器
                }
            }

            // 确定内容类型
            let contentType = 'text';
            if (element.tagName === 'A') {
                contentType = 'href';
            } else if (element.tagName === 'IMG') {
                contentType = 'src';
            }

            const elementData = {
                selector: selector,
                xpath: xpath,
                contentType: contentType,
                tagName: elementInfo.tagName,
                className: elementInfo.className,
                role: elementInfo.role,
                text: element.textContent?.trim().substring(0, 50) || '',
                elementInfo: elementInfo // 保存完整信息用于调试
            };

            // 添加视觉反馈
            element.classList.add('element-selector-highlight');

            // 发送到侧边栏，让侧边栏管理元素计数
            chrome.runtime.sendMessage({
                action: 'elementSelected',
                element: elementData
            });

            // 暂时显示"选择中..."，等待侧边栏确认
            this.showNotification('选择中...');
        };

        const handleContextMenu = (e) => {
            if (this.isSelecting) {
                e.preventDefault();
                this.stopSelection();
            }
        };

        document.addEventListener('mouseover', handleMouseOver, true);
        document.addEventListener('mouseout', handleMouseOut, true);
        document.addEventListener('click', handleClick, true);
        document.addEventListener('contextmenu', handleContextMenu);

        this.listeners = [
            { type: 'mouseover', handler: handleMouseOver },
            { type: 'mouseout', handler: handleMouseOut },
            { type: 'click', handler: handleClick },
            { type: 'contextmenu', handler: handleContextMenu }
        ];
    }

    // 移除事件监听器
    removeEventListeners() {
        this.listeners.forEach(({ type, handler }) => {
            document.removeEventListener(type, handler, true);
        });
        this.listeners = [];
    }

    // 收集元素的完整信息
    collectElementInfo(element) {
        const info = {
            tagName: element.tagName,
            id: element.id || null,
            className: element.className || '',
            classes: [],
            role: element.getAttribute('role') || null,
            otherAttributes: {}
        };

        // 收集所有class，排除扩展添加的临时类
        if (info.className) {
            const tempClasses = ['element-selector-hover', 'element-selector-highlight'];
            info.classes = info.className.trim().split(/\s+/).filter(c => c && !tempClasses.includes(c));
        }

        // 收集其他可能用于区分的属性
        const importantAttributes = ['type', 'name', 'value', 'href', 'src', 'alt', 'title'];
        importantAttributes.forEach(attr => {
            const value = element.getAttribute(attr);
            if (value) {
                info.otherAttributes[attr] = value;
            }
        });

        return info;
    }

    // 生成CSS选择器 - 选择所有相同类型的元素（标签名、role、class都相同）
    generateSelector(elementInfo) {
        // 优先使用ID（如果有ID，则只匹配这一个元素）
        if (elementInfo.id) {
            return `#${elementInfo.id}`;
        }

        const tagName = elementInfo.tagName.toLowerCase();
        const parts = [tagName];

        // 添加role属性
        if (elementInfo.role) {
            parts.push(`[role="${elementInfo.role}"]`);
        }

        // 添加所有class（排除临时添加的类，按字母顺序排序以确保一致性）
        if (elementInfo.classes.length > 0) {
            // 排除扩展添加的临时类
            const tempClasses = ['element-selector-hover', 'element-selector-highlight'];
            const filteredClasses = elementInfo.classes.filter(cls => !tempClasses.includes(cls));
            const sortedClasses = [...filteredClasses].sort();
            sortedClasses.forEach(cls => {
                parts.push(`.${cls}`);
            });
        }

        // 添加其他重要属性
        Object.entries(elementInfo.otherAttributes).forEach(([attr, value]) => {
            parts.push(`[${attr}="${value}"]`);
        });

        return parts.join('');
    }

    // 获取XPath
    getXPath(element) {
        if (element.id) {
            return `//*[@id="${element.id}"]`;
        }

        if (element.name) {
            return `//${element.tagName.toLowerCase()}[@name="${element.name}"]`;
        }

        let path = [];
        let current = element;

        while (current && current.nodeType === Node.ELEMENT_NODE) {
            let index = 1;
            let sibling = current.previousSibling;

            while (sibling) {
                if (sibling.nodeType === Node.ELEMENT_NODE &&
                    sibling.tagName === current.tagName) {
                    index++;
                }
                sibling = sibling.previousSibling;
            }

            let tagName = current.tagName.toLowerCase();
            let pathSegment = `${tagName}[${index}]`;
            path.unshift(pathSegment);

            current = current.parentNode;

            if (path.length > 10) break; // 限制XPath长度
        }

        return '/' + path.join('/');
    }

    // 更新选中计数 - 现在由侧边栏管理
    updateSelectedCount(count) {
        const countElement = document.getElementById('selected-count');
        if (countElement) {
            countElement.textContent = count;
        }
    }

    // 数据采集
    async collectData(elements) {
        try {
            // 首先，收集每种元素类型的所有匹配元素
            const allElementData = [];

            for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                let foundElements = document.querySelectorAll(element.selector);

                // 如果找不到元素，尝试使用更简单的选择器（只用标签名）
                if (foundElements.length === 0) {
                    const tagName = element.tagName?.toLowerCase();
                    if (tagName) {
                        console.log(`使用精确选择器 "${element.selector}" 未找到元素，尝试标签选择器 "${tagName}"`);
                        foundElements = document.querySelectorAll(tagName);
                    }
                }

                // 如果还是找不到元素，添加空数组
                if (foundElements.length === 0) {
                    console.warn(`无法找到元素，选择器: ${element.selector}, 标签: ${element.tagName}`);
                    allElementData.push([]);
                    continue;
                }

                // 过滤元素，确保只匹配完全相同的元素（标签名、role、class都相同）
                const matchingElements = Array.from(foundElements).filter(el => {
                    // 检查标签名
                    if (el.tagName !== element.tagName) return false;

                    // 检查role属性
                    const elRole = el.getAttribute('role');
                    if (element.role !== elRole) return false;

                    // 检查class（所有class都必须相同）
                    const elClasses = (el.className || '').trim().split(/\s+/).filter(c => c).sort();
                    const originalClasses = (element.className || '').trim().split(/\s+/).filter(c => c).sort();

                    if (elClasses.length !== originalClasses.length) return false;
                    for (let j = 0; j < elClasses.length; j++) {
                        if (elClasses[j] !== originalClasses[j]) return false;
                    }

                    return true;
                });

                console.log(`为元素 ${element.tagName} 找到了 ${matchingElements.length} 个完全匹配的元素`);

                // 采集匹配元素的数据
                const elementData = [];
                matchingElements.forEach(el => {
                    let value = '';

                    switch (element.contentType) {
                        case 'href':
                            value = el.href || '';
                            break;
                        case 'src':
                            value = el.src || '';
                            break;
                        case 'text':
                        default:
                            // 优先使用textContent获取元素标签中间的文本内容
                            // textContent返回元素内部的所有文本，包括子元素
                            // 这符合用户需求：<span>元素内容</span> 应该提取 "元素内容"
                            value = el.textContent?.trim() || el.innerText?.trim() || '';
                            break;
                    }

                    elementData.push(value);
                });

                allElementData.push(elementData);
            }

            // 现在创建数据行：每一行对应页面上的一个元素实例
            // 找到最大行数（即最多元素的数量）
            const maxRows = Math.max(...allElementData.map(arr => arr.length));

            const dataRows = [];
            for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
                const row = [];
                for (let colIndex = 0; colIndex < allElementData.length; colIndex++) {
                    // 如果该列在这一行有数据，取出来；否则为空
                    row.push(allElementData[colIndex][rowIndex] || '');
                }
                dataRows.push(row);
            }

            return {
                success: true,
                data: dataRows // 多行数据，每行对应一个元素实例
            };

        } catch (error) {
            console.error('数据采集失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 显示通知
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `selector-notification notification-${type}`;
        notification.textContent = message;

        // 绑定外部样式或创建唯一样式
        if (!document.getElementById('selector-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'selector-notification-styles';
            style.textContent = `
                .selector-notification {
                    position: fixed !important;
                    top: 60px !important;
                    right: 20px !important;
                    background: #4285f4 !important;
                    color: white !important;
                    padding: 12px 16px !important;
                    border-radius: 6px !important;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
                    font-size: 14px !important;
                    z-index: 1000000 !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
                    animation: slideIn 0.3s ease-out !important;
                }

                .notification-warning {
                    background: #fbbc04 !important;
                    color: #333 !important;
                }

                .notification-error {
                    background: #ea4335 !important;
                }

                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        document.body.appendChild(notification);

        // 自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 3000);
    }
}

// 等待DOM准备就绪后初始化
function initializeContentScript() {
    // 检查DOM是否有基本结构
    if (document.head && document.body) {
        if (window.hasInitializedElementSelector) {
            console.log('Web元素数据采集器: 已初始化，跳过');
            return;
        }
        console.log('Web元素数据采集器: DOM已准备，开始初始化');
        // 初始化选择器
        window.elementSelector = new ElementSelector();
        window.hasInitializedElementSelector = true;
    } else {
        // 如果DOM还没准备好，等待一下再试
        console.log('Web元素数据采集器: 等待DOM准备...');
        setTimeout(initializeContentScript, 10);
    }
}

// 开始初始化
initializeContentScript();
