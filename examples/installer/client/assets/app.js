require.config({
    baseUrl: 'js',
});

var data;
var app = {
    name: 'Pangu Installer',
    $el: null, // where page hosted at

    // internal, do not change it manually
    _currentPage: 0,

    // pages in order
    stages: [],

    set currentPage(pageId) {
        if (!this.pageValid(pageId))
            return;

        console.log('load page %d', pageId);
        this._currentPage = pageId;
        this.loadPage(this._currentPage);
    },

    get currentPage() {
        return this._currentPage;
    },

    // load and (re)init page 
    loadPage: function(pageId, reinit) {
        if (!this.pageValid(pageId))
            return;

        var page = this.stages[pageId];
        if (reinit) {
            page.initialize();
        };
        if (pageId === 1){
            page.initialize(data)
        };

        this.$el.html( page.loadView() );
        if (pageId === 2){
            if(data.status === "process"){
                $(".dial").knob({
                    width:300,
                });
            }
            else if(data.status === "failure"){
                this.$el.html( "<p> failure:"+data.reason+" </p>");
            }
        };
    },

    pageValid: function(pageId) {
        var valid = pageId >= 0 && pageId < this.stages.length;
        if (!valid) {
            console.log('page %d does not exists', pageId);
        }

        return valid;
    },

    forward: function() {
        this.currentPage += 1;
    },

    backward: function() {
        this.currentPage -= 1;
    },

    // when app is ready, call this
    init: function() {
        this.$el = $('#stage');
        this.currentPage = 0;
        apis.expose(function(apis) {
            console.log(apis);
        });

        console.log('app init');
    },
};

require(['jquery','license', 'part', 'process'], function($, pageLicense, pagePart, pageProcess) {
    app.stages.push(pageLicense);
    app.stages.push(pagePart);
    app.stages.push(pageProcess);

    var stubs;
    var getparts = function(disks){
        data = disks;
        app.forward();
    };

    var process = function(result){
        data = result;
        app.forward();
    };


    DNode.connect(function (remote) {
        // when DNode is (re)connected, register global apis object.
        window.apis = remote;
        stubs = {
            getpartitions:[remote, "services.partition.getPartitions"],
            commit:[remote, "services.partition.packAndUnpack"],
        };

        $(function() {
            app.init();
        });
    });

    function fire(remote, proto) {
        var func = _.reduce(proto.split('.'), function(memo, item) {
            if (typeof memo[item] === 'object')
                return memo[item];

            else if (typeof memo[item] === 'function') {
                return _.bind(memo[item], memo);

            } else
                throw { reason: 'memo[item] invalid' };

        }, remote);

        func.apply(null, Array.prototype.slice.call(arguments, 2));
    }

   $('body').on('click', 'button.btn', function(){
        var step = $(this).text();
        if( step === "forward" && !($(this).hasClass("disabled")) ){
            fire.apply(null, stubs["getpartitions"].concat([getparts]));
        }else if(step === "backward"){
            app.backward();
        }else if(step === "commit"){
            var name = $('#name').attr("value");
            var password = $('#password').attr("value");
            var disk = $("fieldset").find(":checked").attr("value");
            var options = {
                username:name,
                psword:password,
                newroot:disk,
            };
            fire.apply(null, stubs["commit"].concat([options,process]));
        };
    });
    $('body').on('click', '#choose', function(){
        if($("#choose").find(":checked").attr("value")==="agree" && $("#next").hasClass("disabled")){
            $("#next").toggleClass("disabled");
        }else if($("#choose").find(":checked").attr("value")==="disagree" && !$("#next").hasClass("disabled")){
            $("#next").toggleClass("disabled");
        };
    });
    console.log('load done!');
});

