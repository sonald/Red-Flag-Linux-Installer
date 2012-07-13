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

define('i18n', ['system', 'locale!client'], function(system, locale_obj) {
    console.log('defining i18n');
    return locale_obj;
});
