require.config({
    baseUrl: 'js',    
    paths: {
        dnode: '/dnode'
    },
    shim: {
        'bootstrap': ['jquery'],
        'jquery.knob': ['jquery'],
        'jquery.color':['jquery'],
        'sitemap': ['jquery']
    }
});

var app = {
    name: 'Pangu Installer',
    $el: null, // where page hosted at
    button_handler:{
        add:function (button_id, name) {
            if ( $("#"+button_id ) ) {
                $("#"+button_id).parent().addClass(name);
            };
        },
        rm:function (button_id, name) {
            if ($("#"+button_id )) {
                $("#"+button_id).parent().removeClass(name);
            };
        },
        hasclass:function (button_id, name) {
            if ($("#"+button_id )) {
                return $("#"+button_id).parent().hasClass(name);
            };
            return false;
        },
        change:function (old_id, new_id) {
            if ($("#"+old_id)){
                var str = $("#"+old_id).text();
                str = str.replace(/[a-zA-Z0-9]+/, new_id);
                $("#"+old_id).text(str);
                $("#"+old_id).attr("id",new_id);
            };
        },
    },

    // collect user configurations
    options: {
        username:'',
        hostname:'qomo',
        grubinstall:'',
        installmode:'easy',
        disks: [],
    },

    resetDatas: function () {
        this.options.grubinstall = '';
        this.options.installmode = 'easy';
        this.options.disks = [];
    },

    // internal, do not change it manually
    _currentPage: 0,

    // pages in order
    stages: [],

    set currentPage(pageId) {
        if (!this.pageValid(pageId))
            return;

        console.log('load page %d', pageId);
        this._currentPage = pageId;
        this.loadPage(this._currentPage, false);
    },

    get currentPage() {
        return this._currentPage;
    },

    // load and (re)init page 
    loadPage: function(pageId, reinit) {
        if (!this.pageValid(pageId))
            return;

        var self = this;
        var page = this.stages[pageId];
        page.initialize(this, reinit, function() { 
            self.$el.html( page.loadView() );
            page.postSetup && page.postSetup();
        });
    },

    pageValid: function(pageId) {
        var valid = pageId >= 0 && pageId < this.stages.length;
        if (!valid) {
            console.log('page %d does not exists', pageId);
        }
        return valid;
    },

    forward: function() {
        console.log('forward');
        var page = this.stages[this.currentPage];
        var that = this;
        page.validate(function(){that.currentPage +=1;});
    },

    // when app is ready, call this
    init: function() {
        this.$el = $('#stage');
        window.apis.expose(function(apis) {
            console.log(apis);
        });

        $('body').on('click', 'a#forward', $.proxy(this.forward, this));

        this.currentPage = 0;
        console.log('app init');
    },
};

require(['jquery', 'license', 'userinfo', 'part', 'process'], function($, pageLicense, pageInfo, pagePart, pageProcess) {
    app.stages.push(pageLicense);
    app.stages.push(pageInfo);
    app.stages.push(pagePart);
    app.stages.push(pageProcess);

    DNode.connect(function (remote) {
        // when DNode is (re)connected, register global apis object.
        window.apis = remote;

        $(function() {
            app.init();
        });
    });

    console.log('load done!');
});

