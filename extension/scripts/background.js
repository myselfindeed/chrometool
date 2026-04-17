// 后台脚本 - 处理扩展的生命周期和API调用

// 安装时初始化
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Web元素数据采集器已安装');

        // 初始化默认设置
        chrome.storage.sync.set({
            settings: {
                defaultFileName: '数据采集_{date}.xlsx',
                maxElements: 10
            }
        });

        // 显示欢迎页面或说明
        showWelcomeMessage();
    } else if (details.reason === 'update') {
        console.log('Web元素数据采集器已更新');
    }
});

// 处理快捷键
chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle_sidepanel') {
        toggleSidePanel();
    }
});

// 切换侧边栏
async function toggleSidePanel() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;

        // Check if side panel is supported and available
        if (chrome.sidePanel && chrome.sidePanel.getOptions) {
            const options = await chrome.sidePanel.getOptions({ tabId: tab.id });

            // If it's explicitly disabled for this tab, or if we want to toggle it
            // Note: sidePanel.getOptions and setOptions are for configuration
            // To actually open/close, usage varies by Chrome version.
            // For V3 with openPanelOnActionClick, it's mostly handled by the browser.
            // But for manual toggle:
            if (chrome.sidePanel.open) {
                await chrome.sidePanel.open({ tabId: tab.id });
            } else {
                // Fallback for older V3 versions where open() is not available
                fallbackOpenPanel();
            }
        } else {
            fallbackOpenPanel();
        }
    } catch (error) {
        console.error('切换侧边栏失败:', error);
        fallbackOpenPanel();
    }
}

// 显示欢迎消息
function showWelcomeMessage() {
    chrome.tabs.create({
        url: chrome.runtime.getURL('pages/welcome.html')
    });
}

// 注意：扩展图标点击由 setPanelBehavior 处理，无需手动监听
// chrome.action.onClicked.addListener(async (tab) => {
//     // 打开侧边栏
//     await chrome.sidePanel.open({ tabId: tab.id });
// });

// 处理消息传递
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'elementSelected':
            // 将元素选择消息转发到侧边栏
            chrome.runtime.sendMessage(message).catch(() => {
                // 忽略错误，侧边栏可能未打开
            });
            break;

        case 'showNotification':
            // 显示浏览器通知
            chrome.notifications.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('assets/icon128.png'),
                title: 'Web元素数据采集器',
                message: message.text
            });
            break;

        default:
            console.log('未知消息:', message);
    }

    sendResponse({ success: true });
});

// 处理下载完成
chrome.downloads.onChanged.addListener((downloadDelta) => {
    if (downloadDelta.state?.current === 'complete') {
        console.log('文件下载完成');
    }
});

// 处理标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // 当页面加载完成时，可以在这里做一些初始化工作
    if (changeInfo.status === 'complete') {
        // 可以在这里注入一些初始化脚本
    }
});

// 处理侧边栏显示
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    try {
        chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
        console.log('侧边栏行为已设置：点击扩展图标将打开侧边栏');
    } catch (error) {
        console.error('设置侧边栏行为失败:', error);
        setupFallbackClickHandler();
    }
} else {
    console.warn('chrome.sidePanel.setPanelBehavior 不可用，使用降级方案');
    setupFallbackClickHandler();
}

// 降级方案：手动处理扩展图标点击
function setupFallbackClickHandler() {
    chrome.action.onClicked.addListener(async (tab) => {
        console.log('扩展图标被点击 (降级模式)');

        // 尝试打开侧边栏
        if (chrome.sidePanel && chrome.sidePanel.open) {
            try {
                await chrome.sidePanel.open({ tabId: tab.id });
                console.log('侧边栏已打开');
            } catch (error) {
                console.error('打开侧边栏失败:', error);
                fallbackOpenPanel();
            }
        } else {
            fallbackOpenPanel();
        }
    });
}

// 降级方案：打开新标签页显示界面
function fallbackOpenPanel() {
    console.log('使用降级方案：打开新标签页');
    chrome.tabs.create({
        url: chrome.runtime.getURL('pages/sidepanel.html'),
        active: true
    });
}

// 注意：Service Worker环境中没有window对象
// 如需在其他脚本中使用此函数，请通过chrome.runtime.sendMessage通信
// window.toggleSidePanel = toggleSidePanel;
