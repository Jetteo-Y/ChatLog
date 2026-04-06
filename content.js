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

// 豆包平台适配器
class DoubaoAdapter extends PlatformAdapter {
  // 提取用户消息元素
  extractUserMessages() {
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
  constructor() {
    super();
    // 缓存已处理的元素，避免重复处理
    this.processedElements = new Set();
    // 缓存消息文本，避免重复计算
    this.messageCache = new Map();
  }
  
  // 提取用户消息元素
  extractUserMessages() {
    // 清空缓存
    this.processedElements.clear();
    this.messageCache.clear();
    
    const userMessages = [];
    
    try {
      // 1. 首先尝试使用user-content类名查找用户消息（优先级最高）
      const userContentMessages = this.extractMessagesByUserContent();
      if (userContentMessages.length > 0) {
        userMessages.push(...userContentMessages);
      } else {
        // 2. 如果没有找到，尝试基于选择器的方法
        const selectorMessages = this.extractMessagesBySelector();
        userMessages.push(...selectorMessages);
        
        // 3. 如果仍然没有找到消息，尝试基于文本内容的方法
        if (userMessages.length === 0) {
          const textMessages = this.extractMessagesByText();
          userMessages.push(...textMessages);
        }
      }
      
      // 4. 确保消息按顺序排列
      userMessages.sort((a, b) => a.index - b.index);
    } catch (error) {
      console.error('Kimi adapter error:', error);
    }
    
    return userMessages;
  }
  
  // 基于user-content类名提取消息（优先级最高）
  extractMessagesByUserContent() {
    const userMessages = [];
    
    try {
      // 查找所有带有user-content类名的元素
      const userContentElements = document.querySelectorAll('.user-content');
      
      if (userContentElements.length > 0) {
        userContentElements.forEach((element, index) => {
          try {
            const id = this.getMessageId(element);
            const content = this.getMessageContent(element);
            const preview = this.generatePreview(content);
            
            // 只有有内容的消息才添加
            if (content && content !== '[消息]' && content.trim().length > 1) {
              userMessages.push({
                id,
                content,
                preview,
                index,
                element
              });
            }
          } catch (e) {
            // 忽略单个元素处理错误
          }
        });
      }
    } catch (error) {
      console.error('Error in extractMessagesByUserContent:', error);
    }
    
    return userMessages;
  }
  
  // 基于选择器提取消息
  extractMessagesBySelector() {
    const userMessages = [];
    
    // Kimi可能使用的选择器（按优先级排序）
    const selectors = [
      // 最常见的用户消息选择器
      '.user-content', // 重点使用user-content类名
      '.user-message',
      '.message.user',
      '.chat-message.user',
      '[data-role="user"]',
      '[data-testid="user-message"]',
      '[data-user="true"]',
      '[role="user"]',
      
      // 次常见的选择器
      '[class*="user"] [class*="message"]',
      '.user',
      '.chat-item',
      
      // 通用消息容器
      '.message-container',
      '.chat-container',
      '.chat-message',
      '.message-bubble',
      '.message-content'
    ];
    
    let messageElements = [];
    
    // 限制选择器查询次数，避免性能问题
    const maxSelectors = 10;
    const limitedSelectors = selectors.slice(0, maxSelectors);
    
    limitedSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          messageElements = [...messageElements, ...elements];
          // 如果找到足够的元素，提前停止
          if (messageElements.length > 50) {
            return;
          }
        }
      } catch (e) {
        // 忽略无效选择器
      }
    });
    
    // 去重
    messageElements = [...new Set(messageElements)];
    
    // 过滤可能的用户消息元素
    const filteredElements = messageElements.filter(element => {
      // 检查是否已处理
      if (this.processedElements.has(element)) {
        return false;
      }
      // 标记为已处理
      this.processedElements.add(element);
      // 检查是否为用户消息
      return this.isUserMessage(element);
    });
    
    filteredElements.forEach((element, index) => {
      try {
        const id = this.getMessageId(element);
        const content = this.getMessageContent(element);
        const preview = this.generatePreview(content);
        
        // 只有有内容的消息才添加
        if (content && content !== '[消息]' && content.trim().length > 1) {
          userMessages.push({
            id,
            content,
            preview,
            index,
            element
          });
        }
      } catch (e) {
        // 忽略单个元素处理错误
      }
    });
    
    return userMessages;
  }
  
  // 基于文本内容提取消息（针对纯HTML结构）
  extractMessagesByText() {
    const userMessages = [];
    
    try {
      // 查找所有可能包含文本的元素
      const textElements = document.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6, section');
      
      // 限制处理的元素数量，避免性能问题
      const maxElements = 200;
      const limitedElements = Array.from(textElements).slice(0, maxElements);
      
      // 过滤并处理元素
      const filteredElements = limitedElements.filter(element => {
        // 检查是否已处理
        if (this.processedElements.has(element)) {
          return false;
        }
        
        try {
          const text = element.textContent || '';
          const trimmedText = text.trim();
          
          // 排除空文本和过短的文本
          if (trimmedText.length < 5) {
            return false;
          }
          
          // 检查是否为用户消息
          return this.isUserMessageByText(trimmedText);
        } catch (e) {
          return false;
        }
      });
      
      // 去重，避免重复消息
      const uniqueElements = [];
      const seenTexts = new Set();
      
      filteredElements.forEach(element => {
        try {
          const text = element.textContent.trim();
          if (!seenTexts.has(text)) {
            seenTexts.add(text);
            uniqueElements.push(element);
          }
        } catch (e) {
          // 忽略单个元素处理错误
        }
      });
      
      // 处理过滤后的元素
      uniqueElements.forEach((element, index) => {
        try {
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
        } catch (e) {
          // 忽略单个元素处理错误
        }
      });
    } catch (error) {
      console.error('Error in extractMessagesByText:', error);
    }
    
    return userMessages;
  }
  
  // 检查是否为用户消息（基于类名和属性）
  isUserMessage(element) {
    // 检查元素的类名和属性
    const className = element.className || '';
    const dataset = element.dataset || {};
    const attributes = element.attributes || [];
    
    // 检查类名
    if (className.includes('user-content') || // 重点检查user-content类名
        className.includes('user') || 
        className.includes('User') ||
        className.includes('USER') ||
        className.includes('client') ||
        className.includes('Client') ||
        className.includes('CLIENT') ||
        className.includes('sender') ||
        className.includes('Sender')) {
      return true;
    }
    
    // 检查data属性
    for (const key in dataset) {
      const value = dataset[key];
      if (value === 'user' || value.includes('user') ||
          value === 'client' || value.includes('client') ||
          value === 'sender' || value.includes('sender')) {
        return true;
      }
    }
    
    // 检查其他属性
    for (let i = 0; i < attributes.length; i++) {
      const attr = attributes[i];
      if (attr.name.includes('user') || attr.name.includes('client') ||
          attr.value.includes('user') || attr.value.includes('client') ||
          attr.name.includes('sender') || attr.value.includes('sender')) {
        return true;
      }
    }
    
    // 检查元素的文本内容
    const text = element.textContent || '';
    return this.isUserMessageByText(text);
  }
  
  // 检查是否为用户消息（基于文本内容，针对Kimi）
  isUserMessageByText(text) {
    const trimmedText = text.trim();
    
    // 排除空文本和过短的文本
    if (trimmedText.length < 1) {
      return false;
    }
    
    // 排除一些常见的AI回复特征
    const aiKeywords = [
      'AI', '助手', 'bot', '机器人', 'Kimi',
      '月之暗面', 'Moonshot', '根据你的问题',
      '我来帮你', '让我', '我会', '我可以',
      '建议', '推荐', '认为', '觉得', '分析',
      '总结', '解答', '回答', '回复', '回应',
      '为你', '给你', '帮你', '助你', '协助你',
      '您好', '你好', '欢迎', '很高兴', '服务',
      '理解', '支持', '提供', '帮助', '解决',
      '查询', '检索', '分析', '生成', '创建',
      '我是', '我的', '我将', '我会', '我可以',
      '以下是', '为您', '建议您', '推荐您', '您可以'
    ];
    
    // 检查AI关键词
    const hasAIKeywords = aiKeywords.some(keyword => text.includes(keyword));
    if (hasAIKeywords) {
      // 计算AI关键词数量
      let aiKeywordCount = 0;
      aiKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
          aiKeywordCount++;
        }
      });
      
      // 如果AI关键词多于1个，可能是AI回复
      if (aiKeywordCount > 1) {
        return false;
      }
    }
    
    // 排除常见的页面元素文本
    const commonPageTexts = [
      '登录', '注册', '首页', '关于', '联系',
      '帮助', '设置', '退出', '保存', '取消',
      '发送', '输入', '消息', '对话', '历史',
      'AI', 'Kimi', '月之暗面', 'Moonshot',
      '搜索', '结果', '问题', '解决方案',
      '功能', '特点', '优势', '使用', '方法'
    ];
    
    // 检查是否为常见页面文本
    const isCommonPageText = commonPageTexts.some(keyword => trimmedText.includes(keyword));
    if (isCommonPageText && trimmedText.length < 20) {
      return false;
    }
    
    // 默认为用户消息（更宽松的判断，避免错过用户消息）
    return true;
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
    // 尝试从元素获取ID
    return messageElement.dataset.messageId || 
           messageElement.dataset.id || 
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
    const currentUrl = window.location.href;
    
    // 检查是否为豆包平台
    if (currentUrl.includes('doubao.com')) {
      return new DoubaoAdapter();
    }
    // 检查是否为Kimi平台
    else if (currentUrl.includes('kimi.com')) {
      return new KimiAdapter();
    }
    // 检查是否为ChatGPT平台
    else if (currentUrl.includes('chatgpt.com')) {
      return new ChatGPTAdapter();
    }
    // 默认为ChatGPT适配器
    else {
      return new ChatGPTAdapter();
    }
  }
  
  // 初始化插件
  init() {
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
    if (chrome && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.action === 'toggle') {
          this.isEnabled = message.isEnabled;
          this.updateContainerVisibility();
        }
      });
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
    const observer = new MutationObserver(() => {
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
      }, 1000);
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
  new ChatHistoryPlugin();
});

// 当页面加载完成后也初始化一次（确保在SPA路由变化时也能初始化）
window.addEventListener('load', () => {
  new ChatHistoryPlugin();
});