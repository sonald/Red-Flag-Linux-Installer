define(['jquery', 'system', 'js_validate', 'i18n', 'remote_part'],
       function($, _system, jsvalidate, i18n, Rpart) {
    'use strict';

    var partialCache;

    console.log('load partition');
    var page = {
        view: '#advanced_part_tmpl',
        locals : null,
        options:null,
        record: {},

        initialize: function (options, locals) {
            this.options = options;
            this.locals = locals;
            this.options.installmode = "advanced";
            this.record = {
                edit: [],
                dirty: [],
            };
        },
         
        // compile and return page partial
        loadView: function() {
            this.locals = this.locals || {};
            partialCache = (jade.compile($(this.view)[0].innerHTML))(this.locals);
            return partialCache;
        },

        renderParts: function () {
            this.locals = this.locals || {};
            var pageC = (jade.compile($("#part_partial_tmpl")[0].innerHTML))(this.locals);
            $('#advanced_part_table').html(pageC);
            this.renderPart();
        },

        renderPart: function () {
            var that = this;
            var tys, pindex, $disk, tmpPage, args, dindex = 0;
            tys = ["primary", "free", "extended"];//logical is special
            _.each(that.options.disks, function (disk) {
                pindex = 0;
                $disk = $('ul.disk[dpath="'+disk.path+'"]');
                _.each(disk.table, function (part){
                    part["path"] = disk.path;
                    args = {
                                pindex:pindex, 
                                dindex:dindex,
                                part:part,
                                unit:disk.unit,
                                gettext:that.locals.gettext,
                            };
                    if (part.number < 0) {
                        tmpPage = (jade.compile($('#free_part_tmpl')[0].innerHTML))(args);
                    }else{
                        tmpPage = (jade.compile($('#'+part.ty+'_part_tmpl')[0].innerHTML))(args);
                    };
                    if (_.indexOf(tys, part.ty) > -1) {
                        $disk.append(tmpPage);
                    }else {
                        $disk.find('ul.logicals').append(tmpPage);
                    };
                    pindex++;
                });
                dindex++;
            });
        },

        postSetup: function() {
            this.renderParts();
            $('body').off('click','.delete');
            $('body').off('click','#reset');
            $('body').off('click','.js-create-submit');
            $('body').off('click','.js-edit-submit');

            var that = this;
            $('body').on('click','.delete', function () {
                var $this = $(this);
                Rpart.method(['rmpart',
                             $this.attr("path"), $this.attr("number")],
                    $.proxy(that.partflesh, that));
            });

            $('body').on('click','#reset',function () {
                that.record = {
                    edit:[],
                    dirty:[],
                };
                Rpart.method(['reset'],
                    $.proxy(that.partflesh, that));
            });

            $('body').on('click','a.js-create-submit',function () {
                var size, parttype, fstype, start, end, path;
                var $modal = $(this).parents('.modal');
                parttype = $modal.find('#parttype :checked').attr("value");
                fstype = $modal.find('#fs :checked').attr("value");

                if ($modal.find("#size").attr("value").match(/^(\d*)(\.?)(\d*)$/g) === null) {
                    alert(i18n.gettext('Number!!'));
                    return;
                }else {
                    size = Number($modal.find("#size").attr("value"));
                    size = Number(size.toFixed(2));
                }
                path = $(this).attr("path");
                if($modal.find("#location :checked").attr("id") === "start") {
                    start = Number($modal.find("#location :checked").attr("value"));
                    end = start + size;
                } else if ($modal.find("#location :checked").attr("id") === "end") {
                    end = Number($modal.find("#location :checked").attr("value"));
                    start = end - size;
                };
                Rpart.method(['mkpart',path, parttype, start, end, fstype],
                             $.proxy(that.partflesh, that));
            });

            $('body').on('click','a.js-edit-submit',function () {
                var mp, fstype, path, number;
                var $modal = $(this).parents('.modal');
                path = $(this).attr("path");
                number = Number($(this).attr("number"));
                fstype = $modal.find("#fs :checked").attr("value");
                mp = $modal.find("#mp :checked").attr("value");

                that.record.edit = _.reject(that.record.edit,function(el){
                    return (el.path === path && el.number === number);
                });
                that.record.edit.push({"path":path,
                                        "number":number,
                                        "fs": fstype,
                                        "mp": mp,});
                $(this).parents('ul.part').find('a.partfs').text(fstype);
                var str = i18n.gettext('MountPoint:');
                $(this).parents('ul.part').find('a.partmp').text(str + mp);
            });
        },

        partflesh: function(result, disks){
            var that = this;
            if (result.handlepart){
                //result.handlepart ="add/dev/sda1" or "del/dev/sdb1"
                that.parthandler(result.handlepart);
            }
            that.options.disks = that.locals.disks = disks;
            that.renderParts();

            //deal with record
            _.each(that.record.edit, function(el) {
                var $part = $('ul.disk[dpath="'+el.path+'"]').find('ul.part[number="'+el.number+'"]');
                if(el.fs !== "") {
                    $part.find('a.partfs').text(el.fs);
                };
                if (el.mp !== ""){
                    var str = i18n.gettext('MountPoint:');
                    $part.find('a.partmp').text(str + el.mp);
                };
            });
        },

        parthandler: function(result) {
            var method, path, number;
            var that = this;
            method = result.substring(0,3);
            path = result.substring(3,11);
            number = Number(result.substring(11));

            if (method === "add") {
                //TODO ty==extended
                that.record.dirty.push({"path":path,"number":number});
            }else if (method === "del") {
                //TODO ty==extended
                that.record.dirty = _.reject(that.record.dirty, function(el) {
                    return el.path === path && el.number === number;
                });
                that.record.edit = _.reject(that.record.edit,function(el){
                    return el.path === path && el.number === number;
                });
                //in msdos,number of logical > 4
                if(number > 4) {
                    that.record.edit = _.map(that.record.edit,function(el){
                        if (el.number > number && el.path === path) {
                            el.number--;
                        };
                        return el;
                    });
                    that.record.dirty = _.map(that.record.dirty,function(el){
                        if (el.number > number && el.path === path) {
                            el.number--;
                        };
                        return el;
                    });
                };//if number > 4
            };
        },

        validate: function(callback) {
            var that = this;
            var disks = that.options.disks;
            //validate~~
            var root_mp, opt_mp, root_size;
            root_mp = 0;
            opt_mp = 0;
            root_size = 0;
            _.each(that.record.edit, function (el) {
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
                alert(i18n.gettext("You need specify a root partition."));
                return;
            } else if (root_mp > 1 || opt_mp > 1) {
                alert(i18n.gettext("Select only one root partition."));
                return;
            }else if (root_size < 6) {
                alert(i18n.gettext("The root partition requires at least 6 GB space!"));
                return;
            }
            //data control
            _.each(that.record.dirty, function (el) {
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

            var grubinstall = $('#grub').find(':checked').attr("value");
            _.each(that.record.edit, function (el) {
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
                if (el.mp === "/" && grubinstall === "/") {
                    grubinstall = el.path + el.number;
                };
            });

            disks = _.map(disks, function (disk) {
                disk.table = _.map(disk.table, function(part) {
                    delete part.path;
                    return part;
                });
                return disk;
            });
            that.options.disks = disks;
            that.options.grubinstall = grubinstall;
            callback();
        },
    };
    return page;
});

