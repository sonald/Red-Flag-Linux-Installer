define(['jquery', 'system'], function($, _system) {
    'use strict';
    
    function buildProgressbar() {
        var tmpl = '<li> <div id="$1" class="bar"></div> </li>';

        var content = '';
        for (var i = 1; i <= 100; i++) {
            content += tmpl.replace('$1', 'pgcontrol' + i);
        }

        $ul.html(content);
    }

    var requestAnimFrame = (function() {
        return window.requestAnimationFrame || window.mozRequestAnimationFrame ||  
            window.webkitRequestAnimationFrame || window.msRequestAnimationFrame; 
    })();

    function activateBar(barid) {
        this.$el.find('#pgcontrol'+barid).css('-webkit-animation', 'fill .5s linear forwards');
        this.$el.find('#pgcontrol'+barid).css('-moz-animation', 'fill .5s linear forwards');
    }

    var animQueue = [];
    
    function runAnimQueue() {
        if (animQueue.length === 0) {
            if (pgControl._percent < 100) {
                requestAnimFrame(runAnimQueue);
            }
            return;
        }

        var animation = animQueue.shift();
        animation(function() {
            requestAnimFrame(runAnimQueue);
        });
    }
    
    var $ul = null;
    var pgControl = {
        $el: null,
        _percent: 0,
        
        init: function(el) {
            this.$el = $(el);
            $ul = $('<ul class="progressbar"></ul>');
            this.$el.append($ul);
            buildProgressbar();
            this._percent = 0;
            requestAnimFrame(runAnimQueue);
        },

        update: function(percent) {
            var that = this;
            
            var oldpercent = this._percent;
            this._percent = percent;
            if (percent <= oldpercent)
                return;
            percent = Math.min(percent, 100);
            
            var barid = oldpercent+1;
            // console.log('cache animation for ', barid);
            animQueue.push(function animateIt(onFinish) {
                if (barid > percent)  {
                    // console.log('finished at barid ', barid);
                    if (arguments.length > 0) {
                        arguments[0]();
                    }
                    return;
                }

                $.proxy(activateBar, that)(barid);
                barid++;
                setTimeout(function() {
                    animateIt(onFinish);
                }, 400);
            });
        },

        reset: function() {
            this.$el.find('.bar').css('opacity', 0);
            this._percent = 0;
        }
    };

    return pgControl;
});