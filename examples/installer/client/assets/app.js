require.config({
    baseUrl: 'js',
    paths: {
        dnode: '/dnode'
    },
    shim: {
        'bootstrap': ['jquery'],
        'jquery.slidingGallery':['jquery'],
    }
});

function Button(id, text) {
    this.id = id;
    this.text = text || "default";
    // elem cache
    this.$el = $('<a href="#" id="js-btn-' + id + '"> ' + text + ' </a>');
    this._evts = {};
}

Button.prototype.enabled = function() {
    return (!this.$el.hasClass('disabled'));
}

Button.prototype.change = function(text) {
    this.$el.text(text);
}

Button.prototype.enable = function() {
    var $el = this.$el;
    if ($el.hasClass('disabled')) {
        $el.toggleClass('disabled');
    }
}

Button.prototype.disable = function() {
    var $el = this.$el;
    if (!$el.hasClass('disabled')) {
        $el.toggleClass('disabled');
    }
}

// bind only bind one action, rebinding will remove last one
Button.prototype.bind = function(evt, action) {
    var self = this;
    if (this._evts[evt]) {
        this.$el.off(evt);
    }

    this.$el.on(evt, function(evtObj) {
        console.log('button ' + self.id + ' emit ' + evt);
        if (self.enabled()) {
            action(evtObj);
        }
    });
    this._evts[evt] = true;
}

var app = {
    name: 'Pangu Installer',
    $el: null, // where page hosted at
    myalert: function (msg, callback) {
        var $alert = $('#myalert');
        $alert.off('click', '.js-close');
        $alert.find('p.content').text(msg);
        $alert.modal();
        if (callback) {
            $alert.on('click','.js-close',callback);
        }
    },
    auto: false,

    buttons: {
        get: function(btnid) {
            return app.buttons._list[btnid];
        },

        add: function(btnid, text) {
            var claz = app.buttons;
            claz.$buttons = claz.$buttons || $('ul.buttons');

            var btn = claz.get(btnid);
            if (btn)
                return btn;

            claz._list[btnid] = new Button(btnid, text);
            claz.$buttons.append( claz._list[btnid].$el );
            return claz._list[btnid];
        },

        _list: {}
    },

    // collect user configurations
    options: {
        grubinstall:'',
        installmode:'easy',
        disks: [],
        sysflag:''
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

        this.animateStage(this.stages[pageId]);
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
        page.validate(function(){
            that.currentPage +=1;
        });
    },

    setupStageNavigator: function() {
        var $last_li = $('ol#breadcrumb-trail li.last');
        var li_tmpl = $('#bread_li_tmpl')[0].innerHTML;
        this.stages.forEach(function (stage) {
            var $li = (jade.compile(li_tmpl)) ({name:stage.name});
            $last_li.before($li);
        });
        $('ol#breadcrumb-trail li').css("margin-left",90/this.stages.length+"%");
        $('ol#breadcrumb-trail li:first-child').css("margin",0);
    },

    animateStage: function(stage) {
        var name = stage.name;
        console.log('animate ' + stage.name);

        var $ul = $('ol#breadcrumb-trail');
        $ul.find('li[data-stage=' + name + ']').addClass("current");
        $ul.find('li[data-stage=' + name + ']').prevAll('li').addClass("checked")
        $ul.find('li[data-stage=' + name + ']').prevAll('li').removeClass("incomplete current")
    },

    // when app is ready, call this
    init: function() {
        this.$el = $('#stage');
        this.setupStageNavigator();

        window.apis.expose(function(apis) {
            console.log(apis);
        });

        this.buttons.add("close");
        this.buttons.get("close").change(this.i18n.gettext('Exit'));
        this.buttons.get("close").bind('click', function() {
            window.installer && window.installer.closeInstaller();
        });

        this.buttons.add('forward', this.i18n.gettext('Next'));
        this.buttons.get('forward').bind('click', $.proxy(this.forward, this));
        // this.buttons.add('help', 'Help');

        this.currentPage = 0;
        console.log('app init');
    }
};

require(['jquery', 'i18n', 'restore', 'license', 'part', 'process', 'finished'],
    function($, i18n, pageRestore, pageLicense, pagePart, pageProcess, pageFinished) {
    var pageSet = {
        pageNormal: [pageLicense, pagePart, pageProcess, pageFinished],
                pageAuto: [pageLicense, pageProcess, pageFinished],
                pageRest: [pageRestore, pageProcess, pageFinished]
        };
    app.i18n = i18n;

    DNode.connect(function (remote) {
        // when DNode is (re)connected, register global apis object.
        window.apis = remote;

        $(function() {
            var str = location.search.substr(1);
            var str_array = str.split("&");

            if (_.indexOf(str_array, "sony=true") > -1) {
                app.options.sysflag = 'sony';
            }

            if (_.indexOf(str_array, "autorun=true") > -1 ) {
                app.auto = true;
                app.stages = pageSet.pageAuto;
            }else if (_.indexOf(str_array, "restore=true") > -1 ) {
                app.stages = pageSet.pageRest;
            }else {
                app.stages = pageSet.pageNormal;
            }
            app.init();
        });
    });

    console.log('load done!');
});
