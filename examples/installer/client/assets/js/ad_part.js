define(['jquery', 'system', 'js_validate', 'i18n','sitemap'], function($, _system, jsvalidate, i18n) {
    'use strict';

    var partialCache;

    console.log('load partition');
    var page = {
        view: '#advanced_part_tmpl',
        locals : null,
        app:null,

        initialize: function (app, locals) {
            this.app = app;
            this.locals = locals;
            this.app.Data.options.installmode = "advanced";
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
        },

        partflesh: function(result){
            var that = this;
            if (result.status === "success") {
                window.apis.services.partition.getPartitions(function(disks) {
                    that.locals["disks"] = disks;
                    var pageC = (jade.compile($("#part_partial_tmpl")[0].innerHTML))(that.locals);
                    $("#advanced_part_table").html(pageC);
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

