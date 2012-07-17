define(['jquery', 'system', 'js_validate', 'i18n','sitemap'], function($, _system, jsvalidate, i18n) {
    'use strict';

    var pageCache;

    console.log('load partition');
    var page = {
        view: '#part_tmpl',
        locals: null,
        app: null,
         
        // do initialization, called when loading the page
        initialize: function(app, reinit, callback) {
            var that = this;
            that.app = app;
            window.apis.services.partition.reset(function(result) {
                if(result.status === "success"){
                    window.apis.services.partition.getPartitions(function(disks) {
                        that.locals = { 
                            'disks': disks,
                            gettext: function(msgid) { return i18n.gettext(msgid); }
                        };
                        pageCache = undefined;
                        console.log("success");
                        callback();
                    });

                }else if(result.status === "failure"){
                    console.log(result);
                    //TODO
                }else{
                    console.log("data error");
                    //TODO
                };
            });
            console.log('part initialized');
        },

        // compile and return page partial
        loadView: function() {
            if (typeof pageCache === 'undefined') {
                this.locals = this.locals || {};
                pageCache = (jade.compile($(this.view)[0].innerHTML))(this.locals);
            }

            return pageCache;
        },

        postSetup: function() {
            this.locals = this.locals || {};
            var pageC = (jade.compile($("#part_partial_tmpl")[0].innerHTML))(this.locals);
            $('#part_table').html(pageC);
            $("#part_table ul").doFade({ fadeColor: "#362b40" });
            $("#part_table ul ul").doFade({ fadeColor: "#354668" });
            $("#part_table ul ul ul").doFade({ fadeColor: "#304531" });
            $("#part_table ul ul ul ul").doFade({ fadeColor: "#72352d" });

            var that = this;
            $('body').on('click','.delete', function () {
                console.log ("delete");
                var path = $(this).attr("path");
                var number = $(this).attr("num");
                window.apis.services.partition.rmpart(
                    path, number, $.proxy(that.partflesh, that));
            });

            $('body').on('click','#reset',function () {
                console.log("reset");
                window.apis.services.partition.reset(
                    $.proxy(that.partflesh, that));
            });

            $('body').on('click','a.js-create-submit',function () {
                var size, parttype, fstype, start, end, path;
                var $content = $(this).parents('.modal');
                size = Number($content.find("#size")[0].value);

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
                    }else{
                        parttype = this.value
                    }
                });
                path = $(this).attr("path");
                fstype = "ext4";
                window.apis.services.partition.mkpart(
                    path, parttype, start, end, fstype, $.proxy(that.partflesh, that));
            });
        },

        rewind: function() {
            //enable backward
            return 
        },

        validate: function(callback) {
        },

        partflesh: function(result){
            var that = this;
            if (result.status === "success") {
                window.apis.services.partition.getPartitions(function(disks) {
                    that.locals["disks"] = disks;
                    var pageC = (jade.compile($("#part_partial_tmpl")[0].innerHTML))(that.locals);
                    $("#part_table").html(pageC);
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

