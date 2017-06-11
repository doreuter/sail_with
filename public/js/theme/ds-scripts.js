;(function($) {
  "use strict";
  $(document).ready(function() {
    /*
     * Switch map initialize
     */
    $("#switch_map").change(function() {
      var header = $('header');
      var distanceTopToHeader = header.offset().top;
      var distanceTopToMap = $('.page-top-map').offset().top;

      $("header.page-top").toggleClass("default map");

      if ( header.hasClass('map') ) {
        $('body, html').animate({ scrollTop: distanceTopToMap }, 'slow');
      } else {
        $('body, html').animate({ scrollTop: distanceTopToHeader }, 'slow');
      }
    });

    /*
     * Switch contact map initialize
     */
    $(".switch-contact").change(function() {
      $(".page-map").toggleClass("active");
    });

    /*
     * Search on blur result dropdown example
     */
    $(".search-input").on("keyup blur", toggleFocus);
    function toggleFocus(e) {
      if ( e.type == "keyup" ) {
        $(".search-result").fadeIn();
      }
      else {
        $(".search-result").fadeOut();
      }
    }

    /*
     * Custom radio accordion item for order payment method
     */
    $(".radio-accordion-item").change(function() {
      var that = $(this),
        target = $(that.data("target")),
        parent = $(that.data("parent"));

      parent.find(".collapse.in").collapse("hide");
      parent.find(".radio-accordion-item:disabled").attr("disabled", false);

      if ( that.is(":checked") ) {
        that.attr("disabled", true);
        target.collapse("show");
      }
    });

    /*
     * Options block color customizer
     */
    $(".options-block-list-color a").on("click", function(e) {
      var that = $(this),
        href = that.attr("href");
      e.preventDefault();
      $(".options-block-list-color li").removeClass("active");
      that.closest("li").addClass("active");
      $("#theme_link").attr("href", "css/theme." + href + ".css");
    });

    /*
     * Search form with header
     */
    var search = $("#search-field");
    var navbar = search.parent().parent().siblings('.navbar');
    var navbarColor = navbar.attr('class');
    var blurElements = $('.page-top-content, .options-section, .section, .page-footer, .page, .page-wrap + hr');

    if ( !(search).parent().hasClass('full-search') ) {

      search.focusin(function() {
        $('html, body').animate({ scrollTop: 0 }, 400);
        $(this).closest('.container-fluid').addClass('search-focused');
        if ( $(window).width() < 768 ) {
          $('body').css('overflow-y', 'hidden');
        }
        navbar.removeAttr('class').attr('class', 'navbar black');
        blurElements.addClass('blur');
        $('header').addClass('header-blur');
      });
      if ( search.length ) {
        $(document).mouseup(function(e) {
          var container = search.closest('.container-fluid');
          if ( container.hasClass('search-focused') ) {
            if ( !container.is(e.target) && container.has(e.target).length === 0 ) {
              search.closest('.container-fluid').removeClass('search-focused');
              if ( $(window).width() < 768 ) {
                $('body').css('overflow-y', 'initial');
              }
              navbar.removeAttr('class').attr('class', navbarColor);
              blurElements.addClass('blur-removing');
              $('header').addClass('blur-removing');
              setTimeout(function() {
                blurElements.removeClass('blur blur-removing');
                $('header').removeClass('header-blur blur-removing');
              }, 300);
            }
          }
        });
      }
    }

    search.on('keyup', function() {
      if ( !$('.search').hasClass('writing') ) {
        $('.search').addClass('writing');
        setTimeout(function() {
          $('.search').removeClass('writing');
        }, 5000);
      }
    });

    var totalPrice = 0;
    function calcTotalPrice() {
      totalPrice = 0;
      $('.sum-price').each(function() {
        totalPrice += parseInt($(this).text().replace(/[^0-9]/gi, ''));
      });
      $('.subtotal-price').text('').text('$' + totalPrice);
      $('.total-price').text('').text('$' + totalPrice);
    }

    $('.input-arrows .arrow').on('click', function() {
      var amount = parseInt($(this).siblings('input').val());
      if ( $(this).hasClass('arrow-top') ) {
        amount++;
      } else {
        if ( amount != 1 )
        amount--;
      }
      var price = parseInt(
        $(this)
          .parents('.cart-item')
          .find('.price')
          .text()
          .replace(/[^0-9]/gi, '')) * amount;
      $(this)
        .parents('.cart-item')
        .find('.sum-price')
        .children()
        .text('')
        .text('$' + price);
      $(this).siblings('input').val(amount);
      $(this).siblings('.value').text(amount);
      calcTotalPrice();
    });

    $('.remove-btn').on('click', function() {
      $(this).parents('.cart-item').addClass('removing-item');
      setTimeout(function() {
        $('.remove-btn').parents('.removing-item').remove();
        calcTotalPrice();
      }, 300);
    });

    function resizeInput() {
      $(this).attr('size', $(this).val().length);
    }

    $('input.autowidth')
    // event handler
      .keyup(resizeInput)
      // resize on page load
      .each(resizeInput);

    $(document).on("change", "#all-category" , function() {
      if ( $(this).is(':checked') ) {
        $('.additional-category').removeClass('hidden-xs');
      } else {
        $('.additional-category').addClass('hidden-xs');
      }
    });

  });

  $(window).load(function() {
    $('#search-field').css('pointer-events', 'initial');
  });

  $('.page-top-map')
    .click(function() {
      $(this).children().addClass('clicked')
    })
    .mouseleave(function() {
      $(this).children().removeClass('clicked')
    });

  $('.search.full-search .on-search-btn').click(function() {
    if ( $('header .search-filters').is(':visible') ) {
      $('header .search-filters').css('opacity', 0);
      setTimeout(function() {
        $('header .search-filters').hide();
      }, 300);
    } else {
      $('header .search-filters').show();
      setTimeout(function() {
        $('header .search-filters').css('opacity', 1);
      }, 100);
    }
  });

  if ( $(window).width() < 768 ) {
    var categoryDropdown = $('.category-dropdown');
    $('.select-wrapper.open-categories').change(function() {
      categoryDropdown.fadeIn();
    });
    var categoryDropdownClose = $('.category-dropdown .close');
    categoryDropdownClose.on('click', function() {
      categoryDropdown.fadeOut();
    });

  }

  $('.open-next-sections').parent().click(function() {
    $(this)
      .closest('li')
      .siblings('.hidden')
      .removeClass('hidden');
    $(this)
      .closest('li')
      .remove();
  });

  $(".dropdown-menu a").each(function() {
    if( $.trim($(this).html()) == '' && $.trim($(this).text()) == '' ) {
      $(this).remove();
    }
  });

  $('.navbar-category > .nav > li > .moving-tag').click(function() {
    $(this)
      .clone()
      .toggleClass('moving-tag removing-tag')
      .append('<span class="fa fa-close"></span>')
      .appendTo('.filter-tags');
    $('.moving-tags').addClass('added');
  });


  $('.category-dropdown .moving-tag').click(function() {
    if ( $(this).siblings('input').is(':checked') ) {
      $('.filter-tags .removing-tag:contains("' + $(this).text() + '")').remove();
    } else {
      $('.filter-tags').append('<a href="#" class="removing-tag">' + $(this).text() + '<span class="fa fa-close"></span></a>')
    }
  });

  $(document).on('click','.filter-tags .removing-tag .fa-close', function(){

    $('.category-dropdown .moving-tag').siblings('input:checked').siblings('label:contains("' + $(this).parent().text() + '")').siblings('input').prop('checked', false);
    $(this).parent().remove();
    if ( $('.filter-tags').children().length == 0 ) {
      $('.moving-tags').removeClass('added');
    }
  });

  $('#nav_offcanvas ul > .dropdown > a').click(function() {
    $('#nav_offcanvas').children('ul').addClass('moves-out');
  });

  $('#nav_offcanvas .dropdown-menu .fa-angle-left').parent('a').click(function() {
    $('#nav_offcanvas').children('ul').removeClass('moves-out');
  });

  $('button[data-target="#nav_offcanvas"]').click(function() {
    $('#nav_offcanvas').children('ul').removeClass('moves-out');
  });

  $('.navbar .btn-save').click(function() {
    $(this).closest('.dropdown-menu').hide();
  });

  $('.navbar .dropdown-hover button').click(function() {
    $(this).siblings('.dropdown-menu').show();
  });

})(jQuery);