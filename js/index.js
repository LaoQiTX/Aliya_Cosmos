import * as saveModule from './save.js';
import * as loadModule from './load.js';
// import { Howl } from 'howler';

// 配置参数
const CONFIG = {
	scrollThreshold: 100,
	systemMsgInterval: 5000,
	notificationIcon: './res/img/notify_img.png'
};

let cachedData;

// 初始化
function init() {
	// loadModule.loadDialogueData()
	// 	.then((res) => {
	// 		data = res;  // 将返回的数据存储到全局变量data
	// 		// loadMessages();  // 调用loadMessages()来处理数据
	// 	})
	// 	.catch((error) => {
	// 		console.error('Error loading dialogue data:', error);  // 捕获并处理错误
	// 	});


	// setupEventListeners();
	// setupLayout();
	requestNotificationPermission();
	// loadSampleMessages();
	// startSystemMessages();
	// 定期更新心率
	setHeartBeat(); // 每秒更新一次
	resumeInit();
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

function setHeartBeat() {
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
	if (text.includes("$userName$")) {
		text = text.replace("$userName$", savedUsername)
	}
	const div = document.createElement('div');
	div.className = `message ${isUser ? 'user-message' : ''}`;
	div.textContent = text;
	return div;
}

function addMessage(text, isUser = true, needNotify = true) {
	// 如果options的动画还没结束就再次触发来进行结束
	hideLoadingGif();
	const messageElement = createMessage(text, isUser);
	elements.container.appendChild(messageElement);
	checkAutoScroll();
	if (needNotify) {
		checkNotification(text, isUser);
	}
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
// todo 加变量来区分当前是处于加载状态还是正常状态
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
	switchElement.addEventListener('click', function () {
		this.classList.toggle('active');
		const labels = this.closest('.switch-wrapper').querySelector('.status-labels');
		labels.querySelector('.off').classList.toggle('active');
		labels.querySelector('.on').classList.toggle('active');

	});
});

// console.log(localStorage.getItem("AliyaCalledMe"))
export function closeModal() {
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
document.querySelector('.modal-overlay').addEventListener('click', function (e) {
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
	elements.optionsContainer.style.backgroundImage = "url('../res/animation/wait/donet_waiting.gif')";
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

		options.forEach((option, index) => {
			const optionElement = document.createElement('button');
			optionElement.className = 'player-option';
			optionElement.textContent = option;

			optionElement.addEventListener('click', () => {
				addMessage(option, true);
				optionsContainer.innerHTML = ''; // 选择后立即清除选项
				console.log("玩家选择了btn->" + index);
				resolve(index);
			});

			optionsContainer.appendChild(optionElement);
		});
	});
}

// 在 wait 之前显示 GIF 并隐藏选项
async function pointAnimation() {
	showPointLoadingGif();
	await wait(2000);
	hideLoadingGif();
	await wait(100);
}

/*** todo: 逻辑重构优化*/

// async function loadMessages(timeStage = 0, currentMessageIndex = 0) {
// 	try {
// 		while (timeStage < data.dialogue.length) {
// 			const dialogue = data.dialogue[timeStage];

// 			while (currentMessageIndex < dialogue.messages.length) {
// 				const message = dialogue.messages[currentMessageIndex];

// 				if (message.type === 'player_options') {
// 					isWaitingForChoice = true;
// 					await showOptions(message.content);
// 					isWaitingForChoice = false;
// 					currentMessageIndex++;
// 					await pointAnimation();
// 					continue;
// 				} else if (message.type === 'player_input') {
// 					isWaitingForChoice = true;
// await showInputDialog();
// 					isWaitingForChoice = false;
// 					await closeInputDialog();
// 					currentMessageIndex++;
// 					console.log(currentMessageIndex);
// 					await wait(1000);
// 					continue;
// 				}

// 				if (message.image_url && message.type === 'aliya') {
// 					addImageMessage(message.image_url, false);
// 				} else {
// 					addMessage(message.content, message.type !== 'aliya');
// 				}

// 				currentMessageIndex++;
// 				await pointAnimation();
// 			}

// 			// todo 判断当前时间戳是否到达了下个剧情的时间戳检查点
// 			if (hasReachedNextCheckpoint(Date.now(), dialogue.timestamp)) {
// 				timeStage++;
// 				currentMessageIndex = 0;
// 				continue;
// 			} 
// 			await wait(60000);

// 			// 处理完当前对话，移动到下一个
// 			// currentMessageIndex = 0;
// 			// timeStage++;
// 		}
// 	} catch (error) {
// 		console.error('Error:', error);
// 	}
// }

// function hasReachedNextCheckpoint(currentTime, nextCheckpointTime) {
// 	return (currentTime - lastExitTime) >= nextCheckpointTime;
// }

