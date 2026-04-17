// 测试sidePanel API可用性
console.log('🔍 测试Chrome sidePanel API...');

if (typeof chrome !== 'undefined' && chrome.sidePanel) {
    console.log('✅ chrome.sidePanel API可用');

    // 测试各个方法
    if (chrome.sidePanel.setPanelBehavior) {
        console.log('✅ setPanelBehavior 方法可用');
    } else {
        console.log('❌ setPanelBehavior 方法不可用');
    }

    if (chrome.sidePanel.open) {
        console.log('✅ open 方法可用');
    } else {
        console.log('❌ open 方法不可用');
    }

    if (chrome.sidePanel.getOptions) {
        console.log('✅ getOptions 方法可用');
    } else {
        console.log('❌ getOptions 方法不可用');
    }

    if (chrome.sidePanel.setOptions) {
        console.log('✅ setOptions 方法可用');
    } else {
        console.log('❌ setOptions 方法不可用');
    }
} else {
    console.log('❌ chrome.sidePanel API不可用');
    console.log('可能原因：');
    console.log('1. Chrome版本过低 (需要116+)');
    console.log('2. 扩展权限不足');
    console.log('3. Manifest配置错误');
    console.log('4. 扩展未正确加载');
}

// 检查扩展权限
if (typeof chrome !== 'undefined' && chrome.permissions) {
    chrome.permissions.contains({permissions: ['sidePanel']}, (result) => {
        if (result) {
            console.log('✅ 扩展具有sidePanel权限');
        } else {
            console.log('❌ 扩展缺少sidePanel权限');
        }
    });
} else {
    console.log('⚠️  无法检查权限 (permissions API不可用)');
}

console.log('📊 Chrome版本信息:');
if (navigator.userAgent) {
    const chromeMatch = navigator.userAgent.match(/Chrome\/(\d+)/);
    if (chromeMatch) {
        const version = parseInt(chromeMatch[1]);
        console.log(`   Chrome版本: ${version}`);
        if (version >= 116) {
            console.log('   ✅ 版本满足要求');
        } else {
            console.log('   ❌ 版本过低，需要116+');
        }
    }
}

console.log('🎯 测试完成。如有问题，请查看上方错误信息。');
