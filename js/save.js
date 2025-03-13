// 该方法用于对存档进行保存存储

/**
 * 返回更新后的运行时间
 * @returns 运行时间
 */
function getUpdateRunTime() {
    const startTime = Date.now();
    let lastExitTime = getLastRunTime();
    let saveData = localStorage.getItem("saveData");
    // 当前运行的时间
    const runTime = startTime - lastExitTime;
    console.log("runTime", runTime);
    saveData = saveData || {};
    saveData.lastExitTime = startTime;
    localStorage.setItem("saveData", JSON.stringify(saveData));
    return runTime;
}


/**
 * 获取上次运行的时间;
 * @returns {int} 上次运行时间
 */
function getLastRunTime() {
    let saveData = localStorage.getItem("saveData");
    let lastExitTime;
    if (saveData == null) {
        lastExitTime = Date.now();
        return lastExitTime;
    }
    saveData = JSON.parse(saveData);
    return saveData.lastExitTime;
}

/**
 * 保存存档
 * @param {int} optionIndex 当前的option索引
 * @param {String} userName 当前的玩家名称
 * @returns {boolean} 是否保存成功
 */
function save(optionIndex, userName) {
    const lastExitTime = Date.now();
    const saveData = {
        userName: userName,
        lastExitTime: lastExitTime,
        optionIndex: optionIndex
    }
    localStorage.setItem("saveData", JSON.stringify(saveData));
    return true;
}

export { getUpdateRunTime, getLastRunTime, save };
