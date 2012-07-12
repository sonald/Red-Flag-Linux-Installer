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

For simplicity, you can also run `./bootstrap.js` which will try to sudo run app server and
launch a webkit frontend for you.

Design
===
The installer is completed rewritten with modern web technoledge, powered by [Nodejs][1].
the whole logical is basically server side javascript. and UI is rendered using HTML.

### L10n
browser-side pages translation copied idea and tools from [browserid][2]. server-side
pages translation are using [node-i18n][3] module.

#### howto
* for server-side jade, after running node, hippo will automatically extract and
upate all .json translation files. you just need to translate all keys that
does not translated yet.


* for client-side jade, run following scripts sequencially at root of project:
    - `./scripts/extract_po.sh` to extract translations from jades as well as js files
    - `./scripts/merge_po.sh` to merge newly pot file into current translated po files
    - use translation tool such as linguish to do translation
    - `./scripts/po2json.sh` to convert po to json files but with suffix '.js' and defined as AMD modules.

* dynamically change locale on page
    <br>
    use url query string and url redirection to control locale switching on client-side.
    type url like `http://ip:port?lang=zh` tells hippo to serve zh-CN pages.

Requirement
===
It requires **Hippo** to run, which is a realtime web app framework. It has some other
dependencies right now. python2-tornado and python2-tornadio2 is for external service
socket.io communication.


[1]: nodejs.org
[2]: https://github.com/mozilla/browserid
[3]: http://github.com/mashpie/i18n-node
