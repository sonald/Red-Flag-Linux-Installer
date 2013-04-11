#!/usr/bin/env python2

import os
import sys
import dbus

from PyQt4.QtCore import *
from PyQt4.QtGui import *
from PyQt4.QtWebKit import *

from webpage import WebPage

class Installer(QObject):
    @pyqtSlot()
    def closeInstaller(self):
        sys.exit(0)

    @pyqtSlot(str)
    def reboot(self,msg):
        msg = str(msg)
        desktop_os = 'kde'
        msg_tag = {'reboot':{
                        'method':1,
                        'shell': "sudo reboot"
                        },
                    'shutdown':{
                        'method':2,
                        'shell': "sudo shutdown -P now"
                        }
                  }
        bus = dbus.SessionBus()
        args = ['org.kde.ksmserver', 'org.gnome.SessionManager']
        for arg in args:
            if arg in bus.list_names() and arg.find('kde') < 0:
                desktop_os = 'gnome'
        if desktop_os == 'kde':
            proxy = bus.get_object('org.kde.ksmserver', '/KSMServer')
            if msg == "reboot" or msg == "shutdown":
                try:
                    proxy.logout(0, msg_tag[msg]['method'],0,timeout=30)
                except Exception, e:
                    os.system(msg_tag[msg]['shell'])
        else:
            proxy = bus.get_object('org.gnome.SessionManager','/org/gnome/SessionManager')
            if msg == "reboot" or msg == "shutdown":
                try:
                    proxy.Shutdown(timeout=30)
                except Exception, e:
                    os.system(msg_tag[msg]['shell'])
        sys.exit(0)

class Window(QWidget):
    def __init__(self):
        super(Window, self).__init__()
        self.setWindowFlags(self.windowFlags() & ~Qt.WindowCloseButtonHint)
        #self.setWindowFlags(self.windowFlags() & ~Qt.WindowMaximizeButtonHint)
        self.view = QWebView(self)
        self.view.page().settings().setAttribute(QWebSettings.JavascriptCanCloseWindows, True)
        self.installer = Installer()
        QObject.connect(self.view.page().mainFrame(),SIGNAL("javaScriptWindowObjectCleared ()"), self.reload_js)
        self.setWindowIcon(QIcon("/usr/share/icons/installer-logo"))

        #self.view.page().mainFrame().addToJavaScriptWindowObject("installer", installer)
        self.setupInspector()

        self.splitter = QSplitter(self)
        self.splitter.setOrientation(Qt.Vertical)
        self.setWindowTitle("Qomo Installer")
        if os.path.exists('/etc/qomo-release') is False:
            self.setWindowTitle("inWise Installer")

        layout = QVBoxLayout(self)
        layout.setMargin(0)
        layout.addWidget(self.splitter)

        self.splitter.addWidget(self.view)
        self.splitter.addWidget(self.webInspector)

        page = self.view.page()
        page.action(page.Reload).setVisible(False)
        page.action(page.Back).setVisible(False)
        page.action(page.Forward).setVisible(False)

    def setupInspector(self):
        page = self.view.page()
        page.settings().setAttribute(QWebSettings.DeveloperExtrasEnabled, True)
        self.webInspector = QWebInspector(self)
        self.webInspector.setPage(page)
        page.action(page.InspectElement).setVisible(False)

        shortcut = QShortcut(self)
        shortcut.setKey(Qt.CTRL+Qt.SHIFT+Qt.Key_I)
        shortcut.activated.connect(self.toggleInspector)
        self.webInspector.setVisible(False)

    def toggleInspector(self):
        self.webInspector.setVisible(not self.webInspector.isVisible())

    def reload_js(self):
        self.view.page().mainFrame().addToJavaScriptWindowObject("installer", self.installer)
        self.view.page().history().clear()#clear backspace 


def main():
    app = QApplication(sys.argv)
    window = Window()
    screen = QDesktopWidget().screenGeometry()
    url = sys.argv[1]
    url = QUrl(url)
    window.resize(1024,576)
    p = window.pos()
    p.setY((screen.height()-window.height())/2)
    p.setX((screen.width()-window.width())/2)
    window.move(p)
    window.show()
    window.view.setUrl(url)
    app.exec_()

if __name__ == "__main__":
    main()
