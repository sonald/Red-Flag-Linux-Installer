define(['jquery', 'system', 'i18n', 'easy_part', 'fd_part', 'ad_part'], 
       function($, _system, i18n, easyPage, fdPage, adPage) {
    'use strict';

    var pageCache;
    console.log('load partition');
    var page = {
        view: '#part_tmpl',
        locals: null,
        app: null,
        $el: null,
         
        // do initialization, called when loading the page
        initialize: function(app, reinit, callback) {
            var that = this;
            that.app = app;
            that.app.userData["install"] = {};
            that.locals = {
                'disks':null,
                gettext:function(msgid){ return i18n.gettext(msgid);}
            }
            pageCache = undefined;
            callback();
            console.log('part initialized');
        },

        getparts: function(callback){
            var that = this;
            window.apis.services.partition.reset(function(result) {
                if(result.status === "success"){
                    window.apis.services.partition.getPartitions(function(disks) {
                        that.locals["disks"] = disks;
                        callback();
                    });
                }else if(result.status === "failure"){
                    console.log(result);
                }else{
                    console.log("data error");
                };
            });
        },

        // compile and return page partial
        loadView: function() {
            if (typeof pageCache === 'undefined') {
                pageCache = (jade.compile($(this.view)[0].innerHTML))();
            }
            return pageCache;
        },

        postSetup: function() {
            this.$el = $("#part_content");
            $('body').off('click','#easy');
            $('body').off('click','#fulldisk');
            $('body').off('click','#advanced');

            var that = this;
            $('body').on('click', '#easy', function(){
                that.app.userData.install["installmode"] = "easy";
                that.getparts(function () {
                    that.$el.html( easyPage.loadView(that.locals) );
                    easyPage.postSetup && easyPage.postSetup();
                });
            });

            $('body').on('click', '#fulldisk', function(){
                that.app.userData.install["installmode"] = "fulldisk";
                that.getparts(function () {
                    that.$el.html( fdPage.loadView(that.locals) );
                    fdPage.postSetup && fdPage.postSetup();
                });
            });

            $('body').on('click', '#advanced', function(){
                that.app.userData.install["installmode"] = "advanced";
                that.$el.html( adPage.loadView(that.locals) );
                adPage.postSetup && adPage.postSetup();
            });

            $('#easy').trigger("click");
        },

        rewind: function() {
            //enable backward
            return 
        },

        validate: function(callback) {
        },

        partflesh: function(result){
        },
    };
    return page;
});

