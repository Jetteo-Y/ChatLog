// 适配器接口，定义平台适配方法
class PlatformAdapter {
  // 提取用户消息
  extractUserMessages() {}
  // 获取消息内容
  getMessageContent(messageElement) {}
  // 获取消息ID
  getMessageId(messageElement) {}
  // 跳转到消息位置
  scrollToMessage(messageId) {}
}

// ChatGPT平台适配器
class ChatGPTAdapter extends PlatformAdapter {
  // 提取用户消息元素
  extractUserMessages() {
    // 使用data属性查找用户消息
    const userMessages = [];
    const messageElements = document.querySelectorAll('[data-message-author-role="user"]');
    
    messageElements.forEach((element, index) => {
      const id = this.getMessageId(element);
      const content = this.getMessageContent(element);
      const preview = this.generatePreview(content);
      
      userMessages.push({
        id,
        content,
        preview,
        index,
        element
      });
    });
    
    return userMessages;
  }
  
  // 检查是否包含文件附件
  hasFileAttachment(messageElement) {
    // 查找常见的文件附件特征
    const fileSelectors = [
      '[data-testid*="file"]',
      '[data-testid*="attachment"]',
      '[role*="file"]',
      'input[type="file"]',
      'img[src*="file"]', 
      'img[alt*="file"]',
      '.file', 
      '.attachment', 
      '.upload',
      '[aria-label*="file"]',
      '[aria-label*="attachment"]'
    ];
    
    for (const selector of fileSelectors) {
      try {
        if (messageElement.querySelector(selector)) {
          return true;
        }
      } catch (e) {
        // 忽略无效选择器
      }
    }
    
    // 检查是否有包含文件的文本特征
    const text = messageElement.textContent;
    if (text.includes('上传') || text.includes('文件') || 
        text.includes('.pdf') || text.includes('.docx') || 
        text.includes('.xlsx') || text.includes('.txt') ||
        text.includes('.jpg') || text.includes('.png') ||
        text.includes('.md') || text.includes('.csv')) {
      return true;
    }
    
    return false;
  }
  
