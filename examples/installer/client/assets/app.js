require.config({
    baseUrl: 'js',
});

var app = {
    name: 'Pangu Installer',
    $el: null, // where page hosted at

    // collect user configurations
    userData: {},

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
        if (page.validate && page.validate())
            this.currentPage += 1;
    },

    backward: function() {
        console.log('backward');
        this.currentPage -= 1;
    },

    // when app is ready, call this
    init: function() {
        this.$el = $('#stage');
        window.apis.expose(function(apis) {
            console.log(apis);
        });

        $('body').on('click', 'button#backward', $.proxy(this.backward, this));
        $('body').on('click', 'button#forward', $.proxy(this.forward, this));

        this.currentPage = 0;
        console.log('app init');
    },
};

require(['jquery','license', 'part', 'process'], function($, pageLicense, pagePart, pageProcess) {
    app.stages.push(pageLicense);
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

