# Aliya_Cosmos

#### 介绍
本项目是基于《彼方的她》游戏二创，截至目前暂未完成所有功能
有bug和建议欢迎反馈

反馈邮箱 
LaoQiWeb@outlook.com

或者
laoqi_young@foxmail.com

#### 架构
代码几乎都是html+css+js/jQuery

## 安装教程
#### （目前最新版应该不需要了）推荐新手最好下载一个IDE（写代码的软件）这里推荐hbuilder/vscode/webstorm，本教程使用hbuilder
##### 1、下载代码

（本教程面向新手 大佬基本可以跳过）

在页面右上角有一个“克隆/下载”按钮

![下载代码](https://foruda.gitee.com/images/1740845733131684457/f6ac7d4d_15010283.png "下载代码")

点击后可以直接选择点击“下载zip”

![下载zip](https://foruda.gitee.com/images/1740845833980335674/545f6c6c_15010283.png "下载zip")

最新的版本不需要修改代码，直接解压好后直接点开文件中的<b>index.html</b>文件就可以使用了！

![index](%E6%95%99%E7%A8%8B%E6%88%AA%E5%9B%BE/index.html.png)

然后点击Operation，点击配置接口

![配置接口](%E6%95%99%E7%A8%8B%E6%88%AA%E5%9B%BE/%E9%85%8D%E7%BD%AE%E6%8E%A5%E5%8F%A3.png)

然后输入你的URL和key 如何获取url和key在后面的教程里讲到了

![URL/key](%E6%95%99%E7%A8%8B%E6%88%AA%E5%9B%BE/URL/key.png)

##### 2、搭建deepseek+dify（本教程为最简单版）
先去deepseek官网[deepseek官网](https://www.deepseek.com/)，点右上角的“api开放平台”

![deepseek官网api开放平台](%E6%95%99%E7%A8%8B%E6%88%AA%E5%9B%BE/deepseek%E5%AE%98%E7%BD%91.png)

第一次进入应该会叫你注册，根据提示注册就好，新人应该会给10CHY的赠送余额，反正之前会送，现在会不会送不太清楚了，但是注意，这个余额是限时的，到期之后就需要自己充值了，也不算贵，自己玩玩10元就可以用很久了

![deepseek开放平台](%E6%95%99%E7%A8%8B%E6%88%AA%E5%9B%BE/deepseek%E5%BC%80%E6%94%BE%E5%B9%B3%E5%8F%B0.png)

如果不想花钱，也可以本地部署deepseek，具体可以在b站搜教程，这里我暂时不做过多解释，搜索关键字“deepseek dify 本地部署”、“deepseek本地部署”等

接下来就是创建一个key，点击“API keys”、“创建API key”

![apikey页面](%E6%95%99%E7%A8%8B%E6%88%AA%E5%9B%BE/apikey%E9%A1%B5%E9%9D%A2.png)

![创建apikey](%E6%95%99%E7%A8%8B%E6%88%AA%E5%9B%BE/%E5%88%9B%E5%BB%BAapikey.png)

创建好之后   **一定要复制！！如果这时候没复制并存下来，以后这个key就没办法找回了，只能重新创建，请妥善保管！** 

![复制key](%E6%95%99%E7%A8%8B%E6%88%AA%E5%9B%BE/%E5%A4%8D%E5%88%B6key.png)

接下来我们部署dify！

我是直接将dify部署在了我的服务器上 宝塔面板可以直接一键部署dify

![宝塔面板可以直接一键部署dify](%E6%95%99%E7%A8%8B%E6%88%AA%E5%9B%BE/%E5%AE%9D%E5%A1%94%E4%B8%80%E9%94%AE%E9%83%A8%E7%BD%B2dify.png)

 _我的服务器是centos7系统_ 

没有服务器的可以在 [阿里云新人试用](https://www.aliyun.com/product/ecs?spm=5176.29677750.nav-v2-dropdown-menu-1.d_main_0_0.5421154a5Q4osv&scm=20140722.M_ecs.P_197.ID_ecs-OR_rec-V_1-MO_3480-ST_12892) 这个页面申请试用（不是恰饭），具体方法在b站也有教程，我这里因为已经试用过了所以没办法演示

也可以用在雨云购买一台服务器（邀请用户注册使用我这里有收益，希望理解一下，邀请码 Mzk2Mjk0 ）[雨云](https://www.rainyun.com/Mzk2Mjk0_)

以上两种方式都是没有图形界面的，需要远程连接，或者用服务器自带的连接工具

也可以本地部署一个服务器[VM虚拟机+本地服务器+配置静态IP+宝塔面板（详细过程）](https://blog.csdn.net/qq_43629264/article/details/125978621)

宝塔面板的安装在官网和上面的教程里都有，有不懂的可以邮箱或者其他平台私信问我，也可以自己搜一搜教程，几乎所有问题在网上都能找到答案

那么接下来部署好的dify就可以启动了！在你的浏览器地址栏内输入 [你服务器的ip]:[dify部署的端口]，例如192.168.1.101:8088

一般来说端口号可以在这里看到
![dify端口](%E6%95%99%E7%A8%8B%E6%88%AA%E5%9B%BE/dify%E7%AB%AF%E5%8F%A3%E5%8F%B7.png)

如果你无法访问这个页面，可能是端口没有被放行
![宝塔放行端口](%E6%95%99%E7%A8%8B%E6%88%AA%E5%9B%BE/%E5%AE%9D%E5%A1%94%E7%AB%AF%E5%8F%A3%E6%94%BE%E8%A1%8C.png)

如果还是无法访问，可以在去你购买服务器之后给的后台，一般会有一个叫 **安全组** 的板块，点进去之后和上面的操作一样

##### 3、创建dify对话应用
进入dify的页面后，首次进入会让你注册一个管理员账号，按照提示注册即可，注册号之后如图进入设置

![dify设置](%E6%95%99%E7%A8%8B%E6%88%AA%E5%9B%BE/dify%E8%AE%BE%E7%BD%AE.png)

![dify添加deepseek](%E6%95%99%E7%A8%8B%E6%88%AA%E5%9B%BE/dyfy%20%E6%B7%BB%E5%8A%A0%20deepseek%20.png)

注意如果你是本地部署的 或者使用了其他方式 请参考你找到的教程，方法不唯一！

保存好后就可以创建一个应用了
![dify创建应用](%E6%95%99%E7%A8%8B%E6%88%AA%E5%9B%BE/dify%E5%88%9B%E5%BB%BA%E5%BA%94%E7%94%A8.png)

![dify起名](%E6%95%99%E7%A8%8B%E6%88%AA%E5%9B%BE/dify%E8%B5%B7%E5%90%8D.png)

接下来就可以把“提示词”文件夹内的文本复制到提示词中了， **这里要要记得创建变量 提示词中{{}}包裹的都是变量 需要创建好** 

![dify提示词](%E6%95%99%E7%A8%8B%E6%88%AA%E5%9B%BE/dify%E6%8F%90%E7%A4%BA%E8%AF%8D.png)

也可以自己写一些设定放在 上下文 中

接下来就可以见证奇迹了!
![aliya回答1](%E6%95%99%E7%A8%8B%E6%88%AA%E5%9B%BE/aliya%E5%9B%9E%E7%AD%941.png)

##### 4、将dify与网页连接！
点击发布后 点击发布边上的小箭头，之后点击访问api

![发布应用](%E6%95%99%E7%A8%8B%E6%88%AA%E5%9B%BE/%E5%8F%91%E5%B8%83%E5%BA%94%E7%94%A8.png)

记得在api的ip后面加上端口例如 http://192.168.1.101:8088/v1

![服务地址](%E6%95%99%E7%A8%8B%E6%88%AA%E5%9B%BE/%E5%9C%B0%E5%9D%80.png)

将基础url和url拼在一起就是我们要用的地址了
例如：http://192.168.1.101:8088/v1/chat-messages

##### 5、修改代码
修改途中圈出位置
![连接代码](%E6%95%99%E7%A8%8B%E6%88%AA%E5%9B%BE/%E8%BF%9E%E6%8E%A5%E4%BB%A3%E7%A0%81.png)

接下来再次在浏览器中运行 应该就可以对话了！

一般来说aliya的回复速度取决于服务器和deepseek服务器的速度，若是超过半分钟甚至一分钟没有回应就是报错了，可以在浏览器中按下F12 看看控制台的报错，搜索一下是什么意思，有时候可能会有一个跨域问题

最后，本项目并没有完全完成，会有很多bug，并且由于全部服务都是在前端调用，所以不建议将这个项目放在公网上使用或传播，会存在泄露接口、key的风险，如果你是大佬，你可以基于这个项目进行任何二改，但是要遵守开源协议，并标注出处！

最后的最后 感谢各位对我的支持，开学之后我更新的时间会越来越慢！非常抱歉！

#### 贡献
源码：LaoQi(琦同学)
dify提示词原作者：小草_非常生草
教程：LaoQi(琦同学)
