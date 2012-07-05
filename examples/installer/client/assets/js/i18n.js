/*
 * =====================================================================================
 *
 *       Filename:  i18n.js
 *
 *    Description:  i18n solution for client-side jade
 *
 *        Version:  1.0
 *        Created:  2012年07月05日 15时05分16秒
 *       Revision:  none
 *       Compiler:  gcc
 *
 *         Author:  Sian Cao (sonald), yinshuiboy@gmail.com
 *        Company:  Red Flag Linux Co. Ltd
 *
 * =====================================================================================
*/

define('i18n', ['system', 'jed', 'client.zh'], function(system, Jed, locale_data) {
    console.log('defining i18n');
    //console.log(locale_data);
    
    return new Jed({
        "domain": 'zh',
        'locale_data': locale_data
    });
});
