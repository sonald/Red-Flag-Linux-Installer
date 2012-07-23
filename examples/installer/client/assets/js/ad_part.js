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
            var pageC;
            this.locals = this.locals || {};
            pageC = (jade.compile($("#part_partial_tmpl")[0].innerHTML))(this.locals);
            $('#advanced_part_table').html(pageC);
            //$("#advanced_part_table ul").doFade({ fadeColor: "#362b40" });
            //$("#advanced_part_table ul ul").doFade({ fadeColor: "#354668" });
            //$("#advanced_part_table ul ul ul").doFade({ fadeColor: "#304531" });
            //$("#advanced_part_table ul ul ul ul").doFade({ fadeColor: "#72352d" });

            $('body').off('click','.delete');
            $('body').off('click','#reset');
            $('body').off('click','a.js-create-submit');

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
                //Default data;
                fstype = "ext4";
                parttype = "primary";
                path = $(this).attr("path");
                parttype = $content.find('#parttype :checked').attr("value");
                fstype = $content.find('#fs :checked').attr("value");
                align = Number($content.find("#location :checked").attr("value"));

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
                var mp, fstype, path, num;
                var $content = $(this).parents('.modal');
                fstype = "";
                mp = "";
                path = $(this).attr("path");
                num = Number($(this).attr("num"));
                $content.find(":checked").each(function(){
                    if ($(this).parent().attr("id") === "mp") {
                        mp = this.value;
                    }else if ($(this).parent().attr("id") === "fs") {
                        fstype = this.value;
                    }
                });
                that.record.edit = _.reject(that.record.edit,function(el){
                    return el.path === path && el.num === num;
                });

                that.record.edit.push({"path":path,
                                        "num":num,
                                        "fs":fstype,
                                        "mp":mp});
                if (fstype !== "") {
                    $(this).parents('ul.part').find('a.partfs').text(fstype);
                }
                $(this).parents('ul.part').find('a.partmp').text("MountPoint:" + mp);
            });
        },

        partflesh: function(result){
            var that = this;
            if (result.status === "success") {
                if (result.handlepart){
                    //result.handlepart ="add/dev/sda1" or "del/dev/sdb1"
                    var method, dpath, pnum;
                    method = result.handlepart.substring(0,3);
                    dpath = result.handlepart.substring(3,11);
                    pnum = Number(result.handlepart.substring(11));
                    console.log(method,dpath,pnum);

                    if (method === "add") {
                        that.record.dirty.push({path:dpath,num:pnum});
                        console.log(that.record.dirty);

                    }else if (method === "del") {
                        that.record.dirty = _.reject(that.record.dirty, function(el) {
                            return el.path === dpath && el.num === pnum;
                        });
                        that.record.edit = _.reject(that.record.edit,function(el){
                            return el.path === dpath && el.num === pnum;
                        });
                        if(pnum > 4) {
                            that.record.edit = _.map(that.record.edit,function(el){
                                if (el.num > pnum && el.path === dpath) {
                                    el.num--;
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
                        var $part = $('ul.disk[dpath="'+tmp.path+'"]').find('ul.part[num="'+tmp.num+'"]');
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

