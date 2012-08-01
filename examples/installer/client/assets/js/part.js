define(['jquery','system', 'i18n', 'easy_part', 'fd_part', 'ad_part'],
       function ($, _system, i18n, easyPage, fdPage, adPage) {
    'use strict';

    var pageCache;
    console.log('load partition');
    var page = {
	      name: 'Part',
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
            };
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
                    alert(i18n.gettext(result.reason));
                    console.log(result);
                }else{
                    alert(i18n.gettext(result.error));
                    console.log("data error");
                };
            });
        },

        // compile and return page partial
        loadView: function() {
            var locals = this.locals || {};
            if (typeof pageCache === 'undefined') {
                pageCache = (jade.compile($(this.view)[0].innerHTML))(locals);
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
                    easyPage.initialize(that.app.options, that.locals);
                    that.$el.html( easyPage.loadView() );
                    easyPage.postSetup && easyPage.postSetup();
                });
            });

            $('body').on('click', '#fulldisk', function(){
                that.getparts(function () {
                    fdPage.initialize(that.app.options, that.locals);
                    that.$el.html( fdPage.loadView() );
                    fdPage.postSetup && fdPage.postSetup();
                });
            });

            $('body').on('click', '#advanced', function(){
                adPage.initialize(that.app.options, that.locals);
                that.$el.html( adPage.loadView());
                adPage.postSetup && adPage.postSetup();
            });

            $('#easy').trigger("click");
        },

        validate: function(callback) {
            var that = this;
            if (that.$el.has("#easy_part_table").length > 0) {
                easyPage.validate(callback);
            }else if (that.$el.has("#fulldisk_part_table").length > 0) {
                fdPage.validate(callback);
            }else if (that.$el.has("#advanced_part_table").length > 0) {
                var disks = that.app.options.disks;
                var root_mp, opt_mp, root_size;
                root_mp = 0;
                opt_mp = 0;
                root_size = 0;
                _.each(adPage.record.edit, function (el) {
                    if (el.mp === "/") {
                        root_mp++;
                        var disk = _.find(disks, function (disk) {
                            return disk.path === el.path;
                        });
                        var part = _.find(disk.table, function (part) {
                            return part.number === el.number;
                        });
                        root_size = part.size;
                    }else if (el.mp === "/opt") {
                        opt_mp++;
                    };
                });
                if (root_mp === 0) {
                    alert(i18n.gettext("you need choose a disk for '/'!"));
                    return;
                } else if (root_mp > 1 || opt_mp > 1) {
                    alert(i18n.gettext("you need choose only a disk for each mountpoint!"));
                    return;
                }else if (root_size < 6) {
                    alert(i18n.gettext("you need choose a disk larger than 6G for '/'!"));
                    return;
                }
                _.each(adPage.record.dirty, function (el) {
                    var path = el.path;
                    var number = el.number;
                    var disk = _.find(disks, function (disk_el) {
                        return disk_el.path === path;
                    });
                    var part = _.find(disk.table, function (part_el) {
                        return part_el.number === number;
                    });
                    if(part && part.ty !== "extended") {
                        part["dirty"] = true;
                    };
                });

                _.each(adPage.record.edit, function (el) {
                    var path = el.path;
                    var number = el.number;
                    var disk = _.find(disks, function (disk_el) {
                        return disk_el.path === path;
                    });
                    var part = _.find(disk.table, function (part_el) {
                        return part_el.number === number;
                    });
                    part["dirty"] = true;
                    part["mountpoint"] = el.mp;
                    part["fs"] = el.fs;
                });

                disks = _.map(disks, function (disk) {
                    disk.table = _.map(disk.table, function(part) {
                        delete part.path;
                        return part;
                    });
                    return disk;
                });
                that.app.options.disks = disks;
                that.app.options.grubinstall=$('#grub').find(':checked').attr("value");
                callback();
            };
            console.log(that.app.options);
        },
    };
    return page;
});

