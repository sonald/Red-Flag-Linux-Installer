define(['jquery', 'system', 'js_validate', 'i18n','sitemap'], function($, _system, jsvalidate, i18n) {
    'use strict';

    var partialCache;

    console.log('load partition');
    var page = {
        view: '#advanced_part_tmpl',
        locals : null,
        app:null,
        record:{
            edit:[],//{path:"/dev/sda",num:1,mp:"/",fs:"ext4"}
            dirty:[],//{path:"dev/sda",num:1}
        },

        initialize: function (app, locals) {
            this.app = app;
            this.locals = locals;
            this.app.options.installmode = "advanced";
        },
         
        // compile and return page partial
        loadView: function() {
            partialCache = (jade.compile($(this.view)[0].innerHTML))();
            return partialCache;
        },

        postSetup: function() {
            var that = this;
            this.locals = this.locals || {};
            var pageC = (jade.compile($("#part_partial_tmpl")[0].innerHTML))(this.locals);
            $('#advanced_part_table').html(pageC);

            $('body').off('click','.delete');
            $('body').off('click','#reset');
            $('body').off('click','a.js-create-submit');
            $('body').off('click','a.js-edit-submit');

            $('body').on('click','.delete', function () {
                var path = $(this).attr("path");
                var number = $(this).attr("num");
                window.apis.services.partition.rmpart(
                    path, number, $.proxy(that.partflesh, that));
            });

            $('body').on('click','#reset',function () {
                that.record = {
                    edit:[],
                    dirty:[],
                };
                window.apis.services.partition.reset(
                    $.proxy(that.partflesh, that));
            });

            $('body').on('click','a.js-create-submit',function () {
                var size, parttype, fstype, start, end, path, align;
                var $content = $(this).parents('.modal');
                size = Number($content.find("#size")[0].value);
                parttype = $content.find('#parttype :checked').attr("value");
                fstype = $content.find('#fs :checked').attr("value");
                align = Number($content.find("#location :checked").attr("value"));

                path = $(this).attr("path");
                if($content.find("#location :checked").attr("id") === "start") {
                    start = align;
                    end = start + size;
                } else if ($content.find("#location :checked").attr("id") === "end") {
                    end = align;
                    start = end - size;
                };
                window.apis.services.partition.mkpart(
                    path, parttype, start, end, fstype, $.proxy(that.partflesh, that));
            });

            $('body').on('click','a.js-edit-submit',function () {
                var mp, fstype, pnum, dnum;
                var $content = $(this).parents('.modal');
                pnum = $(this).attr("pnum");
                dnum = $(this).attr("dnum");
                fstype = $content.find("#fs :checked").attr("value");
                mp = $content.find("#mp :checked").attr("value");

                that.record.edit = _.reject(that.record.edit,function(el){
                    return (el.path ===that.app.options.disks[dnum].path && 
                            el.number === that.app.options.disks[dnum].table[pnum].number);
                });
                that.record.edit.push({"path":that.app.options.disks[dnum].path,
                                        "number":that.app.options.disks[dnum].table[pnum].number,
                                        "fs": fstype,
                                        "mp": mp,});

                $(this).parents('ul.part').find('a.partfs').text(fstype);
                $(this).parents('ul.part').find('a.partmp').text("MountPoint:" + mp);
            });
        },

        partflesh: function(result){
            var that = this;
            if (result.status === "success") {
                if (result.handlepart){
                    //result.handlepart ="add/dev/sda1" or "del/dev/sdb1"
                    var method, path, number;
                    method = result.handlepart.substring(0,3);
                    path = result.handlepart.substring(3,11);
                    number = Number(result.handlepart.substring(11));

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
                        if(number > 4) {
                            that.record.edit = _.map(that.record.edit,function(el){
                                if (el.number > number && el.path === path) {
                                    el.number--;
                                };
                                return el;
                            })
                        }
                    }
                }
                window.apis.services.partition.getPartitions(function(disks) {
                    that.locals["disks"] = disks;
                    that.app.options.disks = disks;
                    var pageC = (jade.compile($("#part_partial_tmpl")[0].innerHTML))(that.locals);
                    $("#advanced_part_table").html(pageC);
                    for (var x in that.record.edit) {
                        var tmp = that.record.edit[x];
                        var $part = $('ul.disk[dpath="'+tmp.path+'"]').find('ul.part[num="'+tmp.number+'"]');
                        if(tmp.fs !== "") {
                            $part.find('a.partfs').text(tmp.fs);
                        };
                        if (tmp.mp !== ""){
                            $part.find('a.partmp').text("MountPoint:" + tmp.mp);
                        };
                    };
                });
            }else if(result.status === "failure") {
                //TODO
                console.log(result.reason);
            }else {
                //TODO
                console.log(result);
            };
        },
    };
    return page;
});

