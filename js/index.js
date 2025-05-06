// import * as saveModule from './save.js';
import * as loadModule from './load.js';
import { ActionEnum } from './enums/action_enum.js';
import { loggerInfo, loggerDebug, loggerError } from './utils/webUtils/logger.js';
import { initConnection } from './operation_init.js';
import { closeWindow } from './operation_closeWindow.js';
import { closeInputDialog,saveUsername,showInputDialog } from './settings.js';

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
// 是否允许点击按钮
let canClickEOG = false;
let canClickEH = false;

// 记录当前心率更新的定时器
let heartBeatInterval = null;
// 控制是否允许跳过
let isSkippable = true;
// 当前心跳
let bpm = 0;
let musicInstance = null;
// 定义开关音效对象
const switchSound = new Howl({
	src: ['./res/music/switch.wav'],
	loop: false,
	volume: 1
});
let shouldSaveData = true;
// 存储待发送的通知
let pendingNotifications = [];
// 初始化
function init() {
	requestNotificationPermission();
	// 定期更新心率
	resumeInit();
	// 添加键盘事件监听
	document.addEventListener('keydown', handleKeyPress);
	window.addEventListener('focus', clearPendingNotifications);
	// 初始化时禁用开关
	setEOGSwitchEnabled(false);
	setEHSwitchEnabled(false);
	// 绑定按钮事件
	bindBtnClick();
	// 按钮滑动事件
	bindSwitchBtn();
}

function bindBtnClick(){
	// 初始化链接按钮
	const initBtn = document.querySelector('.init-btn');
	initBtn.addEventListener('click',initConnection);
	// 关闭弹窗按钮
	const closeBtn = document.querySelector('.exit-btn');
	closeBtn.addEventListener('click',closeWindow);
	// 取消弹窗按钮
	const cancleBtn = document.querySelector('.cancel-btn');
	cancleBtn.addEventListener('click',closeInputDialog)

	// 可选：添加关闭模态框的点击外部区域功能
	document.querySelector('.modal-overlay').addEventListener('click', function (e) {
		if (e.target === this) {
			closeModal();
		}
	});

	// 关闭图片弹出
	document.getElementById('image-popup').addEventListener('click', function (e) {
		// 点击任何区域都关闭弹出框
		this.style.display = 'none';
	});

	// 关闭弹出框
	document.getElementById('close-popup').addEventListener('click', () => {
		document.getElementById('image-popup').style.display = 'none';
	});
}

function bindSwitchBtn(){
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
}

// 页面重新聚焦时只清理队列，不发送
function clearPendingNotifications() {
	pendingNotifications = [];
}

// 设置设否允许点击按钮
function setEOGSwitchEnabled(enabled) {
	const eogSwitch = document.getElementById('eog-switch-btn');
	canClickEOG = enabled;
	eogSwitch.style.pointerEvents = enabled ? '' : 'none';
}

function setEHSwitchEnabled(enabled) {
	const ehSwitch = document.getElementById('eh-switch-btn');
	canClickEH = enabled;
	ehSwitch.style.pointerEvents = enabled ? '' : 'none';
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

function setHeartBeat(min, max) {
	if (heartBeatInterval) {
		clearInterval(heartBeatInterval);
	}

	heartBeatInterval = setInterval(() => updateHeartRate(min, max), 1000);
}

// 更新心率函数
function updateHeartRate(min, max) {
	const bpmElement = document.querySelector('.bpm');
	// debugger;
	const randomHeartRate = getRandomHeartRate(min, max); // 设置心率范围
	if (max > min && min > 0) {
		bpm = randomHeartRate;
		document.querySelector('.heart-rate').style.backgroundImage = "none";
		document.querySelector('#ecgCanvas').style.display = "block";
		document.querySelector('#ecgCanvas').style.position = "absolute";
	} else if (max === min && min === 0) {
		bpm = 0;
		document.querySelector('.heart-rate').style.display = "flex";
		document.querySelector('.heart-rate').style.backgroundImage = "url('./res/animation/heart_beat/heart_beat_0.gif')";
		document.querySelector('#ecgCanvas').style.display = "none";
	}
	bpmElement.textContent = randomHeartRate;
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
		loggerInfo('试图添加空文本消息，已跳过:' + text);
		return;
	}
	// 如果options的动画还没结束就再次触发来进行结束
	hideLoadingGif();
	if (text.includes("$userName$")) {
		text = text.replace("$userName$", localStorage.getItem('AliyaCalledMe'))
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
			loggerInfo("用户允许了通知");
			// 可以执行通知相关逻辑
			return;
		}
		loggerInfo("用户拒绝了通知");

	});
}

