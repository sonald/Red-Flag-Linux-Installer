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
            dirty:[],//devpath
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
            this.locals = this.locals || {};
            var pageC = (jade.compile($("#part_partial_tmpl")[0].innerHTML))(this.locals);
            $('#advanced_part_table').html(pageC);
            //$("#advanced_part_table ul").doFade({ fadeColor: "#362b40" });
            //$("#advanced_part_table ul ul").doFade({ fadeColor: "#354668" });
            //$("#advanced_part_table ul ul ul").doFade({ fadeColor: "#304531" });
            //$("#advanced_part_table ul ul ul ul").doFade({ fadeColor: "#72352d" });

            var that = this;
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
                window.apis.services.partition.reset(
                    $.proxy(that.partflesh, that));
            });

            $('body').on('click','a.js-create-submit',function () {
                var size, parttype, fstype, start, end, path;
                var $content = $(this).parents('.modal');
                size = Number($content.find("#size")[0].value);
                //Default data;
                fstype = "ext4";
                parttype = "primary";
                path = "/dev/sda";
                $content.find(":checked").each(function(){
                    if (this.id) {
                        if (this.id === "beginning") {
                            start = Number(this.value);
                            end = start + size;
                        }
                        else if ( this.id === "end") {
                            end = Number(this.value);
                            start = end - size;
                        };
                    }else if ($(this).parent().attr("id") === "parttype") {
                        parttype = this.value;
                    }else if ($(this).parent().attr("id") === "fs") {
                        fstype = this.value;
                    }
                });
                path = $(this).attr("path");
                window.apis.services.partition.mkpart(
                    path, parttype, start, end, fstype, $.proxy(that.partflesh, that));
            });

            $('body').on('click','a.js-edit-submit',function () {
                var mp, fstype, path, num;
                var $content = $(this).parents('.modal');
                fstype = "";
                mp = "";
                path = $(this).attr("path");
                num = $(this).attr("num");
                $content.find(":checked").each(function(){
                    if ($(this).parent().attr("id") === "mp") {
                        mp = this.value;
                    }else if ($(this).parent().attr("id") === "fs") {
                        fstype = this.value;
                    }
                });
                for (var x in that.record.edit){
                    if (that.record.edit[x].path === path && that.record.edit[x].num === num) {
                        that.record.edit.splice(x,1);
                        break;
                    };
                }
                var tmp = {
                    "path": path,
                    "num":num,
                    "fs": fstype,
                    "mp": mp
                };
                that.record.edit.push(tmp);
                if (fstype !== "") {
                    $(this).parents('ul.part').find('a.partfs').text(fs);
                }
                if(mp !== "") {
                    $(this).parents('ul.part').find('a.partmp').text("MountPoint:" + mp);
                }
            });
        },

        partflesh: function(result){
            var that = this;
            if (result.status === "success") {
                if (result.handlepart){
                    //result.handlepart ="add/dev/sda1" or "del/dev/sdb1"
                    if (result.handlepart.sunstring(0,3) === "add") {
                        var newpart = result.handlepart.sunstring(3);
                        that.record.dirty.push(newpart);
                    }else if (result.handlepart.sunstring(0,3) === "del") {
                        var oldpartpath = result.handlepart.sunstring(3,11);
                        var oldpartnum = Number(result.handlepart.sunstring(11));
                        for (var x in that.record.dirty){
                            if (that.record.dirty[x] === oldpartpath) {
                                that.record.dirty.splice(x,1);
                                break;
                            }
                        }
                        for (var x in that.record.edit){
                            if (that.record.edit[x].path === oldpartpath) {
                                if (that.record.edit[x].num === oldpartnum) {
                                    that.record.edit.splice(x,1);
                                } else if (oldpartnum > 4 && that.record.edit[x].num > oldpartnum) {
                                    that.record.edit[x].num--;
                                }
                            }
                        }//remove and fix record in edit about the deleted part
                    }
                
                }
                window.apis.services.partition.getPartitions(function(disks) {
                    that.locals["disks"] = disks;
                    var pageC = (jade.compile($("#part_partial_tmpl")[0].innerHTML))(that.locals);
                    $("#advanced_part_table").html(pageC);
                    for (var x in that.record.edit) {
                        var $part = $('ul.disk[dpath="'+that.record.edit[x].path+'"]').find('ul.part[num="'+that.record.edit[x].num+'"]');
                        if(that.record.edit[x].fs !== "") {
                            $part.find('a.partfs').text($part.find('a.partfs').text() + that.record.edit[x].fs);
                        }
                        if (that.record.edit[x].mp !== ""){
                            $part.find('a.partmp').text($part.find('a.partmp').text() + that.record.edit[x].mp);
                        }
                    }
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

