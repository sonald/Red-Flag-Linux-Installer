define(['jquery','system', 'i18n', 'easy_part', 'fd_part', 'ad_part'],
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
                    that.app.resetDatas();
                    window.apis.services.partition.getPartitions(function(disks) {
                        that.locals["disks"] = disks;
                        that.app.options.disks = disks;
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
                that.getparts(function () {
                    easyPage.initialize(that.app, that.locals);
                    that.$el.html( easyPage.loadView() );
                    easyPage.postSetup && easyPage.postSetup();
                });
            });

            $('body').on('click', '#fulldisk', function(){
                that.getparts(function () {
                    fdPage.initialize(that.app, that.locals);
                    that.$el.html( fdPage.loadView() );
                    fdPage.postSetup && fdPage.postSetup();
                });
            });

            $('body').on('click', '#advanced', function(){
                adPage.initialize(that.app, that.locals);
                that.$el.html( adPage.loadView());
                adPage.postSetup && adPage.postSetup();
            });

            $('#easy').trigger("click");
        },

        rewind: function() {
            //enable backward
            return true;
        },

        validate: function(callback) {
            var that = this;
            if (that.$el.has("#easy_part_table").length > 0) {
                var $selected = that.$el.find('ul.select');//TODO
                var pnum = $selected.attr("pnum");
                var dnum = $selected.parents('ul.disk').attr("dnum");
                var part = that.app.options.disks[dnum].table[pnum];
                part["dirty"] = true;
                part["mountpoint"] = "/";
                part.fs = "ext4";
                callback();
            }else if (that.$el.has("#fulldisk_part_table").length > 0) {
                var $selected = that.$el.find('ul.select');//TODO
                var dnum=$selected.attr("dnum");
                var disk = that.app.options.disks[dnum];
                var devpath = disk["path"];
                window.apis.services.partition.FulldiskHandler(devpath, function (results) {
                    if (results.status && results.status == "failure") {
                        console.log(results);
                    }else{
                        that.locals["disks"] = results;
                        that.app.options.disks = results;
                        var dnums = results.length;
                        var i = 0;
                        for (i=0; i<dnums; i++){
                            if (results[i]["path"] === devpath){
                                var j =0;
                                var parts = results[i]["table"];
                                for (j =0; j< parts.length; j++){
                                    if (parts[j]["number"] != -1){
                                        parts[j]["dirty"] = true;
                                        if (parts[j].size > 6){
                                            parts[j]["mountpoint"] = "/";
                                        }
                                    }
                                }
                                break;
                            }
                        }
                        callback();
                    }
                });
            }else if (that.$el.has("#advanced_part_table").length > 0) {
                for (var x in that.app.options.disks){
                    var devpath = that.app.options.disks[x].path
                    for (var y in that.app.options.disks[x].table) {
                        var partnum = that.app.options.disks[x].table[y].number;
                        var tmp = _.find(adPage.record.dirty, function(el){ return (el.paht == devpath && el.num == partnum); });
                        if ( typeof tmp !== "undefined" ) {
                            that.app.options.disks[x].table[y]["dirty"] = true;
                        }
                        tmp = _.find(adPage.record.edit, function(el){ return (el.path == devpath && partnum == el.num ); });
                        if ( typeof tmp !== "undefined" ) {
                            that.app.options.disks[x].table[y]["dirty"] = true;
                            that.app.options.disks[x].table[y]["mountpoint"]= tmp.mp;
                            if( tmp.fs !== "") {
                                that.app.options.disks[x].table[y]["fs"]= tmp.fs;
                            };
                        }
                    }
                }
                callback();
            };
            console.log(that.app.options);
        },
    };
    return page;
});