// todo 加变量来区分当前是处于加载状态还是正常状态
function checkNotification(text, isUser) {
	const focused = window.electronAPI.isFocus();
	if (!isUser && Notification.permission === 'granted' && !focused) {
		showNotification('Aliya发来了一条新消息哦', text);
	}
	// if (!isUser && Notification.permission === 'granted' && !document.hasFocus()) {
	// 	showNotification('Aliya发来了一条新消息哦', text);
	// }
}

function showNotification(title, message) {
	try {
		new Notification(title, {
			body: message,
			icon: CONFIG.notificationIcon
		});
	} catch (e) {
		loggerError("通知发送失败:", e);
	}
}


// console.log(localStorage.getItem("AliyaCalledMe"))
function closeModal() { // 移除 export
	$('#operationModal').css("display", "none")
}
$("#closeWindow").on("click", function () {
	closeModal()
});

// wait 
function wait(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// 显示加载点点点的GIF
function showLoadingGif(url) {
	// elements.optionsContainer.style.backgroundImage = "url('./res/animation/wait/donet_waiting.gif')";
	elements.optionsContainer.style.backgroundImage = url;

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
		if (params.music != cachedData.last_music) {
			playMusicV1(params.music, true, 0.5);
			cachedData.last_music = params.music;
			loggerInfo("播放音乐" + params.music);
			// localStorage.setItem("saveData", JSON.stringify(cachedData));
		}
	}

	if (params?.heart_rate) {
		loggerInfo("被触发的心跳[" + params.heart_rate[0] + "," + params.heart_rate[1] + "]");
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
						loggerError(`必要操作检查失败：需要选项 ${requiredOptionIndex}，但选择了 ${index}。正在发送退出请求...`);
						window.electronAPI.sendQuitRequest(); // 发送退出请求
						return; // 阻止后续操作
					} else {
						loggerInfo(`必要操作检查通过：选择了正确的选项 ${index}`); // 保留 console.log 用于成功情况
					}
				}

				handlerParmas(params);
				addMessage(option, true);
				optionsContainer.innerHTML = ''; // 选择后立即清除选项
				// loggerInfo("玩家选择了btn->" + index);
				resolve(index); // 只有在检查通过或不需要检查时才 resolve
			});

			optionsContainer.appendChild(optionElement);
		});
	});
}

