// 配置参数
const CONFIG = {
	scrollThreshold: 100,
	systemMsgInterval: 5000,
	// notificationIcon: '浏览器logo链接'
};

// 初始化
function init() {
	// setupEventListeners();
	// setupLayout();
	requestNotificationPermission();
	// loadSampleMessages();
	// startSystemMessages();
	initBackgroundOverlays();
}

// DOM元素引用
const elements = {
	container: document.getElementById('messages-container'),
	input: document.getElementById('message-input'),
	// sendBtn: document.getElementById('send-button'),
	inputContainer: document.querySelector('.input-container')
};

const optionbg = [
	'./img/测试图片.jpg'
]

function initBackgroundOverlays() {
	const container = document.getElementById('bg-overlay-container');
	
	backgroundImages.forEach((imgSrc, index) => {
	  // 预加载图片
	  const img = new Image();
	  img.src = imgSrc;
	  
	  // 创建叠加层
	  const overlay = document.createElement('div');
	  overlay.className = 'bg-overlay';
	  overlay.style.backgroundImage = `url(${imgSrc})`;
	  overlay.dataset.index = index;
	  
	  container.appendChild(overlay);
	});
  }

// 事件监听
// function setupEventListeners() {
// 	elements.sendBtn.addEventListener('click', function() {
// 		sendUserMessage();
// 	});
// 	// elements.input.addEventListener('keypress', e => e.key === 'Enter' && sendUserMessage());
// 	window.addEventListener('resize', updateMessagesPadding);
// 	new ResizeObserver(updateMessagesPadding).observe(elements.inputContainer);
// }

// 布局相关
function setupLayout() {
	updateMessagesPadding();
}

function updateMessagesPadding() {
	const height = elements.inputContainer.offsetHeight;
	document.documentElement.style.setProperty('--input-height', `${height}px`);
}

// 消息处理
function createMessage(text, isUser = true) {
	if(text.includes("$userName$")){
		text = text.replace("$userName$", savedUsername)
	}
	const div = document.createElement('div');
	div.className = `message ${isUser ? 'user-message' : ''}`;
	div.textContent = text;
	return div;
}

function addMessage(text, isUser = true) {
	elements.container.appendChild(createMessage(text, isUser));
	checkAutoScroll();
	checkNotification(text, isUser);
}

// 滚动控制
function checkAutoScroll() {
	const {
		scrollTop,
		scrollHeight,
		clientHeight
	} = elements.container;
	const isNearBottom = scrollHeight - scrollTop <= clientHeight + CONFIG.scrollThreshold;

	if (isNearBottom) {
		setTimeout(() => {
			elements.container.scrollTo({
				top: scrollHeight,
				behavior: 'smooth'
			});
		}, 10);
	}
}

// 通知系统
function requestNotificationPermission() {
	if (Notification.permission === 'granted') return;
	Notification.requestPermission();
}

function checkNotification(text, isUser) {
	if (!isUser && !document.hasFocus() && Notification.permission === 'granted') {
		showNotification('新消息', text);
	}
}

function showNotification(title, message) {
	new Notification(title, {
		body: message,
		icon: CONFIG.notificationIcon
	});
}

// 用户交互
function sendUserMessage() {
	const text = elements.input.value.trim();
	if (!text) {
		return;
	}
	addMessage(text);
	sendPost(text)
	elements.input.value = '';
}

// 系统功能
function loadSampleMessages() {
	['Hi！你在吗？', '我是Aliya！'].forEach(msg =>
		addMessage(msg, false)
	);
}

function startSystemMessages() {
	setInterval(() => {
		addMessage(`系统时间：${new Date().toLocaleTimeString()}`, false);
	}, CONFIG.systemMsgInterval);
}
// On/Off切换
document.querySelectorAll('.switch').forEach(switchElement => {
	switchElement.addEventListener('click', function() {
		this.classList.toggle('active');
		const labels = this.closest('.switch-wrapper').querySelector('.status-labels');
		labels.querySelector('.off').classList.toggle('active');
		labels.querySelector('.on').classList.toggle('active');

	});
});

// console.log(localStorage.getItem("AliyaCalledMe"))
function closeModal() {
	document.querySelector('.modal-overlay').style.display = 'none';
	$('#operationModal').css("display", "none")
}

if (localStorage.getItem("AliyaCalledMe") == null) {
	$("#settingspop").css('display', 'flex')
	localStorage.setItem('AliyaCalledMe', 'cosmos');
	// $(".messages").html(`<div class="message user-message">
	// 					--建议到setting中设置aliya对你的称呼哦--
	// 				</div>`)

} else {
	closeModal()
}

// 可选：添加关闭模态框的点击外部区域功能
document.querySelector('.modal-overlay').addEventListener('click', function(e) {
	if (e.target === this) {
		closeModal();
	}
});

// 获取聊天区域背景颜色
function getChatBackgroundColor() {
	const chatElement = document.querySelector('.cosmos-chat');
	if (chatElement) {
		return window.getComputedStyle(chatElement).backgroundColor;
	}
	return '#4f4f4f'; // 默认值
}
// wait 
function wait(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}


let currentDialogueIndex = 0;
let currentMessageIndex = 0;
let isWaitingForChoice = false;

async function loadMessages() {
  try {
    const response = await fetch('./res/data.json');
    const data = await response.json();

    // data.dialogue.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // 递归处理对话
    async function processDialogue() {
      if (currentDialogueIndex >= data.dialogue.length) return;

      const dialogue = data.dialogue[currentDialogueIndex];
      const messagesContainer = document.getElementById('messages-container');
      
      // 处理当前时间段内的消息
      while (currentMessageIndex < dialogue.messages.length) {
        const message = dialogue.messages[currentMessageIndex];
        
        if (message.type === 'player_options') {
          // 暂停处理，等待玩家选择
          isWaitingForChoice = true;
          await showOptions(message.content);
          isWaitingForChoice = false;
          currentMessageIndex++;
		  await wait(1000);
          continue;
        }else if(message.type === 'player_input'){
			isWaitingForChoice = true
			await showInputDialog();
			isWaitingForChoice = false
			await closeInputDialog();
			currentMessageIndex++;
			console.log(currentMessageIndex);
			await wait(1000);
			continue;
		}

        addMessage(message.content, message.type !== 'aliya');
        currentMessageIndex++;
		await wait(1000);
      }

      // 重置索引并处理下一个时间段
      currentMessageIndex = 0;
      currentDialogueIndex++;
      await processDialogue();
    }

    // 显示选项的Promise封装
    function showOptions(options) {
      return new Promise((resolve) => {
        const optionsContainer = document.getElementById('player-options-container');
        optionsContainer.innerHTML = ''; // 清空旧选项
        
        options.forEach(option => {
          const optionElement = document.createElement('button');
          optionElement.className = 'player-option';
          optionElement.textContent = option;
          
          optionElement.addEventListener('click', () => {
            addMessage(option, true);
            optionsContainer.innerHTML = ''; // 选择后立即清除选项
            resolve();
          });
          
          optionsContainer.appendChild(optionElement);
        });
      });
    }

    await processDialogue();
  } catch (error) {
    console.error('Error:', error);
  }
}


// 启动应用
init();
loadMessages();
