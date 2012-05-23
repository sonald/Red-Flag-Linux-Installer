<center>Hippo 1.0 需求及原型设计</center>
==

简介
---
hippo的目标是提供一个web app应用开发框架。hippo 1.0提供的应该是一个类似中间件的服务，
可以完全分离前后端开发。

 - hippo后端是一个多server聚合的结构，以nodejs的一个web框架为基础，支持从主server fork
独立的子server（一个socket.io的服务器）来提供有持久需求的模块的运行环境。
每个服务为一个node模块。每个模块有一个描述文件，
表明提供了那些功能（函数）。以及一些可以被监听的消息（socket.io消息），比如说系统安装进度，
软件包安装进度等消息。以及决定是否要在独立server中运行的选项。

 - 前端开发应该只需要js，css和html知识。前端开发时看到的所有服务都以javascript API 形式存在，
或者是一个统一的调用接口。

比如：

    hippo.loadServices(['partition', 'user']);
    var serv = hippo.getService('partition');
    console.log(serv.inspect()); // print all functions by service
    
    // use uniform way to call remote function and listen for msg
    serv.call('getPartitionList', {path: '/dev/sda'}, function(data) {
        myapp.render(data);
    });
    // monitor msg for service's msg
    serv.on('progress', function(progress) {
        myapp.$('div#progress').attr('value', progress);
    });

如上描述，hippo可以方便的查找和载入模块，并且自动导出模块提供的所有函数。并且在前端
有一个简单的hippo.js文件来提供访问这些服务的方法。

结构设计
---
hippo的基础是一个web服务器，基于nodejs，在此基础上为以上的目标编写一个
封装层，封装层的工作是加载所有服务，绑定url，绑定socket.io的url，读取服务功能和消息列表。

然后还有一个hippo.js作为前端开发的基础。可以用来简化服务查询，消息绑定，建立socket.io
通道，调用后端服务函数等工作，

并且提供方法可以建立boilerplate，快速部署，hippo用户可以在此基础上做前端或后端开发。

问题和难点
---
由于web server本身的架构，每个url请求都会创建一个服务的实例去处理，当需要保留中间结果时
就会遇到问题，比如分区服务，在提交之前，每次创建分区的请求应该要保留状态，以便可以连续
操作。又比如安装软件，前端需要知道当前是否有操作在进行，是否可以并行下载等，安装服务以
独立的非web服务存在是必须的。
鉴于以上的理由，后端的结构可能是有多个server在运行，类似以上这种服务以独立的
进程存在（监听不同的端口），nodejs对于在一个js文件里开启多个server非常容易，
所以可能更适合这个目标。

选型
----
为了达到以上的目标和解决问题，已经测试过或者可以选择的框架大致有：

* web.py  缺点是过于简单，websocket支持不好，要做的工作比较多。
* tornado(+tornadio2)  成熟的web server框架，有支持url分派的socket.io实现，好处是可以直接调用python
接口的分区库。由于上述提到的问题，分区库可能作为单独的server运行比较合适。
* nodejs上的框架 如果选择多server并行的模型，nodejs比较容易管理多server，而且前后端很多代码可以复用
（具体没有实践过）。
    * socketstream 目标是实时single-page web app。在github上比较流行（follow 1000多）。可以和express.js
以及
    * meteor 比较新的框架，目标是实时web app（所以整合了socket.io）。
    * 基于mvc的express.js 这个是成熟的框架，类似ror。

可以借鉴的思路有app.js，其目标是用web技术开发本地app，还有台湾牛人整的轻量非mvc框架redtea的思路，
即客户端可以直接以js api方式调用server端的函数（一种RPC机制）。