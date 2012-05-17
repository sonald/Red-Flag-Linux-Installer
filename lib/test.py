#!/usr/bin/env python
# simple partition tool with purpose on pyparted testing 

import parted  
import json
import sys
import partedhelper
import partedprint

if __name__ == "__main__":
    data = sys.stdin.read()
    obj = partedhelper.PartedHelper(data)
    print obj.execute()
    print partedprint.parted_print(None,True,True)
