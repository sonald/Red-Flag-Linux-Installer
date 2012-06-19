require.config({
    baseUrl: 'js',
});

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
        }

        this.$el.html( page.loadView() );
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

require(['jquery', 'license'], function($, pageLicense) {
    app.stages.push(pageLicense);

    DNode.connect(function (remote) {
        // when DNode is (re)connected, register global apis object.
        window.apis = remote;

        $(function() {
            app.init();
        });
    });

    console.log('load done!');
});

