// import * as saveModule from './save.js';
import * as loadModule from './load.js';
import { ActionEnum } from './enums/action_enum.js';

// import { Howl } from 'howler';

// 配置参数
const CONFIG = {
	scrollThreshold: 100,
	systemMsgInterval: 5000,
	notificationIcon: './res/img/notify_img.png'
};

let cachedData;
// 存储定时器实例
let resourceInterval = null;

// 控制是否暂停
let isPaused = false;
let water = 0;
let oxgen = 0;
let eng = 0;
// 按钮
let EOHBtnActive = false;
let EHBtnActive = false;

// 初始化
function init() {
	requestNotificationPermission();
	// 定期更新心率
	resumeInit();
}

// DOM元素引用
const elements = {
	container: document.getElementById('messages-container'),
	input: document.getElementById('message-input'),
	inputContainer: document.querySelector('.input-container'),
	optionsContainer: document.getElementById('player-options-container')
};

// 随机数生成函数
function getRandomHeartRate(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 更新心率函数
function updateHeartRate(min, max) {
	const bpmElement = document.querySelector('.bpm');
	// debugger;
	const randomHeartRate = getRandomHeartRate(min, max); // 设置心率范围
	if (max >= min && min > 0) {
		document.querySelector('.heart-rate').style.backgroundImage = "none";
		// document.querySelector('#ecgCanvas').style.display = "block";
	}
	bpmElement.textContent = randomHeartRate;
}

let heartBeatInterval = null; // 记录当前心率更新的定时器
function setHeartBeat(min, max) {
	if (heartBeatInterval) {
		clearInterval(heartBeatInterval);
	}

	heartBeatInterval = setInterval(() => updateHeartRate(min, max), 1000);
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
	// debugger;
	const div = document.createElement('div');
	div.className = `message ${isUser ? 'user-message' : ''}`;
	div.textContent = text;
	return div;
}

function handleTimeMsg(startTime, isLoad) {
	let timeMsg = startTime != null ? startTime : Date.now();
	timeMsg = new Date(timeMsg);
	// startTime = Date.now();
	// const timeMsg = new Date(Math.min((startTime + timeStamp),Date.now()));
	const timeString = timeMsg.toLocaleString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false // 24小时制
	}).replace(/\//g, '-'); // 处理 `/` 变成 `-`
	createTimeMsg(timeString);
	// 非存档状态下存储数据
	if (!isLoad) {
		cachedData.everyStartTimeList.push(timeMsg);
		localStorage.setItem("saveData", JSON.stringify(cachedData));
	}
}

/**
 * 时间
 * @param {String} text 
 */
function createTimeMsg(text) {
	const div = document.createElement('div');
	div.className = `message time-msg`;
	div.textContent = text;
	elements.container.appendChild(div);
}

