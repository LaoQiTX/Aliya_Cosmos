// 配置参数
const CONFIG = {
	scrollThreshold: 100,
	systemMsgInterval: 5000,
	// notificationIcon: '浏览器logo链接'
};

// DOM元素引用
const elements = {
	container: document.getElementById('messages-container'),
	input: document.getElementById('message-input'),
	sendBtn: document.getElementById('send-button'),
	inputContainer: document.querySelector('.input-container')
};

// 事件监听
function setupEventListeners() {
	elements.sendBtn.addEventListener('click', function() {
		sendUserMessage();
	});
	// elements.input.addEventListener('keypress', e => e.key === 'Enter' && sendUserMessage());
	window.addEventListener('resize', updateMessagesPadding);
	new ResizeObserver(updateMessagesPadding).observe(elements.inputContainer);
}

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

// 初始化
function init() {
	setupEventListeners();
	setupLayout();
	requestNotificationPermission();
	loadSampleMessages();
	// startSystemMessages();
}

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
	$(".messages").html(`<div class="message user-message">
						--建议到setting中设置aliya对你的称呼哦--
					</div>`)

} else {
	closeModal()
}

// 可选：添加关闭模态框的点击外部区域功能
document.querySelector('.modal-overlay').addEventListener('click', function(e) {
	if (e.target === this) {
		closeModal();
	}
});

// 启动应用
init();