<center>Hippo 1.0 需求及原型设计</center>
==

简介
---
hippo的目标是提供一个web app应用开发框架。hippo 1.0提供的应该是一个类似中间件的服务，
可以完全分离前后端开发。

 - 后端的开发以python语言编写的服务为开发单位，每个服务有一个描述文件，表明提供了那些功能。
以及一些可以被监听的消息（socket.io消息），比如说系统安装进度，软件包安装进度等消息。后端
开发需要理解tornado web框架的设计思路和tornadio2的用法。熟悉python，可以编写python模块。

 - 前端开发应该只需要js，css和html知识。前端开发时看到的所有服务都以javascript API 形式存在，或者是一个统一的调用接口，

比如：

    hippo.loadServices();
    var serv = hippo.getService('partition');
    console.log(serv.inspect()); // print all functions by service
    serv.getAllDevices(); // js api form of calling
    // or stand ajax style of calling
    serv.get(serv.url, {cmd: 'getAllDevices'}, function(data) {
        myapp.render(data);
    });
    // monitor msg for service's socket.io connection
    serv.on('progress', function(progress) {
        myapp.$('div#progress').attr('value', progress);
    });

如上描述，hippo可以方便的查找和载入模块，并且自动导出模块提供的所有函数。并且在前端
有一个简单的hippo.js文件来提供访问这些服务的方法。

结构设计
---
hippo的基础是一个web服务器，目前是基于python的tornado，在此基础上为以上的目标编写一个
封装层，封装层的工作是加载所有服务，绑定url，绑定socket.io的url，读取服务功能和消息列表。

然后还有一个hippo.js作为前端开发的基础。可以用来简化服务查询，消息绑定，建立socket.io
通道，调用后端服务函数等工作，

并且提供方法可以立即部署（无需安装，自动启动后台web服务和index.html），hippo用
户可以在此基础上做前端或后端开发。