  // 获取消息内容
  getMessageContent(messageElement) {
    let content = '';
    let hasFile = this.hasFileAttachment(messageElement);
    let fileName = this.extractFileName(messageElement);
    
    // 查找所有可能包含文本内容的元素
    const allTextElements = messageElement.querySelectorAll('*');
    const textFragments = [];
    
    allTextElements.forEach(el => {
      // 排除script, style等元素
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
      
      // 获取直接子节点的文本
      Array.from(el.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent.trim();
          if (text.length > 0) {
            textFragments.push(text);
          }
        }
      });
    });
    
    // 去重并合并
    const uniqueTexts = [...new Set(textFragments)];
    content = uniqueTexts.join(' ');
    
    // 如果没有找到文本，使用整个元素的文本作为后备
    if (!content || content.length === 0) {
      content = messageElement.textContent.trim();
    }
    
    // 清理文本，移除重复和多余的空格
    content = content.replace(/\s+/g, ' ').trim();
    
    // 构建最终的内容
    let finalContent = '';
    
    if (hasFile) {
      if (fileName) {
        finalContent = `[文件] ${fileName}`;
        if (content && content !== fileName) {
          finalContent += ` ${content}`;
        }
      } else if (content) {
        finalContent = `[文件] ${content}`;
      } else {
        finalContent = '[文件]';
      }
    } else if (content) {
      finalContent = content;
    } else {
      finalContent = '[消息]';
    }
    
    return finalContent;
  }
  
  // 提取文件名（如果可能）
  extractFileName(messageElement) {
    // 尝试从各种属性中提取文件名
    const selectors = [
      '[title]',
      '[aria-label]',
      '[alt]',
      '[data-file-name]',
      '[data-name]'
    ];
    
    for (const selector of selectors) {
      const elements = messageElement.querySelectorAll(selector);
      for (const el of elements) {
        let fileName = '';
        if (el.title && el.title.length > 0 && el.title.length < 100) {
          fileName = el.title;
        } else if (el.getAttribute('aria-label') && 
                   el.getAttribute('aria-label').length > 0 && 
                   el.getAttribute('aria-label').length < 100) {
          fileName = el.getAttribute('aria-label');
        } else if (el.alt && el.alt.length > 0 && el.alt.length < 100) {
          fileName = el.alt;
        } else if (el.dataset.fileName) {
          fileName = el.dataset.fileName;
        } else if (el.dataset.name) {
          fileName = el.dataset.name;
        }
        
        if (fileName && !fileName.includes(' ')) { // 简单的文件名检查
          return fileName;
        }
      }
    }
    
    return null;
  }
  
  // 获取消息ID
  getMessageId(messageElement) {
    // 使用元素的唯一标识符或生成一个
    return messageElement.dataset.messageId || 
           messageElement.id || 
           `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // 生成预览文本
  generatePreview(content) {
    // 限制预览长度为100个字符
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }
  
  // 跳转到消息位置
  scrollToMessage(messageId) {
    // 查找对应的消息元素
    let messageElement;
    
    // 首先尝试通过ID查找
    if (messageId.startsWith('msg-')) {
      // 这是我们生成的ID，需要通过其他方式查找
      // 传递clearCache=false，保持消息元素的引用
      const userMessages = this.extractUserMessages(false);
      const targetMessage = userMessages.find(msg => msg.id === messageId);
      if (targetMessage) {
        messageElement = targetMessage.element;
      }
    } else {
      // 尝试通过data-message-id或id查找
      messageElement = document.querySelector(`[data-message-id="${messageId}"]`) || 
                      document.getElementById(messageId);
    }
    
    if (messageElement) {
      // 滚动到元素位置
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // 添加高亮效果
      messageElement.classList.add('message-highlight');
      
      // 3秒后移除高亮
      setTimeout(() => {
        messageElement.classList.remove('message-highlight');
      }, 1500);
      
      return true;
    }
    
    return false;
  }
}

// 豆包平台适配器
class DoubaoAdapter extends PlatformAdapter {
  // 提取用户消息元素
  extractUserMessages(clearCache = true) {
    // 使用data属性查找用户消息
    const userMessages = [];
    const messageElements = document.querySelectorAll('[data-testid="send_message"]');
    
    messageElements.forEach((element, index) => {
      const id = this.getMessageId(element);
      const content = this.getMessageContent(element);
      const preview = this.generatePreview(content);
      
      userMessages.push({
        id,
        content,
        preview,
        index,
        element
      });
    });
    
    return userMessages;
  }
  
  // 检查是否包含文件附件
  hasFileAttachment(messageElement) {
    // 查找常见的文件附件特征
    const fileSelectors = [
      '[data-testid*="file"]',
      '[data-testid*="attachment"]',
      '[role*="file"]',
      'input[type="file"]',
      'img[src*="file"]', 
      'img[alt*="文件"]',
      '.file', 
      '.attachment', 
      '.upload',
      '[aria-label*="文件"]',
      '[aria-label*="附件"]'
    ];
    
    for (const selector of fileSelectors) {
      try {
        if (messageElement.querySelector(selector)) {
          return true;
        }
      } catch (e) {
        // 忽略无效选择器
      }
    }
    
    // 检查是否有包含文件的文本特征
    const text = messageElement.textContent;
    if (text.includes('上传') || text.includes('文件') || 
        text.includes('.pdf') || text.includes('.docx') || 
        text.includes('.xlsx') || text.includes('.txt') ||
        text.includes('.jpg') || text.includes('.png') ||
        text.includes('.md') || text.includes('.csv')) {
      return true;
    }
    
    return false;
  }
  
  // 获取消息内容
  getMessageContent(messageElement) {
    let content = '';
    let hasFile = this.hasFileAttachment(messageElement);
    let fileName = this.extractFileName(messageElement);
    
    // 查找所有可能包含文本内容的元素
    const allTextElements = messageElement.querySelectorAll('*');
    const textFragments = [];
    
    allTextElements.forEach(el => {
      // 排除script, style等元素
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
      
      // 获取直接子节点的文本
      Array.from(el.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent.trim();
          if (text.length > 0) {
            textFragments.push(text);
          }
        }
      });
    });
    
    // 去重并合并
    const uniqueTexts = [...new Set(textFragments)];
    content = uniqueTexts.join(' ');
    
    // 如果没有找到文本，使用整个元素的文本作为后备
    if (!content || content.length === 0) {
      content = messageElement.textContent.trim();
    }
    
    // 清理文本，移除重复和多余的空格
    content = content.replace(/\s+/g, ' ').trim();
    
    // 构建最终的内容
    let finalContent = '';
    
    if (hasFile) {
      if (fileName) {
        finalContent = `[文件] ${fileName}`;
        if (content && content !== fileName) {
          finalContent += ` ${content}`;
        }
      } else if (content) {
        finalContent = `[文件] ${content}`;
      } else {
        finalContent = '[文件]';
      }
    } else if (content) {
      finalContent = content;
    } else {
      finalContent = '[消息]';
    }
    
    return finalContent;
  }
  
  // 提取文件名（如果可能）
  extractFileName(messageElement) {
    // 尝试从各种属性中提取文件名
    const selectors = [
      '[title]',
      '[aria-label]',
      '[alt]',
      '[data-file-name]',
      '[data-name]'
    ];
    
    for (const selector of selectors) {
      const elements = messageElement.querySelectorAll(selector);
      for (const el of elements) {
        let fileName = '';
        if (el.title && el.title.length > 0 && el.title.length < 100) {
          fileName = el.title;
        } else if (el.getAttribute('aria-label') && 
                   el.getAttribute('aria-label').length > 0 && 
                   el.getAttribute('aria-label').length < 100) {
          fileName = el.getAttribute('aria-label');
        } else if (el.alt && el.alt.length > 0 && el.alt.length < 100) {
          fileName = el.alt;
        } else if (el.dataset.fileName) {
          fileName = el.dataset.fileName;
        } else if (el.dataset.name) {
          fileName = el.dataset.name;
        }
        
        if (fileName && !fileName.includes(' ')) { // 简单的文件名检查
          return fileName;
        }
      }
    }
    
    return null;
  }
  
  // 获取消息ID
  getMessageId(messageElement) {
    // 尝试从消息内容元素获取ID
    const messageContent = messageElement.querySelector('[data-testid="message_content"]');
    if (messageContent) {
      return messageContent.dataset.messageId || 
             messageContent.id || 
             `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    // 回退到元素自身的ID
    return messageElement.id || 
           `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // 生成预览文本
  generatePreview(content) {
    // 限制预览长度为100个字符
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }
  
  // 跳转到消息位置
  scrollToMessage(messageId) {
    // 查找对应的消息元素
    let messageElement;
    
    // 首先尝试通过ID查找
    if (messageId.startsWith('msg-')) {
      // 这是我们生成的ID，需要通过其他方式查找
      const userMessages = this.extractUserMessages();
      const targetMessage = userMessages.find(msg => msg.id === messageId);
      if (targetMessage) {
        messageElement = targetMessage.element;
      }
    } else {
      // 尝试通过data-message-id或id查找
      messageElement = document.querySelector(`[data-message-id="${messageId}"]`) || 
                      document.getElementById(messageId);
    }
    
    if (messageElement) {
      // 滚动到元素位置
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // 添加高亮效果
      messageElement.classList.add('message-highlight');
      
      // 3秒后移除高亮
      setTimeout(() => {
        messageElement.classList.remove('message-highlight');
      }, 1500);
      
      return true;
    }
    
    return false;
  }
}

// Kimi平台适配器
class KimiAdapter extends PlatformAdapter {
  // 提取用户消息元素
  extractUserMessages(clearCache = true) {
    const userMessages = [];
    
    // 查找所有用户消息容器
    const messageContainers = document.querySelectorAll('.chat-content-item-user');
    
    messageContainers.forEach((container, index) => {
      // 查找消息内容元素
      const contentElement = container.querySelector('.user-content');
      if (contentElement) {
        const id = this.getMessageId(contentElement);
        const content = this.getMessageContent(contentElement);
        const preview = this.generatePreview(content);
        
        if (content && content !== '[消息]' && content.trim().length > 1) {
          userMessages.push({
            id,
            content,
            preview,
            index,
            element: container // 存储整个消息容器，而不是内容元素
          });
        }
      }
    });
    
    return userMessages;
  }
  
  // 检查是否包含文件附件
  hasFileAttachment(messageElement) {
    // 查找常见的文件附件特征
    const fileSelectors = [
      '[data-testid*="file"]',
      '[data-testid*="attachment"]',
      '[role*="file"]',
      'input[type="file"]',
      'img[src*="file"]', 
      'img[alt*="文件"]',
      '.file', 
      '.attachment', 
      '.upload',
      '[aria-label*="文件"]',
      '[aria-label*="附件"]'
    ];
    
    for (const selector of fileSelectors) {
      try {
        if (messageElement.querySelector(selector)) {
          return true;
        }
      } catch (e) {
        // 忽略无效选择器
      }
    }
    
    // 检查是否有包含文件的文本特征
    const text = messageElement.textContent;
    if (text.includes('上传') || text.includes('文件') || 
        text.includes('.pdf') || text.includes('.docx') || 
        text.includes('.xlsx') || text.includes('.txt') ||
        text.includes('.jpg') || text.includes('.png') ||
        text.includes('.md') || text.includes('.csv')) {
      return true;
    }
    
    return false;
  }
  
  // 获取消息内容
  getMessageContent(messageElement) {
    let content = '';
    let hasFile = this.hasFileAttachment(messageElement);
    let fileName = this.extractFileName(messageElement);
    
    // 直接使用元素的文本内容
    content = messageElement.textContent.trim();
    
    // 清理文本，移除重复和多余的空格
    content = content.replace(/\s+/g, ' ').trim();
    
    // 构建最终的内容
    let finalContent = '';
    
    if (hasFile) {
      if (fileName) {
        finalContent = `[文件] ${fileName}`;
        if (content && content !== fileName) {
          finalContent += ` ${content}`;
        }
      } else if (content) {
        finalContent = `[文件] ${content}`;
      } else {
        finalContent = '[文件]';
      }
    } else if (content) {
      finalContent = content;
    } else {
      finalContent = '[消息]';
    }
    
    return finalContent;
  }
  
  // 提取文件名（如果可能）
  extractFileName(messageElement) {
    // 尝试从各种属性中提取文件名
    const selectors = [
      '[title]',
      '[aria-label]',
      '[alt]',
      '[data-file-name]',
      '[data-name]'
    ];
    
    for (const selector of selectors) {
      const elements = messageElement.querySelectorAll(selector);
      for (const el of elements) {
        let fileName = '';
        if (el.title && el.title.length > 0 && el.title.length < 100) {
          fileName = el.title;
        } else if (el.getAttribute('aria-label') && 
                   el.getAttribute('aria-label').length > 0 && 
                   el.getAttribute('aria-label').length < 100) {
          fileName = el.getAttribute('aria-label');
        } else if (el.alt && el.alt.length > 0 && el.alt.length < 100) {
          fileName = el.alt;
        } else if (el.dataset.fileName) {
          fileName = el.dataset.fileName;
        } else if (el.dataset.name) {
          fileName = el.dataset.name;
        }
        
        if (fileName && !fileName.includes(' ')) { // 简单的文件名检查
          return fileName;
        }
      }
    }
    
    return null;
  }
  
  // 获取消息ID
  getMessageId(messageElement) {
    // 尝试从元素获取ID
    if (messageElement.dataset.messageId) {
      return messageElement.dataset.messageId;
    } else if (messageElement.dataset.id) {
      return messageElement.dataset.id;
    } else if (messageElement.id) {
      return messageElement.id;
    } else {
      // 基于消息内容生成稳定的ID
      const content = messageElement.textContent.trim();
      if (content) {
        // 使用内容的哈希值作为ID，确保相同内容的消息ID一致
        const hash = content.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        return `msg-${Math.abs(hash)}`;
      } else {
        // 作为最后的后备方案，使用随机ID
        return `msg-${Math.random().toString(36).substr(2, 9)}`;
      }
    }
  }
  
  // 生成预览文本
  generatePreview(content) {
    // 限制预览长度为100个字符
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }
  
// 跳转到消息位置
  scrollToMessage(messageId) {
    // 查找对应的消息元素
    let messageElement;
    
    // 首先尝试通过ID查找
    if (messageId.startsWith('msg-')) {
      // 这是我们生成的ID，需要通过其他方式查找
      const userMessages = this.extractUserMessages();
      const targetMessage = userMessages.find(msg => msg.id === messageId);
      if (targetMessage) {
        messageElement = targetMessage.element;
      }
    } else {
      // 尝试通过data-message-id或id查找
      messageElement = document.querySelector(`[data-message-id="${messageId}"]`) || 
                      document.querySelector(`[data-id="${messageId}"]`) || 
                      document.getElementById(messageId);
    }
    
    if (messageElement) {
      // 对于Kimi平台，尝试查找最外层的用户消息容器作为滚动目标
      let scrollElement = messageElement;
      
      // 优先查找最外层的用户消息容器
      const outerContainer = scrollElement.closest('.chat-content-item-user');
      if (outerContainer) {
        scrollElement = outerContainer;
      }
      
      // 确保元素在可视区域内
      try {
        // 先使用即时滚动，确保元素可见
        scrollElement.scrollIntoView({ behavior: 'instant', block: 'center' });
        
        // 然后使用平滑滚动，提供更好的用户体验
        setTimeout(() => {
          scrollElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        
        // 添加高亮效果
        scrollElement.classList.add('message-highlight');
        
        // 3秒后移除高亮
        setTimeout(() => {
          scrollElement.classList.remove('message-highlight');
        }, 1500);
        
        return true;
      } catch (error) {
        console.error('滚动操作失败:', error);
        return false;
      }
    }
    
    return false;
  }
}

// 插件主类
class ChatHistoryPlugin {
  constructor() {
    // 初始化适配器
    this.adapter = this.getPlatformAdapter();
    this.messages = [];
    this.filteredMessages = [];
    this.searchQuery = '';
    this.container = null;
    this.isEnabled = true;
    
    // 初始化插件
    this.init();
  }
  
  // 根据当前URL获取合适的平台适配器
  getPlatformAdapter() {
    try {
      const currentUrl = window.location.href;
      console.log('当前URL:', currentUrl);
      
      // 检查是否为豆包平台
      if (currentUrl.includes('doubao.com')) {
        console.log('使用DoubaoAdapter');
        return new DoubaoAdapter();
      }
      // 检查是否为Kimi平台
      else if (currentUrl.includes('kimi.com')) {
        console.log('使用KimiAdapter');
        return new KimiAdapter();
      }
      // 检查是否为ChatGPT平台
      else if (currentUrl.includes('chatgpt.com')) {
        console.log('使用ChatGPTAdapter');
        return new ChatGPTAdapter();
      }
      // 默认为ChatGPT适配器
      else {
        console.log('使用默认ChatGPTAdapter');
        return new ChatGPTAdapter();
      }
    } catch (error) {
      console.error('获取平台适配器失败:', error);
      return new ChatGPTAdapter();
    }
  }
  
  // 初始化插件
  init() {
    try {
      console.log('开始初始化ChatLog插件');
      
      // 检查插件状态
      this.checkPluginState();
      
      // 监听来自后台的消息
      this.setupMessageListener();
      
      // 创建历史对话容器
      this.createContainer();
      
      // 初始加载消息
      this.loadMessages();
      
      // 设置事件监听
      this.setupEventListeners();
      
      // 监听页面变化，实时更新消息列表
      this.observePageChanges();
      
      console.log('ChatLog插件初始化完成');
    } catch (error) {
      console.error('初始化插件失败:', error);
    }
  }
  
  // 检查插件状态
  checkPluginState() {
    // 从存储中获取状态
    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
        if (response) {
          this.isEnabled = response.isEnabled !== false;
          this.updateContainerVisibility();
        }
      });
    }
  }
  
  // 设置消息监听器
  setupMessageListener() {
    try {
      if (chrome && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((message) => {
          try {
            console.log('接收到消息:', message);
            if (message.action === 'toggle') {
              this.isEnabled = message.isEnabled;
              console.log('切换插件状态:', this.isEnabled);
              this.updateContainerVisibility();
            }
          } catch (error) {
            console.error('处理消息失败:', error);
          }
        });
      }
    } catch (error) {
      console.error('设置消息监听器失败:', error);
    }
  }
  
  // 更新容器可见性
  updateContainerVisibility() {
    if (this.container) {
      if (this.isEnabled) {
        this.container.style.display = 'block';
      } else {
        this.container.style.display = 'none';
      }
    }
  }
  
  // 创建历史对话容器
  createContainer() {
    // 检查容器是否已存在
    if (document.getElementById('chat-history-container')) {
      this.container = document.getElementById('chat-history-container');
      this.updateContainerVisibility();
      return;
    }
    
    // 创建容器
    this.container = document.createElement('div');
    this.container.id = 'chat-history-container';
    this.container.className = 'chat-history-container';
    
    // 容器内容
    this.container.innerHTML = `
      <div class="chat-history-resizer"></div>
      <div class="chat-history-title">ChatLog <span class="chat-log-subtitle">TT&LL</span></div>
      <div class="chat-history-hint">点击任意消息可快速跳转</div>
      <div class="chat-history-search">
        <input type="text" id="chat-history-search-input" placeholder="搜索历史对话...">
      </div>
      <ul class="chat-history-list" id="chat-history-list"></ul>
    `;
    
    // 添加到页面
    document.body.appendChild(this.container);
    
    // 设置初始可见性
    this.updateContainerVisibility();
    
    // 绑定搜索事件
    const searchInput = document.getElementById('chat-history-search-input');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.filterMessages();
    });
    
    // 添加可拖动调整大小功能
    this.addResizerFunctionality();
  }
  
  // 添加可拖动调整大小功能
  addResizerFunctionality() {
    const container = this.container;
    const resizer = container.querySelector('.chat-history-resizer');
    let isResizing = false;
    
    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      resizer.classList.add('active');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      // 记录初始位置
      const startX = e.clientX;
      const startWidth = container.offsetWidth;
      
      // 处理鼠标移动
      const handleMouseMove = (e) => {
        if (!isResizing) return;
        
        // 计算新宽度
        const deltaX = e.clientX - startX;
        const newWidth = startWidth - deltaX;
        
        // 限制最小宽度
        if (newWidth >= 150 && newWidth <= 600) {
          container.style.width = newWidth + 'px';
        }
      };
      
      // 处理鼠标释放
      const handleMouseUp = () => {
        isResizing = false;
        resizer.classList.remove('active');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        // 移除事件监听
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      // 添加事件监听
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
  }
  
  // 加载消息
  loadMessages() {
    // 使用适配器提取消息
    this.messages = this.adapter.extractUserMessages();
    this.filteredMessages = [...this.messages];
    this.renderMessages();
  }
  
  // 过滤消息
  filterMessages() {
    if (!this.searchQuery.trim()) {
      this.filteredMessages = [...this.messages];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredMessages = this.messages.filter(msg => 
        msg.content.toLowerCase().includes(query) ||
        msg.preview.toLowerCase().includes(query)
      );
    }
    this.renderMessages();
  }
  
  // 渲染消息列表
  renderMessages() {
    const listElement = document.getElementById('chat-history-list');
    
    if (this.filteredMessages.length === 0) {
      listElement.innerHTML = '<li class="chat-history-empty">无匹配的历史对话</li>';
      return;
    }
    
    // 渲染消息列表
    listElement.innerHTML = this.filteredMessages.map(msg => `
      <li class="chat-history-item" data-message-id="${msg.id}">
        ${msg.preview}
      </li>
    `).join('');
    
    // 绑定点击事件
    const messageItems = listElement.querySelectorAll('.chat-history-item');
    messageItems.forEach(item => {
      item.addEventListener('click', () => {
        const messageId = item.dataset.messageId;
        this.adapter.scrollToMessage(messageId);
        
        // 更新激活状态
        messageItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
  }
  
  // 设置事件监听
  setupEventListeners() {
    // 可以添加其他事件监听，如键盘快捷键等
  }
  
  // 监听页面变化
  observePageChanges() {
    // 使用MutationObserver监听页面变化
    const observer = new MutationObserver((mutations) => {
      // 检查是否有实际的内容变化
      let hasContentChange = false;
      for (const mutation of mutations) {
        // 只关注添加或删除节点的变化
        if (mutation.type === 'childList') {
          hasContentChange = true;
          break;
        }
      }
      
      if (hasContentChange) {
        // 防抖处理，避免频繁更新
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
          const currentQuery = this.searchQuery;
          this.loadMessages();
          // 重新应用搜索过滤
          if (currentQuery) {
            this.searchQuery = currentQuery;
            this.filterMessages();
          }
        }, 2000); // 增加防抖时间，减少触发频率
      }
    });
    
    // 监听整个文档的变化
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// 当DOM加载完成后初始化插件
document.addEventListener('DOMContentLoaded', () => {
  try {
    new ChatHistoryPlugin();
  } catch (error) {
    console.error('ChatLog插件初始化失败:', error);
  }
});

// 当页面加载完成后也初始化一次（确保在SPA路由变化时也能初始化）
window.addEventListener('load', () => {
  try {
    new ChatHistoryPlugin();
  } catch (error) {
    console.error('ChatLog插件初始化失败:', error);
  }
});