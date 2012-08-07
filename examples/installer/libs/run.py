#!/usr/bin/env python2
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
        page = self.ui.webView.page()
        page.action(page.Reload).setVisible(False)
        page.action(page.Back).setVisible(False)
        page.action(page.Forward).setVisible(False)
    
        QtCore.QObject.connect( self.ui.webView, QtCore.SIGNAL("titleChanged (const QString&)"), self.title_changed)
        QtCore.QMetaObject.connectSlotsByName(self)

    def title_changed(self, title):
	      """
        Web page title changed - change the tab name
	      """
	      self.setWindowTitle(title)
	
if __name__ == "__main__":
    try: 
        opts, args = getopt.getopt(sys.argv[1:],"")
    except getopt.GetoptError:
        sys.exit(2)
    url = args[0]
    app = QtGui.QApplication(sys.argv)
    myapp = httpWidget(url)
    myapp.show()
    sys.exit(app.exec_())
