const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// 测试文件 后续要更新成实际的
const targetFile = 'E:/Yae/test/web_aliya_cosmos/dist/app.asar';

if (!fs.existsSync(targetFile)) {
    console.log(`文件不存在: ${targetFile}`);
    return;
}

const hash = crypto.createHash('md5');
const stream = fs.createReadStream(targetFile);

stream.on('data', chunk => hash.update(chunk));
stream.on('end', () => {
    const md5 = hash.digest('hex');
    console.log(`文件: ${targetFile}`);
    console.log(`MD5: ${md5}`);
});

stream.on('error', err => {
    console.error(` 读取文件出错: ${err}`);
});