#!/usr/bin/env python
# simple partition tool with purpose on pyparted testing 

import parted  
import json
import sys
import jsondisk

if __name__ == "__main__":
    data = sys.stdin.read()
    obj = jsondisk.Parted_by_json(data)
    print obj.execute()
