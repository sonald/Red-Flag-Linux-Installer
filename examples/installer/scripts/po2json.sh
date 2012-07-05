#!/bin/bash
# plz run it at root of installer project

localedir=client/assets/locales
for lang in `find $localedir -type f -name "*.po"`; do
    locale=`basename $lang .po`
    locale_data=$localedir/client.$locale.js
    echo 'define(' > $locale_data
    ./scripts/po2json.js -p $localedir/$locale.po >> $locale_data
    echo ')' >> $locale_data
done
