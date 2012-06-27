define(['jquery', 'system', 'jade'], function($) {

    console.log("jsvalidate");
    var validate = {
        result : true,
        required: function(){
            var self = this;
            $('.js-required').each( function(){
                if( $(this).attr('value') === ""){
                    $(this).after('<b>This field is required. </b>');
                    self.result = false;
                };
            });
        },
        alphanum: function(){
            var self = this;
            $('.js-alphanum').each( function(){
                var str = $(this).attr('value');
                if( str === ""){
                    $(this).after('<b>This field is required. </b>');
                    self.result = false;
                }else if( str.match(/^[1-9a-zA-Z_]+$/g) === null){
                    $(this).after('<b>Only letters, numbers, and underscores.</b>');
                    self.result = false;
                };
            });
        },
        maxlength: function(){
            $('.js-required[maxlength]').each( function(){
                var maxlength = $(this).attr('maxlength') * 1;
                if( $(this).attr('value') && maxlength < $(this).attr('value').length ){
                    $(this).after('<b>Please enter no more than '+ maxlength +' characters.</b>');
                    self.result = false;
                };
            });
        },
        minlength: function(){
            $('.js-required[minlength]').each( function(){
                var minlength = $(this).attr('minlength') * 1;
                if( $(this).attr('value') && minlength > $(this).attr('value').length ){
                    $(this).after('<b>Please enter at least '+ minlength +' characters.</b>');
                    self.result = false;
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
