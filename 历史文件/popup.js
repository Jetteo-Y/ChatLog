// 插件弹出页面JavaScript逻辑

// 全局变量
let apiConfig = { ip: '127.0.0.1', port: '8101' };
let userInfo = null;

// DOM元素
const loginContainer = document.getElementById('loginContainer');
const registerContainer = document.getElementById('registerContainer');
const mainContainer = document.getElementById('mainContainer');
const configContainer = document.getElementById('configContainer');

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const configForm = document.getElementById('configForm');

const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');
const configSuccess = document.getElementById('configSuccess');

const loginButton = document.getElementById('loginButton');
const registerButton = document.getElementById('registerButton');
const logoutButton = document.getElementById('logoutButton');
const configButton = document.getElementById('configButton');

const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const showConfig = document.getElementById('showConfig');
const backToLogin = document.getElementById('backToLogin');

const userName = document.getElementById('userName');

// 初始化
async function init() {
    // 加载API配置
    await loadApiConfig();
    
    // 加载用户信息
    await loadUserInfo();
    
    // 显示相应的界面
    if (userInfo) {
        showMainContainer();
    } else {
        showLoginContainer();
    }
    
    // 绑定事件
    bindEvents();
}

// 加载API配置
async function loadApiConfig() {
    try {
        const result = await chrome.storage.local.get('apiConfig');
        if (result.apiConfig) {
            apiConfig = result.apiConfig;
        }
        // 填充配置表单
        document.getElementById('apiIp').value = apiConfig.ip;
        document.getElementById('apiPort').value = apiConfig.port;
    } catch (error) {
        console.error('加载API配置失败:', error);
    }
}

// 保存API配置
async function saveApiConfig(config) {
    try {
        await chrome.storage.local.set({ apiConfig: config });
        apiConfig = config;
    } catch (error) {
        console.error('保存API配置失败:', error);
    }
}

// 加载用户信息
async function loadUserInfo() {
    try {
        const result = await chrome.storage.local.get('user');
        if (result.user) {
            userInfo = result.user;
        }
    } catch (error) {
        console.error('加载用户信息失败:', error);
    }
}

// 保存用户信息
async function saveUserInfo(user) {
    try {
        await chrome.storage.local.set({ user: user });
        userInfo = user;
    } catch (error) {
        console.error('保存用户信息失败:', error);
    }
}

// 清除用户信息
async function clearUserInfo() {
    try {
        await chrome.storage.local.remove('user');
        userInfo = null;
    } catch (error) {
        console.error('清除用户信息失败:', error);
    }
}

// 显示登录界面
function showLoginContainer() {
    loginContainer.style.display = 'flex';
    registerContainer.style.display = 'none';
    mainContainer.style.display = 'none';
    configContainer.style.display = 'none';
}

// 显示注册界面
function showRegisterContainer() {
    loginContainer.style.display = 'none';
    registerContainer.style.display = 'flex';
    mainContainer.style.display = 'none';
    configContainer.style.display = 'none';
}

// 显示主功能界面
function showMainContainer() {
    loginContainer.style.display = 'none';
    registerContainer.style.display = 'none';
    mainContainer.style.display = 'flex';
    configContainer.style.display = 'none';
    
    // 显示用户信息
    if (userInfo && userInfo.userName) {
        userName.textContent = userInfo.userName;
    }
}

// 显示配置界面
function showConfigContainer() {
    loginContainer.style.display = 'none';
    registerContainer.style.display = 'none';
    mainContainer.style.display = 'none';
    configContainer.style.display = 'flex';
    
    // 填充配置表单
    document.getElementById('apiIp').value = apiConfig.ip;
    document.getElementById('apiPort').value = apiConfig.port;
}

