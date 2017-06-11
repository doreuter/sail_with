$.fn.extend({
    animateEvent: function (animationEvent) {
        this.on(animationEvent, function () {
            var dataTarget = $(this).data('target'),
                animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
            $(dataTarget).each(function () {
                var that = $(this),
                    dataIn = that.data('in'),
                    dataOut = that.data('out');
                if(dataIn && dataOut && $(window).width() >= 768) {
                    if(that.is(':visible')) {
                        that.addClass('animated ' + dataOut).one(animationEnd, function() {
                            that.removeClass('animated ' + dataOut).hide();
                        });
                    }
                    else {
                        that.show().addClass('animated ' + dataIn).one(animationEnd, function() {
                            that.removeClass('animated ' + dataIn);
                        });
                    }
                }
            });
        });
    }
});