#!/bin/bash

# syntax:
# compile-mo.sh locale-dir/

localedir=client/assets/locales

for lang in `find $localedir -type f -name "*.po"`; do
    dir=`dirname $lang`
    stem=`basename $lang .po`
    msgmerge -o ${dir}/${stem}.po.tmp ${dir}/${stem}.po ${dir}/client.pot
    mv ${dir}/${stem}.po.tmp ${dir}/${stem}.po
done

# Optionally auto-localize our test locale db-LB
if hash podebug >/dev/null 2>&1; then
    for catalog in messages client; do
                                                                                                         
        echo "Translating ${catalog}.po"
        podebug --rewrite=flipped -i locale/templates/LC_MESSAGES/${catalog}.pot\
               -o locale/db_LB/LC_MESSAGES/${catalog}.po
    done  
else
  echo 'Skipping db-LB, install translate-toolkit if you want to have that up-to-date.'
fi
