define(['jquery', 'system', 'i18n', 'remote_part'], function($,_system,i18n, Rpart){
    'use strict';
    var partialCache;
    var partial = {
        view: '#easy_part_tmpl',
        options: null,
        locals: null,
        myalert: null,

        initialize: function (options, locals, myalert) {
            this.options = options;
            this.locals = locals;
            this.myalert = myalert;
            this.options.installmode = "easy";
            this.options.grubinstall = "/dev/sda";
        },

        loadView: function () {
            this.locals = this.locals || {};
            partialCache = (jade.compile($(this.view)[0].innerHTML))(this.locals);
            return partialCache;
        },

        renderparts: function () {
            var new_disks = Rpart.calc_percent(this.options.disks);
            Rpart.render(new_disks, false, this.locals);
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
                that.myalert(i18n.gettext("Please select a partition to continue."));
                return false;
            }
            pnum = $("#part_content").find('ul.select').attr("pindex");//the position in the parts array, start with 0 
            dnum = $("#part_content").find('ul.select').attr("dindex");//the position in the disks array, start with 0
            disk = this.options.disks[dnum];
            part = disk.table[pnum];
            if (part.size < 6) {
                that.myalert(i18n.gettext("Select a partition of at least 6 GB"));
                return false;
            }
            // the last confirm before installation
            $('#myconfirm').modal();
            $('#myconfirm').on('click', '.js-confirm', function () {
                var dpath = disk.path;
                if (part.number < 0 || disk.type === "gpt") {
                    Rpart.method('EasyHandler', that.options.iso,
                                [dpath, part.ty, part.start, part.end, part.number],
                                function (result, disks) {
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
                        part["label"]=dpath.slice(5).toUpperCase()+part.number;
                        callback();
                    });
                }else {
                    part["dirty"] = true;
                    part["mountpoint"] = "/";
                    part["label"]=dpath.slice(5).toUpperCase()+part.number;
                    part.fs = "ext4";
                    callback();
                }
            });
        },
    };
    return partial;
});
