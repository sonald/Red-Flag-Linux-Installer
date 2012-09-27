define(['jquery','system', 'i18n', 'remote_part', 'easy_part', 'fd_part', 'ad_part'],
       function ($, _system, i18n, Rpart, easyPage, fdPage, adPage) {
    'use strict';

    var pageCache;
    console.log('load partition');
    var page = {
        name: i18n.gettext('Partition'),
        view: '#part_tmpl',
        locals: null,
        app: null,
        $el: null,
        method: {
            "easy": easyPage,
            "fulldisk": fdPage,
            "advanced": adPage,
        },

        // do initialization, called when loading the page
        initialize: function(app, reinit, callback) {
            var that = this;
            that.app = app;
            that.locals = {
                'disks':null,
                gettext:function(msgid){ return i18n.gettext(msgid);}
            };
            pageCache = undefined;
            window.apis.services.install.installMedia(function(data){
                that.app.options["iso"] = data;
                that.locals["iso"] = data;
                callback();
                console.log('part initialized');
            });
        },

        getparts: function(load_parts){
            var that = this;
            Rpart.method('reset',that.app.options.iso, [], function (result, disks) {
                that.app.resetDatas();
                that.locals.disks = that.app.options.disks = disks;
                load_parts();
            });
        },

        // compile and return page partial
        loadView: function() {
            this.locals = this.locals || {};
            if (typeof pageCache === 'undefined') {
                pageCache = (jade.compile($(this.view)[0].innerHTML))(this.locals);
            }
            return pageCache;
        },

        postSetup: function() {
            $('body').off('click','ul#PartTabs li a');
            this.$el = $("#part_content");

            var that = this;
            $('body').on('click', 'ul#PartTabs li a', function(){
                var $this = $(this);
                var partial_page = that.method[$this.attr("id")];
                that.getparts(function () {
                    $('#myconfirm').find('.modal-body p.warning').remove();
                    partial_page.initialize(that.app.options, that.locals, that.app.myalert);
                    that.$el.html( partial_page.loadView() );
                    partial_page.postSetup && partial_page.postSetup();
                });
            });
            $('ul#PartTabs li a#easy').trigger("click");
        },

        validate: function(callback) {
            var that = this;
            var page_id = $('ul#PartTabs').find('li.active a').attr("id");
            $('#myconfirm').off('click', '.js-confirm');
            that.method[page_id].validate(callback);
            console.log(that.app.options);
        },
    };
    return page;
});