// 绑定事件
function bindEvents() {
    // 登录表单提交
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userAccount = document.getElementById('loginAccount').value;
        const userPassword = document.getElementById('loginPassword').value;
        
        // 显示加载状态
        loginButton.disabled = true;
        loginButton.textContent = '登录中...';
        loginError.style.display = 'none';
        
        try {
            // 调用登录接口
            const response = await fetch(`http://${apiConfig.ip}:${apiConfig.port}/api/user/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userAccount: userAccount,
                    userPassword: userPassword
                })
            });
            
            if (!response.ok) {
                throw new Error('登录失败');
            }
            
            const data = await response.json();
            
            if (data.code === 0) {
                // 登录成功
                await saveUserInfo(data.data);
                showMainContainer();
                
                // 通知所有标签页重新初始化插件
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs.length > 0) {
                        chrome.tabs.sendMessage(tabs[0].id, { action: 'loginSuccess' }, (response) => {
                            if (chrome.runtime.lastError) {
                                // 忽略错误，因为可能没有content script在运行
                            }
                        });
                    }
                });
            } else {
                // 登录失败
                loginError.textContent = data.message || '账号或密码错误';
                loginError.style.display = 'block';
            }
        } catch (error) {
            // 网络错误或其他错误
            loginError.textContent = '登录失败，请稍后重试';
            loginError.style.display = 'block';
        } finally {
            // 恢复按钮状态
            loginButton.disabled = false;
            loginButton.textContent = '登录';
        }
    });
    
    // 注册表单提交
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userAccount = document.getElementById('registerAccount').value;
        const userPassword = document.getElementById('registerPassword').value;
        const checkPassword = document.getElementById('registerCheckPassword').value;
        
        // 表单验证
        if (userPassword !== checkPassword) {
            registerError.textContent = '密码和确认密码不一致';
            registerError.style.display = 'block';
            return;
        }
        
        // 显示加载状态
        registerButton.disabled = true;
        registerButton.textContent = '注册中...';
        registerError.style.display = 'none';
        
        try {
            // 调用注册接口
            const response = await fetch(`http://${apiConfig.ip}:${apiConfig.port}/api/user/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userAccount: userAccount,
                    userPassword: userPassword,
                    checkPassword: checkPassword
                })
            });
            
            if (!response.ok) {
                throw new Error('注册失败');
            }
            
            const data = await response.json();
            
            if (data.code === 0) {
                // 注册成功，跳转到登录界面
                showLoginContainer();
            } else {
                // 注册失败
                registerError.textContent = data.message || '注册失败，请稍后重试';
                registerError.style.display = 'block';
            }
        } catch (error) {
            // 网络错误或其他错误
            registerError.textContent = '注册失败，请稍后重试';
            registerError.style.display = 'block';
        } finally {
            // 恢复按钮状态
            registerButton.disabled = false;
            registerButton.textContent = '注册';
        }
    });
    
    // 配置表单提交
    configForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const apiIp = document.getElementById('apiIp').value;
        const apiPort = document.getElementById('apiPort').value;
        
        // 显示加载状态
        configButton.disabled = true;
        configButton.textContent = '保存中...';
        configSuccess.style.display = 'none';
        
        try {
            // 保存配置
            await saveApiConfig({ ip: apiIp, port: apiPort });
            
            // 显示成功提示
            configSuccess.textContent = '配置保存成功';
            configSuccess.style.display = 'block';
            
            // 3秒后返回登录界面
            setTimeout(() => {
                showLoginContainer();
            }, 3000);
        } catch (error) {
            console.error('保存配置失败:', error);
        } finally {
            // 恢复按钮状态
            configButton.disabled = false;
            configButton.textContent = '保存配置';
        }
    });
    
    // 登出按钮点击
    logoutButton.addEventListener('click', async () => {
        try {
            // 调用登出接口
            await fetch(`http://${apiConfig.ip}:${apiConfig.port}/api/user/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('登出失败:', error);
        } finally {
            // 清除用户信息
            await clearUserInfo();
            
            // 通知所有标签页清理插件
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length > 0) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'logoutSuccess' }, (response) => {
                        if (chrome.runtime.lastError) {
                            // 忽略错误，因为可能没有content script在运行
                        }
                    });
                }
            });
            
            // 跳转到登录界面
            showLoginContainer();
        }
    });
    
    // 显示注册界面
    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterContainer();
    });
    
    // 显示登录界面
    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginContainer();
    });
    
    // 显示配置界面
    showConfig.addEventListener('click', (e) => {
        e.preventDefault();
        showConfigContainer();
    });
    
    // 返回登录界面
    backToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginContainer();
    });
}

// 初始化
init();