/**
 * 剧情循环中的DTO类;
 */
class DialogueStateDto {
    constructor() {
        if (!DialogueStateDto.instance) {
			this.#init();
            DialogueStateDto.instance = this; 
        }
        return DialogueStateDto.instance; 
    }

    static getInstance() {
        if (!DialogueStateDto.instance) {
            DialogueStateDto.instance = new DialogueStateDto();
        }
        return DialogueStateDto.instance;
    }

	#init(){
		// 剧情阶段
		this.timeStage = 0;
		// 当前剧情阶段索引
		this.currentMessageIndex = 0;
		this.isLoad = true;
		this.cacheOptionIndex = 0;
		this.isEnd = false;
		this.readyForNextStage = true;
	}
	
	setTimeStage(stage){
		if(typeof stage != 'number'){
			throw new Error("传入的应该是number类型")
		}
		this.timeStage = stage;
	}

	getTimeStage(){
		return this.timeStage;
	}
	
	getIsLoad(){
		return this.isLoad;
	}

	setIsLoad(boolValue){
		if(typeof boolValue != 'boolean'){
			throw new Error("传入的应是bool类型")
		}
		this.isLoad = boolValue;
	}
	
	 // ========== currentMessageIndex ==========
	setCurrentMessageIndex(index) {
		if (typeof index !== 'number') {
			throw new Error("传入的应该是 number 类型");
		}
		this.currentMessageIndex = index;
    }

    getCurrentMessageIndex() {
        return this.currentMessageIndex;
    }


	 // ========== cacheOptionIndex ==========
	 setCacheOptionIndex(index) {
        if (typeof index !== 'number') {
            throw new Error("传入的应该是 number 类型");
        }
        this.cacheOptionIndex = index;
    }

    getCacheOptionIndex() {
        return this.cacheOptionIndex;
    }

    // ========== isEnd ==========
    setIsEnd(boolValue) {
        if (typeof boolValue !== 'boolean') {
            throw new Error("传入的应该是 boolean 类型");
        }
        this.isEnd = boolValue;
    }

    getIsEnd() {
        return this.isEnd;
    }

    // ========== readyForNextStage ==========
    setReadyForNextStage(boolValue) {
        if (typeof boolValue !== 'boolean') {
            throw new Error("传入的应该是 boolean 类型");
        }
        this.readyForNextStage = boolValue;
    }

    getReadyForNextStage() {
        return this.readyForNextStage;
    }
	
	// other methods
	convertIsLoad(){
		this.isLoad = !this.isLoad;
		return this.isLoad;
	}
	
	convertIsEnd(){
		this.isEnd = !this.isEnd;
		return this.isEnd;
	}

    nextStage() {
        this.timeStage++;
    }

    nextMessage() {
        this.currentMessageIndex++;
    }
	nextCacheOptionIndex(){
		this.cacheOptionIndex++;
	}
}

const replySound = new Howl({
	src: ['./res/music/reply_test_sound.mp3'], // 替换为你的背景音乐路径
    loop: false, // 让背景音乐循环
    volume: 1 // 调整音量
})


// todo 抽离方法进行简化
/**
 * 加载信息;
 * @param {Integer} timeStage 当前的剧情阶段 
 * @param {Integer} currentMessageIndex 当前剧情中的第几个msg消息
 */
