#!/bin/bash

# syntax:
# extract-po.sh

# No -j on first line, to clear out .pot file (Issue#1170)

# messages.po is server side strings
#xgettext  --keyword=_ -L Perl --output-dir=locale/templates/LC_MESSAGES --from-code=utf-8 --output=messages.pot\

# client.po 
# js
localedir=client/assets/locales
xgettext -L Perl --output-dir=$localedir --from-code=utf-8 --output=client.pot\
 `find client/views/ -name '*.jade' `

xgettext -j -L Perl --output-dir=$localedir --from-code=utf-8 --output=client.pot\
 client/assets/app.js `find client/assets/js/ -name '*.js' | grep -v 'i18n.js' | grep -v 'gettext.js' `


