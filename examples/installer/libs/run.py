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
        desktop_os = 'kde'
        bus = dbus.SessionBus()
        args = ['org.kde.ksmserver', 'org.gnome.SessionManager']
        for arg in args:
            if arg in bus.list_names() and arg.find('kde') < 0:
                desktop_os = 'gnome'
        if desktop_os == 'kde':
            proxy = bus.get_object('org.kde.ksmserver', '/KSMServer')
            if msg == "reboot":
                proxy.logout(0,1,1)
            elif msg == "shutdown":
                proxy.logout(0,2,0)
        else:
            proxy = bus.get_object('org.gnome.SessionManager','/org/gnome/SessionManager')
            if msg == "reboot" or msg == "shutdown":
                proxy.Shutdown()
        sys.exit(0)

class Window(QWidget):
    def __init__(self):
        super(Window, self).__init__()
        self.setWindowFlags(self.windowFlags() & ~Qt.WindowCloseButtonHint)
        #self.setWindowFlags(self.windowFlags() & ~Qt.WindowMaximizeButtonHint)
        self.view = QWebView(self)
        self.view.page().settings().setAttribute(QWebSettings.JavascriptCanCloseWindows, True)
        QObject.connect(self.view.page().mainFrame(),SIGNAL("javaScriptWindowObjectCleared ()"), self.reload_js)

        installer = Installer()
        self.view.page().mainFrame().addToJavaScriptWindowObject("installer", installer)
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
        installer = Installer()
        self.view.page().mainFrame().addToJavaScriptWindowObject("installer", installer)
        self.view.page().history().clear()#clear backspace 


def main():
    app = QApplication(sys.argv)
    window = Window()
    url = sys.argv[1]
    url = QUrl(url)
    window.resize(1024,576)
    window.show()
    window.view.setUrl(url)
    app.exec_()

if __name__ == "__main__":
    main()