async function loadMessages() {
	const data = await loadModule.loadDialogueData();
	cachedData = loadModule.resume();
	var cacheOptionList = cachedData.optionsChoiceList;
	var sendFromUser = false;
	if(!dialogueDto){
		var dialogueDto = DialogueStateDto.getInstance();
	}
	var isEnd = false;
	var currentMessageIndex = dialogueDto.getCurrentMessageIndex();
	var timeStage = dialogueDto.getTimeStage();
	// 玩家发送的上一条的信息
	var lastUserMsg = "";
	console.log("开始load中");
	try {
		while (timeStage < data.dialogue.length) {
			const dialogue = data.dialogue[timeStage];
			if(dialogueDto.getReadyForNextStage()){
				while (currentMessageIndex < dialogue.messages.length) {
					const message = dialogue.messages[currentMessageIndex];
					if (dialogueDto.getIsLoad()) {
						currentMessageIndex = loadCacheData(dialogueDto,cacheOptionList,message,currentMessageIndex);
						continue;
					}
					// debugger; 当前应是具体流程
					if (message.type === 'player_options') {
						const choiceIndex = await showOptions(message.content);
						lastUserMsg = message.content[choiceIndex];
						cacheOptionList.push(choiceIndex);
						cachedData.optionsChoiceList = cacheOptionList;
						localStorage.setItem("saveData", JSON.stringify(cachedData));
						currentMessageIndex++;
						sendFromUser = true;
						await pointAnimation();
						continue;
					} else if (message.type === 'player_input') {
						await showInputDialog();
						currentMessageIndex++;
						await wait(1000);
						continue;
					}
					// 这一块是不需要区分的 因为只有aliya的msg会在这边发送，而玩家的会在showOption发送;
					// if (message.image_url) {
					// 	addImageMessage(message.image_url, false);
					// } else {
					// 	addMessage(message.content, message.type !== 'aliya');
					// }
					// 如果上一个消息是玩家发送的,那么需要让aliya进行判断等待;
					if(sendFromUser){
						aliyaWaitingTime(lastUserMsg,true);
						sendFromUser = false;
					}
					sendMsg(null,message);
					
					currentMessageIndex++;
					await pointAnimation();

					// 此时阶段剧情已经结束 需要进行存档;
					// if (currentMessageIndex >= dialogue.messages.length && !isLoad) {
					// 	isEnd = true;
					// 	console.log("需要进行存档");
					// }
				}
				// debugger;
				if (currentMessageIndex >= dialogue.messages.length && !dialogueDto.getIsLoad()) {
					document.removeEventListener('keydown',handleKeyPress);
					document.addEventListener('keydown',handleKeyPress);
					if(dialogueDto.getIsLoad()){
						isEnd = true;
						console.log("需要进行存档");
					}
				}
				// 此时说明当前阶段剧情已经结束 更新下个剧情的时间戳检查点
				if (isEnd) {
					cachedData.nextStageTime = dialogue.timestamp + Date.now();
					localStorage.setItem("saveData", JSON.stringify(cachedData));
					isEnd = false;
					readyForNextStage = false;
					currentMessageIndex = 0;
					console.log("更新时间戳成功");
					document.addEventListener('keydown', handleKeyPress);
				}
			}
			
			// 判断当前时间戳是否到达了下个剧情的时间戳检查点
			// if (hasReachedNextCheckpoint(Date.now(), cachedData.nextStageTime)) {
			// 	timeStage++;
			// 	readyForNextStage = true;
			// 	currentMessageIndex = 0;
			// 	document.removeEventListener('keydown', handleKeyPress);
			// 	continue;
			// }

			// 如果已经准备好进入下个阶段时 则直接进入循环;
			if(checkForNextStage(dialogueDto)){
				currentMessageIndex = 0;
				timeStage = dialogueDto.getTimeStage();
				continue;
			}
            await new Promise(resolve => {
				let timeOutId;
                const wakeUpListener = () => {
					// if (hasReachedNextCheckpoint(Date.now(), cachedData.nextStageTime)) {
					// 	timeStage++;
					// 	readyForNextStage = true;
					// 	currentMessageIndex = 0;
					// }
					if(checkForNextStage(dialogueDto)){
						currentMessageIndex = 0;
						console.log("listner 里的currentMessageIndex被初始化");
					}
                    document.removeEventListener('wakeUp', wakeUpListener);
					if(timeOutId){
						clearTimeout(timeOutId);
						timeOutId = null;
					}
                    resolve();
                };
                document.addEventListener('wakeUp', wakeUpListener);
				timeOutId = setTimeout(() => {
					document.removeEventListener('wakeUp', wakeUpListener); // 确保超时后移除
					if(checkForNextStage(dialogueDto)){
						debugger
						currentMessageIndex = 0;
					}
					resolve();
				}, 60000);
            });
			timeStage = dialogueDto.getTimeStage();
		}
	} catch (error) {
		console.error('Error:', error);
	} 
}

/**
 * @param {boolean} [isTargetConvert=false] 是否进行了对话方的转换 
 * @param {String} userMsg 用户消息 
 */
function aliyaWaitingTime(userMsg,isTargetConvert = false){
	const msgLength = userMsg.length;
	showPointLoadingGif();
	// 如果是对话方互相转换时 额外增加1.2s
	if(isTargetConvert){
		wait(1200);
	}
	if(msgLength <= 6){
		wait(1200);
	}else if(msgLength<= 12){
		wait(2400);
	}else if(msgLength <= 18){
		wait(3600);
	}else{
		wait(4500);
	}
	// hideLoadingGif();
}

/**
 * 判断当前是否超过了检查点的时间
 * @param {Date} currentTime 
 * @param {Date} nextCheckpointTime 
 * @returns {Boolean} true:超过了检查点时间;false:未超过检查点时间;
 */
function hasReachedNextCheckpoint(currentTime, nextCheckpointTime) {
	return currentTime >= nextCheckpointTime;
}

/**
 * 查询当前是否已经准备好进入下一个剧情阶段
 * @param {DialogueStateDto} dialogueDto 
 * @returns {Boolean} true:已经准备好进入下一个剧情阶段;
 */
