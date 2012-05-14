#!/usr/bin/env python
# facade of hippo installer

import os
import sys
import getopt

class Log:
    """ simple logger """

    singleton = None
    @classmethod
    def instance(cls):
        if not cls.singleton:
            cls.singleton = cls()
        return cls.singleton

    def _log(self, *args):
        for arg in args:
            print >> sys.stderr, arg,

    def debug(self, *args):
        self._log("[DEBUG]", *args)

    def info(self, *args):
        self._log("[INFO]", *args)

    def error(self, *args):
        self._log(*args)
        sys.exit(1)

def usage():
    print >> sys.stderr, "%s: [OPTION]..." % (sys.argv[0], )
    print >> sys.stderr, "\t-h, --help dump this"
    print >> sys.stderr, "\t-p, --port specify server port"
    print >> sys.stderr, "\t-s runs only server, so if you need to interact with hippo, "
    print >> sys.stderr, "\t\tstart a webkit frontend yourself"
    sys.exit(1)

if __name__ == "__main__":
    try:
        opts, args = getopt.getopt(sys.argv[1:], "hp:s", ["help", "port=", ""])
    except getopt.GetoptError, e:
        print e
        usage()

    logger = Log.instance()
    if os.getuid() != 0:
        logger.debug("need root to run", "this app", "\n")

    for optind, optarg in opts:
        print optind + ':' + optarg
        if optind in ['-h', '--help']:
            usage()

    try:
        ret = os.fork()
        if ret == 0: 
            # child
            os.execlp("server/server.py", "hipposerver")
        else:
            # fork frontend
            #os.execv("/usr/bin/chromium-browser", ['--app="http://127.0.0.1:8080/hippo"'])
            os.system('chromium-browser --app="http://127.0.0.1:8080/hippo" --incognito')
    except OSError:
        pass

