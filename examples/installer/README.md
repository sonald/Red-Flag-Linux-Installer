Pangu Installer
---

          ____                             ____           __        ____         
         / __ \____ _____  ____ ___  __   /  _/___  _____/ /_____ _/ / /__  _____
        / /_/ / __ `/ __ \/ __ `/ / / /   / // __ \/ ___/ __/ __ `/ / / _ \/ ___/
       / ____/ /_/ / / / / /_/ / /_/ /  _/ // / / (__  ) /_/ /_/ / / /  __/ /    
      /_/    \__,_/_/ /_/\__, /\__,_/  /___/_/ /_/____/\__/\__,_/_/_/\___/_/     
                        /____/                                                   


This is a rewritten installer for the new qomo systems.

Usage
===
Right now there is no simple way to package all thing together, so you need to do 
something yourself for using it.

git clone the project, and
run `node app.js` inside the installer project root.
open up a modern web browser (by modern I means no IE6, and support basic html5),
and enter `http://127.0.0.1:8080/` in the url bar. there you go.

Design
===
The installer is completed rewritten with modern web technoledge, powered by [Nodejs][1].
the whole logical is basically server side javascript. and UI is rendered using HTML.

Requirement
===
It requires **Hippo** to run, which is a realtime web app framework. It has some other 
dependencies right now. python2-tornado and python2-tornadio2 is for external service
socket.io communication.


[1]: nodejs.org
