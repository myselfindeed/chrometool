const { createApp, h } = Vue;

createApp({
    data() {
        return {
            // 状态管理
            isSelecting: false,
            selectedElements: [],
            collectedData: [],
            isCollecting: false,
            collectionProgress: {
                current: 0,
                total: 0
            },

            // UI状态
            showHelpModal: false,
            showSettingsModal: false,

            // 设置
            settings: {
                defaultFileName: '数据采集_{date}.xlsx',
                maxElements: 10
            }
        }
    },

    computed: {
        progressPercentage() {
            if (this.collectionProgress.total === 0) return 0;
            return (this.collectionProgress.current / this.collectionProgress.total) * 100;
        }
    },

    methods: {
        loadSettings() {
            chrome.storage.sync.get(['settings'], (result) => {
                if (result.settings) {
                    this.settings = { ...this.settings, ...result.settings };
                }
            });
        },

        saveSettings() {
            chrome.storage.sync.set({ settings: this.settings }, () => {
                this.showSettingsModal = false;
                this.showNotification('设置已保存');
            });
        },

        resetSettings() {
        this.settings = {
            defaultFileName: '数据采集_{date}.xlsx',
            maxElements: 10
        };
        this.saveSettings();
    },

        // 元素选取相关
        async startSelection() {
            if (this.selectedElements.length >= this.settings.maxElements) {
                this.showNotification(`最多只能选择${this.settings.maxElements}个元素`, 'warning');
                return;
            }

            this.isSelecting = true;

            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                
                // Content script is already injected via manifest.json
                // We just need to check if it's responsive first, or just send the message
                // Using try-catch to handle cases where the content script hasn't loaded yet
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'startElementSelection',
                    maxElements: this.settings.maxElements,
                    currentCount: this.selectedElements.length
                });
            } catch (error) {
                console.error('启动元素选取失败:', error);
                this.showNotification('启动元素选取失败，请确认页面已完全加载或尝试刷新', 'error');
                this.isSelecting = false;
            }
        },

        async finishSelection() {
            this.isSelecting = false;

            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'stopElementSelection'
                });
            } catch (error) {
                console.error('停止元素选取失败:', error);
            }
        },

        cancelSelection() {
            this.finishSelection();
            this.showNotification('已取消元素选取');
        },

        // 元素管理
        addElement(element) {
            if (this.selectedElements.length >= this.settings.maxElements) {
                this.showNotification(`最多只能选择${this.settings.maxElements}个元素`, 'warning');
                return false;
            }

            // 检查是否已经存在相同的元素（基于选择器去重）
            const existingElement = this.selectedElements.find(el => el.selector === element.selector);
            if (existingElement) {
                this.showNotification('该元素已被选择', 'warning');
                return false;
            }

            const newElement = {
                id: Date.now() + Math.random(),
                selector: element.selector,
                xpath: element.xpath,
                tagName: element.tagName,
                className: element.className || '',
                role: element.role || null,
                alias: (element.tagName || `元素 ${this.selectedElements.length + 1}`).substring(0, 8),
                excelColumn: '',
                contentType: element.contentType || 'text',
                isEditing: false
            };

            this.selectedElements.push(newElement);
            this.saveElements();

            if (this.selectedElements.length >= this.settings.maxElements) {
                this.finishSelection();
                this.showNotification('已达到最大元素数量限制');
            }

            return true;
        },

        removeElement(index) {
            this.selectedElements.splice(index, 1);
            this.saveElements();
            // this.updateSortable(); // 暂时禁用
        },

        clearAll() {
            if (confirm('确定要清空所有已选元素吗？')) {
                this.selectedElements = [];
                this.collectedData = [];
                this.saveElements();
            }
        },

        // 元素编辑
        startEditing(element) {
            element.isEditing = true;
            this.$nextTick(() => {
                const input = this.$refs.editInput?.[0];
                if (input) {
                    input.focus();
                    input.select();
                }
            });
        },

        finishEditing(element) {
            element.isEditing = false;
            if (!element.alias.trim()) {
                element.alias = `元素 ${this.selectedElements.indexOf(element) + 1}`;
            }
            this.saveElements();
        },

        cancelEditing(element) {
            element.isEditing = false;
        },

        // 排序功能 - 暂时禁用以解决CSP问题
        /*
        initializeSortable() {
            this.$nextTick(() => {
                const list = this.$refs.elementsList;
                if (list && !this.sortable) {
                    this.sortable = Sortable.create(list, {
                        handle: '.element-drag',
                        animation: 150,
                        onEnd: this.onSortEnd
                    });
                }
            });
        },

        updateSortable() {
            this.$nextTick(() => {
                if (this.sortable) {
                    this.sortable.destroy();
                    this.sortable = null;
                }
                this.initializeSortable();
            });
        },

        onSortEnd() {
            this.saveElements();
        },
        */

        // 数据采集
        async startCollection() {
            if (this.selectedElements.length === 0) {
                this.showNotification('请先选择要采集的元素', 'warning');
                return;
            }

            this.isCollecting = true;
            this.collectionProgress = { current: 0, total: 1 };
            this.collectedData = [];

            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                const result = await chrome.tabs.sendMessage(tab.id, {
                    action: 'collectData',
                    elements: this.selectedElements
                });

                if (result && result.data) {
                    this.collectedData = result.data;
                    this.showNotification(`采集完成，共获取${this.collectedData.length}条数据`);
                } else {
                    throw new Error('采集失败');
                }
            } catch (error) {
                console.error('数据采集失败:', error);
                this.showNotification('数据采集失败', 'error');
            } finally {
                this.isCollecting = false;
                this.collectionProgress = { current: 0, total: 0 };
            }
        },

        // Excel导出
        async exportToExcel() {
            if (this.collectedData.length === 0) {
                this.showNotification('没有数据可导出', 'warning');
                return;
            }

            try {
                // 准备数据
                const headers = this.selectedElements.map((el, index) =>
                    el.excelColumn || el.alias || `列${index + 1}`
                );

                const data = this.collectedData.map(row =>
                    this.selectedElements.map((el, index) => row[index] || '')
                );

                // 创建工作簿
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
                XLSX.utils.book_append_sheet(wb, ws, '数据采集');

                // 生成文件名
                const now = new Date();
                const dateStr = now.toISOString().split('T')[0];
                const fileName = this.settings.defaultFileName.replace('{date}', dateStr);

                // 转换为二进制
                const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([wbout], { type: 'application/octet-stream' });

                // 下载文件
                const url = URL.createObjectURL(blob);
                await chrome.downloads.download({
                    url: url,
                    filename: fileName,
                    saveAs: true
                });

                this.showNotification('Excel文件导出成功');
                URL.revokeObjectURL(url);

            } catch (error) {
                console.error('导出Excel失败:', error);
                this.showNotification('导出Excel失败', 'error');
            }
        },

        // 消息监听
        setupMessageListener() {
            chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
                if (message.action === 'elementSelected') {
                    console.log('接收到元素选择消息:', message.element.selector);
                    const added = this.addElement(message.element);
                    console.log('元素添加结果:', added, '当前元素数量:', this.selectedElements.length);
                    if (added) {
                        // 更新content.js的计数显示
                        try {
                            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                            await chrome.tabs.sendMessage(tab.id, {
                                action: 'updateCount',
                                count: this.selectedElements.length
                            });
                        } catch (error) {
                            console.error('更新计数失败:', error);
                            // 如果消息发送失败，至少确保侧边栏显示是正确的
                            this.$nextTick(() => {
                                this.$forceUpdate();
                            });
                        }
                    }
                }
                sendResponse({ success: true });
            });
        },

        // 本地存储
        async saveElements() {
            try {
                await chrome.storage.local.set({
                    selectedElements: this.selectedElements
                });
            } catch (error) {
                console.error('保存元素失败:', error);
            }
        },

        // UI相关
        showHelp() {
            this.showHelpModal = true;
        },

        showSettings() {
            this.showSettingsModal = true;
        },

        showNotification(message, type = 'info') {
            // 这里可以集成一个通知系统
            console.log(`[${type.toUpperCase()}] ${message}`);

            // 简单的浏览器通知
            if (type === 'error') {
                alert(`错误: ${message}`);
            } else {
                // 可以在这里添加一个toast通知
                const notification = document.createElement('div');
                notification.className = `notification notification-${type}`;
                notification.textContent = message;
                document.body.appendChild(notification);

                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 3000);
            }
        },

        // Render methods
        renderHeader() {
            return h('div', { class: 'header' }, [
                h('div', { class: 'header-left' }, [
                    h('img', { src: '../assets/icon32.png', alt: '图标', class: 'header-icon' }),
                    h('h1', null, 'Web元素数据采集器')
                ]),
                h('div', { class: 'header-right' }, [
                    h('button', {
                        class: 'btn-icon',
                        title: '帮助',
                        onClick: this.showHelp
                    }, [
                        h('svg', { viewBox: '0 0 24 24', width: '20', height: '20' }, [
                            h('path', { fill: 'currentColor', d: 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,6V8H13V6H11M11,10V18H13V10H11Z' })
                        ])
                    ]),
                    h('button', {
                        class: 'btn-icon',
                        title: '设置',
                        onClick: this.showSettings
                    }, [
                        h('svg', { viewBox: '0 0 24 24', width: '20', height: '20' }, [
                            h('path', { fill: 'currentColor', d: 'M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z' })
                        ])
                    ])
                ])
            ]);
        },

        renderMainContent() {
            const content = [];

            // 引导区域 - 当没有选择元素且不在选择模式时显示
            if (!this.isSelecting && this.selectedElements.length === 0) {
                content.push(this.renderGuideSection());
            }

            // 选择模式提示
            if (this.isSelecting) {
                content.push(this.renderSelectionMode());
            }

            // 已选元素列表
            if (this.selectedElements.length > 0 && !this.isSelecting) {
                content.push(this.renderElementsSection());
            }

            // 采集控制区域
            if (this.selectedElements.length > 0 && !this.isSelecting) {
                content.push(this.renderCollectionSection());
            }

            // 导出功能区域
            if (this.collectedData.length > 0) {
                content.push(this.renderExportSection());
            }

            return content;
        },

        renderGuideSection() {
            return h('div', { class: 'guide-section' }, [
                h('div', { class: 'guide-content' }, [
                    h('h3', null, '开始使用数据采集器'),
                    h('ol', null, [
                        h('li', null, '点击"开始选取"按钮'),
                        h('li', null, '在页面上点击要采集的元素'),
                        h('li', null, '最多可选10个元素')
                    ]),
                    h('button', {
                        class: 'btn-primary',
                        onClick: this.startSelection
                    }, '开始选取')
                ])
            ]);
        },

        renderSelectionMode() {
            return h('div', { class: 'selection-mode' }, [
                h('div', { class: 'selection-notice' }, [
                    h('div', { class: 'selection-icon' }, '🎯'),
                    h('h3', null, '元素选取模式'),
                    h('p', null, '请在网页上点击要采集的元素'),
                    h('p', { class: 'selection-count' }, `已选: ${this.selectedElements.length}/10`),
                    h('div', { class: 'selection-buttons' }, [
                        h('button', {
                            class: 'btn-success',
                            onClick: this.finishSelection
                        }, '完成选取'),
                        h('button', {
                            class: 'btn-secondary',
                            onClick: this.cancelSelection
                        }, '取消')
                    ])
                ])
            ]);
        },

        renderElementsSection() {
            const elements = this.selectedElements.map((element, index) =>
                this.renderElementItem(element, index)
            );

            return h('div', { class: 'elements-section' }, [
                h('div', { class: 'section-header' }, [
                    h('h3', null, `已选元素 (${this.selectedElements.length}/10)`),
                    h('div', { class: 'section-actions' }, [
                        h('button', {
                            class: 'btn-danger btn-small',
                            onClick: this.clearAll
                        }, '清空'),
                        h('button', {
                            class: 'btn-secondary btn-small',
                            onClick: this.startSelection
                        }, '继续选取')
                    ])
                ]),
                h('div', {
                    class: 'elements-list',
                    ref: 'elementsList'
                }, elements)
            ]);
        },

        renderElementItem(element, index) {
            return h('div', {
                class: ['element-item', { 'element-highlight': element.isEditing }],
                key: element.id
            }, [
                // 拖拽手柄 - 暂时隐藏，因为排序功能被禁用
                // h('div', { class: 'element-drag' }, [
                //     h('svg', { viewBox: '0 0 24 24', width: '16', height: '16' }, [
                //         h('path', { fill: 'currentColor', d: 'M7,19V17H9V19H7M11,19V17H13V19H11M15,19V17H17V19H15M7,15V13H9V15H7M11,15V13H13V15H11M15,15V13H17V15H15M7,11V9H9V11H7M11,11V9H13V11H11M15,11V9H17V11H15M7,7V5H9V7H7M11,7V5H13V7H11M15,7V5H17V7H15Z' })
                //     ])
                // ]),
                h('div', { class: 'element-content' }, [
                    element.isEditing ? this.renderElementInput(element) : this.renderElementName(element, index)
                ]),
                h('button', {
                    class: 'btn-icon btn-remove',
                    onClick: () => this.removeElement(index)
                }, [
                    h('svg', { viewBox: '0 0 24 24', width: '16', height: '16' }, [
                        h('path', { fill: 'currentColor', d: 'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z' })
                    ])
                ])
            ]);
        },

        renderElementName(element, index) {
            return h('div', {
                class: 'element-name',
                onClick: () => this.startEditing(element)
            }, element.alias || `元素 ${index + 1}`);
        },

        renderElementInput(element) {
            return h('input', {
                class: 'element-input',
                value: element.alias,
                placeholder: '输入别名',
                ref: 'editInput',
                onInput: (e) => { element.alias = e.target.value; },
                onBlur: () => this.finishEditing(element),
                onKeyup: (e) => {
                    if (e.key === 'Enter') this.finishEditing(element);
                    if (e.key === 'Escape') this.cancelEditing(element);
                }
            });
        },

        renderCollectionSection() {
            const content = [
                h('button', {
                    class: 'btn-primary',
                    disabled: this.isCollecting,
                    onClick: this.startCollection
                }, this.isCollecting ? '采集中...' : '开始采集')
            ];

            if (this.collectionProgress.total > 0) {
                content.push(h('div', { class: 'progress-info' }, [
                    `采集进度: ${this.collectionProgress.current}/${this.collectionProgress.total}`,
                    h('div', { class: 'progress-bar' }, [
                        h('div', {
                            class: 'progress-fill',
                            style: { width: this.progressPercentage + '%' }
                        })
                    ])
                ]));
            }

            return h('div', { class: 'collection-section' }, content);
        },

        renderExportSection() {
            return h('div', { class: 'export-section' }, [
                h('div', { class: 'export-header' }, [
                    h('h3', null, `采集结果 (${this.collectedData.length}条数据)`)
                ]),
                this.renderColumnMapping(),
                h('button', {
                    class: 'btn-success',
                    onClick: this.exportToExcel
                }, '导出Excel')
            ]);
        },

        renderColumnMapping() {
            const columns = this.selectedElements.map((element, index) =>
                h('div', { class: 'column-item', key: element.id }, [
                    h('span', { class: 'column-label' }, `${element.alias || `元素 ${index + 1}`} →`),
                    h('input', {
                        class: 'column-input',
                        value: element.excelColumn,
                        placeholder: element.alias || `列${index + 1}`,
                        onInput: (e) => { element.excelColumn = e.target.value; }
                    })
                ])
            );

            return h('div', { class: 'column-mapping' }, [
                h('h4', null, 'Excel列名设置：'),
                ...columns
            ]);
        },

        renderHelpModal() {
            return h('div', { class: 'modal-overlay', onClick: () => this.showHelpModal = false }, [
                h('div', { class: 'modal-content', onClick: (e) => e.stopPropagation() }, [
                    h('div', { class: 'modal-header' }, [
                        h('h3', null, '使用帮助'),
                        h('button', {
                            class: 'modal-close',
                            onClick: () => this.showHelpModal = false
                        }, '×')
                    ]),
                    h('div', { class: 'modal-body' }, [
                        h('h4', null, '基本操作流程：'),
                        h('ol', null, [
                            h('li', null, '点击"开始选取"按钮进入选取模式'),
                            h('li', null, '在网页上点击要采集的元素'),
                            h('li', null, '为元素设置别名（可选）'),
                            h('li', null, '调整元素顺序（拖拽排序）'),
                            h('li', null, '点击"开始采集"获取数据'),
                            h('li', null, '设置Excel列名后导出')
                        ]),
                        h('h4', null, '支持的内容类型：'),
                        h('ul', null, [
                            h('li', null, '文本内容 (innerText)'),
                            h('li', null, '链接地址 (href)'),
                            h('li', null, '图片地址 (src)'),
                            h('li', null, '自定义属性值')
                        ])
                    ])
                ])
            ]);
        },

        renderSettingsModal() {
            return h('div', { class: 'modal-overlay', onClick: () => this.showSettingsModal = false }, [
                h('div', { class: 'modal-content', onClick: (e) => e.stopPropagation() }, [
                    h('div', { class: 'modal-header' }, [
                        h('h3', null, '设置'),
                        h('button', {
                            class: 'modal-close',
                            onClick: () => this.showSettingsModal = false
                        }, '×')
                    ]),
                    h('div', { class: 'modal-body' }, [
                        h('div', { class: 'setting-item' }, [
                            h('label', null, '默认文件名：'),
                            h('input', {
                                class: 'setting-input',
                                value: this.settings.defaultFileName,
                                onInput: (e) => { this.settings.defaultFileName = e.target.value; }
                            })
                        ]),
                        h('div', { class: 'setting-item' }, [
                            h('label', null, '最大元素数量：'),
                            h('input', {
                                class: 'setting-input',
                                type: 'number',
                                min: '1',
                                max: '20',
                                value: this.settings.maxElements,
                                onInput: (e) => { this.settings.maxElements = parseInt(e.target.value); }
                            })
                        ]),
                        h('div', { class: 'setting-actions' }, [
                            h('button', {
                                class: 'btn-primary',
                                onClick: this.saveSettings
                            }, '保存'),
                            h('button', {
                                class: 'btn-secondary',
                                onClick: this.resetSettings
                            }, '重置')
                        ])
                    ])
                ])
            ]);
        }
    },

    render() {
        return h('div', { id: 'app' }, [
            // 头部区域
            this.renderHeader(),

            // 主要内容区域
            this.renderMainContent(),

            // 模态框
            this.showHelpModal && this.renderHelpModal(),
            this.showSettingsModal && this.renderSettingsModal()
        ]);
    },

    mounted() {
        this.loadSettings();
        this.setupMessageListener();
    }
}).mount('#app');
