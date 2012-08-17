define(['jquery', 'system', 'i18n', 'remote_part'], function($,_system,i18n, Rpart){
    'use strict';
    var partialCache;
    var partial = {
        view: '#easy_part_tmpl',
        options: null,
        locals: null,

        initialize: function (options, locals) {
            this.options = options;
            this.locals = locals;
            this.options.installmode = "easy";
            this.options.grubinstall = "/dev/sda";
        },

        loadView: function () {
            this.locals = this.locals || {};
            partialCache = (jade.compile($(this.view)[0].innerHTML))(this.locals);
            return partialCache;
        },

        renderparts: function () {
            var that = this;
            var tys, pindex, $disk, tmpPage, args, dindex = 0;
            tys = ["primary", "free", "extended"];//logical is special
            
            var new_disks = Rpart.calc_percent(that.options.disks);
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
                    $disk.find('ul.part').prev('button.close').remove();
                    pindex++;
                });
                if ($disk.find('ul.logicals').prev('button.close').length > 0){
                    $disk.find('ul.logicals').find('li').css("float","none");
                }
                dindex++;
            });
        },

        postSetup: function () {
            this.renderparts();
            $("body").off('click', '#easy_part_table ul.selectable');
            $('body').on('click', '#easy_part_table ul.selectable', function () {
                $('.warninfo').html("<br/>");
                if ($(this).hasClass("select")) {
                    $(this).removeClass("select");
                }else {
                    $("#easy_part_table").find('ul.select').removeClass("select");
                    $(this).addClass("select");
                    if ($(this).attr("psize") < 6) {
                        $('.warninfo').html("<b>"+i18n.gettext('Select a partition of at least 6 GB.')+"</b>");
                    }
                }
            });
        },

        validate: function (callback) {
            var dnum, pnum, part, disk;
            var that = this;
            if ($("#part_content").find('ul.select').length < 1) {
                alert(i18n.gettext("Please select a partition to continue."));
                return;
            }
            pnum = $("#part_content").find('ul.select').attr("pindex");//TODO
            dnum = $("#part_content").find('ul.select').attr("dindex");//TODO
            disk = this.options.disks[dnum];
            part = disk.table[pnum];
            if (part.size < 6) {
                alert(i18n.gettext("Select a partition of at least 6 GB"));
                return;
            }
            var dpath = disk.path;

            if (part.number < 0) {
                Rpart.method('EasyHandler', [dpath, part.ty, part.start, part.end], function (result, disks) {
                    var new_number = Number(result.handlepart);
                    that.locals["disks"] = that.options.disks = disks;
                    var disk = _.find(disks, function(el){
                        return el.path === dpath;
                    });
                    var part = _.find(disk.table, function (el) {
                        return (el.number === new_number);
                    });
                    part["mountpoint"] = "/";
                    part["dirty"] = true;
                    callback();
                });
            }else{
                part["dirty"] = true;
                part["mountpoint"] = "/";
                part.fs = "ext4";
                callback();
            }
        },
    };
    return partial;
});
