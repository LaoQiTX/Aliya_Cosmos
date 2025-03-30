

// /**
//  * 加载数据
//  * @returns {JSON} 返回存档数据 
//  */
// function loadGameProgress() {
//     const saveData = localStorage.getItem("gameSave");
//     if (!saveData) return null;

//     const data = JSON.parse(saveData);

//     const timeAway = (Date.now() - data.lastExitTime) / 1000; // 计算玩家离开的时间
//     data.elapsedTime += timeAway; // 让 elapsedTime 继续增长

//     return data;
// }

function getCache() {
    return JSON.parse(localStorage.getItem("saveData") || "{}");
}

/**
 * 
 * @returns {Promise<JSON>} 返回剧情数据
 */
async function loadDialogueData() {
    const response = await fetch('./res/data/data.json');
    const data = await response.json();
    console.log(data);
    return data;
}


function resume (){
    var cacheData = getCache();
    // 如果是第一次进入 则将该下个剧情时间节点设置成当前节点
    if (Object.keys(cacheData).length === 0) {  
        cacheData = firstLoad(cacheData);
        localStorage.setItem("saveData", JSON.stringify(cacheData));
    }
    return cacheData;
}



function firstLoad(data){
    // 存的是用户每个阶段开始的时间数组;
    if(data.everyStartTimeList == null || data.everyStartTimeList.length == 0){
        data.everyStartTimeList = [];
        // data.everyStartTimeList.push(Date.now());
    }
    // 第一次进入则设置下个时间节点为当前时间，待其选完全部的剧情后再对其进行时间戳的更新
    if(data.nextStageTime == null){
        data.nextStageTime = Date.now() + 300000;
    }
    // 第一次进入则设置文本索引为0
    if(data.optionIndex == null){
        data.optionIndex = 0;
    }
    // 第一次进入则设置剧情阶段为0
    if(data.timeStage == null){
        data.timeStage = 0;
    }
    if(data.optionsChoiceList == null){
        data.optionsChoiceList = [];
    }

    if(data.resouce == null){
        data.resouce={
            "oxgen":50.0,
            "water":50.0,
            "eng":50.0
        }
    }

    if(data.last_music == null){
        data.last_music = "./res/music/Astral_Sunset.mp3"
    }
    data.heart_rate = [0,0];
    return data;
}




// /**
//  * 恢复数据
//  * @param {JSON} dialogue 剧情数据 
//  * @returns 
//  */
// function resumeGame(dialogue, lastRuntime, lastOptionIndex) {
//     // const savedData = loadGameProgress();
//     // if (!savedData) {
//     //     startGame(dialogue, 0);
//     //     return;
//     // }

//     // 用修正后的 elapsedTime 查找存档点
//     const { timeStage, optionIndex } = findResumePoint(dialogue, lastRuntime, lastOptionIndex);
//     return { timeStage, optionIndex };
//     // startGame(savedData.gameData, index, optionIndex);
// }


// /**
//  *  查找存档点 
//  * @param {*} dialogue 剧情数据
//  * @param {*} lastRuntime 上次运行时间
//  * @param {*} lastOptionIndex 上次的选项索引
//  * @returns 
//  */
// function findResumePoint(dialogue, lastRuntime, lastOptionIndex) {
//     // 当前的时间阶段;
//     let timeStage = 0;

//     for (let i = 0; i < dialogue.length; i++) {
//         if (dialogue[i].timestamp < lastRuntime) {
//             timeStage = i; // 找到最接近 `elapsedTime` 的时间戳
//         } else {
//             break;
//         }
//     }

//     const messages = dialogue[index].messages;

//     // 如果存档点正好是 `player_options`，直接返回
//     if (messages[lastOptionIndex] && messages[lastOptionIndex].type === "player_options") {
//         return { timeStage, optionIndex: lastOptionIndex };
//     }

//     // 否则，寻找下一个 `player_options`
//     for (let i = lastOptionIndex + 1; i < messages.length; i++) {
//         if (messages[i].type === "player_options") {
//             return { timeStage, optionIndex: i };
//         }
//     }
//     // 如果没有找到则说明上个阶段的剧情已经结束，应检查进入下个阶段
//     return { timeStage: timeStage + 1, optionIndex: 0 };
// }
export { getCache, loadDialogueData, resume};