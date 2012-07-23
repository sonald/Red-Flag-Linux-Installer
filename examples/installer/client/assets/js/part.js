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
                var $selected, dnum, pnum, part;

                $selected = that.$el.find('ul.select');//TODO
                pnum = $selected.attr("pnum");
                dnum = $selected.parents('ul.disk').attr("dnum");
                part = that.app.options.disks[dnum].table[pnum];
                part["dirty"] = true;
                part["mountpoint"] = "/";
                part.fs = "ext4";

                callback();
            }else if (that.$el.has("#fulldisk_part_table").length > 0) {
                var $selected, dnum, pnum, part, dpath;

                $selected = that.$el.find('ul.select');//TODO
                dnum=$selected.attr("dnum");
                dpath = that.app.options.disks[dnum].path;

                window.apis.services.partition.FulldiskHandler(dpath, function (results) {
                    if (results.status && results.status === "failure") {
                        console.log(results);
                    }else{
                        that.locals["disks"] = results;
                        that.app.options.disks = results;

                        var disk = _.find(results,function(el){
                            return el.path === dpath;
                        });
                        disk.table = _.map(disk.table, function (el) {
                            if (el.number != -1){
                                el["dirty"] = true;
                                if (el.size >= 6 && el.fs != "linux-swap(v1)") {
                                    el["mountpoint"] = "/";
                                }
                            }
                            return el;
                        });
                        callback();
                    }
                });
            }else if (that.$el.has("#advanced_part_table").length > 0) {
                var disks = that.app.options.disks;
                _.each(adPage.record.dirty, function (el) {
                    var dpath = el.path;
                    var pnum = el.num;
                    var disk = _.find(disks, function (disk_el) {
                        return disk_el.path === dpath;
                    });
                    var part = _.find(disk.table, function (part_el) {
                        return part_el.number === pnum;
                    });
                    part["dirty"] = true;
                });

                _.each(adPage.record.edit, function (el) {
                    var dpath = el.path;
                    var pnum = el.num;
                    var disk = _.find(disks, function (disk_el) {
                        return disk_el.path === dpath;
                    });
                    var part = _.find(disk.table, function (part_el) {
                        return part_el.number === pnum;
                    });
                    part["dirty"] = true;
                    part["mountpoint"] = el.mp;
                    part["fs"] = el.fs || part["fs"];
                });

                that.app.options.grubinstall=$('#grub').find(':checked').attr("value");
                callback();
            };
            console.log(that.app.options);
        },
    };
    return page;
});

