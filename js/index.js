// 配置参数
const CONFIG = {
	scrollThreshold: 100,
	systemMsgInterval: 5000,
	notificationIcon: './img/test.jpg'
};

// 初始化
function init() {
	// setupEventListeners();
	// setupLayout();
	requestNotificationPermission();
	// loadSampleMessages();
	// startSystemMessages();
	// 定期更新心率
	setHeartBeat(); // 每秒更新一次
}

// DOM元素引用
const elements = {
	container: document.getElementById('messages-container'),
	input: document.getElementById('message-input'),
	// sendBtn: document.getElementById('send-button'),
	inputContainer: document.querySelector('.input-container'),
	optionsContainer: document.getElementById('player-options-container')
};

// 随机数生成函数
function getRandomHeartRate(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 更新心率函数
function updateHeartRate() {
  const bpmElement = document.querySelector('.bpm');
  const randomHeartRate = getRandomHeartRate(60, 80); // 设置心率范围
  bpmElement.textContent = randomHeartRate;
}

function setHeartBeat(){
	setInterval(updateHeartRate, 1000); // 每秒更新一次
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
	// 如果options的动画还没结束就再次触发来进行结束
	hideLoadingGif();
	const messageElement = createMessage(text, isUser);
	elements.container.appendChild(messageElement);
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
		showNotification('Aliya发来了一条新消息哦', text);
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

// 显示加载点点点的GIF
function showPointLoadingGif() {
	elements.optionsContainer.style.backgroundImage = "url('../res/animation/heart_beat/heart_beat_0.gif')"; 
	elements.optionsContainer.style.backgroundSize = 'cover';
	elements.optionsContainer.innerHTML = ''; // 隐藏选项
}

// 隐藏加载options选择框内的 GIF
function hideLoadingGif() {
	elements.optionsContainer.style.backgroundImage = '';
	elements.optionsContainer.innerHTML = ''; // 清空内容
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

// 在 wait 之前显示 GIF 并隐藏选项
async function pointAnimation(){
	showPointLoadingGif();
	await wait(1000);
	hideLoadingGif();
	await wait(100);
}


let currentDialogueIndex = 0;
let currentMessageIndex = 0;
let isWaitingForChoice = false;

/*** todo: 逻辑重构优化*/ 

async function loadMessages() {
  try {
    const response = await fetch('./res/data/data.json');
    const data = await response.json();

    // data.dialogue.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // 递归处理对话
    async function processDialogue() {
      if (currentDialogueIndex >= data.dialogue.length) return;

      const dialogue = data.dialogue[currentDialogueIndex];
      
      // 处理当前时间段内的消息
      while (currentMessageIndex < dialogue.messages.length) {
        const message = dialogue.messages[currentMessageIndex];
        
        if (message.type === 'player_options') {
          // 暂停处理，等待玩家选择
          isWaitingForChoice = true;
          await showOptions(message.content);
          isWaitingForChoice = false;
          currentMessageIndex++;
		  await pointAnimation();
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
		
		if(message.image_url && message.type === 'aliya'){
			addImageMessage(message.image_url, false);
		}else{
			addMessage(message.content, message.type !== 'aliya');
		}
        currentMessageIndex++;
		await pointAnimation();
      }

      // 重置索引并处理下一个时间段
      currentMessageIndex = 0;
      currentDialogueIndex++;
      await processDialogue();
    }
    await processDialogue();
  } catch (error) {
    console.error('Error:', error);
  }
}

function createImageMessage(imageUrl, isUser = true) {
    const div = document.createElement('div');
    div.className = `message ${isUser ? 'user-message' : ''}`;

    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = "图片消息";
    img.classList.add("chat-image"); // 添加 CSS 类，方便样式调整

    div.appendChild(img);
    return div;
}

function addImageMessage(imageUrl, isUser = true) {
    hideLoadingGif();
    const messageElement = createImageMessage(imageUrl, isUser);
    elements.container.appendChild(messageElement);
    checkAutoScroll();
    checkNotification("[图片消息]", isUser);
}

  

function playMusic() {
	document.addEventListener("click", function() {
		const musicPlayer = document.getElementById("bg-music");
		if (musicPlayer.paused) {
			musicPlayer.play().catch(error => console.error("播放失败:", error));
		}else{
			console.log("播放音乐成功");
		}
		
	}, { once: true }); // 确保只触发一次
	
}

// 启动应用
init();
loadMessages();
playMusic(); // 在页面加载时播放音乐
