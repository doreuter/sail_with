;(function($){
    "use strict";
    $(document).ready(function () {
        /*
        * MatchHeight plugin initialization
        */
        $('.same-height').matchHeight();

        /*
        * Animate plugin initialization
        */
        $('[data-toggle="animate"]').animateEvent('click');

        /*
        * Bootstrap Stars rating plugin initialization
        */
        $('.rating-result').rating();
        $('.rating-choose').rating({
            extendSymbol: function () {
                var title;
                var data = {
                    1 : "Terrible",
                    2 : "Poor",
                    3 : "Average",
                    4 : "Very good",
                    5 : "Exceptional"
                };
                $(this).tooltip({
                    container: 'body',
                    placement: 'top',
                    trigger: 'manual',
                    title: function () {
                        return title;
                    }
                });
                $(this).on('rating.rateenter', function (e, rate) {
                    title = data[rate];
                    $(this).tooltip('show');
                })
                    .on('rating.rateleave', function () {
                        $(this).tooltip('hide');
                    });
            }
        });

        /*
        * Bootstrap tooltip initialization
        */
        $('[data-toggle="tooltip"]').tooltip();

        /*
        * Bootstrap selectpicker initialization
        */
        $("select.custom-select").selectpicker();

        /*
         * Owl carousel initialization
         */
        $(".owl-carousel").owlCarousel({
            loop:true,
            margin:30,
            responsiveClass:true,
            navText: ["<span class='icon-arrow-left'></span>", "<span class='icon-arrow-right'></span>"],
            responsive:{
                0:{
                    items:1,
                    nav:false
                },
                920:{
                    items:2,
                    nav:true
                },
                1200:{
                    items:3,
                    nav:true,
                    loop:false
                }
            }
        });

        /*
         * Datepicker initialization
         */
        var datepickerInput = $('.datepicker-input');
        if ( datepickerInput.length ) {
          datepickerInput.dateRangePicker({
            startOfWeek: 'sunday',
            separator: ' ~ ',
            singleMonth: true,
            showTopbar: false,
            format: 'DD.MM.YYYY HH:mm',
            autoClose: false,
            time: {
              enabled: true
            },
            defaultTime: moment().startOf('day').toDate(),
            defaultEndTime: moment().endOf('day').toDate(),
            language: 'en',
            applyBtnClass: 'save-time',
            customOpenAnimation: function(cb) {
              $(this).fadeIn(300, cb);
            },
            customCloseAnimation: function(cb) {
              $(this).fadeOut(300, cb);
            }
          });
        }
        /*
         * PerfectScrollbar initialization
         */
        $(".dropdown-menu.scrollbar").perfectScrollbar();
        $(".search-result .search-result-inner").perfectScrollbar();

    });

})(jQuery);