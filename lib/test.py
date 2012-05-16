#!/usr/bin/env python
# simple partition tool with purpose on pyparted testing 

import parted  
import json
import sys
import partedhelper

if __name__ == "__main__":
    data = sys.stdin.read()
    obj = partedhelper.PartedHelper(data)
    print obj.execute()
