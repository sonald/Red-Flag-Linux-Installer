<center>Hippo 1.0 需求及原型设计</center>
==

安装环境
--------
Hippo 1.0所在的基础环境应该是qomo 4.x的livecd环境。

1.0需求
-------
1.0版本的设计具体要求如下：

* UI定制硬盘分区策略（目前支持msdos分区表）
* 提供安装后脚本执行能力（在chroot环境下运行）

基本设计和技术路线
--------
1.0设计比较简单，基本结构是B/S。

+ 前端显示是WebView，使用backbone框架编写
+ 后端采用python的tornado框架编写，提供分区、添加用户、执行后期脚本以及数据
  解压功能。
+ 安装程序中的每一个模块都是一个REST API，B/S之间通讯基于http和websocket协议，
  传输JSON格式的数据。http用来请求服务和发送数据。websocket协议用来推送服务
  信息（比如进度提示等）

### 分区服务的JSON数据格式暂定为：

    [ 
        { action: "name", args: [] },
    ]

例如：

    [ 
        {
            action: 'mklabel', 
            args: [ 'msdos' ] 
        },
        {
            action: 'mkpart',
            args: [ 
                'primary',
                'ext3',
                '0%',
                '20%' 
            ] 
        }
    ]

即一组操作的序列，如果执行出错要返回一个代表错误的JSON对象，最好能反映出错误
的原因和语句，例如：

    { 
        reason: "need root for operation"
    }



### 问题
1. 找一个backbone或JS的测试框架，前后端都要测试
