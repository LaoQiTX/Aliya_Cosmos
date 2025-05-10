# Aliya_Cosmos

#### 介绍

本项目是基于《彼方的她》游戏二创，截至目前暂未完成所有功能
有bug和建议欢迎反馈

反馈邮箱
LaoQiWeb@outlook.com

或者
laoqi_young@foxmail.com

#### 架构

#### TODO：

1.心跳和面板联动，氧气和水联动和消耗速率，按钮音效和逻辑锁
（开关音效完成）
2.按钮动画分辨率适配，

3.阶段等待时候的timer动画

6.发送通知时显示用户名有问题 (待检验)

项目启动:

1.open Server live
2.npm start (起应用)

3.npm run ele_pack
npx electron-packager . MyApp --platform=win32 --arch=x64 --out=dist --overwrite --icon=QDW.ico
参数:
MyApp 是app的应用名称；
platform 是适配的平台;
out是输出的文件夹路径，当前配的是项目文件夹下的dist；
overwrite是覆盖旧文件；
icon是app的图标;

election是打包时候 也就是你 npm run ele_pack的地方；
其中的page是加密后的文件；
加密你需要在外层；用npm run vite_build来进行打包；他打完包会放到election的page文件里面去；
这是prod 生产环境下的情况；
如果你要进行调试；
首先回到最外层；使用npm run vite_test 先把vite服务启动起来，他会启动一个前端服务器;然后此时你在回到election文件夹下，使用npm run start 他会去匹配这个前端服务器，此时就是未加密状态下的调试了；