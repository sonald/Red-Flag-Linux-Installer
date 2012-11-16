define(['jquery', 'system', 'i18n', 'remote_part'],
       function($, _system, i18n, Rpart) {
    'use strict';

    var partialCache;

    console.log('load partition');
    var page = {
        view: '#advanced_part_tmpl',
        locals : null,
        options:null,
        record: null,
        mp_tag: null,//when creating a part,the mp_tap will record the mountpoint
        myalert: null,
        tmp_isoMedia:null,

        init_record: function () {
            this.record = {
                edit:[], //record the edited part
                dirty:[],//record the parted need to format
                mp:[],   //record all the mountpoints used
            };
            this.mp_tag = "";
            this.tmp_isoMedia = this.options.iso;
        },

        initialize: function (options, locals, myalert) {
            this.options = options;
            this.locals = locals;
            this.myalert = myalert;
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
            var pindex, $disk, dindex = 0;

            //calculate the percent the part occupied in the disk
            var new_disks = Rpart.calc_percent(that.options.disks);
            //render the new views according to the new datas
            Rpart.render(new_disks, true, that.locals);

            _.each(new_disks, function (disk) {
                pindex = 0;//the position in array parts
                $disk = $('ul.disk[dpath="'+disk.path+'"]');
                _.each(disk.table, function (part){
                    var $modal = $disk.find('ul.selectable[pindex='+pindex+']').next('.modal');
                    if($modal) {
                        //record the origin fs about part in the view
                        if (part.number > 0)$modal.find("#parttype").val(part.ty);
                        $modal.find("#fs").val(part.fs);
                    }
                    if (part.number > 0 && _.include(["ext4","Unknow", "bios_grub"],part.fs) === false && (part.fs).match(/swap/g) === null ) {
                        //check out the fs supported or not
                        //supported fs:ext4, unknow, bios_grub, swap
                        //mp means mountpoint
                        $modal.find("#fs").append("<option value=''>"+part.fs+"</option>");
                        $modal.find("#fs").val("");
                        $modal.find("#fs").attr("disabled","");
                        $modal.find("#mp").attr("disabled","");
                        $modal.find("input[type=checkbox]").attr("disabled","");
                        $modal.find(".js-edit-submit").addClass("disabled");
                        $modal.find(".js-edit-submit").removeAttr("data-dismiss");

                    };
                    if (part.number > 0 && (part.fs).match(/swap/g)) {
                        //if fs is swap, disabled mountpoint selection
                        $modal.find("#mp").attr("disabled","");
                        $modal.find("#fs").val("swap");
                    };
                    if (part.number > 0 && part.fs === "bios_grub") {
                        //if fs is bios_grub, disabled mountpoint selection
                        $modal.find("#mp").attr("disabled","");
                        $modal.find("#fs").val("bios_grub");
                        $modal.find("#fs").attr('fs', 'bios_grub');
                    };
                    if (part.number > 0 && part.ty === "logical") {
                        //if having logical parts, remove the X tag in the view
                        $disk.find('ul.logicals').prev('button.close').remove();
                    }
                    pindex++;
                });
                if ($disk.find('ul.logicals').prev('button.close').length > 0){
                    $disk.find('ul.logicals').find('li').css("float","none");
                }
                dindex++;
            });
        },

        mp_conflict: function (path, number, fstype, mp) {
            //actually it is used to handle edit conflict
            //according the edit post, update record.edit and record.mp
            //mp means mountpoint
            var that = this, has_mp;
            var mpset = ['/','/boot','/home','/opt','/root','/usr','/var']
            that.record.edit = _.reject(that.record.edit,function(el){
                return (el.path === path && el.number === number);
            });
            var disk = _.find(that.options.disks, function (disk){
                return disk.path === path;
            });
            var part = _.find(disk.table, function(part) {
                return part.number === number;
            });
            if (part.fs === fstype && mp === "") {
                has_mp = _.pluck(that.record.edit, 'mp');
                that.record.mp = _.intersection(has_mp, mpset);
                return;
            }
            that.record.edit.push({"path":path,
                                    "number":number,
                                    "fs": fstype,
                                    "mp": mp,});
            has_mp = _.pluck(that.record.edit, 'mp');
            that.record.mp = _.intersection(has_mp, mpset);
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
                Rpart.method('rmpart',that.tmp_isoMedia,
                             [$this.attr("path"), $this.attr("number")],
                    $.proxy(that.partflesh, that));
            });

            $('body').on('click','#reset',function () {
                that.init_record ();
                Rpart.method('reset',that.tmp_isoMedia, [], $.proxy(that.partflesh, that));
            });

            //if selecting the mountpoint used, it will alert warning
            $('body').on('change', '.modal #mp', function (){
                var value = $(this).val();
                var mp = $(this).attr("mp");
                var $modal = $(this).parents('.modal');
                $modal.find('.alert').remove();

                if (_.include(that.record.mp, value) && mp !== value) {
                    var warning = (jade.compile($('#warning_mp_tmpl')[0].innerHTML)) (that.locals);
                    $modal.find('.control-group').last().after(warning);
                    $(this).val(mp);
                }
                if (value !== "") {
                    $modal.find('input[type=checkbox]').attr("checked","");
                }else if ($modal.find('input[type=checkbox]').attr("disabled") === undefined){
                    $modal.find('input[type=checkbox]').removeAttr("checked");
                }
            });

            //if selecting extended, set mountpoint and fs selection disabled
            $('body').on('change', '.modal #parttype', function (){
                var $this = $(this);
                var value = $this.val();
                if ( value === "extended" ) {
                    $this.parents('.modal').find('#fs').attr("disabled","");
                    $this.parents('.modal').find('#fs').val("");
                    $this.parents('.modal').find('#mp').attr("disabled","");
                    $this.parents('.modal').find('#mp').val("");
                }else {
                    $this.parents('.modal').find('#fs').removeAttr("disabled");
                    $this.parents('.modal').find('#fs').val("ext4");
                    $this.parents('.modal').find('#mp').removeAttr("disabled");
                };
            });

            //if selecting swap and bios_grub, set mountpoint selection disabled
            $('body').on('change', '.modal #fs', function (){
                var $this = $(this);
                var fstype = $(this).attr("fs");
                var value = $this.val();
                var $modal = $this.parents('.modal');
                var new_part = $this.attr("new_part");
                if (value.match(/swap/g) || value === "bios_grub") {
                    $modal.find('#mp').attr("disabled","");
                    $modal.find('#mp').val("");
                }else {
                    $this.parents('.modal').find('#mp').removeAttr("disabled");
                }
                if (fstype !== value) {
                    $modal.find('input[type=checkbox]').attr("checked", "");
                    $modal.find('input[type=checkbox]').attr("disabled", "");
                }else if ($modal.find('#mp').val() === "" && !new_part) {
                    $modal.find('input[type=checkbox]').removeAttr("disabled");
                    $modal.find('input[type=checkbox]').removeAttr("checked");
                }
            });

            //can only input numbers
            $('body').on('keyup', '.modal #size', function () {
                var str = $(this).val();
                var num = Number(str);
                var size = $(this).attr('psize');
                var $modal = $(this).parents('.modal');
                $modal.find('.alert').remove();
                if (!num && num !== 0 ) {
                    var warning = (jade.compile($('#warning_size_tmpl')[0].innerHTML)) (that.locals);
                    $modal.find('.control-group').last().after(warning);
                    $(this).val(size);
                }
            });

            //create form
            $('body').on('click','.js-create-submit',function () {
                var size, parttype, fstype, start, end, path;
                var $modal = $(this).parents('.modal');

                size = Number($modal.find("#size").attr("value"));
                size = Number(size.toFixed(2));
                start = Number($modal.find("#size").attr("start"));
                end = Number($modal.find("#size").attr("end"));

                path = $(this).attr("path");
                parttype = $modal.find('#parttype').val();
                fstype = $modal.find('#fs').val();
                that.mp_tag = (parttype === "extended") ? "" : $modal.find('#mp').val();

                Rpart.method('mkpart',that.tmp_isoMedia,
                              [path, parttype, start, size, end, fstype],
                              $.proxy(that.partflesh, that));
            });

            //edit form
            $('body').on('click','.js-edit-submit',function () {
                if ($(this).hasClass("disabled")){
                    return;
                }
                var mp, fstype, path, number;
                var $modal = $(this).parents('.modal');
                $modal.find('.alert').remove();
                path = $(this).attr("path");
                number = Number($(this).attr("number"));
                fstype = $modal.find("#fs").val();
                mp = $modal.find("#mp").val();
                $modal.find("#mp").attr("mp",mp);
                var fs_pre = $modal.find('#fs').attr('fs');
                var is_format=$modal.find("input[type=checkbox]").attr("checked");
                if (is_format === "checked") {
                    var has_dirty = _.find(that.record.dirty, function(el) {
                        return (el.path === path && el.number === number);
                    });
                    if(has_dirty === undefined) {
                        that.record.dirty.push({"path":path,"number":number});
                    }
                }else {
                    that.record.dirty = _.reject(that.record.dirty, function(el) {
                        return (el.path === path && el.number === number);
                    })
                }
                if (fstype === "bios_grub") {
                    Rpart.method('setFlag', that.tmp_isoMedia,
                                [path, number,fstype, true],
                                 $.proxy(that.partflesh, that));
                } else if (fs_pre && fs_pre === "bios_grub" && fstype !== "bios_grub"){
                    that.mp_conflict(path, number, fstype, mp); 
                    Rpart.method('setFlag', that.tmp_isoMedia,
                                  [path, number,fs_pre, false],
                                 $.proxy(that.partflesh, that));
                } else {
                    that.mp_conflict(path, number, fstype, mp);
                    $modal.prev('ul.part').find('.partfs').text(fstype);
                    if(mp === "") {
                        $modal.prev('ul.part').find('.partmp').text("");
                    }else{
                        $modal.prev('ul.part').find('.partmp').text("("+mp+")");
                    }
                }
            });
        },

        partflesh: function(result, disks){
            var that = this;
            that.options.disks = that.locals.disks = disks;
            if (result.handlepart){
                //result.handlepart ="add/dev/sda1" or "del/dev/sdb1"
                //update the record.mp and record.edit because of creating a part with mountpoint
                that.parthandler(result.handlepart);
            }
            //reset the mp_tag
            that.mp_tag = "";
            that.renderParts();

            //deal with record
            _.each(that.record.edit, function(el) {
                var $part = $('ul.disk[dpath="'+el.path+'"]').find('ul.part[number="'+el.number+'"]');
                if(el.fs !== "") {
                    $part.find('.partfs').text(el.fs);
                    $part.next('.modal').find('#fs').val(el.fs);
                };
                if (el.mp !== ""){
                    $part.find('.partmp').text("(" + el.mp + ")");
                    $part.next('.modal').find('#mp').attr("mp",el.mp);
                    $part.next('.modal').find('#mp').val(el.mp);
                };
            });
            _.each(that.record.dirty, function(el) {
                var $part = $('ul.disk[dpath="'+el.path+'"]').find('ul.part[number="'+el.number+'"]');
                $part.next('.modal').find("input[type=checkbox]").attr("checked","")
                if(el.new === true) {
                    $part.next('.modal').find("input[type=checkbox]").attr("disabled","")
                    $part.next('.modal').find("#fs").attr("new_part","true")
                }
            });
        },

        //update the record after creating or removing a part
        parthandler: function(result) {
            var method, path, number, mp;
            var that = this;
            method = result.substring(0,3);
            path = result.substring(3,11);
            number = Number(result.substring(11));
            var disks = that.options.disks;

            //return the new part
            var disk = _.find(disks, function (d) {
                return d.path === path;
            });
            var part = _.find(disk.table, function (p) {
                return p.number === number;
            })
            var type = disk.type;

            if (method === "add" && part.ty !== "extended") {
                that.record.dirty.push({"path":path,"number":number, "new":true});
                if (that.mp_tag !== "") {
                    that.mp_conflict (path, number, "", that.mp_tag);
                }
            }else if (method === "del") {
                //in msdos,number of logical > 4
                that.record.edit = _.map(that.record.edit,function(el){
                    if (type === "msdos" && number > 4 && el.number > number && el.path === path) {
                        el.number--;
                    }else if (el.number === number && el.path === path){
                        mp = el.mp;
                        return false;
                    };
                    return el;
                });
                that.record.edit = _.compact(that.record.edit);
                that.record.dirty = _.map(that.record.dirty,function(el){
                    if (type === "msdos" && number > 4 && el.number > number && el.path === path) {
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
            //check out wheater having the root mountpoint
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
                that.myalert(i18n.gettext('You need specify a root partition.'));
                return;
            }else if (root_size < 6) {
                that.myalert(i18n.gettext('The root partition requires at least 6 GB space!'));
                return;
            }
            //more warnings for gpt
            $('#myconfirm').find('.modal-body p.warning').remove();
            var disk, part, grub_msg;
            disk = _.find(disks, function (disk) {
                return disk.type === "gpt";
            });
            if (disk !== undefined) {
                part = _.find (disk.table, function (part) {
                    return (part.fs === "bios_grub" && part.number > 0)
                })
                if(part === undefined) {
                    grub_msg = i18n.gettext("<p class='warning'>This GPT partition label has no BIOS Boot Partition.You may fail to install.</p>");
                    $('#myconfirm').find('.modal-body p').before(grub_msg);
                }
            }
            //record the parts need to formatted
            var format_parts = [], format_page;
            $('#myconfirm').find('.modal-body p.format').remove();
            _.each(that.record.dirty, function(el) {
                format_parts.push(el.path.slice(5)+el.number);
            });
            if (format_parts.length > 0) {
                format_parts.join(',');
                format_page = (jade.compile($('#format_tmpl')[0].innerHTML)) (_.extend({format_parts:format_parts}, that.locals));
                $('#myconfirm').find('.modal-body p.content').after(format_page);
            }

            $('#myconfirm').modal();
            $('#myconfirm').on('click', '.js-confirm', function () {
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
                        part["label"] = path.slice(5).toUpperCase() + part.number;
                    };
                });

                var grubinstall = $('#grub').val();
                //add the label for part according record.edit
                _.each(that.record.edit, function (el) {
                    var path = el.path;
                    var number = el.number;
                    var disk = _.find(disks, function (disk_el) {
                        return disk_el.path === path;
                    });
                    var part = _.find(disk.table, function (part_el) {
                        return part_el.number === number;
                    });
                    part["label"] = ( el.mp && el.mp.length>1 ) ? el.mp.slice(1).toUpperCase() : path.slice(5).toUpperCase() + part.number;
                    part["label"] = (el.fs === "swap" || el.fs+part.fs === "swap") ? "SWAP" : part.label;
                    part["mountpoint"] = el.mp;
                    part["fs"] = el.fs || part["fs"];
                    if (el.mp === "/" && grubinstall === "/") {
                        grubinstall = el.path + el.number;
                    };
                });

                that.options.disks = disks;
                that.options.grubinstall = grubinstall;
                callback();
            });
        },
    };
    return page;
});

