jQuery.fn.doFade = function(settings) {

    // if no paramaters supplied...
	settings = jQuery.extend({
		fadeColor: "black",
		duration: 200,
		fadeOn: 0.95,
		fadeOff: 0.8
	}, settings);

    var duration = settings.duration;
    var fadeOff = settings.fadeOff;
    var fadeOn = settings.fadeOn;
    var fadeColor = settings.fadeColor;
    var origColor = this.css("background-color");

    function change_to_new(ev) {
	      $(ev)
	          .stop()
	          .animate({
	              opacity: fadeOn,
	              backgroundColor: fadeColor
	          }, duration)
    };

    function change_to_old (ev) {
	      $(ev)
	          .stop()
	          .animate({
	              opacity: fadeOff,
	              backgroundColor: origColor,
	          }, duration)
    }
        
    $(this).hover(function () {
        var that = this;
        change_to_new(that);
    }, function () {
        var that = this;
        change_to_old(that);
    });

    //$(this).toggle(function(){
    //    var that = this;
    //    console.log(this);
    //    $(".handlers .btn").removeClass("btn-primary");
    //    change_to_old(that)

    //    $(this).attr("id", "selected"); 
    //    change_to_new (that);

    //    if ($(this).attr("ty") === "freespace"){
    //        $('#create').addClass("btn-primary");
    //    }else if($(this).attr("ty") != "free") {
    //        $('#remove').addClass("btn-primary");
    //        $('#edit').addClass("btn-primary");
    //    };
	  //}, function() {
    //    var that = this;
    //    $(".handlers .btn").removeClass("btn-primary");
    //    change_to_old (that);
	  //});
};

