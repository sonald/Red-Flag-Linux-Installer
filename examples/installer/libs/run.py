#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import getopt

from PyQt4 import QtCore, QtGui
from httpWidget import Ui_HttpWidget

class httpWidget(QtGui.QWidget):
    def __init__(self, url, parent=None):
        super(httpWidget, self).__init__(parent)
        self.ui = Ui_HttpWidget()
        self.ui.setupUi(self)
    
        # set margins
        l = self.layout()
        l.setMargin(0)
    
        # set the default
        self.ui.webView.setUrl(QtCore.QUrl(url))
    
        QtCore.QObject.connect(self.ui.webView,QtCore.SIGNAL("linkClicked (const QUrl&)"), self.link_clicked)
        QtCore.QObject.connect(self.ui.webView,QtCore.SIGNAL("urlChanged (const QUrl&)"), self.link_clicked)
        QtCore.QObject.connect(self.ui.webView,QtCore.SIGNAL("titleChanged (const QString&)"), self.title_changed)
        QtCore.QMetaObject.connectSlotsByName(self)

    def url_changed(self):
	      """
	      Url have been changed by user
	      """
	      page = self.ui.webView.page()
	      self.ui.webView.setUrl(QtCore.QUrl(url))

    def title_changed(self, title):
	      """
        Web page title changed - change the tab name
	      """
	      self.setWindowTitle(title)
	
    def reload_page(self):
	      """
	      Reload the web page
	      """
	      self.ui.webView.setUrl(QtCore.QUrl(self.ui.url.text()))
	
    def link_clicked(self, url):
	      """
	      Update the URL if a link on a web page is clicked
	      """
	      page = self.ui.webView.page()
	
if __name__ == "__main__":
    try: 
        opts, args = getopt.getopt(sys.argv[1:],"")
    except getopt.GetoptError:
        sys.exit(2)
    url = args[0]
    app = QtGui.QApplication(sys.argv)
    myapp = httpWidget(url)
    myapp.setFixedSize(800, 600)
    myapp.show()
    sys.exit(app.exec_())
