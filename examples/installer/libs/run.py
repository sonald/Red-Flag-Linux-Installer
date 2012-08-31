#!/usr/bin/env python2

import os
import sys

from PyQt4.QtCore import *
from PyQt4.QtGui import *
from PyQt4.QtWebKit import *

from webpage import WebPage

class Installer(QObject):
    @pyqtSlot()
    def closeInstaller(self):
        sys.exit(0)

class Window(QWidget):
    def __init__(self):
        super(Window, self).__init__()
        # self.setWindowFlags(Qt.FramelessWindowHint)
        self.view = QWebView(self)
        self.view.page().settings().setAttribute(QWebSettings.JavascriptCanCloseWindows, True)
        QObject.connect(self.view.page().mainFrame(),SIGNAL("javaScriptWindowObjectCleared ()"), self.reload_js)

        installer = Installer()
        self.view.page().mainFrame().addToJavaScriptWindowObject("installer", installer)
        self.setupInspector()

        self.splitter = QSplitter(self)
        self.splitter.setOrientation(Qt.Vertical)
        self.setWindowTitle("Qomo Installer")

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
