/*
 * =====================================================================================
 *
 *       Filename:  locale.js
 *
 *    Description:   require plugin to load client-side translation
 *
 *        Version:  1.0
 *        Created:  2012年07月10日 11时45分43秒
 *       Revision:  none
 *       Compiler:  gcc
 *
 *         Author:  Sian Cao (sonald), yinshuiboy@gmail.com
 *        Company:  Red Flag Linux Co. Ltd
 *
 * =====================================================================================
*/

/*jslint regexp: true */
/*global require: false, navigator: false, define: false, console:false */

(function() {
    'use strict';

    define(['system', 'jed'], {
	load: function(name, req, load, config) {
	    console.log('load client locale data');

	    var match, lang;

	    if (window.location.search.length > 0) {
		match = /\?locale=([^=]+)/.exec(window.location.search);
		if (match) {
		    lang = match[1];
	            match = /([^_]+)(?:_([^-]+))?/.exec(lang);
                    lang = (match && match[1]) || 'en';
		}

	    } else {
		lang = navigator.language || navigator.userLanguage;
	        match = /([^-]+)(?:-([^-]+))?/.exec(lang);
                lang = (match && match[1]) || 'en';
	    }

            lang = lang || 'en';
            if (lang === 'POSIX' || lang === 'C') {
                lang = 'en';
            }

            config.locale = lang;
	    console.log('config: ', config);
	    req(['jed', '../locales/' + name + '.' + config.locale], function(Jed, value) {

		//console.log(value);
		load(new Jed({
		    'domain': config.locale,
		    'locale_data': value
		}));
	    });
	}
    });
}());
