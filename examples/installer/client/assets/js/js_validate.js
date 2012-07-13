define(['jquery', 'system', 'locale!client'], function($, nil, i18n) {
    'use strict';

    var errors = {
        'required': i18n.gettext('<b>This field is required. </b>'),
        'alphanum': i18n.gettext('<b>Only letters, numbers, and underscores.</b>'),
        'maxlen': i18n.gettext('<b>Please enter no more than %d characters.</b>'),
        'minlen': i18n.gettext('<b>Please enter at least %d characters.</b>'),
        'confirm': i18n.gettext('<b>Please enter the same content again.</b>'),
    };


    var validate = {
        result : true,
        required: function(){
            var that = this;
            $('.js-required').each( function(){
                if( $(this).attr('value') === ""){
                    $(this).after(errors['required']);
                    that.result = false;
                };
            });
        },
        alphanum: function(){
            var that = this;
            $('.js-alphanum').each( function(){
                var str = $(this).attr('value');
                if( str === ""){
                    $(this).after(errors['required']);
                    that.result = false;
                }else if( str.match(/^[1-9a-zA-Z_]+$/g) === null){
                    $(this).after(errors['alphanum']);
                    that.result = false;
                };
            });
        },
        maxlength: function(){
            var that = this;
            $('.js-required[maxlength]').each( function(){
                var maxlength = $(this).attr('maxlength') * 1;
                if( $(this).attr('value') && maxlength < $(this).attr('value').length ){
                    $(this).after(i18n.sprintf(errors['maxlen'], maxlength));
                    that.result = false;
                };
            });
        },
        minlength: function(){
            var that = this;
            $('.js-required[minlength]').each( function(){
                var minlength = $(this).attr('minlength') * 1;
                if( $(this).attr('value') && minlength > $(this).attr('value').length ){
                    $(this).after(i18n.sprintf(errors['minlen'], minlength));
                    that.result = false;
                };
            });
        },
        execu: function(){
            this.required();
            this.alphanum();
            this.maxlength();
            this.minlength();
            this.confirm();
        },
        confirm: function(){
            var that = this;
            $('.js-confirm').each(function () {
                var id = $(this).attr("confirm-data");
                var data = $(this).attr("value");
                if ($("#"+id).attr("value") &&
                    $("#"+id).attr("value") !== data ){
                    $(this).after(errors['confirm']);
                    that.result = false;
                };
            });
        }
    };

    return validate;
});