function checkForNextStage(dialogueDto){
	// debugger;
	if (hasReachedNextCheckpoint(Date.now(), cachedData.nextStageTime)) {
		dialogueDto.setTimeStage(dialogueDto.getTimeStage()+1)
		dialogueDto.setReadyForNextStage(true);
		console.log("已经准备好进入下一阶段");
		return true;
	}
	return false;
}

/**
 * 加载存档的数据
 * @param {DialogueStateDto} dialogueDto 
 * @param {List<Integer>} cacheOptionList 缓存中的option数组
 * @param {JSON} message 剧情文本信息
 * @returns 
 */
function loadCacheData(dialogueDto,cacheOptionList,message,currentMessageIndex){
	// debugger;
	var index = dialogueDto.getCacheOptionIndex();
	// 只有当cache里面的数组遍历完的时候才算load完成;
	if (index > cacheOptionList.length - 1) {
		dialogueDto.setIsLoad(false);
		console.log("load完成");
		return currentMessageIndex;
	}
	var option = "";
	if (message.type === 'player_options') {
		option = message.content[cacheOptionList[index]];
		dialogueDto.setCacheOptionIndex(index+=1);
	} else if (message.type === 'aliya') {
		option = message.content;
	}
	// todo 暂时修复，后续应该更新data.json 应新增data类型,使其能适配aliya_img类型;及应将[aliya]类型下的Content统一改成数组
	// if(message.image_url){
	// 	addImageMessage(message.image_url, false,false);
	// }else{
	// 	addMessage(option, message.type !== 'aliya', false);
	// }
	sendMsg(option,message)
	return currentMessageIndex+=1;
	// cacheOptionIndex++;
	// currentMessageIndex++;
}

/**
 * 
 * @param {String} content 玩家的option选项;根据其是否是null来判断当前处于是load状态还是play状态 
 * @param {JSON} message 剧情文本
 */
function sendMsg(content,message){
	var isLoad = content == null?false:true;
	if(message.image_url){
		addImageMessage(message.image_url, false,isLoad);
	}else{
		// 如果aliya发送的消息不是img的时候 则需要把他的content更新到content进行输出
		if(message.type == 'aliya'){
			content = message.content
		}
		addMessage(content, message.type !== 'aliya', isLoad);
	}
	if(isLoad == false){
		replySound.play();
	}
}

/**
 * 创建图文信息
 * @param {String} imageUrl 
 * @param {Boolean} isUser 
 * @returns 
 */
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

// function addImageMessage(imageUrl, isUser = true, needNotify = true) {
// 	hideLoadingGif();
// 	const messageElement = createImageMessage(imageUrl, isUser);
// 	elements.container.appendChild(messageElement);
// 	checkAutoScroll();
// 	if (needNotify) {
// 		checkNotification("[图片消息]", isUser);
// 	}
// }

function addImageMessage(imageUrl, isUser = true, needNotify = true) {
    hideLoadingGif();
    const messageElement = createImageMessage(imageUrl, isUser);
    elements.container.appendChild(messageElement);
    checkAutoScroll();

    // 添加点击事件监听器
    messageElement.addEventListener('click', () => {
        showImagePopup(imageUrl);
    });

    if (needNotify) {
        checkNotification("[图片消息]", isUser);
    }
}

function showImagePopup(imageUrl) {
    const popup = document.getElementById('image-popup');
    const popupImage = document.getElementById('popup-image');

    popupImage.src = imageUrl;
    popup.style.display = 'block';
}

// 关闭弹出框
document.getElementById('close-popup').addEventListener('click', () => {
    document.getElementById('image-popup').style.display = 'none';
});

// 键盘事件监听器
function handleKeyPress(event) {
	console.log("按键事件触发"+event.key);
	if (event.key === 'Shift') {
		cachedData.nextStageTime = Date.now();
		// debugger;
		localStorage.setItem("saveData", JSON.stringify(cachedData));
		console.log(cachedData);
		console.log("nextStageTime 已更新为当前时间");
		// 触发自定义事件以唤醒 wait
		document.dispatchEvent(new Event('wakeUp'));
	}
}

function playMusic() {
	document.addEventListener("click", function () {
		const musicPlayer = document.getElementById("bg-music");
		if (musicPlayer.paused) {
			musicPlayer.play().catch(error => console.error("播放失败:", error));
		} else {
			console.log("播放音乐成功");
		}

	}, { once: true }); // 确保只触发一次

}

function saveInit() {

}

function resumeInit() {
	loadMessages();
}

// 启动应用
init();
// loadMessages();
playMusic(); // 在页面加载时播放音乐
