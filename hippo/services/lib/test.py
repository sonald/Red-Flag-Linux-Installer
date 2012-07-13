#!/usr/bin/env python
# simple partition tool with purpose on pyparted testing 

import parted  
import json
import sys
import partedprint

if __name__ == "__main__":
    print partedprint.parted_print(None,True,False)
