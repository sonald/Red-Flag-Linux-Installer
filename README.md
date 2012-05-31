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
Hippo is a new installer for Qomo, featuring HTML5 and tornado.
By utilizing web tech, hippo will present user a whole new UX.

Install and testing
-----
```
git clone git@172.16.82.249:hippo.git 
cd hippo
./hippo.py
```
that will try to spawn server in the background and popup a 
chromium web browser as frontend, right now 
chromium is used as prototype usage, will be replaced later with own 
webkit frontend.

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
Contact Authors: [Sian Cao](mailto:sycao@redflag-linux.com),
 [SSW](mailto:shensuwen@redflag-linux.com)

[0]: https://github.com/facebook/tornado/
[1]: http://www.tornadoweb.org/documentation/index.html
