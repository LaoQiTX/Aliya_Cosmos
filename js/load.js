
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

export { getCache, loadDialogueData, resume};