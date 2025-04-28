
/**
 * web端调用打印日志输出到本地logs中
 */

/**
 * Info 日志输出
 * @param {String} msg 
 */
function loggerInfo(msg){
    window.electronAPI.log.info(msg);
}
/**
 * Debug 日志输出
 * @param {String} msg 
 */
function loggerDebug(msg){
    window.electronAPI.log.debug(msg);
}

/**
 * Error 日志输出
 * @param {String} msg 
 */
function loggerError(msg){
    window.electronAPI.log.error(msg);
}

export { loggerInfo, loggerDebug, loggerError };