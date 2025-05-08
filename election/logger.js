const fs = require("fs");
const path = require("path");

const appPath = path.dirname(process.execPath);

// 日志文件基础路径 判断当前是env 还是prod 如果是生产环境就直接拿appPath
const logBasePath =
  process.env.NODE_ENV === "dev"
    ? path.resolve(__dirname, "logs")
    : path.join(appPath, "logs");

// 确保日志目录存在
function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 格式化时间
 * @returns {String} formateTime 东八区时间
 */
function formateTime() {
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
  });

  return formatter.format(new Date()).replace(/\//g, "-");
}

/**
 * 获取当天日志文件路径
 * @returns {String} path 日志路劲
 */
function getLogFilePath() {
  const dateStr = formateTime().split(" ")[0];
  const dir = path.join(logBasePath, dateStr);
  ensureDirExists(dir);
  return path.join(dir, "app.log");
}

/**
 * 写入日志到文件
 * @param {String} level
 * @param {String} message
 */
function writeLog(level, message) {
  const nowStr = formateTime();
  const logLine = `[${level}] ${nowStr} - ${message}\n`;
  const logFilePath = getLogFilePath();
  fs.appendFileSync(logFilePath, logLine, "utf8");
}

/**
 * console 输出
 * @param {String} level
 * @param {String} message
 */
function printConsole(level, message) {
  const now = formateTime();
  const base = `[${level}] ${now} - ${message}`;
  if (level === "ERROR") {
    console.error(base);
  } else {
    console.log(base);
  }
}

/**
 * 入口方法
 * @param {String} level
 * @param {String} message
 */
function log(level, message) {
  printConsole(level, message);
  writeLog(level, message);
}

/**
 * 对外暴露的方法封装;
 */
const logger = {
  info: (msg) => log("INFO", msg),
  debug: (msg) => log("DEBUG", msg),
  error: (msg) => log("ERROR", msg),
};

module.exports = logger;