// 在 wait 之前显示 GIF 并隐藏选项
// todo 目前这个是当信息是最后一个的时候就直接变成了timer的图片;如果需要先加载点点点就把这边的return删去，并把参数和调用时传入的参数去掉即可
async function pointAnimation(curIndex = -1, targetIndex = 0) {
	if (curIndex === targetIndex) {
		return;
	}
	const waitGifUrl = "url('./res/animation/wait/donet_waiting.gif')";
	showLoadingGif(waitGifUrl);
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
	loggerInfo("开始load中");
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
						loggerInfo("已经输出过时间了");
					}

					if (dialogueDto.getIsLoad()) {
						currentMessageIndex = loadCacheData(dialogueDto, cacheOptionList, message, currentMessageIndex);
						continue;
					}
					// 等待action
					if (message.params && message.params.need_action) {
						switch (message.params.need_action) {
							case ActionEnum.EOH:
								await waitForEOGSwitch();
								break;
							case ActionEnum.EH:
								await waitForEHSwitch();
								break;
						}
					}
					// loggerInfo("当前的消息是" + message.content[0]);
					// debugger; 当前应是具体流程
					if (message.type === 'player_options') {
						const choiceIndex = await showOptions(message.content, message.params);
						lastUserMsg = message.content[choiceIndex];
						cacheOptionList.push(choiceIndex);
						cachedData.optionsChoiceList = cacheOptionList;
						localStorage.setItem("saveData", JSON.stringify(cachedData));
						currentMessageIndex++;
						sendFromUser = true;
						await pointAnimation(currentMessageIndex, dialogue.messages.length);
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
					await pointAnimation(currentMessageIndex, dialogue.messages.length);
				}

				const timerGifUrl = "url('./res/animation/wait/timer.gif')"
				showLoadingGif(timerGifUrl);

				if (!dialogueDto.getIsLoad()) {
					// 业务新需求 当不处在倒数第二个阶段的时候 允许玩家进行跳过
					isSkippable = timeStage + 1 !== data.dialogue.length - 1;
					isEnd = true;
				}

				// 此时说明当前阶段剧情已经结束 更新下个剧情的时间戳检查点
				if (isEnd) {
					loggerInfo("当前的时间戳是" + dialogue.timestamp);
					cachedData.nextStageTime = dialogue.timestamp + Date.now();
					localStorage.setItem("saveData", JSON.stringify(cachedData));
					isEnd = false;
					dialogueDto.setReadyForNextStage(false);
					currentMessageIndex = 0;
					loggerInfo("更新时间戳成功");
				}
			}

			// 如果已经准备好进入下个阶段时 则直接进入循环;
			if (checkForNextStage(dialogueDto)) {
				currentMessageIndex = 0;
				timeStage = dialogueDto.getTimeStage();
				continue;
			}
			await new Promise(resolve => {
				let timeOutId;
				const wakeUpListener = () => {
					if (checkForNextStage(dialogueDto)) {
						currentMessageIndex = 0;
						loggerInfo("listner 里的currentMessageIndex被初始化");
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
		console.error(error);
		loggerError('加载消息时发生错误 (Error in loadMessages):' + error);
	}
}

/**
 * @param {boolean} [isTargetConvert=false] 是否进行了对话方的转换 
 * @param {String} userMsg 用户消息 
 */
function aliyaWaitingTime(userMsg, isTargetConvert = false) {
	const msgLength = userMsg.length;
	const waitGifUrl = "url('./res/animation/wait/donet_waiting.gif')";
	showLoadingGif(waitGifUrl);
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
		loggerInfo("已经准备好进入下一阶段");
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
		loggerInfo("load完成");
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
	var isLoad = content == null;
	if (message.image_url) {
		addImageMessage(message.image_url, false, isLoad);
	} else {
		// 如果aliya发送的消息不是img的时候 则需要把他的content更新到content进行输出
		if (message.type == 'aliya') {
			content = message.content[0];
		}
		addMessage(content, message.type !== 'aliya', isLoad);
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
	messageElement.addEventListener('dblclick', () => {
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


// 键盘事件监听器
function handleKeyPress(event) {
	loggerInfo("按键事件触发: " + event.key);
	if (event.key === 'Shift' && isSkippable) {
		cachedData.nextStageTime = Date.now();
		localStorage.setItem("saveData", JSON.stringify(cachedData));
		loggerInfo("nextStageTime 已更新为当前时间");
		document.dispatchEvent(new Event('wakeUp'));
		// 不再移除监听器，而是通过状态控制来避免重复触发
	}
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
	loggerInfo(heartRate);
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

	// 设置一个每秒执行一次的定时器，用于更新资源状态
	resourceInterval = setInterval(() => {
		// 氧气消耗值
		let prevOxgenConsumption = 0;

		// 检查是否开启制氧机
		if (bpm == 0) {
			return;
		} else if (water > 0 && EOHBtnActive) {
			// 每秒增加氧气量，每15s增加 30 个单位，所以每秒增加 3/15 个单位
			oxgen += 35 / 30;
			// 每秒减少水量，每15s减少 40 个单位，所以每秒减少 40/15 个单位
			water -= 40 / 30;
			// 确保氧气值不超过 100
			oxgen = Math.min(oxgen, 100);
			// 确保水值不低于 0
			water = Math.max(water, 0);
		}
		// 若制氧机按钮未激活
		else if (!EOHBtnActive) {
			if (oxgen < 30) {
				if (prevOxgenConsumption === 0) {
					prevOxgenConsumption = 0.01;
				}
				// 消耗当前的氧气量
				oxgen -= prevOxgenConsumption;
				// 确保氧气值不低于 0
				oxgen = Math.max(oxgen, 0);
				// 下一次的消耗值变为当前消耗值的一半，实现消耗减半的效果
				prevOxgenConsumption /= 2;
			} else {
				// 非制氧机激活状态下且氧气量不小于 30 时，每秒固定消耗 0.01 个单位的氧气
				oxgen -= 0.01;
				// 确保氧气值不低于 0
				oxgen = Math.max(oxgen, 0);
			}
		}

		// 检查是否满足能源消耗条件：能源存量大于 5 且能源消耗按钮处于激活状态
		if (EHBtnActive) {
			// 动态计算每秒消耗的能源量
			eng = Math.max(eng - 0.1, 0);
		}

		// 调用更新资源条配置的函数，将当前的氧气、水和能源值传递进去
		updateResBarConifg(oxgen, water, eng);
	}, 1000);
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
		setEHSwitchEnabled(true);
		const ehSwitch = document.getElementById('eh-switch-btn');
		if (!ehSwitch) {
			alert("找不到 EH 开关按钮！");
			resolve();
			return;
		}

		// 在函数作用域内声明变量
		let autoOpenTimeout = null;

		// 重置自动打开定时器
		const resetAutoOpenTimer = () => {
			if (autoOpenTimeout) {
				clearTimeout(autoOpenTimeout);
			}
			autoOpenTimeout = setTimeout(() => {
				if (!ehSwitch.classList.contains('active')) {
					ehSwitch.click(); // 自动触发点击事件
				}
			}, 15000);
		};

		const onEHClicked = async () => {
			const isActive = ehSwitch.classList.contains('active');
			if (!isActive) return;

			// 清除自动打开定时器
			if (autoOpenTimeout) {
				clearTimeout(autoOpenTimeout);
				autoOpenTimeout = null;
			}

			// 移除监听器
			ehSwitch.removeEventListener('click', onEHClicked);
			document.removeEventListener('mousemove', resetAutoOpenTimer);
			document.removeEventListener('keydown', resetAutoOpenTimer);

			alert("EH 开关已开启，请保持 15 秒...");
			ehSwitch.style.pointerEvents = 'none';

			setTimeout(() => {
				ehSwitch.classList.remove('active');
				const labels = ehSwitch.closest('.switch-wrapper').querySelector('.status-labels');
				labels.querySelector('.on')?.classList.remove('active');
				labels.querySelector('.off')?.classList.add('active');
				ehSwitch.style.pointerEvents = '';
				ehSwitch.style.opacity = '';
				alert("EH 关闭，剧情继续");
				EHBtnActive = false;
				setEHSwitchEnabled(false);
				resolve();
			}, 15000);
		};

		// alert("请点击右侧 EH 开关以继续剧情（开启后将自动保持 15 秒），或等待15秒自动开启");
		ehSwitch.addEventListener('click', onEHClicked);

		// 添加鼠标移动和键盘事件监听
		document.addEventListener('mousemove', resetAutoOpenTimer);
		document.addEventListener('keydown', resetAutoOpenTimer);

		// 初始化自动打开定时器
		resetAutoOpenTimer();
	});
}
// 等待EOG开关激活
function waitForEOGSwitch() {
	setEOGSwitchEnabled(true);
	return new Promise(resolve => {
		const eogSwitch = document.getElementById('eog-switch-btn');
		if (!eogSwitch) {
			alert("找不到 EOG 开关按钮！");
			resolve();
			return;
		}

		let autoActivateTimer;

		// 点击回调：检测到开关被激活后，等待15秒再继续
		const onEOGActivated = () => {
			if (!eogSwitch.classList.contains('active')) return;  // 只在开启时处理

			// 清除自动激活定时器
			clearTimeout(autoActivateTimer);
			// 移除监听，避免重复触发
			eogSwitch.removeEventListener('click', onEOGActivated);

			// alert("EOG 开关已开启，请保持 15 秒...");
			const interval = setTimeout(() => {
				// 每秒检测一下 查看是否eng到底了
				if (eng <= 0) {
					clearInterval(interval); // 停止监听
			
					eogSwitch.classList.remove('active');
					const labels = eogSwitch.closest('.switch-wrapper').querySelector('.status-labels');
					labels.querySelector('.on')?.classList.remove('active');
					labels.querySelector('.off')?.classList.add('active');
					// alert("15 秒已到，EOG 关闭，剧情继续");
					EOHBtnActive = false;
					// setEOGSwitchEnabled(false);
					resolve();
				}
			}, 1000);
		};

		// 注册点击监听
		eogSwitch.addEventListener('click', onEOGActivated);

		// 10 秒后如果仍未激活，则自动点击激活
		autoActivateTimer = setTimeout(() => {
			if (!eogSwitch.classList.contains('active')) {
				eogSwitch.click();
			}
		}, 10000);

		// 最初提示
		alert("请点击右侧 EOG 开关以继续剧情（若10秒内未开启，将自动激活；开启后需保持15秒）");
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
		// alert("为了完整体验，请允许通知权限哦！");
		requestNotificationPermission();
	}, 1000);
});



// 启动应用
init();
// loadMessages();
// playMusic(); // 在页面加载时播放音乐

export { closeModal }