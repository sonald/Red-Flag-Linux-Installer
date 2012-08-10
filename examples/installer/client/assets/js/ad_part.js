define(['jquery', 'system', 'js_validate', 'i18n', 'remote_part'],
       function($, _system, jsvalidate, i18n, Rpart) {
    'use strict';

    var partialCache;

    console.log('load partition');
    var page = {
        view: '#advanced_part_tmpl',
        locals : null,
        options:null,
        record: null,

        init_record: function () {
            this.record = {
                edit:[],
                dirty:[],
                mp:{"/":false,"/opt":false},
            };
        },

        initialize: function (options, locals) {
            this.options = options;
            this.locals = locals;
            this.options.installmode = "advanced";
            this.init_record();
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
                var dsize = disk.size;
                var exsize, expercent=0, diskpercent=0;
                _.each(disk.table, function (part){
                    if (part.ty !== "logical") {
                        part.percent = (part.size/dsize < 0.05) ? 0.05:part.size/dsize;
                        diskpercent += part.percent;
                        if (part.ty === "extended") {
                            exsize = part.size;
                        }
                    }else {
                        part.percent = (part.size/exsize < 0.2) ? 0.2:part.size/exsize;
                        expercent += part.percent;
                    };
                });
                _.each(disk.table, function (part){
                    if (part.ty !== "logical") {
                        part.percent = part.percent*100/diskpercent;
                    }else {
                        part.percent = part.percent*100/expercent;
                    }
                });
            });

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
                        if(part.number > 0) {
                            $disk.find('ul.logicals').prev('button.close').remove();
                        };
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
            $('body').off('click','.create');
            $('body').off('click','.edit');

            var that = this;
            $('body').on('click','.delete', function () {
                var $this = $(this);
                Rpart.method('rmpart',
                             [$this.attr("path"), $this.attr("number")],
                    $.proxy(that.partflesh, that));
            });

            $('body').on('click','#reset',function () {
                that.init_record ();
                Rpart.method('reset',[], $.proxy(that.partflesh, that));
            });

            $('body').on('click', '.create', function (){
                var $modal = $(this).next();
                $modal.find('input#size').val("");
            });

            $('body').on('click', '.edit', function (){
                var $modal = $(this).next();
                $modal.find('select#mp').next('b').remove();
            });

            $('body').on('change', '.modal #mp', function (){
                var value = $(this).attr("value");
                $(this).next('b').remove();
                if (that.record.mp[value]) {
                    $(this).after("<b>Sorry</b>");
                    $(this).val("");
                }
            });

            $('body').on('click','.js-create-submit',function () {
                var size, parttype, fstype, start, end, path;
                var $modal = $(this).parents('.modal');

                size = $modal.find("#size").attr("value");
                if (size.match(/^(\d*)(\.?)(\d*)$/g) === null) {
                    alert(i18n.gettext('Number!!'));
                    return;
                }else {
                    size = Number($modal.find("#size").attr("value"));
                    size = Number(size.toFixed(2));
                };

                path = $(this).attr("path");
                parttype = $modal.find('#parttype').val();
                fstype = $modal.find('#fs').val();

                if($modal.find("#location :checked").attr("id") === "start") {
                    start = Number($modal.find("#location :checked").attr("value"));
                    end = start + size;
                } else if ($modal.find("#location :checked").attr("id") === "end") {
                    end = Number($modal.find("#location :checked").attr("value"));
                    start = end - size;
                };

                Rpart.method('mkpart',[path, parttype, start, end, fstype],
                             $.proxy(that.partflesh, that));
            });

            $('body').on('click','.js-edit-submit',function () {
                var mp, fstype, path, number;
                var $modal = $(this).parents('.modal');
                path = $(this).attr("path");
                number = Number($(this).attr("number"));
                fstype = $modal.find("#fs").val();
                mp = $modal.find("#mp").val();

                that.record.edit = _.reject(that.record.edit,function(el){
                    return (el.path === path && el.number === number);
                });
                that.record.edit.push({"path":path,
                                        "number":number,
                                        "fs": fstype,
                                        "mp": mp,});
                var has_mp = _.pluck(that.record.edit, 'mp');
                has_mp = _.intersection(has_mp, ["/", "/opt"]);
                if (_.include(has_mp, "/")){
                    that.record.mp["/"] = true;
                }else {
                    that.record.mp["/"] = false;
                }
                if (_.include(has_mp, "/opt")){
                    that.record.mp["/opt"] = true;
                }else {
                    that.record.mp["/opt"] = false;
                }

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
            var method, path, number, mp;
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
                    if (el.path === path && el.number === number){
                        mp = el.mp;
                        return true;
                    }
                    return false;
                });
                if( mp in that.record.mp ) {
                    that.record.mp = false;
                }
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

