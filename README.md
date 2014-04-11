<center>Next gen installer for qomo</center>
============================================

                              __  ___                 
                             / / / (_)___  ____  ____ 
                            / /_/ / / __ \/ __ \/ __ \
                           / __  / / /_/ / /_/ / /_/ /
                          /_/ /_/_/ .___/ .___/\____/ 
                                 /_/   /_/            
              ______                                             __  
             / ____/________ _____ ___  ___ _      ______  _____/ /__
            / /_  / ___/ __ `/ __ `__ \/ _ \ | /| / / __ \/ ___/ //_/
           / __/ / /  / /_/ / / / / / /  __/ |/ |/ / /_/ / /  / ,<   
          /_/   /_/   \__,_/_/ /_/ /_/\___/|__/|__/\____/_/  /_/|_|  


<br>
Hippo is a framework for writting desktop app by utilizing web tech, and a new installer based on hippo for Qomo resides in examples/installer. hippo can be installed and used as a normal npm module.


## Dependence for ArchLinux

```
sudo yaourt -S nodejs8 python2-gevent-socketio
sudo pacman -S python2-gevent
sudo pkill node
sudo rm /var/run/qomo-installer.pid
```


Install and testing
-----
```
git clone https://github.com/sonald/Red-Flag-Linux-Installer.git 
cd hippo
npm install
```
**Note:** right now it only works on node v0.8, node v10.0 is not supported yet.
 
and then generate a new project

```
./bin/hippo -b new a_new_project_name
```

there are already a few projects maintained in the examples directory. *examples/installer* is actually the Qomo Installer based on hippo. see readme in [examples/installer][] for details of how to bootstrap installer itself.

Roadmap
-------

### 1.0

1.0 is targetting installer only, and try to consolidate a framework
that can be easily applied to ther projects.

the big picture of the framework is as following:
each component in hippo (e.g partitioning, package installing...) 
provides a REST API, after service started, a websocket connection is 
used to push state information (e.g. for partitioning, that is progress
report).

data transformed between B/S is JSON over http or websocket.
server is written based on [tornado][0], facebook's web app framework.
the documentation is [here][1].

### 2.0

hippo is totally seprated into two parts. first is a webapp framework 
consolidated from 1.0. and second is a complete installer based on that
framework, and capable of extending.

--
if you got any problems with Hippo, 
Contact Authors: [Sian Cao](mailto:yinshuiboy@gmail.com),
 [SSW](mailto:shensuwen@redflag-linux.com)

[0]: https://github.com/facebook/tornado/
[1]: http://www.tornadoweb.org/documentation/index.html
