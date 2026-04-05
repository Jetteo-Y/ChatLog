// 后台脚本，处理插件图标点击事件

// 存储插件状态
let isEnabled = true;

// 监听插件图标点击事件
chrome.action.onClicked.addListener(async (tab) => {
  // 切换状态
  isEnabled = !isEnabled;
  
  // 存储状态
  await chrome.storage.local.set({ isEnabled });
  
  // 向当前标签页发送消息，通知状态变化
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggle', isEnabled });
  }
  
  // 更新插件图标状态（可选）
  // 这里可以根据状态切换不同的图标
});

// 初始化状态
chrome.runtime.onInstalled.addListener(async () => {
  // 设置默认状态为启用
  await chrome.storage.local.set({ isEnabled: true });
});

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getState') {
    // 发送当前状态
    chrome.storage.local.get('isEnabled', (result) => {
      sendResponse({ isEnabled: result.isEnabled !== false });
    });
    return true; // 表示异步响应
  }
});