function addMessage(text, isUser = true, needNotify = true) {
	// 如果text为null或undefined，跳过处理
	if (typeof text !== 'string') {
		console.warn('⚠️ 试图添加空文本消息，已跳过:', text);
		return;
	}
	// 如果options的动画还没结束就再次触发来进行结束
	hideLoadingGif();
	if (text.includes("$userName$")) {
		text = text.replace("$userName$", savedUsername)
	}
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

	Notification.requestPermission().then(permission => {
		if (permission === 'granted') {
			console.log("用户允许了通知");
			// 可以执行通知相关逻辑
		} else {
			console.warn("用户拒绝了通知");
		}
	});
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

// 定义开关音效对象
const switchSound = new Howl({
	src: ['./res/music/switch.wav'],
	loop: false,
	volume: 1
});

// On/Off切换
document.querySelectorAll('.switch').forEach(switchElement => {
	switchElement.addEventListener('click', function () {
		this.classList.toggle('active');
		const labels = this.closest('.switch-wrapper').querySelector('.status-labels');
		labels.querySelector('.off').classList.toggle('active');
		labels.querySelector('.on').classList.toggle('active');
		// 获取 HRM 开关的按钮
		const hrmSwitch = document.getElementById('hrm-switch-btn');
		const heartRateElement = document.querySelector('.heart-rate');
		const eogSwitch = document.getElementById('eog-switch-btn');
		const ehSwitch = document.getElementById('eh-switch-btn');
		// 检查 HRM 是否为 on 状态
		if (hrmSwitch.classList.contains('active')) {
			heartRateElement.style.opacity = 0.5;
		} else {
			heartRateElement.style.opacity = 0;
		}

		if (eogSwitch.classList.contains('active')) {
			EOHBtnActive = true;
		}

		if (ehSwitch.classList.contains('active')) {
			EHBtnActive = true;
			const event = new Event('eh-switch-on');
			document.dispatchEvent(event);
		}

		// 播放开关音效
		switchSound.play();
	});
});

// console.log(localStorage.getItem("AliyaCalledMe"))
function closeModal() { // 移除 export
	document.querySelector('.modal-overlay').style.display = 'none';
	$('#operationModal').css("display", "none")
}

// 可选：添加关闭模态框的点击外部区域功能
document.querySelector('.modal-overlay').addEventListener('click', function (e) {
	if (e.target === this) {
		closeModal();
	}
});


// wait 
function wait(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// 显示加载点点点的GIF
function showPointLoadingGif() {
	elements.optionsContainer.style.backgroundImage = "url('./res/animation/wait/donet_waiting.gif')";
	// elements.optionsContainer.style.backgroundSize = 'cover';
	elements.optionsContainer.innerHTML = ''; // 隐藏选项
}

// 隐藏加载options选择框内的 GIF
function hideLoadingGif() {
	elements.optionsContainer.style.backgroundImage = '';
	elements.optionsContainer.innerHTML = ''; // 清空内容
}

function handlerParmas(params) {
	if (params?.music) {
		playMusicV1(params.music, true, 0.5);
		cachedData.last_music = params.music;
		// localStorage.setItem("saveData", JSON.stringify(cachedData));
	}

	if (params?.heart_rate) {
		console.log("被触发的心跳[" + params.heart_rate[0] + "," + params.heart_rate[1] + "]");
		setHeartBeat(params.heart_rate[0], params.heart_rate[1]);
		cachedData.heart_rate = params.heart_rate;
		// localStorage.setItem("saveData", JSON.stringify(cachedData));
	}

}

// 显示选项的Promise封装
function showOptions(options, params) { // params 包含 nessecery_op 等信息
	return new Promise((resolve) => {
		const optionsContainer = document.getElementById('player-options-container');
		optionsContainer.innerHTML = ''; // 清空旧选项

		options.forEach((option, index) => {
			const optionElement = document.createElement('button');
			optionElement.className = 'player-option';
			optionElement.textContent = option;

			optionElement.addEventListener('click', () => {
				// 检查 nessecery_op
				if (params && params.hasOwnProperty('nessecery_op')) {
					const requiredOptionIndex = params.nessecery_op;
					if (index !== requiredOptionIndex) {
						console.error(`必要操作检查失败：需要选项 ${requiredOptionIndex}，但选择了 ${index}。正在发送退出请求...`); // 改为 console.error
						window.electronAPI.sendQuitRequest(); // 发送退出请求
						return; // 阻止后续操作
					} else {
						console.log(`必要操作检查通过：选择了正确的选项 ${index}`); // 保留 console.log 用于成功情况
					}
				}

				handlerParmas(params);
				addMessage(option, true);
				optionsContainer.innerHTML = ''; // 选择后立即清除选项
				console.log("玩家选择了btn->" + index);
				resolve(index); // 只有在检查通过或不需要检查时才 resolve
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

	#init() {
		// 剧情阶段
		this.timeStage = 0;
		// 当前剧情阶段索引
		this.currentMessageIndex = 0;
		this.isLoad = true;
		this.cacheOptionIndex = 0;
		this.isEnd = false;
		this.readyForNextStage = true;
	}

	setTimeStage(stage) {
		if (typeof stage != 'number') {
			throw new Error("传入的应该是number类型")
		}
		this.timeStage = stage;
	}

	getTimeStage() {
		return this.timeStage;
	}

	getIsLoad() {
		return this.isLoad;
	}

	setIsLoad(boolValue) {
		if (typeof boolValue != 'boolean') {
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
	convertIsLoad() {
		this.isLoad = !this.isLoad;
		return this.isLoad;
	}

	convertIsEnd() {
		this.isEnd = !this.isEnd;
		return this.isEnd;
	}

	nextStage() {
		this.timeStage++;
	}

	nextMessage() {
		this.currentMessageIndex++;
	}
	nextCacheOptionIndex() {
		this.cacheOptionIndex++;
	}
}

const replySound = new Howl({
	src: ['./res/music/msg.mp3'],
	loop: false, // 让背景音乐循环
	volume: 1 // 调整音量
})

/**
 * 
 * @param {String} src 
 * @param {Boolean} isLoop 
 * @param {Float} volume 
 */
let musicInstance = null;
function playMusicV1(src, isLoop, volume) {
	if (musicInstance) {
		musicInstance.stop();
	}
	musicInstance = new Howl({
		src: [src],
		loop: isLoop,
		volume: volume
	});
	musicInstance.play();
}

// todo 抽离方法进行简化
/**
 * 往聊天框内加载信息 该方法中已整合存档和正常游玩功能;
 */
async function loadMessages() {
	const data = await loadModule.loadDialogueData();
	var cacheOptionList = cachedData.optionsChoiceList;
	var sendFromUser = false;
	if (!dialogueDto) {
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
			var hasSendTime = false;
			if (dialogueDto.getReadyForNextStage()) {
				while (currentMessageIndex < dialogue.messages.length) {
					const message = dialogue.messages[currentMessageIndex];
					if (currentMessageIndex === 0 && !hasSendTime) {
						// debugger;
						handleTimeMsg(cachedData.everyStartTimeList[timeStage], dialogueDto.getIsLoad())
						hasSendTime = true;
						console.log("已经输出过时间了");
					}

					if (dialogueDto.getIsLoad()) {
						currentMessageIndex = loadCacheData(dialogueDto, cacheOptionList, message, currentMessageIndex);
						continue;
					}
					// 等待action
					if (message.params && message.params.need_action) {
						// if (message.content[0].includes('燃料')) {
						//     // 当玩家需要打开燃料开关时，调用等待函数
						//     await waitForEHSwitch();
						// }
						// if (message.content[0].includes('制氧')) {
						//     // 当玩家需要打开氧气开关时，调用等待函数
						//     await waitForEOGSwitch();
						// }
						switch (message.params.need_action) {
							case ActionEnum.EOH:
								await waitForEOGSwitch();
								break;
							case ActionEnum.EH:
								await waitForEHSwitch();
								break;
						}
					}
					console.log("当前的消息是" + message.content[0]);
					// debugger; 当前应是具体流程
					if (message.type === 'player_options') {
						const choiceIndex = await showOptions(message.content, message.params);
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
					if (sendFromUser) {
						aliyaWaitingTime(lastUserMsg, true);
						sendFromUser = false;
					}
					sendMsg(null, message);
					cacheOptionList.push(0);
					cachedData.optionsChoiceList = cacheOptionList;
					localStorage.setItem("saveData", JSON.stringify(cachedData));

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
					// 业务新需求 当不处在倒数第二个阶段的时候 允许玩家进行跳过
					if (timeStage + 1 != data.dialogue.length - 1) {
						document.removeEventListener('keydown', handleKeyPress);
						document.addEventListener('keydown', handleKeyPress);
					}
					if (dialogueDto.getIsLoad()) {
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
					if (timeStage + 1 !== data.dialogue.length - 1) {
						document.addEventListener('keydown', handleKeyPress);
					}
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
			if (checkForNextStage(dialogueDto)) {
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
					if (checkForNextStage(dialogueDto)) {
						currentMessageIndex = 0;
						console.log("listner 里的currentMessageIndex被初始化");
					}
					document.removeEventListener('wakeUp', wakeUpListener);
					if (timeOutId) {
						clearTimeout(timeOutId);
						timeOutId = null;
					}
					resolve();
				};
				document.addEventListener('wakeUp', wakeUpListener);
				timeOutId = setTimeout(() => {
					document.removeEventListener('wakeUp', wakeUpListener); // 确保超时后移除
					if (checkForNextStage(dialogueDto)) {
						// debugger
						currentMessageIndex = 0;
					}
					resolve();
				}, 60000);
			});
			timeStage = dialogueDto.getTimeStage();
		}
	} catch (error) {
		console.error('加载消息时发生错误 (Error in loadMessages):', error); // 添加更详细的错误日志
	}
}

/**
 * @param {boolean} [isTargetConvert=false] 是否进行了对话方的转换 
 * @param {String} userMsg 用户消息 
 */
function aliyaWaitingTime(userMsg, isTargetConvert = false) {
	const msgLength = userMsg.length;
	showPointLoadingGif();
	// 如果是对话方互相转换时 额外增加1.2s
	if (isTargetConvert) {
		wait(1200);
	}
	if (msgLength <= 6) {
		wait(1200);
	} else if (msgLength <= 12) {
		wait(2400);
	} else if (msgLength <= 18) {
		wait(3600);
	} else {
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
function checkForNextStage(dialogueDto) {
	// debugger;
	if (hasReachedNextCheckpoint(Date.now(), cachedData.nextStageTime)) {
		dialogueDto.setTimeStage(dialogueDto.getTimeStage() + 1)
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
function loadCacheData(dialogueDto, cacheOptionList, message, currentMessageIndex) {
	// debugger;
	var index = dialogueDto.getCacheOptionIndex();
	// 只有当cache里面的数组遍历完的时候才算load完成;
	if (index > cacheOptionList.length - 1) {
		dialogueDto.setIsLoad(false);
		console.log("load完成");
		startResourceDecay();
		return currentMessageIndex;
	}
	var option = "";
	if (message.type === 'player_options') {
		option = message.content[cacheOptionList[index]];
		// dialogueDto.setCacheOptionIndex(index+=1);
	} else if (message.type === 'aliya') {
		option = message.content[0];
	}
	dialogueDto.setCacheOptionIndex(index += 1);
	sendMsg(option, message)
	return currentMessageIndex += 1;
}

/**
 *  todo 这边写的不好 可读性太差后续维护比较高，待更新;
 * @param {String} content 玩家的option选项;根据其是否是null来判断当前处于是load状态还是play状态  null为加载状态
 * @param {JSON} message 剧情文本
 */
function sendMsg(content, message) {
	var isLoad = content != null;
	if (message.image_url) {
		addImageMessage(message.image_url, false, !isLoad);
	} else {
		// 如果aliya发送的消息不是img的时候 则需要把他的content更新到content进行输出
		if (message.type == 'aliya') {
			content = message.content[0];
		}
		addMessage(content, message.type !== 'aliya', !isLoad);
	}
	if (isLoad == false) {
		// debugger;
		handlerParmas(message.params);
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
	console.log("按键事件触发" + event.key);
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

/**
 * 加载默认配置
 */
function loadConstConifg() {
	cachedData = loadModule.resume();
	oxgen = cachedData.resouce.oxgen;
	water = cachedData.resouce.water;
	eng = cachedData.resouce.eng;
	updateResBarConifg(oxgen, water, eng);
	const heartRate = cachedData.heart_rate;
	console.log(heartRate);
	if (heartRate[0] == 0 && heartRate[1] == 0) {
		document.querySelector('.heart-rate').style.backgroundImage = "url('./res/animation/heart_beat/heart_beat_0.gif')";
		document.querySelector('#ecgCanvas').style.display = "none";
	}
	setHeartBeat(heartRate[0], heartRate[1]);
	playMusicV1(cachedData.last_music, true, 0.5);
}



/** 
 * 更新氧气 水 能量的高度
 * @param {Float} oxgen 氧气
 * @param {Float} water 水
 * @param {Float} eng  燃料能量
 */
function updateResBarConifg(oxgen, water, eng) {
	const oxgenBar = document.querySelector('.bar.OO');
	const waterBar = document.querySelector('.bar.HOO');
	const engBar = document.querySelector('.bar.ENG');

	if (oxgenBar) {
		oxgenBar.style.height = oxgen + '%';
	}
	if (waterBar) {
		waterBar.style.height = water + '%';
	}
	if (engBar) {
		engBar.style.height = eng + '%';
	}
}

function startResourceDecay() {
	if (resourceInterval || isPaused) return; // 如果已有定时器或已暂停则不重复启动
	resourceInterval = setInterval(() => {
		// todo 待加按钮是否打开判断
		// 开启制氧机时水减少，氧气增加
		if (water > 0 && EOHBtnActive) {
			oxgen += 0.1;
			water -= 0.1;
		}
		if (eng > 5 && EHBtnActive) {
			eng -= 0.1;
		}
		// if (oxgen > 5 && EOHBtnActive) {
		//     oxgen -= 0.1;
		// }
		// if (water > 5 && EOHBtnActive) {
		//     water -= 0.1;
		// }
		// if (eng > 5 && EHBtnActive) {
		//     eng -= 0.1;
		// }
		updateResBarConifg(oxgen, water, eng);
	}, 60000); // 每分钟更新
}

// 暂停资源衰减
function pauseResourceDecay() {
	if (resourceInterval) {
		clearInterval(resourceInterval);
		isPaused = true;
	}
}

// 恢复资源衰减
function resumeResourceDecay() {
	if (isPaused) {
		isPaused = false; // 标记为恢复
		startDecay(); // 恢复定时器
	}
}

// 停止资源衰减
function stopResourceDecay() {
	if (resourceInterval) {
		clearInterval(resourceInterval); // 停止定时器
		resourceInterval = null; // 清除定时器实例
	}
}

/**
 * 等待EH触发
 * @returns 
 */
function waitForEHSwitch() {
	return new Promise(resolve => {
		const ehSwitch = document.getElementById('eh-switch-btn');
		if (!ehSwitch) {
			alert("找不到 EH 开关按钮！");
			resolve();
			return;
		}
		const onEHClicked = async () => {
			// 判断是否是开启操作
			const isActive = ehSwitch.classList.contains('active');
			if (!isActive) return; // 只处理开启的情况
			// 移除监听，避免重复触发
			ehSwitch.removeEventListener('click', onEHClicked);
			alert("EH 开关已开启，请保持 15 秒...");
			// 禁用点击（方式1：屏蔽点击）
			ehSwitch.style.pointerEvents = 'none';
			ehSwitch.style.opacity = '0.6'; // 可选视觉反馈
			// 倒计时 15 秒
			setTimeout(() => {
				// 自动关闭开关
				ehSwitch.classList.remove('active');
				// 同时切换状态文字
				const labels = ehSwitch.closest('.switch-wrapper').querySelector('.status-labels');
				labels.querySelector('.on')?.classList.remove('active');
				labels.querySelector('.off')?.classList.add('active');
				// 恢复点击
				ehSwitch.style.pointerEvents = '';
				ehSwitch.style.opacity = '';
				alert("EH 关闭，剧情继续");
				resolve();

			}, 15000);
		};
		// 等待玩家主动开启
		alert("请点击右侧 EH 开关以继续剧情（开启后将自动保持 15 秒）");
		ehSwitch.addEventListener('click', onEHClicked);
	});
}

// 等待EOG开关激活
function waitForEOGSwitch() {
	return new Promise(resolve => {
		const eogSwitch = document.getElementById('eog-switch-btn');
		if (!eogSwitch) {
			alert("找不到 EOG 开关按钮！");
			resolve();
			return;
		}

		setTimeout(() => {
			const onEOGClicked = () => {
				// 判断是否是开启操作
				const isActive = eogSwitch.classList.contains('active');
				if (!isActive) return; // 只处理开启的情况

				// 移除监听，避免重复触发
				eogSwitch.removeEventListener('click', onEOGClicked);
				alert("EOG 开关已开启，剧情继续");

				resolve(); // 开关激活后继续剧情
			};
		}, 10000);
		// 等待玩家主动开启
		alert("请点击右侧 EOG 开关以继续剧情");
		eogSwitch.addEventListener('click', onEOGClicked);
	});
}




function resumeInit() {
	loadConstConifg();
	loadMessages();
}

/**
 * 在destroy之前保存数据
 */
function saveDataBeforeQuit() {
	var resouce = {
		"oxgen": oxgen,
		"water": water,
		"eng": eng
	}
	cachedData.resouce = resouce;
}

let shouldSaveData = true;
document.addEventListener('DOMContentLoaded', () => {
	shouldSaveData = true;
	window.addEventListener('beforeunload', (event) => {
		debugger;
		if (shouldSaveData) {
			saveDataBeforeQuit()
			localStorage.setItem("saveData", JSON.stringify(cachedData));
		}
	});
});

Object.defineProperty(window, 'shouldSaveData', {
	set: function (value) {
		shouldSaveData = value;
		if (value === false) {
			cachedData = {}
			location.reload();
		}
	},
	get: function () {
		return shouldSaveData;
	}
});


window.addEventListener('load', () => {
	setTimeout(() => {
		alert("为了完整体验，请允许通知权限哦！");
		requestNotificationPermission();
	}, 1000);
});



// 启动应用
init();
// loadMessages();
// playMusic(); // 在页面加载时播放音乐

export { closeModal }