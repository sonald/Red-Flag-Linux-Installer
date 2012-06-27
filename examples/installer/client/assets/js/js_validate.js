define(['jquery', 'system', 'jade'], function($) {
    'use strict';

    var validate = {
        result : true,
        required: function(){
            var that = this;
            $('.js-required').each( function(){
                if( $(this).attr('value') === ""){
                    $(this).after('<b>This field is required. </b>');
                    that.result = false;
                };
            });
        },
        alphanum: function(){
            var that = this;
            $('.js-alphanum').each( function(){
                var str = $(this).attr('value');
                if( str === ""){
                    $(this).after('<b>This field is required. </b>');
                    that.result = false;
                }else if( str.match(/^[1-9a-zA-Z_]+$/g) === null){
                    $(this).after('<b>Only letters, numbers, and underscores.</b>');
                    that.result = false;
                };
            });
        },
        maxlength: function(){
            var that = this;
            $('.js-required[maxlength]').each( function(){
                var maxlength = $(this).attr('maxlength') * 1;
                if( $(this).attr('value') && maxlength < $(this).attr('value').length ){
                    $(this).after('<b>Please enter no more than '+ maxlength +' characters.</b>');
                    that.result = false;
                };
            });
        },
        minlength: function(){
            var that = this;
            $('.js-required[minlength]').each( function(){
                var minlength = $(this).attr('minlength') * 1;
                if( $(this).attr('value') && minlength > $(this).attr('value').length ){
                    $(this).after('<b>Please enter at least '+ minlength +' characters.</b>');
                    that.result = false;
                };
            });
        },
        execu: function(){
            this.required();
            this.alphanum();
            this.maxlength();
            this.minlength();
        },
    };

    return validate;
});
