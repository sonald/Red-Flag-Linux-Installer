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
        mp_tag: null,

        init_record: function () {
            this.record = {
                edit:[],
                dirty:[],
                mp:[],
            };
            this.mp_tag = "";
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
            var new_disks = Rpart.calc_percent(that.options.disks);
            tys = ["primary", "free", "extended"];//logical is special
            
            _.each(new_disks, function (disk) {
                pindex = 0;
                $disk = $('ul.disk[dpath="'+disk.path+'"]');
                _.each(disk.table, function (part){
                    args = {
                                pindex:pindex, 
                                dindex:dindex,
                                part:part,
                                unit:disk.unit,
                                path:disk.path,
                                gettext:that.locals.gettext,
                            };
                    var actPage;
                    if (part.number < 0) {
                        tmpPage = (jade.compile($('#free_part_tmpl')[0].innerHTML))(args);
                        actPage = (jade.compile($('#create_part_tmpl')[0].innerHTML))(args);
                    }else{
                        tmpPage = (jade.compile($('#'+part.ty+'_part_tmpl')[0].innerHTML))(args);
                        if (part.ty === "extended") {
                            actPage = "";
                        }else {
                            actPage = (jade.compile($('#edit_part_tmpl')[0].innerHTML))(args);
                        };
                    };
                    if (_.indexOf(tys, part.ty) > -1) {
                        $disk.append(tmpPage);
                        $disk.find('ul.part').last().after(actPage);
                    }else {
                        $disk.find('ul.logicals').append(tmpPage);
                        $disk.find('ul.logicals ul.part').last().after(actPage);
                        if(part.number > 0) {
                            $disk.find('ul.logicals').prev('button.close').remove();
                        };
                    };
                    if (part.number > 0 && (_.include(["ext4",""],part.fs) === false || (part.fs).match(/swap/g))) {
                        var $modal = $disk.find('ul.selectable').last().next('.modal');
                        $modal.find("#fs").attr("disabled","true");
                        $modal.find("#mp").attr("disabled","true");
                    };
                    if (part.number > 0 && (part.fs).match(/swap/g)) {
                        var $modal = $disk.find('ul.selectable').last().next('.modal');
                        $modal.find("#mp").attr("disabled","true");
                    };
                    pindex++;
                });
                if ($disk.find('ul.logicals').prev('button.close').length > 0){
                    $disk.find('ul.logicals').find('li').css("float","none");
                }
                dindex++;
            });
        },

        mp_conflict: function (path, number, fstype, mp) {
            var that = this;
            that.record.edit = _.reject(that.record.edit,function(el){
                return (el.path === path && el.number === number);
            });
            that.record.edit.push({"path":path,
                                    "number":number,
                                    "fs": fstype,
                                    "mp": mp,});
            var has_mp = _.pluck(that.record.edit, 'mp');
            that.record.mp = _.intersection(has_mp, ["/", "/opt"]);
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
                Rpart.method('rmpart',
                             [$this.attr("path"), $this.attr("number")],
                    $.proxy(that.partflesh, that));
            });

            $('body').on('click','#reset',function () {
                that.init_record ();
                Rpart.method('reset',[], $.proxy(that.partflesh, that));
            });

            $('body').on('change', '.modal #mp', function (){
                var value = $(this).val();
                var mp = $(this).attr("mp");
                $(this).next('b').remove();
                if (_.include(that.record.mp, value)) {
                    $(this).after(i18n.gettext("<b>Sorry</b>"));
                    $(this).val(mp);
                }
            });

            $('body').on('change', '.modal #parttype', function (){
                var $this = $(this);
                var value = $this.val();
                if ( value === "extended" ) {
                    $this.parents('.modal').find('#fs').attr("disabled","true");
                    $this.parents('.modal').find('#fs').val("");
                    $this.parents('.modal').find('#mp').attr("disabled","true");
                    $this.parents('.modal').find('#mp').val("");
                }else {
                    $this.parents('.modal').find('#fs').removeAttr("disabled");
                    $this.parents('.modal').find('#fs').val("ext4");
                    $this.parents('.modal').find('#mp').removeAttr("disabled");
                };
            });

            $('body').on('change', '.modal #fs', function (){
                var $this = $(this);
                var value = $this.val();
                if (value.match(/swap/g)) {
                    $this.parents('.modal').find('#mp').attr("disabled","true");
                    $this.parents('.modal').find('#mp').val("");
                }else {
                    $this.parents('.modal').find('#mp').removeAttr("disabled");
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
                    start = Number($modal.find("#size").attr("start"));
                    end = Number($modal.find("#size").attr("end"));
                    end = (start + size > end) ? end : start + size;
                };

                path = $(this).attr("path");
                parttype = $modal.find('#parttype').val();
                fstype = $modal.find('#fs').val();
                that.mp_tag = (parttype === "extended") ? "" : $modal.find('#mp').val();

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
                $modal.find("#mp").attr("mp",mp);
                that.mp_conflict(path, number, fstype, mp);

                $modal.prev('ul.part').find('b.partfs').text(fstype);
                if(mp === "") {
                    $modal.prev('ul.part').find('b.partmp').text("");
                }else{
                    $modal.prev('ul.part').find('b.partmp').text("("+mp+")");
                }
            });
        },

        partflesh: function(result, disks){
            var that = this;
            if (result.handlepart){
                //result.handlepart ="add/dev/sda1" or "del/dev/sdb1"
                that.parthandler(result.handlepart);
            }
            that.mp_tag = "";
            that.options.disks = that.locals.disks = disks;
            that.renderParts();

            //deal with record
            _.each(that.record.edit, function(el) {
                var $part = $('ul.disk[dpath="'+el.path+'"]').find('ul.part[number="'+el.number+'"]');
                if(el.fs !== "") {
                    $part.find('b.partfs').text(el.fs);
                };
                if (el.mp !== ""){
                    $part.find('b.partmp').text("(" + el.mp + ")");
                    $part.next('.modal').find('#mp').attr("mp",el.mp);
                    $part.next('.modal').find('#mp').val(el.mp);
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
                if (that.mp_tag !== "") {
                    that.mp_conflict (path, number, "", that.mp_tag);
                }
            }else if (method === "del") {
                //in msdos,number of logical > 4
                that.record.edit = _.map(that.record.edit,function(el){
                    if (number > 4 && el.number > number && el.path === path) {
                        el.number--;
                    }else if (el.number === number && el.path === path){
                        mp = el.mp;
                        return false;
                    };
                    return el;
                });
                that.record.edit = _.compact(that.record.edit);

                that.record.dirty = _.map(that.record.dirty,function(el){
                    if (number > 4 && el.number > number && el.path === path) {
                        el.number--;
                    }else if (el.number === number && el.path === path){
                        return false;
                    };
                    return el;
                });
                that.record.dirty = _.compact(that.record.dirty);
                that.record.mp = _.without(that.record.mp, mp);
            };
        },

        validate: function(callback) {
            var that = this;
            var disks = that.options.disks;
            //validate~~
            var root_size = 0;
            _.each(that.record.edit, function (el) {
                if (el.mp === "/") {
                    var disk = _.find(disks, function (disk) {
                        return disk.path === el.path;
                    });
                    var part = _.find(disk.table, function (part) {
                        return part.number === el.number;
                    });
                    root_size = part.size;
                };
            });
            if (_.include(that.record.mp, "/") === false) {
                alert(i18n.gettext("You need specify a root partition."));
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
                part["fs"] = el.fs || part["fs"];
                if (el.mp === "/" && grubinstall === "/") {
                    grubinstall = el.path + el.number;
                };
            });

            that.options.disks = disks;
            that.options.grubinstall = grubinstall;
            callback();
        },
    };
    return page;
});

