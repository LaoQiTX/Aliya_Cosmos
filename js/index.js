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

function sendPost(question) {
	var tkey = "Bearer 你的aikey";
	var username = localStorage.getItem("AliyaCalledMe");
	if (localStorage.getItem("conversation_id") == null) {
		conversation_id = ""
	} else {
		conversation_id = localStorage.getItem("conversation_id");
	}

	// console.log(username)
	// console.log(question)
	// console.log(conversation_id)
	var settings = {
		"url": "你的apiURL",
		"method": "POST",
		"timeout": 0,
		"headers": {
			"Authorization": tkey,
			"Content-Type": "application/json"
		},
		"data": JSON.stringify({
			// 这里是你的dify提示词变量
			"inputs": {
				"user_name": username
			},
			"query": question,
			"response_mode": "blocking",
			"conversation_id": conversation_id,
			"user": username
		}),
	};

	$.ajax(settings).done(function(response) {
		console.log(response);
		// 服务器返回新的 conversation_id 时才存储
		if (response.conversation_id !== conversation_id) {
			localStorage.setItem("conversation_id", response.conversation_id);
		}
		var answer = response.answer
		// console.log(answer)
		if (answer.search("|") !== -1) {
			var answer_arr = answer.split("|")
			// console.log(answer_arr)

			function task(i) {
				setTimeout(function() {
					addMessage(answer_arr[i], false)
				}, 2000 * i);
			}

			for (var i = 0; i < answer_arr.length; i++) {
				console.log(answer_arr[i])
				// var answer_i = answer_arr[i]
				task(i)
			}
		} else {
			addMessage(response.answer, false);
		}
	});


}

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

if (localStorage.getItem("AliyaCalledMe") == null) {
	$("#settingspop").css('display', 'flex')
	localStorage.setItem('AliyaCalledMe', 'cosmos');
	$(".messages").html(`<div class="message user-message">
						--建议到setting中设置aliya对你的称呼哦--
					</div>`)

} else {
	closeModal()
}

// 点击Settings按钮
$("#settings").on("tap", function() {
	$("#settingspop").css('display', 'flex')
})

// 从本地存储获取已保存的用户名
const savedUsername = localStorage.getItem('AliyaCalledMe');
if (savedUsername) {
	$('#username').val(savedUsername);
}

function saveUsername() {
	var username = document.getElementById('username').value.trim();
	if (username) {
		localStorage.setItem('AliyaCalledMe', username);
		closeModal();
		alert('用户名已保存！');
		location.reload()
	} else {
		alert('请输入有效的用户名');
	}
}

function closeModal() {
	document.querySelector('.modal-overlay').style.display = 'none';
}

// 可选：添加关闭模态框的点击外部区域功能
document.querySelector('.modal-overlay').addEventListener('click', function(e) {
	if (e.target === this) {
		closeModal();
	}
});


if (localStorage.getItem("conversation_id") == null) {
	localStorage.setItem("conversation_id", "")
}
var conversation_id

// Operation
// 显示/隐藏模态框
document.getElementById('Operation').addEventListener('click', function(e) {
	e.stopPropagation();
	document.getElementById('operationModal').style.display = 'flex';
});

// 点击遮罩层关闭
document.querySelector('#operationModal').addEventListener('click', function(e) {
	if (e.target === this) {
		this.style.display = 'none';
	}
});


// 初始化连接功能
function initConnection() {
	localStorage.removeItem("conversation_id");
	localStorage.removeItem("AliyaCalledMe")
	alert("连接已初始化！");
	document.getElementById('operationModal').style.display = 'none';
}

// 关闭窗口功能
function closeWindow() {
	document.getElementById('operationModal').style.display = 'none';
	window.close();
}

// 启动应用
init();