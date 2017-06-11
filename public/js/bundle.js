'use strict';

var projectXApp = angular.module('projectXApp', ['ui.router', 'angular-loading-bar', 'cgNotify', 'ngCookies', 'ngSanitize', 'LocalStorageModule', 'angular-jwt', 'mm.foundation']);

projectXApp.constant('API_ENDPOINT', {
  url: 'http://localhost:5050/api'
});

projectXApp.constant('AUTH_EVENTS', {
  notAuthenticated: 'auth-not-authenticated'
});

projectXApp.config(["$stateProvider", "$urlRouterProvider", "$locationProvider", function ($stateProvider, $urlRouterProvider, $locationProvider) {

  $urlRouterProvider.otherwise('/');

  $locationProvider.html5Mode({
    enabled: true,
    rewriteLinks: false
  });

  $stateProvider.state('start', {
    url: '/',
    templateUrl: 'templates/start.html',
    controller: 'startController',
    controllerAs: 'vm'
  }).state('register', {
    url: '/register',
    templateUrl: 'templates/register.html',
    controller: 'registerController'
  }).state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'loginController'
  }).state('dashboard', {
    url: '/dashboard',
    templateUrl: 'templates/dashboard.html',
    controller: 'dashboardController'
  });
}]);

projectXApp.config(["$logProvider", function ($logProvider) {
  $logProvider.debugEnabled(true);
}]);

projectXApp.config(["cfpLoadingBarProvider", function (cfpLoadingBarProvider) {
  //deactivate spinner and show only loading bar
  cfpLoadingBarProvider.includeSpinner = false;
}]);

projectXApp.config(["$httpProvider", function ($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
}]);

projectXApp.run(["$rootScope", "$state", "AuthService", "AUTH_EVENTS", "notify", function ($rootScope, $state, AuthService, AUTH_EVENTS, notify) {
  notify.config({
    position: 'right',
    duration: 4000,
    startTop: 80
  });
  $rootScope.$on('$viewContentLoaded', function () {
    //$(document).foundation();
  });
  $rootScope.$on('$stateChangeStart', function (event, next, nextParams, fromState) {
    // if(!AuthService.isAuthenticated()) {
    //   console.log(next.name);
    //   if(next.name !== 'login' && next.name !== 'register') {
    //     event.preventDefault();
    //     $state.go('login');
    //   }
    // }
  });
  /**
   * Show state change errors in debug mode
   */
  $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
    $log.debug(event);
    $log.debug(toState);
    $log.debug(toParams);
    $log.debug(fromState);
    $log.debug(fromParams);
    $log.debug(error);
  });

  /**
   *  Show state not found errors in debug mode
   */
  $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
    $log.debug(event);
    $log.debug(unfoundState);
    $log.debug(fromState);
    $log.debug(fromParams);
  });
}]);
;(function ($) {
    "use strict";

    $(document).ready(function () {

        // Custom javascript right here

    });
})(jQuery);
projectXApp.controller('dashboardController', ["$scope", "$rootScope", "$http", "$log", "$cookieStore", "$state", "API_ENDPOINT", "AuthService", "notify", function ($scope, $rootScope, $http, $log, $cookieStore, $state, API_ENDPOINT, AuthService, notify) {

  $scope.user = {};
  $scope.changePasswordModel = {
    oldPassword: '',
    newPassword: '',
    newPasswordConfirm: ''
  };
  $scope.delAccount = {
    password: ''
  };

  if (AuthService.isAuthenticated()) {
    $http.get(API_ENDPOINT.url + '/account').then(function (data) {
      $scope.user = data.data;
    }).catch(function (err) {
      $log.debug(err);
    });
  }

  var validForm;
  function validatePasswordForm(passwordModel) {
    validForm = true;
    if (passwordModel.oldPassword === '') {
      notify('Please provide your old password!');
      validForm = false;
    }
    if (passwordModel.newPassword === '') {
      notify('Please enter a new password!');
      validForm = false;
    }
    if (passwordModel.newPassword !== '' && passwordModel.newPasswordConfirm === '') {
      notify('Please confirm your new password!');
      validForm = false;
    }
    if (passwordModel.newPassword !== '' && passwordModel.newPasswordConfirm !== '' && passwordModel.newPassword !== passwordModel.newPasswordConfirm) {
      notify('Your new passwords do not match!');
      validForm = false;
    }
    if (passwordModel.oldPassword === passwordModel.newPassword) {
      notify('You can not use your old password as your new one!');
      validForm = false;
    }
    return validForm;
  }

  $scope.changePassword = function (changePasswordModel) {
    if (validatePasswordForm(changePasswordModel)) {
      $http.put(API_ENDPOINT.url + '/auth/change-password', changePasswordModel).then(function (result) {
        notify('Your password has been successfully changed');
      }).catch(function (error) {
        $log.debug(error);
        notify('Your password could not be changed. Please try again later.');
      });
    }
  };

  $scope.deleteAccount = function (delAccount) {
    if (delAccount.password) {
      $http.post(API_ENDPOINT.url + '/auth/delete', delAccount).then(function (result) {
        AuthService.logout();
        $state.go('start');
        notify('Your account has been successfully deleted');
      }).catch(function (error) {
        $log.debug(error);
        notify('Your account could not be deleted. Please try again later.');
      });
    }
  };
}]);
projectXApp.controller('loginController', ["$rootScope", "$scope", "$http", "$log", "$state", "AuthService", "$location", "$cookieStore", "notify", function ($rootScope, $scope, $http, $log, $state, AuthService, $location, $cookieStore, notify) {

  //
  $scope.loginUser = {
    'email': '',
    'password': ''
  };

  var validForm = true;
  var loginFormValidate = function () {
    if ($scope.loginUser.email === '') {
      $log.debug('loginUser.email empty!');
      validForm = false;
    }
    if ($scope.loginUser.password === '') {
      $log.debug('loginUser.password empty!');
      validForm = false;
    }
    $log.debug("validForm: " + validForm);
    return validForm;
  };

  $scope.login = function (loginUser) {
    if (loginFormValidate()) {
      AuthService.login(loginUser).then(function (result) {
        $log.debug(result);
        notify('You have successfully logged in');
        $state.go('dashboard');
      }).catch(function (err) {
        notify('Login failed');
        $log.debug(err);
      });

      // $http.post($rootScope.serviceBase + 'api/auth/login', loginUser)
      //   .then(function(response) {
      //     notify('You successfully logged in!');
      //
      //     let user = {
      //       id:    response.data.user._id,
      //       name:  response.data.user.name,
      //       email: response.data.user.email,
      //       role:  response.data.user.role
      //     };
      //
      //     let authToken = response.data.token;
      //
      //     // set cookies
      //     $cookieStore.put('authToken', authToken);
      //     $cookieStore.put('user', user);
      //
      //     // redirect
      //     $location.path('/dashboard');
      //   })
      //   .catch(function(err) {
      //     $log.debug(err);
      //   });
    }
  };
}]);
projectXApp.controller('mainController', ["$rootScope", "$scope", "$state", "$log", "$http", "AuthService", "API_ENDPOINT", "AUTH_EVENTS", "notify", function ($rootScope, $scope, $state, $log, $http, AuthService, API_ENDPOINT, AUTH_EVENTS, notify) {

  $scope.$on(AUTH_EVENTS.notAuthenticated, function (event) {
    AuthService.logout();
    $state.go('start');
    $rootScope.currentUser = undefined;
    notify('Session lost! \nSorry you have to log in again!');
  });

  if (AuthService.isAuthenticated()) {
    $http.get(API_ENDPOINT.url + '/account').then(function (data) {
      $rootScope.currentUser = data.data;
    }).catch(function (err) {
      $log.debug(err);
    });
  }

  $scope.isAuthenticated = AuthService.isAuthenticated;

  $scope.logout = function () {
    AuthService.logout();
    $state.go('start');
    notify('Logged out!');
  };
}]);
projectXApp.controller('registerController', ["$scope", "$http", "$log", "$location", "$state", "$timeout", "AuthService", "notify", function ($scope, $http, $log, $location, $state, $timeout, AuthService, notify) {

    var validForm = true;

    //
    $scope.registerUser = {
        'name': '',
        'email': '',
        'password': ''
    };

    //
    $scope.validateData = {
        'confirmPassword': '',
        'terms': false
    };

    //
    var registerFormValidate = function () {
        validForm = true;
        //check if fields are not empty
        if ($scope.registerUser.name === '') {
            $log.debug('registerUser.name empty!');
            validForm = false;
        }
        if ($scope.registerUser.email === '') {
            $log.debug('registerUser.email empty!');
            validForm = false;
        }
        if ($scope.registerUser.password === '') {
            $log.debug('registerUser.password empty!');
            validForm = false;
        }
        if ($scope.validateData.confirmPassword === '') {
            $log.debug('confirmPassword.cpw empty!');
            validForm = false;
        }
        // check if pw's match
        if ($scope.registerUser.password !== $scope.validateData.confirmPassword) {
            $log.debug('Passwords do no match!');
            validForm = false;
        }
        if ($scope.validateData.terms === false) {
            $log.debug('Didn\'t accepted the terms!');
            validForm = false;
        }
        $log.debug("validForm: " + validForm);
        return validForm;
    };

    //
    $scope.register = function (registerUser) {
        if (registerFormValidate()) {
            AuthService.register(registerUser).then(function (msg) {
                notify('You successfully signed up!');
                notify('Please log in!');
                $state.go('start');
            }, function (errMsg) {
                notify('Registeration failed!');
                $log.debug(errMsg);
            });

            // $http.post($rootScope.serviceBase + 'api/auth/register', registerUser)
            //   .then(function(data) {
            //     $log.debug(data);
            //
            //     notify('You successfully registered!');
            //
            //     let user = {
            //       id:    response.data.user._id,
            //       name:  response.data.user.name,
            //       email: response.data.user.email,
            //       role:  response.data.user.role
            //     };
            //
            //     let authToken = response.data.token;
            //
            //     // set cookies
            //     $cookieStore.put('authToken', authToken);
            //     $cookieStore.put('user', user);
            //
            //     $timeout(function() {
            //       $location.path('/');
            //     }, 3000);
            //   })
            //   .catch(function(err) {
            //     $log.debug(err);
            //   });
        } else {
                // error handling
            }
    };
}]);
projectXApp.controller('startController', ["$scope", "$http", function ($scope, $http) {

    // $http.post('http://localhost:7777/api/quotes').then(function(quotes) {
    //     alert(JSON.stringify(quotes));
    //   });

    //$http.get('/someUrl', config).then(successCallback, errorCallback);

    // $http.get('https://api.github.com/users/janssh').then(function (quotes) {
    //   console.log(JSON.stringify(quotes));
    //   $scope.github = quotes;
    // });

    var vm = this;

    $http({
        method: 'GET',
        url: '/test/getAllUsers'
    }).then(function (response) {
        vm.test = response.data[0].email;
    });
}]);
projectXApp.factory('AuthInterceptor', ["$rootScope", "$q", "AUTH_EVENTS", function ($rootScope, $q, AUTH_EVENTS) {
  return {
    responseError: function (response) {
      $rootScope.$broadcast({
        401: AUTH_EVENTS.notAuthenticated
      }[response.status], response);
      return $q.reject(response);
    }
  };
}]);
projectXApp.service('AuthService', ["$q", "$http", "$log", "$cookieStore", "API_ENDPOINT", function ($q, $http, $log, $cookieStore, API_ENDPOINT) {
  var LOCAL_TOKEN_KEY = 'authToken';
  var isAuthenticated = false;
  var authToken;

  function loadUserCredentials() {
    var token = $cookieStore.get(LOCAL_TOKEN_KEY);
    if (token) {
      useCredentials(token);
    }
  }

  function storeUserCredentials(token) {
    $cookieStore.put(LOCAL_TOKEN_KEY, token);
    useCredentials(token);
  }

  function useCredentials(token) {
    isAuthenticated = true;
    authToken = token;

    // set the header as header for all requests!
    $http.defaults.headers.common.Authorization = authToken;
  }

  function destroyUserCredentials() {
    $log.debug('destroyUserCredentials');
    authToken = undefined;
    isAuthenticated = false;
    $http.defaults.headers.common.Authorization = undefined;
    $cookieStore.remove(LOCAL_TOKEN_KEY);
  }

  var register = function (user) {
    return $q(function (resolve, reject) {
      $http.post(API_ENDPOINT.url + '/auth/register', user).then(function (result) {
        if (result.data.success) {
          resolve(result.data.msg);
        } else {
          reject(result.data.msg);
        }
      }).catch(function (err) {
        $log.debug(err);
      });
    });
  };

  var login = function (user) {
    return $q(function (resolve, reject) {
      $http.post(API_ENDPOINT.url + '/auth/login', user).then(function (result) {
        if (result.data.success) {
          storeUserCredentials(result.data.token);
          resolve(result.data.msg);
        } else {
          reject(result.data.msg);
        }
      }).catch(function (err) {
        $log.debug(err);
      });
    });
  };

  var logout = function () {
    destroyUserCredentials();
  };

  loadUserCredentials();

  return {
    login: login,
    register: register,
    logout: logout,
    isAuthenticated: function () {
      return isAuthenticated;
    }
  };
}]);
$.fn.extend({
    animateEvent: function (animationEvent) {
        this.on(animationEvent, function () {
            var dataTarget = $(this).data('target'),
                animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
            $(dataTarget).each(function () {
                var that = $(this),
                    dataIn = that.data('in'),
                    dataOut = that.data('out');
                if (dataIn && dataOut && $(window).width() >= 768) {
                    if (that.is(':visible')) {
                        that.addClass('animated ' + dataOut).one(animationEnd, function () {
                            that.removeClass('animated ' + dataOut).hide();
                        });
                    } else {
                        that.show().addClass('animated ' + dataIn).one(animationEnd, function () {
                            that.removeClass('animated ' + dataIn);
                        });
                    }
                }
            });
        });
    }
});
;(function ($) {
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
                    1: "Terrible",
                    2: "Poor",
                    3: "Average",
                    4: "Very good",
                    5: "Exceptional"
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
                }).on('rating.rateleave', function () {
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
            loop: true,
            margin: 30,
            responsiveClass: true,
            navText: ["<span class='icon-arrow-left'></span>", "<span class='icon-arrow-right'></span>"],
            responsive: {
                0: {
                    items: 1,
                    nav: false
                },
                920: {
                    items: 2,
                    nav: true
                },
                1200: {
                    items: 3,
                    nav: true,
                    loop: false
                }
            }
        });

        /*
         * Datepicker initialization
         */
        var datepickerInput = $('.datepicker-input');
        if (datepickerInput.length) {
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
                customOpenAnimation: function (cb) {
                    $(this).fadeIn(300, cb);
                },
                customCloseAnimation: function (cb) {
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
;(function ($) {
  "use strict";

  $(document).ready(function () {
    /*
     * Switch map initialize
     */
    $("#switch_map").change(function () {
      var header = $('header');
      var distanceTopToHeader = header.offset().top;
      var distanceTopToMap = $('.page-top-map').offset().top;

      $("header.page-top").toggleClass("default map");

      if (header.hasClass('map')) {
        $('body, html').animate({ scrollTop: distanceTopToMap }, 'slow');
      } else {
        $('body, html').animate({ scrollTop: distanceTopToHeader }, 'slow');
      }
    });

    /*
     * Switch contact map initialize
     */
    $(".switch-contact").change(function () {
      $(".page-map").toggleClass("active");
    });

    /*
     * Search on blur result dropdown example
     */
    $(".search-input").on("keyup blur", toggleFocus);
    function toggleFocus(e) {
      if (e.type == "keyup") {
        $(".search-result").fadeIn();
      } else {
        $(".search-result").fadeOut();
      }
    }

    /*
     * Custom radio accordion item for order payment method
     */
    $(".radio-accordion-item").change(function () {
      var that = $(this),
          target = $(that.data("target")),
          parent = $(that.data("parent"));

      parent.find(".collapse.in").collapse("hide");
      parent.find(".radio-accordion-item:disabled").attr("disabled", false);

      if (that.is(":checked")) {
        that.attr("disabled", true);
        target.collapse("show");
      }
    });

    /*
     * Options block color customizer
     */
    $(".options-block-list-color a").on("click", function (e) {
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

    if (!search.parent().hasClass('full-search')) {

      search.focusin(function () {
        $('html, body').animate({ scrollTop: 0 }, 400);
        $(this).closest('.container-fluid').addClass('search-focused');
        if ($(window).width() < 768) {
          $('body').css('overflow-y', 'hidden');
        }
        navbar.removeAttr('class').attr('class', 'navbar black');
        blurElements.addClass('blur');
        $('header').addClass('header-blur');
      });
      if (search.length) {
        $(document).mouseup(function (e) {
          var container = search.closest('.container-fluid');
          if (container.hasClass('search-focused')) {
            if (!container.is(e.target) && container.has(e.target).length === 0) {
              search.closest('.container-fluid').removeClass('search-focused');
              if ($(window).width() < 768) {
                $('body').css('overflow-y', 'initial');
              }
              navbar.removeAttr('class').attr('class', navbarColor);
              blurElements.addClass('blur-removing');
              $('header').addClass('blur-removing');
              setTimeout(function () {
                blurElements.removeClass('blur blur-removing');
                $('header').removeClass('header-blur blur-removing');
              }, 300);
            }
          }
        });
      }
    }

    search.on('keyup', function () {
      if (!$('.search').hasClass('writing')) {
        $('.search').addClass('writing');
        setTimeout(function () {
          $('.search').removeClass('writing');
        }, 5000);
      }
    });

    var totalPrice = 0;
    function calcTotalPrice() {
      totalPrice = 0;
      $('.sum-price').each(function () {
        totalPrice += parseInt($(this).text().replace(/[^0-9]/gi, ''));
      });
      $('.subtotal-price').text('').text('$' + totalPrice);
      $('.total-price').text('').text('$' + totalPrice);
    }

    $('.input-arrows .arrow').on('click', function () {
      var amount = parseInt($(this).siblings('input').val());
      if ($(this).hasClass('arrow-top')) {
        amount++;
      } else {
        if (amount != 1) amount--;
      }
      var price = parseInt($(this).parents('.cart-item').find('.price').text().replace(/[^0-9]/gi, '')) * amount;
      $(this).parents('.cart-item').find('.sum-price').children().text('').text('$' + price);
      $(this).siblings('input').val(amount);
      $(this).siblings('.value').text(amount);
      calcTotalPrice();
    });

    $('.remove-btn').on('click', function () {
      $(this).parents('.cart-item').addClass('removing-item');
      setTimeout(function () {
        $('.remove-btn').parents('.removing-item').remove();
        calcTotalPrice();
      }, 300);
    });

    function resizeInput() {
      $(this).attr('size', $(this).val().length);
    }

    $('input.autowidth'
    // event handler
    ).keyup(resizeInput
    // resize on page load
    ).each(resizeInput);

    $(document).on("change", "#all-category", function () {
      if ($(this).is(':checked')) {
        $('.additional-category').removeClass('hidden-xs');
      } else {
        $('.additional-category').addClass('hidden-xs');
      }
    });
  });

  $(window).load(function () {
    $('#search-field').css('pointer-events', 'initial');
  });

  $('.page-top-map').click(function () {
    $(this).children().addClass('clicked');
  }).mouseleave(function () {
    $(this).children().removeClass('clicked');
  });

  $('.search.full-search .on-search-btn').click(function () {
    if ($('header .search-filters').is(':visible')) {
      $('header .search-filters').css('opacity', 0);
      setTimeout(function () {
        $('header .search-filters').hide();
      }, 300);
    } else {
      $('header .search-filters').show();
      setTimeout(function () {
        $('header .search-filters').css('opacity', 1);
      }, 100);
    }
  });

  if ($(window).width() < 768) {
    var categoryDropdown = $('.category-dropdown');
    $('.select-wrapper.open-categories').change(function () {
      categoryDropdown.fadeIn();
    });
    var categoryDropdownClose = $('.category-dropdown .close');
    categoryDropdownClose.on('click', function () {
      categoryDropdown.fadeOut();
    });
  }

  $('.open-next-sections').parent().click(function () {
    $(this).closest('li').siblings('.hidden').removeClass('hidden');
    $(this).closest('li').remove();
  });

  $(".dropdown-menu a").each(function () {
    if ($.trim($(this).html()) == '' && $.trim($(this).text()) == '') {
      $(this).remove();
    }
  });

  $('.navbar-category > .nav > li > .moving-tag').click(function () {
    $(this).clone().toggleClass('moving-tag removing-tag').append('<span class="fa fa-close"></span>').appendTo('.filter-tags');
    $('.moving-tags').addClass('added');
  });

  $('.category-dropdown .moving-tag').click(function () {
    if ($(this).siblings('input').is(':checked')) {
      $('.filter-tags .removing-tag:contains("' + $(this).text() + '")').remove();
    } else {
      $('.filter-tags').append('<a href="#" class="removing-tag">' + $(this).text() + '<span class="fa fa-close"></span></a>');
    }
  });

  $(document).on('click', '.filter-tags .removing-tag .fa-close', function () {

    $('.category-dropdown .moving-tag').siblings('input:checked').siblings('label:contains("' + $(this).parent().text() + '")').siblings('input').prop('checked', false);
    $(this).parent().remove();
    if ($('.filter-tags').children().length == 0) {
      $('.moving-tags').removeClass('added');
    }
  });

  $('#nav_offcanvas ul > .dropdown > a').click(function () {
    $('#nav_offcanvas').children('ul').addClass('moves-out');
  });

  $('#nav_offcanvas .dropdown-menu .fa-angle-left').parent('a').click(function () {
    $('#nav_offcanvas').children('ul').removeClass('moves-out');
  });

  $('button[data-target="#nav_offcanvas"]').click(function () {
    $('#nav_offcanvas').children('ul').removeClass('moves-out');
  });

  $('.navbar .btn-save').click(function () {
    $(this).closest('.dropdown-menu').hide();
  });

  $('.navbar .dropdown-hover button').click(function () {
    $(this).siblings('.dropdown-menu').show();
  });
})(jQuery);
// necessary variables
var map;
var infoWindow;
var markerCluster;

// markersData variable stores the information necessary to each marker
var markersData = [{
    lat: 40.6386333,
    lng: -8.745,
    name: "Bohemian",
    address1: "485 Clawson St, Staten Island, NY 10306",
    address2: "Praia da Barra",
    postalCode: "3830-772 Gafanha da Nazaré" // don't insert comma in the last item of each marker
}];

function initialize() {
    var mapOptions = {
        center: new google.maps.LatLng(40.601203, -8.668173),
        zoom: 9,
        mapTypeId: 'roadmap',
        scrollwheel: false,
        styles: [{ "featureType": "administrative", "elementType": "labels.text.fill", "stylers": [{ "color": "#444444" }] }, { "featureType": "landscape", "elementType": "all", "stylers": [{ "color": "#e0e0e0" }] }, { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] }, { "featureType": "road", "elementType": "all", "stylers": [{ "saturation": -100 }, { "lightness": 45 }] }, { "featureType": "road.highway", "elementType": "all", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "road.arterial", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] }, { "featureType": "transit", "elementType": "all", "stylers": [{ "visibility": "off" }] }, { "featureType": "water", "elementType": "all", "stylers": [{ "color": "#46bcec" }, { "visibility": "on" }] }]
    };

    var mapClass = $('.google-map-contact');
    map = new google.maps.Map(mapClass[0], mapOptions);

    // a new Info Window is created
    infoWindow = new google.maps.InfoWindow({
        padding: 0,
        borderRadius: 5
    });

    // Event that closes the Info Window with a click on the map
    google.maps.event.addListener(map, 'click', function () {
        infoWindow.close();
    });

    // Finally displayMarkers() function is called to begin the markers creation
    displayMarkers();
}
google.maps.event.addDomListener(window, 'load', initialize);

// This function will iterate over markersData array
// creating markers with createMarker function
function displayMarkers() {

    // this variable sets the map bounds according to markers position
    var bounds = new google.maps.LatLngBounds();

    // for loop traverses markersData array calling createMarker function for each marker
    for (var i = 0; i < markersData.length; i++) {

        var latlng = new google.maps.LatLng(markersData[i].lat, markersData[i].lng);
        var name = markersData[i].name;
        var address1 = markersData[i].address1;
        var address2 = markersData[i].address2;
        var postalCode = markersData[i].postalCode;

        createMarker(latlng, name, address1, address2, postalCode);

        // marker position is added to bounds variable
        bounds.extend(latlng);
    }

    // Finally the bounds variable is used to set the map bounds
    // with fitBounds() function
    map.fitBounds(bounds);
}

// This function creates each marker and it sets their Info Window content
function createMarker(latlng, name, address1, address2, postalCode) {

    var marker = new google.maps.Marker({
        map: map,
        position: latlng,
        title: name,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#ffffff',
            fillOpacity: 1,
            strokeColor: '#ff5b61',
            strokeWeight: 7
        }

    });

    // This event expects a click on a marker
    // When this event is fired the Info Window content is created
    // and the Info Window is opened.

    google.maps.event.addListener(marker, 'click', function () {

        // Creating the content to be inserted in the infowindow
        var iwContent = '<div class="thumbnail listing-item" style="width: 250px;">' + '<div class="caption">' + '<h5 class="text-regular clearfix m-b-n m-t-n">' + '<a href="listing-item.html" class="text-dark">' + name + '</a>' + '</h5>' + '<p class="small open-sans-font text-regular"> ' + address1 + '</p>' + '</div>';

        // including content to the Info Window.
        infoWindow.setContent(iwContent);

        // opening the Info Window in the current map and at the current marker location.
        infoWindow.open(map, marker);
    });
}
// necessary variables
var map;
var infoWindow;
var markerCluster;

// markersData variable stores the information necessary to each marker
var markersData = [{
    lat: 40.6386333,
    lng: -8.745,
    name: "Bohemian",
    address1: "485 Clawson St, Staten Island, NY 10306",
    address2: "Praia da Barra",
    postalCode: "3830-772 Gafanha da Nazaré" // don't insert comma in the last item of each marker
}, {
    lat: 40.59955,
    lng: -8.7498167,
    name: "Bohemian",
    address1: "485 Clawson St, Staten Island, NY 10306",
    address2: "Praia da Costa Nova",
    postalCode: "3830-453 Gafanha da Encarnação" // don't insert comma in the last item of each marker
}, {
    lat: 40.6247167,
    lng: -8.7129167,
    name: "Bohemian",
    address1: "485 Clawson St, Staten Island, NY 10306",
    address2: "Gafanha da Nazaré",
    postalCode: "3830-225 Gafanha da Nazaré" // don't insert comma in the last item of each marker
    // don't insert comma in the last item
}];

function initialize() {
    var mapOptions = {
        center: new google.maps.LatLng(40.601203, -8.668173),
        zoom: 9,
        mapTypeId: 'roadmap',
        styles: [{ "featureType": "administrative", "elementType": "labels.text.fill", "stylers": [{ "color": "#444444" }] }, { "featureType": "landscape", "elementType": "all", "stylers": [{ "color": "#e0e0e0" }] }, { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] }, { "featureType": "road", "elementType": "all", "stylers": [{ "saturation": -100 }, { "lightness": 45 }] }, { "featureType": "road.highway", "elementType": "all", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "road.arterial", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] }, { "featureType": "transit", "elementType": "all", "stylers": [{ "visibility": "off" }] }, { "featureType": "water", "elementType": "all", "stylers": [{ "color": "#46bcec" }, { "visibility": "on" }] }]
    };

    var mapClass = $('.google-map');
    map = new google.maps.Map(mapClass[0], mapOptions);

    // a new Info Window is created
    infoWindow = new google.maps.InfoWindow({
        padding: 0,
        borderRadius: 5
    });

    // Event that closes the Info Window with a click on the map
    google.maps.event.addListener(map, 'click', function () {
        infoWindow.close();
    });

    // Finally displayMarkers() function is called to begin the markers creation
    displayMarkers();
}
google.maps.event.addDomListener(window, 'load', initialize);

// This function will iterate over markersData array
// creating markers with createMarker function
function displayMarkers() {

    // this variable sets the map bounds according to markers position
    var bounds = new google.maps.LatLngBounds();

    // for loop traverses markersData array calling createMarker function for each marker
    for (var i = 0; i < markersData.length; i++) {

        var latlng = new google.maps.LatLng(markersData[i].lat, markersData[i].lng);
        var name = markersData[i].name;
        var address1 = markersData[i].address1;
        var address2 = markersData[i].address2;
        var postalCode = markersData[i].postalCode;

        createMarker(latlng, name, address1, address2, postalCode);

        // marker position is added to bounds variable
        bounds.extend(latlng);
    }

    // Finally the bounds variable is used to set the map bounds
    // with fitBounds() function
    map.fitBounds(bounds);
}

// This function creates each marker and it sets their Info Window content
function createMarker(latlng, name, address1, address2, postalCode) {

    var marker = new google.maps.Marker({
        map: map,
        position: latlng,
        title: name,
        icon: {
            url: "images/map-marker.png"
        }

    });

    // This event expects a click on a marker
    // When this event is fired the Info Window content is created
    // and the Info Window is opened.

    google.maps.event.addListener(marker, 'click', function () {

        // Creating the content to be inserted in the infowindow
        var iwContent = '<div class="thumbnail listing-item" style="width: 250px;">' + '<a href="listing-item.html" class="thumbnail-img">' + '<img src="images/listing-item-sm-1.jpg" alt="img" class="img-responsive">' + '<div class="thumbnail-info smaller text-right">' + '<span class="label label-primary label">Featured</span>' + '</div>' + '</a>' + '<div class="caption">' + '<h5 class="text-regular clearfix m-b-n m-t-n">' + '<a href="listing-item.html" class="text-dark">' + name + '</a>' + '</h5>' + '<p class="small open-sans-font text-regular"> ' + address1 + '</p>' + '</div>';

        // including content to the Info Window.
        infoWindow.setContent(iwContent);

        // opening the Info Window in the current map and at the current marker location.
        infoWindow.open(map, marker);
    });
}
// bootstrap-rating - v1.4.0 - (c) 2016 dreyescat 
// https://github.com/dreyescat/bootstrap-rating MIT
!function (a, b) {
  "use strict";
  function c(c, e) {
    this.$input = a(c), this.$rating = a("<span></span>").css({ cursor: "default" }).insertBefore(this.$input), this.options = function (c) {
      return c.start = parseInt(c.start, 10), c.start = isNaN(c.start) ? b : c.start, c.stop = parseInt(c.stop, 10), c.stop = isNaN(c.stop) ? c.start + d || b : c.stop, c.step = parseInt(c.step, 10) || b, c.fractions = Math.abs(parseInt(c.fractions, 10)) || b, c.scale = Math.abs(parseInt(c.scale, 10)) || b, c = a.extend({}, a.fn.rating.defaults, c), c.filledSelected = c.filledSelected || c.filled, c;
    }(a.extend({}, this.$input.data(), e)), this._init();
  }var d = 5;c.prototype = { _init: function () {
      for (var c = this, d = this.$input, e = this.$rating, f = function (a) {
        return function (c) {
          d.prop("disabled") || d.prop("readonly") || d.data("readonly") !== b || a.call(this, c);
        };
      }, g = 1; g <= this._rateToIndex(this.options.stop); g++) {
        var h = a('<div class="rating-symbol"></div>').css({ display: "inline-block", position: "relative" });a('<div class="rating-symbol-background ' + this.options.empty + '"></div>').appendTo(h), a('<div class="rating-symbol-foreground"></div>').append("<span></span>").css({ display: "inline-block", position: "absolute", overflow: "hidden", left: 0, right: 0, width: 0 }).appendTo(h), e.append(h), this.options.extendSymbol.call(h, this._indexToRate(g));
      }this._updateRate(d.val()), d.on("change", function () {
        c._updateRate(a(this).val());
      });var i,
          j = function (b) {
        var d = a(b.currentTarget),
            e = Math.abs((b.pageX || b.originalEvent.touches[0].pageX) - (("rtl" === d.css("direction") && d.width()) + d.offset().left));return e = e > 0 ? e : .1 * c.options.scale, d.index() + e / d.width();
      };e.on("mousedown touchstart", ".rating-symbol", f(function (a) {
        d.val(c._indexToRate(j(a))).change();
      })).on("mousemove touchmove", ".rating-symbol", f(function (d) {
        var e = c._roundToFraction(j(d));e !== i && (i !== b && a(this).trigger("rating.rateleave"), i = e, a(this).trigger("rating.rateenter", [c._indexToRate(i)])), c._fillUntil(e);
      })).on("mouseleave touchend", ".rating-symbol", f(function () {
        i = b, a(this).trigger("rating.rateleave"), c._fillUntil(c._rateToIndex(parseFloat(d.val())));
      }));
    }, _fillUntil: function (a) {
      var b = this.$rating,
          c = Math.floor(a);b.find(".rating-symbol-background").css("visibility", "visible").slice(0, c).css("visibility", "hidden");var d = b.find(".rating-symbol-foreground");d.width(0), d.slice(0, c).width("auto").find("span").attr("class", this.options.filled), d.eq(a % 1 ? c : c - 1).find("span").attr("class", this.options.filledSelected), d.eq(c).width(a % 1 * 100 + "%");
    }, _indexToRate: function (a) {
      return this.options.start + Math.floor(a) * this.options.step + this.options.step * this._roundToFraction(a % 1);
    }, _rateToIndex: function (a) {
      return (a - this.options.start) / this.options.step;
    }, _roundToFraction: function (a) {
      var b = Math.ceil(a % 1 * this.options.fractions) / this.options.fractions,
          c = Math.pow(10, this.options.scale);return Math.floor(a) + Math.floor(b * c) / c;
    }, _contains: function (a) {
      var b = this.options.step > 0 ? this.options.start : this.options.stop,
          c = this.options.step > 0 ? this.options.stop : this.options.start;return b <= a && a <= c;
    }, _updateRate: function (a) {
      var b = parseFloat(a);this._contains(b) ? (this._fillUntil(this._rateToIndex(b)), this.$input.val(b)) : "" === a && (this._fillUntil(0), this.$input.val(""));
    }, rate: function (a) {
      return a === b ? this.$input.val() : void this._updateRate(a);
    } }, a.fn.rating = function (d) {
    var e,
        f = Array.prototype.slice.call(arguments, 1);return this.each(function () {
      var b = a(this),
          g = b.data("rating");g || b.data("rating", g = new c(this, d)), "string" == typeof d && "_" !== d[0] && (e = g[d].apply(g, f));
    }), e !== b ? e : this;
  }, a.fn.rating.defaults = { filled: "glyphicon glyphicon-star", filledSelected: b, empty: "glyphicon glyphicon-star-empty", start: 0, stop: d, step: 1, fractions: 1, scale: 3, extendSymbol: function (a) {} }, a(function () {
    a("input.rating").rating();
  });
}(jQuery);
/*!
 * Bootstrap-select v1.11.2 (http://silviomoreto.github.io/bootstrap-select)
 *
 * Copyright 2013-2016 bootstrap-select
 * Licensed under MIT (https://github.com/silviomoreto/bootstrap-select/blob/master/LICENSE)
 */
!function (a, b) {
  "function" == typeof define && define.amd ? define(["jquery"], function (a) {
    return b(a);
  }) : "object" == typeof exports ? module.exports = b(require("jquery")) : b(jQuery);
}(this, function (a) {
  !function (a) {
    "use strict";
    function b(b) {
      var c = [{ re: /[\xC0-\xC6]/g, ch: "A" }, { re: /[\xE0-\xE6]/g, ch: "a" }, { re: /[\xC8-\xCB]/g, ch: "E" }, { re: /[\xE8-\xEB]/g, ch: "e" }, { re: /[\xCC-\xCF]/g, ch: "I" }, { re: /[\xEC-\xEF]/g, ch: "i" }, { re: /[\xD2-\xD6]/g, ch: "O" }, { re: /[\xF2-\xF6]/g, ch: "o" }, { re: /[\xD9-\xDC]/g, ch: "U" }, { re: /[\xF9-\xFC]/g, ch: "u" }, { re: /[\xC7-\xE7]/g, ch: "c" }, { re: /[\xD1]/g, ch: "N" }, { re: /[\xF1]/g, ch: "n" }];return a.each(c, function () {
        b = b.replace(this.re, this.ch);
      }), b;
    }function c(a) {
      var b = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;", "`": "&#x60;" },
          c = "(?:" + Object.keys(b).join("|") + ")",
          d = new RegExp(c),
          e = new RegExp(c, "g"),
          f = null == a ? "" : "" + a;return d.test(f) ? f.replace(e, function (a) {
        return b[a];
      }) : f;
    }function d(b, c) {
      var d = arguments,
          e = b,
          f = c;[].shift.apply(d);var h,
          i = this.each(function () {
        var b = a(this);if (b.is("select")) {
          var c = b.data("selectpicker"),
              i = "object" == typeof e && e;if (c) {
            if (i) for (var j in i) i.hasOwnProperty(j) && (c.options[j] = i[j]);
          } else {
            var k = a.extend({}, g.DEFAULTS, a.fn.selectpicker.defaults || {}, b.data(), i);k.template = a.extend({}, g.DEFAULTS.template, a.fn.selectpicker.defaults ? a.fn.selectpicker.defaults.template : {}, b.data().template, i.template), b.data("selectpicker", c = new g(this, k, f));
          }"string" == typeof e && (h = c[e] instanceof Function ? c[e].apply(c, d) : c.options[e]);
        }
      });return "undefined" != typeof h ? h : i;
    }String.prototype.includes || !function () {
      var a = {}.toString,
          b = function () {
        try {
          var a = {},
              b = Object.defineProperty,
              c = b(a, a, a) && b;
        } catch (d) {}return c;
      }(),
          c = "".indexOf,
          d = function (b) {
        if (null == this) throw new TypeError();var d = String(this);if (b && "[object RegExp]" == a.call(b)) throw new TypeError();var e = d.length,
            f = String(b),
            g = f.length,
            h = arguments.length > 1 ? arguments[1] : void 0,
            i = h ? Number(h) : 0;i != i && (i = 0);var j = Math.min(Math.max(i, 0), e);return g + j > e ? !1 : -1 != c.call(d, f, i);
      };b ? b(String.prototype, "includes", { value: d, configurable: !0, writable: !0 }) : String.prototype.includes = d;
    }(), String.prototype.startsWith || !function () {
      var a = function () {
        try {
          var a = {},
              b = Object.defineProperty,
              c = b(a, a, a) && b;
        } catch (d) {}return c;
      }(),
          b = {}.toString,
          c = function (a) {
        if (null == this) throw new TypeError();var c = String(this);if (a && "[object RegExp]" == b.call(a)) throw new TypeError();var d = c.length,
            e = String(a),
            f = e.length,
            g = arguments.length > 1 ? arguments[1] : void 0,
            h = g ? Number(g) : 0;h != h && (h = 0);var i = Math.min(Math.max(h, 0), d);if (f + i > d) return !1;for (var j = -1; ++j < f;) if (c.charCodeAt(i + j) != e.charCodeAt(j)) return !1;return !0;
      };a ? a(String.prototype, "startsWith", { value: c, configurable: !0, writable: !0 }) : String.prototype.startsWith = c;
    }(), Object.keys || (Object.keys = function (a, b, c) {
      c = [];for (b in a) c.hasOwnProperty.call(a, b) && c.push(b);return c;
    });var e = { useDefault: !1, _set: a.valHooks.select.set };a.valHooks.select.set = function (b, c) {
      return c && !e.useDefault && a(b).data("selected", !0), e._set.apply(this, arguments);
    };var f = null;a.fn.triggerNative = function (a) {
      var b,
          c = this[0];c.dispatchEvent ? ("function" == typeof Event ? b = new Event(a, { bubbles: !0 }) : (b = document.createEvent("Event"), b.initEvent(a, !0, !1)), c.dispatchEvent(b)) : c.fireEvent ? (b = document.createEventObject(), b.eventType = a, c.fireEvent("on" + a, b)) : this.trigger(a);
    }, a.expr.pseudos.icontains = function (b, c, d) {
      var e = a(b),
          f = (e.data("tokens") || e.text()).toString().toUpperCase();return f.includes(d[3].toUpperCase());
    }, a.expr.pseudos.ibegins = function (b, c, d) {
      var e = a(b),
          f = (e.data("tokens") || e.text()).toString().toUpperCase();return f.startsWith(d[3].toUpperCase());
    }, a.expr.pseudos.aicontains = function (b, c, d) {
      var e = a(b),
          f = (e.data("tokens") || e.data("normalizedText") || e.text()).toString().toUpperCase();return f.includes(d[3].toUpperCase());
    }, a.expr.pseudos.aibegins = function (b, c, d) {
      var e = a(b),
          f = (e.data("tokens") || e.data("normalizedText") || e.text()).toString().toUpperCase();return f.startsWith(d[3].toUpperCase());
    };var g = function (b, c, d) {
      e.useDefault || (a.valHooks.select.set = e._set, e.useDefault = !0), d && (d.stopPropagation(), d.preventDefault()), this.$element = a(b), this.$newElement = null, this.$button = null, this.$menu = null, this.$lis = null, this.options = c, null === this.options.title && (this.options.title = this.$element.attr("title")), this.val = g.prototype.val, this.render = g.prototype.render, this.refresh = g.prototype.refresh, this.setStyle = g.prototype.setStyle, this.selectAll = g.prototype.selectAll, this.deselectAll = g.prototype.deselectAll, this.destroy = g.prototype.destroy, this.remove = g.prototype.remove, this.show = g.prototype.show, this.hide = g.prototype.hide, this.init();
    };g.VERSION = "1.11.2", g.DEFAULTS = { noneSelectedText: "Nothing selected", noneResultsText: "No results matched {0}", countSelectedText: function (a, b) {
        return 1 == a ? "{0} item selected" : "{0} items selected";
      }, maxOptionsText: function (a, b) {
        return [1 == a ? "Limit reached ({n} item max)" : "Limit reached ({n} items max)", 1 == b ? "Group limit reached ({n} item max)" : "Group limit reached ({n} items max)"];
      }, selectAllText: "Select All", deselectAllText: "Deselect All", doneButton: !1, doneButtonText: "Close", multipleSeparator: ", ", styleBase: "btn", style: "btn-default", size: "auto", title: null, selectedTextFormat: "values", width: !1, container: !1, hideDisabled: !1, showSubtext: !1, showIcon: !0, showContent: !0, dropupAuto: !0, header: !1, liveSearch: !1, liveSearchPlaceholder: null, liveSearchNormalize: !1, liveSearchStyle: "contains", actionsBox: !1, iconBase: "glyphicon", tickIcon: "glyphicon-ok", showTick: !1, template: { caret: '<span class="caret"></span>' }, maxOptions: !1, mobile: !1, selectOnTab: !1, dropdownAlignRight: !1 }, g.prototype = { constructor: g, init: function () {
        var b = this,
            c = this.$element.attr("id");this.$element.addClass("bs-select-hidden"), this.liObj = {}, this.multiple = this.$element.prop("multiple"), this.autofocus = this.$element.prop("autofocus"), this.$newElement = this.createView(), this.$element.after(this.$newElement).appendTo(this.$newElement), this.$button = this.$newElement.children("button"), this.$menu = this.$newElement.children(".dropdown-menu"), this.$menuInner = this.$menu.children(".inner"), this.$searchbox = this.$menu.find("input"), this.$element.removeClass("bs-select-hidden"), this.options.dropdownAlignRight === !0 && this.$menu.addClass("dropdown-menu-right"), "undefined" != typeof c && (this.$button.attr("data-id", c), a('label[for="' + c + '"]').click(function (a) {
          a.preventDefault(), b.$button.focus();
        })), this.checkDisabled(), this.clickListener(), this.options.liveSearch && this.liveSearchListener(), this.render(), this.setStyle(), this.setWidth(), this.options.container && this.selectPosition(), this.$menu.data("this", this), this.$newElement.data("this", this), this.options.mobile && this.mobile(), this.$newElement.on({ "hide.bs.dropdown": function (a) {
            b.$menuInner.attr("aria-expanded", !1), b.$element.trigger("hide.bs.select", a);
          }, "hidden.bs.dropdown": function (a) {
            b.$element.trigger("hidden.bs.select", a);
          }, "show.bs.dropdown": function (a) {
            b.$menuInner.attr("aria-expanded", !0), b.$element.trigger("show.bs.select", a);
          }, "shown.bs.dropdown": function (a) {
            b.$element.trigger("shown.bs.select", a);
          } }), b.$element[0].hasAttribute("required") && this.$element.on("invalid", function () {
          b.$button.addClass("bs-invalid").focus(), b.$element.on({ "focus.bs.select": function () {
              b.$button.focus(), b.$element.off("focus.bs.select");
            }, "shown.bs.select": function () {
              b.$element.val(b.$element.val()).off("shown.bs.select");
            }, "rendered.bs.select": function () {
              this.validity.valid && b.$button.removeClass("bs-invalid"), b.$element.off("rendered.bs.select");
            } });
        }), setTimeout(function () {
          b.$element.trigger("loaded.bs.select");
        });
      }, createDropdown: function () {
        var b = this.multiple || this.options.showTick ? " show-tick" : "",
            d = this.$element.parent().hasClass("input-group") ? " input-group-btn" : "",
            e = this.autofocus ? " autofocus" : "",
            f = this.options.header ? '<div class="popover-title"><button type="button" class="close" aria-hidden="true">&times;</button>' + this.options.header + "</div>" : "",
            g = this.options.liveSearch ? '<div class="bs-searchbox"><input type="text" class="form-control" autocomplete="off"' + (null === this.options.liveSearchPlaceholder ? "" : ' placeholder="' + c(this.options.liveSearchPlaceholder) + '"') + ' role="textbox" aria-label="Search"></div>' : "",
            h = this.multiple && this.options.actionsBox ? '<div class="bs-actionsbox"><div class="btn-group btn-group-sm btn-block"><button type="button" class="actions-btn bs-select-all btn btn-default">' + this.options.selectAllText + '</button><button type="button" class="actions-btn bs-deselect-all btn btn-default">' + this.options.deselectAllText + "</button></div></div>" : "",
            i = this.multiple && this.options.doneButton ? '<div class="bs-donebutton"><div class="btn-group btn-block"><button type="button" class="btn btn-sm btn-default">' + this.options.doneButtonText + "</button></div></div>" : "",
            j = '<div class="btn-group bootstrap-select' + b + d + '"><button type="button" class="' + this.options.styleBase + ' dropdown-toggle" data-toggle="dropdown"' + e + ' role="button"><span class="filter-option pull-left"></span>&nbsp;<span class="bs-caret">' + this.options.template.caret + '</span></button><div class="dropdown-menu open" role="combobox">' + f + g + h + '<ul class="dropdown-menu inner" role="listbox" aria-expanded="false"></ul>' + i + "</div></div>";return a(j);
      }, createView: function () {
        var a = this.createDropdown(),
            b = this.createLi();return a.find("ul")[0].innerHTML = b, a;
      }, reloadLi: function () {
        this.destroyLi();var a = this.createLi();this.$menuInner[0].innerHTML = a;
      }, destroyLi: function () {
        this.$menu.find("li").remove();
      }, createLi: function () {
        var d = this,
            e = [],
            f = 0,
            g = document.createElement("option"),
            h = -1,
            i = function (a, b, c, d) {
          return "<li" + ("undefined" != typeof c & "" !== c ? ' class="' + c + '"' : "") + ("undefined" != typeof b & null !== b ? ' data-original-index="' + b + '"' : "") + ("undefined" != typeof d & null !== d ? 'data-optgroup="' + d + '"' : "") + ">" + a + "</li>";
        },
            j = function (a, e, f, g) {
          return '<a tabindex="0"' + ("undefined" != typeof e ? ' class="' + e + '"' : "") + ("undefined" != typeof f ? ' style="' + f + '"' : "") + (d.options.liveSearchNormalize ? ' data-normalized-text="' + b(c(a)) + '"' : "") + ("undefined" != typeof g || null !== g ? ' data-tokens="' + g + '"' : "") + ' role="option">' + a + '<span class="' + d.options.iconBase + " " + d.options.tickIcon + ' check-mark"></span></a>';
        };if (this.options.title && !this.multiple && (h--, !this.$element.find(".bs-title-option").length)) {
          var k = this.$element[0];g.className = "bs-title-option", g.appendChild(document.createTextNode(this.options.title)), g.value = "", k.insertBefore(g, k.firstChild);var l = a(k.options[k.selectedIndex]);void 0 === l.attr("selected") && void 0 === this.$element.data("selected") && (g.selected = !0);
        }return this.$element.find("option").each(function (b) {
          var c = a(this);if (h++, !c.hasClass("bs-title-option")) {
            var g = this.className || "",
                k = this.style.cssText,
                l = c.data("content") ? c.data("content") : c.html(),
                m = c.data("tokens") ? c.data("tokens") : null,
                n = "undefined" != typeof c.data("subtext") ? '<small class="text-muted">' + c.data("subtext") + "</small>" : "",
                o = "undefined" != typeof c.data("icon") ? '<span class="' + d.options.iconBase + " " + c.data("icon") + '"></span> ' : "",
                p = c.parent(),
                q = "OPTGROUP" === p[0].tagName,
                r = q && p[0].disabled,
                s = this.disabled || r;if ("" !== o && s && (o = "<span>" + o + "</span>"), d.options.hideDisabled && (s && !q || r)) return void h--;if (c.data("content") || (l = o + '<span class="text">' + l + n + "</span>"), q && c.data("divider") !== !0) {
              if (d.options.hideDisabled && s) {
                if (void 0 === p.data("allOptionsDisabled")) {
                  var t = p.children();p.data("allOptionsDisabled", t.filter(":disabled").length === t.length);
                }if (p.data("allOptionsDisabled")) return void h--;
              }var u = " " + p[0].className || "";if (0 === c.index()) {
                f += 1;var v = p[0].label,
                    w = "undefined" != typeof p.data("subtext") ? '<small class="text-muted">' + p.data("subtext") + "</small>" : "",
                    x = p.data("icon") ? '<span class="' + d.options.iconBase + " " + p.data("icon") + '"></span> ' : "";v = x + '<span class="text">' + v + w + "</span>", 0 !== b && e.length > 0 && (h++, e.push(i("", null, "divider", f + "div"))), h++, e.push(i(v, null, "dropdown-header" + u, f));
              }if (d.options.hideDisabled && s) return void h--;e.push(i(j(l, "opt " + g + u, k, m), b, "", f));
            } else if (c.data("divider") === !0) e.push(i("", b, "divider"));else if (c.data("hidden") === !0) e.push(i(j(l, g, k, m), b, "hidden is-hidden"));else {
              var y = this.previousElementSibling && "OPTGROUP" === this.previousElementSibling.tagName;if (!y && d.options.hideDisabled) for (var z = a(this).prevAll(), A = 0; A < z.length; A++) if ("OPTGROUP" === z[A].tagName) {
                for (var B = 0, C = 0; A > C; C++) {
                  var D = z[C];(D.disabled || a(D).data("hidden") === !0) && B++;
                }B === A && (y = !0);break;
              }y && (h++, e.push(i("", null, "divider", f + "div"))), e.push(i(j(l, g, k, m), b));
            }d.liObj[b] = h;
          }
        }), this.multiple || 0 !== this.$element.find("option:selected").length || this.options.title || this.$element.find("option").eq(0).prop("selected", !0).attr("selected", "selected"), e.join("");
      }, findLis: function () {
        return null == this.$lis && (this.$lis = this.$menu.find("li")), this.$lis;
      }, render: function (b) {
        var c,
            d = this;b !== !1 && this.$element.find("option").each(function (a) {
          var b = d.findLis().eq(d.liObj[a]);d.setDisabled(a, this.disabled || "OPTGROUP" === this.parentNode.tagName && this.parentNode.disabled, b), d.setSelected(a, this.selected, b);
        }), this.togglePlaceholder(), this.tabIndex();var e = this.$element.find("option").map(function () {
          if (this.selected) {
            if (d.options.hideDisabled && (this.disabled || "OPTGROUP" === this.parentNode.tagName && this.parentNode.disabled)) return;var b,
                c = a(this),
                e = c.data("icon") && d.options.showIcon ? '<i class="' + d.options.iconBase + " " + c.data("icon") + '"></i> ' : "";return b = d.options.showSubtext && c.data("subtext") && !d.multiple ? ' <small class="text-muted">' + c.data("subtext") + "</small>" : "", "undefined" != typeof c.attr("title") ? c.attr("title") : c.data("content") && d.options.showContent ? c.data("content") : e + c.html() + b;
          }
        }).toArray(),
            f = this.multiple ? e.join(this.options.multipleSeparator) : e[0];if (this.multiple && this.options.selectedTextFormat.indexOf("count") > -1) {
          var g = this.options.selectedTextFormat.split(">");if (g.length > 1 && e.length > g[1] || 1 == g.length && e.length >= 2) {
            c = this.options.hideDisabled ? ", [disabled]" : "";var h = this.$element.find("option").not('[data-divider="true"], [data-hidden="true"]' + c).length,
                i = "function" == typeof this.options.countSelectedText ? this.options.countSelectedText(e.length, h) : this.options.countSelectedText;f = i.replace("{0}", e.length.toString()).replace("{1}", h.toString());
          }
        }void 0 == this.options.title && (this.options.title = this.$element.attr("title")), "static" == this.options.selectedTextFormat && (f = this.options.title), f || (f = "undefined" != typeof this.options.title ? this.options.title : this.options.noneSelectedText), this.$button.attr("title", a.trim(f.replace(/<[^>]*>?/g, ""))), this.$button.children(".filter-option").html(f), this.$element.trigger("rendered.bs.select");
      }, setStyle: function (a, b) {
        this.$element.attr("class") && this.$newElement.addClass(this.$element.attr("class").replace(/selectpicker|mobile-device|bs-select-hidden|validate\[.*\]/gi, ""));var c = a ? a : this.options.style;"add" == b ? this.$button.addClass(c) : "remove" == b ? this.$button.removeClass(c) : (this.$button.removeClass(this.options.style), this.$button.addClass(c));
      }, liHeight: function (b) {
        if (b || this.options.size !== !1 && !this.sizeInfo) {
          var c = document.createElement("div"),
              d = document.createElement("div"),
              e = document.createElement("ul"),
              f = document.createElement("li"),
              g = document.createElement("li"),
              h = document.createElement("a"),
              i = document.createElement("span"),
              j = this.options.header && this.$menu.find(".popover-title").length > 0 ? this.$menu.find(".popover-title")[0].cloneNode(!0) : null,
              k = this.options.liveSearch ? document.createElement("div") : null,
              l = this.options.actionsBox && this.multiple && this.$menu.find(".bs-actionsbox").length > 0 ? this.$menu.find(".bs-actionsbox")[0].cloneNode(!0) : null,
              m = this.options.doneButton && this.multiple && this.$menu.find(".bs-donebutton").length > 0 ? this.$menu.find(".bs-donebutton")[0].cloneNode(!0) : null;if (i.className = "text", c.className = this.$menu[0].parentNode.className + " open", d.className = "dropdown-menu open", e.className = "dropdown-menu inner", f.className = "divider", i.appendChild(document.createTextNode("Inner text")), h.appendChild(i), g.appendChild(h), e.appendChild(g), e.appendChild(f), j && d.appendChild(j), k) {
            var n = document.createElement("span");k.className = "bs-searchbox", n.className = "form-control", k.appendChild(n), d.appendChild(k);
          }l && d.appendChild(l), d.appendChild(e), m && d.appendChild(m), c.appendChild(d), document.body.appendChild(c);var o = h.offsetHeight,
              p = j ? j.offsetHeight : 0,
              q = k ? k.offsetHeight : 0,
              r = l ? l.offsetHeight : 0,
              s = m ? m.offsetHeight : 0,
              t = a(f).outerHeight(!0),
              u = "function" == typeof getComputedStyle ? getComputedStyle(d) : !1,
              v = u ? null : a(d),
              w = { vert: parseInt(u ? u.paddingTop : v.css("paddingTop")) + parseInt(u ? u.paddingBottom : v.css("paddingBottom")) + parseInt(u ? u.borderTopWidth : v.css("borderTopWidth")) + parseInt(u ? u.borderBottomWidth : v.css("borderBottomWidth")), horiz: parseInt(u ? u.paddingLeft : v.css("paddingLeft")) + parseInt(u ? u.paddingRight : v.css("paddingRight")) + parseInt(u ? u.borderLeftWidth : v.css("borderLeftWidth")) + parseInt(u ? u.borderRightWidth : v.css("borderRightWidth")) },
              x = { vert: w.vert + parseInt(u ? u.marginTop : v.css("marginTop")) + parseInt(u ? u.marginBottom : v.css("marginBottom")) + 2, horiz: w.horiz + parseInt(u ? u.marginLeft : v.css("marginLeft")) + parseInt(u ? u.marginRight : v.css("marginRight")) + 2 };document.body.removeChild(c), this.sizeInfo = { liHeight: o, headerHeight: p, searchHeight: q, actionsHeight: r, doneButtonHeight: s, dividerHeight: t, menuPadding: w, menuExtras: x };
        }
      }, setSize: function () {
        if (this.findLis(), this.liHeight(), this.options.header && this.$menu.css("padding-top", 0), this.options.size !== !1) {
          var b,
              c,
              d,
              e,
              f,
              g,
              h,
              i,
              j = this,
              k = this.$menu,
              l = this.$menuInner,
              m = a(window),
              n = this.$newElement[0].offsetHeight,
              o = this.$newElement[0].offsetWidth,
              p = this.sizeInfo.liHeight,
              q = this.sizeInfo.headerHeight,
              r = this.sizeInfo.searchHeight,
              s = this.sizeInfo.actionsHeight,
              t = this.sizeInfo.doneButtonHeight,
              u = this.sizeInfo.dividerHeight,
              v = this.sizeInfo.menuPadding,
              w = this.sizeInfo.menuExtras,
              x = this.options.hideDisabled ? ".disabled" : "",
              y = function () {
            var b,
                c = j.$newElement.offset(),
                d = a(j.options.container);j.options.container && !d.is("body") ? (b = d.offset(), b.top += parseInt(d.css("borderTopWidth")), b.left += parseInt(d.css("borderLeftWidth"))) : b = { top: 0, left: 0 }, f = c.top - b.top - m.scrollTop(), g = m.height() - f - n - b.top, h = c.left - b.left - m.scrollLeft(), i = m.width() - h - o - b.left;
          };if (y(), "auto" === this.options.size) {
            var z = function () {
              var m,
                  n = function (b, c) {
                return function (d) {
                  return c ? d.classList ? d.classList.contains(b) : a(d).hasClass(b) : !(d.classList ? d.classList.contains(b) : a(d).hasClass(b));
                };
              },
                  u = j.$menuInner[0].getElementsByTagName("li"),
                  x = Array.prototype.filter ? Array.prototype.filter.call(u, n("hidden", !1)) : j.$lis.not(".hidden"),
                  z = Array.prototype.filter ? Array.prototype.filter.call(x, n("dropdown-header", !0)) : x.filter(".dropdown-header");y(), b = g - w.vert, c = i - w.horiz, j.options.container ? (k.data("height") || k.data("height", k.height()), d = k.data("height"), k.data("width") || k.data("width", k.width()), e = k.data("width")) : (d = k.height(), e = k.width()), j.options.dropupAuto && j.$newElement.toggleClass("dropup", f > g && b - w.vert < d), j.$newElement.hasClass("dropup") && (b = f - w.vert), "auto" === j.options.dropdownAlignRight && k.toggleClass("dropdown-menu-right", h > i && c - w.horiz < e - o), m = x.length + z.length > 3 ? 3 * p + w.vert - 2 : 0, k.css({ "max-height": b + "px", overflow: "hidden", "min-height": m + q + r + s + t + "px" }), l.css({ "max-height": b - q - r - s - t - v.vert + "px", "overflow-y": "auto", "min-height": Math.max(m - v.vert, 0) + "px" });
            };z(), this.$searchbox.off("input.getSize propertychange.getSize").on("input.getSize propertychange.getSize", z), m.off("resize.getSize scroll.getSize").on("resize.getSize scroll.getSize", z);
          } else if (this.options.size && "auto" != this.options.size && this.$lis.not(x).length > this.options.size) {
            var A = this.$lis.not(".divider").not(x).children().slice(0, this.options.size).last().parent().index(),
                B = this.$lis.slice(0, A + 1).filter(".divider").length;b = p * this.options.size + B * u + v.vert, j.options.container ? (k.data("height") || k.data("height", k.height()), d = k.data("height")) : d = k.height(), j.options.dropupAuto && this.$newElement.toggleClass("dropup", f > g && b - w.vert < d), k.css({ "max-height": b + q + r + s + t + "px", overflow: "hidden", "min-height": "" }), l.css({ "max-height": b - v.vert + "px", "overflow-y": "auto", "min-height": "" });
          }
        }
      }, setWidth: function () {
        if ("auto" === this.options.width) {
          this.$menu.css("min-width", "0");var a = this.$menu.parent().clone().appendTo("body"),
              b = this.options.container ? this.$newElement.clone().appendTo("body") : a,
              c = a.children(".dropdown-menu").outerWidth(),
              d = b.css("width", "auto").children("button").outerWidth();a.remove(), b.remove(), this.$newElement.css("width", Math.max(c, d) + "px");
        } else "fit" === this.options.width ? (this.$menu.css("min-width", ""), this.$newElement.css("width", "").addClass("fit-width")) : this.options.width ? (this.$menu.css("min-width", ""), this.$newElement.css("width", this.options.width)) : (this.$menu.css("min-width", ""), this.$newElement.css("width", ""));this.$newElement.hasClass("fit-width") && "fit" !== this.options.width && this.$newElement.removeClass("fit-width");
      }, selectPosition: function () {
        this.$bsContainer = a('<div class="bs-container" />');var b,
            c,
            d,
            e = this,
            f = a(this.options.container),
            g = function (a) {
          e.$bsContainer.addClass(a.attr("class").replace(/form-control|fit-width/gi, "")).toggleClass("dropup", a.hasClass("dropup")), b = a.offset(), f.is("body") ? c = { top: 0, left: 0 } : (c = f.offset(), c.top += parseInt(f.css("borderTopWidth")) - f.scrollTop(), c.left += parseInt(f.css("borderLeftWidth")) - f.scrollLeft()), d = a.hasClass("dropup") ? 0 : a[0].offsetHeight, e.$bsContainer.css({ top: b.top - c.top + d, left: b.left - c.left, width: a[0].offsetWidth });
        };this.$button.on("click", function () {
          var b = a(this);e.isDisabled() || (g(e.$newElement), e.$bsContainer.appendTo(e.options.container).toggleClass("open", !b.hasClass("open")).append(e.$menu));
        }), a(window).on("resize scroll", function () {
          g(e.$newElement);
        }), this.$element.on("hide.bs.select", function () {
          e.$menu.data("height", e.$menu.height()), e.$bsContainer.detach();
        });
      }, setSelected: function (a, b, c) {
        c || (this.togglePlaceholder(), c = this.findLis().eq(this.liObj[a])), c.toggleClass("selected", b).find("a").attr("aria-selected", b);
      }, setDisabled: function (a, b, c) {
        c || (c = this.findLis().eq(this.liObj[a])), b ? c.addClass("disabled").children("a").attr("href", "#").attr("tabindex", -1).attr("aria-disabled", !0) : c.removeClass("disabled").children("a").removeAttr("href").attr("tabindex", 0).attr("aria-disabled", !1);
      }, isDisabled: function () {
        return this.$element[0].disabled;
      }, checkDisabled: function () {
        var a = this;this.isDisabled() ? (this.$newElement.addClass("disabled"), this.$button.addClass("disabled").attr("tabindex", -1)) : (this.$button.hasClass("disabled") && (this.$newElement.removeClass("disabled"), this.$button.removeClass("disabled")), -1 != this.$button.attr("tabindex") || this.$element.data("tabindex") || this.$button.removeAttr("tabindex")), this.$button.click(function () {
          return !a.isDisabled();
        });
      }, togglePlaceholder: function () {
        var a = this.$element.val();this.$button.toggleClass("bs-placeholder", null === a || "" === a);
      }, tabIndex: function () {
        this.$element.data("tabindex") !== this.$element.attr("tabindex") && -98 !== this.$element.attr("tabindex") && "-98" !== this.$element.attr("tabindex") && (this.$element.data("tabindex", this.$element.attr("tabindex")), this.$button.attr("tabindex", this.$element.data("tabindex"))), this.$element.attr("tabindex", -98);
      }, clickListener: function () {
        var b = this,
            c = a(document);this.$newElement.on("touchstart.dropdown", ".dropdown-menu", function (a) {
          a.stopPropagation();
        }), c.data("spaceSelect", !1), this.$button.on("keyup", function (a) {
          /(32)/.test(a.keyCode.toString(10)) && c.data("spaceSelect") && (a.preventDefault(), c.data("spaceSelect", !1));
        }), this.$button.on("click", function () {
          b.setSize();
        }), this.$element.on("shown.bs.select", function () {
          if (b.options.liveSearch || b.multiple) {
            if (!b.multiple) {
              var a = b.liObj[b.$element[0].selectedIndex];if ("number" != typeof a || b.options.size === !1) return;var c = b.$lis.eq(a)[0].offsetTop - b.$menuInner[0].offsetTop;c = c - b.$menuInner[0].offsetHeight / 2 + b.sizeInfo.liHeight / 2, b.$menuInner[0].scrollTop = c;
            }
          } else b.$menuInner.find(".selected a").focus();
        }), this.$menuInner.on("click", "li a", function (c) {
          var d = a(this),
              e = d.parent().data("originalIndex"),
              g = b.$element.val(),
              h = b.$element.prop("selectedIndex"),
              i = !0;if (b.multiple && 1 !== b.options.maxOptions && c.stopPropagation(), c.preventDefault(), !b.isDisabled() && !d.parent().hasClass("disabled")) {
            var j = b.$element.find("option"),
                k = j.eq(e),
                l = k.prop("selected"),
                m = k.parent("optgroup"),
                n = b.options.maxOptions,
                o = m.data("maxOptions") || !1;if (b.multiple) {
              if (k.prop("selected", !l), b.setSelected(e, !l), d.blur(), n !== !1 || o !== !1) {
                var p = n < j.filter(":selected").length,
                    q = o < m.find("option:selected").length;if (n && p || o && q) if (n && 1 == n) j.prop("selected", !1), k.prop("selected", !0), b.$menuInner.find(".selected").removeClass("selected"), b.setSelected(e, !0);else if (o && 1 == o) {
                  m.find("option:selected").prop("selected", !1), k.prop("selected", !0);var r = d.parent().data("optgroup");b.$menuInner.find('[data-optgroup="' + r + '"]').removeClass("selected"), b.setSelected(e, !0);
                } else {
                  var s = "string" == typeof b.options.maxOptionsText ? [b.options.maxOptionsText, b.options.maxOptionsText] : b.options.maxOptionsText,
                      t = "function" == typeof s ? s(n, o) : s,
                      u = t[0].replace("{n}", n),
                      v = t[1].replace("{n}", o),
                      w = a('<div class="notify"></div>');t[2] && (u = u.replace("{var}", t[2][n > 1 ? 0 : 1]), v = v.replace("{var}", t[2][o > 1 ? 0 : 1])), k.prop("selected", !1), b.$menu.append(w), n && p && (w.append(a("<div>" + u + "</div>")), i = !1, b.$element.trigger("maxReached.bs.select")), o && q && (w.append(a("<div>" + v + "</div>")), i = !1, b.$element.trigger("maxReachedGrp.bs.select")), setTimeout(function () {
                    b.setSelected(e, !1);
                  }, 10), w.delay(750).fadeOut(300, function () {
                    a(this).remove();
                  });
                }
              }
            } else j.prop("selected", !1), k.prop("selected", !0), b.$menuInner.find(".selected").removeClass("selected").find("a").attr("aria-selected", !1), b.setSelected(e, !0);!b.multiple || b.multiple && 1 === b.options.maxOptions ? b.$button.focus() : b.options.liveSearch && b.$searchbox.focus(), i && (g != b.$element.val() && b.multiple || h != b.$element.prop("selectedIndex") && !b.multiple) && (f = [e, k.prop("selected"), l], b.$element.triggerNative("change"));
          }
        }), this.$menu.on("click", "li.disabled a, .popover-title, .popover-title :not(.close)", function (c) {
          c.currentTarget == this && (c.preventDefault(), c.stopPropagation(), b.options.liveSearch && !a(c.target).hasClass("close") ? b.$searchbox.focus() : b.$button.focus());
        }), this.$menuInner.on("click", ".divider, .dropdown-header", function (a) {
          a.preventDefault(), a.stopPropagation(), b.options.liveSearch ? b.$searchbox.focus() : b.$button.focus();
        }), this.$menu.on("click", ".popover-title .close", function () {
          b.$button.click();
        }), this.$searchbox.on("click", function (a) {
          a.stopPropagation();
        }), this.$menu.on("click", ".actions-btn", function (c) {
          b.options.liveSearch ? b.$searchbox.focus() : b.$button.focus(), c.preventDefault(), c.stopPropagation(), a(this).hasClass("bs-select-all") ? b.selectAll() : b.deselectAll();
        }), this.$element.change(function () {
          b.render(!1), b.$element.trigger("changed.bs.select", f), f = null;
        });
      }, liveSearchListener: function () {
        var d = this,
            e = a('<li class="no-results"></li>');this.$button.on("click.dropdown.data-api touchstart.dropdown.data-api", function () {
          d.$menuInner.find(".active").removeClass("active"), d.$searchbox.val() && (d.$searchbox.val(""), d.$lis.not(".is-hidden").removeClass("hidden"), e.parent().length && e.remove()), d.multiple || d.$menuInner.find(".selected").addClass("active"), setTimeout(function () {
            d.$searchbox.focus();
          }, 10);
        }), this.$searchbox.on("click.dropdown.data-api focus.dropdown.data-api touchend.dropdown.data-api", function (a) {
          a.stopPropagation();
        }), this.$searchbox.on("input propertychange", function () {
          if (d.$searchbox.val()) {
            var f = d.$lis.not(".is-hidden").removeClass("hidden").children("a");f = d.options.liveSearchNormalize ? f.not(":a" + d._searchStyle() + '("' + b(d.$searchbox.val()) + '")') : f.not(":" + d._searchStyle() + '("' + d.$searchbox.val() + '")'), f.parent().addClass("hidden"), d.$lis.filter(".dropdown-header").each(function () {
              var b = a(this),
                  c = b.data("optgroup");0 === d.$lis.filter("[data-optgroup=" + c + "]").not(b).not(".hidden").length && (b.addClass("hidden"), d.$lis.filter("[data-optgroup=" + c + "div]").addClass("hidden"));
            });var g = d.$lis.not(".hidden");g.each(function (b) {
              var c = a(this);c.hasClass("divider") && (c.index() === g.first().index() || c.index() === g.last().index() || g.eq(b + 1).hasClass("divider")) && c.addClass("hidden");
            }), d.$lis.not(".hidden, .no-results").length ? e.parent().length && e.remove() : (e.parent().length && e.remove(), e.html(d.options.noneResultsText.replace("{0}", '"' + c(d.$searchbox.val()) + '"')).show(), d.$menuInner.append(e));
          } else d.$lis.not(".is-hidden").removeClass("hidden"), e.parent().length && e.remove();d.$lis.filter(".active").removeClass("active"), d.$searchbox.val() && d.$lis.not(".hidden, .divider, .dropdown-header").eq(0).addClass("active").children("a").focus(), a(this).focus();
        });
      }, _searchStyle: function () {
        var a = { begins: "ibegins", startsWith: "ibegins" };return a[this.options.liveSearchStyle] || "icontains";
      }, val: function (a) {
        return "undefined" != typeof a ? (this.$element.val(a), this.render(), this.$element) : this.$element.val();
      }, changeAll: function (b) {
        if (this.multiple) {
          "undefined" == typeof b && (b = !0), this.findLis();var c = this.$element.find("option"),
              d = this.$lis.not(".divider, .dropdown-header, .disabled, .hidden"),
              e = d.length,
              f = [];if (b) {
            if (d.filter(".selected").length === d.length) return;
          } else if (0 === d.filter(".selected").length) return;d.toggleClass("selected", b);for (var g = 0; e > g; g++) {
            var h = d[g].getAttribute("data-original-index");f[f.length] = c.eq(h)[0];
          }a(f).prop("selected", b), this.render(!1), this.togglePlaceholder(), this.$element.triggerNative("change");
        }
      }, selectAll: function () {
        return this.changeAll(!0);
      }, deselectAll: function () {
        return this.changeAll(!1);
      }, toggle: function (a) {
        a = a || window.event, a && a.stopPropagation(), this.$button.trigger("click");
      }, keydown: function (c) {
        var d,
            e,
            f,
            g,
            h,
            i,
            j,
            k,
            l,
            m = a(this),
            n = m.is("input") ? m.parent().parent() : m.parent(),
            o = n.data("this"),
            p = ":not(.disabled, .hidden, .dropdown-header, .divider)",
            q = { 32: " ", 48: "0", 49: "1", 50: "2", 51: "3", 52: "4", 53: "5", 54: "6", 55: "7", 56: "8", 57: "9", 59: ";", 65: "a", 66: "b", 67: "c", 68: "d", 69: "e", 70: "f", 71: "g", 72: "h", 73: "i", 74: "j", 75: "k", 76: "l", 77: "m", 78: "n", 79: "o", 80: "p", 81: "q", 82: "r", 83: "s", 84: "t", 85: "u", 86: "v", 87: "w", 88: "x", 89: "y", 90: "z", 96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7", 104: "8", 105: "9" };if (o.options.liveSearch && (n = m.parent().parent()), o.options.container && (n = o.$menu), d = a('[role="listbox"] li', n), l = o.$newElement.hasClass("open"), !l && (c.keyCode >= 48 && c.keyCode <= 57 || c.keyCode >= 96 && c.keyCode <= 105 || c.keyCode >= 65 && c.keyCode <= 90)) return o.options.container ? o.$button.trigger("click") : (o.setSize(), o.$menu.parent().addClass("open"), l = !0), void o.$searchbox.focus();if (o.options.liveSearch && (/(^9$|27)/.test(c.keyCode.toString(10)) && l && (c.preventDefault(), c.stopPropagation(), o.$button.click().focus()), d = a('[role="listbox"] li' + p, n), m.val() || /(38|40)/.test(c.keyCode.toString(10)) || 0 === d.filter(".active").length && (d = o.$menuInner.find("li"), d = o.options.liveSearchNormalize ? d.filter(":a" + o._searchStyle() + "(" + b(q[c.keyCode]) + ")") : d.filter(":" + o._searchStyle() + "(" + q[c.keyCode] + ")"))), d.length) {
          if (/(38|40)/.test(c.keyCode.toString(10))) e = d.index(d.find("a").filter(":focus").parent()), g = d.filter(p).first().index(), h = d.filter(p).last().index(), f = d.eq(e).nextAll(p).eq(0).index(), i = d.eq(e).prevAll(p).eq(0).index(), j = d.eq(f).prevAll(p).eq(0).index(), o.options.liveSearch && (d.each(function (b) {
            a(this).hasClass("disabled") || a(this).data("index", b);
          }), e = d.index(d.filter(".active")), g = d.first().data("index"), h = d.last().data("index"), f = d.eq(e).nextAll().eq(0).data("index"), i = d.eq(e).prevAll().eq(0).data("index"), j = d.eq(f).prevAll().eq(0).data("index")), k = m.data("prevIndex"), 38 == c.keyCode ? (o.options.liveSearch && e--, e != j && e > i && (e = i), g > e && (e = g), e == k && (e = h)) : 40 == c.keyCode && (o.options.liveSearch && e++, -1 == e && (e = 0), e != j && f > e && (e = f), e > h && (e = h), e == k && (e = g)), m.data("prevIndex", e), o.options.liveSearch ? (c.preventDefault(), m.hasClass("dropdown-toggle") || (d.removeClass("active").eq(e).addClass("active").children("a").focus(), m.focus())) : d.eq(e).children("a").focus();else if (!m.is("input")) {
            var r,
                s,
                t = [];d.each(function () {
              a(this).hasClass("disabled") || a.trim(a(this).children("a").text().toLowerCase()).substring(0, 1) == q[c.keyCode] && t.push(a(this).index());
            }), r = a(document).data("keycount"), r++, a(document).data("keycount", r), s = a.trim(a(":focus").text().toLowerCase()).substring(0, 1), s != q[c.keyCode] ? (r = 1, a(document).data("keycount", r)) : r >= t.length && (a(document).data("keycount", 0), r > t.length && (r = 1)), d.eq(t[r - 1]).children("a").focus();
          }if ((/(13|32)/.test(c.keyCode.toString(10)) || /(^9$)/.test(c.keyCode.toString(10)) && o.options.selectOnTab) && l) {
            if (/(32)/.test(c.keyCode.toString(10)) || c.preventDefault(), o.options.liveSearch) /(32)/.test(c.keyCode.toString(10)) || (o.$menuInner.find(".active a").click(), m.focus());else {
              var u = a(":focus");u.click(), u.focus(), c.preventDefault(), a(document).data("spaceSelect", !0);
            }a(document).data("keycount", 0);
          }(/(^9$|27)/.test(c.keyCode.toString(10)) && l && (o.multiple || o.options.liveSearch) || /(27)/.test(c.keyCode.toString(10)) && !l) && (o.$menu.parent().removeClass("open"), o.options.container && o.$newElement.removeClass("open"), o.$button.focus());
        }
      }, mobile: function () {
        this.$element.addClass("mobile-device");
      }, refresh: function () {
        this.$lis = null, this.liObj = {}, this.reloadLi(), this.render(), this.checkDisabled(), this.liHeight(!0), this.setStyle(), this.setWidth(), this.$lis && this.$searchbox.trigger("propertychange"), this.$element.trigger("refreshed.bs.select");
      }, hide: function () {
        this.$newElement.hide();
      }, show: function () {
        this.$newElement.show();
      }, remove: function () {
        this.$newElement.remove(), this.$element.remove();
      }, destroy: function () {
        this.$newElement.before(this.$element).remove(), this.$bsContainer ? this.$bsContainer.remove() : this.$menu.remove(), this.$element.off(".bs.select").removeData("selectpicker").removeClass("bs-select-hidden selectpicker");
      } };var h = a.fn.selectpicker;a.fn.selectpicker = d, a.fn.selectpicker.Constructor = g, a.fn.selectpicker.noConflict = function () {
      return a.fn.selectpicker = h, this;
    }, a(document).data("keycount", 0).on("keydown.bs.select", '.bootstrap-select [data-toggle=dropdown], .bootstrap-select [role="listbox"], .bs-searchbox input', g.prototype.keydown).on("focusin.modal", '.bootstrap-select [data-toggle=dropdown], .bootstrap-select [role="listbox"], .bs-searchbox input', function (a) {
      a.stopPropagation();
    }), a(window).on("load.bs.select.data-api", function () {
      a(".selectpicker").each(function () {
        var b = a(this);d.call(b, b.data());
      });
    });
  }(a);
});
//# sourceMappingURL=bootstrap-select.js.map
(function () {
  var bind = function (fn, me) {
    return function () {
      return fn.apply(me, arguments);
    };
  };

  (function ($, window) {
    var Offcanvas, OffcanvasDropdown, OffcanvasTouch, transformCheck;
    OffcanvasDropdown = function () {
      function OffcanvasDropdown(element) {
        this.element = element;
        this._clickEvent = bind(this._clickEvent, this);
        this.element = $(this.element);
        this.nav = this.element.closest(".nav");
        this.dropdown = this.element.parent().find(".dropdown-menu");
        this.element.on('click', this._clickEvent);
        this.nav.closest('.navbar-offcanvas').on('click', function (_this) {
          return function () {
            if (_this.dropdown.is('.shown')) {
              return _this.dropdown.removeClass('shown').closest('.active').removeClass('active');
            }
          };
        }(this));
      }

      OffcanvasDropdown.prototype._clickEvent = function (e) {
        if (!this.dropdown.hasClass('shown')) {
          e.preventDefault();
        }
        e.stopPropagation();
        $('.dropdown-toggle').not(this.element).closest('.active').removeClass('active').find('.dropdown-menu').removeClass('shown');
        this.dropdown.toggleClass("shown");
        return this.element.parent().toggleClass('active');
      };

      return OffcanvasDropdown;
    }();
    OffcanvasTouch = function () {
      function OffcanvasTouch(button, element, location, offcanvas) {
        this.button = button;
        this.element = element;
        this.location = location;
        this.offcanvas = offcanvas;
        this._getFade = bind(this._getFade, this);
        this._getCss = bind(this._getCss, this);
        this._touchEnd = bind(this._touchEnd, this);
        this._touchMove = bind(this._touchMove, this);
        this._touchStart = bind(this._touchStart, this);
        this.endThreshold = 130;
        this.startThreshold = this.element.hasClass('navbar-offcanvas-right') ? $("body").outerWidth() - 60 : 20;
        this.maxStartThreshold = this.element.hasClass('navbar-offcanvas-right') ? $("body").outerWidth() - 20 : 60;
        this.currentX = 0;
        this.fade = this.element.hasClass('navbar-offcanvas-fade') ? true : false;
        $(document).on("touchstart", this._touchStart);
        $(document).on("touchmove", this._touchMove);
        $(document).on("touchend", this._touchEnd);
      }

      OffcanvasTouch.prototype._touchStart = function (e) {
        this.startX = e.originalEvent.touches[0].pageX;
        if (this.element.is('.in')) {
          return this.element.height($(window).outerHeight());
        }
      };

      OffcanvasTouch.prototype._touchMove = function (e) {
        var x;
        if ($(e.target).parents('.navbar-offcanvas').length > 0) {
          return true;
        }
        if (this.startX > this.startThreshold && this.startX < this.maxStartThreshold) {
          e.preventDefault();
          x = e.originalEvent.touches[0].pageX - this.startX;
          x = this.element.hasClass('navbar-offcanvas-right') ? -x : x;
          if (Math.abs(x) < this.element.outerWidth()) {
            this.element.css(this._getCss(x));
            return this.element.css(this._getFade(x));
          }
        } else if (this.element.hasClass('in')) {
          e.preventDefault();
          x = e.originalEvent.touches[0].pageX + (this.currentX - this.startX);
          x = this.element.hasClass('navbar-offcanvas-right') ? -x : x;
          if (Math.abs(x) < this.element.outerWidth()) {
            this.element.css(this._getCss(x));
            return this.element.css(this._getFade(x));
          }
        }
      };

      OffcanvasTouch.prototype._touchEnd = function (e) {
        var end, sendEvents, x;
        if ($(e.target).parents('.navbar-offcanvas').length > 0) {
          return true;
        }
        sendEvents = false;
        x = e.originalEvent.changedTouches[0].pageX;
        if (Math.abs(x) === this.startX) {
          return;
        }
        end = this.element.hasClass('navbar-offcanvas-right') ? Math.abs(x) > this.endThreshold + 50 : x < this.endThreshold + 50;
        if (this.element.hasClass('in') && end) {
          this.currentX = 0;
          this.element.removeClass('in').css(this._clearCss());
          this.element.children('ul').removeClass('moves-out');
          this.button.removeClass('is-open');
          sendEvents = true;
        } else if (Math.abs(x - this.startX) > this.endThreshold && this.startX > this.startThreshold && this.startX < this.maxStartThreshold) {
          this.currentX = this.element.hasClass('navbar-offcanvas-right') ? -this.element.outerWidth() : this.element.outerWidth();
          this.element.toggleClass('in').css(this._clearCss());
          this.button.toggleClass('is-open');
          sendEvents = true;
        } else {
          this.element.css(this._clearCss());
        }
        return this.offcanvas.bodyOverflow(sendEvents);
      };

      OffcanvasTouch.prototype._getCss = function (x) {
        x = this.element.hasClass('navbar-offcanvas-right') ? -x : x;
        return {
          "-webkit-transform": "translate3d(" + x + "px, 0px, 0px)",
          "-webkit-transition-duration": "0s",
          "-moz-transform": "translate3d(" + x + "px, 0px, 0px)",
          "-moz-transition": "0s",
          "-o-transform": "translate3d(" + x + "px, 0px, 0px)",
          "-o-transition": "0s",
          "transform": "translate3d(" + x + "px, 0px, 0px)",
          "transition": "0s"
        };
      };

      OffcanvasTouch.prototype._getFade = function (x) {
        if (this.fade) {
          return {
            "opacity": x / this.element.outerWidth()
          };
        } else {
          return {};
        }
      };

      OffcanvasTouch.prototype._clearCss = function () {
        return {
          "-webkit-transform": "",
          "-webkit-transition-duration": "",
          "-moz-transform": "",
          "-moz-transition": "",
          "-o-transform": "",
          "-o-transition": "",
          "transform": "",
          "transition": "",
          "opacity": ""
        };
      };

      return OffcanvasTouch;
    }();
    window.Offcanvas = Offcanvas = function () {
      function Offcanvas(element) {
        var t, target;
        this.element = element;
        this.bodyOverflow = bind(this.bodyOverflow, this);
        this._sendEventsAfter = bind(this._sendEventsAfter, this);
        this._sendEventsBefore = bind(this._sendEventsBefore, this);
        this._documentClicked = bind(this._documentClicked, this);
        this._close = bind(this._close, this);
        this._open = bind(this._open, this);
        this._clicked = bind(this._clicked, this);
        this._navbarHeight = bind(this._navbarHeight, this);
        target = this.element.attr('data-target') ? this.element.attr('data-target') : false;
        if (target) {
          this.target = $(target);
          if (this.target.length && !this.target.hasClass('js-offcanvas-done')) {
            this.element.addClass('js-offcanvas-has-events');
            this.location = this.target.hasClass("navbar-offcanvas-right") ? "right" : "left";
            this.target.addClass(transform ? "offcanvas-transform js-offcanvas-done" : "offcanvas-position js-offcanvas-done");
            this.target.data('offcanvas', this);
            this.element.on("click", this._clicked);
            this.target.on('transitionend', function (_this) {
              return function () {
                if (_this.target.is(':not(.in)')) {
                  return _this.target.height('');
                }
              };
            }(this));
            $(document).on("click", this._documentClicked);
            if (this.target.hasClass('navbar-offcanvas-touch')) {
              t = new OffcanvasTouch(this.element, this.target, this.location, this);
            }
            this.target.find(".dropdown-toggle").each(function () {
              var d;
              return d = new OffcanvasDropdown(this);
            });
            this.target.on('offcanvas.toggle', function (_this) {
              return function (e) {
                return _this._clicked(e);
              };
            }(this));
            this.target.on('offcanvas.close', function (_this) {
              return function (e) {
                return _this._close(e);
              };
            }(this));
            this.target.on('offcanvas.open', function (_this) {
              return function (e) {
                return _this._open(e);
              };
            }(this));
          }
        } else {
          console.warn('Offcanvas: `data-target` attribute must be present.');
        }
      }

      Offcanvas.prototype._navbarHeight = function () {
        if (this.target.is('.in')) {
          return this.target.height($(window).outerHeight());
        }
      };

      Offcanvas.prototype._clicked = function (e) {
        e.preventDefault();
        this._sendEventsBefore();
        $(".navbar-offcanvas").not(this.target).trigger('offcanvas.close');
        this.target.toggleClass('in');
        this.element.toggleClass('is-open');
        this._navbarHeight();
        return this.bodyOverflow();
      };

      Offcanvas.prototype._open = function (e) {
        e.preventDefault();
        if (this.target.is('.in')) {
          return;
        }
        this._sendEventsBefore();
        this.target.addClass('in');
        this.element.addClass('is-open');
        this._navbarHeight();
        return this.bodyOverflow();
      };

      Offcanvas.prototype._close = function (e) {
        e.preventDefault();
        if (this.target.is(':not(.in)')) {
          return;
        }
        this._sendEventsBefore();
        this.target.removeClass('in');
        this.target.children('ul').removeClass('moves-out');
        this.element.removeClass('is-open');
        this._navbarHeight();
        return this.bodyOverflow();
      };

      Offcanvas.prototype._documentClicked = function (e) {
        var clickedEl;
        clickedEl = $(e.target);
        if (!clickedEl.hasClass('offcanvas-toggle') && clickedEl.parents('.offcanvas-toggle').length === 0 && clickedEl.parents('.navbar-offcanvas').length === 0 && !clickedEl.hasClass('navbar-offcanvas')) {
          if (this.target.hasClass('in')) {
            e.preventDefault();
            this._sendEventsBefore();
            this.target.removeClass('in');
            this.target.children('ul').removeClass('moves-out');
            this.element.removeClass('is-open');
            this._navbarHeight();
            return this.bodyOverflow();
          }
        }
      };

      Offcanvas.prototype._sendEventsBefore = function () {
        if (this.target.hasClass('in')) {
          return this.target.trigger('hide.bs.offcanvas');
        } else {
          return this.target.trigger('show.bs.offcanvas');
        }
      };

      Offcanvas.prototype._sendEventsAfter = function () {
        if (this.target.hasClass('in')) {
          return this.target.trigger('shown.bs.offcanvas');
        } else {
          return this.target.trigger('hidden.bs.offcanvas');
        }
      };

      Offcanvas.prototype.bodyOverflow = function (events) {
        if (events == null) {
          events = true;
        }
        if (this.target.is('.in')) {
          $('body').addClass('offcanvas-stop-scrolling');
        } else {
          $('body').removeClass('offcanvas-stop-scrolling');
        }
        if (events) {
          return this._sendEventsAfter();
        }
      };

      return Offcanvas;
    }();
    transformCheck = function (_this) {
      return function () {
        var asSupport, el, regex, translate3D;
        el = document.createElement('div');
        translate3D = "translate3d(0px, 0px, 0px)";
        regex = /translate3d\(0px, 0px, 0px\)/g;
        el.style.cssText = "-webkit-transform: " + translate3D + "; -moz-transform: " + translate3D + "; -o-transform: " + translate3D + "; transform: " + translate3D;
        asSupport = el.style.cssText.match(regex);
        return _this.transform = asSupport.length != null;
      };
    }(this);
    return $(function () {
      transformCheck();
      $('[data-toggle="offcanvas"]').each(function () {
        var oc;
        return oc = new Offcanvas($(this));
      });
      $(window).on('resize', function () {
        $('body').removeClass('offcanvas-stop-scrolling');
        $('.navbar-offcanvas.in').each(function () {
          $(this).children('ul').removeClass('moves-out');
          return $(this).height('').removeClass('in');
        });
        return $('.offcanvas-toggle').removeClass('is-open');
      });
      return $('.offcanvas-toggle').each(function () {
        return $(this).on('click', function (e) {
          var el, selector;
          if (!$(this).hasClass('js-offcanvas-has-events')) {
            selector = $(this).attr('data-target');
            el = $(selector);
            if (el) {
              el.height('');
              el.removeClass('in');
              el.children('ul').removeClass('moves-out');
              return $('body').css({
                overflow: '',
                position: ''
              });
            }
          }
        });
      });
    });
  })(window.jQuery, window);
}).call(this);
/*!
 * Fotorama 4.6.4 | http://fotorama.io/license/
 */
fotoramaVersion = "4.6.4", function (a, b, c, d, e) {
  "use strict";
  function f(a) {
    var b = "bez_" + d.makeArray(arguments).join("_").replace(".", "p");if ("function" != typeof d.easing[b]) {
      var c = function (a, b) {
        var c = [null, null],
            d = [null, null],
            e = [null, null],
            f = function (f, g) {
          return e[g] = 3 * a[g], d[g] = 3 * (b[g] - a[g]) - e[g], c[g] = 1 - e[g] - d[g], f * (e[g] + f * (d[g] + f * c[g]));
        },
            g = function (a) {
          return e[0] + a * (2 * d[0] + 3 * c[0] * a);
        },
            h = function (a) {
          for (var b, c = a, d = 0; ++d < 14 && (b = f(c, 0) - a, !(Math.abs(b) < .001));) c -= b / g(c);return c;
        };return function (a) {
          return f(h(a), 1);
        };
      };d.easing[b] = function (b, d, e, f, g) {
        return f * c([a[0], a[1]], [a[2], a[3]])(d / g) + e;
      };
    }return b;
  }function g() {}function h(a, b, c) {
    return Math.max(isNaN(b) ? -1 / 0 : b, Math.min(isNaN(c) ? 1 / 0 : c, a));
  }function i(a) {
    return a.match(/ma/) && a.match(/-?\d+(?!d)/g)[a.match(/3d/) ? 12 : 4];
  }function j(a) {
    return Ic ? +i(a.css("transform")) : +a.css("left").replace("px", "");
  }function k(a) {
    var b = {};return Ic ? b.transform = "translate3d(" + a + "px,0,0)" : b.left = a, b;
  }function l(a) {
    return { "transition-duration": a + "ms" };
  }function m(a, b) {
    return isNaN(a) ? b : a;
  }function n(a, b) {
    return m(+String(a).replace(b || "px", ""));
  }function o(a) {
    return (/%$/.test(a) ? n(a, "%") : e
    );
  }function p(a, b) {
    return m(o(a) / 100 * b, n(a));
  }function q(a) {
    return (!isNaN(n(a)) || !isNaN(n(a, "%"))) && a;
  }function r(a, b, c, d) {
    return (a - (d || 0)) * (b + (c || 0));
  }function s(a, b, c, d) {
    return -Math.round(a / (b + (c || 0)) - (d || 0));
  }function t(a) {
    var b = a.data();if (!b.tEnd) {
      var c = a[0],
          d = { WebkitTransition: "webkitTransitionEnd", MozTransition: "transitionend", OTransition: "oTransitionEnd otransitionend", msTransition: "MSTransitionEnd", transition: "transitionend" };T(c, d[uc.prefixed("transition")], function (a) {
        b.tProp && a.propertyName.match(b.tProp) && b.onEndFn();
      }), b.tEnd = !0;
    }
  }function u(a, b, c, d) {
    var e,
        f = a.data();f && (f.onEndFn = function () {
      e || (e = !0, clearTimeout(f.tT), c());
    }, f.tProp = b, clearTimeout(f.tT), f.tT = setTimeout(function () {
      f.onEndFn();
    }, 1.5 * d), t(a));
  }function v(a, b) {
    if (a.length) {
      var c = a.data();Ic ? (a.css(l(0)), c.onEndFn = g, clearTimeout(c.tT)) : a.stop();var d = w(b, function () {
        return j(a);
      });return a.css(k(d)), d;
    }
  }function w() {
    for (var a, b = 0, c = arguments.length; c > b && (a = b ? arguments[b]() : arguments[b], "number" != typeof a); b++);return a;
  }function x(a, b) {
    return Math.round(a + (b - a) / 1.5);
  }function y() {
    return y.p = y.p || ("https:" === c.protocol ? "https://" : "http://"), y.p;
  }function z(a) {
    var c = b.createElement("a");return c.href = a, c;
  }function A(a, b) {
    if ("string" != typeof a) return a;a = z(a);var c, d;if (a.host.match(/youtube\.com/) && a.search) {
      if (c = a.search.split("v=")[1]) {
        var e = c.indexOf("&");-1 !== e && (c = c.substring(0, e)), d = "youtube";
      }
    } else a.host.match(/youtube\.com|youtu\.be/) ? (c = a.pathname.replace(/^\/(embed\/|v\/)?/, "").replace(/\/.*/, ""), d = "youtube") : a.host.match(/vimeo\.com/) && (d = "vimeo", c = a.pathname.replace(/^\/(video\/)?/, "").replace(/\/.*/, ""));return c && d || !b || (c = a.href, d = "custom"), c ? { id: c, type: d, s: a.search.replace(/^\?/, ""), p: y() } : !1;
  }function B(a, b, c) {
    var e,
        f,
        g = a.video;return "youtube" === g.type ? (f = y() + "img.youtube.com/vi/" + g.id + "/default.jpg", e = f.replace(/\/default.jpg$/, "/hqdefault.jpg"), a.thumbsReady = !0) : "vimeo" === g.type ? d.ajax({ url: y() + "vimeo.com/api/v2/video/" + g.id + ".json", dataType: "jsonp", success: function (d) {
        a.thumbsReady = !0, C(b, { img: d[0].thumbnail_large, thumb: d[0].thumbnail_small }, a.i, c);
      } }) : a.thumbsReady = !0, { img: e, thumb: f };
  }function C(a, b, c, e) {
    for (var f = 0, g = a.length; g > f; f++) {
      var h = a[f];if (h.i === c && h.thumbsReady) {
        var i = { videoReady: !0 };i[Xc] = i[Zc] = i[Yc] = !1, e.splice(f, 1, d.extend({}, h, i, b));break;
      }
    }
  }function D(a) {
    function b(a, b, e) {
      var f = a.children("img").eq(0),
          g = a.attr("href"),
          h = a.attr("src"),
          i = f.attr("src"),
          j = b.video,
          k = e ? A(g, j === !0) : !1;k ? g = !1 : k = j, c(a, f, d.extend(b, { video: k, img: b.img || g || h || i, thumb: b.thumb || i || h || g }));
    }function c(a, b, c) {
      var e = c.thumb && c.img !== c.thumb,
          f = n(c.width || a.attr("width")),
          g = n(c.height || a.attr("height"));d.extend(c, { width: f, height: g, thumbratio: S(c.thumbratio || n(c.thumbwidth || b && b.attr("width") || e || f) / n(c.thumbheight || b && b.attr("height") || e || g)) });
    }var e = [];return a.children().each(function () {
      var a = d(this),
          f = R(d.extend(a.data(), { id: a.attr("id") }));if (a.is("a, img")) b(a, f, !0);else {
        if (a.is(":empty")) return;c(a, null, d.extend(f, { html: this, _html: a.html() }));
      }e.push(f);
    }), e;
  }function E(a) {
    return 0 === a.offsetWidth && 0 === a.offsetHeight;
  }function F(a) {
    return !d.contains(b.documentElement, a);
  }function G(a, b, c, d) {
    return G.i || (G.i = 1, G.ii = [!0]), d = d || G.i, "undefined" == typeof G.ii[d] && (G.ii[d] = !0), a() ? b() : G.ii[d] && setTimeout(function () {
      G.ii[d] && G(a, b, c, d);
    }, c || 100), G.i++;
  }function H(a) {
    c.replace(c.protocol + "//" + c.host + c.pathname.replace(/^\/?/, "/") + c.search + "#" + a);
  }function I(a, b, c, d) {
    var e = a.data(),
        f = e.measures;if (f && (!e.l || e.l.W !== f.width || e.l.H !== f.height || e.l.r !== f.ratio || e.l.w !== b.w || e.l.h !== b.h || e.l.m !== c || e.l.p !== d)) {
      var g = f.width,
          i = f.height,
          j = b.w / b.h,
          k = f.ratio >= j,
          l = "scaledown" === c,
          m = "contain" === c,
          n = "cover" === c,
          o = $(d);k && (l || m) || !k && n ? (g = h(b.w, 0, l ? g : 1 / 0), i = g / f.ratio) : (k && n || !k && (l || m)) && (i = h(b.h, 0, l ? i : 1 / 0), g = i * f.ratio), a.css({ width: g, height: i, left: p(o.x, b.w - g), top: p(o.y, b.h - i) }), e.l = { W: f.width, H: f.height, r: f.ratio, w: b.w, h: b.h, m: c, p: d };
    }return !0;
  }function J(a, b) {
    var c = a[0];c.styleSheet ? c.styleSheet.cssText = b : a.html(b);
  }function K(a, b, c) {
    return b === c ? !1 : b >= a ? "left" : a >= c ? "right" : "left right";
  }function L(a, b, c, d) {
    if (!c) return !1;if (!isNaN(a)) return a - (d ? 0 : 1);for (var e, f = 0, g = b.length; g > f; f++) {
      var h = b[f];if (h.id === a) {
        e = f;break;
      }
    }return e;
  }function M(a, b, c) {
    c = c || {}, a.each(function () {
      var a,
          e = d(this),
          f = e.data();f.clickOn || (f.clickOn = !0, d.extend(cb(e, { onStart: function (b) {
          a = b, (c.onStart || g).call(this, b);
        }, onMove: c.onMove || g, onTouchEnd: c.onTouchEnd || g, onEnd: function (c) {
          c.moved || b.call(this, a);
        } }), { noMove: !0 }));
    });
  }function N(a, b) {
    return '<div class="' + a + '">' + (b || "") + "</div>";
  }function O(a) {
    for (var b = a.length; b;) {
      var c = Math.floor(Math.random() * b--),
          d = a[b];a[b] = a[c], a[c] = d;
    }return a;
  }function P(a) {
    return "[object Array]" == Object.prototype.toString.call(a) && d.map(a, function (a) {
      return d.extend({}, a);
    });
  }function Q(a, b, c) {
    a.scrollLeft(b || 0).scrollTop(c || 0);
  }function R(a) {
    if (a) {
      var b = {};return d.each(a, function (a, c) {
        b[a.toLowerCase()] = c;
      }), b;
    }
  }function S(a) {
    if (a) {
      var b = +a;return isNaN(b) ? (b = a.split("/"), +b[0] / +b[1] || e) : b;
    }
  }function T(a, b, c, d) {
    b && (a.addEventListener ? a.addEventListener(b, c, !!d) : a.attachEvent("on" + b, c));
  }function U(a) {
    return !!a.getAttribute("disabled");
  }function V(a) {
    return { tabindex: -1 * a + "", disabled: a };
  }function W(a, b) {
    T(a, "keyup", function (c) {
      U(a) || 13 == c.keyCode && b.call(a, c);
    });
  }function X(a, b) {
    T(a, "focus", a.onfocusin = function (c) {
      b.call(a, c);
    }, !0);
  }function Y(a, b) {
    a.preventDefault ? a.preventDefault() : a.returnValue = !1, b && a.stopPropagation && a.stopPropagation();
  }function Z(a) {
    return a ? ">" : "<";
  }function $(a) {
    return a = (a + "").split(/\s+/), { x: q(a[0]) || bd, y: q(a[1]) || bd };
  }function _(a, b) {
    var c = a.data(),
        e = Math.round(b.pos),
        f = function () {
      c.sliding = !1, (b.onEnd || g)();
    };"undefined" != typeof b.overPos && b.overPos !== b.pos && (e = b.overPos, f = function () {
      _(a, d.extend({}, b, { overPos: b.pos, time: Math.max(Qc, b.time / 2) }));
    });var h = d.extend(k(e), b.width && { width: b.width });c.sliding = !0, Ic ? (a.css(d.extend(l(b.time), h)), b.time > 10 ? u(a, "transform", f, b.time) : f()) : a.stop().animate(h, b.time, _c, f);
  }function ab(a, b, c, e, f, h) {
    var i = "undefined" != typeof h;if (i || (f.push(arguments), Array.prototype.push.call(arguments, f.length), !(f.length > 1))) {
      a = a || d(a), b = b || d(b);var j = a[0],
          k = b[0],
          l = "crossfade" === e.method,
          m = function () {
        if (!m.done) {
          m.done = !0;var a = (i || f.shift()) && f.shift();a && ab.apply(this, a), (e.onEnd || g)(!!a);
        }
      },
          n = e.time / (h || 1);c.removeClass(Rb + " " + Qb), a.stop().addClass(Rb), b.stop().addClass(Qb), l && k && a.fadeTo(0, 0), a.fadeTo(l ? n : 0, 1, l && m), b.fadeTo(n, 0, m), j && l || k || m();
    }
  }function bb(a) {
    var b = (a.touches || [])[0] || a;a._x = b.pageX, a._y = b.clientY, a._now = d.now();
  }function cb(a, c) {
    function e(a) {
      return m = d(a.target), u.checked = p = q = s = !1, k || u.flow || a.touches && a.touches.length > 1 || a.which > 1 || ed && ed.type !== a.type && gd || (p = c.select && m.is(c.select, t)) ? p : (o = "touchstart" === a.type, q = m.is("a, a *", t), n = u.control, r = u.noMove || u.noSwipe || n ? 16 : u.snap ? 0 : 4, bb(a), l = ed = a, fd = a.type.replace(/down|start/, "move").replace(/Down/, "Move"), (c.onStart || g).call(t, a, { control: n, $target: m }), k = u.flow = !0, void ((!o || u.go) && Y(a)));
    }function f(a) {
      if (a.touches && a.touches.length > 1 || Nc && !a.isPrimary || fd !== a.type || !k) return k && h(), void (c.onTouchEnd || g)();bb(a);var b = Math.abs(a._x - l._x),
          d = Math.abs(a._y - l._y),
          e = b - d,
          f = (u.go || u.x || e >= 0) && !u.noSwipe,
          i = 0 > e;o && !u.checked ? (k = f) && Y(a) : (Y(a), (c.onMove || g).call(t, a, { touch: o })), !s && Math.sqrt(Math.pow(b, 2) + Math.pow(d, 2)) > r && (s = !0), u.checked = u.checked || f || i;
    }function h(a) {
      (c.onTouchEnd || g)();var b = k;u.control = k = !1, b && (u.flow = !1), !b || q && !u.checked || (a && Y(a), gd = !0, clearTimeout(hd), hd = setTimeout(function () {
        gd = !1;
      }, 1e3), (c.onEnd || g).call(t, { moved: s, $target: m, control: n, touch: o, startEvent: l, aborted: !a || "MSPointerCancel" === a.type }));
    }function i() {
      u.flow || setTimeout(function () {
        u.flow = !0;
      }, 10);
    }function j() {
      u.flow && setTimeout(function () {
        u.flow = !1;
      }, Pc);
    }var k,
        l,
        m,
        n,
        o,
        p,
        q,
        r,
        s,
        t = a[0],
        u = {};return Nc ? (T(t, "MSPointerDown", e), T(b, "MSPointerMove", f), T(b, "MSPointerCancel", h), T(b, "MSPointerUp", h)) : (T(t, "touchstart", e), T(t, "touchmove", f), T(t, "touchend", h), T(b, "touchstart", i), T(b, "touchend", j), T(b, "touchcancel", j), Ec.on("scroll", j), a.on("mousedown", e), Fc.on("mousemove", f).on("mouseup", h)), a.on("click", "a", function (a) {
      u.checked && Y(a);
    }), u;
  }function db(a, b) {
    function c(c, d) {
      A = !0, j = l = c._x, q = c._now, p = [[q, j]], m = n = D.noMove || d ? 0 : v(a, (b.getPos || g)()), (b.onStart || g).call(B, c);
    }function e(a, b) {
      s = D.min, t = D.max, u = D.snap, w = a.altKey, A = z = !1, y = b.control, y || C.sliding || c(a);
    }function f(d, e) {
      D.noSwipe || (A || c(d), l = d._x, p.push([d._now, l]), n = m - (j - l), o = K(n, s, t), s >= n ? n = x(n, s) : n >= t && (n = x(n, t)), D.noMove || (a.css(k(n)), z || (z = !0, e.touch || Nc || a.addClass(ec)), (b.onMove || g).call(B, d, { pos: n, edge: o })));
    }function i(e) {
      if (!D.noSwipe || !e.moved) {
        A || c(e.startEvent, !0), e.touch || Nc || a.removeClass(ec), r = d.now();for (var f, i, j, k, o, q, v, x, y, z = r - Pc, C = null, E = Qc, F = b.friction, G = p.length - 1; G >= 0; G--) {
          if (f = p[G][0], i = Math.abs(f - z), null === C || j > i) C = f, k = p[G][1];else if (C === z || i > j) break;j = i;
        }v = h(n, s, t);var H = k - l,
            I = H >= 0,
            J = r - C,
            K = J > Pc,
            L = !K && n !== m && v === n;u && (v = h(Math[L ? I ? "floor" : "ceil" : "round"](n / u) * u, s, t), s = t = v), L && (u || v === n) && (y = -(H / J), E *= h(Math.abs(y), b.timeLow, b.timeHigh), o = Math.round(n + y * E / F), u || (v = o), (!I && o > t || I && s > o) && (q = I ? s : t, x = o - q, u || (v = q), x = h(v + .03 * x, q - 50, q + 50), E = Math.abs((n - x) / (y / F)))), E *= w ? 10 : 1, (b.onEnd || g).call(B, d.extend(e, { moved: e.moved || K && u, pos: n, newPos: v, overPos: x, time: E }));
      }
    }var j,
        l,
        m,
        n,
        o,
        p,
        q,
        r,
        s,
        t,
        u,
        w,
        y,
        z,
        A,
        B = a[0],
        C = a.data(),
        D = {};return D = d.extend(cb(b.$wrap, d.extend({}, b, { onStart: e, onMove: f, onEnd: i })), D);
  }function eb(a, b) {
    var c,
        e,
        f,
        h = a[0],
        i = { prevent: {} };return T(h, Oc, function (a) {
      var h = a.wheelDeltaY || -1 * a.deltaY || 0,
          j = a.wheelDeltaX || -1 * a.deltaX || 0,
          k = Math.abs(j) && !Math.abs(h),
          l = Z(0 > j),
          m = e === l,
          n = d.now(),
          o = Pc > n - f;e = l, f = n, k && i.ok && (!i.prevent[l] || c) && (Y(a, !0), c && m && o || (b.shift && (c = !0, clearTimeout(i.t), i.t = setTimeout(function () {
        c = !1;
      }, Rc)), (b.onEnd || g)(a, b.shift ? l : j)));
    }), i;
  }function fb() {
    d.each(d.Fotorama.instances, function (a, b) {
      b.index = a;
    });
  }function gb(a) {
    d.Fotorama.instances.push(a), fb();
  }function hb(a) {
    d.Fotorama.instances.splice(a.index, 1), fb();
  }var ib = "fotorama",
      jb = "fullscreen",
      kb = ib + "__wrap",
      lb = kb + "--css2",
      mb = kb + "--css3",
      nb = kb + "--video",
      ob = kb + "--fade",
      pb = kb + "--slide",
      qb = kb + "--no-controls",
      rb = kb + "--no-shadows",
      sb = kb + "--pan-y",
      tb = kb + "--rtl",
      ub = kb + "--only-active",
      vb = kb + "--no-captions",
      wb = kb + "--toggle-arrows",
      xb = ib + "__stage",
      yb = xb + "__frame",
      zb = yb + "--video",
      Ab = xb + "__shaft",
      Bb = ib + "__grab",
      Cb = ib + "__pointer",
      Db = ib + "__arr",
      Eb = Db + "--disabled",
      Fb = Db + "--prev",
      Gb = Db + "--next",
      Hb = ib + "__nav",
      Ib = Hb + "-wrap",
      Jb = Hb + "__shaft",
      Kb = Hb + "--dots",
      Lb = Hb + "--thumbs",
      Mb = Hb + "__frame",
      Nb = Mb + "--dot",
      Ob = Mb + "--thumb",
      Pb = ib + "__fade",
      Qb = Pb + "-front",
      Rb = Pb + "-rear",
      Sb = ib + "__shadow",
      Tb = Sb + "s",
      Ub = Tb + "--left",
      Vb = Tb + "--right",
      Wb = ib + "__active",
      Xb = ib + "__select",
      Yb = ib + "--hidden",
      Zb = ib + "--fullscreen",
      $b = ib + "__fullscreen-icon",
      _b = ib + "__error",
      ac = ib + "__loading",
      bc = ib + "__loaded",
      cc = bc + "--full",
      dc = bc + "--img",
      ec = ib + "__grabbing",
      fc = ib + "__img",
      gc = fc + "--full",
      hc = ib + "__dot",
      ic = ib + "__thumb",
      jc = ic + "-border",
      kc = ib + "__html",
      lc = ib + "__video",
      mc = lc + "-play",
      nc = lc + "-close",
      oc = ib + "__caption",
      pc = ib + "__caption__wrap",
      qc = ib + "__spinner",
      rc = '" tabindex="0" role="button',
      sc = d && d.fn.jquery.split(".");if (!sc || sc[0] < 1 || 1 == sc[0] && sc[1] < 8) throw "Fotorama requires jQuery 1.8 or later and will not run without it.";var tc = {},
      uc = function (a, b, c) {
    function d(a) {
      r.cssText = a;
    }function e(a, b) {
      return typeof a === b;
    }function f(a, b) {
      return !!~("" + a).indexOf(b);
    }function g(a, b) {
      for (var d in a) {
        var e = a[d];if (!f(e, "-") && r[e] !== c) return "pfx" == b ? e : !0;
      }return !1;
    }function h(a, b, d) {
      for (var f in a) {
        var g = b[a[f]];if (g !== c) return d === !1 ? a[f] : e(g, "function") ? g.bind(d || b) : g;
      }return !1;
    }function i(a, b, c) {
      var d = a.charAt(0).toUpperCase() + a.slice(1),
          f = (a + " " + u.join(d + " ") + d).split(" ");return e(b, "string") || e(b, "undefined") ? g(f, b) : (f = (a + " " + v.join(d + " ") + d).split(" "), h(f, b, c));
    }var j,
        k,
        l,
        m = "2.6.2",
        n = {},
        o = b.documentElement,
        p = "modernizr",
        q = b.createElement(p),
        r = q.style,
        s = ({}.toString, " -webkit- -moz- -o- -ms- ".split(" ")),
        t = "Webkit Moz O ms",
        u = t.split(" "),
        v = t.toLowerCase().split(" "),
        w = {},
        x = [],
        y = x.slice,
        z = function (a, c, d, e) {
      var f,
          g,
          h,
          i,
          j = b.createElement("div"),
          k = b.body,
          l = k || b.createElement("body");if (parseInt(d, 10)) for (; d--;) h = b.createElement("div"), h.id = e ? e[d] : p + (d + 1), j.appendChild(h);return f = ["&#173;", '<style id="s', p, '">', a, "</style>"].join(""), j.id = p, (k ? j : l).innerHTML += f, l.appendChild(j), k || (l.style.background = "", l.style.overflow = "hidden", i = o.style.overflow, o.style.overflow = "hidden", o.appendChild(l)), g = c(j, a), k ? j.parentNode.removeChild(j) : (l.parentNode.removeChild(l), o.style.overflow = i), !!g;
    },
        A = {}.hasOwnProperty;l = e(A, "undefined") || e(A.call, "undefined") ? function (a, b) {
      return b in a && e(a.constructor.prototype[b], "undefined");
    } : function (a, b) {
      return A.call(a, b);
    }, Function.prototype.bind || (Function.prototype.bind = function (a) {
      var b = this;if ("function" != typeof b) throw new TypeError();var c = y.call(arguments, 1),
          d = function () {
        if (this instanceof d) {
          var e = function () {};e.prototype = b.prototype;var f = new e(),
              g = b.apply(f, c.concat(y.call(arguments)));return Object(g) === g ? g : f;
        }return b.apply(a, c.concat(y.call(arguments)));
      };return d;
    }), w.csstransforms3d = function () {
      var a = !!i("perspective");return a;
    };for (var B in w) l(w, B) && (k = B.toLowerCase(), n[k] = w[B](), x.push((n[k] ? "" : "no-") + k));return n.addTest = function (a, b) {
      if ("object" == typeof a) for (var d in a) l(a, d) && n.addTest(d, a[d]);else {
        if (a = a.toLowerCase(), n[a] !== c) return n;b = "function" == typeof b ? b() : b, "undefined" != typeof enableClasses && enableClasses && (o.className += " " + (b ? "" : "no-") + a), n[a] = b;
      }return n;
    }, d(""), q = j = null, n._version = m, n._prefixes = s, n._domPrefixes = v, n._cssomPrefixes = u, n.testProp = function (a) {
      return g([a]);
    }, n.testAllProps = i, n.testStyles = z, n.prefixed = function (a, b, c) {
      return b ? i(a, b, c) : i(a, "pfx");
    }, n;
  }(a, b),
      vc = { ok: !1, is: function () {
      return !1;
    }, request: function () {}, cancel: function () {}, event: "", prefix: "" },
      wc = "webkit moz o ms khtml".split(" ");if ("undefined" != typeof b.cancelFullScreen) vc.ok = !0;else for (var xc = 0, yc = wc.length; yc > xc; xc++) if (vc.prefix = wc[xc], "undefined" != typeof b[vc.prefix + "CancelFullScreen"]) {
    vc.ok = !0;break;
  }vc.ok && (vc.event = vc.prefix + "fullscreenchange", vc.is = function () {
    switch (this.prefix) {case "":
        return b.fullScreen;case "webkit":
        return b.webkitIsFullScreen;default:
        return b[this.prefix + "FullScreen"];}
  }, vc.request = function (a) {
    return "" === this.prefix ? a.requestFullScreen() : a[this.prefix + "RequestFullScreen"]();
  }, vc.cancel = function () {
    return "" === this.prefix ? b.cancelFullScreen() : b[this.prefix + "CancelFullScreen"]();
  });var zc,
      Ac = { lines: 12, length: 5, width: 2, radius: 7, corners: 1, rotate: 15, color: "rgba(128, 128, 128, .75)", hwaccel: !0 },
      Bc = { top: "auto", left: "auto", className: "" };!function (a, b) {
    zc = b();
  }(this, function () {
    function a(a, c) {
      var d,
          e = b.createElement(a || "div");for (d in c) e[d] = c[d];return e;
    }function c(a) {
      for (var b = 1, c = arguments.length; c > b; b++) a.appendChild(arguments[b]);return a;
    }function d(a, b, c, d) {
      var e = ["opacity", b, ~~(100 * a), c, d].join("-"),
          f = .01 + c / d * 100,
          g = Math.max(1 - (1 - a) / b * (100 - f), a),
          h = m.substring(0, m.indexOf("Animation")).toLowerCase(),
          i = h && "-" + h + "-" || "";return o[e] || (p.insertRule("@" + i + "keyframes " + e + "{0%{opacity:" + g + "}" + f + "%{opacity:" + a + "}" + (f + .01) + "%{opacity:1}" + (f + b) % 100 + "%{opacity:" + a + "}100%{opacity:" + g + "}}", p.cssRules.length), o[e] = 1), e;
    }function f(a, b) {
      var c,
          d,
          f = a.style;for (b = b.charAt(0).toUpperCase() + b.slice(1), d = 0; d < n.length; d++) if (c = n[d] + b, f[c] !== e) return c;return f[b] !== e ? b : void 0;
    }function g(a, b) {
      for (var c in b) a.style[f(a, c) || c] = b[c];return a;
    }function h(a) {
      for (var b = 1; b < arguments.length; b++) {
        var c = arguments[b];for (var d in c) a[d] === e && (a[d] = c[d]);
      }return a;
    }function i(a) {
      for (var b = { x: a.offsetLeft, y: a.offsetTop }; a = a.offsetParent;) b.x += a.offsetLeft, b.y += a.offsetTop;return b;
    }function j(a, b) {
      return "string" == typeof a ? a : a[b % a.length];
    }function k(a) {
      return "undefined" == typeof this ? new k(a) : void (this.opts = h(a || {}, k.defaults, q));
    }function l() {
      function b(b, c) {
        return a("<" + b + ' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">', c);
      }p.addRule(".spin-vml", "behavior:url(#default#VML)"), k.prototype.lines = function (a, d) {
        function e() {
          return g(b("group", { coordsize: k + " " + k, coordorigin: -i + " " + -i }), { width: k, height: k });
        }function f(a, f, h) {
          c(m, c(g(e(), { rotation: 360 / d.lines * a + "deg", left: ~~f }), c(g(b("roundrect", { arcsize: d.corners }), { width: i, height: d.width, left: d.radius, top: -d.width >> 1, filter: h }), b("fill", { color: j(d.color, a), opacity: d.opacity }), b("stroke", { opacity: 0 }))));
        }var h,
            i = d.length + d.width,
            k = 2 * i,
            l = 2 * -(d.width + d.length) + "px",
            m = g(e(), { position: "absolute", top: l, left: l });if (d.shadow) for (h = 1; h <= d.lines; h++) f(h, -2, "progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)");for (h = 1; h <= d.lines; h++) f(h);return c(a, m);
      }, k.prototype.opacity = function (a, b, c, d) {
        var e = a.firstChild;d = d.shadow && d.lines || 0, e && b + d < e.childNodes.length && (e = e.childNodes[b + d], e = e && e.firstChild, e = e && e.firstChild, e && (e.opacity = c));
      };
    }var m,
        n = ["webkit", "Moz", "ms", "O"],
        o = {},
        p = function () {
      var d = a("style", { type: "text/css" });return c(b.getElementsByTagName("head")[0], d), d.sheet || d.styleSheet;
    }(),
        q = { lines: 12, length: 7, width: 5, radius: 10, rotate: 0, corners: 1, color: "#000", direction: 1, speed: 1, trail: 100, opacity: .25, fps: 20, zIndex: 2e9, className: "spinner", top: "auto", left: "auto", position: "relative" };k.defaults = {}, h(k.prototype, { spin: function (b) {
        this.stop();var c,
            d,
            e = this,
            f = e.opts,
            h = e.el = g(a(0, { className: f.className }), { position: f.position, width: 0, zIndex: f.zIndex }),
            j = f.radius + f.length + f.width;if (b && (b.insertBefore(h, b.firstChild || null), d = i(b), c = i(h), g(h, { left: ("auto" == f.left ? d.x - c.x + (b.offsetWidth >> 1) : parseInt(f.left, 10) + j) + "px", top: ("auto" == f.top ? d.y - c.y + (b.offsetHeight >> 1) : parseInt(f.top, 10) + j) + "px" })), h.setAttribute("role", "progressbar"), e.lines(h, e.opts), !m) {
          var k,
              l = 0,
              n = (f.lines - 1) * (1 - f.direction) / 2,
              o = f.fps,
              p = o / f.speed,
              q = (1 - f.opacity) / (p * f.trail / 100),
              r = p / f.lines;!function s() {
            l++;for (var a = 0; a < f.lines; a++) k = Math.max(1 - (l + (f.lines - a) * r) % p * q, f.opacity), e.opacity(h, a * f.direction + n, k, f);e.timeout = e.el && setTimeout(s, ~~(1e3 / o));
          }();
        }return e;
      }, stop: function () {
        var a = this.el;return a && (clearTimeout(this.timeout), a.parentNode && a.parentNode.removeChild(a), this.el = e), this;
      }, lines: function (b, e) {
        function f(b, c) {
          return g(a(), { position: "absolute", width: e.length + e.width + "px", height: e.width + "px", background: b, boxShadow: c, transformOrigin: "left", transform: "rotate(" + ~~(360 / e.lines * i + e.rotate) + "deg) translate(" + e.radius + "px,0)", borderRadius: (e.corners * e.width >> 1) + "px" });
        }for (var h, i = 0, k = (e.lines - 1) * (1 - e.direction) / 2; i < e.lines; i++) h = g(a(), { position: "absolute", top: 1 + ~(e.width / 2) + "px", transform: e.hwaccel ? "translate3d(0,0,0)" : "", opacity: e.opacity, animation: m && d(e.opacity, e.trail, k + i * e.direction, e.lines) + " " + 1 / e.speed + "s linear infinite" }), e.shadow && c(h, g(f("#000", "0 0 4px #000"), { top: "2px" })), c(b, c(h, f(j(e.color, i), "0 0 1px rgba(0,0,0,.1)")));return b;
      }, opacity: function (a, b, c) {
        b < a.childNodes.length && (a.childNodes[b].style.opacity = c);
      } });var r = g(a("group"), { behavior: "url(#default#VML)" });return !f(r, "transform") && r.adj ? l() : m = f(r, "animation"), k;
  });var Cc,
      Dc,
      Ec = d(a),
      Fc = d(b),
      Gc = "quirks" === c.hash.replace("#", ""),
      Hc = uc.csstransforms3d,
      Ic = Hc && !Gc,
      Jc = Hc || "CSS1Compat" === b.compatMode,
      Kc = vc.ok,
      Lc = navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i),
      Mc = !Ic || Lc,
      Nc = navigator.msPointerEnabled,
      Oc = "onwheel" in b.createElement("div") ? "wheel" : b.onmousewheel !== e ? "mousewheel" : "DOMMouseScroll",
      Pc = 250,
      Qc = 300,
      Rc = 1400,
      Sc = 5e3,
      Tc = 2,
      Uc = 64,
      Vc = 500,
      Wc = 333,
      Xc = "$stageFrame",
      Yc = "$navDotFrame",
      Zc = "$navThumbFrame",
      $c = "auto",
      _c = f([.1, 0, .25, 1]),
      ad = 99999,
      bd = "50%",
      cd = { width: null, minwidth: null, maxwidth: "100%", height: null, minheight: null, maxheight: null, ratio: null, margin: Tc, glimpse: 0, fit: "contain", position: bd, thumbposition: bd, nav: "dots", navposition: "bottom", navwidth: null, thumbwidth: Uc, thumbheight: Uc, thumbmargin: Tc, thumbborderwidth: Tc, thumbfit: "cover", allowfullscreen: !1, transition: "slide", clicktransition: null, transitionduration: Qc, captions: !0, hash: !1, startindex: 0, loop: !1, autoplay: !1, stopautoplayontouch: !0, keyboard: !1, arrows: !0, click: !0, swipe: !0, trackpad: !1, enableifsingleframe: !1, controlsonstart: !0, shuffle: !1, direction: "ltr", shadows: !0, spinner: null },
      dd = { left: !0, right: !0, down: !1, up: !1, space: !1, home: !1, end: !1 };G.stop = function (a) {
    G.ii[a] = !1;
  };var ed, fd, gd, hd;jQuery.Fotorama = function (a, e) {
    function f() {
      d.each(yd, function (a, b) {
        if (!b.i) {
          b.i = me++;var c = A(b.video, !0);if (c) {
            var d = {};b.video = c, b.img || b.thumb ? b.thumbsReady = !0 : d = B(b, yd, ie), C(yd, { img: d.img, thumb: d.thumb }, b.i, ie);
          }
        }
      });
    }function g(a) {
      return Zd[a] || ie.fullScreen;
    }function i(a) {
      var b = "keydown." + ib,
          c = ib + je,
          d = "keydown." + c,
          f = "resize." + c + " orientationchange." + c;a ? (Fc.on(d, function (a) {
        var b, c;Cd && 27 === a.keyCode ? (b = !0, md(Cd, !0, !0)) : (ie.fullScreen || e.keyboard && !ie.index) && (27 === a.keyCode ? (b = !0, ie.cancelFullScreen()) : a.shiftKey && 32 === a.keyCode && g("space") || 37 === a.keyCode && g("left") || 38 === a.keyCode && g("up") ? c = "<" : 32 === a.keyCode && g("space") || 39 === a.keyCode && g("right") || 40 === a.keyCode && g("down") ? c = ">" : 36 === a.keyCode && g("home") ? c = "<<" : 35 === a.keyCode && g("end") && (c = ">>")), (b || c) && Y(a), c && ie.show({ index: c, slow: a.altKey, user: !0 });
      }), ie.index || Fc.off(b).on(b, "textarea, input, select", function (a) {
        !Dc.hasClass(jb) && a.stopPropagation();
      }), Ec.on(f, ie.resize)) : (Fc.off(d), Ec.off(f));
    }function j(b) {
      b !== j.f && (b ? (a.html("").addClass(ib + " " + ke).append(qe).before(oe).before(pe), gb(ie)) : (qe.detach(), oe.detach(), pe.detach(), a.html(ne.urtext).removeClass(ke), hb(ie)), i(b), j.f = b);
    }function m() {
      yd = ie.data = yd || P(e.data) || D(a), zd = ie.size = yd.length, !xd.ok && e.shuffle && O(yd), f(), Je = y(Je), zd && j(!0);
    }function o() {
      var a = 2 > zd && !e.enableifsingleframe || Cd;Me.noMove = a || Sd, Me.noSwipe = a || !e.swipe, !Wd && se.toggleClass(Bb, !e.click && !Me.noMove && !Me.noSwipe), Nc && qe.toggleClass(sb, !Me.noSwipe);
    }function t(a) {
      a === !0 && (a = ""), e.autoplay = Math.max(+a || Sc, 1.5 * Vd);
    }function u() {
      function a(a, c) {
        b[a ? "add" : "remove"].push(c);
      }ie.options = e = R(e), Sd = "crossfade" === e.transition || "dissolve" === e.transition, Md = e.loop && (zd > 2 || Sd && (!Wd || "slide" !== Wd)), Vd = +e.transitionduration || Qc, Yd = "rtl" === e.direction, Zd = d.extend({}, e.keyboard && dd, e.keyboard);var b = { add: [], remove: [] };zd > 1 || e.enableifsingleframe ? (Nd = e.nav, Pd = "top" === e.navposition, b.remove.push(Xb), we.toggle(!!e.arrows)) : (Nd = !1, we.hide()), Rb(), Bd = new zc(d.extend(Ac, e.spinner, Bc, { direction: Yd ? -1 : 1 })), Gc(), Hc(), e.autoplay && t(e.autoplay), Td = n(e.thumbwidth) || Uc, Ud = n(e.thumbheight) || Uc, Ne.ok = Pe.ok = e.trackpad && !Mc, o(), ed(e, [Le]), Od = "thumbs" === Nd, Od ? (lc(zd, "navThumb"), Ad = Be, he = Zc, J(oe, d.Fotorama.jst.style({ w: Td, h: Ud, b: e.thumbborderwidth, m: e.thumbmargin, s: je, q: !Jc })), ye.addClass(Lb).removeClass(Kb)) : "dots" === Nd ? (lc(zd, "navDot"), Ad = Ae, he = Yc, ye.addClass(Kb).removeClass(Lb)) : (Nd = !1, ye.removeClass(Lb + " " + Kb)), Nd && (Pd ? xe.insertBefore(re) : xe.insertAfter(re), wc.nav = !1, wc(Ad, ze, "nav")), Qd = e.allowfullscreen, Qd ? (De.prependTo(re), Rd = Kc && "native" === Qd) : (De.detach(), Rd = !1), a(Sd, ob), a(!Sd, pb), a(!e.captions, vb), a(Yd, tb), a("always" !== e.arrows, wb), Xd = e.shadows && !Mc, a(!Xd, rb), qe.addClass(b.add.join(" ")).removeClass(b.remove.join(" ")), Ke = d.extend({}, e);
    }function x(a) {
      return 0 > a ? (zd + a % zd) % zd : a >= zd ? a % zd : a;
    }function y(a) {
      return h(a, 0, zd - 1);
    }function z(a) {
      return Md ? x(a) : y(a);
    }function E(a) {
      return a > 0 || Md ? a - 1 : !1;
    }function U(a) {
      return zd - 1 > a || Md ? a + 1 : !1;
    }function $() {
      Me.min = Md ? -1 / 0 : -r(zd - 1, Le.w, e.margin, Fd), Me.max = Md ? 1 / 0 : -r(0, Le.w, e.margin, Fd), Me.snap = Le.w + e.margin;
    }function bb() {
      Oe.min = Math.min(0, Le.nw - ze.width()), Oe.max = 0, ze.toggleClass(Bb, !(Oe.noMove = Oe.min === Oe.max));
    }function cb(a, b, c) {
      if ("number" == typeof a) {
        a = new Array(a);var e = !0;
      }return d.each(a, function (a, d) {
        if (e && (d = a), "number" == typeof d) {
          var f = yd[x(d)];if (f) {
            var g = "$" + b + "Frame",
                h = f[g];c.call(this, a, d, f, h, g, h && h.data());
          }
        }
      });
    }function fb(a, b, c, d) {
      (!$d || "*" === $d && d === Ld) && (a = q(e.width) || q(a) || Vc, b = q(e.height) || q(b) || Wc, ie.resize({ width: a, ratio: e.ratio || c || a / b }, 0, d !== Ld && "*"));
    }function Pb(a, b, c, f, g, h) {
      cb(a, b, function (a, i, j, k, l, m) {
        function n(a) {
          var b = x(i);fd(a, { index: b, src: w, frame: yd[b] });
        }function o() {
          t.remove(), d.Fotorama.cache[w] = "error", j.html && "stage" === b || !y || y === w ? (!w || j.html || r ? "stage" === b && (k.trigger("f:load").removeClass(ac + " " + _b).addClass(bc), n("load"), fb()) : (k.trigger("f:error").removeClass(ac).addClass(_b), n("error")), m.state = "error", !(zd > 1 && yd[i] === j) || j.html || j.deleted || j.video || r || (j.deleted = !0, ie.splice(i, 1))) : (j[v] = w = y, Pb([i], b, c, f, g, !0));
        }function p() {
          d.Fotorama.measures[w] = u.measures = d.Fotorama.measures[w] || { width: s.width, height: s.height, ratio: s.width / s.height }, fb(u.measures.width, u.measures.height, u.measures.ratio, i), t.off("load error").addClass(fc + (r ? " " + gc : "")).prependTo(k), I(t, (d.isFunction(c) ? c() : c) || Le, f || j.fit || e.fit, g || j.position || e.position), d.Fotorama.cache[w] = m.state = "loaded", setTimeout(function () {
            k.trigger("f:load").removeClass(ac + " " + _b).addClass(bc + " " + (r ? cc : dc)), "stage" === b ? n("load") : (j.thumbratio === $c || !j.thumbratio && e.thumbratio === $c) && (j.thumbratio = u.measures.ratio, vd());
          }, 0);
        }function q() {
          var a = 10;G(function () {
            return !fe || !a-- && !Mc;
          }, function () {
            p();
          });
        }if (k) {
          var r = ie.fullScreen && j.full && j.full !== j.img && !m.$full && "stage" === b;if (!m.$img || h || r) {
            var s = new Image(),
                t = d(s),
                u = t.data();m[r ? "$full" : "$img"] = t;var v = "stage" === b ? r ? "full" : "img" : "thumb",
                w = j[v],
                y = r ? null : j["stage" === b ? "thumb" : "img"];if ("navThumb" === b && (k = m.$wrap), !w) return void o();d.Fotorama.cache[w] ? !function z() {
              "error" === d.Fotorama.cache[w] ? o() : "loaded" === d.Fotorama.cache[w] ? setTimeout(q, 0) : setTimeout(z, 100);
            }() : (d.Fotorama.cache[w] = "*", t.on("load", q).on("error", o)), m.state = "", s.src = w;
          }
        }
      });
    }function Qb(a) {
      Ie.append(Bd.spin().el).appendTo(a);
    }function Rb() {
      Ie.detach(), Bd && Bd.stop();
    }function Sb() {
      var a = Dd[Xc];a && !a.data().state && (Qb(a), a.on("f:load f:error", function () {
        a.off("f:load f:error"), Rb();
      }));
    }function ec(a) {
      W(a, sd), X(a, function () {
        setTimeout(function () {
          Q(ye);
        }, 0), Rc({ time: Vd, guessIndex: d(this).data().eq, minMax: Oe });
      });
    }function lc(a, b) {
      cb(a, b, function (a, c, e, f, g, h) {
        if (!f) {
          f = e[g] = qe[g].clone(), h = f.data(), h.data = e;var i = f[0];"stage" === b ? (e.html && d('<div class="' + kc + '"></div>').append(e._html ? d(e.html).removeAttr("id").html(e._html) : e.html).appendTo(f), e.caption && d(N(oc, N(pc, e.caption))).appendTo(f), e.video && f.addClass(zb).append(Fe.clone()), X(i, function () {
            setTimeout(function () {
              Q(re);
            }, 0), pd({ index: h.eq, user: !0 });
          }), te = te.add(f)) : "navDot" === b ? (ec(i), Ae = Ae.add(f)) : "navThumb" === b && (ec(i), h.$wrap = f.children(":first"), Be = Be.add(f), e.video && h.$wrap.append(Fe.clone()));
        }
      });
    }function sc(a, b, c, d) {
      return a && a.length && I(a, b, c, d);
    }function tc(a) {
      cb(a, "stage", function (a, b, c, f, g, h) {
        if (f) {
          var i = x(b),
              j = c.fit || e.fit,
              k = c.position || e.position;h.eq = i, Re[Xc][i] = f.css(d.extend({ left: Sd ? 0 : r(b, Le.w, e.margin, Fd) }, Sd && l(0))), F(f[0]) && (f.appendTo(se), md(c.$video)), sc(h.$img, Le, j, k), sc(h.$full, Le, j, k);
        }
      });
    }function uc(a, b) {
      if ("thumbs" === Nd && !isNaN(a)) {
        var c = -a,
            f = -a + Le.nw;Be.each(function () {
          var a = d(this),
              g = a.data(),
              h = g.eq,
              i = function () {
            return { h: Ud, w: g.w };
          },
              j = i(),
              k = yd[h] || {},
              l = k.thumbfit || e.thumbfit,
              m = k.thumbposition || e.thumbposition;j.w = g.w, g.l + g.w < c || g.l > f || sc(g.$img, j, l, m) || b && Pb([h], "navThumb", i, l, m);
        });
      }
    }function wc(a, b, c) {
      if (!wc[c]) {
        var f = "nav" === c && Od,
            g = 0;b.append(a.filter(function () {
          for (var a, b = d(this), c = b.data(), e = 0, f = yd.length; f > e; e++) if (c.data === yd[e]) {
            a = !0, c.eq = e;break;
          }return a || b.remove() && !1;
        }).sort(function (a, b) {
          return d(a).data().eq - d(b).data().eq;
        }).each(function () {
          if (f) {
            var a = d(this),
                b = a.data(),
                c = Math.round(Ud * b.data.thumbratio) || Td;b.l = g, b.w = c, a.css({ width: c }), g += c + e.thumbmargin;
          }
        })), wc[c] = !0;
      }
    }function xc(a) {
      return a - Se > Le.w / 3;
    }function yc(a) {
      return !(Md || Je + a && Je - zd + a || Cd);
    }function Gc() {
      var a = yc(0),
          b = yc(1);ue.toggleClass(Eb, a).attr(V(a)), ve.toggleClass(Eb, b).attr(V(b));
    }function Hc() {
      Ne.ok && (Ne.prevent = { "<": yc(0), ">": yc(1) });
    }function Lc(a) {
      var b,
          c,
          d = a.data();return Od ? (b = d.l, c = d.w) : (b = a.position().left, c = a.width()), { c: b + c / 2, min: -b + 10 * e.thumbmargin, max: -b + Le.w - c - 10 * e.thumbmargin };
    }function Oc(a) {
      var b = Dd[he].data();_(Ce, { time: 1.2 * a, pos: b.l, width: b.w - 2 * e.thumbborderwidth });
    }function Rc(a) {
      var b = yd[a.guessIndex][he];if (b) {
        var c = Oe.min !== Oe.max,
            d = a.minMax || c && Lc(Dd[he]),
            e = c && (a.keep && Rc.l ? Rc.l : h((a.coo || Le.nw / 2) - Lc(b).c, d.min, d.max)),
            f = c && h(e, Oe.min, Oe.max),
            g = 1.1 * a.time;_(ze, { time: g, pos: f || 0, onEnd: function () {
            uc(f, !0);
          } }), ld(ye, K(f, Oe.min, Oe.max)), Rc.l = e;
      }
    }function Tc() {
      _c(he), Qe[he].push(Dd[he].addClass(Wb));
    }function _c(a) {
      for (var b = Qe[a]; b.length;) b.shift().removeClass(Wb);
    }function bd(a) {
      var b = Re[a];d.each(Ed, function (a, c) {
        delete b[x(c)];
      }), d.each(b, function (a, c) {
        delete b[a], c.detach();
      });
    }function cd(a) {
      Fd = Gd = Je;var b = Dd[Xc];b && (_c(Xc), Qe[Xc].push(b.addClass(Wb)), a || ie.show.onEnd(!0), v(se, 0, !0), bd(Xc), tc(Ed), $(), bb());
    }function ed(a, b) {
      a && d.each(b, function (b, c) {
        c && d.extend(c, { width: a.width || c.width, height: a.height, minwidth: a.minwidth, maxwidth: a.maxwidth, minheight: a.minheight, maxheight: a.maxheight, ratio: S(a.ratio) });
      });
    }function fd(b, c) {
      a.trigger(ib + ":" + b, [ie, c]);
    }function gd() {
      clearTimeout(hd.t), fe = 1, e.stopautoplayontouch ? ie.stopAutoplay() : ce = !0;
    }function hd() {
      fe && (e.stopautoplayontouch || (id(), jd()), hd.t = setTimeout(function () {
        fe = 0;
      }, Qc + Pc));
    }function id() {
      ce = !(!Cd && !de);
    }function jd() {
      if (clearTimeout(jd.t), G.stop(jd.w), !e.autoplay || ce) return void (ie.autoplay && (ie.autoplay = !1, fd("stopautoplay")));ie.autoplay || (ie.autoplay = !0, fd("startautoplay"));var a = Je,
          b = Dd[Xc].data();jd.w = G(function () {
        return b.state || a !== Je;
      }, function () {
        jd.t = setTimeout(function () {
          if (!ce && a === Je) {
            var b = Kd,
                c = yd[b][Xc].data();jd.w = G(function () {
              return c.state || b !== Kd;
            }, function () {
              ce || b !== Kd || ie.show(Md ? Z(!Yd) : Kd);
            });
          }
        }, e.autoplay);
      });
    }function kd() {
      ie.fullScreen && (ie.fullScreen = !1, Kc && vc.cancel(le), Dc.removeClass(jb), Cc.removeClass(jb), a.removeClass(Zb).insertAfter(pe), Le = d.extend({}, ee), md(Cd, !0, !0), rd("x", !1), ie.resize(), Pb(Ed, "stage"), Q(Ec, ae, _d), fd("fullscreenexit"));
    }function ld(a, b) {
      Xd && (a.removeClass(Ub + " " + Vb), b && !Cd && a.addClass(b.replace(/^|\s/g, " " + Tb + "--")));
    }function md(a, b, c) {
      b && (qe.removeClass(nb), Cd = !1, o()), a && a !== Cd && (a.remove(), fd("unloadvideo")), c && (id(), jd());
    }function nd(a) {
      qe.toggleClass(qb, a);
    }function od(a) {
      if (!Me.flow) {
        var b = a ? a.pageX : od.x,
            c = b && !yc(xc(b)) && e.click;od.p !== c && re.toggleClass(Cb, c) && (od.p = c, od.x = b);
      }
    }function pd(a) {
      clearTimeout(pd.t), e.clicktransition && e.clicktransition !== e.transition ? setTimeout(function () {
        var b = e.transition;ie.setOptions({ transition: e.clicktransition }), Wd = b, pd.t = setTimeout(function () {
          ie.show(a);
        }, 10);
      }, 0) : ie.show(a);
    }function qd(a, b) {
      var c = a.target,
          f = d(c);f.hasClass(mc) ? ie.playVideo() : c === Ee ? ie.toggleFullScreen() : Cd ? c === He && md(Cd, !0, !0) : b ? nd() : e.click && pd({ index: a.shiftKey || Z(xc(a._x)), slow: a.altKey, user: !0 });
    }function rd(a, b) {
      Me[a] = Oe[a] = b;
    }function sd(a) {
      var b = d(this).data().eq;pd({ index: b, slow: a.altKey, user: !0, coo: a._x - ye.offset().left });
    }function td(a) {
      pd({ index: we.index(this) ? ">" : "<", slow: a.altKey, user: !0 });
    }function ud(a) {
      X(a, function () {
        setTimeout(function () {
          Q(re);
        }, 0), nd(!1);
      });
    }function vd() {
      if (m(), u(), !vd.i) {
        vd.i = !0;var a = e.startindex;(a || e.hash && c.hash) && (Ld = L(a || c.hash.replace(/^#/, ""), yd, 0 === ie.index || a, a)), Je = Fd = Gd = Hd = Ld = z(Ld) || 0;
      }if (zd) {
        if (wd()) return;Cd && md(Cd, !0), Ed = [], bd(Xc), vd.ok = !0, ie.show({ index: Je, time: 0 }), ie.resize();
      } else ie.destroy();
    }function wd() {
      return !wd.f === Yd ? (wd.f = Yd, Je = zd - 1 - Je, ie.reverse(), !0) : void 0;
    }function xd() {
      xd.ok || (xd.ok = !0, fd("ready"));
    }Cc = d("html"), Dc = d("body");var yd,
        zd,
        Ad,
        Bd,
        Cd,
        Dd,
        Ed,
        Fd,
        Gd,
        Hd,
        Id,
        Jd,
        Kd,
        Ld,
        Md,
        Nd,
        Od,
        Pd,
        Qd,
        Rd,
        Sd,
        Td,
        Ud,
        Vd,
        Wd,
        Xd,
        Yd,
        Zd,
        $d,
        _d,
        ae,
        be,
        ce,
        de,
        ee,
        fe,
        ge,
        he,
        ie = this,
        je = d.now(),
        ke = ib + je,
        le = a[0],
        me = 1,
        ne = a.data(),
        oe = d("<style></style>"),
        pe = d(N(Yb)),
        qe = d(N(kb)),
        re = d(N(xb)).appendTo(qe),
        se = (re[0], d(N(Ab)).appendTo(re)),
        te = d(),
        ue = d(N(Db + " " + Fb + rc)),
        ve = d(N(Db + " " + Gb + rc)),
        we = ue.add(ve).appendTo(re),
        xe = d(N(Ib)),
        ye = d(N(Hb)).appendTo(xe),
        ze = d(N(Jb)).appendTo(ye),
        Ae = d(),
        Be = d(),
        Ce = (se.data(), ze.data(), d(N(jc)).appendTo(ze)),
        De = d(N($b + rc)),
        Ee = De[0],
        Fe = d(N(mc)),
        Ge = d(N(nc)).appendTo(re),
        He = Ge[0],
        Ie = d(N(qc)),
        Je = !1,
        Ke = {},
        Le = {},
        Me = {},
        Ne = {},
        Oe = {},
        Pe = {},
        Qe = {},
        Re = {},
        Se = 0,
        Te = [];
    qe[Xc] = d(N(yb)), qe[Zc] = d(N(Mb + " " + Ob + rc, N(ic))), qe[Yc] = d(N(Mb + " " + Nb + rc, N(hc))), Qe[Xc] = [], Qe[Zc] = [], Qe[Yc] = [], Re[Xc] = {}, qe.addClass(Ic ? mb : lb).toggleClass(qb, !e.controlsonstart), ne.fotorama = this, ie.startAutoplay = function (a) {
      return ie.autoplay ? this : (ce = de = !1, t(a || e.autoplay), jd(), this);
    }, ie.stopAutoplay = function () {
      return ie.autoplay && (ce = de = !0, jd()), this;
    }, ie.show = function (a) {
      var b;"object" != typeof a ? (b = a, a = {}) : b = a.index, b = ">" === b ? Gd + 1 : "<" === b ? Gd - 1 : "<<" === b ? 0 : ">>" === b ? zd - 1 : b, b = isNaN(b) ? L(b, yd, !0) : b, b = "undefined" == typeof b ? Je || 0 : b, ie.activeIndex = Je = z(b), Id = E(Je), Jd = U(Je), Kd = x(Je + (Yd ? -1 : 1)), Ed = [Je, Id, Jd], Gd = Md ? b : Je;var c = Math.abs(Hd - Gd),
          d = w(a.time, function () {
        return Math.min(Vd * (1 + (c - 1) / 12), 2 * Vd);
      }),
          f = a.overPos;a.slow && (d *= 10);var g = Dd;ie.activeFrame = Dd = yd[Je];var i = g === Dd && !a.user;md(Cd, Dd.i !== yd[x(Fd)].i), lc(Ed, "stage"), tc(Mc ? [Gd] : [Gd, E(Gd), U(Gd)]), rd("go", !0), i || fd("show", { user: a.user, time: d }), ce = !0;var j = ie.show.onEnd = function (b) {
        if (!j.ok) {
          if (j.ok = !0, b || cd(!0), i || fd("showend", { user: a.user }), !b && Wd && Wd !== e.transition) return ie.setOptions({ transition: Wd }), void (Wd = !1);Sb(), Pb(Ed, "stage"), rd("go", !1), Hc(), od(), id(), jd();
        }
      };if (Sd) {
        var k = Dd[Xc],
            l = Je !== Hd ? yd[Hd][Xc] : null;ab(k, l, te, { time: d, method: e.transition, onEnd: j }, Te);
      } else _(se, { pos: -r(Gd, Le.w, e.margin, Fd), overPos: f, time: d, onEnd: j });if (Gc(), Nd) {
        Tc();var m = y(Je + h(Gd - Hd, -1, 1));Rc({ time: d, coo: m !== Je && a.coo, guessIndex: "undefined" != typeof a.coo ? m : Je, keep: i }), Od && Oc(d);
      }return be = "undefined" != typeof Hd && Hd !== Je, Hd = Je, e.hash && be && !ie.eq && H(Dd.id || Je + 1), this;
    }, ie.requestFullScreen = function () {
      return Qd && !ie.fullScreen && (_d = Ec.scrollTop(), ae = Ec.scrollLeft(), Q(Ec), rd("x", !0), ee = d.extend({}, Le), a.addClass(Zb).appendTo(Dc.addClass(jb)), Cc.addClass(jb), md(Cd, !0, !0), ie.fullScreen = !0, Rd && vc.request(le), ie.resize(), Pb(Ed, "stage"), Sb(), fd("fullscreenenter")), this;
    }, ie.cancelFullScreen = function () {
      return Rd && vc.is() ? vc.cancel(b) : kd(), this;
    }, ie.toggleFullScreen = function () {
      return ie[(ie.fullScreen ? "cancel" : "request") + "FullScreen"]();
    }, T(b, vc.event, function () {
      !yd || vc.is() || Cd || kd();
    }), ie.resize = function (a) {
      if (!yd) return this;var b = arguments[1] || 0,
          c = arguments[2];ed(ie.fullScreen ? { width: "100%", maxwidth: null, minwidth: null, height: "100%", maxheight: null, minheight: null } : R(a), [Le, c || ie.fullScreen || e]);var d = Le.width,
          f = Le.height,
          g = Le.ratio,
          i = Ec.height() - (Nd ? ye.height() : 0);return q(d) && (qe.addClass(ub).css({ width: d, minWidth: Le.minwidth || 0, maxWidth: Le.maxwidth || ad }), d = Le.W = Le.w = qe.width(), Le.nw = Nd && p(e.navwidth, d) || d, e.glimpse && (Le.w -= Math.round(2 * (p(e.glimpse, d) || 0))), se.css({ width: Le.w, marginLeft: (Le.W - Le.w) / 2 }), f = p(f, i), f = f || g && d / g, f && (d = Math.round(d), f = Le.h = Math.round(h(f, p(Le.minheight, i), p(Le.maxheight, i))), re.stop().animate({ width: d, height: f }, b, function () {
        qe.removeClass(ub);
      }), cd(), Nd && (ye.stop().animate({ width: Le.nw }, b), Rc({ guessIndex: Je, time: b, keep: !0 }), Od && wc.nav && Oc(b)), $d = c || !0, xd())), Se = re.offset().left, this;
    }, ie.setOptions = function (a) {
      return d.extend(e, a), vd(), this;
    }, ie.shuffle = function () {
      return yd && O(yd) && vd(), this;
    }, ie.destroy = function () {
      return ie.cancelFullScreen(), ie.stopAutoplay(), yd = ie.data = null, j(), Ed = [], bd(Xc), vd.ok = !1, this;
    }, ie.playVideo = function () {
      var a = Dd,
          b = a.video,
          c = Je;return "object" == typeof b && a.videoReady && (Rd && ie.fullScreen && ie.cancelFullScreen(), G(function () {
        return !vc.is() || c !== Je;
      }, function () {
        c === Je && (a.$video = a.$video || d(d.Fotorama.jst.video(b)), a.$video.appendTo(a[Xc]), qe.addClass(nb), Cd = a.$video, o(), we.blur(), De.blur(), fd("loadvideo"));
      })), this;
    }, ie.stopVideo = function () {
      return md(Cd, !0, !0), this;
    }, re.on("mousemove", od), Me = db(se, { onStart: gd, onMove: function (a, b) {
        ld(re, b.edge);
      }, onTouchEnd: hd, onEnd: function (a) {
        ld(re);var b = (Nc && !ge || a.touch) && e.arrows && "always" !== e.arrows;if (a.moved || b && a.pos !== a.newPos && !a.control) {
          var c = s(a.newPos, Le.w, e.margin, Fd);ie.show({ index: c, time: Sd ? Vd : a.time, overPos: a.overPos, user: !0 });
        } else a.aborted || a.control || qd(a.startEvent, b);
      }, timeLow: 1, timeHigh: 1, friction: 2, select: "." + Xb + ", ." + Xb + " *", $wrap: re }), Oe = db(ze, { onStart: gd, onMove: function (a, b) {
        ld(ye, b.edge);
      }, onTouchEnd: hd, onEnd: function (a) {
        function b() {
          Rc.l = a.newPos, id(), jd(), uc(a.newPos, !0);
        }if (a.moved) a.pos !== a.newPos ? (ce = !0, _(ze, { time: a.time, pos: a.newPos, overPos: a.overPos, onEnd: b }), uc(a.newPos), Xd && ld(ye, K(a.newPos, Oe.min, Oe.max))) : b();else {
          var c = a.$target.closest("." + Mb, ze)[0];c && sd.call(c, a.startEvent);
        }
      }, timeLow: .5, timeHigh: 2, friction: 5, $wrap: ye }), Ne = eb(re, { shift: !0, onEnd: function (a, b) {
        gd(), hd(), ie.show({ index: b, slow: a.altKey });
      } }), Pe = eb(ye, { onEnd: function (a, b) {
        gd(), hd();var c = v(ze) + .25 * b;ze.css(k(h(c, Oe.min, Oe.max))), Xd && ld(ye, K(c, Oe.min, Oe.max)), Pe.prevent = { "<": c >= Oe.max, ">": c <= Oe.min }, clearTimeout(Pe.t), Pe.t = setTimeout(function () {
          Rc.l = c, uc(c, !0);
        }, Pc), uc(c);
      } }), qe.hover(function () {
      setTimeout(function () {
        fe || nd(!(ge = !0));
      }, 0);
    }, function () {
      ge && nd(!(ge = !1));
    }), M(we, function (a) {
      Y(a), td.call(this, a);
    }, { onStart: function () {
        gd(), Me.control = !0;
      }, onTouchEnd: hd }), we.each(function () {
      W(this, function (a) {
        td.call(this, a);
      }), ud(this);
    }), W(Ee, ie.toggleFullScreen), ud(Ee), d.each("load push pop shift unshift reverse sort splice".split(" "), function (a, b) {
      ie[b] = function () {
        return yd = yd || [], "load" !== b ? Array.prototype[b].apply(yd, arguments) : arguments[0] && "object" == typeof arguments[0] && arguments[0].length && (yd = P(arguments[0])), vd(), ie;
      };
    }), vd();
  }, d.fn.fotorama = function (b) {
    return this.each(function () {
      var c = this,
          e = d(this),
          f = e.data(),
          g = f.fotorama;g ? g.setOptions(b, !0) : G(function () {
        return !E(c);
      }, function () {
        f.urtext = e.html(), new d.Fotorama(e, d.extend({}, cd, a.fotoramaDefaults, b, f));
      });
    });
  }, d.Fotorama.instances = [], d.Fotorama.cache = {}, d.Fotorama.measures = {}, d = d || {}, d.Fotorama = d.Fotorama || {}, d.Fotorama.jst = d.Fotorama.jst || {}, d.Fotorama.jst.style = function (a) {
    {
      var b,
          c = "";tc.escape;
    }return c += ".fotorama" + (null == (b = a.s) ? "" : b) + " .fotorama__nav--thumbs .fotorama__nav__frame{\npadding:" + (null == (b = a.m) ? "" : b) + "px;\nheight:" + (null == (b = a.h) ? "" : b) + "px}\n.fotorama" + (null == (b = a.s) ? "" : b) + " .fotorama__thumb-border{\nheight:" + (null == (b = a.h - a.b * (a.q ? 0 : 2)) ? "" : b) + "px;\nborder-width:" + (null == (b = a.b) ? "" : b) + "px;\nmargin-top:" + (null == (b = a.m) ? "" : b) + "px}";
  }, d.Fotorama.jst.video = function (a) {
    function b() {
      c += d.call(arguments, "");
    }var c = "",
        d = (tc.escape, Array.prototype.join);return c += '<div class="fotorama__video"><iframe src="', b(("youtube" == a.type ? a.p + "youtube.com/embed/" + a.id + "?autoplay=1" : "vimeo" == a.type ? a.p + "player.vimeo.com/video/" + a.id + "?autoplay=1&badge=0" : a.id) + (a.s && "custom" != a.type ? "&" + a.s : "")), c += '" frameborder="0" allowfullscreen></iframe></div>\n';
  }, d(function () {
    d("." + ib + ':not([data-auto="false"])').fotorama();
  });
}(window, document, location, "undefined" != typeof jQuery && jQuery);
/*
* jquery-match-height 0.7.0 by @liabru
* http://brm.io/jquery-match-height/
* License MIT
*/
!function (t) {
  "use strict";
  "function" == typeof define && define.amd ? define(["jquery"], t) : "undefined" != typeof module && module.exports ? module.exports = t(require("jquery")) : t(jQuery);
}(function (t) {
  var e = -1,
      o = -1,
      i = function (t) {
    return parseFloat(t) || 0;
  },
      a = function (e) {
    var o = 1,
        a = t(e),
        n = null,
        r = [];return a.each(function () {
      var e = t(this),
          a = e.offset().top - i(e.css("margin-top")),
          s = r.length > 0 ? r[r.length - 1] : null;null === s ? r.push(e) : Math.floor(Math.abs(n - a)) <= o ? r[r.length - 1] = s.add(e) : r.push(e), n = a;
    }), r;
  },
      n = function (e) {
    var o = {
      byRow: !0, property: "height", target: null, remove: !1 };return "object" == typeof e ? t.extend(o, e) : ("boolean" == typeof e ? o.byRow = e : "remove" === e && (o.remove = !0), o);
  },
      r = t.fn.matchHeight = function (e) {
    var o = n(e);if (o.remove) {
      var i = this;return this.css(o.property, ""), t.each(r._groups, function (t, e) {
        e.elements = e.elements.not(i);
      }), this;
    }return this.length <= 1 && !o.target ? this : (r._groups.push({ elements: this, options: o }), r._apply(this, o), this);
  };r.version = "0.7.0", r._groups = [], r._throttle = 80, r._maintainScroll = !1, r._beforeUpdate = null, r._afterUpdate = null, r._rows = a, r._parse = i, r._parseOptions = n, r._apply = function (e, o) {
    var s = n(o),
        h = t(e),
        l = [h],
        c = t(window).scrollTop(),
        p = t("html").outerHeight(!0),
        d = h.parents().filter(":hidden");return d.each(function () {
      var e = t(this);e.data("style-cache", e.attr("style"));
    }), d.css("display", "block"), s.byRow && !s.target && (h.each(function () {
      var e = t(this),
          o = e.css("display");"inline-block" !== o && "flex" !== o && "inline-flex" !== o && (o = "block"), e.data("style-cache", e.attr("style")), e.css({ display: o, "padding-top": "0",
        "padding-bottom": "0", "margin-top": "0", "margin-bottom": "0", "border-top-width": "0", "border-bottom-width": "0", height: "100px", overflow: "hidden" });
    }), l = a(h), h.each(function () {
      var e = t(this);e.attr("style", e.data("style-cache") || "");
    })), t.each(l, function (e, o) {
      var a = t(o),
          n = 0;if (s.target) n = s.target.outerHeight(!1);else {
        if (s.byRow && a.length <= 1) return void a.css(s.property, "");a.each(function () {
          var e = t(this),
              o = e.attr("style"),
              i = e.css("display");"inline-block" !== i && "flex" !== i && "inline-flex" !== i && (i = "block");var a = {
            display: i };a[s.property] = "", e.css(a), e.outerHeight(!1) > n && (n = e.outerHeight(!1)), o ? e.attr("style", o) : e.css("display", "");
        });
      }a.each(function () {
        var e = t(this),
            o = 0;s.target && e.is(s.target) || ("border-box" !== e.css("box-sizing") && (o += i(e.css("border-top-width")) + i(e.css("border-bottom-width")), o += i(e.css("padding-top")) + i(e.css("padding-bottom"))), e.css(s.property, n - o + "px"));
      });
    }), d.each(function () {
      var e = t(this);e.attr("style", e.data("style-cache") || null);
    }), r._maintainScroll && t(window).scrollTop(c / p * t("html").outerHeight(!0)), this;
  }, r._applyDataApi = function () {
    var e = {};t("[data-match-height], [data-mh]").each(function () {
      var o = t(this),
          i = o.attr("data-mh") || o.attr("data-match-height");i in e ? e[i] = e[i].add(o) : e[i] = o;
    }), t.each(e, function () {
      this.matchHeight(!0);
    });
  };var s = function (e) {
    r._beforeUpdate && r._beforeUpdate(e, r._groups), t.each(r._groups, function () {
      r._apply(this.elements, this.options);
    }), r._afterUpdate && r._afterUpdate(e, r._groups);
  };r._update = function (i, a) {
    if (a && "resize" === a.type) {
      var n = t(window).width();if (n === e) return;e = n;
    }i ? -1 === o && (o = setTimeout(function () {
      s(a), o = -1;
    }, r._throttle)) : s(a);
  }, t(r._applyDataApi), t(window).bind("load", function (t) {
    r._update(!1, t);
  }), t(window).bind("resize orientationchange", function (t) {
    r._update(!0, t);
  });
});
/*
 *  Vide - v0.5.0
 *  Easy as hell jQuery plugin for video backgrounds.
 *  http://vodkabears.github.io/vide/
 *
 *  Made by Ilya Makarov
 *  Under MIT License
 */
!function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    factory(require('jquery'));
  } else {
    factory(root.jQuery);
  }
}(this, function ($) {

  'use strict';

  /**
   * Name of the plugin
   * @private
   * @const
   * @type {String}
   */

  var PLUGIN_NAME = 'vide';

  /**
   * Default settings
   * @private
   * @const
   * @type {Object}
   */
  var DEFAULTS = {
    volume: 1,
    playbackRate: 1,
    muted: true,
    loop: true,
    autoplay: true,
    position: '50% 50%',
    posterType: 'detect',
    resizing: true,
    bgColor: 'transparent',
    className: ''
  };

  /**
   * Not implemented error message
   * @private
   * @const
   * @type {String}
   */
  var NOT_IMPLEMENTED_MSG = 'Not implemented';

  /**
   * Parse a string with options
   * @private
   * @param {String} str
   * @returns {Object|String}
   */
  function parseOptions(str) {
    var obj = {};
    var delimiterIndex;
    var option;
    var prop;
    var val;
    var arr;
    var len;
    var i;

    // Remove spaces around delimiters and split
    arr = str.replace(/\s*:\s*/g, ':').replace(/\s*,\s*/g, ',').split(',');

    // Parse a string
    for (i = 0, len = arr.length; i < len; i++) {
      option = arr[i];

      // Ignore urls and a string without colon delimiters
      if (option.search(/^(http|https|ftp):\/\//) !== -1 || option.search(':') === -1) {
        break;
      }

      delimiterIndex = option.indexOf(':');
      prop = option.substring(0, delimiterIndex);
      val = option.substring(delimiterIndex + 1);

      // If val is an empty string, make it undefined
      if (!val) {
        val = undefined;
      }

      // Convert a string value if it is like a boolean
      if (typeof val === 'string') {
        val = val === 'true' || (val === 'false' ? false : val);
      }

      // Convert a string value if it is like a number
      if (typeof val === 'string') {
        val = !isNaN(val) ? +val : val;
      }

      obj[prop] = val;
    }

    // If nothing is parsed
    if (prop == null && val == null) {
      return str;
    }

    return obj;
  }

  /**
   * Parse a position option
   * @private
   * @param {String} str
   * @returns {Object}
   */
  function parsePosition(str) {
    str = '' + str;

    // Default value is a center
    var args = str.split(/\s+/);
    var x = '50%';
    var y = '50%';
    var len;
    var arg;
    var i;

    for (i = 0, len = args.length; i < len; i++) {
      arg = args[i];

      // Convert values
      if (arg === 'left') {
        x = '0%';
      } else if (arg === 'right') {
        x = '100%';
      } else if (arg === 'top') {
        y = '0%';
      } else if (arg === 'bottom') {
        y = '100%';
      } else if (arg === 'center') {
        if (i === 0) {
          x = '50%';
        } else {
          y = '50%';
        }
      } else {
        if (i === 0) {
          x = arg;
        } else {
          y = arg;
        }
      }
    }

    return { x: x, y: y };
  }

  /**
   * Search a poster
   * @private
   * @param {String} path
   * @param {Function} callback
   */
  function findPoster(path, callback) {
    var onLoad = function () {
      callback(this.src);
    };

    $('<img src="' + path + '.gif">').load(onLoad);
    $('<img src="' + path + '.jpg">').load(onLoad);
    $('<img src="' + path + '.jpeg">').load(onLoad);
    $('<img src="' + path + '.png">').load(onLoad);
  }

  /**
   * Vide constructor
   * @param {HTMLElement} element
   * @param {Object|String} path
   * @param {Object|String} options
   * @constructor
   */
  function Vide(element, path, options) {
    this.$element = $(element);

    // Parse path
    if (typeof path === 'string') {
      path = parseOptions(path);
    }

    // Parse options
    if (!options) {
      options = {};
    } else if (typeof options === 'string') {
      options = parseOptions(options);
    }

    // Remove an extension
    if (typeof path === 'string') {
      path = path.replace(/\.\w*$/, '');
    } else if (typeof path === 'object') {
      for (var i in path) {
        if (path.hasOwnProperty(i)) {
          path[i] = path[i].replace(/\.\w*$/, '');
        }
      }
    }

    this.settings = $.extend({}, DEFAULTS, options);
    this.path = path;

    // https://github.com/VodkaBears/Vide/issues/110
    try {
      this.init();
    } catch (e) {
      if (e.message !== NOT_IMPLEMENTED_MSG) {
        throw e;
      }
    }
  }

  /**
   * Initialization
   * @public
   */
  Vide.prototype.init = function () {
    var vide = this;
    var path = vide.path;
    var poster = path;
    var sources = '';
    var $element = vide.$element;
    var settings = vide.settings;
    var position = parsePosition(settings.position);
    var posterType = settings.posterType;
    var $video;
    var $wrapper;

    // Set styles of a video wrapper
    $wrapper = vide.$wrapper = $('<div>').addClass(settings.className).css({
      position: 'absolute',
      'z-index': -1,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      overflow: 'hidden',
      '-webkit-background-size': 'cover',
      '-moz-background-size': 'cover',
      '-o-background-size': 'cover',
      'background-size': 'cover',
      'background-color': settings.bgColor,
      'background-repeat': 'no-repeat',
      'background-position': position.x + ' ' + position.y
    });

    // Get a poster path
    if (typeof path === 'object') {
      if (path.poster) {
        poster = path.poster;
      } else {
        if (path.mp4) {
          poster = path.mp4;
        } else if (path.webm) {
          poster = path.webm;
        } else if (path.ogv) {
          poster = path.ogv;
        }
      }
    }

    // Set a video poster
    if (posterType === 'detect') {
      findPoster(poster, function (url) {
        $wrapper.css('background-image', 'url(' + url + ')');
      });
    } else if (posterType !== 'none') {
      $wrapper.css('background-image', 'url(' + poster + '.' + posterType + ')');
    }

    // If a parent element has a static position, make it relative
    if ($element.css('position') === 'static') {
      $element.css('position', 'relative');
    }

    $element.prepend($wrapper);

    if (typeof path === 'object') {
      if (path.mp4) {
        sources += '<source src="' + path.mp4 + '.mp4" type="video/mp4">';
      }

      if (path.webm) {
        sources += '<source src="' + path.webm + '.webm" type="video/webm">';
      }

      if (path.ogv) {
        sources += '<source src="' + path.ogv + '.ogv" type="video/ogg">';
      }

      $video = vide.$video = $('<video>' + sources + '</video>');
    } else {
      $video = vide.$video = $('<video>' + '<source src="' + path + '.mp4" type="video/mp4">' + '<source src="' + path + '.webm" type="video/webm">' + '<source src="' + path + '.ogv" type="video/ogg">' + '</video>');
    }

    // https://github.com/VodkaBears/Vide/issues/110
    try {
      $video

      // Set video properties
      .prop({
        autoplay: settings.autoplay,
        loop: settings.loop,
        volume: settings.volume,
        muted: settings.muted,
        defaultMuted: settings.muted,
        playbackRate: settings.playbackRate,
        defaultPlaybackRate: settings.playbackRate
      });
    } catch (e) {
      throw new Error(NOT_IMPLEMENTED_MSG);
    }

    // Video alignment
    $video.css({
      margin: 'auto',
      position: 'absolute',
      'z-index': -1,
      top: position.y,
      left: position.x,
      '-webkit-transform': 'translate(-' + position.x + ', -' + position.y + ')',
      '-ms-transform': 'translate(-' + position.x + ', -' + position.y + ')',
      '-moz-transform': 'translate(-' + position.x + ', -' + position.y + ')',
      transform: 'translate(-' + position.x + ', -' + position.y + ')',

      // Disable visibility, while loading
      visibility: 'hidden',
      opacity: 0
    }

    // Resize a video, when it's loaded
    ).one('canplaythrough.' + PLUGIN_NAME, function () {
      vide.resize();
    }

    // Make it visible, when it's already playing
    ).one('playing.' + PLUGIN_NAME, function () {
      $video.css({
        visibility: 'visible',
        opacity: 1
      });
      $wrapper.css('background-image', 'none');
    });

    // Resize event is available only for 'window'
    // Use another code solutions to detect DOM elements resizing
    $element.on('resize.' + PLUGIN_NAME, function () {
      if (settings.resizing) {
        vide.resize();
      }
    });

    // Append a video
    $wrapper.append($video);
  };

  /**
   * Get a video element
   * @public
   * @returns {HTMLVideoElement}
   */
  Vide.prototype.getVideoObject = function () {
    return this.$video[0];
  };

  /**
   * Resize a video background
   * @public
   */
  Vide.prototype.resize = function () {
    if (!this.$video) {
      return;
    }

    var $wrapper = this.$wrapper;
    var $video = this.$video;
    var video = $video[0];

    // Get a native video size
    var videoHeight = video.videoHeight;
    var videoWidth = video.videoWidth;

    // Get a wrapper size
    var wrapperHeight = $wrapper.height();
    var wrapperWidth = $wrapper.width();

    if (wrapperWidth / videoWidth > wrapperHeight / videoHeight) {
      $video.css({

        // +2 pixels to prevent an empty space after transformation
        width: wrapperWidth + 2,
        height: 'auto'
      });
    } else {
      $video.css({
        width: 'auto',

        // +2 pixels to prevent an empty space after transformation
        height: wrapperHeight + 2
      });
    }
  };

  /**
   * Destroy a video background
   * @public
   */
  Vide.prototype.destroy = function () {
    delete $[PLUGIN_NAME].lookup[this.index];
    this.$video && this.$video.off(PLUGIN_NAME);
    this.$element.off(PLUGIN_NAME).removeData(PLUGIN_NAME);
    this.$wrapper.remove();
  };

  /**
   * Special plugin object for instances.
   * @public
   * @type {Object}
   */
  $[PLUGIN_NAME] = {
    lookup: []
  };

  /**
   * Plugin constructor
   * @param {Object|String} path
   * @param {Object|String} options
   * @returns {JQuery}
   * @constructor
   */
  $.fn[PLUGIN_NAME] = function (path, options) {
    var instance;

    this.each(function () {
      instance = $.data(this, PLUGIN_NAME);

      // Destroy the plugin instance if exists
      instance && instance.destroy();

      // Create the plugin instance
      instance = new Vide(this, path, options);
      instance.index = $[PLUGIN_NAME].lookup.push(instance) - 1;
      $.data(this, PLUGIN_NAME, instance);
    });

    return this;
  };

  $(document).ready(function () {
    var $window = $(window);

    // Window resize event listener
    $window.on('resize.' + PLUGIN_NAME, function () {
      for (var len = $[PLUGIN_NAME].lookup.length, i = 0, instance; i < len; i++) {
        instance = $[PLUGIN_NAME].lookup[i];

        if (instance && instance.settings.resizing) {
          instance.resize();
        }
      }
    });

    // https://github.com/VodkaBears/Vide/issues/68
    $window.on('unload.' + PLUGIN_NAME, function () {
      return false;
    });

    // Auto initialization
    // Add 'data-vide-bg' attribute with a path to the video without extension
    // Also you can pass options throw the 'data-vide-options' attribute
    // 'data-vide-options' must be like 'muted: false, volume: 0.5'
    $(document).find('[data-' + PLUGIN_NAME + '-bg]').each(function (i, element) {
      var $element = $(element);
      var options = $element.data(PLUGIN_NAME + '-options');
      var path = $element.data(PLUGIN_NAME + '-bg');

      $element[PLUGIN_NAME](path, options);
    });
  });
});
/*
 *  Vide - v0.5.0
 *  Easy as hell jQuery plugin for video backgrounds.
 *  http://vodkabears.github.io/vide/
 *
 *  Made by Ilya Makarov
 *  Under MIT License
 */
!function (a, b) {
  "function" == typeof define && define.amd ? define(["jquery"], b) : b("object" == typeof exports ? require("jquery") : a.jQuery);
}(this, function (a) {
  "use strict";
  function b(a) {
    var b,
        c,
        d,
        e,
        f,
        g,
        h,
        i = {};for (f = a.replace(/\s*:\s*/g, ":").replace(/\s*,\s*/g, ",").split(","), h = 0, g = f.length; g > h && (c = f[h], -1 === c.search(/^(http|https|ftp):\/\//) && -1 !== c.search(":")); h++) b = c.indexOf(":"), d = c.substring(0, b), e = c.substring(b + 1), e || (e = void 0), "string" == typeof e && (e = "true" === e || ("false" === e ? !1 : e)), "string" == typeof e && (e = isNaN(e) ? e : +e), i[d] = e;return null == d && null == e ? a : i;
  }function c(a) {
    a = "" + a;var b,
        c,
        d,
        e = a.split(/\s+/),
        f = "50%",
        g = "50%";for (d = 0, b = e.length; b > d; d++) c = e[d], "left" === c ? f = "0%" : "right" === c ? f = "100%" : "top" === c ? g = "0%" : "bottom" === c ? g = "100%" : "center" === c ? 0 === d ? f = "50%" : g = "50%" : 0 === d ? f = c : g = c;return { x: f, y: g };
  }function d(b, c) {
    var d = function () {
      c(this.src);
    };a('<img src="' + b + '.gif">').load(d), a('<img src="' + b + '.jpg">').load(d), a('<img src="' + b + '.jpeg">').load(d), a('<img src="' + b + '.png">').load(d);
  }function e(c, d, e) {
    if (this.$element = a(c), "string" == typeof d && (d = b(d)), e ? "string" == typeof e && (e = b(e)) : e = {}, "string" == typeof d) d = d.replace(/\.\w*$/, "");else if ("object" == typeof d) for (var f in d) d.hasOwnProperty(f) && (d[f] = d[f].replace(/\.\w*$/, ""));this.settings = a.extend({}, g, e), this.path = d;try {
      this.init();
    } catch (i) {
      if (i.message !== h) throw i;
    }
  }var f = "vide",
      g = { volume: 1, playbackRate: 1, muted: !0, loop: !0, autoplay: !0, position: "50% 50%", posterType: "detect", resizing: !0, bgColor: "transparent", className: "" },
      h = "Not implemented";e.prototype.init = function () {
    var b,
        e,
        g = this,
        i = g.path,
        j = i,
        k = "",
        l = g.$element,
        m = g.settings,
        n = c(m.position),
        o = m.posterType;e = g.$wrapper = a("<div>").addClass(m.className).css({ position: "absolute", "z-index": -1, top: 0, left: 0, bottom: 0, right: 0, overflow: "hidden", "-webkit-background-size": "cover", "-moz-background-size": "cover", "-o-background-size": "cover", "background-size": "cover", "background-color": m.bgColor, "background-repeat": "no-repeat", "background-position": n.x + " " + n.y }), "object" == typeof i && (i.poster ? j = i.poster : i.mp4 ? j = i.mp4 : i.webm ? j = i.webm : i.ogv && (j = i.ogv)), "detect" === o ? d(j, function (a) {
      e.css("background-image", "url(" + a + ")");
    }) : "none" !== o && e.css("background-image", "url(" + j + "." + o + ")"), "static" === l.css("position") && l.css("position", "relative"), l.prepend(e), "object" == typeof i ? (i.mp4 && (k += '<source src="' + i.mp4 + '.mp4" type="video/mp4">'), i.webm && (k += '<source src="' + i.webm + '.webm" type="video/webm">'), i.ogv && (k += '<source src="' + i.ogv + '.ogv" type="video/ogg">'), b = g.$video = a("<video>" + k + "</video>")) : b = g.$video = a('<video><source src="' + i + '.mp4" type="video/mp4"><source src="' + i + '.webm" type="video/webm"><source src="' + i + '.ogv" type="video/ogg"></video>');try {
      b.prop({ autoplay: m.autoplay, loop: m.loop, volume: m.volume, muted: m.muted, defaultMuted: m.muted, playbackRate: m.playbackRate, defaultPlaybackRate: m.playbackRate });
    } catch (p) {
      throw new Error(h);
    }b.css({ margin: "auto", position: "absolute", "z-index": -1, top: n.y, left: n.x, "-webkit-transform": "translate(-" + n.x + ", -" + n.y + ")", "-ms-transform": "translate(-" + n.x + ", -" + n.y + ")", "-moz-transform": "translate(-" + n.x + ", -" + n.y + ")", transform: "translate(-" + n.x + ", -" + n.y + ")", visibility: "hidden", opacity: 0 }).one("canplaythrough." + f, function () {
      g.resize();
    }).one("playing." + f, function () {
      b.css({ visibility: "visible", opacity: 1 }), e.css("background-image", "none");
    }), l.on("resize." + f, function () {
      m.resizing && g.resize();
    }), e.append(b);
  }, e.prototype.getVideoObject = function () {
    return this.$video[0];
  }, e.prototype.resize = function () {
    if (this.$video) {
      var a = this.$wrapper,
          b = this.$video,
          c = b[0],
          d = c.videoHeight,
          e = c.videoWidth,
          f = a.height(),
          g = a.width();g / e > f / d ? b.css({ width: g + 2, height: "auto" }) : b.css({ width: "auto", height: f + 2 });
    }
  }, e.prototype.destroy = function () {
    delete a[f].lookup[this.index], this.$video && this.$video.off(f), this.$element.off(f).removeData(f), this.$wrapper.remove();
  }, a[f] = { lookup: [] }, a.fn[f] = function (b, c) {
    var d;return this.each(function () {
      d = a.data(this, f), d && d.destroy(), d = new e(this, b, c), d.index = a[f].lookup.push(d) - 1, a.data(this, f, d);
    }), this;
  }, a(document).ready(function () {
    var b = a(window);b.on("resize." + f, function () {
      for (var b, c = a[f].lookup.length, d = 0; c > d; d++) b = a[f].lookup[d], b && b.settings.resizing && b.resize();
    }), b.on("unload." + f, function () {
      return !1;
    }), a(document).find("[data-" + f + "-bg]").each(function (b, c) {
      var d = a(c),
          e = d.data(f + "-options"),
          g = d.data(f + "-bg");d[f](g, e);
    });
  });
});
//! moment.js
//! version : 2.18.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com
!function (a, b) {
  "object" == typeof exports && "undefined" != typeof module ? module.exports = b() : "function" == typeof define && define.amd ? define(b) : a.moment = b();
}(this, function () {
  "use strict";
  function a() {
    return sd.apply(null, arguments);
  }function b(a) {
    sd = a;
  }function c(a) {
    return a instanceof Array || "[object Array]" === Object.prototype.toString.call(a);
  }function d(a) {
    return null != a && "[object Object]" === Object.prototype.toString.call(a);
  }function e(a) {
    var b;for (b in a) return !1;return !0;
  }function f(a) {
    return void 0 === a;
  }function g(a) {
    return "number" == typeof a || "[object Number]" === Object.prototype.toString.call(a);
  }function h(a) {
    return a instanceof Date || "[object Date]" === Object.prototype.toString.call(a);
  }function i(a, b) {
    var c,
        d = [];for (c = 0; c < a.length; ++c) d.push(b(a[c], c));return d;
  }function j(a, b) {
    return Object.prototype.hasOwnProperty.call(a, b);
  }function k(a, b) {
    for (var c in b) j(b, c) && (a[c] = b[c]);return j(b, "toString") && (a.toString = b.toString), j(b, "valueOf") && (a.valueOf = b.valueOf), a;
  }function l(a, b, c, d) {
    return sb(a, b, c, d, !0).utc();
  }function m() {
    return { empty: !1, unusedTokens: [], unusedInput: [], overflow: -2, charsLeftOver: 0, nullInput: !1, invalidMonth: null, invalidFormat: !1, userInvalidated: !1, iso: !1, parsedDateParts: [], meridiem: null, rfc2822: !1, weekdayMismatch: !1 };
  }function n(a) {
    return null == a._pf && (a._pf = m()), a._pf;
  }function o(a) {
    if (null == a._isValid) {
      var b = n(a),
          c = ud.call(b.parsedDateParts, function (a) {
        return null != a;
      }),
          d = !isNaN(a._d.getTime()) && b.overflow < 0 && !b.empty && !b.invalidMonth && !b.invalidWeekday && !b.nullInput && !b.invalidFormat && !b.userInvalidated && (!b.meridiem || b.meridiem && c);if (a._strict && (d = d && 0 === b.charsLeftOver && 0 === b.unusedTokens.length && void 0 === b.bigHour), null != Object.isFrozen && Object.isFrozen(a)) return d;a._isValid = d;
    }return a._isValid;
  }function p(a) {
    var b = l(NaN);return null != a ? k(n(b), a) : n(b).userInvalidated = !0, b;
  }function q(a, b) {
    var c, d, e;if (f(b._isAMomentObject) || (a._isAMomentObject = b._isAMomentObject), f(b._i) || (a._i = b._i), f(b._f) || (a._f = b._f), f(b._l) || (a._l = b._l), f(b._strict) || (a._strict = b._strict), f(b._tzm) || (a._tzm = b._tzm), f(b._isUTC) || (a._isUTC = b._isUTC), f(b._offset) || (a._offset = b._offset), f(b._pf) || (a._pf = n(b)), f(b._locale) || (a._locale = b._locale), vd.length > 0) for (c = 0; c < vd.length; c++) d = vd[c], e = b[d], f(e) || (a[d] = e);return a;
  }function r(b) {
    q(this, b), this._d = new Date(null != b._d ? b._d.getTime() : NaN), this.isValid() || (this._d = new Date(NaN)), wd === !1 && (wd = !0, a.updateOffset(this), wd = !1);
  }function s(a) {
    return a instanceof r || null != a && null != a._isAMomentObject;
  }function t(a) {
    return a < 0 ? Math.ceil(a) || 0 : Math.floor(a);
  }function u(a) {
    var b = +a,
        c = 0;return 0 !== b && isFinite(b) && (c = t(b)), c;
  }function v(a, b, c) {
    var d,
        e = Math.min(a.length, b.length),
        f = Math.abs(a.length - b.length),
        g = 0;for (d = 0; d < e; d++) (c && a[d] !== b[d] || !c && u(a[d]) !== u(b[d])) && g++;return g + f;
  }function w(b) {
    a.suppressDeprecationWarnings === !1 && "undefined" != typeof console && console.warn && console.warn("Deprecation warning: " + b);
  }function x(b, c) {
    var d = !0;return k(function () {
      if (null != a.deprecationHandler && a.deprecationHandler(null, b), d) {
        for (var e, f = [], g = 0; g < arguments.length; g++) {
          if (e = "", "object" == typeof arguments[g]) {
            e += "\n[" + g + "] ";for (var h in arguments[0]) e += h + ": " + arguments[0][h] + ", ";e = e.slice(0, -2);
          } else e = arguments[g];f.push(e);
        }w(b + "\nArguments: " + Array.prototype.slice.call(f).join("") + "\n" + new Error().stack), d = !1;
      }return c.apply(this, arguments);
    }, c);
  }function y(b, c) {
    null != a.deprecationHandler && a.deprecationHandler(b, c), xd[b] || (w(c), xd[b] = !0);
  }function z(a) {
    return a instanceof Function || "[object Function]" === Object.prototype.toString.call(a);
  }function A(a) {
    var b, c;for (c in a) b = a[c], z(b) ? this[c] = b : this["_" + c] = b;this._config = a, this._dayOfMonthOrdinalParseLenient = new RegExp((this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) + "|" + /\d{1,2}/.source);
  }function B(a, b) {
    var c,
        e = k({}, a);for (c in b) j(b, c) && (d(a[c]) && d(b[c]) ? (e[c] = {}, k(e[c], a[c]), k(e[c], b[c])) : null != b[c] ? e[c] = b[c] : delete e[c]);for (c in a) j(a, c) && !j(b, c) && d(a[c]) && (e[c] = k({}, e[c]));return e;
  }function C(a) {
    null != a && this.set(a);
  }function D(a, b, c) {
    var d = this._calendar[a] || this._calendar.sameElse;return z(d) ? d.call(b, c) : d;
  }function E(a) {
    var b = this._longDateFormat[a],
        c = this._longDateFormat[a.toUpperCase()];return b || !c ? b : (this._longDateFormat[a] = c.replace(/MMMM|MM|DD|dddd/g, function (a) {
      return a.slice(1);
    }), this._longDateFormat[a]);
  }function F() {
    return this._invalidDate;
  }function G(a) {
    return this._ordinal.replace("%d", a);
  }function H(a, b, c, d) {
    var e = this._relativeTime[c];return z(e) ? e(a, b, c, d) : e.replace(/%d/i, a);
  }function I(a, b) {
    var c = this._relativeTime[a > 0 ? "future" : "past"];return z(c) ? c(b) : c.replace(/%s/i, b);
  }function J(a, b) {
    var c = a.toLowerCase();Hd[c] = Hd[c + "s"] = Hd[b] = a;
  }function K(a) {
    return "string" == typeof a ? Hd[a] || Hd[a.toLowerCase()] : void 0;
  }function L(a) {
    var b,
        c,
        d = {};for (c in a) j(a, c) && (b = K(c), b && (d[b] = a[c]));return d;
  }function M(a, b) {
    Id[a] = b;
  }function N(a) {
    var b = [];for (var c in a) b.push({ unit: c, priority: Id[c] });return b.sort(function (a, b) {
      return a.priority - b.priority;
    }), b;
  }function O(b, c) {
    return function (d) {
      return null != d ? (Q(this, b, d), a.updateOffset(this, c), this) : P(this, b);
    };
  }function P(a, b) {
    return a.isValid() ? a._d["get" + (a._isUTC ? "UTC" : "") + b]() : NaN;
  }function Q(a, b, c) {
    a.isValid() && a._d["set" + (a._isUTC ? "UTC" : "") + b](c);
  }function R(a) {
    return a = K(a), z(this[a]) ? this[a]() : this;
  }function S(a, b) {
    if ("object" == typeof a) {
      a = L(a);for (var c = N(a), d = 0; d < c.length; d++) this[c[d].unit](a[c[d].unit]);
    } else if (a = K(a), z(this[a])) return this[a](b);return this;
  }function T(a, b, c) {
    var d = "" + Math.abs(a),
        e = b - d.length,
        f = a >= 0;return (f ? c ? "+" : "" : "-") + Math.pow(10, Math.max(0, e)).toString().substr(1) + d;
  }function U(a, b, c, d) {
    var e = d;"string" == typeof d && (e = function () {
      return this[d]();
    }), a && (Md[a] = e), b && (Md[b[0]] = function () {
      return T(e.apply(this, arguments), b[1], b[2]);
    }), c && (Md[c] = function () {
      return this.localeData().ordinal(e.apply(this, arguments), a);
    });
  }function V(a) {
    return a.match(/\[[\s\S]/) ? a.replace(/^\[|\]$/g, "") : a.replace(/\\/g, "");
  }function W(a) {
    var b,
        c,
        d = a.match(Jd);for (b = 0, c = d.length; b < c; b++) Md[d[b]] ? d[b] = Md[d[b]] : d[b] = V(d[b]);return function (b) {
      var e,
          f = "";for (e = 0; e < c; e++) f += z(d[e]) ? d[e].call(b, a) : d[e];return f;
    };
  }function X(a, b) {
    return a.isValid() ? (b = Y(b, a.localeData()), Ld[b] = Ld[b] || W(b), Ld[b](a)) : a.localeData().invalidDate();
  }function Y(a, b) {
    function c(a) {
      return b.longDateFormat(a) || a;
    }var d = 5;for (Kd.lastIndex = 0; d >= 0 && Kd.test(a);) a = a.replace(Kd, c), Kd.lastIndex = 0, d -= 1;return a;
  }function Z(a, b, c) {
    ce[a] = z(b) ? b : function (a, d) {
      return a && c ? c : b;
    };
  }function $(a, b) {
    return j(ce, a) ? ce[a](b._strict, b._locale) : new RegExp(_(a));
  }function _(a) {
    return aa(a.replace("\\", "").replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (a, b, c, d, e) {
      return b || c || d || e;
    }));
  }function aa(a) {
    return a.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  }function ba(a, b) {
    var c,
        d = b;for ("string" == typeof a && (a = [a]), g(b) && (d = function (a, c) {
      c[b] = u(a);
    }), c = 0; c < a.length; c++) de[a[c]] = d;
  }function ca(a, b) {
    ba(a, function (a, c, d, e) {
      d._w = d._w || {}, b(a, d._w, d, e);
    });
  }function da(a, b, c) {
    null != b && j(de, a) && de[a](b, c._a, c, a);
  }function ea(a, b) {
    return new Date(Date.UTC(a, b + 1, 0)).getUTCDate();
  }function fa(a, b) {
    return a ? c(this._months) ? this._months[a.month()] : this._months[(this._months.isFormat || oe).test(b) ? "format" : "standalone"][a.month()] : c(this._months) ? this._months : this._months.standalone;
  }function ga(a, b) {
    return a ? c(this._monthsShort) ? this._monthsShort[a.month()] : this._monthsShort[oe.test(b) ? "format" : "standalone"][a.month()] : c(this._monthsShort) ? this._monthsShort : this._monthsShort.standalone;
  }function ha(a, b, c) {
    var d,
        e,
        f,
        g = a.toLocaleLowerCase();if (!this._monthsParse) for (this._monthsParse = [], this._longMonthsParse = [], this._shortMonthsParse = [], d = 0; d < 12; ++d) f = l([2e3, d]), this._shortMonthsParse[d] = this.monthsShort(f, "").toLocaleLowerCase(), this._longMonthsParse[d] = this.months(f, "").toLocaleLowerCase();return c ? "MMM" === b ? (e = ne.call(this._shortMonthsParse, g), e !== -1 ? e : null) : (e = ne.call(this._longMonthsParse, g), e !== -1 ? e : null) : "MMM" === b ? (e = ne.call(this._shortMonthsParse, g), e !== -1 ? e : (e = ne.call(this._longMonthsParse, g), e !== -1 ? e : null)) : (e = ne.call(this._longMonthsParse, g), e !== -1 ? e : (e = ne.call(this._shortMonthsParse, g), e !== -1 ? e : null));
  }function ia(a, b, c) {
    var d, e, f;if (this._monthsParseExact) return ha.call(this, a, b, c);for (this._monthsParse || (this._monthsParse = [], this._longMonthsParse = [], this._shortMonthsParse = []), d = 0; d < 12; d++) {
      if (e = l([2e3, d]), c && !this._longMonthsParse[d] && (this._longMonthsParse[d] = new RegExp("^" + this.months(e, "").replace(".", "") + "$", "i"), this._shortMonthsParse[d] = new RegExp("^" + this.monthsShort(e, "").replace(".", "") + "$", "i")), c || this._monthsParse[d] || (f = "^" + this.months(e, "") + "|^" + this.monthsShort(e, ""), this._monthsParse[d] = new RegExp(f.replace(".", ""), "i")), c && "MMMM" === b && this._longMonthsParse[d].test(a)) return d;if (c && "MMM" === b && this._shortMonthsParse[d].test(a)) return d;if (!c && this._monthsParse[d].test(a)) return d;
    }
  }function ja(a, b) {
    var c;if (!a.isValid()) return a;if ("string" == typeof b) if (/^\d+$/.test(b)) b = u(b);else if (b = a.localeData().monthsParse(b), !g(b)) return a;return c = Math.min(a.date(), ea(a.year(), b)), a._d["set" + (a._isUTC ? "UTC" : "") + "Month"](b, c), a;
  }function ka(b) {
    return null != b ? (ja(this, b), a.updateOffset(this, !0), this) : P(this, "Month");
  }function la() {
    return ea(this.year(), this.month());
  }function ma(a) {
    return this._monthsParseExact ? (j(this, "_monthsRegex") || oa.call(this), a ? this._monthsShortStrictRegex : this._monthsShortRegex) : (j(this, "_monthsShortRegex") || (this._monthsShortRegex = re), this._monthsShortStrictRegex && a ? this._monthsShortStrictRegex : this._monthsShortRegex);
  }function na(a) {
    return this._monthsParseExact ? (j(this, "_monthsRegex") || oa.call(this), a ? this._monthsStrictRegex : this._monthsRegex) : (j(this, "_monthsRegex") || (this._monthsRegex = se), this._monthsStrictRegex && a ? this._monthsStrictRegex : this._monthsRegex);
  }function oa() {
    function a(a, b) {
      return b.length - a.length;
    }var b,
        c,
        d = [],
        e = [],
        f = [];for (b = 0; b < 12; b++) c = l([2e3, b]), d.push(this.monthsShort(c, "")), e.push(this.months(c, "")), f.push(this.months(c, "")), f.push(this.monthsShort(c, ""));for (d.sort(a), e.sort(a), f.sort(a), b = 0; b < 12; b++) d[b] = aa(d[b]), e[b] = aa(e[b]);for (b = 0; b < 24; b++) f[b] = aa(f[b]);this._monthsRegex = new RegExp("^(" + f.join("|") + ")", "i"), this._monthsShortRegex = this._monthsRegex, this._monthsStrictRegex = new RegExp("^(" + e.join("|") + ")", "i"), this._monthsShortStrictRegex = new RegExp("^(" + d.join("|") + ")", "i");
  }function pa(a) {
    return qa(a) ? 366 : 365;
  }function qa(a) {
    return a % 4 === 0 && a % 100 !== 0 || a % 400 === 0;
  }function ra() {
    return qa(this.year());
  }function sa(a, b, c, d, e, f, g) {
    var h = new Date(a, b, c, d, e, f, g);return a < 100 && a >= 0 && isFinite(h.getFullYear()) && h.setFullYear(a), h;
  }function ta(a) {
    var b = new Date(Date.UTC.apply(null, arguments));return a < 100 && a >= 0 && isFinite(b.getUTCFullYear()) && b.setUTCFullYear(a), b;
  }function ua(a, b, c) {
    var d = 7 + b - c,
        e = (7 + ta(a, 0, d).getUTCDay() - b) % 7;return -e + d - 1;
  }function va(a, b, c, d, e) {
    var f,
        g,
        h = (7 + c - d) % 7,
        i = ua(a, d, e),
        j = 1 + 7 * (b - 1) + h + i;return j <= 0 ? (f = a - 1, g = pa(f) + j) : j > pa(a) ? (f = a + 1, g = j - pa(a)) : (f = a, g = j), { year: f, dayOfYear: g };
  }function wa(a, b, c) {
    var d,
        e,
        f = ua(a.year(), b, c),
        g = Math.floor((a.dayOfYear() - f - 1) / 7) + 1;return g < 1 ? (e = a.year() - 1, d = g + xa(e, b, c)) : g > xa(a.year(), b, c) ? (d = g - xa(a.year(), b, c), e = a.year() + 1) : (e = a.year(), d = g), { week: d, year: e };
  }function xa(a, b, c) {
    var d = ua(a, b, c),
        e = ua(a + 1, b, c);return (pa(a) - d + e) / 7;
  }function ya(a) {
    return wa(a, this._week.dow, this._week.doy).week;
  }function za() {
    return this._week.dow;
  }function Aa() {
    return this._week.doy;
  }function Ba(a) {
    var b = this.localeData().week(this);return null == a ? b : this.add(7 * (a - b), "d");
  }function Ca(a) {
    var b = wa(this, 1, 4).week;return null == a ? b : this.add(7 * (a - b), "d");
  }function Da(a, b) {
    return "string" != typeof a ? a : isNaN(a) ? (a = b.weekdaysParse(a), "number" == typeof a ? a : null) : parseInt(a, 10);
  }function Ea(a, b) {
    return "string" == typeof a ? b.weekdaysParse(a) % 7 || 7 : isNaN(a) ? null : a;
  }function Fa(a, b) {
    return a ? c(this._weekdays) ? this._weekdays[a.day()] : this._weekdays[this._weekdays.isFormat.test(b) ? "format" : "standalone"][a.day()] : c(this._weekdays) ? this._weekdays : this._weekdays.standalone;
  }function Ga(a) {
    return a ? this._weekdaysShort[a.day()] : this._weekdaysShort;
  }function Ha(a) {
    return a ? this._weekdaysMin[a.day()] : this._weekdaysMin;
  }function Ia(a, b, c) {
    var d,
        e,
        f,
        g = a.toLocaleLowerCase();if (!this._weekdaysParse) for (this._weekdaysParse = [], this._shortWeekdaysParse = [], this._minWeekdaysParse = [], d = 0; d < 7; ++d) f = l([2e3, 1]).day(d), this._minWeekdaysParse[d] = this.weekdaysMin(f, "").toLocaleLowerCase(), this._shortWeekdaysParse[d] = this.weekdaysShort(f, "").toLocaleLowerCase(), this._weekdaysParse[d] = this.weekdays(f, "").toLocaleLowerCase();return c ? "dddd" === b ? (e = ne.call(this._weekdaysParse, g), e !== -1 ? e : null) : "ddd" === b ? (e = ne.call(this._shortWeekdaysParse, g), e !== -1 ? e : null) : (e = ne.call(this._minWeekdaysParse, g), e !== -1 ? e : null) : "dddd" === b ? (e = ne.call(this._weekdaysParse, g), e !== -1 ? e : (e = ne.call(this._shortWeekdaysParse, g), e !== -1 ? e : (e = ne.call(this._minWeekdaysParse, g), e !== -1 ? e : null))) : "ddd" === b ? (e = ne.call(this._shortWeekdaysParse, g), e !== -1 ? e : (e = ne.call(this._weekdaysParse, g), e !== -1 ? e : (e = ne.call(this._minWeekdaysParse, g), e !== -1 ? e : null))) : (e = ne.call(this._minWeekdaysParse, g), e !== -1 ? e : (e = ne.call(this._weekdaysParse, g), e !== -1 ? e : (e = ne.call(this._shortWeekdaysParse, g), e !== -1 ? e : null)));
  }function Ja(a, b, c) {
    var d, e, f;if (this._weekdaysParseExact) return Ia.call(this, a, b, c);for (this._weekdaysParse || (this._weekdaysParse = [], this._minWeekdaysParse = [], this._shortWeekdaysParse = [], this._fullWeekdaysParse = []), d = 0; d < 7; d++) {
      if (e = l([2e3, 1]).day(d), c && !this._fullWeekdaysParse[d] && (this._fullWeekdaysParse[d] = new RegExp("^" + this.weekdays(e, "").replace(".", ".?") + "$", "i"), this._shortWeekdaysParse[d] = new RegExp("^" + this.weekdaysShort(e, "").replace(".", ".?") + "$", "i"), this._minWeekdaysParse[d] = new RegExp("^" + this.weekdaysMin(e, "").replace(".", ".?") + "$", "i")), this._weekdaysParse[d] || (f = "^" + this.weekdays(e, "") + "|^" + this.weekdaysShort(e, "") + "|^" + this.weekdaysMin(e, ""), this._weekdaysParse[d] = new RegExp(f.replace(".", ""), "i")), c && "dddd" === b && this._fullWeekdaysParse[d].test(a)) return d;if (c && "ddd" === b && this._shortWeekdaysParse[d].test(a)) return d;if (c && "dd" === b && this._minWeekdaysParse[d].test(a)) return d;if (!c && this._weekdaysParse[d].test(a)) return d;
    }
  }function Ka(a) {
    if (!this.isValid()) return null != a ? this : NaN;var b = this._isUTC ? this._d.getUTCDay() : this._d.getDay();return null != a ? (a = Da(a, this.localeData()), this.add(a - b, "d")) : b;
  }function La(a) {
    if (!this.isValid()) return null != a ? this : NaN;var b = (this.day() + 7 - this.localeData()._week.dow) % 7;return null == a ? b : this.add(a - b, "d");
  }function Ma(a) {
    if (!this.isValid()) return null != a ? this : NaN;if (null != a) {
      var b = Ea(a, this.localeData());return this.day(this.day() % 7 ? b : b - 7);
    }return this.day() || 7;
  }function Na(a) {
    return this._weekdaysParseExact ? (j(this, "_weekdaysRegex") || Qa.call(this), a ? this._weekdaysStrictRegex : this._weekdaysRegex) : (j(this, "_weekdaysRegex") || (this._weekdaysRegex = ye), this._weekdaysStrictRegex && a ? this._weekdaysStrictRegex : this._weekdaysRegex);
  }function Oa(a) {
    return this._weekdaysParseExact ? (j(this, "_weekdaysRegex") || Qa.call(this), a ? this._weekdaysShortStrictRegex : this._weekdaysShortRegex) : (j(this, "_weekdaysShortRegex") || (this._weekdaysShortRegex = ze), this._weekdaysShortStrictRegex && a ? this._weekdaysShortStrictRegex : this._weekdaysShortRegex);
  }function Pa(a) {
    return this._weekdaysParseExact ? (j(this, "_weekdaysRegex") || Qa.call(this), a ? this._weekdaysMinStrictRegex : this._weekdaysMinRegex) : (j(this, "_weekdaysMinRegex") || (this._weekdaysMinRegex = Ae), this._weekdaysMinStrictRegex && a ? this._weekdaysMinStrictRegex : this._weekdaysMinRegex);
  }function Qa() {
    function a(a, b) {
      return b.length - a.length;
    }var b,
        c,
        d,
        e,
        f,
        g = [],
        h = [],
        i = [],
        j = [];for (b = 0; b < 7; b++) c = l([2e3, 1]).day(b), d = this.weekdaysMin(c, ""), e = this.weekdaysShort(c, ""), f = this.weekdays(c, ""), g.push(d), h.push(e), i.push(f), j.push(d), j.push(e), j.push(f);for (g.sort(a), h.sort(a), i.sort(a), j.sort(a), b = 0; b < 7; b++) h[b] = aa(h[b]), i[b] = aa(i[b]), j[b] = aa(j[b]);this._weekdaysRegex = new RegExp("^(" + j.join("|") + ")", "i"), this._weekdaysShortRegex = this._weekdaysRegex, this._weekdaysMinRegex = this._weekdaysRegex, this._weekdaysStrictRegex = new RegExp("^(" + i.join("|") + ")", "i"), this._weekdaysShortStrictRegex = new RegExp("^(" + h.join("|") + ")", "i"), this._weekdaysMinStrictRegex = new RegExp("^(" + g.join("|") + ")", "i");
  }function Ra() {
    return this.hours() % 12 || 12;
  }function Sa() {
    return this.hours() || 24;
  }function Ta(a, b) {
    U(a, 0, 0, function () {
      return this.localeData().meridiem(this.hours(), this.minutes(), b);
    });
  }function Ua(a, b) {
    return b._meridiemParse;
  }function Va(a) {
    return "p" === (a + "").toLowerCase().charAt(0);
  }function Wa(a, b, c) {
    return a > 11 ? c ? "pm" : "PM" : c ? "am" : "AM";
  }function Xa(a) {
    return a ? a.toLowerCase().replace("_", "-") : a;
  }function Ya(a) {
    for (var b, c, d, e, f = 0; f < a.length;) {
      for (e = Xa(a[f]).split("-"), b = e.length, c = Xa(a[f + 1]), c = c ? c.split("-") : null; b > 0;) {
        if (d = Za(e.slice(0, b).join("-"))) return d;if (c && c.length >= b && v(e, c, !0) >= b - 1) break;b--;
      }f++;
    }return null;
  }function Za(a) {
    var b = null;if (!Fe[a] && "undefined" != typeof module && module && module.exports) try {
      b = Be._abbr, require("./locale/" + a), $a(b);
    } catch (a) {}return Fe[a];
  }function $a(a, b) {
    var c;return a && (c = f(b) ? bb(a) : _a(a, b), c && (Be = c)), Be._abbr;
  }function _a(a, b) {
    if (null !== b) {
      var c = Ee;if (b.abbr = a, null != Fe[a]) y("defineLocaleOverride", "use moment.updateLocale(localeName, config) to change an existing locale. moment.defineLocale(localeName, config) should only be used for creating a new locale See http://momentjs.com/guides/#/warnings/define-locale/ for more info."), c = Fe[a]._config;else if (null != b.parentLocale) {
        if (null == Fe[b.parentLocale]) return Ge[b.parentLocale] || (Ge[b.parentLocale] = []), Ge[b.parentLocale].push({ name: a, config: b }), null;c = Fe[b.parentLocale]._config;
      }return Fe[a] = new C(B(c, b)), Ge[a] && Ge[a].forEach(function (a) {
        _a(a.name, a.config);
      }), $a(a), Fe[a];
    }return delete Fe[a], null;
  }function ab(a, b) {
    if (null != b) {
      var c,
          d = Ee;null != Fe[a] && (d = Fe[a]._config), b = B(d, b), c = new C(b), c.parentLocale = Fe[a], Fe[a] = c, $a(a);
    } else null != Fe[a] && (null != Fe[a].parentLocale ? Fe[a] = Fe[a].parentLocale : null != Fe[a] && delete Fe[a]);return Fe[a];
  }function bb(a) {
    var b;if (a && a._locale && a._locale._abbr && (a = a._locale._abbr), !a) return Be;if (!c(a)) {
      if (b = Za(a)) return b;a = [a];
    }return Ya(a);
  }function cb() {
    return Ad(Fe);
  }function db(a) {
    var b,
        c = a._a;return c && n(a).overflow === -2 && (b = c[fe] < 0 || c[fe] > 11 ? fe : c[ge] < 1 || c[ge] > ea(c[ee], c[fe]) ? ge : c[he] < 0 || c[he] > 24 || 24 === c[he] && (0 !== c[ie] || 0 !== c[je] || 0 !== c[ke]) ? he : c[ie] < 0 || c[ie] > 59 ? ie : c[je] < 0 || c[je] > 59 ? je : c[ke] < 0 || c[ke] > 999 ? ke : -1, n(a)._overflowDayOfYear && (b < ee || b > ge) && (b = ge), n(a)._overflowWeeks && b === -1 && (b = le), n(a)._overflowWeekday && b === -1 && (b = me), n(a).overflow = b), a;
  }function eb(a) {
    var b,
        c,
        d,
        e,
        f,
        g,
        h = a._i,
        i = He.exec(h) || Ie.exec(h);if (i) {
      for (n(a).iso = !0, b = 0, c = Ke.length; b < c; b++) if (Ke[b][1].exec(i[1])) {
        e = Ke[b][0], d = Ke[b][2] !== !1;break;
      }if (null == e) return void (a._isValid = !1);if (i[3]) {
        for (b = 0, c = Le.length; b < c; b++) if (Le[b][1].exec(i[3])) {
          f = (i[2] || " ") + Le[b][0];break;
        }if (null == f) return void (a._isValid = !1);
      }if (!d && null != f) return void (a._isValid = !1);if (i[4]) {
        if (!Je.exec(i[4])) return void (a._isValid = !1);g = "Z";
      }a._f = e + (f || "") + (g || ""), lb(a);
    } else a._isValid = !1;
  }function fb(a) {
    var b,
        c,
        d,
        e,
        f,
        g,
        h,
        i,
        j = { " GMT": " +0000", " EDT": " -0400", " EST": " -0500", " CDT": " -0500", " CST": " -0600", " MDT": " -0600", " MST": " -0700", " PDT": " -0700", " PST": " -0800" },
        k = "YXWVUTSRQPONZABCDEFGHIKLM";if (b = a._i.replace(/\([^\)]*\)|[\n\t]/g, " ").replace(/(\s\s+)/g, " ").replace(/^\s|\s$/g, ""), c = Ne.exec(b)) {
      if (d = c[1] ? "ddd" + (5 === c[1].length ? ", " : " ") : "", e = "D MMM " + (c[2].length > 10 ? "YYYY " : "YY "), f = "HH:mm" + (c[4] ? ":ss" : ""), c[1]) {
        var l = new Date(c[2]),
            m = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][l.getDay()];if (c[1].substr(0, 3) !== m) return n(a).weekdayMismatch = !0, void (a._isValid = !1);
      }switch (c[5].length) {case 2:
          0 === i ? h = " +0000" : (i = k.indexOf(c[5][1].toUpperCase()) - 12, h = (i < 0 ? " -" : " +") + ("" + i).replace(/^-?/, "0").match(/..$/)[0] + "00");break;case 4:
          h = j[c[5]];break;default:
          h = j[" GMT"];}c[5] = h, a._i = c.splice(1).join(""), g = " ZZ", a._f = d + e + f + g, lb(a), n(a).rfc2822 = !0;
    } else a._isValid = !1;
  }function gb(b) {
    var c = Me.exec(b._i);return null !== c ? void (b._d = new Date(+c[1])) : (eb(b), void (b._isValid === !1 && (delete b._isValid, fb(b), b._isValid === !1 && (delete b._isValid, a.createFromInputFallback(b)))));
  }function hb(a, b, c) {
    return null != a ? a : null != b ? b : c;
  }function ib(b) {
    var c = new Date(a.now());return b._useUTC ? [c.getUTCFullYear(), c.getUTCMonth(), c.getUTCDate()] : [c.getFullYear(), c.getMonth(), c.getDate()];
  }function jb(a) {
    var b,
        c,
        d,
        e,
        f = [];if (!a._d) {
      for (d = ib(a), a._w && null == a._a[ge] && null == a._a[fe] && kb(a), null != a._dayOfYear && (e = hb(a._a[ee], d[ee]), (a._dayOfYear > pa(e) || 0 === a._dayOfYear) && (n(a)._overflowDayOfYear = !0), c = ta(e, 0, a._dayOfYear), a._a[fe] = c.getUTCMonth(), a._a[ge] = c.getUTCDate()), b = 0; b < 3 && null == a._a[b]; ++b) a._a[b] = f[b] = d[b];for (; b < 7; b++) a._a[b] = f[b] = null == a._a[b] ? 2 === b ? 1 : 0 : a._a[b];24 === a._a[he] && 0 === a._a[ie] && 0 === a._a[je] && 0 === a._a[ke] && (a._nextDay = !0, a._a[he] = 0), a._d = (a._useUTC ? ta : sa).apply(null, f), null != a._tzm && a._d.setUTCMinutes(a._d.getUTCMinutes() - a._tzm), a._nextDay && (a._a[he] = 24);
    }
  }function kb(a) {
    var b, c, d, e, f, g, h, i;if (b = a._w, null != b.GG || null != b.W || null != b.E) f = 1, g = 4, c = hb(b.GG, a._a[ee], wa(tb(), 1, 4).year), d = hb(b.W, 1), e = hb(b.E, 1), (e < 1 || e > 7) && (i = !0);else {
      f = a._locale._week.dow, g = a._locale._week.doy;var j = wa(tb(), f, g);c = hb(b.gg, a._a[ee], j.year), d = hb(b.w, j.week), null != b.d ? (e = b.d, (e < 0 || e > 6) && (i = !0)) : null != b.e ? (e = b.e + f, (b.e < 0 || b.e > 6) && (i = !0)) : e = f;
    }d < 1 || d > xa(c, f, g) ? n(a)._overflowWeeks = !0 : null != i ? n(a)._overflowWeekday = !0 : (h = va(c, d, e, f, g), a._a[ee] = h.year, a._dayOfYear = h.dayOfYear);
  }function lb(b) {
    if (b._f === a.ISO_8601) return void eb(b);if (b._f === a.RFC_2822) return void fb(b);b._a = [], n(b).empty = !0;var c,
        d,
        e,
        f,
        g,
        h = "" + b._i,
        i = h.length,
        j = 0;for (e = Y(b._f, b._locale).match(Jd) || [], c = 0; c < e.length; c++) f = e[c], d = (h.match($(f, b)) || [])[0], d && (g = h.substr(0, h.indexOf(d)), g.length > 0 && n(b).unusedInput.push(g), h = h.slice(h.indexOf(d) + d.length), j += d.length), Md[f] ? (d ? n(b).empty = !1 : n(b).unusedTokens.push(f), da(f, d, b)) : b._strict && !d && n(b).unusedTokens.push(f);n(b).charsLeftOver = i - j, h.length > 0 && n(b).unusedInput.push(h), b._a[he] <= 12 && n(b).bigHour === !0 && b._a[he] > 0 && (n(b).bigHour = void 0), n(b).parsedDateParts = b._a.slice(0), n(b).meridiem = b._meridiem, b._a[he] = mb(b._locale, b._a[he], b._meridiem), jb(b), db(b);
  }function mb(a, b, c) {
    var d;return null == c ? b : null != a.meridiemHour ? a.meridiemHour(b, c) : null != a.isPM ? (d = a.isPM(c), d && b < 12 && (b += 12), d || 12 !== b || (b = 0), b) : b;
  }function nb(a) {
    var b, c, d, e, f;if (0 === a._f.length) return n(a).invalidFormat = !0, void (a._d = new Date(NaN));for (e = 0; e < a._f.length; e++) f = 0, b = q({}, a), null != a._useUTC && (b._useUTC = a._useUTC), b._f = a._f[e], lb(b), o(b) && (f += n(b).charsLeftOver, f += 10 * n(b).unusedTokens.length, n(b).score = f, (null == d || f < d) && (d = f, c = b));k(a, c || b);
  }function ob(a) {
    if (!a._d) {
      var b = L(a._i);a._a = i([b.year, b.month, b.day || b.date, b.hour, b.minute, b.second, b.millisecond], function (a) {
        return a && parseInt(a, 10);
      }), jb(a);
    }
  }function pb(a) {
    var b = new r(db(qb(a)));return b._nextDay && (b.add(1, "d"), b._nextDay = void 0), b;
  }function qb(a) {
    var b = a._i,
        d = a._f;return a._locale = a._locale || bb(a._l), null === b || void 0 === d && "" === b ? p({ nullInput: !0 }) : ("string" == typeof b && (a._i = b = a._locale.preparse(b)), s(b) ? new r(db(b)) : (h(b) ? a._d = b : c(d) ? nb(a) : d ? lb(a) : rb(a), o(a) || (a._d = null), a));
  }function rb(b) {
    var e = b._i;f(e) ? b._d = new Date(a.now()) : h(e) ? b._d = new Date(e.valueOf()) : "string" == typeof e ? gb(b) : c(e) ? (b._a = i(e.slice(0), function (a) {
      return parseInt(a, 10);
    }), jb(b)) : d(e) ? ob(b) : g(e) ? b._d = new Date(e) : a.createFromInputFallback(b);
  }function sb(a, b, f, g, h) {
    var i = {};return f !== !0 && f !== !1 || (g = f, f = void 0), (d(a) && e(a) || c(a) && 0 === a.length) && (a = void 0), i._isAMomentObject = !0, i._useUTC = i._isUTC = h, i._l = f, i._i = a, i._f = b, i._strict = g, pb(i);
  }function tb(a, b, c, d) {
    return sb(a, b, c, d, !1);
  }function ub(a, b) {
    var d, e;if (1 === b.length && c(b[0]) && (b = b[0]), !b.length) return tb();for (d = b[0], e = 1; e < b.length; ++e) b[e].isValid() && !b[e][a](d) || (d = b[e]);return d;
  }function vb() {
    var a = [].slice.call(arguments, 0);return ub("isBefore", a);
  }function wb() {
    var a = [].slice.call(arguments, 0);return ub("isAfter", a);
  }function xb(a) {
    for (var b in a) if (Re.indexOf(b) === -1 || null != a[b] && isNaN(a[b])) return !1;for (var c = !1, d = 0; d < Re.length; ++d) if (a[Re[d]]) {
      if (c) return !1;parseFloat(a[Re[d]]) !== u(a[Re[d]]) && (c = !0);
    }return !0;
  }function yb() {
    return this._isValid;
  }function zb() {
    return Sb(NaN);
  }function Ab(a) {
    var b = L(a),
        c = b.year || 0,
        d = b.quarter || 0,
        e = b.month || 0,
        f = b.week || 0,
        g = b.day || 0,
        h = b.hour || 0,
        i = b.minute || 0,
        j = b.second || 0,
        k = b.millisecond || 0;this._isValid = xb(b), this._milliseconds = +k + 1e3 * j + 6e4 * i + 1e3 * h * 60 * 60, this._days = +g + 7 * f, this._months = +e + 3 * d + 12 * c, this._data = {}, this._locale = bb(), this._bubble();
  }function Bb(a) {
    return a instanceof Ab;
  }function Cb(a) {
    return a < 0 ? Math.round(-1 * a) * -1 : Math.round(a);
  }function Db(a, b) {
    U(a, 0, 0, function () {
      var a = this.utcOffset(),
          c = "+";return a < 0 && (a = -a, c = "-"), c + T(~~(a / 60), 2) + b + T(~~a % 60, 2);
    });
  }function Eb(a, b) {
    var c = (b || "").match(a);if (null === c) return null;var d = c[c.length - 1] || [],
        e = (d + "").match(Se) || ["-", 0, 0],
        f = +(60 * e[1]) + u(e[2]);return 0 === f ? 0 : "+" === e[0] ? f : -f;
  }function Fb(b, c) {
    var d, e;return c._isUTC ? (d = c.clone(), e = (s(b) || h(b) ? b.valueOf() : tb(b).valueOf()) - d.valueOf(), d._d.setTime(d._d.valueOf() + e), a.updateOffset(d, !1), d) : tb(b).local();
  }function Gb(a) {
    return 15 * -Math.round(a._d.getTimezoneOffset() / 15);
  }function Hb(b, c, d) {
    var e,
        f = this._offset || 0;if (!this.isValid()) return null != b ? this : NaN;if (null != b) {
      if ("string" == typeof b) {
        if (b = Eb(_d, b), null === b) return this;
      } else Math.abs(b) < 16 && !d && (b = 60 * b);return !this._isUTC && c && (e = Gb(this)), this._offset = b, this._isUTC = !0, null != e && this.add(e, "m"), f !== b && (!c || this._changeInProgress ? Xb(this, Sb(b - f, "m"), 1, !1) : this._changeInProgress || (this._changeInProgress = !0, a.updateOffset(this, !0), this._changeInProgress = null)), this;
    }return this._isUTC ? f : Gb(this);
  }function Ib(a, b) {
    return null != a ? ("string" != typeof a && (a = -a), this.utcOffset(a, b), this) : -this.utcOffset();
  }function Jb(a) {
    return this.utcOffset(0, a);
  }function Kb(a) {
    return this._isUTC && (this.utcOffset(0, a), this._isUTC = !1, a && this.subtract(Gb(this), "m")), this;
  }function Lb() {
    if (null != this._tzm) this.utcOffset(this._tzm, !1, !0);else if ("string" == typeof this._i) {
      var a = Eb($d, this._i);null != a ? this.utcOffset(a) : this.utcOffset(0, !0);
    }return this;
  }function Mb(a) {
    return !!this.isValid() && (a = a ? tb(a).utcOffset() : 0, (this.utcOffset() - a) % 60 === 0);
  }function Nb() {
    return this.utcOffset() > this.clone().month(0).utcOffset() || this.utcOffset() > this.clone().month(5).utcOffset();
  }function Ob() {
    if (!f(this._isDSTShifted)) return this._isDSTShifted;var a = {};if (q(a, this), a = qb(a), a._a) {
      var b = a._isUTC ? l(a._a) : tb(a._a);this._isDSTShifted = this.isValid() && v(a._a, b.toArray()) > 0;
    } else this._isDSTShifted = !1;return this._isDSTShifted;
  }function Pb() {
    return !!this.isValid() && !this._isUTC;
  }function Qb() {
    return !!this.isValid() && this._isUTC;
  }function Rb() {
    return !!this.isValid() && this._isUTC && 0 === this._offset;
  }function Sb(a, b) {
    var c,
        d,
        e,
        f = a,
        h = null;return Bb(a) ? f = { ms: a._milliseconds, d: a._days, M: a._months } : g(a) ? (f = {}, b ? f[b] = a : f.milliseconds = a) : (h = Te.exec(a)) ? (c = "-" === h[1] ? -1 : 1, f = { y: 0, d: u(h[ge]) * c, h: u(h[he]) * c, m: u(h[ie]) * c, s: u(h[je]) * c, ms: u(Cb(1e3 * h[ke])) * c }) : (h = Ue.exec(a)) ? (c = "-" === h[1] ? -1 : 1, f = { y: Tb(h[2], c), M: Tb(h[3], c), w: Tb(h[4], c), d: Tb(h[5], c), h: Tb(h[6], c), m: Tb(h[7], c), s: Tb(h[8], c) }) : null == f ? f = {} : "object" == typeof f && ("from" in f || "to" in f) && (e = Vb(tb(f.from), tb(f.to)), f = {}, f.ms = e.milliseconds, f.M = e.months), d = new Ab(f), Bb(a) && j(a, "_locale") && (d._locale = a._locale), d;
  }function Tb(a, b) {
    var c = a && parseFloat(a.replace(",", "."));return (isNaN(c) ? 0 : c) * b;
  }function Ub(a, b) {
    var c = { milliseconds: 0, months: 0 };return c.months = b.month() - a.month() + 12 * (b.year() - a.year()), a.clone().add(c.months, "M").isAfter(b) && --c.months, c.milliseconds = +b - +a.clone().add(c.months, "M"), c;
  }function Vb(a, b) {
    var c;return a.isValid() && b.isValid() ? (b = Fb(b, a), a.isBefore(b) ? c = Ub(a, b) : (c = Ub(b, a), c.milliseconds = -c.milliseconds, c.months = -c.months), c) : { milliseconds: 0, months: 0 };
  }function Wb(a, b) {
    return function (c, d) {
      var e, f;return null === d || isNaN(+d) || (y(b, "moment()." + b + "(period, number) is deprecated. Please use moment()." + b + "(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info."), f = c, c = d, d = f), c = "string" == typeof c ? +c : c, e = Sb(c, d), Xb(this, e, a), this;
    };
  }function Xb(b, c, d, e) {
    var f = c._milliseconds,
        g = Cb(c._days),
        h = Cb(c._months);b.isValid() && (e = null == e || e, f && b._d.setTime(b._d.valueOf() + f * d), g && Q(b, "Date", P(b, "Date") + g * d), h && ja(b, P(b, "Month") + h * d), e && a.updateOffset(b, g || h));
  }function Yb(a, b) {
    var c = a.diff(b, "days", !0);return c < -6 ? "sameElse" : c < -1 ? "lastWeek" : c < 0 ? "lastDay" : c < 1 ? "sameDay" : c < 2 ? "nextDay" : c < 7 ? "nextWeek" : "sameElse";
  }function Zb(b, c) {
    var d = b || tb(),
        e = Fb(d, this).startOf("day"),
        f = a.calendarFormat(this, e) || "sameElse",
        g = c && (z(c[f]) ? c[f].call(this, d) : c[f]);return this.format(g || this.localeData().calendar(f, this, tb(d)));
  }function $b() {
    return new r(this);
  }function _b(a, b) {
    var c = s(a) ? a : tb(a);return !(!this.isValid() || !c.isValid()) && (b = K(f(b) ? "millisecond" : b), "millisecond" === b ? this.valueOf() > c.valueOf() : c.valueOf() < this.clone().startOf(b).valueOf());
  }function ac(a, b) {
    var c = s(a) ? a : tb(a);return !(!this.isValid() || !c.isValid()) && (b = K(f(b) ? "millisecond" : b), "millisecond" === b ? this.valueOf() < c.valueOf() : this.clone().endOf(b).valueOf() < c.valueOf());
  }function bc(a, b, c, d) {
    return d = d || "()", ("(" === d[0] ? this.isAfter(a, c) : !this.isBefore(a, c)) && (")" === d[1] ? this.isBefore(b, c) : !this.isAfter(b, c));
  }function cc(a, b) {
    var c,
        d = s(a) ? a : tb(a);return !(!this.isValid() || !d.isValid()) && (b = K(b || "millisecond"), "millisecond" === b ? this.valueOf() === d.valueOf() : (c = d.valueOf(), this.clone().startOf(b).valueOf() <= c && c <= this.clone().endOf(b).valueOf()));
  }function dc(a, b) {
    return this.isSame(a, b) || this.isAfter(a, b);
  }function ec(a, b) {
    return this.isSame(a, b) || this.isBefore(a, b);
  }function fc(a, b, c) {
    var d, e, f, g;return this.isValid() ? (d = Fb(a, this), d.isValid() ? (e = 6e4 * (d.utcOffset() - this.utcOffset()), b = K(b), "year" === b || "month" === b || "quarter" === b ? (g = gc(this, d), "quarter" === b ? g /= 3 : "year" === b && (g /= 12)) : (f = this - d, g = "second" === b ? f / 1e3 : "minute" === b ? f / 6e4 : "hour" === b ? f / 36e5 : "day" === b ? (f - e) / 864e5 : "week" === b ? (f - e) / 6048e5 : f), c ? g : t(g)) : NaN) : NaN;
  }function gc(a, b) {
    var c,
        d,
        e = 12 * (b.year() - a.year()) + (b.month() - a.month()),
        f = a.clone().add(e, "months");return b - f < 0 ? (c = a.clone().add(e - 1, "months"), d = (b - f) / (f - c)) : (c = a.clone().add(e + 1, "months"), d = (b - f) / (c - f)), -(e + d) || 0;
  }function hc() {
    return this.clone().locale("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
  }function ic() {
    if (!this.isValid()) return null;var a = this.clone().utc();return a.year() < 0 || a.year() > 9999 ? X(a, "YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]") : z(Date.prototype.toISOString) ? this.toDate().toISOString() : X(a, "YYYY-MM-DD[T]HH:mm:ss.SSS[Z]");
  }function jc() {
    if (!this.isValid()) return "moment.invalid(/* " + this._i + " */)";var a = "moment",
        b = "";this.isLocal() || (a = 0 === this.utcOffset() ? "moment.utc" : "moment.parseZone", b = "Z");var c = "[" + a + '("]',
        d = 0 <= this.year() && this.year() <= 9999 ? "YYYY" : "YYYYYY",
        e = "-MM-DD[T]HH:mm:ss.SSS",
        f = b + '[")]';return this.format(c + d + e + f);
  }function kc(b) {
    b || (b = this.isUtc() ? a.defaultFormatUtc : a.defaultFormat);var c = X(this, b);return this.localeData().postformat(c);
  }function lc(a, b) {
    return this.isValid() && (s(a) && a.isValid() || tb(a).isValid()) ? Sb({ to: this, from: a }).locale(this.locale()).humanize(!b) : this.localeData().invalidDate();
  }function mc(a) {
    return this.from(tb(), a);
  }function nc(a, b) {
    return this.isValid() && (s(a) && a.isValid() || tb(a).isValid()) ? Sb({ from: this, to: a }).locale(this.locale()).humanize(!b) : this.localeData().invalidDate();
  }function oc(a) {
    return this.to(tb(), a);
  }function pc(a) {
    var b;return void 0 === a ? this._locale._abbr : (b = bb(a), null != b && (this._locale = b), this);
  }function qc() {
    return this._locale;
  }function rc(a) {
    switch (a = K(a)) {case "year":
        this.month(0);case "quarter":case "month":
        this.date(1);case "week":case "isoWeek":case "day":case "date":
        this.hours(0);case "hour":
        this.minutes(0);case "minute":
        this.seconds(0);case "second":
        this.milliseconds(0);}return "week" === a && this.weekday(0), "isoWeek" === a && this.isoWeekday(1), "quarter" === a && this.month(3 * Math.floor(this.month() / 3)), this;
  }function sc(a) {
    return a = K(a), void 0 === a || "millisecond" === a ? this : ("date" === a && (a = "day"), this.startOf(a).add(1, "isoWeek" === a ? "week" : a).subtract(1, "ms"));
  }function tc() {
    return this._d.valueOf() - 6e4 * (this._offset || 0);
  }function uc() {
    return Math.floor(this.valueOf() / 1e3);
  }function vc() {
    return new Date(this.valueOf());
  }function wc() {
    var a = this;return [a.year(), a.month(), a.date(), a.hour(), a.minute(), a.second(), a.millisecond()];
  }function xc() {
    var a = this;return { years: a.year(), months: a.month(), date: a.date(), hours: a.hours(), minutes: a.minutes(), seconds: a.seconds(), milliseconds: a.milliseconds() };
  }function yc() {
    return this.isValid() ? this.toISOString() : null;
  }function zc() {
    return o(this);
  }function Ac() {
    return k({}, n(this));
  }function Bc() {
    return n(this).overflow;
  }function Cc() {
    return { input: this._i, format: this._f, locale: this._locale, isUTC: this._isUTC, strict: this._strict };
  }function Dc(a, b) {
    U(0, [a, a.length], 0, b);
  }function Ec(a) {
    return Ic.call(this, a, this.week(), this.weekday(), this.localeData()._week.dow, this.localeData()._week.doy);
  }function Fc(a) {
    return Ic.call(this, a, this.isoWeek(), this.isoWeekday(), 1, 4);
  }function Gc() {
    return xa(this.year(), 1, 4);
  }function Hc() {
    var a = this.localeData()._week;return xa(this.year(), a.dow, a.doy);
  }function Ic(a, b, c, d, e) {
    var f;return null == a ? wa(this, d, e).year : (f = xa(a, d, e), b > f && (b = f), Jc.call(this, a, b, c, d, e));
  }function Jc(a, b, c, d, e) {
    var f = va(a, b, c, d, e),
        g = ta(f.year, 0, f.dayOfYear);return this.year(g.getUTCFullYear()), this.month(g.getUTCMonth()), this.date(g.getUTCDate()), this;
  }function Kc(a) {
    return null == a ? Math.ceil((this.month() + 1) / 3) : this.month(3 * (a - 1) + this.month() % 3);
  }function Lc(a) {
    var b = Math.round((this.clone().startOf("day") - this.clone().startOf("year")) / 864e5) + 1;return null == a ? b : this.add(a - b, "d");
  }function Mc(a, b) {
    b[ke] = u(1e3 * ("0." + a));
  }function Nc() {
    return this._isUTC ? "UTC" : "";
  }function Oc() {
    return this._isUTC ? "Coordinated Universal Time" : "";
  }function Pc(a) {
    return tb(1e3 * a);
  }function Qc() {
    return tb.apply(null, arguments).parseZone();
  }function Rc(a) {
    return a;
  }function Sc(a, b, c, d) {
    var e = bb(),
        f = l().set(d, b);return e[c](f, a);
  }function Tc(a, b, c) {
    if (g(a) && (b = a, a = void 0), a = a || "", null != b) return Sc(a, b, c, "month");var d,
        e = [];for (d = 0; d < 12; d++) e[d] = Sc(a, d, c, "month");return e;
  }function Uc(a, b, c, d) {
    "boolean" == typeof a ? (g(b) && (c = b, b = void 0), b = b || "") : (b = a, c = b, a = !1, g(b) && (c = b, b = void 0), b = b || "");var e = bb(),
        f = a ? e._week.dow : 0;if (null != c) return Sc(b, (c + f) % 7, d, "day");var h,
        i = [];for (h = 0; h < 7; h++) i[h] = Sc(b, (h + f) % 7, d, "day");return i;
  }function Vc(a, b) {
    return Tc(a, b, "months");
  }function Wc(a, b) {
    return Tc(a, b, "monthsShort");
  }function Xc(a, b, c) {
    return Uc(a, b, c, "weekdays");
  }function Yc(a, b, c) {
    return Uc(a, b, c, "weekdaysShort");
  }function Zc(a, b, c) {
    return Uc(a, b, c, "weekdaysMin");
  }function $c() {
    var a = this._data;return this._milliseconds = df(this._milliseconds), this._days = df(this._days), this._months = df(this._months), a.milliseconds = df(a.milliseconds), a.seconds = df(a.seconds), a.minutes = df(a.minutes), a.hours = df(a.hours), a.months = df(a.months), a.years = df(a.years), this;
  }function _c(a, b, c, d) {
    var e = Sb(b, c);return a._milliseconds += d * e._milliseconds, a._days += d * e._days, a._months += d * e._months, a._bubble();
  }function ad(a, b) {
    return _c(this, a, b, 1);
  }function bd(a, b) {
    return _c(this, a, b, -1);
  }function cd(a) {
    return a < 0 ? Math.floor(a) : Math.ceil(a);
  }function dd() {
    var a,
        b,
        c,
        d,
        e,
        f = this._milliseconds,
        g = this._days,
        h = this._months,
        i = this._data;return f >= 0 && g >= 0 && h >= 0 || f <= 0 && g <= 0 && h <= 0 || (f += 864e5 * cd(fd(h) + g), g = 0, h = 0), i.milliseconds = f % 1e3, a = t(f / 1e3), i.seconds = a % 60, b = t(a / 60), i.minutes = b % 60, c = t(b / 60), i.hours = c % 24, g += t(c / 24), e = t(ed(g)), h += e, g -= cd(fd(e)), d = t(h / 12), h %= 12, i.days = g, i.months = h, i.years = d, this;
  }function ed(a) {
    return 4800 * a / 146097;
  }function fd(a) {
    return 146097 * a / 4800;
  }function gd(a) {
    if (!this.isValid()) return NaN;var b,
        c,
        d = this._milliseconds;if (a = K(a), "month" === a || "year" === a) return b = this._days + d / 864e5, c = this._months + ed(b), "month" === a ? c : c / 12;switch (b = this._days + Math.round(fd(this._months)), a) {case "week":
        return b / 7 + d / 6048e5;case "day":
        return b + d / 864e5;case "hour":
        return 24 * b + d / 36e5;case "minute":
        return 1440 * b + d / 6e4;case "second":
        return 86400 * b + d / 1e3;case "millisecond":
        return Math.floor(864e5 * b) + d;default:
        throw new Error("Unknown unit " + a);}
  }function hd() {
    return this.isValid() ? this._milliseconds + 864e5 * this._days + this._months % 12 * 2592e6 + 31536e6 * u(this._months / 12) : NaN;
  }function id(a) {
    return function () {
      return this.as(a);
    };
  }function jd(a) {
    return a = K(a), this.isValid() ? this[a + "s"]() : NaN;
  }function kd(a) {
    return function () {
      return this.isValid() ? this._data[a] : NaN;
    };
  }function ld() {
    return t(this.days() / 7);
  }function md(a, b, c, d, e) {
    return e.relativeTime(b || 1, !!c, a, d);
  }function nd(a, b, c) {
    var d = Sb(a).abs(),
        e = uf(d.as("s")),
        f = uf(d.as("m")),
        g = uf(d.as("h")),
        h = uf(d.as("d")),
        i = uf(d.as("M")),
        j = uf(d.as("y")),
        k = e <= vf.ss && ["s", e] || e < vf.s && ["ss", e] || f <= 1 && ["m"] || f < vf.m && ["mm", f] || g <= 1 && ["h"] || g < vf.h && ["hh", g] || h <= 1 && ["d"] || h < vf.d && ["dd", h] || i <= 1 && ["M"] || i < vf.M && ["MM", i] || j <= 1 && ["y"] || ["yy", j];return k[2] = b, k[3] = +a > 0, k[4] = c, md.apply(null, k);
  }function od(a) {
    return void 0 === a ? uf : "function" == typeof a && (uf = a, !0);
  }function pd(a, b) {
    return void 0 !== vf[a] && (void 0 === b ? vf[a] : (vf[a] = b, "s" === a && (vf.ss = b - 1), !0));
  }function qd(a) {
    if (!this.isValid()) return this.localeData().invalidDate();var b = this.localeData(),
        c = nd(this, !a, b);return a && (c = b.pastFuture(+this, c)), b.postformat(c);
  }function rd() {
    if (!this.isValid()) return this.localeData().invalidDate();var a,
        b,
        c,
        d = wf(this._milliseconds) / 1e3,
        e = wf(this._days),
        f = wf(this._months);a = t(d / 60), b = t(a / 60), d %= 60, a %= 60, c = t(f / 12), f %= 12;var g = c,
        h = f,
        i = e,
        j = b,
        k = a,
        l = d,
        m = this.asSeconds();return m ? (m < 0 ? "-" : "") + "P" + (g ? g + "Y" : "") + (h ? h + "M" : "") + (i ? i + "D" : "") + (j || k || l ? "T" : "") + (j ? j + "H" : "") + (k ? k + "M" : "") + (l ? l + "S" : "") : "P0D";
  }var sd, td;td = Array.prototype.some ? Array.prototype.some : function (a) {
    for (var b = Object(this), c = b.length >>> 0, d = 0; d < c; d++) if (d in b && a.call(this, b[d], d, b)) return !0;return !1;
  };var ud = td,
      vd = a.momentProperties = [],
      wd = !1,
      xd = {};a.suppressDeprecationWarnings = !1, a.deprecationHandler = null;var yd;yd = Object.keys ? Object.keys : function (a) {
    var b,
        c = [];for (b in a) j(a, b) && c.push(b);return c;
  };var zd,
      Ad = yd,
      Bd = { sameDay: "[Today at] LT", nextDay: "[Tomorrow at] LT", nextWeek: "dddd [at] LT", lastDay: "[Yesterday at] LT", lastWeek: "[Last] dddd [at] LT", sameElse: "L" },
      Cd = { LTS: "h:mm:ss A", LT: "h:mm A", L: "MM/DD/YYYY", LL: "MMMM D, YYYY", LLL: "MMMM D, YYYY h:mm A", LLLL: "dddd, MMMM D, YYYY h:mm A" },
      Dd = "Invalid date",
      Ed = "%d",
      Fd = /\d{1,2}/,
      Gd = { future: "in %s", past: "%s ago", s: "a few seconds", ss: "%d seconds", m: "a minute", mm: "%d minutes", h: "an hour", hh: "%d hours", d: "a day", dd: "%d days", M: "a month", MM: "%d months", y: "a year", yy: "%d years" },
      Hd = {},
      Id = {},
      Jd = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,
      Kd = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,
      Ld = {},
      Md = {},
      Nd = /\d/,
      Od = /\d\d/,
      Pd = /\d{3}/,
      Qd = /\d{4}/,
      Rd = /[+-]?\d{6}/,
      Sd = /\d\d?/,
      Td = /\d\d\d\d?/,
      Ud = /\d\d\d\d\d\d?/,
      Vd = /\d{1,3}/,
      Wd = /\d{1,4}/,
      Xd = /[+-]?\d{1,6}/,
      Yd = /\d+/,
      Zd = /[+-]?\d+/,
      $d = /Z|[+-]\d\d:?\d\d/gi,
      _d = /Z|[+-]\d\d(?::?\d\d)?/gi,
      ae = /[+-]?\d+(\.\d{1,3})?/,
      be = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i,
      ce = {},
      de = {},
      ee = 0,
      fe = 1,
      ge = 2,
      he = 3,
      ie = 4,
      je = 5,
      ke = 6,
      le = 7,
      me = 8;zd = Array.prototype.indexOf ? Array.prototype.indexOf : function (a) {
    var b;for (b = 0; b < this.length; ++b) if (this[b] === a) return b;return -1;
  };var ne = zd;U("M", ["MM", 2], "Mo", function () {
    return this.month() + 1;
  }), U("MMM", 0, 0, function (a) {
    return this.localeData().monthsShort(this, a);
  }), U("MMMM", 0, 0, function (a) {
    return this.localeData().months(this, a);
  }), J("month", "M"), M("month", 8), Z("M", Sd), Z("MM", Sd, Od), Z("MMM", function (a, b) {
    return b.monthsShortRegex(a);
  }), Z("MMMM", function (a, b) {
    return b.monthsRegex(a);
  }), ba(["M", "MM"], function (a, b) {
    b[fe] = u(a) - 1;
  }), ba(["MMM", "MMMM"], function (a, b, c, d) {
    var e = c._locale.monthsParse(a, d, c._strict);null != e ? b[fe] = e : n(c).invalidMonth = a;
  });var oe = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/,
      pe = "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
      qe = "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
      re = be,
      se = be;U("Y", 0, 0, function () {
    var a = this.year();return a <= 9999 ? "" + a : "+" + a;
  }), U(0, ["YY", 2], 0, function () {
    return this.year() % 100;
  }), U(0, ["YYYY", 4], 0, "year"), U(0, ["YYYYY", 5], 0, "year"), U(0, ["YYYYYY", 6, !0], 0, "year"), J("year", "y"), M("year", 1), Z("Y", Zd), Z("YY", Sd, Od), Z("YYYY", Wd, Qd), Z("YYYYY", Xd, Rd), Z("YYYYYY", Xd, Rd), ba(["YYYYY", "YYYYYY"], ee), ba("YYYY", function (b, c) {
    c[ee] = 2 === b.length ? a.parseTwoDigitYear(b) : u(b);
  }), ba("YY", function (b, c) {
    c[ee] = a.parseTwoDigitYear(b);
  }), ba("Y", function (a, b) {
    b[ee] = parseInt(a, 10);
  }), a.parseTwoDigitYear = function (a) {
    return u(a) + (u(a) > 68 ? 1900 : 2e3);
  };var te = O("FullYear", !0);U("w", ["ww", 2], "wo", "week"), U("W", ["WW", 2], "Wo", "isoWeek"), J("week", "w"), J("isoWeek", "W"), M("week", 5), M("isoWeek", 5), Z("w", Sd), Z("ww", Sd, Od), Z("W", Sd), Z("WW", Sd, Od), ca(["w", "ww", "W", "WW"], function (a, b, c, d) {
    b[d.substr(0, 1)] = u(a);
  });var ue = { dow: 0, doy: 6 };U("d", 0, "do", "day"), U("dd", 0, 0, function (a) {
    return this.localeData().weekdaysMin(this, a);
  }), U("ddd", 0, 0, function (a) {
    return this.localeData().weekdaysShort(this, a);
  }), U("dddd", 0, 0, function (a) {
    return this.localeData().weekdays(this, a);
  }), U("e", 0, 0, "weekday"), U("E", 0, 0, "isoWeekday"), J("day", "d"), J("weekday", "e"), J("isoWeekday", "E"), M("day", 11), M("weekday", 11), M("isoWeekday", 11), Z("d", Sd), Z("e", Sd), Z("E", Sd), Z("dd", function (a, b) {
    return b.weekdaysMinRegex(a);
  }), Z("ddd", function (a, b) {
    return b.weekdaysShortRegex(a);
  }), Z("dddd", function (a, b) {
    return b.weekdaysRegex(a);
  }), ca(["dd", "ddd", "dddd"], function (a, b, c, d) {
    var e = c._locale.weekdaysParse(a, d, c._strict);null != e ? b.d = e : n(c).invalidWeekday = a;
  }), ca(["d", "e", "E"], function (a, b, c, d) {
    b[d] = u(a);
  });var ve = "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
      we = "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
      xe = "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
      ye = be,
      ze = be,
      Ae = be;U("H", ["HH", 2], 0, "hour"), U("h", ["hh", 2], 0, Ra), U("k", ["kk", 2], 0, Sa), U("hmm", 0, 0, function () {
    return "" + Ra.apply(this) + T(this.minutes(), 2);
  }), U("hmmss", 0, 0, function () {
    return "" + Ra.apply(this) + T(this.minutes(), 2) + T(this.seconds(), 2);
  }), U("Hmm", 0, 0, function () {
    return "" + this.hours() + T(this.minutes(), 2);
  }), U("Hmmss", 0, 0, function () {
    return "" + this.hours() + T(this.minutes(), 2) + T(this.seconds(), 2);
  }), Ta("a", !0), Ta("A", !1), J("hour", "h"), M("hour", 13), Z("a", Ua), Z("A", Ua), Z("H", Sd), Z("h", Sd), Z("k", Sd), Z("HH", Sd, Od), Z("hh", Sd, Od), Z("kk", Sd, Od), Z("hmm", Td), Z("hmmss", Ud), Z("Hmm", Td), Z("Hmmss", Ud), ba(["H", "HH"], he), ba(["k", "kk"], function (a, b, c) {
    var d = u(a);b[he] = 24 === d ? 0 : d;
  }), ba(["a", "A"], function (a, b, c) {
    c._isPm = c._locale.isPM(a), c._meridiem = a;
  }), ba(["h", "hh"], function (a, b, c) {
    b[he] = u(a), n(c).bigHour = !0;
  }), ba("hmm", function (a, b, c) {
    var d = a.length - 2;b[he] = u(a.substr(0, d)), b[ie] = u(a.substr(d)), n(c).bigHour = !0;
  }), ba("hmmss", function (a, b, c) {
    var d = a.length - 4,
        e = a.length - 2;b[he] = u(a.substr(0, d)), b[ie] = u(a.substr(d, 2)), b[je] = u(a.substr(e)), n(c).bigHour = !0;
  }), ba("Hmm", function (a, b, c) {
    var d = a.length - 2;b[he] = u(a.substr(0, d)), b[ie] = u(a.substr(d));
  }), ba("Hmmss", function (a, b, c) {
    var d = a.length - 4,
        e = a.length - 2;b[he] = u(a.substr(0, d)), b[ie] = u(a.substr(d, 2)), b[je] = u(a.substr(e));
  });var Be,
      Ce = /[ap]\.?m?\.?/i,
      De = O("Hours", !0),
      Ee = { calendar: Bd, longDateFormat: Cd, invalidDate: Dd, ordinal: Ed, dayOfMonthOrdinalParse: Fd, relativeTime: Gd, months: pe, monthsShort: qe, week: ue, weekdays: ve, weekdaysMin: xe, weekdaysShort: we, meridiemParse: Ce },
      Fe = {},
      Ge = {},
      He = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
      Ie = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
      Je = /Z|[+-]\d\d(?::?\d\d)?/,
      Ke = [["YYYYYY-MM-DD", /[+-]\d{6}-\d\d-\d\d/], ["YYYY-MM-DD", /\d{4}-\d\d-\d\d/], ["GGGG-[W]WW-E", /\d{4}-W\d\d-\d/], ["GGGG-[W]WW", /\d{4}-W\d\d/, !1], ["YYYY-DDD", /\d{4}-\d{3}/], ["YYYY-MM", /\d{4}-\d\d/, !1], ["YYYYYYMMDD", /[+-]\d{10}/], ["YYYYMMDD", /\d{8}/], ["GGGG[W]WWE", /\d{4}W\d{3}/], ["GGGG[W]WW", /\d{4}W\d{2}/, !1], ["YYYYDDD", /\d{7}/]],
      Le = [["HH:mm:ss.SSSS", /\d\d:\d\d:\d\d\.\d+/], ["HH:mm:ss,SSSS", /\d\d:\d\d:\d\d,\d+/], ["HH:mm:ss", /\d\d:\d\d:\d\d/], ["HH:mm", /\d\d:\d\d/], ["HHmmss.SSSS", /\d\d\d\d\d\d\.\d+/], ["HHmmss,SSSS", /\d\d\d\d\d\d,\d+/], ["HHmmss", /\d\d\d\d\d\d/], ["HHmm", /\d\d\d\d/], ["HH", /\d\d/]],
      Me = /^\/?Date\((\-?\d+)/i,
      Ne = /^((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d?\d\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(?:\d\d)?\d\d\s)(\d\d:\d\d)(\:\d\d)?(\s(?:UT|GMT|[ECMP][SD]T|[A-IK-Za-ik-z]|[+-]\d{4}))$/;a.createFromInputFallback = x("value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are discouraged and will be removed in an upcoming major release. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.", function (a) {
    a._d = new Date(a._i + (a._useUTC ? " UTC" : ""));
  }), a.ISO_8601 = function () {}, a.RFC_2822 = function () {};var Oe = x("moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/", function () {
    var a = tb.apply(null, arguments);return this.isValid() && a.isValid() ? a < this ? this : a : p();
  }),
      Pe = x("moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/", function () {
    var a = tb.apply(null, arguments);return this.isValid() && a.isValid() ? a > this ? this : a : p();
  }),
      Qe = function () {
    return Date.now ? Date.now() : +new Date();
  },
      Re = ["year", "quarter", "month", "week", "day", "hour", "minute", "second", "millisecond"];Db("Z", ":"), Db("ZZ", ""), Z("Z", _d), Z("ZZ", _d), ba(["Z", "ZZ"], function (a, b, c) {
    c._useUTC = !0, c._tzm = Eb(_d, a);
  });var Se = /([\+\-]|\d\d)/gi;a.updateOffset = function () {};var Te = /^(\-)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/,
      Ue = /^(-)?P(?:(-?[0-9,.]*)Y)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)W)?(?:(-?[0-9,.]*)D)?(?:T(?:(-?[0-9,.]*)H)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)S)?)?$/;Sb.fn = Ab.prototype, Sb.invalid = zb;var Ve = Wb(1, "add"),
      We = Wb(-1, "subtract");a.defaultFormat = "YYYY-MM-DDTHH:mm:ssZ", a.defaultFormatUtc = "YYYY-MM-DDTHH:mm:ss[Z]";var Xe = x("moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.", function (a) {
    return void 0 === a ? this.localeData() : this.locale(a);
  });U(0, ["gg", 2], 0, function () {
    return this.weekYear() % 100;
  }), U(0, ["GG", 2], 0, function () {
    return this.isoWeekYear() % 100;
  }), Dc("gggg", "weekYear"), Dc("ggggg", "weekYear"), Dc("GGGG", "isoWeekYear"), Dc("GGGGG", "isoWeekYear"), J("weekYear", "gg"), J("isoWeekYear", "GG"), M("weekYear", 1), M("isoWeekYear", 1), Z("G", Zd), Z("g", Zd), Z("GG", Sd, Od), Z("gg", Sd, Od), Z("GGGG", Wd, Qd), Z("gggg", Wd, Qd), Z("GGGGG", Xd, Rd), Z("ggggg", Xd, Rd), ca(["gggg", "ggggg", "GGGG", "GGGGG"], function (a, b, c, d) {
    b[d.substr(0, 2)] = u(a);
  }), ca(["gg", "GG"], function (b, c, d, e) {
    c[e] = a.parseTwoDigitYear(b);
  }), U("Q", 0, "Qo", "quarter"), J("quarter", "Q"), M("quarter", 7), Z("Q", Nd), ba("Q", function (a, b) {
    b[fe] = 3 * (u(a) - 1);
  }), U("D", ["DD", 2], "Do", "date"), J("date", "D"), M("date", 9), Z("D", Sd), Z("DD", Sd, Od), Z("Do", function (a, b) {
    return a ? b._dayOfMonthOrdinalParse || b._ordinalParse : b._dayOfMonthOrdinalParseLenient;
  }), ba(["D", "DD"], ge), ba("Do", function (a, b) {
    b[ge] = u(a.match(Sd)[0], 10);
  });var Ye = O("Date", !0);U("DDD", ["DDDD", 3], "DDDo", "dayOfYear"), J("dayOfYear", "DDD"), M("dayOfYear", 4), Z("DDD", Vd), Z("DDDD", Pd), ba(["DDD", "DDDD"], function (a, b, c) {
    c._dayOfYear = u(a);
  }), U("m", ["mm", 2], 0, "minute"), J("minute", "m"), M("minute", 14), Z("m", Sd), Z("mm", Sd, Od), ba(["m", "mm"], ie);var Ze = O("Minutes", !1);U("s", ["ss", 2], 0, "second"), J("second", "s"), M("second", 15), Z("s", Sd), Z("ss", Sd, Od), ba(["s", "ss"], je);var $e = O("Seconds", !1);U("S", 0, 0, function () {
    return ~~(this.millisecond() / 100);
  }), U(0, ["SS", 2], 0, function () {
    return ~~(this.millisecond() / 10);
  }), U(0, ["SSS", 3], 0, "millisecond"), U(0, ["SSSS", 4], 0, function () {
    return 10 * this.millisecond();
  }), U(0, ["SSSSS", 5], 0, function () {
    return 100 * this.millisecond();
  }), U(0, ["SSSSSS", 6], 0, function () {
    return 1e3 * this.millisecond();
  }), U(0, ["SSSSSSS", 7], 0, function () {
    return 1e4 * this.millisecond();
  }), U(0, ["SSSSSSSS", 8], 0, function () {
    return 1e5 * this.millisecond();
  }), U(0, ["SSSSSSSSS", 9], 0, function () {
    return 1e6 * this.millisecond();
  }), J("millisecond", "ms"), M("millisecond", 16), Z("S", Vd, Nd), Z("SS", Vd, Od), Z("SSS", Vd, Pd);var _e;for (_e = "SSSS"; _e.length <= 9; _e += "S") Z(_e, Yd);for (_e = "S"; _e.length <= 9; _e += "S") ba(_e, Mc);var af = O("Milliseconds", !1);U("z", 0, 0, "zoneAbbr"), U("zz", 0, 0, "zoneName");var bf = r.prototype;bf.add = Ve, bf.calendar = Zb, bf.clone = $b, bf.diff = fc, bf.endOf = sc, bf.format = kc, bf.from = lc, bf.fromNow = mc, bf.to = nc, bf.toNow = oc, bf.get = R, bf.invalidAt = Bc, bf.isAfter = _b, bf.isBefore = ac, bf.isBetween = bc, bf.isSame = cc, bf.isSameOrAfter = dc, bf.isSameOrBefore = ec, bf.isValid = zc, bf.lang = Xe, bf.locale = pc, bf.localeData = qc, bf.max = Pe, bf.min = Oe, bf.parsingFlags = Ac, bf.set = S, bf.startOf = rc, bf.subtract = We, bf.toArray = wc, bf.toObject = xc, bf.toDate = vc, bf.toISOString = ic, bf.inspect = jc, bf.toJSON = yc, bf.toString = hc, bf.unix = uc, bf.valueOf = tc, bf.creationData = Cc, bf.year = te, bf.isLeapYear = ra, bf.weekYear = Ec, bf.isoWeekYear = Fc, bf.quarter = bf.quarters = Kc, bf.month = ka, bf.daysInMonth = la, bf.week = bf.weeks = Ba, bf.isoWeek = bf.isoWeeks = Ca, bf.weeksInYear = Hc, bf.isoWeeksInYear = Gc, bf.date = Ye, bf.day = bf.days = Ka, bf.weekday = La, bf.isoWeekday = Ma, bf.dayOfYear = Lc, bf.hour = bf.hours = De, bf.minute = bf.minutes = Ze, bf.second = bf.seconds = $e, bf.millisecond = bf.milliseconds = af, bf.utcOffset = Hb, bf.utc = Jb, bf.local = Kb, bf.parseZone = Lb, bf.hasAlignedHourOffset = Mb, bf.isDST = Nb, bf.isLocal = Pb, bf.isUtcOffset = Qb, bf.isUtc = Rb, bf.isUTC = Rb, bf.zoneAbbr = Nc, bf.zoneName = Oc, bf.dates = x("dates accessor is deprecated. Use date instead.", Ye), bf.months = x("months accessor is deprecated. Use month instead", ka), bf.years = x("years accessor is deprecated. Use year instead", te), bf.zone = x("moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/", Ib), bf.isDSTShifted = x("isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information", Ob);var cf = C.prototype;cf.calendar = D, cf.longDateFormat = E, cf.invalidDate = F, cf.ordinal = G, cf.preparse = Rc, cf.postformat = Rc, cf.relativeTime = H, cf.pastFuture = I, cf.set = A, cf.months = fa, cf.monthsShort = ga, cf.monthsParse = ia, cf.monthsRegex = na, cf.monthsShortRegex = ma, cf.week = ya, cf.firstDayOfYear = Aa, cf.firstDayOfWeek = za, cf.weekdays = Fa, cf.weekdaysMin = Ha, cf.weekdaysShort = Ga, cf.weekdaysParse = Ja, cf.weekdaysRegex = Na, cf.weekdaysShortRegex = Oa, cf.weekdaysMinRegex = Pa, cf.isPM = Va, cf.meridiem = Wa, $a("en", { dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/, ordinal: function (a) {
      var b = a % 10,
          c = 1 === u(a % 100 / 10) ? "th" : 1 === b ? "st" : 2 === b ? "nd" : 3 === b ? "rd" : "th";return a + c;
    } }), a.lang = x("moment.lang is deprecated. Use moment.locale instead.", $a), a.langData = x("moment.langData is deprecated. Use moment.localeData instead.", bb);var df = Math.abs,
      ef = id("ms"),
      ff = id("s"),
      gf = id("m"),
      hf = id("h"),
      jf = id("d"),
      kf = id("w"),
      lf = id("M"),
      mf = id("y"),
      nf = kd("milliseconds"),
      of = kd("seconds"),
      pf = kd("minutes"),
      qf = kd("hours"),
      rf = kd("days"),
      sf = kd("months"),
      tf = kd("years"),
      uf = Math.round,
      vf = { ss: 44, s: 45, m: 45, h: 22, d: 26, M: 11 },
      wf = Math.abs,
      xf = Ab.prototype;return xf.isValid = yb, xf.abs = $c, xf.add = ad, xf.subtract = bd, xf.as = gd, xf.asMilliseconds = ef, xf.asSeconds = ff, xf.asMinutes = gf, xf.asHours = hf, xf.asDays = jf, xf.asWeeks = kf, xf.asMonths = lf, xf.asYears = mf, xf.valueOf = hd, xf._bubble = dd, xf.get = jd, xf.milliseconds = nf, xf.seconds = of, xf.minutes = pf, xf.hours = qf, xf.days = rf, xf.weeks = ld, xf.months = sf, xf.years = tf, xf.humanize = qd, xf.toISOString = rd, xf.toString = rd, xf.toJSON = rd, xf.locale = pc, xf.localeData = qc, xf.toIsoString = x("toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)", rd), xf.lang = Xe, U("X", 0, 0, "unix"), U("x", 0, 0, "valueOf"), Z("x", Zd), Z("X", ae), ba("X", function (a, b, c) {
    c._d = new Date(1e3 * parseFloat(a, 10));
  }), ba("x", function (a, b, c) {
    c._d = new Date(u(a));
  }), a.version = "2.18.1", b(tb), a.fn = bf, a.min = vb, a.max = wb, a.now = Qe, a.utc = l, a.unix = Pc, a.months = Vc, a.isDate = h, a.locale = $a, a.invalid = p, a.duration = Sb, a.isMoment = s, a.weekdays = Xc, a.parseZone = Qc, a.localeData = bb, a.isDuration = Bb, a.monthsShort = Wc, a.weekdaysMin = Zc, a.defineLocale = _a, a.updateLocale = ab, a.locales = cb, a.weekdaysShort = Yc, a.normalizeUnits = K, a.relativeTimeRounding = od, a.relativeTimeThreshold = pd, a.calendarFormat = Yb, a.prototype = bf, a;
});
/**
 * Owl Carousel v2.2.0
 * Copyright 2013-2016 David Deutsch
 * Licensed under MIT (https://github.com/OwlCarousel2/OwlCarousel2/blob/master/LICENSE)
 */
/**
 * Owl carousel
 * @version 2.1.6
 * @author Bartosz Wojciechowski
 * @author David Deutsch
 * @license The MIT License (MIT)
 * @todo Lazy Load Icon
 * @todo prevent animationend bubling
 * @todo itemsScaleUp
 * @todo Test Zepto
 * @todo stagePadding calculate wrong active classes
 */
;(function ($, window, document, undefined) {

	/**
  * Creates a carousel.
  * @class The Owl Carousel.
  * @public
  * @param {HTMLElement|jQuery} element - The element to create the carousel for.
  * @param {Object} [options] - The options
  */
	function Owl(element, options) {

		/**
   * Current settings for the carousel.
   * @public
   */
		this.settings = null;

		/**
   * Current options set by the caller including defaults.
   * @public
   */
		this.options = $.extend({}, Owl.Defaults, options);

		/**
   * Plugin element.
   * @public
   */
		this.$element = $(element);

		/**
   * Proxied event handlers.
   * @protected
   */
		this._handlers = {};

		/**
   * References to the running plugins of this carousel.
   * @protected
   */
		this._plugins = {};

		/**
   * Currently suppressed events to prevent them from beeing retriggered.
   * @protected
   */
		this._supress = {};

		/**
   * Absolute current position.
   * @protected
   */
		this._current = null;

		/**
   * Animation speed in milliseconds.
   * @protected
   */
		this._speed = null;

		/**
   * Coordinates of all items in pixel.
   * @todo The name of this member is missleading.
   * @protected
   */
		this._coordinates = [];

		/**
   * Current breakpoint.
   * @todo Real media queries would be nice.
   * @protected
   */
		this._breakpoint = null;

		/**
   * Current width of the plugin element.
   */
		this._width = null;

		/**
   * All real items.
   * @protected
   */
		this._items = [];

		/**
   * All cloned items.
   * @protected
   */
		this._clones = [];

		/**
   * Merge values of all items.
   * @todo Maybe this could be part of a plugin.
   * @protected
   */
		this._mergers = [];

		/**
   * Widths of all items.
   */
		this._widths = [];

		/**
   * Invalidated parts within the update process.
   * @protected
   */
		this._invalidated = {};

		/**
   * Ordered list of workers for the update process.
   * @protected
   */
		this._pipe = [];

		/**
   * Current state information for the drag operation.
   * @todo #261
   * @protected
   */
		this._drag = {
			time: null,
			target: null,
			pointer: null,
			stage: {
				start: null,
				current: null
			},
			direction: null
		};

		/**
   * Current state information and their tags.
   * @type {Object}
   * @protected
   */
		this._states = {
			current: {},
			tags: {
				'initializing': ['busy'],
				'animating': ['busy'],
				'dragging': ['interacting']
			}
		};

		$.each(['onResize', 'onThrottledResize'], $.proxy(function (i, handler) {
			this._handlers[handler] = $.proxy(this[handler], this);
		}, this));

		$.each(Owl.Plugins, $.proxy(function (key, plugin) {
			this._plugins[key.charAt(0).toLowerCase() + key.slice(1)] = new plugin(this);
		}, this));

		$.each(Owl.Workers, $.proxy(function (priority, worker) {
			this._pipe.push({
				'filter': worker.filter,
				'run': $.proxy(worker.run, this)
			});
		}, this));

		this.setup();
		this.initialize();
	}

	/**
  * Default options for the carousel.
  * @public
  */
	Owl.Defaults = {
		items: 3,
		loop: false,
		center: false,
		rewind: false,

		mouseDrag: true,
		touchDrag: true,
		pullDrag: true,
		freeDrag: false,

		margin: 0,
		stagePadding: 0,

		merge: false,
		mergeFit: true,
		autoWidth: false,

		startPosition: 0,
		rtl: false,

		smartSpeed: 250,
		fluidSpeed: false,
		dragEndSpeed: false,

		responsive: {},
		responsiveRefreshRate: 200,
		responsiveBaseElement: window,

		fallbackEasing: 'swing',

		info: false,

		nestedItemSelector: false,
		itemElement: 'div',
		stageElement: 'div',

		refreshClass: 'owl-refresh',
		loadedClass: 'owl-loaded',
		loadingClass: 'owl-loading',
		rtlClass: 'owl-rtl',
		responsiveClass: 'owl-responsive',
		dragClass: 'owl-drag',
		itemClass: 'owl-item',
		stageClass: 'owl-stage',
		stageOuterClass: 'owl-stage-outer',
		grabClass: 'owl-grab'
	};

	/**
  * Enumeration for width.
  * @public
  * @readonly
  * @enum {String}
  */
	Owl.Width = {
		Default: 'default',
		Inner: 'inner',
		Outer: 'outer'
	};

	/**
  * Enumeration for types.
  * @public
  * @readonly
  * @enum {String}
  */
	Owl.Type = {
		Event: 'event',
		State: 'state'
	};

	/**
  * Contains all registered plugins.
  * @public
  */
	Owl.Plugins = {};

	/**
  * List of workers involved in the update process.
  */
	Owl.Workers = [{
		filter: ['width', 'settings'],
		run: function () {
			this._width = this.$element.width();
		}
	}, {
		filter: ['width', 'items', 'settings'],
		run: function (cache) {
			cache.current = this._items && this._items[this.relative(this._current)];
		}
	}, {
		filter: ['items', 'settings'],
		run: function () {
			this.$stage.children('.cloned').remove();
		}
	}, {
		filter: ['width', 'items', 'settings'],
		run: function (cache) {
			var margin = this.settings.margin || '',
			    grid = !this.settings.autoWidth,
			    rtl = this.settings.rtl,
			    css = {
				'width': 'auto',
				'margin-left': rtl ? margin : '',
				'margin-right': rtl ? '' : margin
			};

			!grid && this.$stage.children().css(css);

			cache.css = css;
		}
	}, {
		filter: ['width', 'items', 'settings'],
		run: function (cache) {
			var width = (this.width() / this.settings.items).toFixed(3) - this.settings.margin,
			    merge = null,
			    iterator = this._items.length,
			    grid = !this.settings.autoWidth,
			    widths = [];

			cache.items = {
				merge: false,
				width: width
			};

			while (iterator--) {
				merge = this._mergers[iterator];
				merge = this.settings.mergeFit && Math.min(merge, this.settings.items) || merge;

				cache.items.merge = merge > 1 || cache.items.merge;

				widths[iterator] = !grid ? this._items[iterator].width() : width * merge;
			}

			this._widths = widths;
		}
	}, {
		filter: ['items', 'settings'],
		run: function () {
			var clones = [],
			    items = this._items,
			    settings = this.settings,
			    view = Math.max(settings.items * 2, 4),
			    size = Math.ceil(items.length / 2) * 2,
			    repeat = settings.loop && items.length ? settings.rewind ? view : Math.max(view, size) : 0,
			    append = '',
			    prepend = '';

			repeat /= 2;

			while (repeat--) {
				clones.push(this.normalize(clones.length / 2, true));
				append = append + items[clones[clones.length - 1]][0].outerHTML;
				clones.push(this.normalize(items.length - 1 - (clones.length - 1) / 2, true));
				prepend = items[clones[clones.length - 1]][0].outerHTML + prepend;
			}

			this._clones = clones;

			$(append).addClass('cloned').appendTo(this.$stage);
			$(prepend).addClass('cloned').prependTo(this.$stage);
		}
	}, {
		filter: ['width', 'items', 'settings'],
		run: function () {
			var rtl = this.settings.rtl ? 1 : -1,
			    size = this._clones.length + this._items.length,
			    iterator = -1,
			    previous = 0,
			    current = 0,
			    coordinates = [];

			while (++iterator < size) {
				previous = coordinates[iterator - 1] || 0;
				current = this._widths[this.relative(iterator)] + this.settings.margin;
				coordinates.push(previous + current * rtl);
			}

			this._coordinates = coordinates;
		}
	}, {
		filter: ['width', 'items', 'settings'],
		run: function () {
			var padding = this.settings.stagePadding,
			    coordinates = this._coordinates,
			    css = {
				'width': Math.ceil(Math.abs(coordinates[coordinates.length - 1])) + padding * 2,
				'padding-left': padding || '',
				'padding-right': padding || ''
			};

			this.$stage.css(css);
		}
	}, {
		filter: ['width', 'items', 'settings'],
		run: function (cache) {
			var iterator = this._coordinates.length,
			    grid = !this.settings.autoWidth,
			    items = this.$stage.children();

			if (grid && cache.items.merge) {
				while (iterator--) {
					cache.css.width = this._widths[this.relative(iterator)];
					items.eq(iterator).css(cache.css);
				}
			} else if (grid) {
				cache.css.width = cache.items.width;
				items.css(cache.css);
			}
		}
	}, {
		filter: ['items'],
		run: function () {
			this._coordinates.length < 1 && this.$stage.removeAttr('style');
		}
	}, {
		filter: ['width', 'items', 'settings'],
		run: function (cache) {
			cache.current = cache.current ? this.$stage.children().index(cache.current) : 0;
			cache.current = Math.max(this.minimum(), Math.min(this.maximum(), cache.current));
			this.reset(cache.current);
		}
	}, {
		filter: ['position'],
		run: function () {
			this.animate(this.coordinates(this._current));
		}
	}, {
		filter: ['width', 'position', 'items', 'settings'],
		run: function () {
			var rtl = this.settings.rtl ? 1 : -1,
			    padding = this.settings.stagePadding * 2,
			    begin = this.coordinates(this.current()) + padding,
			    end = begin + this.width() * rtl,
			    inner,
			    outer,
			    matches = [],
			    i,
			    n;

			for (i = 0, n = this._coordinates.length; i < n; i++) {
				inner = this._coordinates[i - 1] || 0;
				outer = Math.abs(this._coordinates[i]) + padding * rtl;

				if (this.op(inner, '<=', begin) && this.op(inner, '>', end) || this.op(outer, '<', begin) && this.op(outer, '>', end)) {
					matches.push(i);
				}
			}

			this.$stage.children('.active').removeClass('active');
			this.$stage.children(':eq(' + matches.join('), :eq(') + ')').addClass('active');

			if (this.settings.center) {
				this.$stage.children('.center').removeClass('center');
				this.$stage.children().eq(this.current()).addClass('center');
			}
		}
	}];

	/**
  * Initializes the carousel.
  * @protected
  */
	Owl.prototype.initialize = function () {
		this.enter('initializing');
		this.trigger('initialize');

		this.$element.toggleClass(this.settings.rtlClass, this.settings.rtl);

		if (this.settings.autoWidth && !this.is('pre-loading')) {
			var imgs, nestedSelector, width;
			imgs = this.$element.find('img');
			nestedSelector = this.settings.nestedItemSelector ? '.' + this.settings.nestedItemSelector : undefined;
			width = this.$element.children(nestedSelector).width();

			if (imgs.length && width <= 0) {
				this.preloadAutoWidthImages(imgs);
			}
		}

		this.$element.addClass(this.options.loadingClass);

		// create stage
		this.$stage = $('<' + this.settings.stageElement + ' class="' + this.settings.stageClass + '"/>').wrap('<div class="' + this.settings.stageOuterClass + '"/>');

		// append stage
		this.$element.append(this.$stage.parent());

		// append content
		this.replace(this.$element.children().not(this.$stage.parent()));

		// check visibility
		if (this.$element.is(':visible')) {
			// update view
			this.refresh();
		} else {
			// invalidate width
			this.invalidate('width');
		}

		this.$element.removeClass(this.options.loadingClass).addClass(this.options.loadedClass);

		// register event handlers
		this.registerEventHandlers();

		this.leave('initializing');
		this.trigger('initialized');
	};

	/**
  * Setups the current settings.
  * @todo Remove responsive classes. Why should adaptive designs be brought into IE8?
  * @todo Support for media queries by using `matchMedia` would be nice.
  * @public
  */
	Owl.prototype.setup = function () {
		var viewport = this.viewport(),
		    overwrites = this.options.responsive,
		    match = -1,
		    settings = null;

		if (!overwrites) {
			settings = $.extend({}, this.options);
		} else {
			$.each(overwrites, function (breakpoint) {
				if (breakpoint <= viewport && breakpoint > match) {
					match = Number(breakpoint);
				}
			});

			settings = $.extend({}, this.options, overwrites[match]);
			if (typeof settings.stagePadding === 'function') {
				settings.stagePadding = settings.stagePadding();
			}
			delete settings.responsive;

			// responsive class
			if (settings.responsiveClass) {
				this.$element.attr('class', this.$element.attr('class').replace(new RegExp('(' + this.options.responsiveClass + '-)\\S+\\s', 'g'), '$1' + match));
			}
		}

		this.trigger('change', { property: { name: 'settings', value: settings } });
		this._breakpoint = match;
		this.settings = settings;
		this.invalidate('settings');
		this.trigger('changed', { property: { name: 'settings', value: this.settings } });
	};

	/**
  * Updates option logic if necessery.
  * @protected
  */
	Owl.prototype.optionsLogic = function () {
		if (this.settings.autoWidth) {
			this.settings.stagePadding = false;
			this.settings.merge = false;
		}
	};

	/**
  * Prepares an item before add.
  * @todo Rename event parameter `content` to `item`.
  * @protected
  * @returns {jQuery|HTMLElement} - The item container.
  */
	Owl.prototype.prepare = function (item) {
		var event = this.trigger('prepare', { content: item });

		if (!event.data) {
			event.data = $('<' + this.settings.itemElement + '/>').addClass(this.options.itemClass).append(item);
		}

		this.trigger('prepared', { content: event.data });

		return event.data;
	};

	/**
  * Updates the view.
  * @public
  */
	Owl.prototype.update = function () {
		var i = 0,
		    n = this._pipe.length,
		    filter = $.proxy(function (p) {
			return this[p];
		}, this._invalidated),
		    cache = {};

		while (i < n) {
			if (this._invalidated.all || $.grep(this._pipe[i].filter, filter).length > 0) {
				this._pipe[i].run(cache);
			}
			i++;
		}

		this._invalidated = {};

		!this.is('valid') && this.enter('valid');
	};

	/**
  * Gets the width of the view.
  * @public
  * @param {Owl.Width} [dimension=Owl.Width.Default] - The dimension to return.
  * @returns {Number} - The width of the view in pixel.
  */
	Owl.prototype.width = function (dimension) {
		dimension = dimension || Owl.Width.Default;
		switch (dimension) {
			case Owl.Width.Inner:
			case Owl.Width.Outer:
				return this._width;
			default:
				return this._width - this.settings.stagePadding * 2 + this.settings.margin;
		}
	};

	/**
  * Refreshes the carousel primarily for adaptive purposes.
  * @public
  */
	Owl.prototype.refresh = function () {
		this.enter('refreshing');
		this.trigger('refresh');

		this.setup();

		this.optionsLogic();

		this.$element.addClass(this.options.refreshClass);

		this.update();

		this.$element.removeClass(this.options.refreshClass);

		this.leave('refreshing');
		this.trigger('refreshed');
	};

	/**
  * Checks window `resize` event.
  * @protected
  */
	Owl.prototype.onThrottledResize = function () {
		window.clearTimeout(this.resizeTimer);
		this.resizeTimer = window.setTimeout(this._handlers.onResize, this.settings.responsiveRefreshRate);
	};

	/**
  * Checks window `resize` event.
  * @protected
  */
	Owl.prototype.onResize = function () {
		if (!this._items.length) {
			return false;
		}

		if (this._width === this.$element.width()) {
			return false;
		}

		if (!this.$element.is(':visible')) {
			return false;
		}

		this.enter('resizing');

		if (this.trigger('resize').isDefaultPrevented()) {
			this.leave('resizing');
			return false;
		}

		this.invalidate('width');

		this.refresh();

		this.leave('resizing');
		this.trigger('resized');
	};

	/**
  * Registers event handlers.
  * @todo Check `msPointerEnabled`
  * @todo #261
  * @protected
  */
	Owl.prototype.registerEventHandlers = function () {
		if ($.support.transition) {
			this.$stage.on($.support.transition.end + '.owl.core', $.proxy(this.onTransitionEnd, this));
		}

		if (this.settings.responsive !== false) {
			this.on(window, 'resize', this._handlers.onThrottledResize);
		}

		if (this.settings.mouseDrag) {
			this.$element.addClass(this.options.dragClass);
			this.$stage.on('mousedown.owl.core', $.proxy(this.onDragStart, this));
			this.$stage.on('dragstart.owl.core selectstart.owl.core', function () {
				return false;
			});
		}

		if (this.settings.touchDrag) {
			this.$stage.on('touchstart.owl.core', $.proxy(this.onDragStart, this));
			this.$stage.on('touchcancel.owl.core', $.proxy(this.onDragEnd, this));
		}
	};

	/**
  * Handles `touchstart` and `mousedown` events.
  * @todo Horizontal swipe threshold as option
  * @todo #261
  * @protected
  * @param {Event} event - The event arguments.
  */
	Owl.prototype.onDragStart = function (event) {
		var stage = null;

		if (event.which === 3) {
			return;
		}

		if ($.support.transform) {
			stage = this.$stage.css('transform').replace(/.*\(|\)| /g, '').split(',');
			stage = {
				x: stage[stage.length === 16 ? 12 : 4],
				y: stage[stage.length === 16 ? 13 : 5]
			};
		} else {
			stage = this.$stage.position();
			stage = {
				x: this.settings.rtl ? stage.left + this.$stage.width() - this.width() + this.settings.margin : stage.left,
				y: stage.top
			};
		}

		if (this.is('animating')) {
			$.support.transform ? this.animate(stage.x) : this.$stage.stop();
			this.invalidate('position');
		}

		this.$element.toggleClass(this.options.grabClass, event.type === 'mousedown');

		this.speed(0);

		this._drag.time = new Date().getTime();
		this._drag.target = $(event.target);
		this._drag.stage.start = stage;
		this._drag.stage.current = stage;
		this._drag.pointer = this.pointer(event);

		$(document).on('mouseup.owl.core touchend.owl.core', $.proxy(this.onDragEnd, this));

		$(document).one('mousemove.owl.core touchmove.owl.core', $.proxy(function (event) {
			var delta = this.difference(this._drag.pointer, this.pointer(event));

			$(document).on('mousemove.owl.core touchmove.owl.core', $.proxy(this.onDragMove, this));

			if (Math.abs(delta.x) < Math.abs(delta.y) && this.is('valid')) {
				return;
			}

			event.preventDefault();

			this.enter('dragging');
			this.trigger('drag');
		}, this));
	};

	/**
  * Handles the `touchmove` and `mousemove` events.
  * @todo #261
  * @protected
  * @param {Event} event - The event arguments.
  */
	Owl.prototype.onDragMove = function (event) {
		var minimum = null,
		    maximum = null,
		    pull = null,
		    delta = this.difference(this._drag.pointer, this.pointer(event)),
		    stage = this.difference(this._drag.stage.start, delta);

		if (!this.is('dragging')) {
			return;
		}

		event.preventDefault();

		if (this.settings.loop) {
			minimum = this.coordinates(this.minimum());
			maximum = this.coordinates(this.maximum() + 1) - minimum;
			stage.x = ((stage.x - minimum) % maximum + maximum) % maximum + minimum;
		} else {
			minimum = this.settings.rtl ? this.coordinates(this.maximum()) : this.coordinates(this.minimum());
			maximum = this.settings.rtl ? this.coordinates(this.minimum()) : this.coordinates(this.maximum());
			pull = this.settings.pullDrag ? -1 * delta.x / 5 : 0;
			stage.x = Math.max(Math.min(stage.x, minimum + pull), maximum + pull);
		}

		this._drag.stage.current = stage;

		this.animate(stage.x);
	};

	/**
  * Handles the `touchend` and `mouseup` events.
  * @todo #261
  * @todo Threshold for click event
  * @protected
  * @param {Event} event - The event arguments.
  */
	Owl.prototype.onDragEnd = function (event) {
		var delta = this.difference(this._drag.pointer, this.pointer(event)),
		    stage = this._drag.stage.current,
		    direction = delta.x > 0 ^ this.settings.rtl ? 'left' : 'right';

		$(document).off('.owl.core');

		this.$element.removeClass(this.options.grabClass);

		if (delta.x !== 0 && this.is('dragging') || !this.is('valid')) {
			this.speed(this.settings.dragEndSpeed || this.settings.smartSpeed);
			this.current(this.closest(stage.x, delta.x !== 0 ? direction : this._drag.direction));
			this.invalidate('position');
			this.update();

			this._drag.direction = direction;

			if (Math.abs(delta.x) > 3 || new Date().getTime() - this._drag.time > 300) {
				this._drag.target.one('click.owl.core', function () {
					return false;
				});
			}
		}

		if (!this.is('dragging')) {
			return;
		}

		this.leave('dragging');
		this.trigger('dragged');
	};

	/**
  * Gets absolute position of the closest item for a coordinate.
  * @todo Setting `freeDrag` makes `closest` not reusable. See #165.
  * @protected
  * @param {Number} coordinate - The coordinate in pixel.
  * @param {String} direction - The direction to check for the closest item. Ether `left` or `right`.
  * @return {Number} - The absolute position of the closest item.
  */
	Owl.prototype.closest = function (coordinate, direction) {
		var position = -1,
		    pull = 30,
		    width = this.width(),
		    coordinates = this.coordinates();

		if (!this.settings.freeDrag) {
			// check closest item
			$.each(coordinates, $.proxy(function (index, value) {
				// on a left pull, check on current index
				if (direction === 'left' && coordinate > value - pull && coordinate < value + pull) {
					position = index;
					// on a right pull, check on previous index
					// to do so, subtract width from value and set position = index + 1
				} else if (direction === 'right' && coordinate > value - width - pull && coordinate < value - width + pull) {
					position = index + 1;
				} else if (this.op(coordinate, '<', value) && this.op(coordinate, '>', coordinates[index + 1] || value - width)) {
					position = direction === 'left' ? index + 1 : index;
				}
				return position === -1;
			}, this));
		}

		if (!this.settings.loop) {
			// non loop boundries
			if (this.op(coordinate, '>', coordinates[this.minimum()])) {
				position = coordinate = this.minimum();
			} else if (this.op(coordinate, '<', coordinates[this.maximum()])) {
				position = coordinate = this.maximum();
			}
		}

		return position;
	};

	/**
  * Animates the stage.
  * @todo #270
  * @public
  * @param {Number} coordinate - The coordinate in pixels.
  */
	Owl.prototype.animate = function (coordinate) {
		var animate = this.speed() > 0;

		this.is('animating') && this.onTransitionEnd();

		if (animate) {
			this.enter('animating');
			this.trigger('translate');
		}

		if ($.support.transform3d && $.support.transition) {
			this.$stage.css({
				transform: 'translate3d(' + coordinate + 'px,0px,0px)',
				transition: this.speed() / 1000 + 's'
			});
		} else if (animate) {
			this.$stage.animate({
				left: coordinate + 'px'
			}, this.speed(), this.settings.fallbackEasing, $.proxy(this.onTransitionEnd, this));
		} else {
			this.$stage.css({
				left: coordinate + 'px'
			});
		}
	};

	/**
  * Checks whether the carousel is in a specific state or not.
  * @param {String} state - The state to check.
  * @returns {Boolean} - The flag which indicates if the carousel is busy.
  */
	Owl.prototype.is = function (state) {
		return this._states.current[state] && this._states.current[state] > 0;
	};

	/**
  * Sets the absolute position of the current item.
  * @public
  * @param {Number} [position] - The new absolute position or nothing to leave it unchanged.
  * @returns {Number} - The absolute position of the current item.
  */
	Owl.prototype.current = function (position) {
		if (position === undefined) {
			return this._current;
		}

		if (this._items.length === 0) {
			return undefined;
		}

		position = this.normalize(position);

		if (this._current !== position) {
			var event = this.trigger('change', { property: { name: 'position', value: position } });

			if (event.data !== undefined) {
				position = this.normalize(event.data);
			}

			this._current = position;

			this.invalidate('position');

			this.trigger('changed', { property: { name: 'position', value: this._current } });
		}

		return this._current;
	};

	/**
  * Invalidates the given part of the update routine.
  * @param {String} [part] - The part to invalidate.
  * @returns {Array.<String>} - The invalidated parts.
  */
	Owl.prototype.invalidate = function (part) {
		if ($.type(part) === 'string') {
			this._invalidated[part] = true;
			this.is('valid') && this.leave('valid');
		}
		return $.map(this._invalidated, function (v, i) {
			return i;
		});
	};

	/**
  * Resets the absolute position of the current item.
  * @public
  * @param {Number} position - The absolute position of the new item.
  */
	Owl.prototype.reset = function (position) {
		position = this.normalize(position);

		if (position === undefined) {
			return;
		}

		this._speed = 0;
		this._current = position;

		this.suppress(['translate', 'translated']);

		this.animate(this.coordinates(position));

		this.release(['translate', 'translated']);
	};

	/**
  * Normalizes an absolute or a relative position of an item.
  * @public
  * @param {Number} position - The absolute or relative position to normalize.
  * @param {Boolean} [relative=false] - Whether the given position is relative or not.
  * @returns {Number} - The normalized position.
  */
	Owl.prototype.normalize = function (position, relative) {
		var n = this._items.length,
		    m = relative ? 0 : this._clones.length;

		if (!this.isNumeric(position) || n < 1) {
			position = undefined;
		} else if (position < 0 || position >= n + m) {
			position = ((position - m / 2) % n + n) % n + m / 2;
		}

		return position;
	};

	/**
  * Converts an absolute position of an item into a relative one.
  * @public
  * @param {Number} position - The absolute position to convert.
  * @returns {Number} - The converted position.
  */
	Owl.prototype.relative = function (position) {
		position -= this._clones.length / 2;
		return this.normalize(position, true);
	};

	/**
  * Gets the maximum position for the current item.
  * @public
  * @param {Boolean} [relative=false] - Whether to return an absolute position or a relative position.
  * @returns {Number}
  */
	Owl.prototype.maximum = function (relative) {
		var settings = this.settings,
		    maximum = this._coordinates.length,
		    iterator,
		    reciprocalItemsWidth,
		    elementWidth;

		if (settings.loop) {
			maximum = this._clones.length / 2 + this._items.length - 1;
		} else if (settings.autoWidth || settings.merge) {
			iterator = this._items.length;
			reciprocalItemsWidth = this._items[--iterator].width();
			elementWidth = this.$element.width();
			while (iterator--) {
				reciprocalItemsWidth += this._items[iterator].width() + this.settings.margin;
				if (reciprocalItemsWidth > elementWidth) {
					break;
				}
			}
			maximum = iterator + 1;
		} else if (settings.center) {
			maximum = this._items.length - 1;
		} else {
			maximum = this._items.length - settings.items;
		}

		if (relative) {
			maximum -= this._clones.length / 2;
		}

		return Math.max(maximum, 0);
	};

	/**
  * Gets the minimum position for the current item.
  * @public
  * @param {Boolean} [relative=false] - Whether to return an absolute position or a relative position.
  * @returns {Number}
  */
	Owl.prototype.minimum = function (relative) {
		return relative ? 0 : this._clones.length / 2;
	};

	/**
  * Gets an item at the specified relative position.
  * @public
  * @param {Number} [position] - The relative position of the item.
  * @return {jQuery|Array.<jQuery>} - The item at the given position or all items if no position was given.
  */
	Owl.prototype.items = function (position) {
		if (position === undefined) {
			return this._items.slice();
		}

		position = this.normalize(position, true);
		return this._items[position];
	};

	/**
  * Gets an item at the specified relative position.
  * @public
  * @param {Number} [position] - The relative position of the item.
  * @return {jQuery|Array.<jQuery>} - The item at the given position or all items if no position was given.
  */
	Owl.prototype.mergers = function (position) {
		if (position === undefined) {
			return this._mergers.slice();
		}

		position = this.normalize(position, true);
		return this._mergers[position];
	};

	/**
  * Gets the absolute positions of clones for an item.
  * @public
  * @param {Number} [position] - The relative position of the item.
  * @returns {Array.<Number>} - The absolute positions of clones for the item or all if no position was given.
  */
	Owl.prototype.clones = function (position) {
		var odd = this._clones.length / 2,
		    even = odd + this._items.length,
		    map = function (index) {
			return index % 2 === 0 ? even + index / 2 : odd - (index + 1) / 2;
		};

		if (position === undefined) {
			return $.map(this._clones, function (v, i) {
				return map(i);
			});
		}

		return $.map(this._clones, function (v, i) {
			return v === position ? map(i) : null;
		});
	};

	/**
  * Sets the current animation speed.
  * @public
  * @param {Number} [speed] - The animation speed in milliseconds or nothing to leave it unchanged.
  * @returns {Number} - The current animation speed in milliseconds.
  */
	Owl.prototype.speed = function (speed) {
		if (speed !== undefined) {
			this._speed = speed;
		}

		return this._speed;
	};

	/**
  * Gets the coordinate of an item.
  * @todo The name of this method is missleanding.
  * @public
  * @param {Number} position - The absolute position of the item within `minimum()` and `maximum()`.
  * @returns {Number|Array.<Number>} - The coordinate of the item in pixel or all coordinates.
  */
	Owl.prototype.coordinates = function (position) {
		var multiplier = 1,
		    newPosition = position - 1,
		    coordinate;

		if (position === undefined) {
			return $.map(this._coordinates, $.proxy(function (coordinate, index) {
				return this.coordinates(index);
			}, this));
		}

		if (this.settings.center) {
			if (this.settings.rtl) {
				multiplier = -1;
				newPosition = position + 1;
			}

			coordinate = this._coordinates[position];
			coordinate += (this.width() - coordinate + (this._coordinates[newPosition] || 0)) / 2 * multiplier;
		} else {
			coordinate = this._coordinates[newPosition] || 0;
		}

		coordinate = Math.ceil(coordinate);

		return coordinate;
	};

	/**
  * Calculates the speed for a translation.
  * @protected
  * @param {Number} from - The absolute position of the start item.
  * @param {Number} to - The absolute position of the target item.
  * @param {Number} [factor=undefined] - The time factor in milliseconds.
  * @returns {Number} - The time in milliseconds for the translation.
  */
	Owl.prototype.duration = function (from, to, factor) {
		if (factor === 0) {
			return 0;
		}

		return Math.min(Math.max(Math.abs(to - from), 1), 6) * Math.abs(factor || this.settings.smartSpeed);
	};

	/**
  * Slides to the specified item.
  * @public
  * @param {Number} position - The position of the item.
  * @param {Number} [speed] - The time in milliseconds for the transition.
  */
	Owl.prototype.to = function (position, speed) {
		var current = this.current(),
		    revert = null,
		    distance = position - this.relative(current),
		    direction = (distance > 0) - (distance < 0),
		    items = this._items.length,
		    minimum = this.minimum(),
		    maximum = this.maximum();

		if (this.settings.loop) {
			if (!this.settings.rewind && Math.abs(distance) > items / 2) {
				distance += direction * -1 * items;
			}

			position = current + distance;
			revert = ((position - minimum) % items + items) % items + minimum;

			if (revert !== position && revert - distance <= maximum && revert - distance > 0) {
				current = revert - distance;
				position = revert;
				this.reset(current);
			}
		} else if (this.settings.rewind) {
			maximum += 1;
			position = (position % maximum + maximum) % maximum;
		} else {
			position = Math.max(minimum, Math.min(maximum, position));
		}

		this.speed(this.duration(current, position, speed));
		this.current(position);

		if (this.$element.is(':visible')) {
			this.update();
		}
	};

	/**
  * Slides to the next item.
  * @public
  * @param {Number} [speed] - The time in milliseconds for the transition.
  */
	Owl.prototype.next = function (speed) {
		speed = speed || false;
		this.to(this.relative(this.current()) + 1, speed);
	};

	/**
  * Slides to the previous item.
  * @public
  * @param {Number} [speed] - The time in milliseconds for the transition.
  */
	Owl.prototype.prev = function (speed) {
		speed = speed || false;
		this.to(this.relative(this.current()) - 1, speed);
	};

	/**
  * Handles the end of an animation.
  * @protected
  * @param {Event} event - The event arguments.
  */
	Owl.prototype.onTransitionEnd = function (event) {

		// if css2 animation then event object is undefined
		if (event !== undefined) {
			event.stopPropagation();

			// Catch only owl-stage transitionEnd event
			if ((event.target || event.srcElement || event.originalTarget) !== this.$stage.get(0)) {
				return false;
			}
		}

		this.leave('animating');
		this.trigger('translated');
	};

	/**
  * Gets viewport width.
  * @protected
  * @return {Number} - The width in pixel.
  */
	Owl.prototype.viewport = function () {
		var width;
		if (this.options.responsiveBaseElement !== window) {
			width = $(this.options.responsiveBaseElement).width();
		} else if (window.innerWidth) {
			width = window.innerWidth;
		} else if (document.documentElement && document.documentElement.clientWidth) {
			width = document.documentElement.clientWidth;
		} else {
			throw 'Can not detect viewport width.';
		}
		return width;
	};

	/**
  * Replaces the current content.
  * @public
  * @param {HTMLElement|jQuery|String} content - The new content.
  */
	Owl.prototype.replace = function (content) {
		this.$stage.empty();
		this._items = [];

		if (content) {
			content = content instanceof jQuery ? content : $(content);
		}

		if (this.settings.nestedItemSelector) {
			content = content.find('.' + this.settings.nestedItemSelector);
		}

		content.filter(function () {
			return this.nodeType === 1;
		}).each($.proxy(function (index, item) {
			item = this.prepare(item);
			this.$stage.append(item);
			this._items.push(item);
			this._mergers.push(item.find('[data-merge]').addBack('[data-merge]').attr('data-merge') * 1 || 1);
		}, this));

		this.reset(this.isNumeric(this.settings.startPosition) ? this.settings.startPosition : 0);

		this.invalidate('items');
	};

	/**
  * Adds an item.
  * @todo Use `item` instead of `content` for the event arguments.
  * @public
  * @param {HTMLElement|jQuery|String} content - The item content to add.
  * @param {Number} [position] - The relative position at which to insert the item otherwise the item will be added to the end.
  */
	Owl.prototype.add = function (content, position) {
		var current = this.relative(this._current);

		position = position === undefined ? this._items.length : this.normalize(position, true);
		content = content instanceof jQuery ? content : $(content);

		this.trigger('add', { content: content, position: position });

		content = this.prepare(content);

		if (this._items.length === 0 || position === this._items.length) {
			this._items.length === 0 && this.$stage.append(content);
			this._items.length !== 0 && this._items[position - 1].after(content);
			this._items.push(content);
			this._mergers.push(content.find('[data-merge]').addBack('[data-merge]').attr('data-merge') * 1 || 1);
		} else {
			this._items[position].before(content);
			this._items.splice(position, 0, content);
			this._mergers.splice(position, 0, content.find('[data-merge]').addBack('[data-merge]').attr('data-merge') * 1 || 1);
		}

		this._items[current] && this.reset(this._items[current].index());

		this.invalidate('items');

		this.trigger('added', { content: content, position: position });
	};

	/**
  * Removes an item by its position.
  * @todo Use `item` instead of `content` for the event arguments.
  * @public
  * @param {Number} position - The relative position of the item to remove.
  */
	Owl.prototype.remove = function (position) {
		position = this.normalize(position, true);

		if (position === undefined) {
			return;
		}

		this.trigger('remove', { content: this._items[position], position: position });

		this._items[position].remove();
		this._items.splice(position, 1);
		this._mergers.splice(position, 1);

		this.invalidate('items');

		this.trigger('removed', { content: null, position: position });
	};

	/**
  * Preloads images with auto width.
  * @todo Replace by a more generic approach
  * @protected
  */
	Owl.prototype.preloadAutoWidthImages = function (images) {
		images.each($.proxy(function (i, element) {
			this.enter('pre-loading');
			element = $(element);
			$(new Image()).one('load', $.proxy(function (e) {
				element.attr('src', e.target.src);
				element.css('opacity', 1);
				this.leave('pre-loading');
				!this.is('pre-loading') && !this.is('initializing') && this.refresh();
			}, this)).attr('src', element.attr('src') || element.attr('data-src') || element.attr('data-src-retina'));
		}, this));
	};

	/**
  * Destroys the carousel.
  * @public
  */
	Owl.prototype.destroy = function () {

		this.$element.off('.owl.core');
		this.$stage.off('.owl.core');
		$(document).off('.owl.core');

		if (this.settings.responsive !== false) {
			window.clearTimeout(this.resizeTimer);
			this.off(window, 'resize', this._handlers.onThrottledResize);
		}

		for (var i in this._plugins) {
			this._plugins[i].destroy();
		}

		this.$stage.children('.cloned').remove();

		this.$stage.unwrap();
		this.$stage.children().contents().unwrap();
		this.$stage.children().unwrap();

		this.$element.removeClass(this.options.refreshClass).removeClass(this.options.loadingClass).removeClass(this.options.loadedClass).removeClass(this.options.rtlClass).removeClass(this.options.dragClass).removeClass(this.options.grabClass).attr('class', this.$element.attr('class').replace(new RegExp(this.options.responsiveClass + '-\\S+\\s', 'g'), '')).removeData('owl.carousel');
	};

	/**
  * Operators to calculate right-to-left and left-to-right.
  * @protected
  * @param {Number} [a] - The left side operand.
  * @param {String} [o] - The operator.
  * @param {Number} [b] - The right side operand.
  */
	Owl.prototype.op = function (a, o, b) {
		var rtl = this.settings.rtl;
		switch (o) {
			case '<':
				return rtl ? a > b : a < b;
			case '>':
				return rtl ? a < b : a > b;
			case '>=':
				return rtl ? a <= b : a >= b;
			case '<=':
				return rtl ? a >= b : a <= b;
			default:
				break;
		}
	};

	/**
  * Attaches to an internal event.
  * @protected
  * @param {HTMLElement} element - The event source.
  * @param {String} event - The event name.
  * @param {Function} listener - The event handler to attach.
  * @param {Boolean} capture - Wether the event should be handled at the capturing phase or not.
  */
	Owl.prototype.on = function (element, event, listener, capture) {
		if (element.addEventListener) {
			element.addEventListener(event, listener, capture);
		} else if (element.attachEvent) {
			element.attachEvent('on' + event, listener);
		}
	};

	/**
  * Detaches from an internal event.
  * @protected
  * @param {HTMLElement} element - The event source.
  * @param {String} event - The event name.
  * @param {Function} listener - The attached event handler to detach.
  * @param {Boolean} capture - Wether the attached event handler was registered as a capturing listener or not.
  */
	Owl.prototype.off = function (element, event, listener, capture) {
		if (element.removeEventListener) {
			element.removeEventListener(event, listener, capture);
		} else if (element.detachEvent) {
			element.detachEvent('on' + event, listener);
		}
	};

	/**
  * Triggers a public event.
  * @todo Remove `status`, `relatedTarget` should be used instead.
  * @protected
  * @param {String} name - The event name.
  * @param {*} [data=null] - The event data.
  * @param {String} [namespace=carousel] - The event namespace.
  * @param {String} [state] - The state which is associated with the event.
  * @param {Boolean} [enter=false] - Indicates if the call enters the specified state or not.
  * @returns {Event} - The event arguments.
  */
	Owl.prototype.trigger = function (name, data, namespace, state, enter) {
		var status = {
			item: { count: this._items.length, index: this.current() }
		},
		    handler = $.camelCase($.grep(['on', name, namespace], function (v) {
			return v;
		}).join('-').toLowerCase()),
		    event = $.Event([name, 'owl', namespace || 'carousel'].join('.').toLowerCase(), $.extend({ relatedTarget: this }, status, data));

		if (!this._supress[name]) {
			$.each(this._plugins, function (name, plugin) {
				if (plugin.onTrigger) {
					plugin.onTrigger(event);
				}
			});

			this.register({ type: Owl.Type.Event, name: name });
			this.$element.trigger(event);

			if (this.settings && typeof this.settings[handler] === 'function') {
				this.settings[handler].call(this, event);
			}
		}

		return event;
	};

	/**
  * Enters a state.
  * @param name - The state name.
  */
	Owl.prototype.enter = function (name) {
		$.each([name].concat(this._states.tags[name] || []), $.proxy(function (i, name) {
			if (this._states.current[name] === undefined) {
				this._states.current[name] = 0;
			}

			this._states.current[name]++;
		}, this));
	};

	/**
  * Leaves a state.
  * @param name - The state name.
  */
	Owl.prototype.leave = function (name) {
		$.each([name].concat(this._states.tags[name] || []), $.proxy(function (i, name) {
			this._states.current[name]--;
		}, this));
	};

	/**
  * Registers an event or state.
  * @public
  * @param {Object} object - The event or state to register.
  */
	Owl.prototype.register = function (object) {
		if (object.type === Owl.Type.Event) {
			if (!$.event.special[object.name]) {
				$.event.special[object.name] = {};
			}

			if (!$.event.special[object.name].owl) {
				var _default = $.event.special[object.name]._default;
				$.event.special[object.name]._default = function (e) {
					if (_default && _default.apply && (!e.namespace || e.namespace.indexOf('owl') === -1)) {
						return _default.apply(this, arguments);
					}
					return e.namespace && e.namespace.indexOf('owl') > -1;
				};
				$.event.special[object.name].owl = true;
			}
		} else if (object.type === Owl.Type.State) {
			if (!this._states.tags[object.name]) {
				this._states.tags[object.name] = object.tags;
			} else {
				this._states.tags[object.name] = this._states.tags[object.name].concat(object.tags);
			}

			this._states.tags[object.name] = $.grep(this._states.tags[object.name], $.proxy(function (tag, i) {
				return $.inArray(tag, this._states.tags[object.name]) === i;
			}, this));
		}
	};

	/**
  * Suppresses events.
  * @protected
  * @param {Array.<String>} events - The events to suppress.
  */
	Owl.prototype.suppress = function (events) {
		$.each(events, $.proxy(function (index, event) {
			this._supress[event] = true;
		}, this));
	};

	/**
  * Releases suppressed events.
  * @protected
  * @param {Array.<String>} events - The events to release.
  */
	Owl.prototype.release = function (events) {
		$.each(events, $.proxy(function (index, event) {
			delete this._supress[event];
		}, this));
	};

	/**
  * Gets unified pointer coordinates from event.
  * @todo #261
  * @protected
  * @param {Event} - The `mousedown` or `touchstart` event.
  * @returns {Object} - Contains `x` and `y` coordinates of current pointer position.
  */
	Owl.prototype.pointer = function (event) {
		var result = { x: null, y: null };

		event = event.originalEvent || event || window.event;

		event = event.touches && event.touches.length ? event.touches[0] : event.changedTouches && event.changedTouches.length ? event.changedTouches[0] : event;

		if (event.pageX) {
			result.x = event.pageX;
			result.y = event.pageY;
		} else {
			result.x = event.clientX;
			result.y = event.clientY;
		}

		return result;
	};

	/**
  * Determines if the input is a Number or something that can be coerced to a Number
  * @protected
  * @param {Number|String|Object|Array|Boolean|RegExp|Function|Symbol} - The input to be tested
  * @returns {Boolean} - An indication if the input is a Number or can be coerced to a Number
  */
	Owl.prototype.isNumeric = function (number) {
		return !isNaN(parseFloat(number));
	};

	/**
  * Gets the difference of two vectors.
  * @todo #261
  * @protected
  * @param {Object} - The first vector.
  * @param {Object} - The second vector.
  * @returns {Object} - The difference.
  */
	Owl.prototype.difference = function (first, second) {
		return {
			x: first.x - second.x,
			y: first.y - second.y
		};
	};

	/**
  * The jQuery Plugin for the Owl Carousel
  * @todo Navigation plugin `next` and `prev`
  * @public
  */
	$.fn.owlCarousel = function (option) {
		var args = Array.prototype.slice.call(arguments, 1);

		return this.each(function () {
			var $this = $(this),
			    data = $this.data('owl.carousel');

			if (!data) {
				data = new Owl(this, typeof option == 'object' && option);
				$this.data('owl.carousel', data);

				$.each(['next', 'prev', 'to', 'destroy', 'refresh', 'replace', 'add', 'remove'], function (i, event) {
					data.register({ type: Owl.Type.Event, name: event });
					data.$element.on(event + '.owl.carousel.core', $.proxy(function (e) {
						if (e.namespace && e.relatedTarget !== this) {
							this.suppress([event]);
							data[event].apply(this, [].slice.call(arguments, 1));
							this.release([event]);
						}
					}, data));
				});
			}

			if (typeof option == 'string' && option.charAt(0) !== '_') {
				data[option].apply(data, args);
			}
		});
	};

	/**
  * The constructor for the jQuery Plugin
  * @public
  */
	$.fn.owlCarousel.Constructor = Owl;
})(window.Zepto || window.jQuery, window, document);

/**
 * AutoRefresh Plugin
 * @version 2.1.0
 * @author Artus Kolanowski
 * @author David Deutsch
 * @license The MIT License (MIT)
 */
;(function ($, window, document, undefined) {

	/**
  * Creates the auto refresh plugin.
  * @class The Auto Refresh Plugin
  * @param {Owl} carousel - The Owl Carousel
  */
	var AutoRefresh = function (carousel) {
		/**
   * Reference to the core.
   * @protected
   * @type {Owl}
   */
		this._core = carousel;

		/**
   * Refresh interval.
   * @protected
   * @type {number}
   */
		this._interval = null;

		/**
   * Whether the element is currently visible or not.
   * @protected
   * @type {Boolean}
   */
		this._visible = null;

		/**
   * All event handlers.
   * @protected
   * @type {Object}
   */
		this._handlers = {
			'initialized.owl.carousel': $.proxy(function (e) {
				if (e.namespace && this._core.settings.autoRefresh) {
					this.watch();
				}
			}, this)
		};

		// set default options
		this._core.options = $.extend({}, AutoRefresh.Defaults, this._core.options);

		// register event handlers
		this._core.$element.on(this._handlers);
	};

	/**
  * Default options.
  * @public
  */
	AutoRefresh.Defaults = {
		autoRefresh: true,
		autoRefreshInterval: 500
	};

	/**
  * Watches the element.
  */
	AutoRefresh.prototype.watch = function () {
		if (this._interval) {
			return;
		}

		this._visible = this._core.$element.is(':visible');
		this._interval = window.setInterval($.proxy(this.refresh, this), this._core.settings.autoRefreshInterval);
	};

	/**
  * Refreshes the element.
  */
	AutoRefresh.prototype.refresh = function () {
		if (this._core.$element.is(':visible') === this._visible) {
			return;
		}

		this._visible = !this._visible;

		this._core.$element.toggleClass('owl-hidden', !this._visible);

		this._visible && this._core.invalidate('width') && this._core.refresh();
	};

	/**
  * Destroys the plugin.
  */
	AutoRefresh.prototype.destroy = function () {
		var handler, property;

		window.clearInterval(this._interval);

		for (handler in this._handlers) {
			this._core.$element.off(handler, this._handlers[handler]);
		}
		for (property in Object.getOwnPropertyNames(this)) {
			typeof this[property] != 'function' && (this[property] = null);
		}
	};

	$.fn.owlCarousel.Constructor.Plugins.AutoRefresh = AutoRefresh;
})(window.Zepto || window.jQuery, window, document);

/**
 * Lazy Plugin
 * @version 2.1.0
 * @author Bartosz Wojciechowski
 * @author David Deutsch
 * @license The MIT License (MIT)
 */
;(function ($, window, document, undefined) {

	/**
  * Creates the lazy plugin.
  * @class The Lazy Plugin
  * @param {Owl} carousel - The Owl Carousel
  */
	var Lazy = function (carousel) {

		/**
   * Reference to the core.
   * @protected
   * @type {Owl}
   */
		this._core = carousel;

		/**
   * Already loaded items.
   * @protected
   * @type {Array.<jQuery>}
   */
		this._loaded = [];

		/**
   * Event handlers.
   * @protected
   * @type {Object}
   */
		this._handlers = {
			'initialized.owl.carousel change.owl.carousel resized.owl.carousel': $.proxy(function (e) {
				if (!e.namespace) {
					return;
				}

				if (!this._core.settings || !this._core.settings.lazyLoad) {
					return;
				}

				if (e.property && e.property.name == 'position' || e.type == 'initialized') {
					var settings = this._core.settings,
					    n = settings.center && Math.ceil(settings.items / 2) || settings.items,
					    i = settings.center && n * -1 || 0,
					    position = (e.property && e.property.value !== undefined ? e.property.value : this._core.current()) + i,
					    clones = this._core.clones().length,
					    load = $.proxy(function (i, v) {
						this.load(v);
					}, this);

					while (i++ < n) {
						this.load(clones / 2 + this._core.relative(position));
						clones && $.each(this._core.clones(this._core.relative(position)), load);
						position++;
					}
				}
			}, this)
		};

		// set the default options
		this._core.options = $.extend({}, Lazy.Defaults, this._core.options);

		// register event handler
		this._core.$element.on(this._handlers);
	};

	/**
  * Default options.
  * @public
  */
	Lazy.Defaults = {
		lazyLoad: false
	};

	/**
  * Loads all resources of an item at the specified position.
  * @param {Number} position - The absolute position of the item.
  * @protected
  */
	Lazy.prototype.load = function (position) {
		var $item = this._core.$stage.children().eq(position),
		    $elements = $item && $item.find('.owl-lazy');

		if (!$elements || $.inArray($item.get(0), this._loaded) > -1) {
			return;
		}

		$elements.each($.proxy(function (index, element) {
			var $element = $(element),
			    image,
			    url = window.devicePixelRatio > 1 && $element.attr('data-src-retina') || $element.attr('data-src');

			this._core.trigger('load', { element: $element, url: url }, 'lazy');

			if ($element.is('img')) {
				$element.one('load.owl.lazy', $.proxy(function () {
					$element.css('opacity', 1);
					this._core.trigger('loaded', { element: $element, url: url }, 'lazy');
				}, this)).attr('src', url);
			} else {
				image = new Image();
				image.onload = $.proxy(function () {
					$element.css({
						'background-image': 'url(' + url + ')',
						'opacity': '1'
					});
					this._core.trigger('loaded', { element: $element, url: url }, 'lazy');
				}, this);
				image.src = url;
			}
		}, this));

		this._loaded.push($item.get(0));
	};

	/**
  * Destroys the plugin.
  * @public
  */
	Lazy.prototype.destroy = function () {
		var handler, property;

		for (handler in this.handlers) {
			this._core.$element.off(handler, this.handlers[handler]);
		}
		for (property in Object.getOwnPropertyNames(this)) {
			typeof this[property] != 'function' && (this[property] = null);
		}
	};

	$.fn.owlCarousel.Constructor.Plugins.Lazy = Lazy;
})(window.Zepto || window.jQuery, window, document);

/**
 * AutoHeight Plugin
 * @version 2.1.0
 * @author Bartosz Wojciechowski
 * @author David Deutsch
 * @license The MIT License (MIT)
 */
;(function ($, window, document, undefined) {

	/**
  * Creates the auto height plugin.
  * @class The Auto Height Plugin
  * @param {Owl} carousel - The Owl Carousel
  */
	var AutoHeight = function (carousel) {
		/**
   * Reference to the core.
   * @protected
   * @type {Owl}
   */
		this._core = carousel;

		/**
   * All event handlers.
   * @protected
   * @type {Object}
   */
		this._handlers = {
			'initialized.owl.carousel refreshed.owl.carousel': $.proxy(function (e) {
				if (e.namespace && this._core.settings.autoHeight) {
					this.update();
				}
			}, this),
			'changed.owl.carousel': $.proxy(function (e) {
				if (e.namespace && this._core.settings.autoHeight && e.property.name == 'position') {
					this.update();
				}
			}, this),
			'loaded.owl.lazy': $.proxy(function (e) {
				if (e.namespace && this._core.settings.autoHeight && e.element.closest('.' + this._core.settings.itemClass).index() === this._core.current()) {
					this.update();
				}
			}, this)
		};

		// set default options
		this._core.options = $.extend({}, AutoHeight.Defaults, this._core.options);

		// register event handlers
		this._core.$element.on(this._handlers);
	};

	/**
  * Default options.
  * @public
  */
	AutoHeight.Defaults = {
		autoHeight: false,
		autoHeightClass: 'owl-height'
	};

	/**
  * Updates the view.
  */
	AutoHeight.prototype.update = function () {
		var start = this._core._current,
		    end = start + this._core.settings.items,
		    visible = this._core.$stage.children().toArray().slice(start, end),
		    heights = [],
		    maxheight = 0;

		$.each(visible, function (index, item) {
			heights.push($(item).height());
		});

		maxheight = Math.max.apply(null, heights);

		this._core.$stage.parent().height(maxheight).addClass(this._core.settings.autoHeightClass);
	};

	AutoHeight.prototype.destroy = function () {
		var handler, property;

		for (handler in this._handlers) {
			this._core.$element.off(handler, this._handlers[handler]);
		}
		for (property in Object.getOwnPropertyNames(this)) {
			typeof this[property] != 'function' && (this[property] = null);
		}
	};

	$.fn.owlCarousel.Constructor.Plugins.AutoHeight = AutoHeight;
})(window.Zepto || window.jQuery, window, document);

/**
 * Video Plugin
 * @version 2.1.0
 * @author Bartosz Wojciechowski
 * @author David Deutsch
 * @license The MIT License (MIT)
 */
;(function ($, window, document, undefined) {

	/**
  * Creates the video plugin.
  * @class The Video Plugin
  * @param {Owl} carousel - The Owl Carousel
  */
	var Video = function (carousel) {
		/**
   * Reference to the core.
   * @protected
   * @type {Owl}
   */
		this._core = carousel;

		/**
   * Cache all video URLs.
   * @protected
   * @type {Object}
   */
		this._videos = {};

		/**
   * Current playing item.
   * @protected
   * @type {jQuery}
   */
		this._playing = null;

		/**
   * All event handlers.
   * @todo The cloned content removale is too late
   * @protected
   * @type {Object}
   */
		this._handlers = {
			'initialized.owl.carousel': $.proxy(function (e) {
				if (e.namespace) {
					this._core.register({ type: 'state', name: 'playing', tags: ['interacting'] });
				}
			}, this),
			'resize.owl.carousel': $.proxy(function (e) {
				if (e.namespace && this._core.settings.video && this.isInFullScreen()) {
					e.preventDefault();
				}
			}, this),
			'refreshed.owl.carousel': $.proxy(function (e) {
				if (e.namespace && this._core.is('resizing')) {
					this._core.$stage.find('.cloned .owl-video-frame').remove();
				}
			}, this),
			'changed.owl.carousel': $.proxy(function (e) {
				if (e.namespace && e.property.name === 'position' && this._playing) {
					this.stop();
				}
			}, this),
			'prepared.owl.carousel': $.proxy(function (e) {
				if (!e.namespace) {
					return;
				}

				var $element = $(e.content).find('.owl-video');

				if ($element.length) {
					$element.css('display', 'none');
					this.fetch($element, $(e.content));
				}
			}, this)
		};

		// set default options
		this._core.options = $.extend({}, Video.Defaults, this._core.options);

		// register event handlers
		this._core.$element.on(this._handlers);

		this._core.$element.on('click.owl.video', '.owl-video-play-icon', $.proxy(function (e) {
			this.play(e);
		}, this));
	};

	/**
  * Default options.
  * @public
  */
	Video.Defaults = {
		video: false,
		videoHeight: false,
		videoWidth: false
	};

	/**
  * Gets the video ID and the type (YouTube/Vimeo/vzaar only).
  * @protected
  * @param {jQuery} target - The target containing the video data.
  * @param {jQuery} item - The item containing the video.
  */
	Video.prototype.fetch = function (target, item) {
		var type = function () {
			if (target.attr('data-vimeo-id')) {
				return 'vimeo';
			} else if (target.attr('data-vzaar-id')) {
				return 'vzaar';
			} else {
				return 'youtube';
			}
		}(),
		    id = target.attr('data-vimeo-id') || target.attr('data-youtube-id') || target.attr('data-vzaar-id'),
		    width = target.attr('data-width') || this._core.settings.videoWidth,
		    height = target.attr('data-height') || this._core.settings.videoHeight,
		    url = target.attr('href');

		if (url) {

			/*
   		Parses the id's out of the following urls (and probably more):
   		https://www.youtube.com/watch?v=:id
   		https://youtu.be/:id
   		https://vimeo.com/:id
   		https://vimeo.com/channels/:channel/:id
   		https://vimeo.com/groups/:group/videos/:id
   		https://app.vzaar.com/videos/:id
   			Visual example: https://regexper.com/#(http%3A%7Chttps%3A%7C)%5C%2F%5C%2F(player.%7Cwww.%7Capp.)%3F(vimeo%5C.com%7Cyoutu(be%5C.com%7C%5C.be%7Cbe%5C.googleapis%5C.com)%7Cvzaar%5C.com)%5C%2F(video%5C%2F%7Cvideos%5C%2F%7Cembed%5C%2F%7Cchannels%5C%2F.%2B%5C%2F%7Cgroups%5C%2F.%2B%5C%2F%7Cwatch%5C%3Fv%3D%7Cv%5C%2F)%3F(%5BA-Za-z0-9._%25-%5D*)(%5C%26%5CS%2B)%3F
   */

			id = url.match(/(http:|https:|)\/\/(player.|www.|app.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com)|vzaar\.com)\/(video\/|videos\/|embed\/|channels\/.+\/|groups\/.+\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(\&\S+)?/);

			if (id[3].indexOf('youtu') > -1) {
				type = 'youtube';
			} else if (id[3].indexOf('vimeo') > -1) {
				type = 'vimeo';
			} else if (id[3].indexOf('vzaar') > -1) {
				type = 'vzaar';
			} else {
				throw new Error('Video URL not supported.');
			}
			id = id[6];
		} else {
			throw new Error('Missing video URL.');
		}

		this._videos[url] = {
			type: type,
			id: id,
			width: width,
			height: height
		};

		item.attr('data-video', url);

		this.thumbnail(target, this._videos[url]);
	};

	/**
  * Creates video thumbnail.
  * @protected
  * @param {jQuery} target - The target containing the video data.
  * @param {Object} info - The video info object.
  * @see `fetch`
  */
	Video.prototype.thumbnail = function (target, video) {
		var tnLink,
		    icon,
		    path,
		    dimensions = video.width && video.height ? 'style="width:' + video.width + 'px;height:' + video.height + 'px;"' : '',
		    customTn = target.find('img'),
		    srcType = 'src',
		    lazyClass = '',
		    settings = this._core.settings,
		    create = function (path) {
			icon = '<div class="owl-video-play-icon"></div>';

			if (settings.lazyLoad) {
				tnLink = '<div class="owl-video-tn ' + lazyClass + '" ' + srcType + '="' + path + '"></div>';
			} else {
				tnLink = '<div class="owl-video-tn" style="opacity:1;background-image:url(' + path + ')"></div>';
			}
			target.after(tnLink);
			target.after(icon);
		};

		// wrap video content into owl-video-wrapper div
		target.wrap('<div class="owl-video-wrapper"' + dimensions + '></div>');

		if (this._core.settings.lazyLoad) {
			srcType = 'data-src';
			lazyClass = 'owl-lazy';
		}

		// custom thumbnail
		if (customTn.length) {
			create(customTn.attr(srcType));
			customTn.remove();
			return false;
		}

		if (video.type === 'youtube') {
			path = "//img.youtube.com/vi/" + video.id + "/hqdefault.jpg";
			create(path);
		} else if (video.type === 'vimeo') {
			$.ajax({
				type: 'GET',
				url: '//vimeo.com/api/v2/video/' + video.id + '.json',
				jsonp: 'callback',
				dataType: 'jsonp',
				success: function (data) {
					path = data[0].thumbnail_large;
					create(path);
				}
			});
		} else if (video.type === 'vzaar') {
			$.ajax({
				type: 'GET',
				url: '//vzaar.com/api/videos/' + video.id + '.json',
				jsonp: 'callback',
				dataType: 'jsonp',
				success: function (data) {
					path = data.framegrab_url;
					create(path);
				}
			});
		}
	};

	/**
  * Stops the current video.
  * @public
  */
	Video.prototype.stop = function () {
		this._core.trigger('stop', null, 'video');
		this._playing.find('.owl-video-frame').remove();
		this._playing.removeClass('owl-video-playing');
		this._playing = null;
		this._core.leave('playing');
		this._core.trigger('stopped', null, 'video');
	};

	/**
  * Starts the current video.
  * @public
  * @param {Event} event - The event arguments.
  */
	Video.prototype.play = function (event) {
		var target = $(event.target),
		    item = target.closest('.' + this._core.settings.itemClass),
		    video = this._videos[item.attr('data-video')],
		    width = video.width || '100%',
		    height = video.height || this._core.$stage.height(),
		    html;

		if (this._playing) {
			return;
		}

		this._core.enter('playing');
		this._core.trigger('play', null, 'video');

		item = this._core.items(this._core.relative(item.index()));

		this._core.reset(item.index());

		if (video.type === 'youtube') {
			html = '<iframe width="' + width + '" height="' + height + '" src="//www.youtube.com/embed/' + video.id + '?autoplay=1&v=' + video.id + '" frameborder="0" allowfullscreen></iframe>';
		} else if (video.type === 'vimeo') {
			html = '<iframe src="//player.vimeo.com/video/' + video.id + '?autoplay=1" width="' + width + '" height="' + height + '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
		} else if (video.type === 'vzaar') {
			html = '<iframe frameborder="0"' + 'height="' + height + '"' + 'width="' + width + '" allowfullscreen mozallowfullscreen webkitAllowFullScreen ' + 'src="//view.vzaar.com/' + video.id + '/player?autoplay=true"></iframe>';
		}

		$('<div class="owl-video-frame">' + html + '</div>').insertAfter(item.find('.owl-video'));

		this._playing = item.addClass('owl-video-playing');
	};

	/**
  * Checks whether an video is currently in full screen mode or not.
  * @todo Bad style because looks like a readonly method but changes members.
  * @protected
  * @returns {Boolean}
  */
	Video.prototype.isInFullScreen = function () {
		var element = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;

		return element && $(element).parent().hasClass('owl-video-frame');
	};

	/**
  * Destroys the plugin.
  */
	Video.prototype.destroy = function () {
		var handler, property;

		this._core.$element.off('click.owl.video');

		for (handler in this._handlers) {
			this._core.$element.off(handler, this._handlers[handler]);
		}
		for (property in Object.getOwnPropertyNames(this)) {
			typeof this[property] != 'function' && (this[property] = null);
		}
	};

	$.fn.owlCarousel.Constructor.Plugins.Video = Video;
})(window.Zepto || window.jQuery, window, document);

/**
 * Animate Plugin
 * @version 2.1.0
 * @author Bartosz Wojciechowski
 * @author David Deutsch
 * @license The MIT License (MIT)
 */
;(function ($, window, document, undefined) {

	/**
  * Creates the animate plugin.
  * @class The Navigation Plugin
  * @param {Owl} scope - The Owl Carousel
  */
	var Animate = function (scope) {
		this.core = scope;
		this.core.options = $.extend({}, Animate.Defaults, this.core.options);
		this.swapping = true;
		this.previous = undefined;
		this.next = undefined;

		this.handlers = {
			'change.owl.carousel': $.proxy(function (e) {
				if (e.namespace && e.property.name == 'position') {
					this.previous = this.core.current();
					this.next = e.property.value;
				}
			}, this),
			'drag.owl.carousel dragged.owl.carousel translated.owl.carousel': $.proxy(function (e) {
				if (e.namespace) {
					this.swapping = e.type == 'translated';
				}
			}, this),
			'translate.owl.carousel': $.proxy(function (e) {
				if (e.namespace && this.swapping && (this.core.options.animateOut || this.core.options.animateIn)) {
					this.swap();
				}
			}, this)
		};

		this.core.$element.on(this.handlers);
	};

	/**
  * Default options.
  * @public
  */
	Animate.Defaults = {
		animateOut: false,
		animateIn: false
	};

	/**
  * Toggles the animation classes whenever an translations starts.
  * @protected
  * @returns {Boolean|undefined}
  */
	Animate.prototype.swap = function () {

		if (this.core.settings.items !== 1) {
			return;
		}

		if (!$.support.animation || !$.support.transition) {
			return;
		}

		this.core.speed(0);

		var left,
		    clear = $.proxy(this.clear, this),
		    previous = this.core.$stage.children().eq(this.previous),
		    next = this.core.$stage.children().eq(this.next),
		    incoming = this.core.settings.animateIn,
		    outgoing = this.core.settings.animateOut;

		if (this.core.current() === this.previous) {
			return;
		}

		if (outgoing) {
			left = this.core.coordinates(this.previous) - this.core.coordinates(this.next);
			previous.one($.support.animation.end, clear).css({ 'left': left + 'px' }).addClass('animated owl-animated-out').addClass(outgoing);
		}

		if (incoming) {
			next.one($.support.animation.end, clear).addClass('animated owl-animated-in').addClass(incoming);
		}
	};

	Animate.prototype.clear = function (e) {
		$(e.target).css({ 'left': '' }).removeClass('animated owl-animated-out owl-animated-in').removeClass(this.core.settings.animateIn).removeClass(this.core.settings.animateOut);
		this.core.onTransitionEnd();
	};

	/**
  * Destroys the plugin.
  * @public
  */
	Animate.prototype.destroy = function () {
		var handler, property;

		for (handler in this.handlers) {
			this.core.$element.off(handler, this.handlers[handler]);
		}
		for (property in Object.getOwnPropertyNames(this)) {
			typeof this[property] != 'function' && (this[property] = null);
		}
	};

	$.fn.owlCarousel.Constructor.Plugins.Animate = Animate;
})(window.Zepto || window.jQuery, window, document);

/**
 * Autoplay Plugin
 * @version 2.1.0
 * @author Bartosz Wojciechowski
 * @author Artus Kolanowski
 * @author David Deutsch
 * @license The MIT License (MIT)
 */
;(function ($, window, document, undefined) {

	/**
  * Creates the autoplay plugin.
  * @class The Autoplay Plugin
  * @param {Owl} scope - The Owl Carousel
  */
	var Autoplay = function (carousel) {
		/**
   * Reference to the core.
   * @protected
   * @type {Owl}
   */
		this._core = carousel;

		/**
   * The autoplay timeout.
   * @type {Timeout}
   */
		this._timeout = null;

		/**
   * Indicates whenever the autoplay is paused.
   * @type {Boolean}
   */
		this._paused = false;

		/**
   * All event handlers.
   * @protected
   * @type {Object}
   */
		this._handlers = {
			'changed.owl.carousel': $.proxy(function (e) {
				if (e.namespace && e.property.name === 'settings') {
					if (this._core.settings.autoplay) {
						this.play();
					} else {
						this.stop();
					}
				} else if (e.namespace && e.property.name === 'position') {
					//console.log('play?', e);
					if (this._core.settings.autoplay) {
						this._setAutoPlayInterval();
					}
				}
			}, this),
			'initialized.owl.carousel': $.proxy(function (e) {
				if (e.namespace && this._core.settings.autoplay) {
					this.play();
				}
			}, this),
			'play.owl.autoplay': $.proxy(function (e, t, s) {
				if (e.namespace) {
					this.play(t, s);
				}
			}, this),
			'stop.owl.autoplay': $.proxy(function (e) {
				if (e.namespace) {
					this.stop();
				}
			}, this),
			'mouseover.owl.autoplay': $.proxy(function () {
				if (this._core.settings.autoplayHoverPause && this._core.is('rotating')) {
					this.pause();
				}
			}, this),
			'mouseleave.owl.autoplay': $.proxy(function () {
				if (this._core.settings.autoplayHoverPause && this._core.is('rotating')) {
					this.play();
				}
			}, this),
			'touchstart.owl.core': $.proxy(function () {
				if (this._core.settings.autoplayHoverPause && this._core.is('rotating')) {
					this.pause();
				}
			}, this),
			'touchend.owl.core': $.proxy(function () {
				if (this._core.settings.autoplayHoverPause) {
					this.play();
				}
			}, this)
		};

		// register event handlers
		this._core.$element.on(this._handlers);

		// set default options
		this._core.options = $.extend({}, Autoplay.Defaults, this._core.options);
	};

	/**
  * Default options.
  * @public
  */
	Autoplay.Defaults = {
		autoplay: false,
		autoplayTimeout: 5000,
		autoplayHoverPause: false,
		autoplaySpeed: false
	};

	/**
  * Starts the autoplay.
  * @public
  * @param {Number} [timeout] - The interval before the next animation starts.
  * @param {Number} [speed] - The animation speed for the animations.
  */
	Autoplay.prototype.play = function (timeout, speed) {
		this._paused = false;

		if (this._core.is('rotating')) {
			return;
		}

		this._core.enter('rotating');

		this._setAutoPlayInterval();
	};

	/**
  * Gets a new timeout
  * @private
  * @param {Number} [timeout] - The interval before the next animation starts.
  * @param {Number} [speed] - The animation speed for the animations.
  * @return {Timeout}
  */
	Autoplay.prototype._getNextTimeout = function (timeout, speed) {
		if (this._timeout) {
			window.clearTimeout(this._timeout);
		}
		return window.setTimeout($.proxy(function () {
			if (this._paused || this._core.is('busy') || this._core.is('interacting') || document.hidden) {
				return;
			}
			this._core.next(speed || this._core.settings.autoplaySpeed);
		}, this), timeout || this._core.settings.autoplayTimeout);
	};

	/**
  * Sets autoplay in motion.
  * @private
  */
	Autoplay.prototype._setAutoPlayInterval = function () {
		this._timeout = this._getNextTimeout();
	};

	/**
  * Stops the autoplay.
  * @public
  */
	Autoplay.prototype.stop = function () {
		if (!this._core.is('rotating')) {
			return;
		}

		window.clearTimeout(this._timeout);
		this._core.leave('rotating');
	};

	/**
  * Stops the autoplay.
  * @public
  */
	Autoplay.prototype.pause = function () {
		if (!this._core.is('rotating')) {
			return;
		}

		this._paused = true;
	};

	/**
  * Destroys the plugin.
  */
	Autoplay.prototype.destroy = function () {
		var handler, property;

		this.stop();

		for (handler in this._handlers) {
			this._core.$element.off(handler, this._handlers[handler]);
		}
		for (property in Object.getOwnPropertyNames(this)) {
			typeof this[property] != 'function' && (this[property] = null);
		}
	};

	$.fn.owlCarousel.Constructor.Plugins.autoplay = Autoplay;
})(window.Zepto || window.jQuery, window, document);

/**
 * Navigation Plugin
 * @version 2.1.0
 * @author Artus Kolanowski
 * @author David Deutsch
 * @license The MIT License (MIT)
 */
;(function ($, window, document, undefined) {
	'use strict';

	/**
  * Creates the navigation plugin.
  * @class The Navigation Plugin
  * @param {Owl} carousel - The Owl Carousel.
  */

	var Navigation = function (carousel) {
		/**
   * Reference to the core.
   * @protected
   * @type {Owl}
   */
		this._core = carousel;

		/**
   * Indicates whether the plugin is initialized or not.
   * @protected
   * @type {Boolean}
   */
		this._initialized = false;

		/**
   * The current paging indexes.
   * @protected
   * @type {Array}
   */
		this._pages = [];

		/**
   * All DOM elements of the user interface.
   * @protected
   * @type {Object}
   */
		this._controls = {};

		/**
   * Markup for an indicator.
   * @protected
   * @type {Array.<String>}
   */
		this._templates = [];

		/**
   * The carousel element.
   * @type {jQuery}
   */
		this.$element = this._core.$element;

		/**
   * Overridden methods of the carousel.
   * @protected
   * @type {Object}
   */
		this._overrides = {
			next: this._core.next,
			prev: this._core.prev,
			to: this._core.to
		};

		/**
   * All event handlers.
   * @protected
   * @type {Object}
   */
		this._handlers = {
			'prepared.owl.carousel': $.proxy(function (e) {
				if (e.namespace && this._core.settings.dotsData) {
					this._templates.push('<div class="' + this._core.settings.dotClass + '">' + $(e.content).find('[data-dot]').addBack('[data-dot]').attr('data-dot') + '</div>');
				}
			}, this),
			'added.owl.carousel': $.proxy(function (e) {
				if (e.namespace && this._core.settings.dotsData) {
					this._templates.splice(e.position, 0, this._templates.pop());
				}
			}, this),
			'remove.owl.carousel': $.proxy(function (e) {
				if (e.namespace && this._core.settings.dotsData) {
					this._templates.splice(e.position, 1);
				}
			}, this),
			'changed.owl.carousel': $.proxy(function (e) {
				if (e.namespace && e.property.name == 'position') {
					this.draw();
				}
			}, this),
			'initialized.owl.carousel': $.proxy(function (e) {
				if (e.namespace && !this._initialized) {
					this._core.trigger('initialize', null, 'navigation');
					this.initialize();
					this.update();
					this.draw();
					this._initialized = true;
					this._core.trigger('initialized', null, 'navigation');
				}
			}, this),
			'refreshed.owl.carousel': $.proxy(function (e) {
				if (e.namespace && this._initialized) {
					this._core.trigger('refresh', null, 'navigation');
					this.update();
					this.draw();
					this._core.trigger('refreshed', null, 'navigation');
				}
			}, this)
		};

		// set default options
		this._core.options = $.extend({}, Navigation.Defaults, this._core.options);

		// register event handlers
		this.$element.on(this._handlers);
	};

	/**
  * Default options.
  * @public
  * @todo Rename `slideBy` to `navBy`
  */
	Navigation.Defaults = {
		nav: false,
		navText: ['prev', 'next'],
		navSpeed: false,
		navElement: 'div',
		navContainer: false,
		navContainerClass: 'owl-nav',
		navClass: ['owl-prev', 'owl-next'],
		slideBy: 1,
		dotClass: 'owl-dot',
		dotsClass: 'owl-dots',
		dots: true,
		dotsEach: false,
		dotsData: false,
		dotsSpeed: false,
		dotsContainer: false
	};

	/**
  * Initializes the layout of the plugin and extends the carousel.
  * @protected
  */
	Navigation.prototype.initialize = function () {
		var override,
		    settings = this._core.settings;

		// create DOM structure for relative navigation
		this._controls.$relative = (settings.navContainer ? $(settings.navContainer) : $('<div>').addClass(settings.navContainerClass).appendTo(this.$element)).addClass('disabled');

		this._controls.$previous = $('<' + settings.navElement + '>').addClass(settings.navClass[0]).html(settings.navText[0]).prependTo(this._controls.$relative).on('click', $.proxy(function (e) {
			this.prev(settings.navSpeed);
		}, this));
		this._controls.$next = $('<' + settings.navElement + '>').addClass(settings.navClass[1]).html(settings.navText[1]).appendTo(this._controls.$relative).on('click', $.proxy(function (e) {
			this.next(settings.navSpeed);
		}, this));

		// create DOM structure for absolute navigation
		if (!settings.dotsData) {
			this._templates = [$('<div>').addClass(settings.dotClass).append($('<span>')).prop('outerHTML')];
		}

		this._controls.$absolute = (settings.dotsContainer ? $(settings.dotsContainer) : $('<div>').addClass(settings.dotsClass).appendTo(this.$element)).addClass('disabled');

		this._controls.$absolute.on('click', 'div', $.proxy(function (e) {
			var index = $(e.target).parent().is(this._controls.$absolute) ? $(e.target).index() : $(e.target).parent().index();

			e.preventDefault();

			this.to(index, settings.dotsSpeed);
		}, this));

		// override public methods of the carousel
		for (override in this._overrides) {
			this._core[override] = $.proxy(this[override], this);
		}
	};

	/**
  * Destroys the plugin.
  * @protected
  */
	Navigation.prototype.destroy = function () {
		var handler, control, property, override;

		for (handler in this._handlers) {
			this.$element.off(handler, this._handlers[handler]);
		}
		for (control in this._controls) {
			this._controls[control].remove();
		}
		for (override in this.overides) {
			this._core[override] = this._overrides[override];
		}
		for (property in Object.getOwnPropertyNames(this)) {
			typeof this[property] != 'function' && (this[property] = null);
		}
	};

	/**
  * Updates the internal state.
  * @protected
  */
	Navigation.prototype.update = function () {
		var i,
		    j,
		    k,
		    lower = this._core.clones().length / 2,
		    upper = lower + this._core.items().length,
		    maximum = this._core.maximum(true),
		    settings = this._core.settings,
		    size = settings.center || settings.autoWidth || settings.dotsData ? 1 : settings.dotsEach || settings.items;

		if (settings.slideBy !== 'page') {
			settings.slideBy = Math.min(settings.slideBy, settings.items);
		}

		if (settings.dots || settings.slideBy == 'page') {
			this._pages = [];

			for (i = lower, j = 0, k = 0; i < upper; i++) {
				if (j >= size || j === 0) {
					this._pages.push({
						start: Math.min(maximum, i - lower),
						end: i - lower + size - 1
					});
					if (Math.min(maximum, i - lower) === maximum) {
						break;
					}
					j = 0, ++k;
				}
				j += this._core.mergers(this._core.relative(i));
			}
		}
	};

	/**
  * Draws the user interface.
  * @todo The option `dotsData` wont work.
  * @protected
  */
	Navigation.prototype.draw = function () {
		var difference,
		    settings = this._core.settings,
		    disabled = this._core.items().length <= settings.items,
		    index = this._core.relative(this._core.current()),
		    loop = settings.loop || settings.rewind;

		this._controls.$relative.toggleClass('disabled', !settings.nav || disabled);

		if (settings.nav) {
			this._controls.$previous.toggleClass('disabled', !loop && index <= this._core.minimum(true));
			this._controls.$next.toggleClass('disabled', !loop && index >= this._core.maximum(true));
		}

		this._controls.$absolute.toggleClass('disabled', !settings.dots || disabled);

		if (settings.dots) {
			difference = this._pages.length - this._controls.$absolute.children().length;

			if (settings.dotsData && difference !== 0) {
				this._controls.$absolute.html(this._templates.join(''));
			} else if (difference > 0) {
				this._controls.$absolute.append(new Array(difference + 1).join(this._templates[0]));
			} else if (difference < 0) {
				this._controls.$absolute.children().slice(difference).remove();
			}

			this._controls.$absolute.find('.active').removeClass('active');
			this._controls.$absolute.children().eq($.inArray(this.current(), this._pages)).addClass('active');
		}
	};

	/**
  * Extends event data.
  * @protected
  * @param {Event} event - The event object which gets thrown.
  */
	Navigation.prototype.onTrigger = function (event) {
		var settings = this._core.settings;

		event.page = {
			index: $.inArray(this.current(), this._pages),
			count: this._pages.length,
			size: settings && (settings.center || settings.autoWidth || settings.dotsData ? 1 : settings.dotsEach || settings.items)
		};
	};

	/**
  * Gets the current page position of the carousel.
  * @protected
  * @returns {Number}
  */
	Navigation.prototype.current = function () {
		var current = this._core.relative(this._core.current());
		return $.grep(this._pages, $.proxy(function (page, index) {
			return page.start <= current && page.end >= current;
		}, this)).pop();
	};

	/**
  * Gets the current succesor/predecessor position.
  * @protected
  * @returns {Number}
  */
	Navigation.prototype.getPosition = function (successor) {
		var position,
		    length,
		    settings = this._core.settings;

		if (settings.slideBy == 'page') {
			position = $.inArray(this.current(), this._pages);
			length = this._pages.length;
			successor ? ++position : --position;
			position = this._pages[(position % length + length) % length].start;
		} else {
			position = this._core.relative(this._core.current());
			length = this._core.items().length;
			successor ? position += settings.slideBy : position -= settings.slideBy;
		}

		return position;
	};

	/**
  * Slides to the next item or page.
  * @public
  * @param {Number} [speed=false] - The time in milliseconds for the transition.
  */
	Navigation.prototype.next = function (speed) {
		$.proxy(this._overrides.to, this._core)(this.getPosition(true), speed);
	};

	/**
  * Slides to the previous item or page.
  * @public
  * @param {Number} [speed=false] - The time in milliseconds for the transition.
  */
	Navigation.prototype.prev = function (speed) {
		$.proxy(this._overrides.to, this._core)(this.getPosition(false), speed);
	};

	/**
  * Slides to the specified item or page.
  * @public
  * @param {Number} position - The position of the item or page.
  * @param {Number} [speed] - The time in milliseconds for the transition.
  * @param {Boolean} [standard=false] - Whether to use the standard behaviour or not.
  */
	Navigation.prototype.to = function (position, speed, standard) {
		var length;

		if (!standard && this._pages.length) {
			length = this._pages.length;
			$.proxy(this._overrides.to, this._core)(this._pages[(position % length + length) % length].start, speed);
		} else {
			$.proxy(this._overrides.to, this._core)(position, speed);
		}
	};

	$.fn.owlCarousel.Constructor.Plugins.Navigation = Navigation;
})(window.Zepto || window.jQuery, window, document);

/**
 * Hash Plugin
 * @version 2.1.0
 * @author Artus Kolanowski
 * @author David Deutsch
 * @license The MIT License (MIT)
 */
;(function ($, window, document, undefined) {
	'use strict';

	/**
  * Creates the hash plugin.
  * @class The Hash Plugin
  * @param {Owl} carousel - The Owl Carousel
  */

	var Hash = function (carousel) {
		/**
   * Reference to the core.
   * @protected
   * @type {Owl}
   */
		this._core = carousel;

		/**
   * Hash index for the items.
   * @protected
   * @type {Object}
   */
		this._hashes = {};

		/**
   * The carousel element.
   * @type {jQuery}
   */
		this.$element = this._core.$element;

		/**
   * All event handlers.
   * @protected
   * @type {Object}
   */
		this._handlers = {
			'initialized.owl.carousel': $.proxy(function (e) {
				if (e.namespace && this._core.settings.startPosition === 'URLHash') {
					$(window).trigger('hashchange.owl.navigation');
				}
			}, this),
			'prepared.owl.carousel': $.proxy(function (e) {
				if (e.namespace) {
					var hash = $(e.content).find('[data-hash]').addBack('[data-hash]').attr('data-hash');

					if (!hash) {
						return;
					}

					this._hashes[hash] = e.content;
				}
			}, this),
			'changed.owl.carousel': $.proxy(function (e) {
				if (e.namespace && e.property.name === 'position') {
					var current = this._core.items(this._core.relative(this._core.current())),
					    hash = $.map(this._hashes, function (item, hash) {
						return item === current ? hash : null;
					}).join();

					if (!hash || window.location.hash.slice(1) === hash) {
						return;
					}

					window.location.hash = hash;
				}
			}, this)
		};

		// set default options
		this._core.options = $.extend({}, Hash.Defaults, this._core.options);

		// register the event handlers
		this.$element.on(this._handlers);

		// register event listener for hash navigation
		$(window).on('hashchange.owl.navigation', $.proxy(function (e) {
			var hash = window.location.hash.substring(1),
			    items = this._core.$stage.children(),
			    position = this._hashes[hash] && items.index(this._hashes[hash]);

			if (position === undefined || position === this._core.current()) {
				return;
			}

			this._core.to(this._core.relative(position), false, true);
		}, this));
	};

	/**
  * Default options.
  * @public
  */
	Hash.Defaults = {
		URLhashListener: false
	};

	/**
  * Destroys the plugin.
  * @public
  */
	Hash.prototype.destroy = function () {
		var handler, property;

		$(window).off('hashchange.owl.navigation');

		for (handler in this._handlers) {
			this._core.$element.off(handler, this._handlers[handler]);
		}
		for (property in Object.getOwnPropertyNames(this)) {
			typeof this[property] != 'function' && (this[property] = null);
		}
	};

	$.fn.owlCarousel.Constructor.Plugins.Hash = Hash;
})(window.Zepto || window.jQuery, window, document);

/**
 * Support Plugin
 *
 * @version 2.1.0
 * @author Vivid Planet Software GmbH
 * @author Artus Kolanowski
 * @author David Deutsch
 * @license The MIT License (MIT)
 */
;(function ($, window, document, undefined) {

	var style = $('<support>').get(0).style,
	    prefixes = 'Webkit Moz O ms'.split(' '),
	    events = {
		transition: {
			end: {
				WebkitTransition: 'webkitTransitionEnd',
				MozTransition: 'transitionend',
				OTransition: 'oTransitionEnd',
				transition: 'transitionend'
			}
		},
		animation: {
			end: {
				WebkitAnimation: 'webkitAnimationEnd',
				MozAnimation: 'animationend',
				OAnimation: 'oAnimationEnd',
				animation: 'animationend'
			}
		}
	},
	    tests = {
		csstransforms: function () {
			return !!test('transform');
		},
		csstransforms3d: function () {
			return !!test('perspective');
		},
		csstransitions: function () {
			return !!test('transition');
		},
		cssanimations: function () {
			return !!test('animation');
		}
	};

	function test(property, prefixed) {
		var result = false,
		    upper = property.charAt(0).toUpperCase() + property.slice(1);

		$.each((property + ' ' + prefixes.join(upper + ' ') + upper).split(' '), function (i, property) {
			if (style[property] !== undefined) {
				result = prefixed ? property : true;
				return false;
			}
		});

		return result;
	}

	function prefixed(property) {
		return test(property, true);
	}

	if (tests.csstransitions()) {
		/* jshint -W053 */
		$.support.transition = new String(prefixed('transition'));
		$.support.transition.end = events.transition.end[$.support.transition];
	}

	if (tests.cssanimations()) {
		/* jshint -W053 */
		$.support.animation = new String(prefixed('animation'));
		$.support.animation.end = events.animation.end[$.support.animation];
	}

	if (tests.csstransforms()) {
		/* jshint -W053 */
		$.support.transform = new String(prefixed('transform'));
		$.support.transform3d = tests.csstransforms3d();
	}
})(window.Zepto || window.jQuery, window, document);
/**
 * Owl Carousel v2.2.0
 * Copyright 2013-2016 David Deutsch
 * Licensed under MIT (https://github.com/OwlCarousel2/OwlCarousel2/blob/master/LICENSE)
 */
!function (a, b, c, d) {
  function e(b, c) {
    this.settings = null, this.options = a.extend({}, e.Defaults, c), this.$element = a(b), this._handlers = {}, this._plugins = {}, this._supress = {}, this._current = null, this._speed = null, this._coordinates = [], this._breakpoint = null, this._width = null, this._items = [], this._clones = [], this._mergers = [], this._widths = [], this._invalidated = {}, this._pipe = [], this._drag = { time: null, target: null, pointer: null, stage: { start: null, current: null }, direction: null }, this._states = { current: {}, tags: { initializing: ["busy"], animating: ["busy"], dragging: ["interacting"] } }, a.each(["onResize", "onThrottledResize"], a.proxy(function (b, c) {
      this._handlers[c] = a.proxy(this[c], this);
    }, this)), a.each(e.Plugins, a.proxy(function (a, b) {
      this._plugins[a.charAt(0).toLowerCase() + a.slice(1)] = new b(this);
    }, this)), a.each(e.Workers, a.proxy(function (b, c) {
      this._pipe.push({ filter: c.filter, run: a.proxy(c.run, this) });
    }, this)), this.setup(), this.initialize();
  }e.Defaults = { items: 3, loop: !1, center: !1, rewind: !1, mouseDrag: !0, touchDrag: !0, pullDrag: !0, freeDrag: !1, margin: 0, stagePadding: 0, merge: !1, mergeFit: !0, autoWidth: !1, startPosition: 0, rtl: !1, smartSpeed: 250, fluidSpeed: !1, dragEndSpeed: !1, responsive: {}, responsiveRefreshRate: 200, responsiveBaseElement: b, fallbackEasing: "swing", info: !1, nestedItemSelector: !1, itemElement: "div", stageElement: "div", refreshClass: "owl-refresh", loadedClass: "owl-loaded", loadingClass: "owl-loading", rtlClass: "owl-rtl", responsiveClass: "owl-responsive", dragClass: "owl-drag", itemClass: "owl-item", stageClass: "owl-stage", stageOuterClass: "owl-stage-outer", grabClass: "owl-grab" }, e.Width = { Default: "default", Inner: "inner", Outer: "outer" }, e.Type = { Event: "event", State: "state" }, e.Plugins = {}, e.Workers = [{ filter: ["width", "settings"], run: function () {
      this._width = this.$element.width();
    } }, { filter: ["width", "items", "settings"], run: function (a) {
      a.current = this._items && this._items[this.relative(this._current)];
    } }, { filter: ["items", "settings"], run: function () {
      this.$stage.children(".cloned").remove();
    } }, { filter: ["width", "items", "settings"], run: function (a) {
      var b = this.settings.margin || "",
          c = !this.settings.autoWidth,
          d = this.settings.rtl,
          e = { width: "auto", "margin-left": d ? b : "", "margin-right": d ? "" : b };!c && this.$stage.children().css(e), a.css = e;
    } }, { filter: ["width", "items", "settings"], run: function (a) {
      var b = (this.width() / this.settings.items).toFixed(3) - this.settings.margin,
          c = null,
          d = this._items.length,
          e = !this.settings.autoWidth,
          f = [];for (a.items = { merge: !1, width: b }; d--;) c = this._mergers[d], c = this.settings.mergeFit && Math.min(c, this.settings.items) || c, a.items.merge = c > 1 || a.items.merge, f[d] = e ? b * c : this._items[d].width();this._widths = f;
    } }, { filter: ["items", "settings"], run: function () {
      var b = [],
          c = this._items,
          d = this.settings,
          e = Math.max(2 * d.items, 4),
          f = 2 * Math.ceil(c.length / 2),
          g = d.loop && c.length ? d.rewind ? e : Math.max(e, f) : 0,
          h = "",
          i = "";for (g /= 2; g--;) b.push(this.normalize(b.length / 2, !0)), h += c[b[b.length - 1]][0].outerHTML, b.push(this.normalize(c.length - 1 - (b.length - 1) / 2, !0)), i = c[b[b.length - 1]][0].outerHTML + i;this._clones = b, a(h).addClass("cloned").appendTo(this.$stage), a(i).addClass("cloned").prependTo(this.$stage);
    } }, { filter: ["width", "items", "settings"], run: function () {
      for (var a = this.settings.rtl ? 1 : -1, b = this._clones.length + this._items.length, c = -1, d = 0, e = 0, f = []; ++c < b;) d = f[c - 1] || 0, e = this._widths[this.relative(c)] + this.settings.margin, f.push(d + e * a);this._coordinates = f;
    } }, { filter: ["width", "items", "settings"], run: function () {
      var a = this.settings.stagePadding,
          b = this._coordinates,
          c = { width: Math.ceil(Math.abs(b[b.length - 1])) + 2 * a, "padding-left": a || "", "padding-right": a || "" };this.$stage.css(c);
    } }, { filter: ["width", "items", "settings"], run: function (a) {
      var b = this._coordinates.length,
          c = !this.settings.autoWidth,
          d = this.$stage.children();if (c && a.items.merge) for (; b--;) a.css.width = this._widths[this.relative(b)], d.eq(b).css(a.css);else c && (a.css.width = a.items.width, d.css(a.css));
    } }, { filter: ["items"], run: function () {
      this._coordinates.length < 1 && this.$stage.removeAttr("style");
    } }, { filter: ["width", "items", "settings"], run: function (a) {
      a.current = a.current ? this.$stage.children().index(a.current) : 0, a.current = Math.max(this.minimum(), Math.min(this.maximum(), a.current)), this.reset(a.current);
    } }, { filter: ["position"], run: function () {
      this.animate(this.coordinates(this._current));
    } }, { filter: ["width", "position", "items", "settings"], run: function () {
      var a,
          b,
          c,
          d,
          e = this.settings.rtl ? 1 : -1,
          f = 2 * this.settings.stagePadding,
          g = this.coordinates(this.current()) + f,
          h = g + this.width() * e,
          i = [];for (c = 0, d = this._coordinates.length; d > c; c++) a = this._coordinates[c - 1] || 0, b = Math.abs(this._coordinates[c]) + f * e, (this.op(a, "<=", g) && this.op(a, ">", h) || this.op(b, "<", g) && this.op(b, ">", h)) && i.push(c);this.$stage.children(".active").removeClass("active"), this.$stage.children(":eq(" + i.join("), :eq(") + ")").addClass("active"), this.settings.center && (this.$stage.children(".center").removeClass("center"), this.$stage.children().eq(this.current()).addClass("center"));
    } }], e.prototype.initialize = function () {
    if (this.enter("initializing"), this.trigger("initialize"), this.$element.toggleClass(this.settings.rtlClass, this.settings.rtl), this.settings.autoWidth && !this.is("pre-loading")) {
      var b, c, e;b = this.$element.find("img"), c = this.settings.nestedItemSelector ? "." + this.settings.nestedItemSelector : d, e = this.$element.children(c).width(), b.length && 0 >= e && this.preloadAutoWidthImages(b);
    }this.$element.addClass(this.options.loadingClass), this.$stage = a("<" + this.settings.stageElement + ' class="' + this.settings.stageClass + '"/>').wrap('<div class="' + this.settings.stageOuterClass + '"/>'), this.$element.append(this.$stage.parent()), this.replace(this.$element.children().not(this.$stage.parent())), this.$element.is(":visible") ? this.refresh() : this.invalidate("width"), this.$element.removeClass(this.options.loadingClass).addClass(this.options.loadedClass), this.registerEventHandlers(), this.leave("initializing"), this.trigger("initialized");
  }, e.prototype.setup = function () {
    var b = this.viewport(),
        c = this.options.responsive,
        d = -1,
        e = null;c ? (a.each(c, function (a) {
      b >= a && a > d && (d = Number(a));
    }), e = a.extend({}, this.options, c[d]), "function" == typeof e.stagePadding && (e.stagePadding = e.stagePadding()), delete e.responsive, e.responsiveClass && this.$element.attr("class", this.$element.attr("class").replace(new RegExp("(" + this.options.responsiveClass + "-)\\S+\\s", "g"), "$1" + d))) : e = a.extend({}, this.options), this.trigger("change", { property: { name: "settings", value: e } }), this._breakpoint = d, this.settings = e, this.invalidate("settings"), this.trigger("changed", { property: { name: "settings", value: this.settings } });
  }, e.prototype.optionsLogic = function () {
    this.settings.autoWidth && (this.settings.stagePadding = !1, this.settings.merge = !1);
  }, e.prototype.prepare = function (b) {
    var c = this.trigger("prepare", { content: b });return c.data || (c.data = a("<" + this.settings.itemElement + "/>").addClass(this.options.itemClass).append(b)), this.trigger("prepared", { content: c.data }), c.data;
  }, e.prototype.update = function () {
    for (var b = 0, c = this._pipe.length, d = a.proxy(function (a) {
      return this[a];
    }, this._invalidated), e = {}; c > b;) (this._invalidated.all || a.grep(this._pipe[b].filter, d).length > 0) && this._pipe[b].run(e), b++;this._invalidated = {}, !this.is("valid") && this.enter("valid");
  }, e.prototype.width = function (a) {
    switch (a = a || e.Width.Default) {case e.Width.Inner:case e.Width.Outer:
        return this._width;default:
        return this._width - 2 * this.settings.stagePadding + this.settings.margin;}
  }, e.prototype.refresh = function () {
    this.enter("refreshing"), this.trigger("refresh"), this.setup(), this.optionsLogic(), this.$element.addClass(this.options.refreshClass), this.update(), this.$element.removeClass(this.options.refreshClass), this.leave("refreshing"), this.trigger("refreshed");
  }, e.prototype.onThrottledResize = function () {
    b.clearTimeout(this.resizeTimer), this.resizeTimer = b.setTimeout(this._handlers.onResize, this.settings.responsiveRefreshRate);
  }, e.prototype.onResize = function () {
    return this._items.length ? this._width === this.$element.width() ? !1 : this.$element.is(":visible") ? (this.enter("resizing"), this.trigger("resize").isDefaultPrevented() ? (this.leave("resizing"), !1) : (this.invalidate("width"), this.refresh(), this.leave("resizing"), void this.trigger("resized"))) : !1 : !1;
  }, e.prototype.registerEventHandlers = function () {
    a.support.transition && this.$stage.on(a.support.transition.end + ".owl.core", a.proxy(this.onTransitionEnd, this)), this.settings.responsive !== !1 && this.on(b, "resize", this._handlers.onThrottledResize), this.settings.mouseDrag && (this.$element.addClass(this.options.dragClass), this.$stage.on("mousedown.owl.core", a.proxy(this.onDragStart, this)), this.$stage.on("dragstart.owl.core selectstart.owl.core", function () {
      return !1;
    })), this.settings.touchDrag && (this.$stage.on("touchstart.owl.core", a.proxy(this.onDragStart, this)), this.$stage.on("touchcancel.owl.core", a.proxy(this.onDragEnd, this)));
  }, e.prototype.onDragStart = function (b) {
    var d = null;3 !== b.which && (a.support.transform ? (d = this.$stage.css("transform").replace(/.*\(|\)| /g, "").split(","), d = { x: d[16 === d.length ? 12 : 4], y: d[16 === d.length ? 13 : 5] }) : (d = this.$stage.position(), d = { x: this.settings.rtl ? d.left + this.$stage.width() - this.width() + this.settings.margin : d.left, y: d.top }), this.is("animating") && (a.support.transform ? this.animate(d.x) : this.$stage.stop(), this.invalidate("position")), this.$element.toggleClass(this.options.grabClass, "mousedown" === b.type), this.speed(0), this._drag.time = new Date().getTime(), this._drag.target = a(b.target), this._drag.stage.start = d, this._drag.stage.current = d, this._drag.pointer = this.pointer(b), a(c).on("mouseup.owl.core touchend.owl.core", a.proxy(this.onDragEnd, this)), a(c).one("mousemove.owl.core touchmove.owl.core", a.proxy(function (b) {
      var d = this.difference(this._drag.pointer, this.pointer(b));a(c).on("mousemove.owl.core touchmove.owl.core", a.proxy(this.onDragMove, this)), Math.abs(d.x) < Math.abs(d.y) && this.is("valid") || (b.preventDefault(), this.enter("dragging"), this.trigger("drag"));
    }, this)));
  }, e.prototype.onDragMove = function (a) {
    var b = null,
        c = null,
        d = null,
        e = this.difference(this._drag.pointer, this.pointer(a)),
        f = this.difference(this._drag.stage.start, e);this.is("dragging") && (a.preventDefault(), this.settings.loop ? (b = this.coordinates(this.minimum()), c = this.coordinates(this.maximum() + 1) - b, f.x = ((f.x - b) % c + c) % c + b) : (b = this.settings.rtl ? this.coordinates(this.maximum()) : this.coordinates(this.minimum()), c = this.settings.rtl ? this.coordinates(this.minimum()) : this.coordinates(this.maximum()), d = this.settings.pullDrag ? -1 * e.x / 5 : 0, f.x = Math.max(Math.min(f.x, b + d), c + d)), this._drag.stage.current = f, this.animate(f.x));
  }, e.prototype.onDragEnd = function (b) {
    var d = this.difference(this._drag.pointer, this.pointer(b)),
        e = this._drag.stage.current,
        f = d.x > 0 ^ this.settings.rtl ? "left" : "right";a(c).off(".owl.core"), this.$element.removeClass(this.options.grabClass), (0 !== d.x && this.is("dragging") || !this.is("valid")) && (this.speed(this.settings.dragEndSpeed || this.settings.smartSpeed), this.current(this.closest(e.x, 0 !== d.x ? f : this._drag.direction)), this.invalidate("position"), this.update(), this._drag.direction = f, (Math.abs(d.x) > 3 || new Date().getTime() - this._drag.time > 300) && this._drag.target.one("click.owl.core", function () {
      return !1;
    })), this.is("dragging") && (this.leave("dragging"), this.trigger("dragged"));
  }, e.prototype.closest = function (b, c) {
    var d = -1,
        e = 30,
        f = this.width(),
        g = this.coordinates();return this.settings.freeDrag || a.each(g, a.proxy(function (a, h) {
      return "left" === c && b > h - e && h + e > b ? d = a : "right" === c && b > h - f - e && h - f + e > b ? d = a + 1 : this.op(b, "<", h) && this.op(b, ">", g[a + 1] || h - f) && (d = "left" === c ? a + 1 : a), -1 === d;
    }, this)), this.settings.loop || (this.op(b, ">", g[this.minimum()]) ? d = b = this.minimum() : this.op(b, "<", g[this.maximum()]) && (d = b = this.maximum())), d;
  }, e.prototype.animate = function (b) {
    var c = this.speed() > 0;this.is("animating") && this.onTransitionEnd(), c && (this.enter("animating"), this.trigger("translate")), a.support.transform3d && a.support.transition ? this.$stage.css({ transform: "translate3d(" + b + "px,0px,0px)", transition: this.speed() / 1e3 + "s" }) : c ? this.$stage.animate({ left: b + "px" }, this.speed(), this.settings.fallbackEasing, a.proxy(this.onTransitionEnd, this)) : this.$stage.css({ left: b + "px" });
  }, e.prototype.is = function (a) {
    return this._states.current[a] && this._states.current[a] > 0;
  }, e.prototype.current = function (a) {
    if (a === d) return this._current;if (0 === this._items.length) return d;if (a = this.normalize(a), this._current !== a) {
      var b = this.trigger("change", { property: { name: "position", value: a } });b.data !== d && (a = this.normalize(b.data)), this._current = a, this.invalidate("position"), this.trigger("changed", { property: { name: "position", value: this._current } });
    }return this._current;
  }, e.prototype.invalidate = function (b) {
    return "string" === a.type(b) && (this._invalidated[b] = !0, this.is("valid") && this.leave("valid")), a.map(this._invalidated, function (a, b) {
      return b;
    });
  }, e.prototype.reset = function (a) {
    a = this.normalize(a), a !== d && (this._speed = 0, this._current = a, this.suppress(["translate", "translated"]), this.animate(this.coordinates(a)), this.release(["translate", "translated"]));
  }, e.prototype.normalize = function (a, b) {
    var c = this._items.length,
        e = b ? 0 : this._clones.length;return !this.isNumeric(a) || 1 > c ? a = d : (0 > a || a >= c + e) && (a = ((a - e / 2) % c + c) % c + e / 2), a;
  }, e.prototype.relative = function (a) {
    return a -= this._clones.length / 2, this.normalize(a, !0);
  }, e.prototype.maximum = function (a) {
    var b,
        c,
        d,
        e = this.settings,
        f = this._coordinates.length;if (e.loop) f = this._clones.length / 2 + this._items.length - 1;else if (e.autoWidth || e.merge) {
      for (b = this._items.length, c = this._items[--b].width(), d = this.$element.width(); b-- && (c += this._items[b].width() + this.settings.margin, !(c > d)););f = b + 1;
    } else f = e.center ? this._items.length - 1 : this._items.length - e.items;return a && (f -= this._clones.length / 2), Math.max(f, 0);
  }, e.prototype.minimum = function (a) {
    return a ? 0 : this._clones.length / 2;
  }, e.prototype.items = function (a) {
    return a === d ? this._items.slice() : (a = this.normalize(a, !0), this._items[a]);
  }, e.prototype.mergers = function (a) {
    return a === d ? this._mergers.slice() : (a = this.normalize(a, !0), this._mergers[a]);
  }, e.prototype.clones = function (b) {
    var c = this._clones.length / 2,
        e = c + this._items.length,
        f = function (a) {
      return a % 2 === 0 ? e + a / 2 : c - (a + 1) / 2;
    };return b === d ? a.map(this._clones, function (a, b) {
      return f(b);
    }) : a.map(this._clones, function (a, c) {
      return a === b ? f(c) : null;
    });
  }, e.prototype.speed = function (a) {
    return a !== d && (this._speed = a), this._speed;
  }, e.prototype.coordinates = function (b) {
    var c,
        e = 1,
        f = b - 1;return b === d ? a.map(this._coordinates, a.proxy(function (a, b) {
      return this.coordinates(b);
    }, this)) : (this.settings.center ? (this.settings.rtl && (e = -1, f = b + 1), c = this._coordinates[b], c += (this.width() - c + (this._coordinates[f] || 0)) / 2 * e) : c = this._coordinates[f] || 0, c = Math.ceil(c));
  }, e.prototype.duration = function (a, b, c) {
    return 0 === c ? 0 : Math.min(Math.max(Math.abs(b - a), 1), 6) * Math.abs(c || this.settings.smartSpeed);
  }, e.prototype.to = function (a, b) {
    var c = this.current(),
        d = null,
        e = a - this.relative(c),
        f = (e > 0) - (0 > e),
        g = this._items.length,
        h = this.minimum(),
        i = this.maximum();this.settings.loop ? (!this.settings.rewind && Math.abs(e) > g / 2 && (e += -1 * f * g), a = c + e, d = ((a - h) % g + g) % g + h, d !== a && i >= d - e && d - e > 0 && (c = d - e, a = d, this.reset(c))) : this.settings.rewind ? (i += 1, a = (a % i + i) % i) : a = Math.max(h, Math.min(i, a)), this.speed(this.duration(c, a, b)), this.current(a), this.$element.is(":visible") && this.update();
  }, e.prototype.next = function (a) {
    a = a || !1, this.to(this.relative(this.current()) + 1, a);
  }, e.prototype.prev = function (a) {
    a = a || !1, this.to(this.relative(this.current()) - 1, a);
  }, e.prototype.onTransitionEnd = function (a) {
    return a !== d && (a.stopPropagation(), (a.target || a.srcElement || a.originalTarget) !== this.$stage.get(0)) ? !1 : (this.leave("animating"), void this.trigger("translated"));
  }, e.prototype.viewport = function () {
    var d;if (this.options.responsiveBaseElement !== b) d = a(this.options.responsiveBaseElement).width();else if (b.innerWidth) d = b.innerWidth;else {
      if (!c.documentElement || !c.documentElement.clientWidth) throw "Can not detect viewport width.";d = c.documentElement.clientWidth;
    }return d;
  }, e.prototype.replace = function (b) {
    this.$stage.empty(), this._items = [], b && (b = b instanceof jQuery ? b : a(b)), this.settings.nestedItemSelector && (b = b.find("." + this.settings.nestedItemSelector)), b.filter(function () {
      return 1 === this.nodeType;
    }).each(a.proxy(function (a, b) {
      b = this.prepare(b), this.$stage.append(b), this._items.push(b), this._mergers.push(1 * b.find("[data-merge]").addBack("[data-merge]").attr("data-merge") || 1);
    }, this)), this.reset(this.isNumeric(this.settings.startPosition) ? this.settings.startPosition : 0), this.invalidate("items");
  }, e.prototype.add = function (b, c) {
    var e = this.relative(this._current);c = c === d ? this._items.length : this.normalize(c, !0), b = b instanceof jQuery ? b : a(b), this.trigger("add", { content: b, position: c }), b = this.prepare(b), 0 === this._items.length || c === this._items.length ? (0 === this._items.length && this.$stage.append(b), 0 !== this._items.length && this._items[c - 1].after(b), this._items.push(b), this._mergers.push(1 * b.find("[data-merge]").addBack("[data-merge]").attr("data-merge") || 1)) : (this._items[c].before(b), this._items.splice(c, 0, b), this._mergers.splice(c, 0, 1 * b.find("[data-merge]").addBack("[data-merge]").attr("data-merge") || 1)), this._items[e] && this.reset(this._items[e].index()), this.invalidate("items"), this.trigger("added", { content: b, position: c });
  }, e.prototype.remove = function (a) {
    a = this.normalize(a, !0), a !== d && (this.trigger("remove", { content: this._items[a], position: a }), this._items[a].remove(), this._items.splice(a, 1), this._mergers.splice(a, 1), this.invalidate("items"), this.trigger("removed", { content: null, position: a }));
  }, e.prototype.preloadAutoWidthImages = function (b) {
    b.each(a.proxy(function (b, c) {
      this.enter("pre-loading"), c = a(c), a(new Image()).one("load", a.proxy(function (a) {
        c.attr("src", a.target.src), c.css("opacity", 1), this.leave("pre-loading"), !this.is("pre-loading") && !this.is("initializing") && this.refresh();
      }, this)).attr("src", c.attr("src") || c.attr("data-src") || c.attr("data-src-retina"));
    }, this));
  }, e.prototype.destroy = function () {
    this.$element.off(".owl.core"), this.$stage.off(".owl.core"), a(c).off(".owl.core"), this.settings.responsive !== !1 && (b.clearTimeout(this.resizeTimer), this.off(b, "resize", this._handlers.onThrottledResize));for (var d in this._plugins) this._plugins[d].destroy();this.$stage.children(".cloned").remove(), this.$stage.unwrap(), this.$stage.children().contents().unwrap(), this.$stage.children().unwrap(), this.$element.removeClass(this.options.refreshClass).removeClass(this.options.loadingClass).removeClass(this.options.loadedClass).removeClass(this.options.rtlClass).removeClass(this.options.dragClass).removeClass(this.options.grabClass).attr("class", this.$element.attr("class").replace(new RegExp(this.options.responsiveClass + "-\\S+\\s", "g"), "")).removeData("owl.carousel");
  }, e.prototype.op = function (a, b, c) {
    var d = this.settings.rtl;switch (b) {case "<":
        return d ? a > c : c > a;case ">":
        return d ? c > a : a > c;case ">=":
        return d ? c >= a : a >= c;case "<=":
        return d ? a >= c : c >= a;}
  }, e.prototype.on = function (a, b, c, d) {
    a.addEventListener ? a.addEventListener(b, c, d) : a.attachEvent && a.attachEvent("on" + b, c);
  }, e.prototype.off = function (a, b, c, d) {
    a.removeEventListener ? a.removeEventListener(b, c, d) : a.detachEvent && a.detachEvent("on" + b, c);
  }, e.prototype.trigger = function (b, c, d, f, g) {
    var h = { item: { count: this._items.length, index: this.current() } },
        i = a.camelCase(a.grep(["on", b, d], function (a) {
      return a;
    }).join("-").toLowerCase()),
        j = a.Event([b, "owl", d || "carousel"].join(".").toLowerCase(), a.extend({ relatedTarget: this }, h, c));return this._supress[b] || (a.each(this._plugins, function (a, b) {
      b.onTrigger && b.onTrigger(j);
    }), this.register({ type: e.Type.Event, name: b }), this.$element.trigger(j), this.settings && "function" == typeof this.settings[i] && this.settings[i].call(this, j)), j;
  }, e.prototype.enter = function (b) {
    a.each([b].concat(this._states.tags[b] || []), a.proxy(function (a, b) {
      this._states.current[b] === d && (this._states.current[b] = 0), this._states.current[b]++;
    }, this));
  }, e.prototype.leave = function (b) {
    a.each([b].concat(this._states.tags[b] || []), a.proxy(function (a, b) {
      this._states.current[b]--;
    }, this));
  }, e.prototype.register = function (b) {
    if (b.type === e.Type.Event) {
      if (a.event.special[b.name] || (a.event.special[b.name] = {}), !a.event.special[b.name].owl) {
        var c = a.event.special[b.name]._default;a.event.special[b.name]._default = function (a) {
          return !c || !c.apply || a.namespace && -1 !== a.namespace.indexOf("owl") ? a.namespace && a.namespace.indexOf("owl") > -1 : c.apply(this, arguments);
        }, a.event.special[b.name].owl = !0;
      }
    } else b.type === e.Type.State && (this._states.tags[b.name] ? this._states.tags[b.name] = this._states.tags[b.name].concat(b.tags) : this._states.tags[b.name] = b.tags, this._states.tags[b.name] = a.grep(this._states.tags[b.name], a.proxy(function (c, d) {
      return a.inArray(c, this._states.tags[b.name]) === d;
    }, this)));
  }, e.prototype.suppress = function (b) {
    a.each(b, a.proxy(function (a, b) {
      this._supress[b] = !0;
    }, this));
  }, e.prototype.release = function (b) {
    a.each(b, a.proxy(function (a, b) {
      delete this._supress[b];
    }, this));
  }, e.prototype.pointer = function (a) {
    var c = { x: null, y: null };return a = a.originalEvent || a || b.event, a = a.touches && a.touches.length ? a.touches[0] : a.changedTouches && a.changedTouches.length ? a.changedTouches[0] : a, a.pageX ? (c.x = a.pageX, c.y = a.pageY) : (c.x = a.clientX, c.y = a.clientY), c;
  }, e.prototype.isNumeric = function (a) {
    return !isNaN(parseFloat(a));
  }, e.prototype.difference = function (a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
  }, a.fn.owlCarousel = function (b) {
    var c = Array.prototype.slice.call(arguments, 1);return this.each(function () {
      var d = a(this),
          f = d.data("owl.carousel");f || (f = new e(this, "object" == typeof b && b), d.data("owl.carousel", f), a.each(["next", "prev", "to", "destroy", "refresh", "replace", "add", "remove"], function (b, c) {
        f.register({ type: e.Type.Event, name: c }), f.$element.on(c + ".owl.carousel.core", a.proxy(function (a) {
          a.namespace && a.relatedTarget !== this && (this.suppress([c]), f[c].apply(this, [].slice.call(arguments, 1)), this.release([c]));
        }, f));
      })), "string" == typeof b && "_" !== b.charAt(0) && f[b].apply(f, c);
    });
  }, a.fn.owlCarousel.Constructor = e;
}(window.Zepto || window.jQuery, window, document), function (a, b, c, d) {
  var e = function (b) {
    this._core = b, this._interval = null, this._visible = null, this._handlers = { "initialized.owl.carousel": a.proxy(function (a) {
        a.namespace && this._core.settings.autoRefresh && this.watch();
      }, this) }, this._core.options = a.extend({}, e.Defaults, this._core.options), this._core.$element.on(this._handlers);
  };e.Defaults = { autoRefresh: !0, autoRefreshInterval: 500 }, e.prototype.watch = function () {
    this._interval || (this._visible = this._core.$element.is(":visible"), this._interval = b.setInterval(a.proxy(this.refresh, this), this._core.settings.autoRefreshInterval));
  }, e.prototype.refresh = function () {
    this._core.$element.is(":visible") !== this._visible && (this._visible = !this._visible, this._core.$element.toggleClass("owl-hidden", !this._visible), this._visible && this._core.invalidate("width") && this._core.refresh());
  }, e.prototype.destroy = function () {
    var a, c;b.clearInterval(this._interval);for (a in this._handlers) this._core.$element.off(a, this._handlers[a]);for (c in Object.getOwnPropertyNames(this)) "function" != typeof this[c] && (this[c] = null);
  }, a.fn.owlCarousel.Constructor.Plugins.AutoRefresh = e;
}(window.Zepto || window.jQuery, window, document), function (a, b, c, d) {
  var e = function (b) {
    this._core = b, this._loaded = [], this._handlers = { "initialized.owl.carousel change.owl.carousel resized.owl.carousel": a.proxy(function (b) {
        if (b.namespace && this._core.settings && this._core.settings.lazyLoad && (b.property && "position" == b.property.name || "initialized" == b.type)) for (var c = this._core.settings, e = c.center && Math.ceil(c.items / 2) || c.items, f = c.center && -1 * e || 0, g = (b.property && b.property.value !== d ? b.property.value : this._core.current()) + f, h = this._core.clones().length, i = a.proxy(function (a, b) {
          this.load(b);
        }, this); f++ < e;) this.load(h / 2 + this._core.relative(g)), h && a.each(this._core.clones(this._core.relative(g)), i), g++;
      }, this) }, this._core.options = a.extend({}, e.Defaults, this._core.options), this._core.$element.on(this._handlers);
  };e.Defaults = { lazyLoad: !1 }, e.prototype.load = function (c) {
    var d = this._core.$stage.children().eq(c),
        e = d && d.find(".owl-lazy");!e || a.inArray(d.get(0), this._loaded) > -1 || (e.each(a.proxy(function (c, d) {
      var e,
          f = a(d),
          g = b.devicePixelRatio > 1 && f.attr("data-src-retina") || f.attr("data-src");this._core.trigger("load", { element: f, url: g }, "lazy"), f.is("img") ? f.one("load.owl.lazy", a.proxy(function () {
        f.css("opacity", 1), this._core.trigger("loaded", { element: f, url: g }, "lazy");
      }, this)).attr("src", g) : (e = new Image(), e.onload = a.proxy(function () {
        f.css({ "background-image": "url(" + g + ")", opacity: "1" }), this._core.trigger("loaded", { element: f, url: g }, "lazy");
      }, this), e.src = g);
    }, this)), this._loaded.push(d.get(0)));
  }, e.prototype.destroy = function () {
    var a, b;for (a in this.handlers) this._core.$element.off(a, this.handlers[a]);for (b in Object.getOwnPropertyNames(this)) "function" != typeof this[b] && (this[b] = null);
  }, a.fn.owlCarousel.Constructor.Plugins.Lazy = e;
}(window.Zepto || window.jQuery, window, document), function (a, b, c, d) {
  var e = function (b) {
    this._core = b, this._handlers = { "initialized.owl.carousel refreshed.owl.carousel": a.proxy(function (a) {
        a.namespace && this._core.settings.autoHeight && this.update();
      }, this), "changed.owl.carousel": a.proxy(function (a) {
        a.namespace && this._core.settings.autoHeight && "position" == a.property.name && this.update();
      }, this), "loaded.owl.lazy": a.proxy(function (a) {
        a.namespace && this._core.settings.autoHeight && a.element.closest("." + this._core.settings.itemClass).index() === this._core.current() && this.update();
      }, this) }, this._core.options = a.extend({}, e.Defaults, this._core.options), this._core.$element.on(this._handlers);
  };e.Defaults = { autoHeight: !1, autoHeightClass: "owl-height" }, e.prototype.update = function () {
    var b = this._core._current,
        c = b + this._core.settings.items,
        d = this._core.$stage.children().toArray().slice(b, c),
        e = [],
        f = 0;a.each(d, function (b, c) {
      e.push(a(c).height());
    }), f = Math.max.apply(null, e), this._core.$stage.parent().height(f).addClass(this._core.settings.autoHeightClass);
  }, e.prototype.destroy = function () {
    var a, b;for (a in this._handlers) this._core.$element.off(a, this._handlers[a]);for (b in Object.getOwnPropertyNames(this)) "function" != typeof this[b] && (this[b] = null);
  }, a.fn.owlCarousel.Constructor.Plugins.AutoHeight = e;
}(window.Zepto || window.jQuery, window, document), function (a, b, c, d) {
  var e = function (b) {
    this._core = b, this._videos = {}, this._playing = null, this._handlers = { "initialized.owl.carousel": a.proxy(function (a) {
        a.namespace && this._core.register({ type: "state", name: "playing", tags: ["interacting"] });
      }, this), "resize.owl.carousel": a.proxy(function (a) {
        a.namespace && this._core.settings.video && this.isInFullScreen() && a.preventDefault();
      }, this), "refreshed.owl.carousel": a.proxy(function (a) {
        a.namespace && this._core.is("resizing") && this._core.$stage.find(".cloned .owl-video-frame").remove();
      }, this), "changed.owl.carousel": a.proxy(function (a) {
        a.namespace && "position" === a.property.name && this._playing && this.stop();
      }, this), "prepared.owl.carousel": a.proxy(function (b) {
        if (b.namespace) {
          var c = a(b.content).find(".owl-video");c.length && (c.css("display", "none"), this.fetch(c, a(b.content)));
        }
      }, this) }, this._core.options = a.extend({}, e.Defaults, this._core.options), this._core.$element.on(this._handlers), this._core.$element.on("click.owl.video", ".owl-video-play-icon", a.proxy(function (a) {
      this.play(a);
    }, this));
  };e.Defaults = { video: !1, videoHeight: !1, videoWidth: !1 }, e.prototype.fetch = function (a, b) {
    var c = function () {
      return a.attr("data-vimeo-id") ? "vimeo" : a.attr("data-vzaar-id") ? "vzaar" : "youtube";
    }(),
        d = a.attr("data-vimeo-id") || a.attr("data-youtube-id") || a.attr("data-vzaar-id"),
        e = a.attr("data-width") || this._core.settings.videoWidth,
        f = a.attr("data-height") || this._core.settings.videoHeight,
        g = a.attr("href");if (!g) throw new Error("Missing video URL.");if (d = g.match(/(http:|https:|)\/\/(player.|www.|app.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com)|vzaar\.com)\/(video\/|videos\/|embed\/|channels\/.+\/|groups\/.+\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(\&\S+)?/), d[3].indexOf("youtu") > -1) c = "youtube";else if (d[3].indexOf("vimeo") > -1) c = "vimeo";else {
      if (!(d[3].indexOf("vzaar") > -1)) throw new Error("Video URL not supported.");c = "vzaar";
    }d = d[6], this._videos[g] = { type: c, id: d, width: e, height: f }, b.attr("data-video", g), this.thumbnail(a, this._videos[g]);
  }, e.prototype.thumbnail = function (b, c) {
    var d,
        e,
        f,
        g = c.width && c.height ? 'style="width:' + c.width + "px;height:" + c.height + 'px;"' : "",
        h = b.find("img"),
        i = "src",
        j = "",
        k = this._core.settings,
        l = function (a) {
      e = '<div class="owl-video-play-icon"></div>', d = k.lazyLoad ? '<div class="owl-video-tn ' + j + '" ' + i + '="' + a + '"></div>' : '<div class="owl-video-tn" style="opacity:1;background-image:url(' + a + ')"></div>', b.after(d), b.after(e);
    };return b.wrap('<div class="owl-video-wrapper"' + g + "></div>"), this._core.settings.lazyLoad && (i = "data-src", j = "owl-lazy"), h.length ? (l(h.attr(i)), h.remove(), !1) : void ("youtube" === c.type ? (f = "//img.youtube.com/vi/" + c.id + "/hqdefault.jpg", l(f)) : "vimeo" === c.type ? a.ajax({ type: "GET", url: "//vimeo.com/api/v2/video/" + c.id + ".json", jsonp: "callback", dataType: "jsonp", success: function (a) {
        f = a[0].thumbnail_large, l(f);
      } }) : "vzaar" === c.type && a.ajax({ type: "GET", url: "//vzaar.com/api/videos/" + c.id + ".json", jsonp: "callback", dataType: "jsonp", success: function (a) {
        f = a.framegrab_url, l(f);
      } }));
  }, e.prototype.stop = function () {
    this._core.trigger("stop", null, "video"), this._playing.find(".owl-video-frame").remove(), this._playing.removeClass("owl-video-playing"), this._playing = null, this._core.leave("playing"), this._core.trigger("stopped", null, "video");
  }, e.prototype.play = function (b) {
    var c,
        d = a(b.target),
        e = d.closest("." + this._core.settings.itemClass),
        f = this._videos[e.attr("data-video")],
        g = f.width || "100%",
        h = f.height || this._core.$stage.height();this._playing || (this._core.enter("playing"), this._core.trigger("play", null, "video"), e = this._core.items(this._core.relative(e.index())), this._core.reset(e.index()), "youtube" === f.type ? c = '<iframe width="' + g + '" height="' + h + '" src="//www.youtube.com/embed/' + f.id + "?autoplay=1&v=" + f.id + '" frameborder="0" allowfullscreen></iframe>' : "vimeo" === f.type ? c = '<iframe src="//player.vimeo.com/video/' + f.id + '?autoplay=1" width="' + g + '" height="' + h + '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>' : "vzaar" === f.type && (c = '<iframe frameborder="0"height="' + h + '"width="' + g + '" allowfullscreen mozallowfullscreen webkitAllowFullScreen src="//view.vzaar.com/' + f.id + '/player?autoplay=true"></iframe>'), a('<div class="owl-video-frame">' + c + "</div>").insertAfter(e.find(".owl-video")), this._playing = e.addClass("owl-video-playing"));
  }, e.prototype.isInFullScreen = function () {
    var b = c.fullscreenElement || c.mozFullScreenElement || c.webkitFullscreenElement;return b && a(b).parent().hasClass("owl-video-frame");
  }, e.prototype.destroy = function () {
    var a, b;this._core.$element.off("click.owl.video");for (a in this._handlers) this._core.$element.off(a, this._handlers[a]);for (b in Object.getOwnPropertyNames(this)) "function" != typeof this[b] && (this[b] = null);
  }, a.fn.owlCarousel.Constructor.Plugins.Video = e;
}(window.Zepto || window.jQuery, window, document), function (a, b, c, d) {
  var e = function (b) {
    this.core = b, this.core.options = a.extend({}, e.Defaults, this.core.options), this.swapping = !0, this.previous = d, this.next = d, this.handlers = { "change.owl.carousel": a.proxy(function (a) {
        a.namespace && "position" == a.property.name && (this.previous = this.core.current(), this.next = a.property.value);
      }, this), "drag.owl.carousel dragged.owl.carousel translated.owl.carousel": a.proxy(function (a) {
        a.namespace && (this.swapping = "translated" == a.type);
      }, this), "translate.owl.carousel": a.proxy(function (a) {
        a.namespace && this.swapping && (this.core.options.animateOut || this.core.options.animateIn) && this.swap();
      }, this) }, this.core.$element.on(this.handlers);
  };e.Defaults = { animateOut: !1, animateIn: !1 }, e.prototype.swap = function () {
    if (1 === this.core.settings.items && a.support.animation && a.support.transition) {
      this.core.speed(0);var b,
          c = a.proxy(this.clear, this),
          d = this.core.$stage.children().eq(this.previous),
          e = this.core.$stage.children().eq(this.next),
          f = this.core.settings.animateIn,
          g = this.core.settings.animateOut;this.core.current() !== this.previous && (g && (b = this.core.coordinates(this.previous) - this.core.coordinates(this.next), d.one(a.support.animation.end, c).css({ left: b + "px" }).addClass("animated owl-animated-out").addClass(g)), f && e.one(a.support.animation.end, c).addClass("animated owl-animated-in").addClass(f));
    }
  }, e.prototype.clear = function (b) {
    a(b.target).css({ left: "" }).removeClass("animated owl-animated-out owl-animated-in").removeClass(this.core.settings.animateIn).removeClass(this.core.settings.animateOut), this.core.onTransitionEnd();
  }, e.prototype.destroy = function () {
    var a, b;for (a in this.handlers) this.core.$element.off(a, this.handlers[a]);for (b in Object.getOwnPropertyNames(this)) "function" != typeof this[b] && (this[b] = null);
  }, a.fn.owlCarousel.Constructor.Plugins.Animate = e;
}(window.Zepto || window.jQuery, window, document), function (a, b, c, d) {
  var e = function (b) {
    this._core = b, this._timeout = null, this._paused = !1, this._handlers = { "changed.owl.carousel": a.proxy(function (a) {
        a.namespace && "settings" === a.property.name ? this._core.settings.autoplay ? this.play() : this.stop() : a.namespace && "position" === a.property.name && this._core.settings.autoplay && this._setAutoPlayInterval();
      }, this), "initialized.owl.carousel": a.proxy(function (a) {
        a.namespace && this._core.settings.autoplay && this.play();
      }, this), "play.owl.autoplay": a.proxy(function (a, b, c) {
        a.namespace && this.play(b, c);
      }, this), "stop.owl.autoplay": a.proxy(function (a) {
        a.namespace && this.stop();
      }, this), "mouseover.owl.autoplay": a.proxy(function () {
        this._core.settings.autoplayHoverPause && this._core.is("rotating") && this.pause();
      }, this), "mouseleave.owl.autoplay": a.proxy(function () {
        this._core.settings.autoplayHoverPause && this._core.is("rotating") && this.play();
      }, this), "touchstart.owl.core": a.proxy(function () {
        this._core.settings.autoplayHoverPause && this._core.is("rotating") && this.pause();
      }, this), "touchend.owl.core": a.proxy(function () {
        this._core.settings.autoplayHoverPause && this.play();
      }, this) }, this._core.$element.on(this._handlers), this._core.options = a.extend({}, e.Defaults, this._core.options);
  };e.Defaults = { autoplay: !1, autoplayTimeout: 5e3, autoplayHoverPause: !1, autoplaySpeed: !1 }, e.prototype.play = function (a, b) {
    this._paused = !1, this._core.is("rotating") || (this._core.enter("rotating"), this._setAutoPlayInterval());
  }, e.prototype._getNextTimeout = function (d, e) {
    return this._timeout && b.clearTimeout(this._timeout), b.setTimeout(a.proxy(function () {
      this._paused || this._core.is("busy") || this._core.is("interacting") || c.hidden || this._core.next(e || this._core.settings.autoplaySpeed);
    }, this), d || this._core.settings.autoplayTimeout);
  }, e.prototype._setAutoPlayInterval = function () {
    this._timeout = this._getNextTimeout();
  }, e.prototype.stop = function () {
    this._core.is("rotating") && (b.clearTimeout(this._timeout), this._core.leave("rotating"));
  }, e.prototype.pause = function () {
    this._core.is("rotating") && (this._paused = !0);
  }, e.prototype.destroy = function () {
    var a, b;this.stop();for (a in this._handlers) this._core.$element.off(a, this._handlers[a]);for (b in Object.getOwnPropertyNames(this)) "function" != typeof this[b] && (this[b] = null);
  }, a.fn.owlCarousel.Constructor.Plugins.autoplay = e;
}(window.Zepto || window.jQuery, window, document), function (a, b, c, d) {
  "use strict";
  var e = function (b) {
    this._core = b, this._initialized = !1, this._pages = [], this._controls = {}, this._templates = [], this.$element = this._core.$element, this._overrides = { next: this._core.next, prev: this._core.prev, to: this._core.to }, this._handlers = { "prepared.owl.carousel": a.proxy(function (b) {
        b.namespace && this._core.settings.dotsData && this._templates.push('<div class="' + this._core.settings.dotClass + '">' + a(b.content).find("[data-dot]").addBack("[data-dot]").attr("data-dot") + "</div>");
      }, this), "added.owl.carousel": a.proxy(function (a) {
        a.namespace && this._core.settings.dotsData && this._templates.splice(a.position, 0, this._templates.pop());
      }, this), "remove.owl.carousel": a.proxy(function (a) {
        a.namespace && this._core.settings.dotsData && this._templates.splice(a.position, 1);
      }, this), "changed.owl.carousel": a.proxy(function (a) {
        a.namespace && "position" == a.property.name && this.draw();
      }, this), "initialized.owl.carousel": a.proxy(function (a) {
        a.namespace && !this._initialized && (this._core.trigger("initialize", null, "navigation"), this.initialize(), this.update(), this.draw(), this._initialized = !0, this._core.trigger("initialized", null, "navigation"));
      }, this), "refreshed.owl.carousel": a.proxy(function (a) {
        a.namespace && this._initialized && (this._core.trigger("refresh", null, "navigation"), this.update(), this.draw(), this._core.trigger("refreshed", null, "navigation"));
      }, this) }, this._core.options = a.extend({}, e.Defaults, this._core.options), this.$element.on(this._handlers);
  };e.Defaults = { nav: !1, navText: ["prev", "next"], navSpeed: !1, navElement: "div", navContainer: !1, navContainerClass: "owl-nav", navClass: ["owl-prev", "owl-next"], slideBy: 1, dotClass: "owl-dot", dotsClass: "owl-dots", dots: !0, dotsEach: !1, dotsData: !1, dotsSpeed: !1, dotsContainer: !1 }, e.prototype.initialize = function () {
    var b,
        c = this._core.settings;this._controls.$relative = (c.navContainer ? a(c.navContainer) : a("<div>").addClass(c.navContainerClass).appendTo(this.$element)).addClass("disabled"), this._controls.$previous = a("<" + c.navElement + ">").addClass(c.navClass[0]).html(c.navText[0]).prependTo(this._controls.$relative).on("click", a.proxy(function (a) {
      this.prev(c.navSpeed);
    }, this)), this._controls.$next = a("<" + c.navElement + ">").addClass(c.navClass[1]).html(c.navText[1]).appendTo(this._controls.$relative).on("click", a.proxy(function (a) {
      this.next(c.navSpeed);
    }, this)), c.dotsData || (this._templates = [a("<div>").addClass(c.dotClass).append(a("<span>")).prop("outerHTML")]), this._controls.$absolute = (c.dotsContainer ? a(c.dotsContainer) : a("<div>").addClass(c.dotsClass).appendTo(this.$element)).addClass("disabled"), this._controls.$absolute.on("click", "div", a.proxy(function (b) {
      var d = a(b.target).parent().is(this._controls.$absolute) ? a(b.target).index() : a(b.target).parent().index();b.preventDefault(), this.to(d, c.dotsSpeed);
    }, this));for (b in this._overrides) this._core[b] = a.proxy(this[b], this);
  }, e.prototype.destroy = function () {
    var a, b, c, d;for (a in this._handlers) this.$element.off(a, this._handlers[a]);for (b in this._controls) this._controls[b].remove();for (d in this.overides) this._core[d] = this._overrides[d];for (c in Object.getOwnPropertyNames(this)) "function" != typeof this[c] && (this[c] = null);
  }, e.prototype.update = function () {
    var a,
        b,
        c,
        d = this._core.clones().length / 2,
        e = d + this._core.items().length,
        f = this._core.maximum(!0),
        g = this._core.settings,
        h = g.center || g.autoWidth || g.dotsData ? 1 : g.dotsEach || g.items;if ("page" !== g.slideBy && (g.slideBy = Math.min(g.slideBy, g.items)), g.dots || "page" == g.slideBy) for (this._pages = [], a = d, b = 0, c = 0; e > a; a++) {
      if (b >= h || 0 === b) {
        if (this._pages.push({ start: Math.min(f, a - d), end: a - d + h - 1 }), Math.min(f, a - d) === f) break;b = 0, ++c;
      }b += this._core.mergers(this._core.relative(a));
    }
  }, e.prototype.draw = function () {
    var b,
        c = this._core.settings,
        d = this._core.items().length <= c.items,
        e = this._core.relative(this._core.current()),
        f = c.loop || c.rewind;this._controls.$relative.toggleClass("disabled", !c.nav || d), c.nav && (this._controls.$previous.toggleClass("disabled", !f && e <= this._core.minimum(!0)), this._controls.$next.toggleClass("disabled", !f && e >= this._core.maximum(!0))), this._controls.$absolute.toggleClass("disabled", !c.dots || d), c.dots && (b = this._pages.length - this._controls.$absolute.children().length, c.dotsData && 0 !== b ? this._controls.$absolute.html(this._templates.join("")) : b > 0 ? this._controls.$absolute.append(new Array(b + 1).join(this._templates[0])) : 0 > b && this._controls.$absolute.children().slice(b).remove(), this._controls.$absolute.find(".active").removeClass("active"), this._controls.$absolute.children().eq(a.inArray(this.current(), this._pages)).addClass("active"));
  }, e.prototype.onTrigger = function (b) {
    var c = this._core.settings;b.page = { index: a.inArray(this.current(), this._pages), count: this._pages.length, size: c && (c.center || c.autoWidth || c.dotsData ? 1 : c.dotsEach || c.items) };
  }, e.prototype.current = function () {
    var b = this._core.relative(this._core.current());return a.grep(this._pages, a.proxy(function (a, c) {
      return a.start <= b && a.end >= b;
    }, this)).pop();
  }, e.prototype.getPosition = function (b) {
    var c,
        d,
        e = this._core.settings;return "page" == e.slideBy ? (c = a.inArray(this.current(), this._pages), d = this._pages.length, b ? ++c : --c, c = this._pages[(c % d + d) % d].start) : (c = this._core.relative(this._core.current()), d = this._core.items().length, b ? c += e.slideBy : c -= e.slideBy), c;
  }, e.prototype.next = function (b) {
    a.proxy(this._overrides.to, this._core)(this.getPosition(!0), b);
  }, e.prototype.prev = function (b) {
    a.proxy(this._overrides.to, this._core)(this.getPosition(!1), b);
  }, e.prototype.to = function (b, c, d) {
    var e;!d && this._pages.length ? (e = this._pages.length, a.proxy(this._overrides.to, this._core)(this._pages[(b % e + e) % e].start, c)) : a.proxy(this._overrides.to, this._core)(b, c);
  }, a.fn.owlCarousel.Constructor.Plugins.Navigation = e;
}(window.Zepto || window.jQuery, window, document), function (a, b, c, d) {
  "use strict";
  var e = function (c) {
    this._core = c, this._hashes = {}, this.$element = this._core.$element, this._handlers = { "initialized.owl.carousel": a.proxy(function (c) {
        c.namespace && "URLHash" === this._core.settings.startPosition && a(b).trigger("hashchange.owl.navigation");
      }, this), "prepared.owl.carousel": a.proxy(function (b) {
        if (b.namespace) {
          var c = a(b.content).find("[data-hash]").addBack("[data-hash]").attr("data-hash");if (!c) return;this._hashes[c] = b.content;
        }
      }, this), "changed.owl.carousel": a.proxy(function (c) {
        if (c.namespace && "position" === c.property.name) {
          var d = this._core.items(this._core.relative(this._core.current())),
              e = a.map(this._hashes, function (a, b) {
            return a === d ? b : null;
          }).join();if (!e || b.location.hash.slice(1) === e) return;b.location.hash = e;
        }
      }, this) }, this._core.options = a.extend({}, e.Defaults, this._core.options), this.$element.on(this._handlers), a(b).on("hashchange.owl.navigation", a.proxy(function (a) {
      var c = b.location.hash.substring(1),
          e = this._core.$stage.children(),
          f = this._hashes[c] && e.index(this._hashes[c]);f !== d && f !== this._core.current() && this._core.to(this._core.relative(f), !1, !0);
    }, this));
  };e.Defaults = { URLhashListener: !1 }, e.prototype.destroy = function () {
    var c, d;a(b).off("hashchange.owl.navigation");for (c in this._handlers) this._core.$element.off(c, this._handlers[c]);for (d in Object.getOwnPropertyNames(this)) "function" != typeof this[d] && (this[d] = null);
  }, a.fn.owlCarousel.Constructor.Plugins.Hash = e;
}(window.Zepto || window.jQuery, window, document), function (a, b, c, d) {
  function e(b, c) {
    var e = !1,
        f = b.charAt(0).toUpperCase() + b.slice(1);return a.each((b + " " + h.join(f + " ") + f).split(" "), function (a, b) {
      return g[b] !== d ? (e = c ? b : !0, !1) : void 0;
    }), e;
  }function f(a) {
    return e(a, !0);
  }var g = a("<support>").get(0).style,
      h = "Webkit Moz O ms".split(" "),
      i = { transition: { end: { WebkitTransition: "webkitTransitionEnd", MozTransition: "transitionend", OTransition: "oTransitionEnd", transition: "transitionend" } }, animation: { end: { WebkitAnimation: "webkitAnimationEnd", MozAnimation: "animationend", OAnimation: "oAnimationEnd", animation: "animationend" } } },
      j = { csstransforms: function () {
      return !!e("transform");
    }, csstransforms3d: function () {
      return !!e("perspective");
    }, csstransitions: function () {
      return !!e("transition");
    }, cssanimations: function () {
      return !!e("animation");
    } };j.csstransitions() && (a.support.transition = new String(f("transition")), a.support.transition.end = i.transition.end[a.support.transition]), j.cssanimations() && (a.support.animation = new String(f("animation")), a.support.animation.end = i.animation.end[a.support.animation]), j.csstransforms() && (a.support.transform = new String(f("transform")), a.support.transform3d = j.csstransforms3d());
}(window.Zepto || window.jQuery, window, document);
/* perfect-scrollbar v0.6.10 */
(function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw f.code = "MODULE_NOT_FOUND", f;
      }var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
        var n = t[o][1][e];return s(n ? n : e);
      }, l, l.exports, e, t, n, r);
    }return n[o].exports;
  }var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) s(r[o]);return s;
})({ 1: [function (require, module, exports) {
    'use strict';

    var ps = require('../main'),
        psInstances = require('../plugin/instances');

    function mountJQuery(jQuery) {
      jQuery.fn.perfectScrollbar = function (settingOrCommand) {
        return this.each(function () {
          if (typeof settingOrCommand === 'object' || typeof settingOrCommand === 'undefined') {
            // If it's an object or none, initialize.
            var settings = settingOrCommand;

            if (!psInstances.get(this)) {
              ps.initialize(this, settings);
            }
          } else {
            // Unless, it may be a command.
            var command = settingOrCommand;

            if (command === 'update') {
              ps.update(this);
            } else if (command === 'destroy') {
              ps.destroy(this);
            }
          }

          return jQuery(this);
        });
      };
    }

    if (typeof define === 'function' && define.amd) {
      // AMD. Register as an anonymous module.
      define(['jquery'], mountJQuery);
    } else {
      var jq = window.jQuery ? window.jQuery : window.$;
      if (typeof jq !== 'undefined') {
        mountJQuery(jq);
      }
    }

    module.exports = mountJQuery;
  }, { "../main": 7, "../plugin/instances": 18 }], 2: [function (require, module, exports) {
    'use strict';

    function oldAdd(element, className) {
      var classes = element.className.split(' ');
      if (classes.indexOf(className) < 0) {
        classes.push(className);
      }
      element.className = classes.join(' ');
    }

    function oldRemove(element, className) {
      var classes = element.className.split(' ');
      var idx = classes.indexOf(className);
      if (idx >= 0) {
        classes.splice(idx, 1);
      }
      element.className = classes.join(' ');
    }

    exports.add = function (element, className) {
      if (element.classList) {
        element.classList.add(className);
      } else {
        oldAdd(element, className);
      }
    };

    exports.remove = function (element, className) {
      if (element.classList) {
        element.classList.remove(className);
      } else {
        oldRemove(element, className);
      }
    };

    exports.list = function (element) {
      if (element.classList) {
        return Array.prototype.slice.apply(element.classList);
      } else {
        return element.className.split(' ');
      }
    };
  }, {}], 3: [function (require, module, exports) {
    'use strict';

    var DOM = {};

    DOM.e = function (tagName, className) {
      var element = document.createElement(tagName);
      element.className = className;
      return element;
    };

    DOM.appendTo = function (child, parent) {
      parent.appendChild(child);
      return child;
    };

    function cssGet(element, styleName) {
      return window.getComputedStyle(element)[styleName];
    }

    function cssSet(element, styleName, styleValue) {
      if (typeof styleValue === 'number') {
        styleValue = styleValue.toString() + 'px';
      }
      element.style[styleName] = styleValue;
      return element;
    }

    function cssMultiSet(element, obj) {
      for (var key in obj) {
        var val = obj[key];
        if (typeof val === 'number') {
          val = val.toString() + 'px';
        }
        element.style[key] = val;
      }
      return element;
    }

    DOM.css = function (element, styleNameOrObject, styleValue) {
      if (typeof styleNameOrObject === 'object') {
        // multiple set with object
        return cssMultiSet(element, styleNameOrObject);
      } else {
        if (typeof styleValue === 'undefined') {
          return cssGet(element, styleNameOrObject);
        } else {
          return cssSet(element, styleNameOrObject, styleValue);
        }
      }
    };

    DOM.matches = function (element, query) {
      if (typeof element.matches !== 'undefined') {
        return element.matches(query);
      } else {
        if (typeof element.matchesSelector !== 'undefined') {
          return element.matchesSelector(query);
        } else if (typeof element.webkitMatchesSelector !== 'undefined') {
          return element.webkitMatchesSelector(query);
        } else if (typeof element.mozMatchesSelector !== 'undefined') {
          return element.mozMatchesSelector(query);
        } else if (typeof element.msMatchesSelector !== 'undefined') {
          return element.msMatchesSelector(query);
        }
      }
    };

    DOM.remove = function (element) {
      if (typeof element.remove !== 'undefined') {
        element.remove();
      } else {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }
    };

    DOM.queryChildren = function (element, selector) {
      return Array.prototype.filter.call(element.childNodes, function (child) {
        return DOM.matches(child, selector);
      });
    };

    module.exports = DOM;
  }, {}], 4: [function (require, module, exports) {
    'use strict';

    var EventElement = function (element) {
      this.element = element;
      this.events = {};
    };

    EventElement.prototype.bind = function (eventName, handler) {
      if (typeof this.events[eventName] === 'undefined') {
        this.events[eventName] = [];
      }
      this.events[eventName].push(handler);
      this.element.addEventListener(eventName, handler, false);
    };

    EventElement.prototype.unbind = function (eventName, handler) {
      var isHandlerProvided = typeof handler !== 'undefined';
      this.events[eventName] = this.events[eventName].filter(function (hdlr) {
        if (isHandlerProvided && hdlr !== handler) {
          return true;
        }
        this.element.removeEventListener(eventName, hdlr, false);
        return false;
      }, this);
    };

    EventElement.prototype.unbindAll = function () {
      for (var name in this.events) {
        this.unbind(name);
      }
    };

    var EventManager = function () {
      this.eventElements = [];
    };

    EventManager.prototype.eventElement = function (element) {
      var ee = this.eventElements.filter(function (eventElement) {
        return eventElement.element === element;
      })[0];
      if (typeof ee === 'undefined') {
        ee = new EventElement(element);
        this.eventElements.push(ee);
      }
      return ee;
    };

    EventManager.prototype.bind = function (element, eventName, handler) {
      this.eventElement(element).bind(eventName, handler);
    };

    EventManager.prototype.unbind = function (element, eventName, handler) {
      this.eventElement(element).unbind(eventName, handler);
    };

    EventManager.prototype.unbindAll = function () {
      for (var i = 0; i < this.eventElements.length; i++) {
        this.eventElements[i].unbindAll();
      }
    };

    EventManager.prototype.once = function (element, eventName, handler) {
      var ee = this.eventElement(element);
      var onceHandler = function (e) {
        ee.unbind(eventName, onceHandler);
        handler(e);
      };
      ee.bind(eventName, onceHandler);
    };

    module.exports = EventManager;
  }, {}], 5: [function (require, module, exports) {
    'use strict';

    module.exports = function () {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
      }
      return function () {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
      };
    }();
  }, {}], 6: [function (require, module, exports) {
    'use strict';

    var cls = require('./class'),
        d = require('./dom');

    exports.toInt = function (x) {
      return parseInt(x, 10) || 0;
    };

    exports.clone = function (obj) {
      if (obj === null) {
        return null;
      } else if (typeof obj === 'object') {
        var result = {};
        for (var key in obj) {
          result[key] = this.clone(obj[key]);
        }
        return result;
      } else {
        return obj;
      }
    };

    exports.extend = function (original, source) {
      var result = this.clone(original);
      for (var key in source) {
        result[key] = this.clone(source[key]);
      }
      return result;
    };

    exports.isEditable = function (el) {
      return d.matches(el, "input,[contenteditable]") || d.matches(el, "select,[contenteditable]") || d.matches(el, "textarea,[contenteditable]") || d.matches(el, "button,[contenteditable]");
    };

    exports.removePsClasses = function (element) {
      var clsList = cls.list(element);
      for (var i = 0; i < clsList.length; i++) {
        var className = clsList[i];
        if (className.indexOf('ps-') === 0) {
          cls.remove(element, className);
        }
      }
    };

    exports.outerWidth = function (element) {
      return this.toInt(d.css(element, 'width')) + this.toInt(d.css(element, 'paddingLeft')) + this.toInt(d.css(element, 'paddingRight')) + this.toInt(d.css(element, 'borderLeftWidth')) + this.toInt(d.css(element, 'borderRightWidth'));
    };

    exports.startScrolling = function (element, axis) {
      cls.add(element, 'ps-in-scrolling');
      if (typeof axis !== 'undefined') {
        cls.add(element, 'ps-' + axis);
      } else {
        cls.add(element, 'ps-x');
        cls.add(element, 'ps-y');
      }
    };

    exports.stopScrolling = function (element, axis) {
      cls.remove(element, 'ps-in-scrolling');
      if (typeof axis !== 'undefined') {
        cls.remove(element, 'ps-' + axis);
      } else {
        cls.remove(element, 'ps-x');
        cls.remove(element, 'ps-y');
      }
    };

    exports.env = {
      isWebKit: 'WebkitAppearance' in document.documentElement.style,
      supportsTouch: 'ontouchstart' in window || window.DocumentTouch && document instanceof window.DocumentTouch,
      supportsIePointer: window.navigator.msMaxTouchPoints !== null
    };
  }, { "./class": 2, "./dom": 3 }], 7: [function (require, module, exports) {
    'use strict';

    var destroy = require('./plugin/destroy'),
        initialize = require('./plugin/initialize'),
        update = require('./plugin/update');

    module.exports = {
      initialize: initialize,
      update: update,
      destroy: destroy
    };
  }, { "./plugin/destroy": 9, "./plugin/initialize": 17, "./plugin/update": 21 }], 8: [function (require, module, exports) {
    'use strict';

    module.exports = {
      maxScrollbarLength: null,
      minScrollbarLength: null,
      scrollXMarginOffset: 0,
      scrollYMarginOffset: 0,
      stopPropagationOnClick: true,
      suppressScrollX: false,
      suppressScrollY: false,
      swipePropagation: true,
      useBothWheelAxes: false,
      useKeyboard: true,
      useSelectionScroll: false,
      wheelPropagation: false,
      wheelSpeed: 1,
      theme: 'default'
    };
  }, {}], 9: [function (require, module, exports) {
    'use strict';

    var d = require('../lib/dom'),
        h = require('../lib/helper'),
        instances = require('./instances');

    module.exports = function (element) {
      var i = instances.get(element);

      if (!i) {
        return;
      }

      i.event.unbindAll();
      d.remove(i.scrollbarX);
      d.remove(i.scrollbarY);
      d.remove(i.scrollbarXRail);
      d.remove(i.scrollbarYRail);
      h.removePsClasses(element);

      instances.remove(element);
    };
  }, { "../lib/dom": 3, "../lib/helper": 6, "./instances": 18 }], 10: [function (require, module, exports) {
    'use strict';

    var h = require('../../lib/helper'),
        instances = require('../instances'),
        updateGeometry = require('../update-geometry'),
        updateScroll = require('../update-scroll');

    function bindClickRailHandler(element, i) {
      function pageOffset(el) {
        return el.getBoundingClientRect();
      }
      var stopPropagation = window.Event.prototype.stopPropagation.bind;

      if (i.settings.stopPropagationOnClick) {
        i.event.bind(i.scrollbarY, 'click', stopPropagation);
      }
      i.event.bind(i.scrollbarYRail, 'click', function (e) {
        var halfOfScrollbarLength = h.toInt(i.scrollbarYHeight / 2);
        var positionTop = i.railYRatio * (e.pageY - window.pageYOffset - pageOffset(i.scrollbarYRail).top - halfOfScrollbarLength);
        var maxPositionTop = i.railYRatio * (i.railYHeight - i.scrollbarYHeight);
        var positionRatio = positionTop / maxPositionTop;

        if (positionRatio < 0) {
          positionRatio = 0;
        } else if (positionRatio > 1) {
          positionRatio = 1;
        }

        updateScroll(element, 'top', (i.contentHeight - i.containerHeight) * positionRatio);
        updateGeometry(element);

        e.stopPropagation();
      });

      if (i.settings.stopPropagationOnClick) {
        i.event.bind(i.scrollbarX, 'click', stopPropagation);
      }
      i.event.bind(i.scrollbarXRail, 'click', function (e) {
        var halfOfScrollbarLength = h.toInt(i.scrollbarXWidth / 2);
        var positionLeft = i.railXRatio * (e.pageX - window.pageXOffset - pageOffset(i.scrollbarXRail).left - halfOfScrollbarLength);
        var maxPositionLeft = i.railXRatio * (i.railXWidth - i.scrollbarXWidth);
        var positionRatio = positionLeft / maxPositionLeft;

        if (positionRatio < 0) {
          positionRatio = 0;
        } else if (positionRatio > 1) {
          positionRatio = 1;
        }

        updateScroll(element, 'left', (i.contentWidth - i.containerWidth) * positionRatio - i.negativeScrollAdjustment);
        updateGeometry(element);

        e.stopPropagation();
      });
    }

    module.exports = function (element) {
      var i = instances.get(element);
      bindClickRailHandler(element, i);
    };
  }, { "../../lib/helper": 6, "../instances": 18, "../update-geometry": 19, "../update-scroll": 20 }], 11: [function (require, module, exports) {
    'use strict';

    var d = require('../../lib/dom'),
        h = require('../../lib/helper'),
        instances = require('../instances'),
        updateGeometry = require('../update-geometry'),
        updateScroll = require('../update-scroll');

    function bindMouseScrollXHandler(element, i) {
      var currentLeft = null;
      var currentPageX = null;

      function updateScrollLeft(deltaX) {
        var newLeft = currentLeft + deltaX * i.railXRatio;
        var maxLeft = Math.max(0, i.scrollbarXRail.getBoundingClientRect().left) + i.railXRatio * (i.railXWidth - i.scrollbarXWidth);

        if (newLeft < 0) {
          i.scrollbarXLeft = 0;
        } else if (newLeft > maxLeft) {
          i.scrollbarXLeft = maxLeft;
        } else {
          i.scrollbarXLeft = newLeft;
        }

        var scrollLeft = h.toInt(i.scrollbarXLeft * (i.contentWidth - i.containerWidth) / (i.containerWidth - i.railXRatio * i.scrollbarXWidth)) - i.negativeScrollAdjustment;
        updateScroll(element, 'left', scrollLeft);
      }

      var mouseMoveHandler = function (e) {
        updateScrollLeft(e.pageX - currentPageX);
        updateGeometry(element);
        e.stopPropagation();
        e.preventDefault();
      };

      var mouseUpHandler = function () {
        h.stopScrolling(element, 'x');
        i.event.unbind(i.ownerDocument, 'mousemove', mouseMoveHandler);
      };

      i.event.bind(i.scrollbarX, 'mousedown', function (e) {
        currentPageX = e.pageX;
        currentLeft = h.toInt(d.css(i.scrollbarX, 'left')) * i.railXRatio;
        h.startScrolling(element, 'x');

        i.event.bind(i.ownerDocument, 'mousemove', mouseMoveHandler);
        i.event.once(i.ownerDocument, 'mouseup', mouseUpHandler);

        e.stopPropagation();
        e.preventDefault();
      });
    }

    function bindMouseScrollYHandler(element, i) {
      var currentTop = null;
      var currentPageY = null;

      function updateScrollTop(deltaY) {
        var newTop = currentTop + deltaY * i.railYRatio;
        var maxTop = Math.max(0, i.scrollbarYRail.getBoundingClientRect().top) + i.railYRatio * (i.railYHeight - i.scrollbarYHeight);

        if (newTop < 0) {
          i.scrollbarYTop = 0;
        } else if (newTop > maxTop) {
          i.scrollbarYTop = maxTop;
        } else {
          i.scrollbarYTop = newTop;
        }

        var scrollTop = h.toInt(i.scrollbarYTop * (i.contentHeight - i.containerHeight) / (i.containerHeight - i.railYRatio * i.scrollbarYHeight));
        updateScroll(element, 'top', scrollTop);
      }

      var mouseMoveHandler = function (e) {
        updateScrollTop(e.pageY - currentPageY);
        updateGeometry(element);
        e.stopPropagation();
        e.preventDefault();
      };

      var mouseUpHandler = function () {
        h.stopScrolling(element, 'y');
        i.event.unbind(i.ownerDocument, 'mousemove', mouseMoveHandler);
      };

      i.event.bind(i.scrollbarY, 'mousedown', function (e) {
        currentPageY = e.pageY;
        currentTop = h.toInt(d.css(i.scrollbarY, 'top')) * i.railYRatio;
        h.startScrolling(element, 'y');

        i.event.bind(i.ownerDocument, 'mousemove', mouseMoveHandler);
        i.event.once(i.ownerDocument, 'mouseup', mouseUpHandler);

        e.stopPropagation();
        e.preventDefault();
      });
    }

    module.exports = function (element) {
      var i = instances.get(element);
      bindMouseScrollXHandler(element, i);
      bindMouseScrollYHandler(element, i);
    };
  }, { "../../lib/dom": 3, "../../lib/helper": 6, "../instances": 18, "../update-geometry": 19, "../update-scroll": 20 }], 12: [function (require, module, exports) {
    'use strict';

    var h = require('../../lib/helper'),
        d = require('../../lib/dom'),
        instances = require('../instances'),
        updateGeometry = require('../update-geometry'),
        updateScroll = require('../update-scroll');

    function bindKeyboardHandler(element, i) {
      var hovered = false;
      i.event.bind(element, 'mouseenter', function () {
        hovered = true;
      });
      i.event.bind(element, 'mouseleave', function () {
        hovered = false;
      });

      var shouldPrevent = false;
      function shouldPreventDefault(deltaX, deltaY) {
        var scrollTop = element.scrollTop;
        if (deltaX === 0) {
          if (!i.scrollbarYActive) {
            return false;
          }
          if (scrollTop === 0 && deltaY > 0 || scrollTop >= i.contentHeight - i.containerHeight && deltaY < 0) {
            return !i.settings.wheelPropagation;
          }
        }

        var scrollLeft = element.scrollLeft;
        if (deltaY === 0) {
          if (!i.scrollbarXActive) {
            return false;
          }
          if (scrollLeft === 0 && deltaX < 0 || scrollLeft >= i.contentWidth - i.containerWidth && deltaX > 0) {
            return !i.settings.wheelPropagation;
          }
        }
        return true;
      }

      i.event.bind(i.ownerDocument, 'keydown', function (e) {
        if (e.isDefaultPrevented && e.isDefaultPrevented()) {
          return;
        }

        var focused = d.matches(i.scrollbarX, ':focus') || d.matches(i.scrollbarY, ':focus');

        if (!hovered && !focused) {
          return;
        }

        var activeElement = document.activeElement ? document.activeElement : i.ownerDocument.activeElement;
        if (activeElement) {
          // go deeper if element is a webcomponent
          while (activeElement.shadowRoot) {
            activeElement = activeElement.shadowRoot.activeElement;
          }
          if (h.isEditable(activeElement)) {
            return;
          }
        }

        var deltaX = 0;
        var deltaY = 0;

        switch (e.which) {
          case 37:
            // left
            deltaX = -30;
            break;
          case 38:
            // up
            deltaY = 30;
            break;
          case 39:
            // right
            deltaX = 30;
            break;
          case 40:
            // down
            deltaY = -30;
            break;
          case 33:
            // page up
            deltaY = 90;
            break;
          case 32:
            // space bar
            if (e.shiftKey) {
              deltaY = 90;
            } else {
              deltaY = -90;
            }
            break;
          case 34:
            // page down
            deltaY = -90;
            break;
          case 35:
            // end
            if (e.ctrlKey) {
              deltaY = -i.contentHeight;
            } else {
              deltaY = -i.containerHeight;
            }
            break;
          case 36:
            // home
            if (e.ctrlKey) {
              deltaY = element.scrollTop;
            } else {
              deltaY = i.containerHeight;
            }
            break;
          default:
            return;
        }

        updateScroll(element, 'top', element.scrollTop - deltaY);
        updateScroll(element, 'left', element.scrollLeft + deltaX);
        updateGeometry(element);

        shouldPrevent = shouldPreventDefault(deltaX, deltaY);
        if (shouldPrevent) {
          e.preventDefault();
        }
      });
    }

    module.exports = function (element) {
      var i = instances.get(element);
      bindKeyboardHandler(element, i);
    };
  }, { "../../lib/dom": 3, "../../lib/helper": 6, "../instances": 18, "../update-geometry": 19, "../update-scroll": 20 }], 13: [function (require, module, exports) {
    'use strict';

    var instances = require('../instances'),
        updateGeometry = require('../update-geometry'),
        updateScroll = require('../update-scroll');

    function bindMouseWheelHandler(element, i) {
      var shouldPrevent = false;

      function shouldPreventDefault(deltaX, deltaY) {
        var scrollTop = element.scrollTop;
        if (deltaX === 0) {
          if (!i.scrollbarYActive) {
            return false;
          }
          if (scrollTop === 0 && deltaY > 0 || scrollTop >= i.contentHeight - i.containerHeight && deltaY < 0) {
            return !i.settings.wheelPropagation;
          }
        }

        var scrollLeft = element.scrollLeft;
        if (deltaY === 0) {
          if (!i.scrollbarXActive) {
            return false;
          }
          if (scrollLeft === 0 && deltaX < 0 || scrollLeft >= i.contentWidth - i.containerWidth && deltaX > 0) {
            return !i.settings.wheelPropagation;
          }
        }
        return true;
      }

      function getDeltaFromEvent(e) {
        var deltaX = e.deltaX;
        var deltaY = -1 * e.deltaY;

        if (typeof deltaX === "undefined" || typeof deltaY === "undefined") {
          // OS X Safari
          deltaX = -1 * e.wheelDeltaX / 6;
          deltaY = e.wheelDeltaY / 6;
        }

        if (e.deltaMode && e.deltaMode === 1) {
          // Firefox in deltaMode 1: Line scrolling
          deltaX *= 10;
          deltaY *= 10;
        }

        if (deltaX !== deltaX && deltaY !== deltaY /* NaN checks */) {
            // IE in some mouse drivers
            deltaX = 0;
            deltaY = e.wheelDelta;
          }

        return [deltaX, deltaY];
      }

      function shouldBeConsumedByTextarea(deltaX, deltaY) {
        var hoveredTextarea = element.querySelector('textarea:hover');
        if (hoveredTextarea) {
          var maxScrollTop = hoveredTextarea.scrollHeight - hoveredTextarea.clientHeight;
          if (maxScrollTop > 0) {
            if (!(hoveredTextarea.scrollTop === 0 && deltaY > 0) && !(hoveredTextarea.scrollTop === maxScrollTop && deltaY < 0)) {
              return true;
            }
          }
          var maxScrollLeft = hoveredTextarea.scrollLeft - hoveredTextarea.clientWidth;
          if (maxScrollLeft > 0) {
            if (!(hoveredTextarea.scrollLeft === 0 && deltaX < 0) && !(hoveredTextarea.scrollLeft === maxScrollLeft && deltaX > 0)) {
              return true;
            }
          }
        }
        return false;
      }

      function mousewheelHandler(e) {
        var delta = getDeltaFromEvent(e);

        var deltaX = delta[0];
        var deltaY = delta[1];

        if (shouldBeConsumedByTextarea(deltaX, deltaY)) {
          return;
        }

        shouldPrevent = false;
        if (!i.settings.useBothWheelAxes) {
          // deltaX will only be used for horizontal scrolling and deltaY will
          // only be used for vertical scrolling - this is the default
          updateScroll(element, 'top', element.scrollTop - deltaY * i.settings.wheelSpeed);
          updateScroll(element, 'left', element.scrollLeft + deltaX * i.settings.wheelSpeed);
        } else if (i.scrollbarYActive && !i.scrollbarXActive) {
          // only vertical scrollbar is active and useBothWheelAxes option is
          // active, so let's scroll vertical bar using both mouse wheel axes
          if (deltaY) {
            updateScroll(element, 'top', element.scrollTop - deltaY * i.settings.wheelSpeed);
          } else {
            updateScroll(element, 'top', element.scrollTop + deltaX * i.settings.wheelSpeed);
          }
          shouldPrevent = true;
        } else if (i.scrollbarXActive && !i.scrollbarYActive) {
          // useBothWheelAxes and only horizontal bar is active, so use both
          // wheel axes for horizontal bar
          if (deltaX) {
            updateScroll(element, 'left', element.scrollLeft + deltaX * i.settings.wheelSpeed);
          } else {
            updateScroll(element, 'left', element.scrollLeft - deltaY * i.settings.wheelSpeed);
          }
          shouldPrevent = true;
        }

        updateGeometry(element);

        shouldPrevent = shouldPrevent || shouldPreventDefault(deltaX, deltaY);
        if (shouldPrevent) {
          e.stopPropagation();
          e.preventDefault();
        }
      }

      if (typeof window.onwheel !== "undefined") {
        i.event.bind(element, 'wheel', mousewheelHandler);
      } else if (typeof window.onmousewheel !== "undefined") {
        i.event.bind(element, 'mousewheel', mousewheelHandler);
      }
    }

    module.exports = function (element) {
      var i = instances.get(element);
      bindMouseWheelHandler(element, i);
    };
  }, { "../instances": 18, "../update-geometry": 19, "../update-scroll": 20 }], 14: [function (require, module, exports) {
    'use strict';

    var instances = require('../instances'),
        updateGeometry = require('../update-geometry');

    function bindNativeScrollHandler(element, i) {
      i.event.bind(element, 'scroll', function () {
        updateGeometry(element);
      });
    }

    module.exports = function (element) {
      var i = instances.get(element);
      bindNativeScrollHandler(element, i);
    };
  }, { "../instances": 18, "../update-geometry": 19 }], 15: [function (require, module, exports) {
    'use strict';

    var h = require('../../lib/helper'),
        instances = require('../instances'),
        updateGeometry = require('../update-geometry'),
        updateScroll = require('../update-scroll');

    function bindSelectionHandler(element, i) {
      function getRangeNode() {
        var selection = window.getSelection ? window.getSelection() : document.getSelection ? document.getSelection() : '';
        if (selection.toString().length === 0) {
          return null;
        } else {
          return selection.getRangeAt(0).commonAncestorContainer;
        }
      }

      var scrollingLoop = null;
      var scrollDiff = { top: 0, left: 0 };
      function startScrolling() {
        if (!scrollingLoop) {
          scrollingLoop = setInterval(function () {
            if (!instances.get(element)) {
              clearInterval(scrollingLoop);
              return;
            }

            updateScroll(element, 'top', element.scrollTop + scrollDiff.top);
            updateScroll(element, 'left', element.scrollLeft + scrollDiff.left);
            updateGeometry(element);
          }, 50); // every .1 sec
        }
      }
      function stopScrolling() {
        if (scrollingLoop) {
          clearInterval(scrollingLoop);
          scrollingLoop = null;
        }
        h.stopScrolling(element);
      }

      var isSelected = false;
      i.event.bind(i.ownerDocument, 'selectionchange', function () {
        if (element.contains(getRangeNode())) {
          isSelected = true;
        } else {
          isSelected = false;
          stopScrolling();
        }
      });
      i.event.bind(window, 'mouseup', function () {
        if (isSelected) {
          isSelected = false;
          stopScrolling();
        }
      });

      i.event.bind(window, 'mousemove', function (e) {
        if (isSelected) {
          var mousePosition = { x: e.pageX, y: e.pageY };
          var containerGeometry = {
            left: element.offsetLeft,
            right: element.offsetLeft + element.offsetWidth,
            top: element.offsetTop,
            bottom: element.offsetTop + element.offsetHeight
          };

          if (mousePosition.x < containerGeometry.left + 3) {
            scrollDiff.left = -5;
            h.startScrolling(element, 'x');
          } else if (mousePosition.x > containerGeometry.right - 3) {
            scrollDiff.left = 5;
            h.startScrolling(element, 'x');
          } else {
            scrollDiff.left = 0;
          }

          if (mousePosition.y < containerGeometry.top + 3) {
            if (containerGeometry.top + 3 - mousePosition.y < 5) {
              scrollDiff.top = -5;
            } else {
              scrollDiff.top = -20;
            }
            h.startScrolling(element, 'y');
          } else if (mousePosition.y > containerGeometry.bottom - 3) {
            if (mousePosition.y - containerGeometry.bottom + 3 < 5) {
              scrollDiff.top = 5;
            } else {
              scrollDiff.top = 20;
            }
            h.startScrolling(element, 'y');
          } else {
            scrollDiff.top = 0;
          }

          if (scrollDiff.top === 0 && scrollDiff.left === 0) {
            stopScrolling();
          } else {
            startScrolling();
          }
        }
      });
    }

    module.exports = function (element) {
      var i = instances.get(element);
      bindSelectionHandler(element, i);
    };
  }, { "../../lib/helper": 6, "../instances": 18, "../update-geometry": 19, "../update-scroll": 20 }], 16: [function (require, module, exports) {
    'use strict';

    var instances = require('../instances'),
        updateGeometry = require('../update-geometry'),
        updateScroll = require('../update-scroll');

    function bindTouchHandler(element, i, supportsTouch, supportsIePointer) {
      function shouldPreventDefault(deltaX, deltaY) {
        var scrollTop = element.scrollTop;
        var scrollLeft = element.scrollLeft;
        var magnitudeX = Math.abs(deltaX);
        var magnitudeY = Math.abs(deltaY);

        if (magnitudeY > magnitudeX) {
          // user is perhaps trying to swipe up/down the page

          if (deltaY < 0 && scrollTop === i.contentHeight - i.containerHeight || deltaY > 0 && scrollTop === 0) {
            return !i.settings.swipePropagation;
          }
        } else if (magnitudeX > magnitudeY) {
          // user is perhaps trying to swipe left/right across the page

          if (deltaX < 0 && scrollLeft === i.contentWidth - i.containerWidth || deltaX > 0 && scrollLeft === 0) {
            return !i.settings.swipePropagation;
          }
        }

        return true;
      }

      function applyTouchMove(differenceX, differenceY) {
        updateScroll(element, 'top', element.scrollTop - differenceY);
        updateScroll(element, 'left', element.scrollLeft - differenceX);

        updateGeometry(element);
      }

      var startOffset = {};
      var startTime = 0;
      var speed = {};
      var easingLoop = null;
      var inGlobalTouch = false;
      var inLocalTouch = false;

      function globalTouchStart() {
        inGlobalTouch = true;
      }
      function globalTouchEnd() {
        inGlobalTouch = false;
      }

      function getTouch(e) {
        if (e.targetTouches) {
          return e.targetTouches[0];
        } else {
          // Maybe IE pointer
          return e;
        }
      }
      function shouldHandle(e) {
        if (e.targetTouches && e.targetTouches.length === 1) {
          return true;
        }
        if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== e.MSPOINTER_TYPE_MOUSE) {
          return true;
        }
        return false;
      }
      function touchStart(e) {
        if (shouldHandle(e)) {
          inLocalTouch = true;

          var touch = getTouch(e);

          startOffset.pageX = touch.pageX;
          startOffset.pageY = touch.pageY;

          startTime = new Date().getTime();

          if (easingLoop !== null) {
            clearInterval(easingLoop);
          }

          e.stopPropagation();
        }
      }
      function touchMove(e) {
        if (!inGlobalTouch && inLocalTouch && shouldHandle(e)) {
          var touch = getTouch(e);

          var currentOffset = { pageX: touch.pageX, pageY: touch.pageY };

          var differenceX = currentOffset.pageX - startOffset.pageX;
          var differenceY = currentOffset.pageY - startOffset.pageY;

          applyTouchMove(differenceX, differenceY);
          startOffset = currentOffset;

          var currentTime = new Date().getTime();

          var timeGap = currentTime - startTime;
          if (timeGap > 0) {
            speed.x = differenceX / timeGap;
            speed.y = differenceY / timeGap;
            startTime = currentTime;
          }

          if (shouldPreventDefault(differenceX, differenceY)) {
            e.stopPropagation();
            e.preventDefault();
          }
        }
      }
      function touchEnd() {
        if (!inGlobalTouch && inLocalTouch) {
          inLocalTouch = false;

          clearInterval(easingLoop);
          easingLoop = setInterval(function () {
            if (!instances.get(element)) {
              clearInterval(easingLoop);
              return;
            }

            if (Math.abs(speed.x) < 0.01 && Math.abs(speed.y) < 0.01) {
              clearInterval(easingLoop);
              return;
            }

            applyTouchMove(speed.x * 30, speed.y * 30);

            speed.x *= 0.8;
            speed.y *= 0.8;
          }, 10);
        }
      }

      if (supportsTouch) {
        i.event.bind(window, 'touchstart', globalTouchStart);
        i.event.bind(window, 'touchend', globalTouchEnd);
        i.event.bind(element, 'touchstart', touchStart);
        i.event.bind(element, 'touchmove', touchMove);
        i.event.bind(element, 'touchend', touchEnd);
      }

      if (supportsIePointer) {
        if (window.PointerEvent) {
          i.event.bind(window, 'pointerdown', globalTouchStart);
          i.event.bind(window, 'pointerup', globalTouchEnd);
          i.event.bind(element, 'pointerdown', touchStart);
          i.event.bind(element, 'pointermove', touchMove);
          i.event.bind(element, 'pointerup', touchEnd);
        } else if (window.MSPointerEvent) {
          i.event.bind(window, 'MSPointerDown', globalTouchStart);
          i.event.bind(window, 'MSPointerUp', globalTouchEnd);
          i.event.bind(element, 'MSPointerDown', touchStart);
          i.event.bind(element, 'MSPointerMove', touchMove);
          i.event.bind(element, 'MSPointerUp', touchEnd);
        }
      }
    }

    module.exports = function (element, supportsTouch, supportsIePointer) {
      var i = instances.get(element);
      bindTouchHandler(element, i, supportsTouch, supportsIePointer);
    };
  }, { "../instances": 18, "../update-geometry": 19, "../update-scroll": 20 }], 17: [function (require, module, exports) {
    'use strict';

    var cls = require('../lib/class'),
        h = require('../lib/helper'),
        instances = require('./instances'),
        updateGeometry = require('./update-geometry');

    // Handlers
    var clickRailHandler = require('./handler/click-rail'),
        dragScrollbarHandler = require('./handler/drag-scrollbar'),
        keyboardHandler = require('./handler/keyboard'),
        mouseWheelHandler = require('./handler/mouse-wheel'),
        nativeScrollHandler = require('./handler/native-scroll'),
        selectionHandler = require('./handler/selection'),
        touchHandler = require('./handler/touch');

    module.exports = function (element, userSettings) {
      userSettings = typeof userSettings === 'object' ? userSettings : {};

      cls.add(element, 'ps-container');

      // Create a plugin instance.
      var i = instances.add(element);

      i.settings = h.extend(i.settings, userSettings);
      cls.add(element, 'ps-theme-' + i.settings.theme);

      clickRailHandler(element);
      dragScrollbarHandler(element);
      mouseWheelHandler(element);
      nativeScrollHandler(element);

      if (i.settings.useSelectionScroll) {
        selectionHandler(element);
      }

      if (h.env.supportsTouch || h.env.supportsIePointer) {
        touchHandler(element, h.env.supportsTouch, h.env.supportsIePointer);
      }
      if (i.settings.useKeyboard) {
        keyboardHandler(element);
      }

      updateGeometry(element);
    };
  }, { "../lib/class": 2, "../lib/helper": 6, "./handler/click-rail": 10, "./handler/drag-scrollbar": 11, "./handler/keyboard": 12, "./handler/mouse-wheel": 13, "./handler/native-scroll": 14, "./handler/selection": 15, "./handler/touch": 16, "./instances": 18, "./update-geometry": 19 }], 18: [function (require, module, exports) {
    'use strict';

    var cls = require('../lib/class'),
        d = require('../lib/dom'),
        defaultSettings = require('./default-setting'),
        EventManager = require('../lib/event-manager'),
        guid = require('../lib/guid'),
        h = require('../lib/helper');

    var instances = {};

    function Instance(element) {
      var i = this;

      i.settings = h.clone(defaultSettings);
      i.containerWidth = null;
      i.containerHeight = null;
      i.contentWidth = null;
      i.contentHeight = null;

      i.isRtl = d.css(element, 'direction') === "rtl";
      i.isNegativeScroll = function () {
        var originalScrollLeft = element.scrollLeft;
        var result = null;
        element.scrollLeft = -1;
        result = element.scrollLeft < 0;
        element.scrollLeft = originalScrollLeft;
        return result;
      }();
      i.negativeScrollAdjustment = i.isNegativeScroll ? element.scrollWidth - element.clientWidth : 0;
      i.event = new EventManager();
      i.ownerDocument = element.ownerDocument || document;

      function focus() {
        cls.add(element, 'ps-focus');
      }

      function blur() {
        cls.remove(element, 'ps-focus');
      }

      i.scrollbarXRail = d.appendTo(d.e('div', 'ps-scrollbar-x-rail'), element);
      i.scrollbarX = d.appendTo(d.e('div', 'ps-scrollbar-x'), i.scrollbarXRail);
      i.scrollbarX.setAttribute('tabindex', 0);
      i.event.bind(i.scrollbarX, 'focus', focus);
      i.event.bind(i.scrollbarX, 'blur', blur);
      i.scrollbarXActive = null;
      i.scrollbarXWidth = null;
      i.scrollbarXLeft = null;
      i.scrollbarXBottom = h.toInt(d.css(i.scrollbarXRail, 'bottom'));
      i.isScrollbarXUsingBottom = i.scrollbarXBottom === i.scrollbarXBottom; // !isNaN
      i.scrollbarXTop = i.isScrollbarXUsingBottom ? null : h.toInt(d.css(i.scrollbarXRail, 'top'));
      i.railBorderXWidth = h.toInt(d.css(i.scrollbarXRail, 'borderLeftWidth')) + h.toInt(d.css(i.scrollbarXRail, 'borderRightWidth'));
      // Set rail to display:block to calculate margins
      d.css(i.scrollbarXRail, 'display', 'block');
      i.railXMarginWidth = h.toInt(d.css(i.scrollbarXRail, 'marginLeft')) + h.toInt(d.css(i.scrollbarXRail, 'marginRight'));
      d.css(i.scrollbarXRail, 'display', '');
      i.railXWidth = null;
      i.railXRatio = null;

      i.scrollbarYRail = d.appendTo(d.e('div', 'ps-scrollbar-y-rail'), element);
      i.scrollbarY = d.appendTo(d.e('div', 'ps-scrollbar-y'), i.scrollbarYRail);
      i.scrollbarY.setAttribute('tabindex', 0);
      i.event.bind(i.scrollbarY, 'focus', focus);
      i.event.bind(i.scrollbarY, 'blur', blur);
      i.scrollbarYActive = null;
      i.scrollbarYHeight = null;
      i.scrollbarYTop = null;
      i.scrollbarYRight = h.toInt(d.css(i.scrollbarYRail, 'right'));
      i.isScrollbarYUsingRight = i.scrollbarYRight === i.scrollbarYRight; // !isNaN
      i.scrollbarYLeft = i.isScrollbarYUsingRight ? null : h.toInt(d.css(i.scrollbarYRail, 'left'));
      i.scrollbarYOuterWidth = i.isRtl ? h.outerWidth(i.scrollbarY) : null;
      i.railBorderYWidth = h.toInt(d.css(i.scrollbarYRail, 'borderTopWidth')) + h.toInt(d.css(i.scrollbarYRail, 'borderBottomWidth'));
      d.css(i.scrollbarYRail, 'display', 'block');
      i.railYMarginHeight = h.toInt(d.css(i.scrollbarYRail, 'marginTop')) + h.toInt(d.css(i.scrollbarYRail, 'marginBottom'));
      d.css(i.scrollbarYRail, 'display', '');
      i.railYHeight = null;
      i.railYRatio = null;
    }

    function getId(element) {
      if (typeof element.dataset === 'undefined') {
        return element.getAttribute('data-ps-id');
      } else {
        return element.dataset.psId;
      }
    }

    function setId(element, id) {
      if (typeof element.dataset === 'undefined') {
        element.setAttribute('data-ps-id', id);
      } else {
        element.dataset.psId = id;
      }
    }

    function removeId(element) {
      if (typeof element.dataset === 'undefined') {
        element.removeAttribute('data-ps-id');
      } else {
        delete element.dataset.psId;
      }
    }

    exports.add = function (element) {
      var newId = guid();
      setId(element, newId);
      instances[newId] = new Instance(element);
      return instances[newId];
    };

    exports.remove = function (element) {
      delete instances[getId(element)];
      removeId(element);
    };

    exports.get = function (element) {
      return instances[getId(element)];
    };
  }, { "../lib/class": 2, "../lib/dom": 3, "../lib/event-manager": 4, "../lib/guid": 5, "../lib/helper": 6, "./default-setting": 8 }], 19: [function (require, module, exports) {
    'use strict';

    var cls = require('../lib/class'),
        d = require('../lib/dom'),
        h = require('../lib/helper'),
        instances = require('./instances'),
        updateScroll = require('./update-scroll');

    function getThumbSize(i, thumbSize) {
      if (i.settings.minScrollbarLength) {
        thumbSize = Math.max(thumbSize, i.settings.minScrollbarLength);
      }
      if (i.settings.maxScrollbarLength) {
        thumbSize = Math.min(thumbSize, i.settings.maxScrollbarLength);
      }
      return thumbSize;
    }

    function updateCss(element, i) {
      var xRailOffset = { width: i.railXWidth };
      if (i.isRtl) {
        xRailOffset.left = i.negativeScrollAdjustment + element.scrollLeft + i.containerWidth - i.contentWidth;
      } else {
        xRailOffset.left = element.scrollLeft;
      }
      if (i.isScrollbarXUsingBottom) {
        xRailOffset.bottom = i.scrollbarXBottom - element.scrollTop;
      } else {
        xRailOffset.top = i.scrollbarXTop + element.scrollTop;
      }
      d.css(i.scrollbarXRail, xRailOffset);

      var yRailOffset = { top: element.scrollTop, height: i.railYHeight };
      if (i.isScrollbarYUsingRight) {
        if (i.isRtl) {
          yRailOffset.right = i.contentWidth - (i.negativeScrollAdjustment + element.scrollLeft) - i.scrollbarYRight - i.scrollbarYOuterWidth;
        } else {
          yRailOffset.right = i.scrollbarYRight - element.scrollLeft;
        }
      } else {
        if (i.isRtl) {
          yRailOffset.left = i.negativeScrollAdjustment + element.scrollLeft + i.containerWidth * 2 - i.contentWidth - i.scrollbarYLeft - i.scrollbarYOuterWidth;
        } else {
          yRailOffset.left = i.scrollbarYLeft + element.scrollLeft;
        }
      }
      d.css(i.scrollbarYRail, yRailOffset);

      d.css(i.scrollbarX, { left: i.scrollbarXLeft, width: i.scrollbarXWidth - i.railBorderXWidth });
      d.css(i.scrollbarY, { top: i.scrollbarYTop, height: i.scrollbarYHeight - i.railBorderYWidth });
    }

    module.exports = function (element) {
      var i = instances.get(element);

      i.containerWidth = element.clientWidth;
      i.containerHeight = element.clientHeight;
      i.contentWidth = element.scrollWidth;
      i.contentHeight = element.scrollHeight;

      var existingRails;
      if (!element.contains(i.scrollbarXRail)) {
        existingRails = d.queryChildren(element, '.ps-scrollbar-x-rail');
        if (existingRails.length > 0) {
          existingRails.forEach(function (rail) {
            d.remove(rail);
          });
        }
        d.appendTo(i.scrollbarXRail, element);
      }
      if (!element.contains(i.scrollbarYRail)) {
        existingRails = d.queryChildren(element, '.ps-scrollbar-y-rail');
        if (existingRails.length > 0) {
          existingRails.forEach(function (rail) {
            d.remove(rail);
          });
        }
        d.appendTo(i.scrollbarYRail, element);
      }

      if (!i.settings.suppressScrollX && i.containerWidth + i.settings.scrollXMarginOffset < i.contentWidth) {
        i.scrollbarXActive = true;
        i.railXWidth = i.containerWidth - i.railXMarginWidth;
        i.railXRatio = i.containerWidth / i.railXWidth;
        i.scrollbarXWidth = getThumbSize(i, h.toInt(i.railXWidth * i.containerWidth / i.contentWidth));
        i.scrollbarXLeft = h.toInt((i.negativeScrollAdjustment + element.scrollLeft) * (i.railXWidth - i.scrollbarXWidth) / (i.contentWidth - i.containerWidth));
      } else {
        i.scrollbarXActive = false;
      }

      if (!i.settings.suppressScrollY && i.containerHeight + i.settings.scrollYMarginOffset < i.contentHeight) {
        i.scrollbarYActive = true;
        i.railYHeight = i.containerHeight - i.railYMarginHeight;
        i.railYRatio = i.containerHeight / i.railYHeight;
        i.scrollbarYHeight = getThumbSize(i, h.toInt(i.railYHeight * i.containerHeight / i.contentHeight));
        i.scrollbarYTop = h.toInt(element.scrollTop * (i.railYHeight - i.scrollbarYHeight) / (i.contentHeight - i.containerHeight));
      } else {
        i.scrollbarYActive = false;
      }

      if (i.scrollbarXLeft >= i.railXWidth - i.scrollbarXWidth) {
        i.scrollbarXLeft = i.railXWidth - i.scrollbarXWidth;
      }
      if (i.scrollbarYTop >= i.railYHeight - i.scrollbarYHeight) {
        i.scrollbarYTop = i.railYHeight - i.scrollbarYHeight;
      }

      updateCss(element, i);

      if (i.scrollbarXActive) {
        cls.add(element, 'ps-active-x');
      } else {
        cls.remove(element, 'ps-active-x');
        i.scrollbarXWidth = 0;
        i.scrollbarXLeft = 0;
        updateScroll(element, 'left', 0);
      }
      if (i.scrollbarYActive) {
        cls.add(element, 'ps-active-y');
      } else {
        cls.remove(element, 'ps-active-y');
        i.scrollbarYHeight = 0;
        i.scrollbarYTop = 0;
        updateScroll(element, 'top', 0);
      }
    };
  }, { "../lib/class": 2, "../lib/dom": 3, "../lib/helper": 6, "./instances": 18, "./update-scroll": 20 }], 20: [function (require, module, exports) {
    'use strict';

    var instances = require('./instances');

    var upEvent = document.createEvent('Event'),
        downEvent = document.createEvent('Event'),
        leftEvent = document.createEvent('Event'),
        rightEvent = document.createEvent('Event'),
        yEvent = document.createEvent('Event'),
        xEvent = document.createEvent('Event'),
        xStartEvent = document.createEvent('Event'),
        xEndEvent = document.createEvent('Event'),
        yStartEvent = document.createEvent('Event'),
        yEndEvent = document.createEvent('Event'),
        lastTop,
        lastLeft;

    upEvent.initEvent('ps-scroll-up', true, true);
    downEvent.initEvent('ps-scroll-down', true, true);
    leftEvent.initEvent('ps-scroll-left', true, true);
    rightEvent.initEvent('ps-scroll-right', true, true);
    yEvent.initEvent('ps-scroll-y', true, true);
    xEvent.initEvent('ps-scroll-x', true, true);
    xStartEvent.initEvent('ps-x-reach-start', true, true);
    xEndEvent.initEvent('ps-x-reach-end', true, true);
    yStartEvent.initEvent('ps-y-reach-start', true, true);
    yEndEvent.initEvent('ps-y-reach-end', true, true);

    module.exports = function (element, axis, value) {
      if (typeof element === 'undefined') {
        throw 'You must provide an element to the update-scroll function';
      }

      if (typeof axis === 'undefined') {
        throw 'You must provide an axis to the update-scroll function';
      }

      if (typeof value === 'undefined') {
        throw 'You must provide a value to the update-scroll function';
      }

      if (axis === 'top' && value <= 0) {
        element.scrollTop = value = 0; // don't allow negative scroll
        element.dispatchEvent(yStartEvent);
      }

      if (axis === 'left' && value <= 0) {
        element.scrollLeft = value = 0; // don't allow negative scroll
        element.dispatchEvent(xStartEvent);
      }

      var i = instances.get(element);

      if (axis === 'top' && value >= i.contentHeight - i.containerHeight) {
        element.scrollTop = value = i.contentHeight - i.containerHeight; // don't allow scroll past container
        element.dispatchEvent(yEndEvent);
      }

      if (axis === 'left' && value >= i.contentWidth - i.containerWidth) {
        element.scrollLeft = value = i.contentWidth - i.containerWidth; // don't allow scroll past container
        element.dispatchEvent(xEndEvent);
      }

      if (!lastTop) {
        lastTop = element.scrollTop;
      }

      if (!lastLeft) {
        lastLeft = element.scrollLeft;
      }

      if (axis === 'top' && value < lastTop) {
        element.dispatchEvent(upEvent);
      }

      if (axis === 'top' && value > lastTop) {
        element.dispatchEvent(downEvent);
      }

      if (axis === 'left' && value < lastLeft) {
        element.dispatchEvent(leftEvent);
      }

      if (axis === 'left' && value > lastLeft) {
        element.dispatchEvent(rightEvent);
      }

      if (axis === 'top') {
        element.scrollTop = lastTop = value;
        element.dispatchEvent(yEvent);
      }

      if (axis === 'left') {
        element.scrollLeft = lastLeft = value;
        element.dispatchEvent(xEvent);
      }
    };
  }, { "./instances": 18 }], 21: [function (require, module, exports) {
    'use strict';

    var d = require('../lib/dom'),
        h = require('../lib/helper'),
        instances = require('./instances'),
        updateGeometry = require('./update-geometry'),
        updateScroll = require('./update-scroll');

    module.exports = function (element) {
      var i = instances.get(element);

      if (!i) {
        return;
      }

      // Recalcuate negative scrollLeft adjustment
      i.negativeScrollAdjustment = i.isNegativeScroll ? element.scrollWidth - element.clientWidth : 0;

      // Recalculate rail margins
      d.css(i.scrollbarXRail, 'display', 'block');
      d.css(i.scrollbarYRail, 'display', 'block');
      i.railXMarginWidth = h.toInt(d.css(i.scrollbarXRail, 'marginLeft')) + h.toInt(d.css(i.scrollbarXRail, 'marginRight'));
      i.railYMarginHeight = h.toInt(d.css(i.scrollbarYRail, 'marginTop')) + h.toInt(d.css(i.scrollbarYRail, 'marginBottom'));

      // Hide scrollbars not to affect scrollWidth and scrollHeight
      d.css(i.scrollbarXRail, 'display', 'none');
      d.css(i.scrollbarYRail, 'display', 'none');

      updateGeometry(element);

      // Update top/left scroll to trigger events
      updateScroll(element, 'top', element.scrollTop);
      updateScroll(element, 'left', element.scrollLeft);

      d.css(i.scrollbarXRail, 'display', '');
      d.css(i.scrollbarYRail, 'display', '');
    };
  }, { "../lib/dom": 3, "../lib/helper": 6, "./instances": 18, "./update-geometry": 19, "./update-scroll": 20 }] }, {}, [1]);
/*!
 * Bootstrap v3.3.7 (http://getbootstrap.com)
 * Copyright 2011-2016 Twitter, Inc.
 * Licensed under the MIT license
 */
if ("undefined" == typeof jQuery) throw new Error("Bootstrap's JavaScript requires jQuery");+function (a) {
  "use strict";
  var b = a.fn.jquery.split(" ")[0].split(".");if (b[0] < 2 && b[1] < 9 || 1 == b[0] && 9 == b[1] && b[2] < 1 || b[0] > 3) throw new Error("Bootstrap's JavaScript requires jQuery version 1.9.1 or higher, but lower than version 4");
}(jQuery), +function (a) {
  "use strict";
  function b() {
    var a = document.createElement("bootstrap"),
        b = { WebkitTransition: "webkitTransitionEnd", MozTransition: "transitionend", OTransition: "oTransitionEnd otransitionend", transition: "transitionend" };for (var c in b) if (void 0 !== a.style[c]) return { end: b[c] };return !1;
  }a.fn.emulateTransitionEnd = function (b) {
    var c = !1,
        d = this;a(this).one("bsTransitionEnd", function () {
      c = !0;
    });var e = function () {
      c || a(d).trigger(a.support.transition.end);
    };return setTimeout(e, b), this;
  }, a(function () {
    a.support.transition = b(), a.support.transition && (a.event.special.bsTransitionEnd = { bindType: a.support.transition.end, delegateType: a.support.transition.end, handle: function (b) {
        if (a(b.target).is(this)) return b.handleObj.handler.apply(this, arguments);
      } });
  });
}(jQuery), +function (a) {
  "use strict";
  function b(b) {
    return this.each(function () {
      var c = a(this),
          e = c.data("bs.alert");e || c.data("bs.alert", e = new d(this)), "string" == typeof b && e[b].call(c);
    });
  }var c = '[data-dismiss="alert"]',
      d = function (b) {
    a(b).on("click", c, this.close);
  };d.VERSION = "3.3.7", d.TRANSITION_DURATION = 150, d.prototype.close = function (b) {
    function c() {
      g.detach().trigger("closed.bs.alert").remove();
    }var e = a(this),
        f = e.attr("data-target");f || (f = e.attr("href"), f = f && f.replace(/.*(?=#[^\s]*$)/, ""));var g = a("#" === f ? [] : f);b && b.preventDefault(), g.length || (g = e.closest(".alert")), g.trigger(b = a.Event("close.bs.alert")), b.isDefaultPrevented() || (g.removeClass("in"), a.support.transition && g.hasClass("fade") ? g.one("bsTransitionEnd", c).emulateTransitionEnd(d.TRANSITION_DURATION) : c());
  };var e = a.fn.alert;a.fn.alert = b, a.fn.alert.Constructor = d, a.fn.alert.noConflict = function () {
    return a.fn.alert = e, this;
  }, a(document).on("click.bs.alert.data-api", c, d.prototype.close);
}(jQuery), +function (a) {
  "use strict";
  function b(b) {
    return this.each(function () {
      var d = a(this),
          e = d.data("bs.button"),
          f = "object" == typeof b && b;e || d.data("bs.button", e = new c(this, f)), "toggle" == b ? e.toggle() : b && e.setState(b);
    });
  }var c = function (b, d) {
    this.$element = a(b), this.options = a.extend({}, c.DEFAULTS, d), this.isLoading = !1;
  };c.VERSION = "3.3.7", c.DEFAULTS = { loadingText: "loading..." }, c.prototype.setState = function (b) {
    var c = "disabled",
        d = this.$element,
        e = d.is("input") ? "val" : "html",
        f = d.data();b += "Text", null == f.resetText && d.data("resetText", d[e]()), setTimeout(a.proxy(function () {
      d[e](null == f[b] ? this.options[b] : f[b]), "loadingText" == b ? (this.isLoading = !0, d.addClass(c).attr(c, c).prop(c, !0)) : this.isLoading && (this.isLoading = !1, d.removeClass(c).removeAttr(c).prop(c, !1));
    }, this), 0);
  }, c.prototype.toggle = function () {
    var a = !0,
        b = this.$element.closest('[data-toggle="buttons"]');if (b.length) {
      var c = this.$element.find("input");"radio" == c.prop("type") ? (c.prop("checked") && (a = !1), b.find(".active").removeClass("active"), this.$element.addClass("active")) : "checkbox" == c.prop("type") && (c.prop("checked") !== this.$element.hasClass("active") && (a = !1), this.$element.toggleClass("active")), c.prop("checked", this.$element.hasClass("active")), a && c.trigger("change");
    } else this.$element.attr("aria-pressed", !this.$element.hasClass("active")), this.$element.toggleClass("active");
  };var d = a.fn.button;a.fn.button = b, a.fn.button.Constructor = c, a.fn.button.noConflict = function () {
    return a.fn.button = d, this;
  }, a(document).on("click.bs.button.data-api", '[data-toggle^="button"]', function (c) {
    var d = a(c.target).closest(".btn");b.call(d, "toggle"), a(c.target).is('input[type="radio"], input[type="checkbox"]') || (c.preventDefault(), d.is("input,button") ? d.trigger("focus") : d.find("input:visible,button:visible").first().trigger("focus"));
  }).on("focus.bs.button.data-api blur.bs.button.data-api", '[data-toggle^="button"]', function (b) {
    a(b.target).closest(".btn").toggleClass("focus", /^focus(in)?$/.test(b.type));
  });
}(jQuery), +function (a) {
  "use strict";
  function b(b) {
    return this.each(function () {
      var d = a(this),
          e = d.data("bs.carousel"),
          f = a.extend({}, c.DEFAULTS, d.data(), "object" == typeof b && b),
          g = "string" == typeof b ? b : f.slide;e || d.data("bs.carousel", e = new c(this, f)), "number" == typeof b ? e.to(b) : g ? e[g]() : f.interval && e.pause().cycle();
    });
  }var c = function (b, c) {
    this.$element = a(b), this.$indicators = this.$element.find(".carousel-indicators"), this.options = c, this.paused = null, this.sliding = null, this.interval = null, this.$active = null, this.$items = null, this.options.keyboard && this.$element.on("keydown.bs.carousel", a.proxy(this.keydown, this)), "hover" == this.options.pause && !("ontouchstart" in document.documentElement) && this.$element.on("mouseenter.bs.carousel", a.proxy(this.pause, this)).on("mouseleave.bs.carousel", a.proxy(this.cycle, this));
  };c.VERSION = "3.3.7", c.TRANSITION_DURATION = 600, c.DEFAULTS = { interval: 5e3, pause: "hover", wrap: !0, keyboard: !0 }, c.prototype.keydown = function (a) {
    if (!/input|textarea/i.test(a.target.tagName)) {
      switch (a.which) {case 37:
          this.prev();break;case 39:
          this.next();break;default:
          return;}a.preventDefault();
    }
  }, c.prototype.cycle = function (b) {
    return b || (this.paused = !1), this.interval && clearInterval(this.interval), this.options.interval && !this.paused && (this.interval = setInterval(a.proxy(this.next, this), this.options.interval)), this;
  }, c.prototype.getItemIndex = function (a) {
    return this.$items = a.parent().children(".item"), this.$items.index(a || this.$active);
  }, c.prototype.getItemForDirection = function (a, b) {
    var c = this.getItemIndex(b),
        d = "prev" == a && 0 === c || "next" == a && c == this.$items.length - 1;if (d && !this.options.wrap) return b;var e = "prev" == a ? -1 : 1,
        f = (c + e) % this.$items.length;return this.$items.eq(f);
  }, c.prototype.to = function (a) {
    var b = this,
        c = this.getItemIndex(this.$active = this.$element.find(".item.active"));if (!(a > this.$items.length - 1 || a < 0)) return this.sliding ? this.$element.one("slid.bs.carousel", function () {
      b.to(a);
    }) : c == a ? this.pause().cycle() : this.slide(a > c ? "next" : "prev", this.$items.eq(a));
  }, c.prototype.pause = function (b) {
    return b || (this.paused = !0), this.$element.find(".next, .prev").length && a.support.transition && (this.$element.trigger(a.support.transition.end), this.cycle(!0)), this.interval = clearInterval(this.interval), this;
  }, c.prototype.next = function () {
    if (!this.sliding) return this.slide("next");
  }, c.prototype.prev = function () {
    if (!this.sliding) return this.slide("prev");
  }, c.prototype.slide = function (b, d) {
    var e = this.$element.find(".item.active"),
        f = d || this.getItemForDirection(b, e),
        g = this.interval,
        h = "next" == b ? "left" : "right",
        i = this;if (f.hasClass("active")) return this.sliding = !1;var j = f[0],
        k = a.Event("slide.bs.carousel", { relatedTarget: j, direction: h });if (this.$element.trigger(k), !k.isDefaultPrevented()) {
      if (this.sliding = !0, g && this.pause(), this.$indicators.length) {
        this.$indicators.find(".active").removeClass("active");var l = a(this.$indicators.children()[this.getItemIndex(f)]);l && l.addClass("active");
      }var m = a.Event("slid.bs.carousel", { relatedTarget: j, direction: h });return a.support.transition && this.$element.hasClass("slide") ? (f.addClass(b), f[0].offsetWidth, e.addClass(h), f.addClass(h), e.one("bsTransitionEnd", function () {
        f.removeClass([b, h].join(" ")).addClass("active"), e.removeClass(["active", h].join(" ")), i.sliding = !1, setTimeout(function () {
          i.$element.trigger(m);
        }, 0);
      }).emulateTransitionEnd(c.TRANSITION_DURATION)) : (e.removeClass("active"), f.addClass("active"), this.sliding = !1, this.$element.trigger(m)), g && this.cycle(), this;
    }
  };var d = a.fn.carousel;a.fn.carousel = b, a.fn.carousel.Constructor = c, a.fn.carousel.noConflict = function () {
    return a.fn.carousel = d, this;
  };var e = function (c) {
    var d,
        e = a(this),
        f = a(e.attr("data-target") || (d = e.attr("href")) && d.replace(/.*(?=#[^\s]+$)/, ""));if (f.hasClass("carousel")) {
      var g = a.extend({}, f.data(), e.data()),
          h = e.attr("data-slide-to");h && (g.interval = !1), b.call(f, g), h && f.data("bs.carousel").to(h), c.preventDefault();
    }
  };a(document).on("click.bs.carousel.data-api", "[data-slide]", e).on("click.bs.carousel.data-api", "[data-slide-to]", e), a(window).on("load", function () {
    a('[data-ride="carousel"]').each(function () {
      var c = a(this);b.call(c, c.data());
    });
  });
}(jQuery), +function (a) {
  "use strict";
  function b(b) {
    var c,
        d = b.attr("data-target") || (c = b.attr("href")) && c.replace(/.*(?=#[^\s]+$)/, "");return a(d);
  }function c(b) {
    return this.each(function () {
      var c = a(this),
          e = c.data("bs.collapse"),
          f = a.extend({}, d.DEFAULTS, c.data(), "object" == typeof b && b);!e && f.toggle && /show|hide/.test(b) && (f.toggle = !1), e || c.data("bs.collapse", e = new d(this, f)), "string" == typeof b && e[b]();
    });
  }var d = function (b, c) {
    this.$element = a(b), this.options = a.extend({}, d.DEFAULTS, c), this.$trigger = a('[data-toggle="collapse"][href="#' + b.id + '"],[data-toggle="collapse"][data-target="#' + b.id + '"]'), this.transitioning = null, this.options.parent ? this.$parent = this.getParent() : this.addAriaAndCollapsedClass(this.$element, this.$trigger), this.options.toggle && this.toggle();
  };d.VERSION = "3.3.7", d.TRANSITION_DURATION = 350, d.DEFAULTS = { toggle: !0 }, d.prototype.dimension = function () {
    var a = this.$element.hasClass("width");return a ? "width" : "height";
  }, d.prototype.show = function () {
    if (!this.transitioning && !this.$element.hasClass("in")) {
      var b,
          e = this.$parent && this.$parent.children(".panel").children(".in, .collapsing");if (!(e && e.length && (b = e.data("bs.collapse"), b && b.transitioning))) {
        var f = a.Event("show.bs.collapse");if (this.$element.trigger(f), !f.isDefaultPrevented()) {
          e && e.length && (c.call(e, "hide"), b || e.data("bs.collapse", null));var g = this.dimension();this.$element.removeClass("collapse").addClass("collapsing")[g](0).attr("aria-expanded", !0), this.$trigger.removeClass("collapsed").attr("aria-expanded", !0), this.transitioning = 1;var h = function () {
            this.$element.removeClass("collapsing").addClass("collapse in")[g](""), this.transitioning = 0, this.$element.trigger("shown.bs.collapse");
          };if (!a.support.transition) return h.call(this);var i = a.camelCase(["scroll", g].join("-"));this.$element.one("bsTransitionEnd", a.proxy(h, this)).emulateTransitionEnd(d.TRANSITION_DURATION)[g](this.$element[0][i]);
        }
      }
    }
  }, d.prototype.hide = function () {
    if (!this.transitioning && this.$element.hasClass("in")) {
      var b = a.Event("hide.bs.collapse");if (this.$element.trigger(b), !b.isDefaultPrevented()) {
        var c = this.dimension();this.$element[c](this.$element[c]())[0].offsetHeight, this.$element.addClass("collapsing").removeClass("collapse in").attr("aria-expanded", !1), this.$trigger.addClass("collapsed").attr("aria-expanded", !1), this.transitioning = 1;var e = function () {
          this.transitioning = 0, this.$element.removeClass("collapsing").addClass("collapse").trigger("hidden.bs.collapse");
        };return a.support.transition ? void this.$element[c](0).one("bsTransitionEnd", a.proxy(e, this)).emulateTransitionEnd(d.TRANSITION_DURATION) : e.call(this);
      }
    }
  }, d.prototype.toggle = function () {
    this[this.$element.hasClass("in") ? "hide" : "show"]();
  }, d.prototype.getParent = function () {
    return a(this.options.parent).find('[data-toggle="collapse"][data-parent="' + this.options.parent + '"]').each(a.proxy(function (c, d) {
      var e = a(d);this.addAriaAndCollapsedClass(b(e), e);
    }, this)).end();
  }, d.prototype.addAriaAndCollapsedClass = function (a, b) {
    var c = a.hasClass("in");a.attr("aria-expanded", c), b.toggleClass("collapsed", !c).attr("aria-expanded", c);
  };var e = a.fn.collapse;a.fn.collapse = c, a.fn.collapse.Constructor = d, a.fn.collapse.noConflict = function () {
    return a.fn.collapse = e, this;
  }, a(document).on("click.bs.collapse.data-api", '[data-toggle="collapse"]', function (d) {
    var e = a(this);e.attr("data-target") || d.preventDefault();var f = b(e),
        g = f.data("bs.collapse"),
        h = g ? "toggle" : e.data();c.call(f, h);
  });
}(jQuery), +function (a) {
  "use strict";
  function b(b) {
    var c = b.attr("data-target");c || (c = b.attr("href"), c = c && /#[A-Za-z]/.test(c) && c.replace(/.*(?=#[^\s]*$)/, ""));var d = c && a(c);return d && d.length ? d : b.parent();
  }function c(c) {
    c && 3 === c.which || (a(e).remove(), a(f).each(function () {
      var d = a(this),
          e = b(d),
          f = { relatedTarget: this };e.hasClass("open") && (c && "click" == c.type && /input|textarea/i.test(c.target.tagName) && a.contains(e[0], c.target) || (e.trigger(c = a.Event("hide.bs.dropdown", f)), c.isDefaultPrevented() || (d.attr("aria-expanded", "false"), e.removeClass("open").trigger(a.Event("hidden.bs.dropdown", f)))));
    }));
  }function d(b) {
    return this.each(function () {
      var c = a(this),
          d = c.data("bs.dropdown");d || c.data("bs.dropdown", d = new g(this)), "string" == typeof b && d[b].call(c);
    });
  }var e = ".dropdown-backdrop",
      f = '[data-toggle="dropdown"]',
      g = function (b) {
    a(b).on("click.bs.dropdown", this.toggle);
  };g.VERSION = "3.3.7", g.prototype.toggle = function (d) {
    var e = a(this);if (!e.is(".disabled, :disabled")) {
      var f = b(e),
          g = f.hasClass("open");if (c(), !g) {
        "ontouchstart" in document.documentElement && !f.closest(".navbar-nav").length && a(document.createElement("div")).addClass("dropdown-backdrop").insertAfter(a(this)).on("click", c);var h = { relatedTarget: this };if (f.trigger(d = a.Event("show.bs.dropdown", h)), d.isDefaultPrevented()) return;e.trigger("focus").attr("aria-expanded", "true"), f.toggleClass("open").trigger(a.Event("shown.bs.dropdown", h));
      }return !1;
    }
  }, g.prototype.keydown = function (c) {
    if (/(38|40|27|32)/.test(c.which) && !/input|textarea/i.test(c.target.tagName)) {
      var d = a(this);if (c.preventDefault(), c.stopPropagation(), !d.is(".disabled, :disabled")) {
        var e = b(d),
            g = e.hasClass("open");if (!g && 27 != c.which || g && 27 == c.which) return 27 == c.which && e.find(f).trigger("focus"), d.trigger("click");var h = " li:not(.disabled):visible a",
            i = e.find(".dropdown-menu" + h);if (i.length) {
          var j = i.index(c.target);38 == c.which && j > 0 && j--, 40 == c.which && j < i.length - 1 && j++, ~j || (j = 0), i.eq(j).trigger("focus");
        }
      }
    }
  };var h = a.fn.dropdown;a.fn.dropdown = d, a.fn.dropdown.Constructor = g, a.fn.dropdown.noConflict = function () {
    return a.fn.dropdown = h, this;
  }, a(document).on("click.bs.dropdown.data-api", c).on("click.bs.dropdown.data-api", ".dropdown form", function (a) {
    a.stopPropagation();
  }).on("click.bs.dropdown.data-api", f, g.prototype.toggle).on("keydown.bs.dropdown.data-api", f, g.prototype.keydown).on("keydown.bs.dropdown.data-api", ".dropdown-menu", g.prototype.keydown);
}(jQuery), +function (a) {
  "use strict";
  function b(b, d) {
    return this.each(function () {
      var e = a(this),
          f = e.data("bs.modal"),
          g = a.extend({}, c.DEFAULTS, e.data(), "object" == typeof b && b);f || e.data("bs.modal", f = new c(this, g)), "string" == typeof b ? f[b](d) : g.show && f.show(d);
    });
  }var c = function (b, c) {
    this.options = c, this.$body = a(document.body), this.$element = a(b), this.$dialog = this.$element.find(".modal-dialog"), this.$backdrop = null, this.isShown = null, this.originalBodyPad = null, this.scrollbarWidth = 0, this.ignoreBackdropClick = !1, this.options.remote && this.$element.find(".modal-content").load(this.options.remote, a.proxy(function () {
      this.$element.trigger("loaded.bs.modal");
    }, this));
  };c.VERSION = "3.3.7", c.TRANSITION_DURATION = 300, c.BACKDROP_TRANSITION_DURATION = 150, c.DEFAULTS = { backdrop: !0, keyboard: !0, show: !0 }, c.prototype.toggle = function (a) {
    return this.isShown ? this.hide() : this.show(a);
  }, c.prototype.show = function (b) {
    var d = this,
        e = a.Event("show.bs.modal", { relatedTarget: b });this.$element.trigger(e), this.isShown || e.isDefaultPrevented() || (this.isShown = !0, this.checkScrollbar(), this.setScrollbar(), this.$body.addClass("modal-open"), this.escape(), this.resize(), this.$element.on("click.dismiss.bs.modal", '[data-dismiss="modal"]', a.proxy(this.hide, this)), this.$dialog.on("mousedown.dismiss.bs.modal", function () {
      d.$element.one("mouseup.dismiss.bs.modal", function (b) {
        a(b.target).is(d.$element) && (d.ignoreBackdropClick = !0);
      });
    }), this.backdrop(function () {
      var e = a.support.transition && d.$element.hasClass("fade");d.$element.parent().length || d.$element.appendTo(d.$body), d.$element.show().scrollTop(0), d.adjustDialog(), e && d.$element[0].offsetWidth, d.$element.addClass("in"), d.enforceFocus();var f = a.Event("shown.bs.modal", { relatedTarget: b });e ? d.$dialog.one("bsTransitionEnd", function () {
        d.$element.trigger("focus").trigger(f);
      }).emulateTransitionEnd(c.TRANSITION_DURATION) : d.$element.trigger("focus").trigger(f);
    }));
  }, c.prototype.hide = function (b) {
    b && b.preventDefault(), b = a.Event("hide.bs.modal"), this.$element.trigger(b), this.isShown && !b.isDefaultPrevented() && (this.isShown = !1, this.escape(), this.resize(), a(document).off("focusin.bs.modal"), this.$element.removeClass("in").off("click.dismiss.bs.modal").off("mouseup.dismiss.bs.modal"), this.$dialog.off("mousedown.dismiss.bs.modal"), a.support.transition && this.$element.hasClass("fade") ? this.$element.one("bsTransitionEnd", a.proxy(this.hideModal, this)).emulateTransitionEnd(c.TRANSITION_DURATION) : this.hideModal());
  }, c.prototype.enforceFocus = function () {
    a(document).off("focusin.bs.modal").on("focusin.bs.modal", a.proxy(function (a) {
      document === a.target || this.$element[0] === a.target || this.$element.has(a.target).length || this.$element.trigger("focus");
    }, this));
  }, c.prototype.escape = function () {
    this.isShown && this.options.keyboard ? this.$element.on("keydown.dismiss.bs.modal", a.proxy(function (a) {
      27 == a.which && this.hide();
    }, this)) : this.isShown || this.$element.off("keydown.dismiss.bs.modal");
  }, c.prototype.resize = function () {
    this.isShown ? a(window).on("resize.bs.modal", a.proxy(this.handleUpdate, this)) : a(window).off("resize.bs.modal");
  }, c.prototype.hideModal = function () {
    var a = this;this.$element.hide(), this.backdrop(function () {
      a.$body.removeClass("modal-open"), a.resetAdjustments(), a.resetScrollbar(), a.$element.trigger("hidden.bs.modal");
    });
  }, c.prototype.removeBackdrop = function () {
    this.$backdrop && this.$backdrop.remove(), this.$backdrop = null;
  }, c.prototype.backdrop = function (b) {
    var d = this,
        e = this.$element.hasClass("fade") ? "fade" : "";if (this.isShown && this.options.backdrop) {
      var f = a.support.transition && e;if (this.$backdrop = a(document.createElement("div")).addClass("modal-backdrop " + e).appendTo(this.$body), this.$element.on("click.dismiss.bs.modal", a.proxy(function (a) {
        return this.ignoreBackdropClick ? void (this.ignoreBackdropClick = !1) : void (a.target === a.currentTarget && ("static" == this.options.backdrop ? this.$element[0].focus() : this.hide()));
      }, this)), f && this.$backdrop[0].offsetWidth, this.$backdrop.addClass("in"), !b) return;f ? this.$backdrop.one("bsTransitionEnd", b).emulateTransitionEnd(c.BACKDROP_TRANSITION_DURATION) : b();
    } else if (!this.isShown && this.$backdrop) {
      this.$backdrop.removeClass("in");var g = function () {
        d.removeBackdrop(), b && b();
      };a.support.transition && this.$element.hasClass("fade") ? this.$backdrop.one("bsTransitionEnd", g).emulateTransitionEnd(c.BACKDROP_TRANSITION_DURATION) : g();
    } else b && b();
  }, c.prototype.handleUpdate = function () {
    this.adjustDialog();
  }, c.prototype.adjustDialog = function () {
    var a = this.$element[0].scrollHeight > document.documentElement.clientHeight;this.$element.css({ paddingLeft: !this.bodyIsOverflowing && a ? this.scrollbarWidth : "", paddingRight: this.bodyIsOverflowing && !a ? this.scrollbarWidth : "" });
  }, c.prototype.resetAdjustments = function () {
    this.$element.css({ paddingLeft: "", paddingRight: "" });
  }, c.prototype.checkScrollbar = function () {
    var a = window.innerWidth;if (!a) {
      var b = document.documentElement.getBoundingClientRect();a = b.right - Math.abs(b.left);
    }this.bodyIsOverflowing = document.body.clientWidth < a, this.scrollbarWidth = this.measureScrollbar();
  }, c.prototype.setScrollbar = function () {
    var a = parseInt(this.$body.css("padding-right") || 0, 10);this.originalBodyPad = document.body.style.paddingRight || "", this.bodyIsOverflowing && this.$body.css("padding-right", a + this.scrollbarWidth);
  }, c.prototype.resetScrollbar = function () {
    this.$body.css("padding-right", this.originalBodyPad);
  }, c.prototype.measureScrollbar = function () {
    var a = document.createElement("div");a.className = "modal-scrollbar-measure", this.$body.append(a);var b = a.offsetWidth - a.clientWidth;return this.$body[0].removeChild(a), b;
  };var d = a.fn.modal;a.fn.modal = b, a.fn.modal.Constructor = c, a.fn.modal.noConflict = function () {
    return a.fn.modal = d, this;
  }, a(document).on("click.bs.modal.data-api", '[data-toggle="modal"]', function (c) {
    var d = a(this),
        e = d.attr("href"),
        f = a(d.attr("data-target") || e && e.replace(/.*(?=#[^\s]+$)/, "")),
        g = f.data("bs.modal") ? "toggle" : a.extend({ remote: !/#/.test(e) && e }, f.data(), d.data());d.is("a") && c.preventDefault(), f.one("show.bs.modal", function (a) {
      a.isDefaultPrevented() || f.one("hidden.bs.modal", function () {
        d.is(":visible") && d.trigger("focus");
      });
    }), b.call(f, g, this);
  });
}(jQuery), +function (a) {
  "use strict";
  function b(b) {
    return this.each(function () {
      var d = a(this),
          e = d.data("bs.tooltip"),
          f = "object" == typeof b && b;!e && /destroy|hide/.test(b) || (e || d.data("bs.tooltip", e = new c(this, f)), "string" == typeof b && e[b]());
    });
  }var c = function (a, b) {
    this.type = null, this.options = null, this.enabled = null, this.timeout = null, this.hoverState = null, this.$element = null, this.inState = null, this.init("tooltip", a, b);
  };c.VERSION = "3.3.7", c.TRANSITION_DURATION = 150, c.DEFAULTS = { animation: !0, placement: "top", selector: !1, template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>', trigger: "hover focus", title: "", delay: 0, html: !1, container: !1, viewport: { selector: "body", padding: 0 } }, c.prototype.init = function (b, c, d) {
    if (this.enabled = !0, this.type = b, this.$element = a(c), this.options = this.getOptions(d), this.$viewport = this.options.viewport && a(a.isFunction(this.options.viewport) ? this.options.viewport.call(this, this.$element) : this.options.viewport.selector || this.options.viewport), this.inState = { click: !1, hover: !1, focus: !1 }, this.$element[0] instanceof document.constructor && !this.options.selector) throw new Error("`selector` option must be specified when initializing " + this.type + " on the window.document object!");for (var e = this.options.trigger.split(" "), f = e.length; f--;) {
      var g = e[f];if ("click" == g) this.$element.on("click." + this.type, this.options.selector, a.proxy(this.toggle, this));else if ("manual" != g) {
        var h = "hover" == g ? "mouseenter" : "focusin",
            i = "hover" == g ? "mouseleave" : "focusout";this.$element.on(h + "." + this.type, this.options.selector, a.proxy(this.enter, this)), this.$element.on(i + "." + this.type, this.options.selector, a.proxy(this.leave, this));
      }
    }this.options.selector ? this._options = a.extend({}, this.options, { trigger: "manual", selector: "" }) : this.fixTitle();
  }, c.prototype.getDefaults = function () {
    return c.DEFAULTS;
  }, c.prototype.getOptions = function (b) {
    return b = a.extend({}, this.getDefaults(), this.$element.data(), b), b.delay && "number" == typeof b.delay && (b.delay = { show: b.delay, hide: b.delay }), b;
  }, c.prototype.getDelegateOptions = function () {
    var b = {},
        c = this.getDefaults();return this._options && a.each(this._options, function (a, d) {
      c[a] != d && (b[a] = d);
    }), b;
  }, c.prototype.enter = function (b) {
    var c = b instanceof this.constructor ? b : a(b.currentTarget).data("bs." + this.type);return c || (c = new this.constructor(b.currentTarget, this.getDelegateOptions()), a(b.currentTarget).data("bs." + this.type, c)), b instanceof a.Event && (c.inState["focusin" == b.type ? "focus" : "hover"] = !0), c.tip().hasClass("in") || "in" == c.hoverState ? void (c.hoverState = "in") : (clearTimeout(c.timeout), c.hoverState = "in", c.options.delay && c.options.delay.show ? void (c.timeout = setTimeout(function () {
      "in" == c.hoverState && c.show();
    }, c.options.delay.show)) : c.show());
  }, c.prototype.isInStateTrue = function () {
    for (var a in this.inState) if (this.inState[a]) return !0;return !1;
  }, c.prototype.leave = function (b) {
    var c = b instanceof this.constructor ? b : a(b.currentTarget).data("bs." + this.type);if (c || (c = new this.constructor(b.currentTarget, this.getDelegateOptions()), a(b.currentTarget).data("bs." + this.type, c)), b instanceof a.Event && (c.inState["focusout" == b.type ? "focus" : "hover"] = !1), !c.isInStateTrue()) return clearTimeout(c.timeout), c.hoverState = "out", c.options.delay && c.options.delay.hide ? void (c.timeout = setTimeout(function () {
      "out" == c.hoverState && c.hide();
    }, c.options.delay.hide)) : c.hide();
  }, c.prototype.show = function () {
    var b = a.Event("show.bs." + this.type);if (this.hasContent() && this.enabled) {
      this.$element.trigger(b);var d = a.contains(this.$element[0].ownerDocument.documentElement, this.$element[0]);if (b.isDefaultPrevented() || !d) return;var e = this,
          f = this.tip(),
          g = this.getUID(this.type);this.setContent(), f.attr("id", g), this.$element.attr("aria-describedby", g), this.options.animation && f.addClass("fade");var h = "function" == typeof this.options.placement ? this.options.placement.call(this, f[0], this.$element[0]) : this.options.placement,
          i = /\s?auto?\s?/i,
          j = i.test(h);j && (h = h.replace(i, "") || "top"), f.detach().css({ top: 0, left: 0, display: "block" }).addClass(h).data("bs." + this.type, this), this.options.container ? f.appendTo(this.options.container) : f.insertAfter(this.$element), this.$element.trigger("inserted.bs." + this.type);var k = this.getPosition(),
          l = f[0].offsetWidth,
          m = f[0].offsetHeight;if (j) {
        var n = h,
            o = this.getPosition(this.$viewport);h = "bottom" == h && k.bottom + m > o.bottom ? "top" : "top" == h && k.top - m < o.top ? "bottom" : "right" == h && k.right + l > o.width ? "left" : "left" == h && k.left - l < o.left ? "right" : h, f.removeClass(n).addClass(h);
      }var p = this.getCalculatedOffset(h, k, l, m);this.applyPlacement(p, h);var q = function () {
        var a = e.hoverState;e.$element.trigger("shown.bs." + e.type), e.hoverState = null, "out" == a && e.leave(e);
      };a.support.transition && this.$tip.hasClass("fade") ? f.one("bsTransitionEnd", q).emulateTransitionEnd(c.TRANSITION_DURATION) : q();
    }
  }, c.prototype.applyPlacement = function (b, c) {
    var d = this.tip(),
        e = d[0].offsetWidth,
        f = d[0].offsetHeight,
        g = parseInt(d.css("margin-top"), 10),
        h = parseInt(d.css("margin-left"), 10);isNaN(g) && (g = 0), isNaN(h) && (h = 0), b.top += g, b.left += h, a.offset.setOffset(d[0], a.extend({ using: function (a) {
        d.css({ top: Math.round(a.top), left: Math.round(a.left) });
      } }, b), 0), d.addClass("in");var i = d[0].offsetWidth,
        j = d[0].offsetHeight;"top" == c && j != f && (b.top = b.top + f - j);var k = this.getViewportAdjustedDelta(c, b, i, j);k.left ? b.left += k.left : b.top += k.top;var l = /top|bottom/.test(c),
        m = l ? 2 * k.left - e + i : 2 * k.top - f + j,
        n = l ? "offsetWidth" : "offsetHeight";d.offset(b), this.replaceArrow(m, d[0][n], l);
  }, c.prototype.replaceArrow = function (a, b, c) {
    this.arrow().css(c ? "left" : "top", 50 * (1 - a / b) + "%").css(c ? "top" : "left", "");
  }, c.prototype.setContent = function () {
    var a = this.tip(),
        b = this.getTitle();a.find(".tooltip-inner")[this.options.html ? "html" : "text"](b), a.removeClass("fade in top bottom left right");
  }, c.prototype.hide = function (b) {
    function d() {
      "in" != e.hoverState && f.detach(), e.$element && e.$element.removeAttr("aria-describedby").trigger("hidden.bs." + e.type), b && b();
    }var e = this,
        f = a(this.$tip),
        g = a.Event("hide.bs." + this.type);if (this.$element.trigger(g), !g.isDefaultPrevented()) return f.removeClass("in"), a.support.transition && f.hasClass("fade") ? f.one("bsTransitionEnd", d).emulateTransitionEnd(c.TRANSITION_DURATION) : d(), this.hoverState = null, this;
  }, c.prototype.fixTitle = function () {
    var a = this.$element;(a.attr("title") || "string" != typeof a.attr("data-original-title")) && a.attr("data-original-title", a.attr("title") || "").attr("title", "");
  }, c.prototype.hasContent = function () {
    return this.getTitle();
  }, c.prototype.getPosition = function (b) {
    b = b || this.$element;var c = b[0],
        d = "BODY" == c.tagName,
        e = c.getBoundingClientRect();null == e.width && (e = a.extend({}, e, { width: e.right - e.left, height: e.bottom - e.top }));var f = window.SVGElement && c instanceof window.SVGElement,
        g = d ? { top: 0, left: 0 } : f ? null : b.offset(),
        h = { scroll: d ? document.documentElement.scrollTop || document.body.scrollTop : b.scrollTop() },
        i = d ? { width: a(window).width(), height: a(window).height() } : null;return a.extend({}, e, h, i, g);
  }, c.prototype.getCalculatedOffset = function (a, b, c, d) {
    return "bottom" == a ? { top: b.top + b.height, left: b.left + b.width / 2 - c / 2 } : "top" == a ? { top: b.top - d, left: b.left + b.width / 2 - c / 2 } : "left" == a ? { top: b.top + b.height / 2 - d / 2, left: b.left - c } : { top: b.top + b.height / 2 - d / 2, left: b.left + b.width };
  }, c.prototype.getViewportAdjustedDelta = function (a, b, c, d) {
    var e = { top: 0, left: 0 };if (!this.$viewport) return e;var f = this.options.viewport && this.options.viewport.padding || 0,
        g = this.getPosition(this.$viewport);if (/right|left/.test(a)) {
      var h = b.top - f - g.scroll,
          i = b.top + f - g.scroll + d;h < g.top ? e.top = g.top - h : i > g.top + g.height && (e.top = g.top + g.height - i);
    } else {
      var j = b.left - f,
          k = b.left + f + c;j < g.left ? e.left = g.left - j : k > g.right && (e.left = g.left + g.width - k);
    }return e;
  }, c.prototype.getTitle = function () {
    var a,
        b = this.$element,
        c = this.options;return a = b.attr("data-original-title") || ("function" == typeof c.title ? c.title.call(b[0]) : c.title);
  }, c.prototype.getUID = function (a) {
    do a += ~~(1e6 * Math.random()); while (document.getElementById(a));return a;
  }, c.prototype.tip = function () {
    if (!this.$tip && (this.$tip = a(this.options.template), 1 != this.$tip.length)) throw new Error(this.type + " `template` option must consist of exactly 1 top-level element!");return this.$tip;
  }, c.prototype.arrow = function () {
    return this.$arrow = this.$arrow || this.tip().find(".tooltip-arrow");
  }, c.prototype.enable = function () {
    this.enabled = !0;
  }, c.prototype.disable = function () {
    this.enabled = !1;
  }, c.prototype.toggleEnabled = function () {
    this.enabled = !this.enabled;
  }, c.prototype.toggle = function (b) {
    var c = this;b && (c = a(b.currentTarget).data("bs." + this.type), c || (c = new this.constructor(b.currentTarget, this.getDelegateOptions()), a(b.currentTarget).data("bs." + this.type, c))), b ? (c.inState.click = !c.inState.click, c.isInStateTrue() ? c.enter(c) : c.leave(c)) : c.tip().hasClass("in") ? c.leave(c) : c.enter(c);
  }, c.prototype.destroy = function () {
    var a = this;clearTimeout(this.timeout), this.hide(function () {
      a.$element.off("." + a.type).removeData("bs." + a.type), a.$tip && a.$tip.detach(), a.$tip = null, a.$arrow = null, a.$viewport = null, a.$element = null;
    });
  };var d = a.fn.tooltip;a.fn.tooltip = b, a.fn.tooltip.Constructor = c, a.fn.tooltip.noConflict = function () {
    return a.fn.tooltip = d, this;
  };
}(jQuery), +function (a) {
  "use strict";
  function b(b) {
    return this.each(function () {
      var d = a(this),
          e = d.data("bs.popover"),
          f = "object" == typeof b && b;!e && /destroy|hide/.test(b) || (e || d.data("bs.popover", e = new c(this, f)), "string" == typeof b && e[b]());
    });
  }var c = function (a, b) {
    this.init("popover", a, b);
  };if (!a.fn.tooltip) throw new Error("Popover requires tooltip.js");c.VERSION = "3.3.7", c.DEFAULTS = a.extend({}, a.fn.tooltip.Constructor.DEFAULTS, { placement: "right", trigger: "click", content: "", template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>' }), c.prototype = a.extend({}, a.fn.tooltip.Constructor.prototype), c.prototype.constructor = c, c.prototype.getDefaults = function () {
    return c.DEFAULTS;
  }, c.prototype.setContent = function () {
    var a = this.tip(),
        b = this.getTitle(),
        c = this.getContent();a.find(".popover-title")[this.options.html ? "html" : "text"](b), a.find(".popover-content").children().detach().end()[this.options.html ? "string" == typeof c ? "html" : "append" : "text"](c), a.removeClass("fade top bottom left right in"), a.find(".popover-title").html() || a.find(".popover-title").hide();
  }, c.prototype.hasContent = function () {
    return this.getTitle() || this.getContent();
  }, c.prototype.getContent = function () {
    var a = this.$element,
        b = this.options;return a.attr("data-content") || ("function" == typeof b.content ? b.content.call(a[0]) : b.content);
  }, c.prototype.arrow = function () {
    return this.$arrow = this.$arrow || this.tip().find(".arrow");
  };var d = a.fn.popover;a.fn.popover = b, a.fn.popover.Constructor = c, a.fn.popover.noConflict = function () {
    return a.fn.popover = d, this;
  };
}(jQuery), +function (a) {
  "use strict";
  function b(c, d) {
    this.$body = a(document.body), this.$scrollElement = a(a(c).is(document.body) ? window : c), this.options = a.extend({}, b.DEFAULTS, d), this.selector = (this.options.target || "") + " .nav li > a", this.offsets = [], this.targets = [], this.activeTarget = null, this.scrollHeight = 0, this.$scrollElement.on("scroll.bs.scrollspy", a.proxy(this.process, this)), this.refresh(), this.process();
  }function c(c) {
    return this.each(function () {
      var d = a(this),
          e = d.data("bs.scrollspy"),
          f = "object" == typeof c && c;e || d.data("bs.scrollspy", e = new b(this, f)), "string" == typeof c && e[c]();
    });
  }b.VERSION = "3.3.7", b.DEFAULTS = { offset: 10 }, b.prototype.getScrollHeight = function () {
    return this.$scrollElement[0].scrollHeight || Math.max(this.$body[0].scrollHeight, document.documentElement.scrollHeight);
  }, b.prototype.refresh = function () {
    var b = this,
        c = "offset",
        d = 0;this.offsets = [], this.targets = [], this.scrollHeight = this.getScrollHeight(), a.isWindow(this.$scrollElement[0]) || (c = "position", d = this.$scrollElement.scrollTop()), this.$body.find(this.selector).map(function () {
      var b = a(this),
          e = b.data("target") || b.attr("href"),
          f = /^#./.test(e) && a(e);return f && f.length && f.is(":visible") && [[f[c]().top + d, e]] || null;
    }).sort(function (a, b) {
      return a[0] - b[0];
    }).each(function () {
      b.offsets.push(this[0]), b.targets.push(this[1]);
    });
  }, b.prototype.process = function () {
    var a,
        b = this.$scrollElement.scrollTop() + this.options.offset,
        c = this.getScrollHeight(),
        d = this.options.offset + c - this.$scrollElement.height(),
        e = this.offsets,
        f = this.targets,
        g = this.activeTarget;if (this.scrollHeight != c && this.refresh(), b >= d) return g != (a = f[f.length - 1]) && this.activate(a);if (g && b < e[0]) return this.activeTarget = null, this.clear();for (a = e.length; a--;) g != f[a] && b >= e[a] && (void 0 === e[a + 1] || b < e[a + 1]) && this.activate(f[a]);
  }, b.prototype.activate = function (b) {
    this.activeTarget = b, this.clear();var c = this.selector + '[data-target="' + b + '"],' + this.selector + '[href="' + b + '"]',
        d = a(c).parents("li").addClass("active");d.parent(".dropdown-menu").length && (d = d.closest("li.dropdown").addClass("active")), d.trigger("activate.bs.scrollspy");
  }, b.prototype.clear = function () {
    a(this.selector).parentsUntil(this.options.target, ".active").removeClass("active");
  };var d = a.fn.scrollspy;a.fn.scrollspy = c, a.fn.scrollspy.Constructor = b, a.fn.scrollspy.noConflict = function () {
    return a.fn.scrollspy = d, this;
  }, a(window).on("load.bs.scrollspy.data-api", function () {
    a('[data-spy="scroll"]').each(function () {
      var b = a(this);c.call(b, b.data());
    });
  });
}(jQuery), +function (a) {
  "use strict";
  function b(b) {
    return this.each(function () {
      var d = a(this),
          e = d.data("bs.tab");e || d.data("bs.tab", e = new c(this)), "string" == typeof b && e[b]();
    });
  }var c = function (b) {
    this.element = a(b);
  };c.VERSION = "3.3.7", c.TRANSITION_DURATION = 150, c.prototype.show = function () {
    var b = this.element,
        c = b.closest("ul:not(.dropdown-menu)"),
        d = b.data("target");if (d || (d = b.attr("href"), d = d && d.replace(/.*(?=#[^\s]*$)/, "")), !b.parent("li").hasClass("active")) {
      var e = c.find(".active:last a"),
          f = a.Event("hide.bs.tab", { relatedTarget: b[0] }),
          g = a.Event("show.bs.tab", { relatedTarget: e[0] });if (e.trigger(f), b.trigger(g), !g.isDefaultPrevented() && !f.isDefaultPrevented()) {
        var h = a(d);this.activate(b.closest("li"), c), this.activate(h, h.parent(), function () {
          e.trigger({ type: "hidden.bs.tab", relatedTarget: b[0] }), b.trigger({ type: "shown.bs.tab", relatedTarget: e[0] });
        });
      }
    }
  }, c.prototype.activate = function (b, d, e) {
    function f() {
      g.removeClass("active").find("> .dropdown-menu > .active").removeClass("active").end().find('[data-toggle="tab"]').attr("aria-expanded", !1), b.addClass("active").find('[data-toggle="tab"]').attr("aria-expanded", !0), h ? (b[0].offsetWidth, b.addClass("in")) : b.removeClass("fade"), b.parent(".dropdown-menu").length && b.closest("li.dropdown").addClass("active").end().find('[data-toggle="tab"]').attr("aria-expanded", !0), e && e();
    }var g = d.find("> .active"),
        h = e && a.support.transition && (g.length && g.hasClass("fade") || !!d.find("> .fade").length);g.length && h ? g.one("bsTransitionEnd", f).emulateTransitionEnd(c.TRANSITION_DURATION) : f(), g.removeClass("in");
  };var d = a.fn.tab;a.fn.tab = b, a.fn.tab.Constructor = c, a.fn.tab.noConflict = function () {
    return a.fn.tab = d, this;
  };var e = function (c) {
    c.preventDefault(), b.call(a(this), "show");
  };a(document).on("click.bs.tab.data-api", '[data-toggle="tab"]', e).on("click.bs.tab.data-api", '[data-toggle="pill"]', e);
}(jQuery), +function (a) {
  "use strict";
  function b(b) {
    return this.each(function () {
      var d = a(this),
          e = d.data("bs.affix"),
          f = "object" == typeof b && b;e || d.data("bs.affix", e = new c(this, f)), "string" == typeof b && e[b]();
    });
  }var c = function (b, d) {
    this.options = a.extend({}, c.DEFAULTS, d), this.$target = a(this.options.target).on("scroll.bs.affix.data-api", a.proxy(this.checkPosition, this)).on("click.bs.affix.data-api", a.proxy(this.checkPositionWithEventLoop, this)), this.$element = a(b), this.affixed = null, this.unpin = null, this.pinnedOffset = null, this.checkPosition();
  };c.VERSION = "3.3.7", c.RESET = "affix affix-top affix-bottom", c.DEFAULTS = { offset: 0, target: window }, c.prototype.getState = function (a, b, c, d) {
    var e = this.$target.scrollTop(),
        f = this.$element.offset(),
        g = this.$target.height();if (null != c && "top" == this.affixed) return e < c && "top";if ("bottom" == this.affixed) return null != c ? !(e + this.unpin <= f.top) && "bottom" : !(e + g <= a - d) && "bottom";var h = null == this.affixed,
        i = h ? e : f.top,
        j = h ? g : b;return null != c && e <= c ? "top" : null != d && i + j >= a - d && "bottom";
  }, c.prototype.getPinnedOffset = function () {
    if (this.pinnedOffset) return this.pinnedOffset;this.$element.removeClass(c.RESET).addClass("affix");var a = this.$target.scrollTop(),
        b = this.$element.offset();return this.pinnedOffset = b.top - a;
  }, c.prototype.checkPositionWithEventLoop = function () {
    setTimeout(a.proxy(this.checkPosition, this), 1);
  }, c.prototype.checkPosition = function () {
    if (this.$element.is(":visible")) {
      var b = this.$element.height(),
          d = this.options.offset,
          e = d.top,
          f = d.bottom,
          g = Math.max(a(document).height(), a(document.body).height());"object" != typeof d && (f = e = d), "function" == typeof e && (e = d.top(this.$element)), "function" == typeof f && (f = d.bottom(this.$element));var h = this.getState(g, b, e, f);if (this.affixed != h) {
        null != this.unpin && this.$element.css("top", "");var i = "affix" + (h ? "-" + h : ""),
            j = a.Event(i + ".bs.affix");if (this.$element.trigger(j), j.isDefaultPrevented()) return;this.affixed = h, this.unpin = "bottom" == h ? this.getPinnedOffset() : null, this.$element.removeClass(c.RESET).addClass(i).trigger(i.replace("affix", "affixed") + ".bs.affix");
      }"bottom" == h && this.$element.offset({ top: g - b - f });
    }
  };var d = a.fn.affix;a.fn.affix = b, a.fn.affix.Constructor = c, a.fn.affix.noConflict = function () {
    return a.fn.affix = d, this;
  }, a(window).on("load", function () {
    a('[data-spy="affix"]').each(function () {
      var c = a(this),
          d = c.data();d.offset = d.offset || {}, null != d.offsetBottom && (d.offset.bottom = d.offsetBottom), null != d.offsetTop && (d.offset.top = d.offsetTop), b.call(c, d);
    });
  });
}(jQuery);
/**
* @preserve HTML5 Shiv 3.7.3 | @afarkas @jdalton @jon_neal @rem | MIT/GPL2 Licensed
*/
!function (a, b) {
  function c(a, b) {
    var c = a.createElement("p"),
        d = a.getElementsByTagName("head")[0] || a.documentElement;return c.innerHTML = "x<style>" + b + "</style>", d.insertBefore(c.lastChild, d.firstChild);
  }function d() {
    var a = t.elements;return "string" == typeof a ? a.split(" ") : a;
  }function e(a, b) {
    var c = t.elements;"string" != typeof c && (c = c.join(" ")), "string" != typeof a && (a = a.join(" ")), t.elements = c + " " + a, j(b);
  }function f(a) {
    var b = s[a[q]];return b || (b = {}, r++, a[q] = r, s[r] = b), b;
  }function g(a, c, d) {
    if (c || (c = b), l) return c.createElement(a);d || (d = f(c));var e;return e = d.cache[a] ? d.cache[a].cloneNode() : p.test(a) ? (d.cache[a] = d.createElem(a)).cloneNode() : d.createElem(a), !e.canHaveChildren || o.test(a) || e.tagUrn ? e : d.frag.appendChild(e);
  }function h(a, c) {
    if (a || (a = b), l) return a.createDocumentFragment();c = c || f(a);for (var e = c.frag.cloneNode(), g = 0, h = d(), i = h.length; i > g; g++) e.createElement(h[g]);return e;
  }function i(a, b) {
    b.cache || (b.cache = {}, b.createElem = a.createElement, b.createFrag = a.createDocumentFragment, b.frag = b.createFrag()), a.createElement = function (c) {
      return t.shivMethods ? g(c, a, b) : b.createElem(c);
    }, a.createDocumentFragment = Function("h,f", "return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&(" + d().join().replace(/[\w\-:]+/g, function (a) {
      return b.createElem(a), b.frag.createElement(a), 'c("' + a + '")';
    }) + ");return n}")(t, b.frag);
  }function j(a) {
    a || (a = b);var d = f(a);return !t.shivCSS || k || d.hasCSS || (d.hasCSS = !!c(a, "article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}mark{background:#FF0;color:#000}template{display:none}")), l || i(a, d), a;
  }var k,
      l,
      m = "3.7.3",
      n = a.html5 || {},
      o = /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,
      p = /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,
      q = "_html5shiv",
      r = 0,
      s = {};!function () {
    try {
      var a = b.createElement("a");a.innerHTML = "<xyz></xyz>", k = "hidden" in a, l = 1 == a.childNodes.length || function () {
        b.createElement("a");var a = b.createDocumentFragment();return "undefined" == typeof a.cloneNode || "undefined" == typeof a.createDocumentFragment || "undefined" == typeof a.createElement;
      }();
    } catch (c) {
      k = !0, l = !0;
    }
  }();var t = { elements: n.elements || "abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output picture progress section summary template time video", version: m, shivCSS: n.shivCSS !== !1, supportsUnknownElements: l, shivMethods: n.shivMethods !== !1, type: "default", shivDocument: j, createElement: g, createDocumentFragment: h, addElements: e };a.html5 = t, j(b), "object" == typeof module && module.exports && (module.exports = t);
}("undefined" != typeof window ? window : this, document);
/*! jQuery v1.11.1 | (c) 2005, 2014 jQuery Foundation, Inc. | jquery.org/license */
!function (a, b) {
  "object" == typeof module && "object" == typeof module.exports ? module.exports = a.document ? b(a, !0) : function (a) {
    if (!a.document) throw new Error("jQuery requires a window with a document");return b(a);
  } : b(a);
}("undefined" != typeof window ? window : this, function (a, b) {
  var c = [],
      d = c.slice,
      e = c.concat,
      f = c.push,
      g = c.indexOf,
      h = {},
      i = h.toString,
      j = h.hasOwnProperty,
      k = {},
      l = "1.11.1",
      m = function (a, b) {
    return new m.fn.init(a, b);
  },
      n = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
      o = /^-ms-/,
      p = /-([\da-z])/gi,
      q = function (a, b) {
    return b.toUpperCase();
  };m.fn = m.prototype = { jquery: l, constructor: m, selector: "", length: 0, toArray: function () {
      return d.call(this);
    }, get: function (a) {
      return null != a ? 0 > a ? this[a + this.length] : this[a] : d.call(this);
    }, pushStack: function (a) {
      var b = m.merge(this.constructor(), a);return b.prevObject = this, b.context = this.context, b;
    }, each: function (a, b) {
      return m.each(this, a, b);
    }, map: function (a) {
      return this.pushStack(m.map(this, function (b, c) {
        return a.call(b, c, b);
      }));
    }, slice: function () {
      return this.pushStack(d.apply(this, arguments));
    }, first: function () {
      return this.eq(0);
    }, last: function () {
      return this.eq(-1);
    }, eq: function (a) {
      var b = this.length,
          c = +a + (0 > a ? b : 0);return this.pushStack(c >= 0 && b > c ? [this[c]] : []);
    }, end: function () {
      return this.prevObject || this.constructor(null);
    }, push: f, sort: c.sort, splice: c.splice }, m.extend = m.fn.extend = function () {
    var a,
        b,
        c,
        d,
        e,
        f,
        g = arguments[0] || {},
        h = 1,
        i = arguments.length,
        j = !1;for ("boolean" == typeof g && (j = g, g = arguments[h] || {}, h++), "object" == typeof g || m.isFunction(g) || (g = {}), h === i && (g = this, h--); i > h; h++) if (null != (e = arguments[h])) for (d in e) a = g[d], c = e[d], g !== c && (j && c && (m.isPlainObject(c) || (b = m.isArray(c))) ? (b ? (b = !1, f = a && m.isArray(a) ? a : []) : f = a && m.isPlainObject(a) ? a : {}, g[d] = m.extend(j, f, c)) : void 0 !== c && (g[d] = c));return g;
  }, m.extend({ expando: "jQuery" + (l + Math.random()).replace(/\D/g, ""), isReady: !0, error: function (a) {
      throw new Error(a);
    }, noop: function () {}, isFunction: function (a) {
      return "function" === m.type(a);
    }, isArray: Array.isArray || function (a) {
      return "array" === m.type(a);
    }, isWindow: function (a) {
      return null != a && a == a.window;
    }, isNumeric: function (a) {
      return !m.isArray(a) && a - parseFloat(a) >= 0;
    }, isEmptyObject: function (a) {
      var b;for (b in a) return !1;return !0;
    }, isPlainObject: function (a) {
      var b;if (!a || "object" !== m.type(a) || a.nodeType || m.isWindow(a)) return !1;try {
        if (a.constructor && !j.call(a, "constructor") && !j.call(a.constructor.prototype, "isPrototypeOf")) return !1;
      } catch (c) {
        return !1;
      }if (k.ownLast) for (b in a) return j.call(a, b);for (b in a);return void 0 === b || j.call(a, b);
    }, type: function (a) {
      return null == a ? a + "" : "object" == typeof a || "function" == typeof a ? h[i.call(a)] || "object" : typeof a;
    }, globalEval: function (b) {
      b && m.trim(b) && (a.execScript || function (b) {
        a.eval.call(a, b);
      })(b);
    }, camelCase: function (a) {
      return a.replace(o, "ms-").replace(p, q);
    }, nodeName: function (a, b) {
      return a.nodeName && a.nodeName.toLowerCase() === b.toLowerCase();
    }, each: function (a, b, c) {
      var d,
          e = 0,
          f = a.length,
          g = r(a);if (c) {
        if (g) {
          for (; f > e; e++) if (d = b.apply(a[e], c), d === !1) break;
        } else for (e in a) if (d = b.apply(a[e], c), d === !1) break;
      } else if (g) {
        for (; f > e; e++) if (d = b.call(a[e], e, a[e]), d === !1) break;
      } else for (e in a) if (d = b.call(a[e], e, a[e]), d === !1) break;return a;
    }, trim: function (a) {
      return null == a ? "" : (a + "").replace(n, "");
    }, makeArray: function (a, b) {
      var c = b || [];return null != a && (r(Object(a)) ? m.merge(c, "string" == typeof a ? [a] : a) : f.call(c, a)), c;
    }, inArray: function (a, b, c) {
      var d;if (b) {
        if (g) return g.call(b, a, c);for (d = b.length, c = c ? 0 > c ? Math.max(0, d + c) : c : 0; d > c; c++) if (c in b && b[c] === a) return c;
      }return -1;
    }, merge: function (a, b) {
      var c = +b.length,
          d = 0,
          e = a.length;while (c > d) a[e++] = b[d++];if (c !== c) while (void 0 !== b[d]) a[e++] = b[d++];return a.length = e, a;
    }, grep: function (a, b, c) {
      for (var d, e = [], f = 0, g = a.length, h = !c; g > f; f++) d = !b(a[f], f), d !== h && e.push(a[f]);return e;
    }, map: function (a, b, c) {
      var d,
          f = 0,
          g = a.length,
          h = r(a),
          i = [];if (h) for (; g > f; f++) d = b(a[f], f, c), null != d && i.push(d);else for (f in a) d = b(a[f], f, c), null != d && i.push(d);return e.apply([], i);
    }, guid: 1, proxy: function (a, b) {
      var c, e, f;return "string" == typeof b && (f = a[b], b = a, a = f), m.isFunction(a) ? (c = d.call(arguments, 2), e = function () {
        return a.apply(b || this, c.concat(d.call(arguments)));
      }, e.guid = a.guid = a.guid || m.guid++, e) : void 0;
    }, now: function () {
      return +new Date();
    }, support: k }), m.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function (a, b) {
    h["[object " + b + "]"] = b.toLowerCase();
  });function r(a) {
    var b = a.length,
        c = m.type(a);return "function" === c || m.isWindow(a) ? !1 : 1 === a.nodeType && b ? !0 : "array" === c || 0 === b || "number" == typeof b && b > 0 && b - 1 in a;
  }var s = function (a) {
    var b,
        c,
        d,
        e,
        f,
        g,
        h,
        i,
        j,
        k,
        l,
        m,
        n,
        o,
        p,
        q,
        r,
        s,
        t,
        u = "sizzle" + -new Date(),
        v = a.document,
        w = 0,
        x = 0,
        y = gb(),
        z = gb(),
        A = gb(),
        B = function (a, b) {
      return a === b && (l = !0), 0;
    },
        C = "undefined",
        D = 1 << 31,
        E = {}.hasOwnProperty,
        F = [],
        G = F.pop,
        H = F.push,
        I = F.push,
        J = F.slice,
        K = F.indexOf || function (a) {
      for (var b = 0, c = this.length; c > b; b++) if (this[b] === a) return b;return -1;
    },
        L = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",
        M = "[\\x20\\t\\r\\n\\f]",
        N = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",
        O = N.replace("w", "w#"),
        P = "\\[" + M + "*(" + N + ")(?:" + M + "*([*^$|!~]?=)" + M + "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + O + "))|)" + M + "*\\]",
        Q = ":(" + N + ")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|" + P + ")*)|.*)\\)|)",
        R = new RegExp("^" + M + "+|((?:^|[^\\\\])(?:\\\\.)*)" + M + "+$", "g"),
        S = new RegExp("^" + M + "*," + M + "*"),
        T = new RegExp("^" + M + "*([>+~]|" + M + ")" + M + "*"),
        U = new RegExp("=" + M + "*([^\\]'\"]*?)" + M + "*\\]", "g"),
        V = new RegExp(Q),
        W = new RegExp("^" + O + "$"),
        X = { ID: new RegExp("^#(" + N + ")"), CLASS: new RegExp("^\\.(" + N + ")"), TAG: new RegExp("^(" + N.replace("w", "w*") + ")"), ATTR: new RegExp("^" + P), PSEUDO: new RegExp("^" + Q), CHILD: new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + M + "*(even|odd|(([+-]|)(\\d*)n|)" + M + "*(?:([+-]|)" + M + "*(\\d+)|))" + M + "*\\)|)", "i"), bool: new RegExp("^(?:" + L + ")$", "i"), needsContext: new RegExp("^" + M + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + M + "*((?:-\\d)?\\d*)" + M + "*\\)|)(?=[^-]|$)", "i") },
        Y = /^(?:input|select|textarea|button)$/i,
        Z = /^h\d$/i,
        $ = /^[^{]+\{\s*\[native \w/,
        _ = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
        ab = /[+~]/,
        bb = /'|\\/g,
        cb = new RegExp("\\\\([\\da-f]{1,6}" + M + "?|(" + M + ")|.)", "ig"),
        db = function (a, b, c) {
      var d = "0x" + b - 65536;return d !== d || c ? b : 0 > d ? String.fromCharCode(d + 65536) : String.fromCharCode(d >> 10 | 55296, 1023 & d | 56320);
    };try {
      I.apply(F = J.call(v.childNodes), v.childNodes), F[v.childNodes.length].nodeType;
    } catch (eb) {
      I = { apply: F.length ? function (a, b) {
          H.apply(a, J.call(b));
        } : function (a, b) {
          var c = a.length,
              d = 0;while (a[c++] = b[d++]);a.length = c - 1;
        } };
    }function fb(a, b, d, e) {
      var f, h, j, k, l, o, r, s, w, x;if ((b ? b.ownerDocument || b : v) !== n && m(b), b = b || n, d = d || [], !a || "string" != typeof a) return d;if (1 !== (k = b.nodeType) && 9 !== k) return [];if (p && !e) {
        if (f = _.exec(a)) if (j = f[1]) {
          if (9 === k) {
            if (h = b.getElementById(j), !h || !h.parentNode) return d;if (h.id === j) return d.push(h), d;
          } else if (b.ownerDocument && (h = b.ownerDocument.getElementById(j)) && t(b, h) && h.id === j) return d.push(h), d;
        } else {
          if (f[2]) return I.apply(d, b.getElementsByTagName(a)), d;if ((j = f[3]) && c.getElementsByClassName && b.getElementsByClassName) return I.apply(d, b.getElementsByClassName(j)), d;
        }if (c.qsa && (!q || !q.test(a))) {
          if (s = r = u, w = b, x = 9 === k && a, 1 === k && "object" !== b.nodeName.toLowerCase()) {
            o = g(a), (r = b.getAttribute("id")) ? s = r.replace(bb, "\\$&") : b.setAttribute("id", s), s = "[id='" + s + "'] ", l = o.length;while (l--) o[l] = s + qb(o[l]);w = ab.test(a) && ob(b.parentNode) || b, x = o.join(",");
          }if (x) try {
            return I.apply(d, w.querySelectorAll(x)), d;
          } catch (y) {} finally {
            r || b.removeAttribute("id");
          }
        }
      }return i(a.replace(R, "$1"), b, d, e);
    }function gb() {
      var a = [];function b(c, e) {
        return a.push(c + " ") > d.cacheLength && delete b[a.shift()], b[c + " "] = e;
      }return b;
    }function hb(a) {
      return a[u] = !0, a;
    }function ib(a) {
      var b = n.createElement("div");try {
        return !!a(b);
      } catch (c) {
        return !1;
      } finally {
        b.parentNode && b.parentNode.removeChild(b), b = null;
      }
    }function jb(a, b) {
      var c = a.split("|"),
          e = a.length;while (e--) d.attrHandle[c[e]] = b;
    }function kb(a, b) {
      var c = b && a,
          d = c && 1 === a.nodeType && 1 === b.nodeType && (~b.sourceIndex || D) - (~a.sourceIndex || D);if (d) return d;if (c) while (c = c.nextSibling) if (c === b) return -1;return a ? 1 : -1;
    }function lb(a) {
      return function (b) {
        var c = b.nodeName.toLowerCase();return "input" === c && b.type === a;
      };
    }function mb(a) {
      return function (b) {
        var c = b.nodeName.toLowerCase();return ("input" === c || "button" === c) && b.type === a;
      };
    }function nb(a) {
      return hb(function (b) {
        return b = +b, hb(function (c, d) {
          var e,
              f = a([], c.length, b),
              g = f.length;while (g--) c[e = f[g]] && (c[e] = !(d[e] = c[e]));
        });
      });
    }function ob(a) {
      return a && typeof a.getElementsByTagName !== C && a;
    }c = fb.support = {}, f = fb.isXML = function (a) {
      var b = a && (a.ownerDocument || a).documentElement;return b ? "HTML" !== b.nodeName : !1;
    }, m = fb.setDocument = function (a) {
      var b,
          e = a ? a.ownerDocument || a : v,
          g = e.defaultView;return e !== n && 9 === e.nodeType && e.documentElement ? (n = e, o = e.documentElement, p = !f(e), g && g !== g.top && (g.addEventListener ? g.addEventListener("unload", function () {
        m();
      }, !1) : g.attachEvent && g.attachEvent("onunload", function () {
        m();
      })), c.attributes = ib(function (a) {
        return a.className = "i", !a.getAttribute("className");
      }), c.getElementsByTagName = ib(function (a) {
        return a.appendChild(e.createComment("")), !a.getElementsByTagName("*").length;
      }), c.getElementsByClassName = $.test(e.getElementsByClassName) && ib(function (a) {
        return a.innerHTML = "<div class='a'></div><div class='a i'></div>", a.firstChild.className = "i", 2 === a.getElementsByClassName("i").length;
      }), c.getById = ib(function (a) {
        return o.appendChild(a).id = u, !e.getElementsByName || !e.getElementsByName(u).length;
      }), c.getById ? (d.find.ID = function (a, b) {
        if (typeof b.getElementById !== C && p) {
          var c = b.getElementById(a);return c && c.parentNode ? [c] : [];
        }
      }, d.filter.ID = function (a) {
        var b = a.replace(cb, db);return function (a) {
          return a.getAttribute("id") === b;
        };
      }) : (delete d.find.ID, d.filter.ID = function (a) {
        var b = a.replace(cb, db);return function (a) {
          var c = typeof a.getAttributeNode !== C && a.getAttributeNode("id");return c && c.value === b;
        };
      }), d.find.TAG = c.getElementsByTagName ? function (a, b) {
        return typeof b.getElementsByTagName !== C ? b.getElementsByTagName(a) : void 0;
      } : function (a, b) {
        var c,
            d = [],
            e = 0,
            f = b.getElementsByTagName(a);if ("*" === a) {
          while (c = f[e++]) 1 === c.nodeType && d.push(c);return d;
        }return f;
      }, d.find.CLASS = c.getElementsByClassName && function (a, b) {
        return typeof b.getElementsByClassName !== C && p ? b.getElementsByClassName(a) : void 0;
      }, r = [], q = [], (c.qsa = $.test(e.querySelectorAll)) && (ib(function (a) {
        a.innerHTML = "<select msallowclip=''><option selected=''></option></select>", a.querySelectorAll("[msallowclip^='']").length && q.push("[*^$]=" + M + "*(?:''|\"\")"), a.querySelectorAll("[selected]").length || q.push("\\[" + M + "*(?:value|" + L + ")"), a.querySelectorAll(":checked").length || q.push(":checked");
      }), ib(function (a) {
        var b = e.createElement("input");b.setAttribute("type", "hidden"), a.appendChild(b).setAttribute("name", "D"), a.querySelectorAll("[name=d]").length && q.push("name" + M + "*[*^$|!~]?="), a.querySelectorAll(":enabled").length || q.push(":enabled", ":disabled"), a.querySelectorAll("*,:x"), q.push(",.*:");
      })), (c.matchesSelector = $.test(s = o.matches || o.webkitMatchesSelector || o.mozMatchesSelector || o.oMatchesSelector || o.msMatchesSelector)) && ib(function (a) {
        c.disconnectedMatch = s.call(a, "div"), s.call(a, "[s!='']:x"), r.push("!=", Q);
      }), q = q.length && new RegExp(q.join("|")), r = r.length && new RegExp(r.join("|")), b = $.test(o.compareDocumentPosition), t = b || $.test(o.contains) ? function (a, b) {
        var c = 9 === a.nodeType ? a.documentElement : a,
            d = b && b.parentNode;return a === d || !(!d || 1 !== d.nodeType || !(c.contains ? c.contains(d) : a.compareDocumentPosition && 16 & a.compareDocumentPosition(d)));
      } : function (a, b) {
        if (b) while (b = b.parentNode) if (b === a) return !0;return !1;
      }, B = b ? function (a, b) {
        if (a === b) return l = !0, 0;var d = !a.compareDocumentPosition - !b.compareDocumentPosition;return d ? d : (d = (a.ownerDocument || a) === (b.ownerDocument || b) ? a.compareDocumentPosition(b) : 1, 1 & d || !c.sortDetached && b.compareDocumentPosition(a) === d ? a === e || a.ownerDocument === v && t(v, a) ? -1 : b === e || b.ownerDocument === v && t(v, b) ? 1 : k ? K.call(k, a) - K.call(k, b) : 0 : 4 & d ? -1 : 1);
      } : function (a, b) {
        if (a === b) return l = !0, 0;var c,
            d = 0,
            f = a.parentNode,
            g = b.parentNode,
            h = [a],
            i = [b];if (!f || !g) return a === e ? -1 : b === e ? 1 : f ? -1 : g ? 1 : k ? K.call(k, a) - K.call(k, b) : 0;if (f === g) return kb(a, b);c = a;while (c = c.parentNode) h.unshift(c);c = b;while (c = c.parentNode) i.unshift(c);while (h[d] === i[d]) d++;return d ? kb(h[d], i[d]) : h[d] === v ? -1 : i[d] === v ? 1 : 0;
      }, e) : n;
    }, fb.matches = function (a, b) {
      return fb(a, null, null, b);
    }, fb.matchesSelector = function (a, b) {
      if ((a.ownerDocument || a) !== n && m(a), b = b.replace(U, "='$1']"), !(!c.matchesSelector || !p || r && r.test(b) || q && q.test(b))) try {
        var d = s.call(a, b);if (d || c.disconnectedMatch || a.document && 11 !== a.document.nodeType) return d;
      } catch (e) {}return fb(b, n, null, [a]).length > 0;
    }, fb.contains = function (a, b) {
      return (a.ownerDocument || a) !== n && m(a), t(a, b);
    }, fb.attr = function (a, b) {
      (a.ownerDocument || a) !== n && m(a);var e = d.attrHandle[b.toLowerCase()],
          f = e && E.call(d.attrHandle, b.toLowerCase()) ? e(a, b, !p) : void 0;return void 0 !== f ? f : c.attributes || !p ? a.getAttribute(b) : (f = a.getAttributeNode(b)) && f.specified ? f.value : null;
    }, fb.error = function (a) {
      throw new Error("Syntax error, unrecognized expression: " + a);
    }, fb.uniqueSort = function (a) {
      var b,
          d = [],
          e = 0,
          f = 0;if (l = !c.detectDuplicates, k = !c.sortStable && a.slice(0), a.sort(B), l) {
        while (b = a[f++]) b === a[f] && (e = d.push(f));while (e--) a.splice(d[e], 1);
      }return k = null, a;
    }, e = fb.getText = function (a) {
      var b,
          c = "",
          d = 0,
          f = a.nodeType;if (f) {
        if (1 === f || 9 === f || 11 === f) {
          if ("string" == typeof a.textContent) return a.textContent;for (a = a.firstChild; a; a = a.nextSibling) c += e(a);
        } else if (3 === f || 4 === f) return a.nodeValue;
      } else while (b = a[d++]) c += e(b);return c;
    }, d = fb.selectors = { cacheLength: 50, createPseudo: hb, match: X, attrHandle: {}, find: {}, relative: { ">": { dir: "parentNode", first: !0 }, " ": { dir: "parentNode" }, "+": { dir: "previousSibling", first: !0 }, "~": { dir: "previousSibling" } }, preFilter: { ATTR: function (a) {
          return a[1] = a[1].replace(cb, db), a[3] = (a[3] || a[4] || a[5] || "").replace(cb, db), "~=" === a[2] && (a[3] = " " + a[3] + " "), a.slice(0, 4);
        }, CHILD: function (a) {
          return a[1] = a[1].toLowerCase(), "nth" === a[1].slice(0, 3) ? (a[3] || fb.error(a[0]), a[4] = +(a[4] ? a[5] + (a[6] || 1) : 2 * ("even" === a[3] || "odd" === a[3])), a[5] = +(a[7] + a[8] || "odd" === a[3])) : a[3] && fb.error(a[0]), a;
        }, PSEUDO: function (a) {
          var b,
              c = !a[6] && a[2];return X.CHILD.test(a[0]) ? null : (a[3] ? a[2] = a[4] || a[5] || "" : c && V.test(c) && (b = g(c, !0)) && (b = c.indexOf(")", c.length - b) - c.length) && (a[0] = a[0].slice(0, b), a[2] = c.slice(0, b)), a.slice(0, 3));
        } }, filter: { TAG: function (a) {
          var b = a.replace(cb, db).toLowerCase();return "*" === a ? function () {
            return !0;
          } : function (a) {
            return a.nodeName && a.nodeName.toLowerCase() === b;
          };
        }, CLASS: function (a) {
          var b = y[a + " "];return b || (b = new RegExp("(^|" + M + ")" + a + "(" + M + "|$)")) && y(a, function (a) {
            return b.test("string" == typeof a.className && a.className || typeof a.getAttribute !== C && a.getAttribute("class") || "");
          });
        }, ATTR: function (a, b, c) {
          return function (d) {
            var e = fb.attr(d, a);return null == e ? "!=" === b : b ? (e += "", "=" === b ? e === c : "!=" === b ? e !== c : "^=" === b ? c && 0 === e.indexOf(c) : "*=" === b ? c && e.indexOf(c) > -1 : "$=" === b ? c && e.slice(-c.length) === c : "~=" === b ? (" " + e + " ").indexOf(c) > -1 : "|=" === b ? e === c || e.slice(0, c.length + 1) === c + "-" : !1) : !0;
          };
        }, CHILD: function (a, b, c, d, e) {
          var f = "nth" !== a.slice(0, 3),
              g = "last" !== a.slice(-4),
              h = "of-type" === b;return 1 === d && 0 === e ? function (a) {
            return !!a.parentNode;
          } : function (b, c, i) {
            var j,
                k,
                l,
                m,
                n,
                o,
                p = f !== g ? "nextSibling" : "previousSibling",
                q = b.parentNode,
                r = h && b.nodeName.toLowerCase(),
                s = !i && !h;if (q) {
              if (f) {
                while (p) {
                  l = b;while (l = l[p]) if (h ? l.nodeName.toLowerCase() === r : 1 === l.nodeType) return !1;o = p = "only" === a && !o && "nextSibling";
                }return !0;
              }if (o = [g ? q.firstChild : q.lastChild], g && s) {
                k = q[u] || (q[u] = {}), j = k[a] || [], n = j[0] === w && j[1], m = j[0] === w && j[2], l = n && q.childNodes[n];while (l = ++n && l && l[p] || (m = n = 0) || o.pop()) if (1 === l.nodeType && ++m && l === b) {
                  k[a] = [w, n, m];break;
                }
              } else if (s && (j = (b[u] || (b[u] = {}))[a]) && j[0] === w) m = j[1];else while (l = ++n && l && l[p] || (m = n = 0) || o.pop()) if ((h ? l.nodeName.toLowerCase() === r : 1 === l.nodeType) && ++m && (s && ((l[u] || (l[u] = {}))[a] = [w, m]), l === b)) break;return m -= e, m === d || m % d === 0 && m / d >= 0;
            }
          };
        }, PSEUDO: function (a, b) {
          var c,
              e = d.pseudos[a] || d.setFilters[a.toLowerCase()] || fb.error("unsupported pseudo: " + a);return e[u] ? e(b) : e.length > 1 ? (c = [a, a, "", b], d.setFilters.hasOwnProperty(a.toLowerCase()) ? hb(function (a, c) {
            var d,
                f = e(a, b),
                g = f.length;while (g--) d = K.call(a, f[g]), a[d] = !(c[d] = f[g]);
          }) : function (a) {
            return e(a, 0, c);
          }) : e;
        } }, pseudos: { not: hb(function (a) {
          var b = [],
              c = [],
              d = h(a.replace(R, "$1"));return d[u] ? hb(function (a, b, c, e) {
            var f,
                g = d(a, null, e, []),
                h = a.length;while (h--) (f = g[h]) && (a[h] = !(b[h] = f));
          }) : function (a, e, f) {
            return b[0] = a, d(b, null, f, c), !c.pop();
          };
        }), has: hb(function (a) {
          return function (b) {
            return fb(a, b).length > 0;
          };
        }), contains: hb(function (a) {
          return function (b) {
            return (b.textContent || b.innerText || e(b)).indexOf(a) > -1;
          };
        }), lang: hb(function (a) {
          return W.test(a || "") || fb.error("unsupported lang: " + a), a = a.replace(cb, db).toLowerCase(), function (b) {
            var c;do if (c = p ? b.lang : b.getAttribute("xml:lang") || b.getAttribute("lang")) return c = c.toLowerCase(), c === a || 0 === c.indexOf(a + "-"); while ((b = b.parentNode) && 1 === b.nodeType);return !1;
          };
        }), target: function (b) {
          var c = a.location && a.location.hash;return c && c.slice(1) === b.id;
        }, root: function (a) {
          return a === o;
        }, focus: function (a) {
          return a === n.activeElement && (!n.hasFocus || n.hasFocus()) && !!(a.type || a.href || ~a.tabIndex);
        }, enabled: function (a) {
          return a.disabled === !1;
        }, disabled: function (a) {
          return a.disabled === !0;
        }, checked: function (a) {
          var b = a.nodeName.toLowerCase();return "input" === b && !!a.checked || "option" === b && !!a.selected;
        }, selected: function (a) {
          return a.parentNode && a.parentNode.selectedIndex, a.selected === !0;
        }, empty: function (a) {
          for (a = a.firstChild; a; a = a.nextSibling) if (a.nodeType < 6) return !1;return !0;
        }, parent: function (a) {
          return !d.pseudos.empty(a);
        }, header: function (a) {
          return Z.test(a.nodeName);
        }, input: function (a) {
          return Y.test(a.nodeName);
        }, button: function (a) {
          var b = a.nodeName.toLowerCase();return "input" === b && "button" === a.type || "button" === b;
        }, text: function (a) {
          var b;return "input" === a.nodeName.toLowerCase() && "text" === a.type && (null == (b = a.getAttribute("type")) || "text" === b.toLowerCase());
        }, first: nb(function () {
          return [0];
        }), last: nb(function (a, b) {
          return [b - 1];
        }), eq: nb(function (a, b, c) {
          return [0 > c ? c + b : c];
        }), even: nb(function (a, b) {
          for (var c = 0; b > c; c += 2) a.push(c);return a;
        }), odd: nb(function (a, b) {
          for (var c = 1; b > c; c += 2) a.push(c);return a;
        }), lt: nb(function (a, b, c) {
          for (var d = 0 > c ? c + b : c; --d >= 0;) a.push(d);return a;
        }), gt: nb(function (a, b, c) {
          for (var d = 0 > c ? c + b : c; ++d < b;) a.push(d);return a;
        }) } }, d.pseudos.nth = d.pseudos.eq;for (b in { radio: !0, checkbox: !0, file: !0, password: !0, image: !0 }) d.pseudos[b] = lb(b);for (b in { submit: !0, reset: !0 }) d.pseudos[b] = mb(b);function pb() {}pb.prototype = d.filters = d.pseudos, d.setFilters = new pb(), g = fb.tokenize = function (a, b) {
      var c,
          e,
          f,
          g,
          h,
          i,
          j,
          k = z[a + " "];if (k) return b ? 0 : k.slice(0);h = a, i = [], j = d.preFilter;while (h) {
        (!c || (e = S.exec(h))) && (e && (h = h.slice(e[0].length) || h), i.push(f = [])), c = !1, (e = T.exec(h)) && (c = e.shift(), f.push({ value: c, type: e[0].replace(R, " ") }), h = h.slice(c.length));for (g in d.filter) !(e = X[g].exec(h)) || j[g] && !(e = j[g](e)) || (c = e.shift(), f.push({ value: c, type: g, matches: e }), h = h.slice(c.length));if (!c) break;
      }return b ? h.length : h ? fb.error(a) : z(a, i).slice(0);
    };function qb(a) {
      for (var b = 0, c = a.length, d = ""; c > b; b++) d += a[b].value;return d;
    }function rb(a, b, c) {
      var d = b.dir,
          e = c && "parentNode" === d,
          f = x++;return b.first ? function (b, c, f) {
        while (b = b[d]) if (1 === b.nodeType || e) return a(b, c, f);
      } : function (b, c, g) {
        var h,
            i,
            j = [w, f];if (g) {
          while (b = b[d]) if ((1 === b.nodeType || e) && a(b, c, g)) return !0;
        } else while (b = b[d]) if (1 === b.nodeType || e) {
          if (i = b[u] || (b[u] = {}), (h = i[d]) && h[0] === w && h[1] === f) return j[2] = h[2];if (i[d] = j, j[2] = a(b, c, g)) return !0;
        }
      };
    }function sb(a) {
      return a.length > 1 ? function (b, c, d) {
        var e = a.length;while (e--) if (!a[e](b, c, d)) return !1;return !0;
      } : a[0];
    }function tb(a, b, c) {
      for (var d = 0, e = b.length; e > d; d++) fb(a, b[d], c);return c;
    }function ub(a, b, c, d, e) {
      for (var f, g = [], h = 0, i = a.length, j = null != b; i > h; h++) (f = a[h]) && (!c || c(f, d, e)) && (g.push(f), j && b.push(h));return g;
    }function vb(a, b, c, d, e, f) {
      return d && !d[u] && (d = vb(d)), e && !e[u] && (e = vb(e, f)), hb(function (f, g, h, i) {
        var j,
            k,
            l,
            m = [],
            n = [],
            o = g.length,
            p = f || tb(b || "*", h.nodeType ? [h] : h, []),
            q = !a || !f && b ? p : ub(p, m, a, h, i),
            r = c ? e || (f ? a : o || d) ? [] : g : q;if (c && c(q, r, h, i), d) {
          j = ub(r, n), d(j, [], h, i), k = j.length;while (k--) (l = j[k]) && (r[n[k]] = !(q[n[k]] = l));
        }if (f) {
          if (e || a) {
            if (e) {
              j = [], k = r.length;while (k--) (l = r[k]) && j.push(q[k] = l);e(null, r = [], j, i);
            }k = r.length;while (k--) (l = r[k]) && (j = e ? K.call(f, l) : m[k]) > -1 && (f[j] = !(g[j] = l));
          }
        } else r = ub(r === g ? r.splice(o, r.length) : r), e ? e(null, g, r, i) : I.apply(g, r);
      });
    }function wb(a) {
      for (var b, c, e, f = a.length, g = d.relative[a[0].type], h = g || d.relative[" "], i = g ? 1 : 0, k = rb(function (a) {
        return a === b;
      }, h, !0), l = rb(function (a) {
        return K.call(b, a) > -1;
      }, h, !0), m = [function (a, c, d) {
        return !g && (d || c !== j) || ((b = c).nodeType ? k(a, c, d) : l(a, c, d));
      }]; f > i; i++) if (c = d.relative[a[i].type]) m = [rb(sb(m), c)];else {
        if (c = d.filter[a[i].type].apply(null, a[i].matches), c[u]) {
          for (e = ++i; f > e; e++) if (d.relative[a[e].type]) break;return vb(i > 1 && sb(m), i > 1 && qb(a.slice(0, i - 1).concat({ value: " " === a[i - 2].type ? "*" : "" })).replace(R, "$1"), c, e > i && wb(a.slice(i, e)), f > e && wb(a = a.slice(e)), f > e && qb(a));
        }m.push(c);
      }return sb(m);
    }function xb(a, b) {
      var c = b.length > 0,
          e = a.length > 0,
          f = function (f, g, h, i, k) {
        var l,
            m,
            o,
            p = 0,
            q = "0",
            r = f && [],
            s = [],
            t = j,
            u = f || e && d.find.TAG("*", k),
            v = w += null == t ? 1 : Math.random() || .1,
            x = u.length;for (k && (j = g !== n && g); q !== x && null != (l = u[q]); q++) {
          if (e && l) {
            m = 0;while (o = a[m++]) if (o(l, g, h)) {
              i.push(l);break;
            }k && (w = v);
          }c && ((l = !o && l) && p--, f && r.push(l));
        }if (p += q, c && q !== p) {
          m = 0;while (o = b[m++]) o(r, s, g, h);if (f) {
            if (p > 0) while (q--) r[q] || s[q] || (s[q] = G.call(i));s = ub(s);
          }I.apply(i, s), k && !f && s.length > 0 && p + b.length > 1 && fb.uniqueSort(i);
        }return k && (w = v, j = t), r;
      };return c ? hb(f) : f;
    }return h = fb.compile = function (a, b) {
      var c,
          d = [],
          e = [],
          f = A[a + " "];if (!f) {
        b || (b = g(a)), c = b.length;while (c--) f = wb(b[c]), f[u] ? d.push(f) : e.push(f);f = A(a, xb(e, d)), f.selector = a;
      }return f;
    }, i = fb.select = function (a, b, e, f) {
      var i,
          j,
          k,
          l,
          m,
          n = "function" == typeof a && a,
          o = !f && g(a = n.selector || a);if (e = e || [], 1 === o.length) {
        if (j = o[0] = o[0].slice(0), j.length > 2 && "ID" === (k = j[0]).type && c.getById && 9 === b.nodeType && p && d.relative[j[1].type]) {
          if (b = (d.find.ID(k.matches[0].replace(cb, db), b) || [])[0], !b) return e;n && (b = b.parentNode), a = a.slice(j.shift().value.length);
        }i = X.needsContext.test(a) ? 0 : j.length;while (i--) {
          if (k = j[i], d.relative[l = k.type]) break;if ((m = d.find[l]) && (f = m(k.matches[0].replace(cb, db), ab.test(j[0].type) && ob(b.parentNode) || b))) {
            if (j.splice(i, 1), a = f.length && qb(j), !a) return I.apply(e, f), e;break;
          }
        }
      }return (n || h(a, o))(f, b, !p, e, ab.test(a) && ob(b.parentNode) || b), e;
    }, c.sortStable = u.split("").sort(B).join("") === u, c.detectDuplicates = !!l, m(), c.sortDetached = ib(function (a) {
      return 1 & a.compareDocumentPosition(n.createElement("div"));
    }), ib(function (a) {
      return a.innerHTML = "<a href='#'></a>", "#" === a.firstChild.getAttribute("href");
    }) || jb("type|href|height|width", function (a, b, c) {
      return c ? void 0 : a.getAttribute(b, "type" === b.toLowerCase() ? 1 : 2);
    }), c.attributes && ib(function (a) {
      return a.innerHTML = "<input/>", a.firstChild.setAttribute("value", ""), "" === a.firstChild.getAttribute("value");
    }) || jb("value", function (a, b, c) {
      return c || "input" !== a.nodeName.toLowerCase() ? void 0 : a.defaultValue;
    }), ib(function (a) {
      return null == a.getAttribute("disabled");
    }) || jb(L, function (a, b, c) {
      var d;return c ? void 0 : a[b] === !0 ? b.toLowerCase() : (d = a.getAttributeNode(b)) && d.specified ? d.value : null;
    }), fb;
  }(a);m.find = s, m.expr = s.selectors, m.expr[":"] = m.expr.pseudos, m.unique = s.uniqueSort, m.text = s.getText, m.isXMLDoc = s.isXML, m.contains = s.contains;var t = m.expr.match.needsContext,
      u = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
      v = /^.[^:#\[\.,]*$/;function w(a, b, c) {
    if (m.isFunction(b)) return m.grep(a, function (a, d) {
      return !!b.call(a, d, a) !== c;
    });if (b.nodeType) return m.grep(a, function (a) {
      return a === b !== c;
    });if ("string" == typeof b) {
      if (v.test(b)) return m.filter(b, a, c);b = m.filter(b, a);
    }return m.grep(a, function (a) {
      return m.inArray(a, b) >= 0 !== c;
    });
  }m.filter = function (a, b, c) {
    var d = b[0];return c && (a = ":not(" + a + ")"), 1 === b.length && 1 === d.nodeType ? m.find.matchesSelector(d, a) ? [d] : [] : m.find.matches(a, m.grep(b, function (a) {
      return 1 === a.nodeType;
    }));
  }, m.fn.extend({ find: function (a) {
      var b,
          c = [],
          d = this,
          e = d.length;if ("string" != typeof a) return this.pushStack(m(a).filter(function () {
        for (b = 0; e > b; b++) if (m.contains(d[b], this)) return !0;
      }));for (b = 0; e > b; b++) m.find(a, d[b], c);return c = this.pushStack(e > 1 ? m.unique(c) : c), c.selector = this.selector ? this.selector + " " + a : a, c;
    }, filter: function (a) {
      return this.pushStack(w(this, a || [], !1));
    }, not: function (a) {
      return this.pushStack(w(this, a || [], !0));
    }, is: function (a) {
      return !!w(this, "string" == typeof a && t.test(a) ? m(a) : a || [], !1).length;
    } });var x,
      y = a.document,
      z = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,
      A = m.fn.init = function (a, b) {
    var c, d;if (!a) return this;if ("string" == typeof a) {
      if (c = "<" === a.charAt(0) && ">" === a.charAt(a.length - 1) && a.length >= 3 ? [null, a, null] : z.exec(a), !c || !c[1] && b) return !b || b.jquery ? (b || x).find(a) : this.constructor(b).find(a);if (c[1]) {
        if (b = b instanceof m ? b[0] : b, m.merge(this, m.parseHTML(c[1], b && b.nodeType ? b.ownerDocument || b : y, !0)), u.test(c[1]) && m.isPlainObject(b)) for (c in b) m.isFunction(this[c]) ? this[c](b[c]) : this.attr(c, b[c]);return this;
      }if (d = y.getElementById(c[2]), d && d.parentNode) {
        if (d.id !== c[2]) return x.find(a);this.length = 1, this[0] = d;
      }return this.context = y, this.selector = a, this;
    }return a.nodeType ? (this.context = this[0] = a, this.length = 1, this) : m.isFunction(a) ? "undefined" != typeof x.ready ? x.ready(a) : a(m) : (void 0 !== a.selector && (this.selector = a.selector, this.context = a.context), m.makeArray(a, this));
  };A.prototype = m.fn, x = m(y);var B = /^(?:parents|prev(?:Until|All))/,
      C = { children: !0, contents: !0, next: !0, prev: !0 };m.extend({ dir: function (a, b, c) {
      var d = [],
          e = a[b];while (e && 9 !== e.nodeType && (void 0 === c || 1 !== e.nodeType || !m(e).is(c))) 1 === e.nodeType && d.push(e), e = e[b];return d;
    }, sibling: function (a, b) {
      for (var c = []; a; a = a.nextSibling) 1 === a.nodeType && a !== b && c.push(a);return c;
    } }), m.fn.extend({ has: function (a) {
      var b,
          c = m(a, this),
          d = c.length;return this.filter(function () {
        for (b = 0; d > b; b++) if (m.contains(this, c[b])) return !0;
      });
    }, closest: function (a, b) {
      for (var c, d = 0, e = this.length, f = [], g = t.test(a) || "string" != typeof a ? m(a, b || this.context) : 0; e > d; d++) for (c = this[d]; c && c !== b; c = c.parentNode) if (c.nodeType < 11 && (g ? g.index(c) > -1 : 1 === c.nodeType && m.find.matchesSelector(c, a))) {
        f.push(c);break;
      }return this.pushStack(f.length > 1 ? m.unique(f) : f);
    }, index: function (a) {
      return a ? "string" == typeof a ? m.inArray(this[0], m(a)) : m.inArray(a.jquery ? a[0] : a, this) : this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
    }, add: function (a, b) {
      return this.pushStack(m.unique(m.merge(this.get(), m(a, b))));
    }, addBack: function (a) {
      return this.add(null == a ? this.prevObject : this.prevObject.filter(a));
    } });function D(a, b) {
    do a = a[b]; while (a && 1 !== a.nodeType);return a;
  }m.each({ parent: function (a) {
      var b = a.parentNode;return b && 11 !== b.nodeType ? b : null;
    }, parents: function (a) {
      return m.dir(a, "parentNode");
    }, parentsUntil: function (a, b, c) {
      return m.dir(a, "parentNode", c);
    }, next: function (a) {
      return D(a, "nextSibling");
    }, prev: function (a) {
      return D(a, "previousSibling");
    }, nextAll: function (a) {
      return m.dir(a, "nextSibling");
    }, prevAll: function (a) {
      return m.dir(a, "previousSibling");
    }, nextUntil: function (a, b, c) {
      return m.dir(a, "nextSibling", c);
    }, prevUntil: function (a, b, c) {
      return m.dir(a, "previousSibling", c);
    }, siblings: function (a) {
      return m.sibling((a.parentNode || {}).firstChild, a);
    }, children: function (a) {
      return m.sibling(a.firstChild);
    }, contents: function (a) {
      return m.nodeName(a, "iframe") ? a.contentDocument || a.contentWindow.document : m.merge([], a.childNodes);
    } }, function (a, b) {
    m.fn[a] = function (c, d) {
      var e = m.map(this, b, c);return "Until" !== a.slice(-5) && (d = c), d && "string" == typeof d && (e = m.filter(d, e)), this.length > 1 && (C[a] || (e = m.unique(e)), B.test(a) && (e = e.reverse())), this.pushStack(e);
    };
  });var E = /\S+/g,
      F = {};function G(a) {
    var b = F[a] = {};return m.each(a.match(E) || [], function (a, c) {
      b[c] = !0;
    }), b;
  }m.Callbacks = function (a) {
    a = "string" == typeof a ? F[a] || G(a) : m.extend({}, a);var b,
        c,
        d,
        e,
        f,
        g,
        h = [],
        i = !a.once && [],
        j = function (l) {
      for (c = a.memory && l, d = !0, f = g || 0, g = 0, e = h.length, b = !0; h && e > f; f++) if (h[f].apply(l[0], l[1]) === !1 && a.stopOnFalse) {
        c = !1;break;
      }b = !1, h && (i ? i.length && j(i.shift()) : c ? h = [] : k.disable());
    },
        k = { add: function () {
        if (h) {
          var d = h.length;!function f(b) {
            m.each(b, function (b, c) {
              var d = m.type(c);"function" === d ? a.unique && k.has(c) || h.push(c) : c && c.length && "string" !== d && f(c);
            });
          }(arguments), b ? e = h.length : c && (g = d, j(c));
        }return this;
      }, remove: function () {
        return h && m.each(arguments, function (a, c) {
          var d;while ((d = m.inArray(c, h, d)) > -1) h.splice(d, 1), b && (e >= d && e--, f >= d && f--);
        }), this;
      }, has: function (a) {
        return a ? m.inArray(a, h) > -1 : !(!h || !h.length);
      }, empty: function () {
        return h = [], e = 0, this;
      }, disable: function () {
        return h = i = c = void 0, this;
      }, disabled: function () {
        return !h;
      }, lock: function () {
        return i = void 0, c || k.disable(), this;
      }, locked: function () {
        return !i;
      }, fireWith: function (a, c) {
        return !h || d && !i || (c = c || [], c = [a, c.slice ? c.slice() : c], b ? i.push(c) : j(c)), this;
      }, fire: function () {
        return k.fireWith(this, arguments), this;
      }, fired: function () {
        return !!d;
      } };return k;
  }, m.extend({ Deferred: function (a) {
      var b = [["resolve", "done", m.Callbacks("once memory"), "resolved"], ["reject", "fail", m.Callbacks("once memory"), "rejected"], ["notify", "progress", m.Callbacks("memory")]],
          c = "pending",
          d = { state: function () {
          return c;
        }, always: function () {
          return e.done(arguments).fail(arguments), this;
        }, then: function () {
          var a = arguments;return m.Deferred(function (c) {
            m.each(b, function (b, f) {
              var g = m.isFunction(a[b]) && a[b];e[f[1]](function () {
                var a = g && g.apply(this, arguments);a && m.isFunction(a.promise) ? a.promise().done(c.resolve).fail(c.reject).progress(c.notify) : c[f[0] + "With"](this === d ? c.promise() : this, g ? [a] : arguments);
              });
            }), a = null;
          }).promise();
        }, promise: function (a) {
          return null != a ? m.extend(a, d) : d;
        } },
          e = {};return d.pipe = d.then, m.each(b, function (a, f) {
        var g = f[2],
            h = f[3];d[f[1]] = g.add, h && g.add(function () {
          c = h;
        }, b[1 ^ a][2].disable, b[2][2].lock), e[f[0]] = function () {
          return e[f[0] + "With"](this === e ? d : this, arguments), this;
        }, e[f[0] + "With"] = g.fireWith;
      }), d.promise(e), a && a.call(e, e), e;
    }, when: function (a) {
      var b = 0,
          c = d.call(arguments),
          e = c.length,
          f = 1 !== e || a && m.isFunction(a.promise) ? e : 0,
          g = 1 === f ? a : m.Deferred(),
          h = function (a, b, c) {
        return function (e) {
          b[a] = this, c[a] = arguments.length > 1 ? d.call(arguments) : e, c === i ? g.notifyWith(b, c) : --f || g.resolveWith(b, c);
        };
      },
          i,
          j,
          k;if (e > 1) for (i = new Array(e), j = new Array(e), k = new Array(e); e > b; b++) c[b] && m.isFunction(c[b].promise) ? c[b].promise().done(h(b, k, c)).fail(g.reject).progress(h(b, j, i)) : --f;return f || g.resolveWith(k, c), g.promise();
    } });var H;m.fn.ready = function (a) {
    return m.ready.promise().done(a), this;
  }, m.extend({ isReady: !1, readyWait: 1, holdReady: function (a) {
      a ? m.readyWait++ : m.ready(!0);
    }, ready: function (a) {
      if (a === !0 ? ! --m.readyWait : !m.isReady) {
        if (!y.body) return setTimeout(m.ready);m.isReady = !0, a !== !0 && --m.readyWait > 0 || (H.resolveWith(y, [m]), m.fn.triggerHandler && (m(y).triggerHandler("ready"), m(y).off("ready")));
      }
    } });function I() {
    y.addEventListener ? (y.removeEventListener("DOMContentLoaded", J, !1), a.removeEventListener("load", J, !1)) : (y.detachEvent("onreadystatechange", J), a.detachEvent("onload", J));
  }function J() {
    (y.addEventListener || "load" === event.type || "complete" === y.readyState) && (I(), m.ready());
  }m.ready.promise = function (b) {
    if (!H) if (H = m.Deferred(), "complete" === y.readyState) setTimeout(m.ready);else if (y.addEventListener) y.addEventListener("DOMContentLoaded", J, !1), a.addEventListener("load", J, !1);else {
      y.attachEvent("onreadystatechange", J), a.attachEvent("onload", J);var c = !1;try {
        c = null == a.frameElement && y.documentElement;
      } catch (d) {}c && c.doScroll && !function e() {
        if (!m.isReady) {
          try {
            c.doScroll("left");
          } catch (a) {
            return setTimeout(e, 50);
          }I(), m.ready();
        }
      }();
    }return H.promise(b);
  };var K = "undefined",
      L;for (L in m(k)) break;k.ownLast = "0" !== L, k.inlineBlockNeedsLayout = !1, m(function () {
    var a, b, c, d;c = y.getElementsByTagName("body")[0], c && c.style && (b = y.createElement("div"), d = y.createElement("div"), d.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px", c.appendChild(d).appendChild(b), typeof b.style.zoom !== K && (b.style.cssText = "display:inline;margin:0;border:0;padding:1px;width:1px;zoom:1", k.inlineBlockNeedsLayout = a = 3 === b.offsetWidth, a && (c.style.zoom = 1)), c.removeChild(d));
  }), function () {
    var a = y.createElement("div");if (null == k.deleteExpando) {
      k.deleteExpando = !0;try {
        delete a.test;
      } catch (b) {
        k.deleteExpando = !1;
      }
    }a = null;
  }(), m.acceptData = function (a) {
    var b = m.noData[(a.nodeName + " ").toLowerCase()],
        c = +a.nodeType || 1;return 1 !== c && 9 !== c ? !1 : !b || b !== !0 && a.getAttribute("classid") === b;
  };var M = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
      N = /([A-Z])/g;function O(a, b, c) {
    if (void 0 === c && 1 === a.nodeType) {
      var d = "data-" + b.replace(N, "-$1").toLowerCase();if (c = a.getAttribute(d), "string" == typeof c) {
        try {
          c = "true" === c ? !0 : "false" === c ? !1 : "null" === c ? null : +c + "" === c ? +c : M.test(c) ? m.parseJSON(c) : c;
        } catch (e) {}m.data(a, b, c);
      } else c = void 0;
    }return c;
  }function P(a) {
    var b;for (b in a) if (("data" !== b || !m.isEmptyObject(a[b])) && "toJSON" !== b) return !1;return !0;
  }function Q(a, b, d, e) {
    if (m.acceptData(a)) {
      var f,
          g,
          h = m.expando,
          i = a.nodeType,
          j = i ? m.cache : a,
          k = i ? a[h] : a[h] && h;
      if (k && j[k] && (e || j[k].data) || void 0 !== d || "string" != typeof b) return k || (k = i ? a[h] = c.pop() || m.guid++ : h), j[k] || (j[k] = i ? {} : { toJSON: m.noop }), ("object" == typeof b || "function" == typeof b) && (e ? j[k] = m.extend(j[k], b) : j[k].data = m.extend(j[k].data, b)), g = j[k], e || (g.data || (g.data = {}), g = g.data), void 0 !== d && (g[m.camelCase(b)] = d), "string" == typeof b ? (f = g[b], null == f && (f = g[m.camelCase(b)])) : f = g, f;
    }
  }function R(a, b, c) {
    if (m.acceptData(a)) {
      var d,
          e,
          f = a.nodeType,
          g = f ? m.cache : a,
          h = f ? a[m.expando] : m.expando;if (g[h]) {
        if (b && (d = c ? g[h] : g[h].data)) {
          m.isArray(b) ? b = b.concat(m.map(b, m.camelCase)) : b in d ? b = [b] : (b = m.camelCase(b), b = b in d ? [b] : b.split(" ")), e = b.length;while (e--) delete d[b[e]];if (c ? !P(d) : !m.isEmptyObject(d)) return;
        }(c || (delete g[h].data, P(g[h]))) && (f ? m.cleanData([a], !0) : k.deleteExpando || g != g.window ? delete g[h] : g[h] = null);
      }
    }
  }m.extend({ cache: {}, noData: { "applet ": !0, "embed ": !0, "object ": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" }, hasData: function (a) {
      return a = a.nodeType ? m.cache[a[m.expando]] : a[m.expando], !!a && !P(a);
    }, data: function (a, b, c) {
      return Q(a, b, c);
    }, removeData: function (a, b) {
      return R(a, b);
    }, _data: function (a, b, c) {
      return Q(a, b, c, !0);
    }, _removeData: function (a, b) {
      return R(a, b, !0);
    } }), m.fn.extend({ data: function (a, b) {
      var c,
          d,
          e,
          f = this[0],
          g = f && f.attributes;if (void 0 === a) {
        if (this.length && (e = m.data(f), 1 === f.nodeType && !m._data(f, "parsedAttrs"))) {
          c = g.length;while (c--) g[c] && (d = g[c].name, 0 === d.indexOf("data-") && (d = m.camelCase(d.slice(5)), O(f, d, e[d])));m._data(f, "parsedAttrs", !0);
        }return e;
      }return "object" == typeof a ? this.each(function () {
        m.data(this, a);
      }) : arguments.length > 1 ? this.each(function () {
        m.data(this, a, b);
      }) : f ? O(f, a, m.data(f, a)) : void 0;
    }, removeData: function (a) {
      return this.each(function () {
        m.removeData(this, a);
      });
    } }), m.extend({ queue: function (a, b, c) {
      var d;return a ? (b = (b || "fx") + "queue", d = m._data(a, b), c && (!d || m.isArray(c) ? d = m._data(a, b, m.makeArray(c)) : d.push(c)), d || []) : void 0;
    }, dequeue: function (a, b) {
      b = b || "fx";var c = m.queue(a, b),
          d = c.length,
          e = c.shift(),
          f = m._queueHooks(a, b),
          g = function () {
        m.dequeue(a, b);
      };"inprogress" === e && (e = c.shift(), d--), e && ("fx" === b && c.unshift("inprogress"), delete f.stop, e.call(a, g, f)), !d && f && f.empty.fire();
    }, _queueHooks: function (a, b) {
      var c = b + "queueHooks";return m._data(a, c) || m._data(a, c, { empty: m.Callbacks("once memory").add(function () {
          m._removeData(a, b + "queue"), m._removeData(a, c);
        }) });
    } }), m.fn.extend({ queue: function (a, b) {
      var c = 2;return "string" != typeof a && (b = a, a = "fx", c--), arguments.length < c ? m.queue(this[0], a) : void 0 === b ? this : this.each(function () {
        var c = m.queue(this, a, b);m._queueHooks(this, a), "fx" === a && "inprogress" !== c[0] && m.dequeue(this, a);
      });
    }, dequeue: function (a) {
      return this.each(function () {
        m.dequeue(this, a);
      });
    }, clearQueue: function (a) {
      return this.queue(a || "fx", []);
    }, promise: function (a, b) {
      var c,
          d = 1,
          e = m.Deferred(),
          f = this,
          g = this.length,
          h = function () {
        --d || e.resolveWith(f, [f]);
      };"string" != typeof a && (b = a, a = void 0), a = a || "fx";while (g--) c = m._data(f[g], a + "queueHooks"), c && c.empty && (d++, c.empty.add(h));return h(), e.promise(b);
    } });var S = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,
      T = ["Top", "Right", "Bottom", "Left"],
      U = function (a, b) {
    return a = b || a, "none" === m.css(a, "display") || !m.contains(a.ownerDocument, a);
  },
      V = m.access = function (a, b, c, d, e, f, g) {
    var h = 0,
        i = a.length,
        j = null == c;if ("object" === m.type(c)) {
      e = !0;for (h in c) m.access(a, b, h, c[h], !0, f, g);
    } else if (void 0 !== d && (e = !0, m.isFunction(d) || (g = !0), j && (g ? (b.call(a, d), b = null) : (j = b, b = function (a, b, c) {
      return j.call(m(a), c);
    })), b)) for (; i > h; h++) b(a[h], c, g ? d : d.call(a[h], h, b(a[h], c)));return e ? a : j ? b.call(a) : i ? b(a[0], c) : f;
  },
      W = /^(?:checkbox|radio)$/i;!function () {
    var a = y.createElement("input"),
        b = y.createElement("div"),
        c = y.createDocumentFragment();if (b.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>", k.leadingWhitespace = 3 === b.firstChild.nodeType, k.tbody = !b.getElementsByTagName("tbody").length, k.htmlSerialize = !!b.getElementsByTagName("link").length, k.html5Clone = "<:nav></:nav>" !== y.createElement("nav").cloneNode(!0).outerHTML, a.type = "checkbox", a.checked = !0, c.appendChild(a), k.appendChecked = a.checked, b.innerHTML = "<textarea>x</textarea>", k.noCloneChecked = !!b.cloneNode(!0).lastChild.defaultValue, c.appendChild(b), b.innerHTML = "<input type='radio' checked='checked' name='t'/>", k.checkClone = b.cloneNode(!0).cloneNode(!0).lastChild.checked, k.noCloneEvent = !0, b.attachEvent && (b.attachEvent("onclick", function () {
      k.noCloneEvent = !1;
    }), b.cloneNode(!0).click()), null == k.deleteExpando) {
      k.deleteExpando = !0;try {
        delete b.test;
      } catch (d) {
        k.deleteExpando = !1;
      }
    }
  }(), function () {
    var b,
        c,
        d = y.createElement("div");for (b in { submit: !0, change: !0, focusin: !0 }) c = "on" + b, (k[b + "Bubbles"] = c in a) || (d.setAttribute(c, "t"), k[b + "Bubbles"] = d.attributes[c].expando === !1);d = null;
  }();var X = /^(?:input|select|textarea)$/i,
      Y = /^key/,
      Z = /^(?:mouse|pointer|contextmenu)|click/,
      $ = /^(?:focusinfocus|focusoutblur)$/,
      _ = /^([^.]*)(?:\.(.+)|)$/;function ab() {
    return !0;
  }function bb() {
    return !1;
  }function cb() {
    try {
      return y.activeElement;
    } catch (a) {}
  }m.event = { global: {}, add: function (a, b, c, d, e) {
      var f,
          g,
          h,
          i,
          j,
          k,
          l,
          n,
          o,
          p,
          q,
          r = m._data(a);if (r) {
        c.handler && (i = c, c = i.handler, e = i.selector), c.guid || (c.guid = m.guid++), (g = r.events) || (g = r.events = {}), (k = r.handle) || (k = r.handle = function (a) {
          return typeof m === K || a && m.event.triggered === a.type ? void 0 : m.event.dispatch.apply(k.elem, arguments);
        }, k.elem = a), b = (b || "").match(E) || [""], h = b.length;while (h--) f = _.exec(b[h]) || [], o = q = f[1], p = (f[2] || "").split(".").sort(), o && (j = m.event.special[o] || {}, o = (e ? j.delegateType : j.bindType) || o, j = m.event.special[o] || {}, l = m.extend({ type: o, origType: q, data: d, handler: c, guid: c.guid, selector: e, needsContext: e && m.expr.match.needsContext.test(e), namespace: p.join(".") }, i), (n = g[o]) || (n = g[o] = [], n.delegateCount = 0, j.setup && j.setup.call(a, d, p, k) !== !1 || (a.addEventListener ? a.addEventListener(o, k, !1) : a.attachEvent && a.attachEvent("on" + o, k))), j.add && (j.add.call(a, l), l.handler.guid || (l.handler.guid = c.guid)), e ? n.splice(n.delegateCount++, 0, l) : n.push(l), m.event.global[o] = !0);a = null;
      }
    }, remove: function (a, b, c, d, e) {
      var f,
          g,
          h,
          i,
          j,
          k,
          l,
          n,
          o,
          p,
          q,
          r = m.hasData(a) && m._data(a);if (r && (k = r.events)) {
        b = (b || "").match(E) || [""], j = b.length;while (j--) if (h = _.exec(b[j]) || [], o = q = h[1], p = (h[2] || "").split(".").sort(), o) {
          l = m.event.special[o] || {}, o = (d ? l.delegateType : l.bindType) || o, n = k[o] || [], h = h[2] && new RegExp("(^|\\.)" + p.join("\\.(?:.*\\.|)") + "(\\.|$)"), i = f = n.length;while (f--) g = n[f], !e && q !== g.origType || c && c.guid !== g.guid || h && !h.test(g.namespace) || d && d !== g.selector && ("**" !== d || !g.selector) || (n.splice(f, 1), g.selector && n.delegateCount--, l.remove && l.remove.call(a, g));i && !n.length && (l.teardown && l.teardown.call(a, p, r.handle) !== !1 || m.removeEvent(a, o, r.handle), delete k[o]);
        } else for (o in k) m.event.remove(a, o + b[j], c, d, !0);m.isEmptyObject(k) && (delete r.handle, m._removeData(a, "events"));
      }
    }, trigger: function (b, c, d, e) {
      var f,
          g,
          h,
          i,
          k,
          l,
          n,
          o = [d || y],
          p = j.call(b, "type") ? b.type : b,
          q = j.call(b, "namespace") ? b.namespace.split(".") : [];if (h = l = d = d || y, 3 !== d.nodeType && 8 !== d.nodeType && !$.test(p + m.event.triggered) && (p.indexOf(".") >= 0 && (q = p.split("."), p = q.shift(), q.sort()), g = p.indexOf(":") < 0 && "on" + p, b = b[m.expando] ? b : new m.Event(p, "object" == typeof b && b), b.isTrigger = e ? 2 : 3, b.namespace = q.join("."), b.namespace_re = b.namespace ? new RegExp("(^|\\.)" + q.join("\\.(?:.*\\.|)") + "(\\.|$)") : null, b.result = void 0, b.target || (b.target = d), c = null == c ? [b] : m.makeArray(c, [b]), k = m.event.special[p] || {}, e || !k.trigger || k.trigger.apply(d, c) !== !1)) {
        if (!e && !k.noBubble && !m.isWindow(d)) {
          for (i = k.delegateType || p, $.test(i + p) || (h = h.parentNode); h; h = h.parentNode) o.push(h), l = h;l === (d.ownerDocument || y) && o.push(l.defaultView || l.parentWindow || a);
        }n = 0;while ((h = o[n++]) && !b.isPropagationStopped()) b.type = n > 1 ? i : k.bindType || p, f = (m._data(h, "events") || {})[b.type] && m._data(h, "handle"), f && f.apply(h, c), f = g && h[g], f && f.apply && m.acceptData(h) && (b.result = f.apply(h, c), b.result === !1 && b.preventDefault());if (b.type = p, !e && !b.isDefaultPrevented() && (!k._default || k._default.apply(o.pop(), c) === !1) && m.acceptData(d) && g && d[p] && !m.isWindow(d)) {
          l = d[g], l && (d[g] = null), m.event.triggered = p;try {
            d[p]();
          } catch (r) {}m.event.triggered = void 0, l && (d[g] = l);
        }return b.result;
      }
    }, dispatch: function (a) {
      a = m.event.fix(a);var b,
          c,
          e,
          f,
          g,
          h = [],
          i = d.call(arguments),
          j = (m._data(this, "events") || {})[a.type] || [],
          k = m.event.special[a.type] || {};if (i[0] = a, a.delegateTarget = this, !k.preDispatch || k.preDispatch.call(this, a) !== !1) {
        h = m.event.handlers.call(this, a, j), b = 0;while ((f = h[b++]) && !a.isPropagationStopped()) {
          a.currentTarget = f.elem, g = 0;while ((e = f.handlers[g++]) && !a.isImmediatePropagationStopped()) (!a.namespace_re || a.namespace_re.test(e.namespace)) && (a.handleObj = e, a.data = e.data, c = ((m.event.special[e.origType] || {}).handle || e.handler).apply(f.elem, i), void 0 !== c && (a.result = c) === !1 && (a.preventDefault(), a.stopPropagation()));
        }return k.postDispatch && k.postDispatch.call(this, a), a.result;
      }
    }, handlers: function (a, b) {
      var c,
          d,
          e,
          f,
          g = [],
          h = b.delegateCount,
          i = a.target;if (h && i.nodeType && (!a.button || "click" !== a.type)) for (; i != this; i = i.parentNode || this) if (1 === i.nodeType && (i.disabled !== !0 || "click" !== a.type)) {
        for (e = [], f = 0; h > f; f++) d = b[f], c = d.selector + " ", void 0 === e[c] && (e[c] = d.needsContext ? m(c, this).index(i) >= 0 : m.find(c, this, null, [i]).length), e[c] && e.push(d);e.length && g.push({ elem: i, handlers: e });
      }return h < b.length && g.push({ elem: this, handlers: b.slice(h) }), g;
    }, fix: function (a) {
      if (a[m.expando]) return a;var b,
          c,
          d,
          e = a.type,
          f = a,
          g = this.fixHooks[e];g || (this.fixHooks[e] = g = Z.test(e) ? this.mouseHooks : Y.test(e) ? this.keyHooks : {}), d = g.props ? this.props.concat(g.props) : this.props, a = new m.Event(f), b = d.length;while (b--) c = d[b], a[c] = f[c];return a.target || (a.target = f.srcElement || y), 3 === a.target.nodeType && (a.target = a.target.parentNode), a.metaKey = !!a.metaKey, g.filter ? g.filter(a, f) : a;
    }, props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "), fixHooks: {}, keyHooks: { props: "char charCode key keyCode".split(" "), filter: function (a, b) {
        return null == a.which && (a.which = null != b.charCode ? b.charCode : b.keyCode), a;
      } }, mouseHooks: { props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "), filter: function (a, b) {
        var c,
            d,
            e,
            f = b.button,
            g = b.fromElement;return null == a.pageX && null != b.clientX && (d = a.target.ownerDocument || y, e = d.documentElement, c = d.body, a.pageX = b.clientX + (e && e.scrollLeft || c && c.scrollLeft || 0) - (e && e.clientLeft || c && c.clientLeft || 0), a.pageY = b.clientY + (e && e.scrollTop || c && c.scrollTop || 0) - (e && e.clientTop || c && c.clientTop || 0)), !a.relatedTarget && g && (a.relatedTarget = g === a.target ? b.toElement : g), a.which || void 0 === f || (a.which = 1 & f ? 1 : 2 & f ? 3 : 4 & f ? 2 : 0), a;
      } }, special: { load: { noBubble: !0 }, focus: { trigger: function () {
          if (this !== cb() && this.focus) try {
            return this.focus(), !1;
          } catch (a) {}
        }, delegateType: "focusin" }, blur: { trigger: function () {
          return this === cb() && this.blur ? (this.blur(), !1) : void 0;
        }, delegateType: "focusout" }, click: { trigger: function () {
          return m.nodeName(this, "input") && "checkbox" === this.type && this.click ? (this.click(), !1) : void 0;
        }, _default: function (a) {
          return m.nodeName(a.target, "a");
        } }, beforeunload: { postDispatch: function (a) {
          void 0 !== a.result && a.originalEvent && (a.originalEvent.returnValue = a.result);
        } } }, simulate: function (a, b, c, d) {
      var e = m.extend(new m.Event(), c, { type: a, isSimulated: !0, originalEvent: {} });d ? m.event.trigger(e, null, b) : m.event.dispatch.call(b, e), e.isDefaultPrevented() && c.preventDefault();
    } }, m.removeEvent = y.removeEventListener ? function (a, b, c) {
    a.removeEventListener && a.removeEventListener(b, c, !1);
  } : function (a, b, c) {
    var d = "on" + b;a.detachEvent && (typeof a[d] === K && (a[d] = null), a.detachEvent(d, c));
  }, m.Event = function (a, b) {
    return this instanceof m.Event ? (a && a.type ? (this.originalEvent = a, this.type = a.type, this.isDefaultPrevented = a.defaultPrevented || void 0 === a.defaultPrevented && a.returnValue === !1 ? ab : bb) : this.type = a, b && m.extend(this, b), this.timeStamp = a && a.timeStamp || m.now(), void (this[m.expando] = !0)) : new m.Event(a, b);
  }, m.Event.prototype = { isDefaultPrevented: bb, isPropagationStopped: bb, isImmediatePropagationStopped: bb, preventDefault: function () {
      var a = this.originalEvent;this.isDefaultPrevented = ab, a && (a.preventDefault ? a.preventDefault() : a.returnValue = !1);
    }, stopPropagation: function () {
      var a = this.originalEvent;this.isPropagationStopped = ab, a && (a.stopPropagation && a.stopPropagation(), a.cancelBubble = !0);
    }, stopImmediatePropagation: function () {
      var a = this.originalEvent;this.isImmediatePropagationStopped = ab, a && a.stopImmediatePropagation && a.stopImmediatePropagation(), this.stopPropagation();
    } }, m.each({ mouseenter: "mouseover", mouseleave: "mouseout", pointerenter: "pointerover", pointerleave: "pointerout" }, function (a, b) {
    m.event.special[a] = { delegateType: b, bindType: b, handle: function (a) {
        var c,
            d = this,
            e = a.relatedTarget,
            f = a.handleObj;return (!e || e !== d && !m.contains(d, e)) && (a.type = f.origType, c = f.handler.apply(this, arguments), a.type = b), c;
      } };
  }), k.submitBubbles || (m.event.special.submit = { setup: function () {
      return m.nodeName(this, "form") ? !1 : void m.event.add(this, "click._submit keypress._submit", function (a) {
        var b = a.target,
            c = m.nodeName(b, "input") || m.nodeName(b, "button") ? b.form : void 0;c && !m._data(c, "submitBubbles") && (m.event.add(c, "submit._submit", function (a) {
          a._submit_bubble = !0;
        }), m._data(c, "submitBubbles", !0));
      });
    }, postDispatch: function (a) {
      a._submit_bubble && (delete a._submit_bubble, this.parentNode && !a.isTrigger && m.event.simulate("submit", this.parentNode, a, !0));
    }, teardown: function () {
      return m.nodeName(this, "form") ? !1 : void m.event.remove(this, "._submit");
    } }), k.changeBubbles || (m.event.special.change = { setup: function () {
      return X.test(this.nodeName) ? (("checkbox" === this.type || "radio" === this.type) && (m.event.add(this, "propertychange._change", function (a) {
        "checked" === a.originalEvent.propertyName && (this._just_changed = !0);
      }), m.event.add(this, "click._change", function (a) {
        this._just_changed && !a.isTrigger && (this._just_changed = !1), m.event.simulate("change", this, a, !0);
      })), !1) : void m.event.add(this, "beforeactivate._change", function (a) {
        var b = a.target;X.test(b.nodeName) && !m._data(b, "changeBubbles") && (m.event.add(b, "change._change", function (a) {
          !this.parentNode || a.isSimulated || a.isTrigger || m.event.simulate("change", this.parentNode, a, !0);
        }), m._data(b, "changeBubbles", !0));
      });
    }, handle: function (a) {
      var b = a.target;return this !== b || a.isSimulated || a.isTrigger || "radio" !== b.type && "checkbox" !== b.type ? a.handleObj.handler.apply(this, arguments) : void 0;
    }, teardown: function () {
      return m.event.remove(this, "._change"), !X.test(this.nodeName);
    } }), k.focusinBubbles || m.each({ focus: "focusin", blur: "focusout" }, function (a, b) {
    var c = function (a) {
      m.event.simulate(b, a.target, m.event.fix(a), !0);
    };m.event.special[b] = { setup: function () {
        var d = this.ownerDocument || this,
            e = m._data(d, b);e || d.addEventListener(a, c, !0), m._data(d, b, (e || 0) + 1);
      }, teardown: function () {
        var d = this.ownerDocument || this,
            e = m._data(d, b) - 1;e ? m._data(d, b, e) : (d.removeEventListener(a, c, !0), m._removeData(d, b));
      } };
  }), m.fn.extend({ on: function (a, b, c, d, e) {
      var f, g;if ("object" == typeof a) {
        "string" != typeof b && (c = c || b, b = void 0);for (f in a) this.on(f, b, c, a[f], e);return this;
      }if (null == c && null == d ? (d = b, c = b = void 0) : null == d && ("string" == typeof b ? (d = c, c = void 0) : (d = c, c = b, b = void 0)), d === !1) d = bb;else if (!d) return this;return 1 === e && (g = d, d = function (a) {
        return m().off(a), g.apply(this, arguments);
      }, d.guid = g.guid || (g.guid = m.guid++)), this.each(function () {
        m.event.add(this, a, d, c, b);
      });
    }, one: function (a, b, c, d) {
      return this.on(a, b, c, d, 1);
    }, off: function (a, b, c) {
      var d, e;if (a && a.preventDefault && a.handleObj) return d = a.handleObj, m(a.delegateTarget).off(d.namespace ? d.origType + "." + d.namespace : d.origType, d.selector, d.handler), this;if ("object" == typeof a) {
        for (e in a) this.off(e, b, a[e]);return this;
      }return (b === !1 || "function" == typeof b) && (c = b, b = void 0), c === !1 && (c = bb), this.each(function () {
        m.event.remove(this, a, c, b);
      });
    }, trigger: function (a, b) {
      return this.each(function () {
        m.event.trigger(a, b, this);
      });
    }, triggerHandler: function (a, b) {
      var c = this[0];return c ? m.event.trigger(a, b, c, !0) : void 0;
    } });function db(a) {
    var b = eb.split("|"),
        c = a.createDocumentFragment();if (c.createElement) while (b.length) c.createElement(b.pop());return c;
  }var eb = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",
      fb = / jQuery\d+="(?:null|\d+)"/g,
      gb = new RegExp("<(?:" + eb + ")[\\s/>]", "i"),
      hb = /^\s+/,
      ib = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
      jb = /<([\w:]+)/,
      kb = /<tbody/i,
      lb = /<|&#?\w+;/,
      mb = /<(?:script|style|link)/i,
      nb = /checked\s*(?:[^=]|=\s*.checked.)/i,
      ob = /^$|\/(?:java|ecma)script/i,
      pb = /^true\/(.*)/,
      qb = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,
      rb = { option: [1, "<select multiple='multiple'>", "</select>"], legend: [1, "<fieldset>", "</fieldset>"], area: [1, "<map>", "</map>"], param: [1, "<object>", "</object>"], thead: [1, "<table>", "</table>"], tr: [2, "<table><tbody>", "</tbody></table>"], col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"], td: [3, "<table><tbody><tr>", "</tr></tbody></table>"], _default: k.htmlSerialize ? [0, "", ""] : [1, "X<div>", "</div>"] },
      sb = db(y),
      tb = sb.appendChild(y.createElement("div"));rb.optgroup = rb.option, rb.tbody = rb.tfoot = rb.colgroup = rb.caption = rb.thead, rb.th = rb.td;function ub(a, b) {
    var c,
        d,
        e = 0,
        f = typeof a.getElementsByTagName !== K ? a.getElementsByTagName(b || "*") : typeof a.querySelectorAll !== K ? a.querySelectorAll(b || "*") : void 0;if (!f) for (f = [], c = a.childNodes || a; null != (d = c[e]); e++) !b || m.nodeName(d, b) ? f.push(d) : m.merge(f, ub(d, b));return void 0 === b || b && m.nodeName(a, b) ? m.merge([a], f) : f;
  }function vb(a) {
    W.test(a.type) && (a.defaultChecked = a.checked);
  }function wb(a, b) {
    return m.nodeName(a, "table") && m.nodeName(11 !== b.nodeType ? b : b.firstChild, "tr") ? a.getElementsByTagName("tbody")[0] || a.appendChild(a.ownerDocument.createElement("tbody")) : a;
  }function xb(a) {
    return a.type = (null !== m.find.attr(a, "type")) + "/" + a.type, a;
  }function yb(a) {
    var b = pb.exec(a.type);return b ? a.type = b[1] : a.removeAttribute("type"), a;
  }function zb(a, b) {
    for (var c, d = 0; null != (c = a[d]); d++) m._data(c, "globalEval", !b || m._data(b[d], "globalEval"));
  }function Ab(a, b) {
    if (1 === b.nodeType && m.hasData(a)) {
      var c,
          d,
          e,
          f = m._data(a),
          g = m._data(b, f),
          h = f.events;if (h) {
        delete g.handle, g.events = {};for (c in h) for (d = 0, e = h[c].length; e > d; d++) m.event.add(b, c, h[c][d]);
      }g.data && (g.data = m.extend({}, g.data));
    }
  }function Bb(a, b) {
    var c, d, e;if (1 === b.nodeType) {
      if (c = b.nodeName.toLowerCase(), !k.noCloneEvent && b[m.expando]) {
        e = m._data(b);for (d in e.events) m.removeEvent(b, d, e.handle);b.removeAttribute(m.expando);
      }"script" === c && b.text !== a.text ? (xb(b).text = a.text, yb(b)) : "object" === c ? (b.parentNode && (b.outerHTML = a.outerHTML), k.html5Clone && a.innerHTML && !m.trim(b.innerHTML) && (b.innerHTML = a.innerHTML)) : "input" === c && W.test(a.type) ? (b.defaultChecked = b.checked = a.checked, b.value !== a.value && (b.value = a.value)) : "option" === c ? b.defaultSelected = b.selected = a.defaultSelected : ("input" === c || "textarea" === c) && (b.defaultValue = a.defaultValue);
    }
  }m.extend({ clone: function (a, b, c) {
      var d,
          e,
          f,
          g,
          h,
          i = m.contains(a.ownerDocument, a);if (k.html5Clone || m.isXMLDoc(a) || !gb.test("<" + a.nodeName + ">") ? f = a.cloneNode(!0) : (tb.innerHTML = a.outerHTML, tb.removeChild(f = tb.firstChild)), !(k.noCloneEvent && k.noCloneChecked || 1 !== a.nodeType && 11 !== a.nodeType || m.isXMLDoc(a))) for (d = ub(f), h = ub(a), g = 0; null != (e = h[g]); ++g) d[g] && Bb(e, d[g]);if (b) if (c) for (h = h || ub(a), d = d || ub(f), g = 0; null != (e = h[g]); g++) Ab(e, d[g]);else Ab(a, f);return d = ub(f, "script"), d.length > 0 && zb(d, !i && ub(a, "script")), d = h = e = null, f;
    }, buildFragment: function (a, b, c, d) {
      for (var e, f, g, h, i, j, l, n = a.length, o = db(b), p = [], q = 0; n > q; q++) if (f = a[q], f || 0 === f) if ("object" === m.type(f)) m.merge(p, f.nodeType ? [f] : f);else if (lb.test(f)) {
        h = h || o.appendChild(b.createElement("div")), i = (jb.exec(f) || ["", ""])[1].toLowerCase(), l = rb[i] || rb._default, h.innerHTML = l[1] + f.replace(ib, "<$1></$2>") + l[2], e = l[0];while (e--) h = h.lastChild;if (!k.leadingWhitespace && hb.test(f) && p.push(b.createTextNode(hb.exec(f)[0])), !k.tbody) {
          f = "table" !== i || kb.test(f) ? "<table>" !== l[1] || kb.test(f) ? 0 : h : h.firstChild, e = f && f.childNodes.length;while (e--) m.nodeName(j = f.childNodes[e], "tbody") && !j.childNodes.length && f.removeChild(j);
        }m.merge(p, h.childNodes), h.textContent = "";while (h.firstChild) h.removeChild(h.firstChild);h = o.lastChild;
      } else p.push(b.createTextNode(f));h && o.removeChild(h), k.appendChecked || m.grep(ub(p, "input"), vb), q = 0;while (f = p[q++]) if ((!d || -1 === m.inArray(f, d)) && (g = m.contains(f.ownerDocument, f), h = ub(o.appendChild(f), "script"), g && zb(h), c)) {
        e = 0;while (f = h[e++]) ob.test(f.type || "") && c.push(f);
      }return h = null, o;
    }, cleanData: function (a, b) {
      for (var d, e, f, g, h = 0, i = m.expando, j = m.cache, l = k.deleteExpando, n = m.event.special; null != (d = a[h]); h++) if ((b || m.acceptData(d)) && (f = d[i], g = f && j[f])) {
        if (g.events) for (e in g.events) n[e] ? m.event.remove(d, e) : m.removeEvent(d, e, g.handle);j[f] && (delete j[f], l ? delete d[i] : typeof d.removeAttribute !== K ? d.removeAttribute(i) : d[i] = null, c.push(f));
      }
    } }), m.fn.extend({ text: function (a) {
      return V(this, function (a) {
        return void 0 === a ? m.text(this) : this.empty().append((this[0] && this[0].ownerDocument || y).createTextNode(a));
      }, null, a, arguments.length);
    }, append: function () {
      return this.domManip(arguments, function (a) {
        if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
          var b = wb(this, a);b.appendChild(a);
        }
      });
    }, prepend: function () {
      return this.domManip(arguments, function (a) {
        if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
          var b = wb(this, a);b.insertBefore(a, b.firstChild);
        }
      });
    }, before: function () {
      return this.domManip(arguments, function (a) {
        this.parentNode && this.parentNode.insertBefore(a, this);
      });
    }, after: function () {
      return this.domManip(arguments, function (a) {
        this.parentNode && this.parentNode.insertBefore(a, this.nextSibling);
      });
    }, remove: function (a, b) {
      for (var c, d = a ? m.filter(a, this) : this, e = 0; null != (c = d[e]); e++) b || 1 !== c.nodeType || m.cleanData(ub(c)), c.parentNode && (b && m.contains(c.ownerDocument, c) && zb(ub(c, "script")), c.parentNode.removeChild(c));return this;
    }, empty: function () {
      for (var a, b = 0; null != (a = this[b]); b++) {
        1 === a.nodeType && m.cleanData(ub(a, !1));while (a.firstChild) a.removeChild(a.firstChild);a.options && m.nodeName(a, "select") && (a.options.length = 0);
      }return this;
    }, clone: function (a, b) {
      return a = null == a ? !1 : a, b = null == b ? a : b, this.map(function () {
        return m.clone(this, a, b);
      });
    }, html: function (a) {
      return V(this, function (a) {
        var b = this[0] || {},
            c = 0,
            d = this.length;if (void 0 === a) return 1 === b.nodeType ? b.innerHTML.replace(fb, "") : void 0;if (!("string" != typeof a || mb.test(a) || !k.htmlSerialize && gb.test(a) || !k.leadingWhitespace && hb.test(a) || rb[(jb.exec(a) || ["", ""])[1].toLowerCase()])) {
          a = a.replace(ib, "<$1></$2>");try {
            for (; d > c; c++) b = this[c] || {}, 1 === b.nodeType && (m.cleanData(ub(b, !1)), b.innerHTML = a);b = 0;
          } catch (e) {}
        }b && this.empty().append(a);
      }, null, a, arguments.length);
    }, replaceWith: function () {
      var a = arguments[0];return this.domManip(arguments, function (b) {
        a = this.parentNode, m.cleanData(ub(this)), a && a.replaceChild(b, this);
      }), a && (a.length || a.nodeType) ? this : this.remove();
    }, detach: function (a) {
      return this.remove(a, !0);
    }, domManip: function (a, b) {
      a = e.apply([], a);var c,
          d,
          f,
          g,
          h,
          i,
          j = 0,
          l = this.length,
          n = this,
          o = l - 1,
          p = a[0],
          q = m.isFunction(p);if (q || l > 1 && "string" == typeof p && !k.checkClone && nb.test(p)) return this.each(function (c) {
        var d = n.eq(c);q && (a[0] = p.call(this, c, d.html())), d.domManip(a, b);
      });if (l && (i = m.buildFragment(a, this[0].ownerDocument, !1, this), c = i.firstChild, 1 === i.childNodes.length && (i = c), c)) {
        for (g = m.map(ub(i, "script"), xb), f = g.length; l > j; j++) d = i, j !== o && (d = m.clone(d, !0, !0), f && m.merge(g, ub(d, "script"))), b.call(this[j], d, j);if (f) for (h = g[g.length - 1].ownerDocument, m.map(g, yb), j = 0; f > j; j++) d = g[j], ob.test(d.type || "") && !m._data(d, "globalEval") && m.contains(h, d) && (d.src ? m._evalUrl && m._evalUrl(d.src) : m.globalEval((d.text || d.textContent || d.innerHTML || "").replace(qb, "")));i = c = null;
      }return this;
    } }), m.each({ appendTo: "append", prependTo: "prepend", insertBefore: "before", insertAfter: "after", replaceAll: "replaceWith" }, function (a, b) {
    m.fn[a] = function (a) {
      for (var c, d = 0, e = [], g = m(a), h = g.length - 1; h >= d; d++) c = d === h ? this : this.clone(!0), m(g[d])[b](c), f.apply(e, c.get());return this.pushStack(e);
    };
  });var Cb,
      Db = {};function Eb(b, c) {
    var d,
        e = m(c.createElement(b)).appendTo(c.body),
        f = a.getDefaultComputedStyle && (d = a.getDefaultComputedStyle(e[0])) ? d.display : m.css(e[0], "display");return e.detach(), f;
  }function Fb(a) {
    var b = y,
        c = Db[a];return c || (c = Eb(a, b), "none" !== c && c || (Cb = (Cb || m("<iframe frameborder='0' width='0' height='0'/>")).appendTo(b.documentElement), b = (Cb[0].contentWindow || Cb[0].contentDocument).document, b.write(), b.close(), c = Eb(a, b), Cb.detach()), Db[a] = c), c;
  }!function () {
    var a;k.shrinkWrapBlocks = function () {
      if (null != a) return a;a = !1;var b, c, d;return c = y.getElementsByTagName("body")[0], c && c.style ? (b = y.createElement("div"), d = y.createElement("div"), d.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px", c.appendChild(d).appendChild(b), typeof b.style.zoom !== K && (b.style.cssText = "-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:1px;width:1px;zoom:1", b.appendChild(y.createElement("div")).style.width = "5px", a = 3 !== b.offsetWidth), c.removeChild(d), a) : void 0;
    };
  }();var Gb = /^margin/,
      Hb = new RegExp("^(" + S + ")(?!px)[a-z%]+$", "i"),
      Ib,
      Jb,
      Kb = /^(top|right|bottom|left)$/;a.getComputedStyle ? (Ib = function (a) {
    return a.ownerDocument.defaultView.getComputedStyle(a, null);
  }, Jb = function (a, b, c) {
    var d,
        e,
        f,
        g,
        h = a.style;return c = c || Ib(a), g = c ? c.getPropertyValue(b) || c[b] : void 0, c && ("" !== g || m.contains(a.ownerDocument, a) || (g = m.style(a, b)), Hb.test(g) && Gb.test(b) && (d = h.width, e = h.minWidth, f = h.maxWidth, h.minWidth = h.maxWidth = h.width = g, g = c.width, h.width = d, h.minWidth = e, h.maxWidth = f)), void 0 === g ? g : g + "";
  }) : y.documentElement.currentStyle && (Ib = function (a) {
    return a.currentStyle;
  }, Jb = function (a, b, c) {
    var d,
        e,
        f,
        g,
        h = a.style;return c = c || Ib(a), g = c ? c[b] : void 0, null == g && h && h[b] && (g = h[b]), Hb.test(g) && !Kb.test(b) && (d = h.left, e = a.runtimeStyle, f = e && e.left, f && (e.left = a.currentStyle.left), h.left = "fontSize" === b ? "1em" : g, g = h.pixelLeft + "px", h.left = d, f && (e.left = f)), void 0 === g ? g : g + "" || "auto";
  });function Lb(a, b) {
    return { get: function () {
        var c = a();if (null != c) return c ? void delete this.get : (this.get = b).apply(this, arguments);
      } };
  }!function () {
    var b, c, d, e, f, g, h;if (b = y.createElement("div"), b.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>", d = b.getElementsByTagName("a")[0], c = d && d.style) {
      c.cssText = "float:left;opacity:.5", k.opacity = "0.5" === c.opacity, k.cssFloat = !!c.cssFloat, b.style.backgroundClip = "content-box", b.cloneNode(!0).style.backgroundClip = "", k.clearCloneStyle = "content-box" === b.style.backgroundClip, k.boxSizing = "" === c.boxSizing || "" === c.MozBoxSizing || "" === c.WebkitBoxSizing, m.extend(k, { reliableHiddenOffsets: function () {
          return null == g && i(), g;
        }, boxSizingReliable: function () {
          return null == f && i(), f;
        }, pixelPosition: function () {
          return null == e && i(), e;
        }, reliableMarginRight: function () {
          return null == h && i(), h;
        } });function i() {
        var b, c, d, i;c = y.getElementsByTagName("body")[0], c && c.style && (b = y.createElement("div"), d = y.createElement("div"), d.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px", c.appendChild(d).appendChild(b), b.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;display:block;margin-top:1%;top:1%;border:1px;padding:1px;width:4px;position:absolute", e = f = !1, h = !0, a.getComputedStyle && (e = "1%" !== (a.getComputedStyle(b, null) || {}).top, f = "4px" === (a.getComputedStyle(b, null) || { width: "4px" }).width, i = b.appendChild(y.createElement("div")), i.style.cssText = b.style.cssText = "-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:0", i.style.marginRight = i.style.width = "0", b.style.width = "1px", h = !parseFloat((a.getComputedStyle(i, null) || {}).marginRight)), b.innerHTML = "<table><tr><td></td><td>t</td></tr></table>", i = b.getElementsByTagName("td"), i[0].style.cssText = "margin:0;border:0;padding:0;display:none", g = 0 === i[0].offsetHeight, g && (i[0].style.display = "", i[1].style.display = "none", g = 0 === i[0].offsetHeight), c.removeChild(d));
      }
    }
  }(), m.swap = function (a, b, c, d) {
    var e,
        f,
        g = {};for (f in b) g[f] = a.style[f], a.style[f] = b[f];e = c.apply(a, d || []);for (f in b) a.style[f] = g[f];return e;
  };var Mb = /alpha\([^)]*\)/i,
      Nb = /opacity\s*=\s*([^)]*)/,
      Ob = /^(none|table(?!-c[ea]).+)/,
      Pb = new RegExp("^(" + S + ")(.*)$", "i"),
      Qb = new RegExp("^([+-])=(" + S + ")", "i"),
      Rb = { position: "absolute", visibility: "hidden", display: "block" },
      Sb = { letterSpacing: "0", fontWeight: "400" },
      Tb = ["Webkit", "O", "Moz", "ms"];function Ub(a, b) {
    if (b in a) return b;var c = b.charAt(0).toUpperCase() + b.slice(1),
        d = b,
        e = Tb.length;while (e--) if (b = Tb[e] + c, b in a) return b;return d;
  }function Vb(a, b) {
    for (var c, d, e, f = [], g = 0, h = a.length; h > g; g++) d = a[g], d.style && (f[g] = m._data(d, "olddisplay"), c = d.style.display, b ? (f[g] || "none" !== c || (d.style.display = ""), "" === d.style.display && U(d) && (f[g] = m._data(d, "olddisplay", Fb(d.nodeName)))) : (e = U(d), (c && "none" !== c || !e) && m._data(d, "olddisplay", e ? c : m.css(d, "display"))));for (g = 0; h > g; g++) d = a[g], d.style && (b && "none" !== d.style.display && "" !== d.style.display || (d.style.display = b ? f[g] || "" : "none"));return a;
  }function Wb(a, b, c) {
    var d = Pb.exec(b);return d ? Math.max(0, d[1] - (c || 0)) + (d[2] || "px") : b;
  }function Xb(a, b, c, d, e) {
    for (var f = c === (d ? "border" : "content") ? 4 : "width" === b ? 1 : 0, g = 0; 4 > f; f += 2) "margin" === c && (g += m.css(a, c + T[f], !0, e)), d ? ("content" === c && (g -= m.css(a, "padding" + T[f], !0, e)), "margin" !== c && (g -= m.css(a, "border" + T[f] + "Width", !0, e))) : (g += m.css(a, "padding" + T[f], !0, e), "padding" !== c && (g += m.css(a, "border" + T[f] + "Width", !0, e)));return g;
  }function Yb(a, b, c) {
    var d = !0,
        e = "width" === b ? a.offsetWidth : a.offsetHeight,
        f = Ib(a),
        g = k.boxSizing && "border-box" === m.css(a, "boxSizing", !1, f);if (0 >= e || null == e) {
      if (e = Jb(a, b, f), (0 > e || null == e) && (e = a.style[b]), Hb.test(e)) return e;d = g && (k.boxSizingReliable() || e === a.style[b]), e = parseFloat(e) || 0;
    }return e + Xb(a, b, c || (g ? "border" : "content"), d, f) + "px";
  }m.extend({ cssHooks: { opacity: { get: function (a, b) {
          if (b) {
            var c = Jb(a, "opacity");return "" === c ? "1" : c;
          }
        } } }, cssNumber: { columnCount: !0, fillOpacity: !0, flexGrow: !0, flexShrink: !0, fontWeight: !0, lineHeight: !0, opacity: !0, order: !0, orphans: !0, widows: !0, zIndex: !0, zoom: !0 }, cssProps: { "float": k.cssFloat ? "cssFloat" : "styleFloat" }, style: function (a, b, c, d) {
      if (a && 3 !== a.nodeType && 8 !== a.nodeType && a.style) {
        var e,
            f,
            g,
            h = m.camelCase(b),
            i = a.style;if (b = m.cssProps[h] || (m.cssProps[h] = Ub(i, h)), g = m.cssHooks[b] || m.cssHooks[h], void 0 === c) return g && "get" in g && void 0 !== (e = g.get(a, !1, d)) ? e : i[b];if (f = typeof c, "string" === f && (e = Qb.exec(c)) && (c = (e[1] + 1) * e[2] + parseFloat(m.css(a, b)), f = "number"), null != c && c === c && ("number" !== f || m.cssNumber[h] || (c += "px"), k.clearCloneStyle || "" !== c || 0 !== b.indexOf("background") || (i[b] = "inherit"), !(g && "set" in g && void 0 === (c = g.set(a, c, d))))) try {
          i[b] = c;
        } catch (j) {}
      }
    }, css: function (a, b, c, d) {
      var e,
          f,
          g,
          h = m.camelCase(b);return b = m.cssProps[h] || (m.cssProps[h] = Ub(a.style, h)), g = m.cssHooks[b] || m.cssHooks[h], g && "get" in g && (f = g.get(a, !0, c)), void 0 === f && (f = Jb(a, b, d)), "normal" === f && b in Sb && (f = Sb[b]), "" === c || c ? (e = parseFloat(f), c === !0 || m.isNumeric(e) ? e || 0 : f) : f;
    } }), m.each(["height", "width"], function (a, b) {
    m.cssHooks[b] = { get: function (a, c, d) {
        return c ? Ob.test(m.css(a, "display")) && 0 === a.offsetWidth ? m.swap(a, Rb, function () {
          return Yb(a, b, d);
        }) : Yb(a, b, d) : void 0;
      }, set: function (a, c, d) {
        var e = d && Ib(a);return Wb(a, c, d ? Xb(a, b, d, k.boxSizing && "border-box" === m.css(a, "boxSizing", !1, e), e) : 0);
      } };
  }), k.opacity || (m.cssHooks.opacity = { get: function (a, b) {
      return Nb.test((b && a.currentStyle ? a.currentStyle.filter : a.style.filter) || "") ? .01 * parseFloat(RegExp.$1) + "" : b ? "1" : "";
    }, set: function (a, b) {
      var c = a.style,
          d = a.currentStyle,
          e = m.isNumeric(b) ? "alpha(opacity=" + 100 * b + ")" : "",
          f = d && d.filter || c.filter || "";c.zoom = 1, (b >= 1 || "" === b) && "" === m.trim(f.replace(Mb, "")) && c.removeAttribute && (c.removeAttribute("filter"), "" === b || d && !d.filter) || (c.filter = Mb.test(f) ? f.replace(Mb, e) : f + " " + e);
    } }), m.cssHooks.marginRight = Lb(k.reliableMarginRight, function (a, b) {
    return b ? m.swap(a, { display: "inline-block" }, Jb, [a, "marginRight"]) : void 0;
  }), m.each({ margin: "", padding: "", border: "Width" }, function (a, b) {
    m.cssHooks[a + b] = { expand: function (c) {
        for (var d = 0, e = {}, f = "string" == typeof c ? c.split(" ") : [c]; 4 > d; d++) e[a + T[d] + b] = f[d] || f[d - 2] || f[0];return e;
      } }, Gb.test(a) || (m.cssHooks[a + b].set = Wb);
  }), m.fn.extend({ css: function (a, b) {
      return V(this, function (a, b, c) {
        var d,
            e,
            f = {},
            g = 0;if (m.isArray(b)) {
          for (d = Ib(a), e = b.length; e > g; g++) f[b[g]] = m.css(a, b[g], !1, d);return f;
        }return void 0 !== c ? m.style(a, b, c) : m.css(a, b);
      }, a, b, arguments.length > 1);
    }, show: function () {
      return Vb(this, !0);
    }, hide: function () {
      return Vb(this);
    }, toggle: function (a) {
      return "boolean" == typeof a ? a ? this.show() : this.hide() : this.each(function () {
        U(this) ? m(this).show() : m(this).hide();
      });
    } });function Zb(a, b, c, d, e) {
    return new Zb.prototype.init(a, b, c, d, e);
  }m.Tween = Zb, Zb.prototype = { constructor: Zb, init: function (a, b, c, d, e, f) {
      this.elem = a, this.prop = c, this.easing = e || "swing", this.options = b, this.start = this.now = this.cur(), this.end = d, this.unit = f || (m.cssNumber[c] ? "" : "px");
    }, cur: function () {
      var a = Zb.propHooks[this.prop];return a && a.get ? a.get(this) : Zb.propHooks._default.get(this);
    }, run: function (a) {
      var b,
          c = Zb.propHooks[this.prop];return this.pos = b = this.options.duration ? m.easing[this.easing](a, this.options.duration * a, 0, 1, this.options.duration) : a, this.now = (this.end - this.start) * b + this.start, this.options.step && this.options.step.call(this.elem, this.now, this), c && c.set ? c.set(this) : Zb.propHooks._default.set(this), this;
    } }, Zb.prototype.init.prototype = Zb.prototype, Zb.propHooks = { _default: { get: function (a) {
        var b;return null == a.elem[a.prop] || a.elem.style && null != a.elem.style[a.prop] ? (b = m.css(a.elem, a.prop, ""), b && "auto" !== b ? b : 0) : a.elem[a.prop];
      }, set: function (a) {
        m.fx.step[a.prop] ? m.fx.step[a.prop](a) : a.elem.style && (null != a.elem.style[m.cssProps[a.prop]] || m.cssHooks[a.prop]) ? m.style(a.elem, a.prop, a.now + a.unit) : a.elem[a.prop] = a.now;
      } } }, Zb.propHooks.scrollTop = Zb.propHooks.scrollLeft = { set: function (a) {
      a.elem.nodeType && a.elem.parentNode && (a.elem[a.prop] = a.now);
    } }, m.easing = { linear: function (a) {
      return a;
    }, swing: function (a) {
      return .5 - Math.cos(a * Math.PI) / 2;
    } }, m.fx = Zb.prototype.init, m.fx.step = {};var $b,
      _b,
      ac = /^(?:toggle|show|hide)$/,
      bc = new RegExp("^(?:([+-])=|)(" + S + ")([a-z%]*)$", "i"),
      cc = /queueHooks$/,
      dc = [ic],
      ec = { "*": [function (a, b) {
      var c = this.createTween(a, b),
          d = c.cur(),
          e = bc.exec(b),
          f = e && e[3] || (m.cssNumber[a] ? "" : "px"),
          g = (m.cssNumber[a] || "px" !== f && +d) && bc.exec(m.css(c.elem, a)),
          h = 1,
          i = 20;if (g && g[3] !== f) {
        f = f || g[3], e = e || [], g = +d || 1;do h = h || ".5", g /= h, m.style(c.elem, a, g + f); while (h !== (h = c.cur() / d) && 1 !== h && --i);
      }return e && (g = c.start = +g || +d || 0, c.unit = f, c.end = e[1] ? g + (e[1] + 1) * e[2] : +e[2]), c;
    }] };function fc() {
    return setTimeout(function () {
      $b = void 0;
    }), $b = m.now();
  }function gc(a, b) {
    var c,
        d = { height: a },
        e = 0;for (b = b ? 1 : 0; 4 > e; e += 2 - b) c = T[e], d["margin" + c] = d["padding" + c] = a;return b && (d.opacity = d.width = a), d;
  }function hc(a, b, c) {
    for (var d, e = (ec[b] || []).concat(ec["*"]), f = 0, g = e.length; g > f; f++) if (d = e[f].call(c, b, a)) return d;
  }function ic(a, b, c) {
    var d,
        e,
        f,
        g,
        h,
        i,
        j,
        l,
        n = this,
        o = {},
        p = a.style,
        q = a.nodeType && U(a),
        r = m._data(a, "fxshow");c.queue || (h = m._queueHooks(a, "fx"), null == h.unqueued && (h.unqueued = 0, i = h.empty.fire, h.empty.fire = function () {
      h.unqueued || i();
    }), h.unqueued++, n.always(function () {
      n.always(function () {
        h.unqueued--, m.queue(a, "fx").length || h.empty.fire();
      });
    })), 1 === a.nodeType && ("height" in b || "width" in b) && (c.overflow = [p.overflow, p.overflowX, p.overflowY], j = m.css(a, "display"), l = "none" === j ? m._data(a, "olddisplay") || Fb(a.nodeName) : j, "inline" === l && "none" === m.css(a, "float") && (k.inlineBlockNeedsLayout && "inline" !== Fb(a.nodeName) ? p.zoom = 1 : p.display = "inline-block")), c.overflow && (p.overflow = "hidden", k.shrinkWrapBlocks() || n.always(function () {
      p.overflow = c.overflow[0], p.overflowX = c.overflow[1], p.overflowY = c.overflow[2];
    }));for (d in b) if (e = b[d], ac.exec(e)) {
      if (delete b[d], f = f || "toggle" === e, e === (q ? "hide" : "show")) {
        if ("show" !== e || !r || void 0 === r[d]) continue;q = !0;
      }o[d] = r && r[d] || m.style(a, d);
    } else j = void 0;if (m.isEmptyObject(o)) "inline" === ("none" === j ? Fb(a.nodeName) : j) && (p.display = j);else {
      r ? "hidden" in r && (q = r.hidden) : r = m._data(a, "fxshow", {}), f && (r.hidden = !q), q ? m(a).show() : n.done(function () {
        m(a).hide();
      }), n.done(function () {
        var b;m._removeData(a, "fxshow");for (b in o) m.style(a, b, o[b]);
      });for (d in o) g = hc(q ? r[d] : 0, d, n), d in r || (r[d] = g.start, q && (g.end = g.start, g.start = "width" === d || "height" === d ? 1 : 0));
    }
  }function jc(a, b) {
    var c, d, e, f, g;for (c in a) if (d = m.camelCase(c), e = b[d], f = a[c], m.isArray(f) && (e = f[1], f = a[c] = f[0]), c !== d && (a[d] = f, delete a[c]), g = m.cssHooks[d], g && "expand" in g) {
      f = g.expand(f), delete a[d];for (c in f) c in a || (a[c] = f[c], b[c] = e);
    } else b[d] = e;
  }function kc(a, b, c) {
    var d,
        e,
        f = 0,
        g = dc.length,
        h = m.Deferred().always(function () {
      delete i.elem;
    }),
        i = function () {
      if (e) return !1;for (var b = $b || fc(), c = Math.max(0, j.startTime + j.duration - b), d = c / j.duration || 0, f = 1 - d, g = 0, i = j.tweens.length; i > g; g++) j.tweens[g].run(f);return h.notifyWith(a, [j, f, c]), 1 > f && i ? c : (h.resolveWith(a, [j]), !1);
    },
        j = h.promise({ elem: a, props: m.extend({}, b), opts: m.extend(!0, { specialEasing: {} }, c), originalProperties: b, originalOptions: c, startTime: $b || fc(), duration: c.duration, tweens: [], createTween: function (b, c) {
        var d = m.Tween(a, j.opts, b, c, j.opts.specialEasing[b] || j.opts.easing);return j.tweens.push(d), d;
      }, stop: function (b) {
        var c = 0,
            d = b ? j.tweens.length : 0;if (e) return this;for (e = !0; d > c; c++) j.tweens[c].run(1);return b ? h.resolveWith(a, [j, b]) : h.rejectWith(a, [j, b]), this;
      } }),
        k = j.props;for (jc(k, j.opts.specialEasing); g > f; f++) if (d = dc[f].call(j, a, k, j.opts)) return d;return m.map(k, hc, j), m.isFunction(j.opts.start) && j.opts.start.call(a, j), m.fx.timer(m.extend(i, { elem: a, anim: j, queue: j.opts.queue })), j.progress(j.opts.progress).done(j.opts.done, j.opts.complete).fail(j.opts.fail).always(j.opts.always);
  }m.Animation = m.extend(kc, { tweener: function (a, b) {
      m.isFunction(a) ? (b = a, a = ["*"]) : a = a.split(" ");for (var c, d = 0, e = a.length; e > d; d++) c = a[d], ec[c] = ec[c] || [], ec[c].unshift(b);
    }, prefilter: function (a, b) {
      b ? dc.unshift(a) : dc.push(a);
    } }), m.speed = function (a, b, c) {
    var d = a && "object" == typeof a ? m.extend({}, a) : { complete: c || !c && b || m.isFunction(a) && a, duration: a, easing: c && b || b && !m.isFunction(b) && b };return d.duration = m.fx.off ? 0 : "number" == typeof d.duration ? d.duration : d.duration in m.fx.speeds ? m.fx.speeds[d.duration] : m.fx.speeds._default, (null == d.queue || d.queue === !0) && (d.queue = "fx"), d.old = d.complete, d.complete = function () {
      m.isFunction(d.old) && d.old.call(this), d.queue && m.dequeue(this, d.queue);
    }, d;
  }, m.fn.extend({ fadeTo: function (a, b, c, d) {
      return this.filter(U).css("opacity", 0).show().end().animate({ opacity: b }, a, c, d);
    }, animate: function (a, b, c, d) {
      var e = m.isEmptyObject(a),
          f = m.speed(b, c, d),
          g = function () {
        var b = kc(this, m.extend({}, a), f);(e || m._data(this, "finish")) && b.stop(!0);
      };return g.finish = g, e || f.queue === !1 ? this.each(g) : this.queue(f.queue, g);
    }, stop: function (a, b, c) {
      var d = function (a) {
        var b = a.stop;delete a.stop, b(c);
      };return "string" != typeof a && (c = b, b = a, a = void 0), b && a !== !1 && this.queue(a || "fx", []), this.each(function () {
        var b = !0,
            e = null != a && a + "queueHooks",
            f = m.timers,
            g = m._data(this);if (e) g[e] && g[e].stop && d(g[e]);else for (e in g) g[e] && g[e].stop && cc.test(e) && d(g[e]);for (e = f.length; e--;) f[e].elem !== this || null != a && f[e].queue !== a || (f[e].anim.stop(c), b = !1, f.splice(e, 1));(b || !c) && m.dequeue(this, a);
      });
    }, finish: function (a) {
      return a !== !1 && (a = a || "fx"), this.each(function () {
        var b,
            c = m._data(this),
            d = c[a + "queue"],
            e = c[a + "queueHooks"],
            f = m.timers,
            g = d ? d.length : 0;for (c.finish = !0, m.queue(this, a, []), e && e.stop && e.stop.call(this, !0), b = f.length; b--;) f[b].elem === this && f[b].queue === a && (f[b].anim.stop(!0), f.splice(b, 1));for (b = 0; g > b; b++) d[b] && d[b].finish && d[b].finish.call(this);delete c.finish;
      });
    } }), m.each(["toggle", "show", "hide"], function (a, b) {
    var c = m.fn[b];m.fn[b] = function (a, d, e) {
      return null == a || "boolean" == typeof a ? c.apply(this, arguments) : this.animate(gc(b, !0), a, d, e);
    };
  }), m.each({ slideDown: gc("show"), slideUp: gc("hide"), slideToggle: gc("toggle"), fadeIn: { opacity: "show" }, fadeOut: { opacity: "hide" }, fadeToggle: { opacity: "toggle" } }, function (a, b) {
    m.fn[a] = function (a, c, d) {
      return this.animate(b, a, c, d);
    };
  }), m.timers = [], m.fx.tick = function () {
    var a,
        b = m.timers,
        c = 0;for ($b = m.now(); c < b.length; c++) a = b[c], a() || b[c] !== a || b.splice(c--, 1);b.length || m.fx.stop(), $b = void 0;
  }, m.fx.timer = function (a) {
    m.timers.push(a), a() ? m.fx.start() : m.timers.pop();
  }, m.fx.interval = 13, m.fx.start = function () {
    _b || (_b = setInterval(m.fx.tick, m.fx.interval));
  }, m.fx.stop = function () {
    clearInterval(_b), _b = null;
  }, m.fx.speeds = { slow: 600, fast: 200, _default: 400 }, m.fn.delay = function (a, b) {
    return a = m.fx ? m.fx.speeds[a] || a : a, b = b || "fx", this.queue(b, function (b, c) {
      var d = setTimeout(b, a);c.stop = function () {
        clearTimeout(d);
      };
    });
  }, function () {
    var a, b, c, d, e;b = y.createElement("div"), b.setAttribute("className", "t"), b.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>", d = b.getElementsByTagName("a")[0], c = y.createElement("select"), e = c.appendChild(y.createElement("option")), a = b.getElementsByTagName("input")[0], d.style.cssText = "top:1px", k.getSetAttribute = "t" !== b.className, k.style = /top/.test(d.getAttribute("style")), k.hrefNormalized = "/a" === d.getAttribute("href"), k.checkOn = !!a.value, k.optSelected = e.selected, k.enctype = !!y.createElement("form").enctype, c.disabled = !0, k.optDisabled = !e.disabled, a = y.createElement("input"), a.setAttribute("value", ""), k.input = "" === a.getAttribute("value"), a.value = "t", a.setAttribute("type", "radio"), k.radioValue = "t" === a.value;
  }();var lc = /\r/g;m.fn.extend({ val: function (a) {
      var b,
          c,
          d,
          e = this[0];{
        if (arguments.length) return d = m.isFunction(a), this.each(function (c) {
          var e;1 === this.nodeType && (e = d ? a.call(this, c, m(this).val()) : a, null == e ? e = "" : "number" == typeof e ? e += "" : m.isArray(e) && (e = m.map(e, function (a) {
            return null == a ? "" : a + "";
          })), b = m.valHooks[this.type] || m.valHooks[this.nodeName.toLowerCase()], b && "set" in b && void 0 !== b.set(this, e, "value") || (this.value = e));
        });if (e) return b = m.valHooks[e.type] || m.valHooks[e.nodeName.toLowerCase()], b && "get" in b && void 0 !== (c = b.get(e, "value")) ? c : (c = e.value, "string" == typeof c ? c.replace(lc, "") : null == c ? "" : c);
      }
    } }), m.extend({ valHooks: { option: { get: function (a) {
          var b = m.find.attr(a, "value");return null != b ? b : m.trim(m.text(a));
        } }, select: { get: function (a) {
          for (var b, c, d = a.options, e = a.selectedIndex, f = "select-one" === a.type || 0 > e, g = f ? null : [], h = f ? e + 1 : d.length, i = 0 > e ? h : f ? e : 0; h > i; i++) if (c = d[i], !(!c.selected && i !== e || (k.optDisabled ? c.disabled : null !== c.getAttribute("disabled")) || c.parentNode.disabled && m.nodeName(c.parentNode, "optgroup"))) {
            if (b = m(c).val(), f) return b;g.push(b);
          }return g;
        }, set: function (a, b) {
          var c,
              d,
              e = a.options,
              f = m.makeArray(b),
              g = e.length;while (g--) if (d = e[g], m.inArray(m.valHooks.option.get(d), f) >= 0) try {
            d.selected = c = !0;
          } catch (h) {
            d.scrollHeight;
          } else d.selected = !1;return c || (a.selectedIndex = -1), e;
        } } } }), m.each(["radio", "checkbox"], function () {
    m.valHooks[this] = { set: function (a, b) {
        return m.isArray(b) ? a.checked = m.inArray(m(a).val(), b) >= 0 : void 0;
      } }, k.checkOn || (m.valHooks[this].get = function (a) {
      return null === a.getAttribute("value") ? "on" : a.value;
    });
  });var mc,
      nc,
      oc = m.expr.attrHandle,
      pc = /^(?:checked|selected)$/i,
      qc = k.getSetAttribute,
      rc = k.input;m.fn.extend({ attr: function (a, b) {
      return V(this, m.attr, a, b, arguments.length > 1);
    }, removeAttr: function (a) {
      return this.each(function () {
        m.removeAttr(this, a);
      });
    } }), m.extend({ attr: function (a, b, c) {
      var d,
          e,
          f = a.nodeType;if (a && 3 !== f && 8 !== f && 2 !== f) return typeof a.getAttribute === K ? m.prop(a, b, c) : (1 === f && m.isXMLDoc(a) || (b = b.toLowerCase(), d = m.attrHooks[b] || (m.expr.match.bool.test(b) ? nc : mc)), void 0 === c ? d && "get" in d && null !== (e = d.get(a, b)) ? e : (e = m.find.attr(a, b), null == e ? void 0 : e) : null !== c ? d && "set" in d && void 0 !== (e = d.set(a, c, b)) ? e : (a.setAttribute(b, c + ""), c) : void m.removeAttr(a, b));
    }, removeAttr: function (a, b) {
      var c,
          d,
          e = 0,
          f = b && b.match(E);if (f && 1 === a.nodeType) while (c = f[e++]) d = m.propFix[c] || c, m.expr.match.bool.test(c) ? rc && qc || !pc.test(c) ? a[d] = !1 : a[m.camelCase("default-" + c)] = a[d] = !1 : m.attr(a, c, ""), a.removeAttribute(qc ? c : d);
    }, attrHooks: { type: { set: function (a, b) {
          if (!k.radioValue && "radio" === b && m.nodeName(a, "input")) {
            var c = a.value;return a.setAttribute("type", b), c && (a.value = c), b;
          }
        } } } }), nc = { set: function (a, b, c) {
      return b === !1 ? m.removeAttr(a, c) : rc && qc || !pc.test(c) ? a.setAttribute(!qc && m.propFix[c] || c, c) : a[m.camelCase("default-" + c)] = a[c] = !0, c;
    } }, m.each(m.expr.match.bool.source.match(/\w+/g), function (a, b) {
    var c = oc[b] || m.find.attr;oc[b] = rc && qc || !pc.test(b) ? function (a, b, d) {
      var e, f;return d || (f = oc[b], oc[b] = e, e = null != c(a, b, d) ? b.toLowerCase() : null, oc[b] = f), e;
    } : function (a, b, c) {
      return c ? void 0 : a[m.camelCase("default-" + b)] ? b.toLowerCase() : null;
    };
  }), rc && qc || (m.attrHooks.value = { set: function (a, b, c) {
      return m.nodeName(a, "input") ? void (a.defaultValue = b) : mc && mc.set(a, b, c);
    } }), qc || (mc = { set: function (a, b, c) {
      var d = a.getAttributeNode(c);return d || a.setAttributeNode(d = a.ownerDocument.createAttribute(c)), d.value = b += "", "value" === c || b === a.getAttribute(c) ? b : void 0;
    } }, oc.id = oc.name = oc.coords = function (a, b, c) {
    var d;return c ? void 0 : (d = a.getAttributeNode(b)) && "" !== d.value ? d.value : null;
  }, m.valHooks.button = { get: function (a, b) {
      var c = a.getAttributeNode(b);return c && c.specified ? c.value : void 0;
    }, set: mc.set }, m.attrHooks.contenteditable = { set: function (a, b, c) {
      mc.set(a, "" === b ? !1 : b, c);
    } }, m.each(["width", "height"], function (a, b) {
    m.attrHooks[b] = { set: function (a, c) {
        return "" === c ? (a.setAttribute(b, "auto"), c) : void 0;
      } };
  })), k.style || (m.attrHooks.style = { get: function (a) {
      return a.style.cssText || void 0;
    }, set: function (a, b) {
      return a.style.cssText = b + "";
    } });var sc = /^(?:input|select|textarea|button|object)$/i,
      tc = /^(?:a|area)$/i;m.fn.extend({ prop: function (a, b) {
      return V(this, m.prop, a, b, arguments.length > 1);
    }, removeProp: function (a) {
      return a = m.propFix[a] || a, this.each(function () {
        try {
          this[a] = void 0, delete this[a];
        } catch (b) {}
      });
    } }), m.extend({ propFix: { "for": "htmlFor", "class": "className" }, prop: function (a, b, c) {
      var d,
          e,
          f,
          g = a.nodeType;if (a && 3 !== g && 8 !== g && 2 !== g) return f = 1 !== g || !m.isXMLDoc(a), f && (b = m.propFix[b] || b, e = m.propHooks[b]), void 0 !== c ? e && "set" in e && void 0 !== (d = e.set(a, c, b)) ? d : a[b] = c : e && "get" in e && null !== (d = e.get(a, b)) ? d : a[b];
    }, propHooks: { tabIndex: { get: function (a) {
          var b = m.find.attr(a, "tabindex");return b ? parseInt(b, 10) : sc.test(a.nodeName) || tc.test(a.nodeName) && a.href ? 0 : -1;
        } } } }), k.hrefNormalized || m.each(["href", "src"], function (a, b) {
    m.propHooks[b] = { get: function (a) {
        return a.getAttribute(b, 4);
      } };
  }), k.optSelected || (m.propHooks.selected = { get: function (a) {
      var b = a.parentNode;return b && (b.selectedIndex, b.parentNode && b.parentNode.selectedIndex), null;
    } }), m.each(["tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable"], function () {
    m.propFix[this.toLowerCase()] = this;
  }), k.enctype || (m.propFix.enctype = "encoding");var uc = /[\t\r\n\f]/g;m.fn.extend({ addClass: function (a) {
      var b,
          c,
          d,
          e,
          f,
          g,
          h = 0,
          i = this.length,
          j = "string" == typeof a && a;if (m.isFunction(a)) return this.each(function (b) {
        m(this).addClass(a.call(this, b, this.className));
      });if (j) for (b = (a || "").match(E) || []; i > h; h++) if (c = this[h], d = 1 === c.nodeType && (c.className ? (" " + c.className + " ").replace(uc, " ") : " ")) {
        f = 0;while (e = b[f++]) d.indexOf(" " + e + " ") < 0 && (d += e + " ");g = m.trim(d), c.className !== g && (c.className = g);
      }return this;
    }, removeClass: function (a) {
      var b,
          c,
          d,
          e,
          f,
          g,
          h = 0,
          i = this.length,
          j = 0 === arguments.length || "string" == typeof a && a;if (m.isFunction(a)) return this.each(function (b) {
        m(this).removeClass(a.call(this, b, this.className));
      });if (j) for (b = (a || "").match(E) || []; i > h; h++) if (c = this[h], d = 1 === c.nodeType && (c.className ? (" " + c.className + " ").replace(uc, " ") : "")) {
        f = 0;while (e = b[f++]) while (d.indexOf(" " + e + " ") >= 0) d = d.replace(" " + e + " ", " ");g = a ? m.trim(d) : "", c.className !== g && (c.className = g);
      }return this;
    }, toggleClass: function (a, b) {
      var c = typeof a;return "boolean" == typeof b && "string" === c ? b ? this.addClass(a) : this.removeClass(a) : this.each(m.isFunction(a) ? function (c) {
        m(this).toggleClass(a.call(this, c, this.className, b), b);
      } : function () {
        if ("string" === c) {
          var b,
              d = 0,
              e = m(this),
              f = a.match(E) || [];while (b = f[d++]) e.hasClass(b) ? e.removeClass(b) : e.addClass(b);
        } else (c === K || "boolean" === c) && (this.className && m._data(this, "__className__", this.className), this.className = this.className || a === !1 ? "" : m._data(this, "__className__") || "");
      });
    }, hasClass: function (a) {
      for (var b = " " + a + " ", c = 0, d = this.length; d > c; c++) if (1 === this[c].nodeType && (" " + this[c].className + " ").replace(uc, " ").indexOf(b) >= 0) return !0;return !1;
    } }), m.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "), function (a, b) {
    m.fn[b] = function (a, c) {
      return arguments.length > 0 ? this.on(b, null, a, c) : this.trigger(b);
    };
  }), m.fn.extend({ hover: function (a, b) {
      return this.mouseenter(a).mouseleave(b || a);
    }, bind: function (a, b, c) {
      return this.on(a, null, b, c);
    }, unbind: function (a, b) {
      return this.off(a, null, b);
    }, delegate: function (a, b, c, d) {
      return this.on(b, a, c, d);
    }, undelegate: function (a, b, c) {
      return 1 === arguments.length ? this.off(a, "**") : this.off(b, a || "**", c);
    } });var vc = m.now(),
      wc = /\?/,
      xc = /(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g;m.parseJSON = function (b) {
    if (a.JSON && a.JSON.parse) return a.JSON.parse(b + "");var c,
        d = null,
        e = m.trim(b + "");return e && !m.trim(e.replace(xc, function (a, b, e, f) {
      return c && b && (d = 0), 0 === d ? a : (c = e || b, d += !f - !e, "");
    })) ? Function("return " + e)() : m.error("Invalid JSON: " + b);
  }, m.parseXML = function (b) {
    var c, d;if (!b || "string" != typeof b) return null;try {
      a.DOMParser ? (d = new DOMParser(), c = d.parseFromString(b, "text/xml")) : (c = new ActiveXObject("Microsoft.XMLDOM"), c.async = "false", c.loadXML(b));
    } catch (e) {
      c = void 0;
    }return c && c.documentElement && !c.getElementsByTagName("parsererror").length || m.error("Invalid XML: " + b), c;
  };var yc,
      zc,
      Ac = /#.*$/,
      Bc = /([?&])_=[^&]*/,
      Cc = /^(.*?):[ \t]*([^\r\n]*)\r?$/gm,
      Dc = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
      Ec = /^(?:GET|HEAD)$/,
      Fc = /^\/\//,
      Gc = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,
      Hc = {},
      Ic = {},
      Jc = "*/".concat("*");try {
    zc = location.href;
  } catch (Kc) {
    zc = y.createElement("a"), zc.href = "", zc = zc.href;
  }yc = Gc.exec(zc.toLowerCase()) || [];function Lc(a) {
    return function (b, c) {
      "string" != typeof b && (c = b, b = "*");var d,
          e = 0,
          f = b.toLowerCase().match(E) || [];if (m.isFunction(c)) while (d = f[e++]) "+" === d.charAt(0) ? (d = d.slice(1) || "*", (a[d] = a[d] || []).unshift(c)) : (a[d] = a[d] || []).push(c);
    };
  }function Mc(a, b, c, d) {
    var e = {},
        f = a === Ic;function g(h) {
      var i;return e[h] = !0, m.each(a[h] || [], function (a, h) {
        var j = h(b, c, d);return "string" != typeof j || f || e[j] ? f ? !(i = j) : void 0 : (b.dataTypes.unshift(j), g(j), !1);
      }), i;
    }return g(b.dataTypes[0]) || !e["*"] && g("*");
  }function Nc(a, b) {
    var c,
        d,
        e = m.ajaxSettings.flatOptions || {};for (d in b) void 0 !== b[d] && ((e[d] ? a : c || (c = {}))[d] = b[d]);return c && m.extend(!0, a, c), a;
  }function Oc(a, b, c) {
    var d,
        e,
        f,
        g,
        h = a.contents,
        i = a.dataTypes;while ("*" === i[0]) i.shift(), void 0 === e && (e = a.mimeType || b.getResponseHeader("Content-Type"));if (e) for (g in h) if (h[g] && h[g].test(e)) {
      i.unshift(g);break;
    }if (i[0] in c) f = i[0];else {
      for (g in c) {
        if (!i[0] || a.converters[g + " " + i[0]]) {
          f = g;break;
        }d || (d = g);
      }f = f || d;
    }return f ? (f !== i[0] && i.unshift(f), c[f]) : void 0;
  }function Pc(a, b, c, d) {
    var e,
        f,
        g,
        h,
        i,
        j = {},
        k = a.dataTypes.slice();if (k[1]) for (g in a.converters) j[g.toLowerCase()] = a.converters[g];f = k.shift();while (f) if (a.responseFields[f] && (c[a.responseFields[f]] = b), !i && d && a.dataFilter && (b = a.dataFilter(b, a.dataType)), i = f, f = k.shift()) if ("*" === f) f = i;else if ("*" !== i && i !== f) {
      if (g = j[i + " " + f] || j["* " + f], !g) for (e in j) if (h = e.split(" "), h[1] === f && (g = j[i + " " + h[0]] || j["* " + h[0]])) {
        g === !0 ? g = j[e] : j[e] !== !0 && (f = h[0], k.unshift(h[1]));break;
      }if (g !== !0) if (g && a["throws"]) b = g(b);else try {
        b = g(b);
      } catch (l) {
        return { state: "parsererror", error: g ? l : "No conversion from " + i + " to " + f };
      }
    }return { state: "success", data: b };
  }m.extend({ active: 0, lastModified: {}, etag: {}, ajaxSettings: { url: zc, type: "GET", isLocal: Dc.test(yc[1]), global: !0, processData: !0, async: !0, contentType: "application/x-www-form-urlencoded; charset=UTF-8", accepts: { "*": Jc, text: "text/plain", html: "text/html", xml: "application/xml, text/xml", json: "application/json, text/javascript" }, contents: { xml: /xml/, html: /html/, json: /json/ }, responseFields: { xml: "responseXML", text: "responseText", json: "responseJSON" }, converters: { "* text": String, "text html": !0, "text json": m.parseJSON, "text xml": m.parseXML }, flatOptions: { url: !0, context: !0 } }, ajaxSetup: function (a, b) {
      return b ? Nc(Nc(a, m.ajaxSettings), b) : Nc(m.ajaxSettings, a);
    }, ajaxPrefilter: Lc(Hc), ajaxTransport: Lc(Ic), ajax: function (a, b) {
      "object" == typeof a && (b = a, a = void 0), b = b || {};var c,
          d,
          e,
          f,
          g,
          h,
          i,
          j,
          k = m.ajaxSetup({}, b),
          l = k.context || k,
          n = k.context && (l.nodeType || l.jquery) ? m(l) : m.event,
          o = m.Deferred(),
          p = m.Callbacks("once memory"),
          q = k.statusCode || {},
          r = {},
          s = {},
          t = 0,
          u = "canceled",
          v = { readyState: 0, getResponseHeader: function (a) {
          var b;if (2 === t) {
            if (!j) {
              j = {};while (b = Cc.exec(f)) j[b[1].toLowerCase()] = b[2];
            }b = j[a.toLowerCase()];
          }return null == b ? null : b;
        }, getAllResponseHeaders: function () {
          return 2 === t ? f : null;
        }, setRequestHeader: function (a, b) {
          var c = a.toLowerCase();return t || (a = s[c] = s[c] || a, r[a] = b), this;
        }, overrideMimeType: function (a) {
          return t || (k.mimeType = a), this;
        }, statusCode: function (a) {
          var b;if (a) if (2 > t) for (b in a) q[b] = [q[b], a[b]];else v.always(a[v.status]);return this;
        }, abort: function (a) {
          var b = a || u;return i && i.abort(b), x(0, b), this;
        } };if (o.promise(v).complete = p.add, v.success = v.done, v.error = v.fail, k.url = ((a || k.url || zc) + "").replace(Ac, "").replace(Fc, yc[1] + "//"), k.type = b.method || b.type || k.method || k.type, k.dataTypes = m.trim(k.dataType || "*").toLowerCase().match(E) || [""], null == k.crossDomain && (c = Gc.exec(k.url.toLowerCase()), k.crossDomain = !(!c || c[1] === yc[1] && c[2] === yc[2] && (c[3] || ("http:" === c[1] ? "80" : "443")) === (yc[3] || ("http:" === yc[1] ? "80" : "443")))), k.data && k.processData && "string" != typeof k.data && (k.data = m.param(k.data, k.traditional)), Mc(Hc, k, b, v), 2 === t) return v;h = k.global, h && 0 === m.active++ && m.event.trigger("ajaxStart"), k.type = k.type.toUpperCase(), k.hasContent = !Ec.test(k.type), e = k.url, k.hasContent || (k.data && (e = k.url += (wc.test(e) ? "&" : "?") + k.data, delete k.data), k.cache === !1 && (k.url = Bc.test(e) ? e.replace(Bc, "$1_=" + vc++) : e + (wc.test(e) ? "&" : "?") + "_=" + vc++)), k.ifModified && (m.lastModified[e] && v.setRequestHeader("If-Modified-Since", m.lastModified[e]), m.etag[e] && v.setRequestHeader("If-None-Match", m.etag[e])), (k.data && k.hasContent && k.contentType !== !1 || b.contentType) && v.setRequestHeader("Content-Type", k.contentType), v.setRequestHeader("Accept", k.dataTypes[0] && k.accepts[k.dataTypes[0]] ? k.accepts[k.dataTypes[0]] + ("*" !== k.dataTypes[0] ? ", " + Jc + "; q=0.01" : "") : k.accepts["*"]);for (d in k.headers) v.setRequestHeader(d, k.headers[d]);if (k.beforeSend && (k.beforeSend.call(l, v, k) === !1 || 2 === t)) return v.abort();u = "abort";for (d in { success: 1, error: 1, complete: 1 }) v[d](k[d]);if (i = Mc(Ic, k, b, v)) {
        v.readyState = 1, h && n.trigger("ajaxSend", [v, k]), k.async && k.timeout > 0 && (g = setTimeout(function () {
          v.abort("timeout");
        }, k.timeout));try {
          t = 1, i.send(r, x);
        } catch (w) {
          if (!(2 > t)) throw w;x(-1, w);
        }
      } else x(-1, "No Transport");function x(a, b, c, d) {
        var j,
            r,
            s,
            u,
            w,
            x = b;2 !== t && (t = 2, g && clearTimeout(g), i = void 0, f = d || "", v.readyState = a > 0 ? 4 : 0, j = a >= 200 && 300 > a || 304 === a, c && (u = Oc(k, v, c)), u = Pc(k, u, v, j), j ? (k.ifModified && (w = v.getResponseHeader("Last-Modified"), w && (m.lastModified[e] = w), w = v.getResponseHeader("etag"), w && (m.etag[e] = w)), 204 === a || "HEAD" === k.type ? x = "nocontent" : 304 === a ? x = "notmodified" : (x = u.state, r = u.data, s = u.error, j = !s)) : (s = x, (a || !x) && (x = "error", 0 > a && (a = 0))), v.status = a, v.statusText = (b || x) + "", j ? o.resolveWith(l, [r, x, v]) : o.rejectWith(l, [v, x, s]), v.statusCode(q), q = void 0, h && n.trigger(j ? "ajaxSuccess" : "ajaxError", [v, k, j ? r : s]), p.fireWith(l, [v, x]), h && (n.trigger("ajaxComplete", [v, k]), --m.active || m.event.trigger("ajaxStop")));
      }return v;
    }, getJSON: function (a, b, c) {
      return m.get(a, b, c, "json");
    }, getScript: function (a, b) {
      return m.get(a, void 0, b, "script");
    } }), m.each(["get", "post"], function (a, b) {
    m[b] = function (a, c, d, e) {
      return m.isFunction(c) && (e = e || d, d = c, c = void 0), m.ajax({ url: a, type: b, dataType: e, data: c, success: d });
    };
  }), m.each(["ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend"], function (a, b) {
    m.fn[b] = function (a) {
      return this.on(b, a);
    };
  }), m._evalUrl = function (a) {
    return m.ajax({ url: a, type: "GET", dataType: "script", async: !1, global: !1, "throws": !0 });
  }, m.fn.extend({ wrapAll: function (a) {
      if (m.isFunction(a)) return this.each(function (b) {
        m(this).wrapAll(a.call(this, b));
      });if (this[0]) {
        var b = m(a, this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode && b.insertBefore(this[0]), b.map(function () {
          var a = this;while (a.firstChild && 1 === a.firstChild.nodeType) a = a.firstChild;return a;
        }).append(this);
      }return this;
    }, wrapInner: function (a) {
      return this.each(m.isFunction(a) ? function (b) {
        m(this).wrapInner(a.call(this, b));
      } : function () {
        var b = m(this),
            c = b.contents();c.length ? c.wrapAll(a) : b.append(a);
      });
    }, wrap: function (a) {
      var b = m.isFunction(a);return this.each(function (c) {
        m(this).wrapAll(b ? a.call(this, c) : a);
      });
    }, unwrap: function () {
      return this.parent().each(function () {
        m.nodeName(this, "body") || m(this).replaceWith(this.childNodes);
      }).end();
    } }), m.expr.filters.hidden = function (a) {
    return a.offsetWidth <= 0 && a.offsetHeight <= 0 || !k.reliableHiddenOffsets() && "none" === (a.style && a.style.display || m.css(a, "display"));
  }, m.expr.filters.visible = function (a) {
    return !m.expr.filters.hidden(a);
  };var Qc = /%20/g,
      Rc = /\[\]$/,
      Sc = /\r?\n/g,
      Tc = /^(?:submit|button|image|reset|file)$/i,
      Uc = /^(?:input|select|textarea|keygen)/i;function Vc(a, b, c, d) {
    var e;if (m.isArray(b)) m.each(b, function (b, e) {
      c || Rc.test(a) ? d(a, e) : Vc(a + "[" + ("object" == typeof e ? b : "") + "]", e, c, d);
    });else if (c || "object" !== m.type(b)) d(a, b);else for (e in b) Vc(a + "[" + e + "]", b[e], c, d);
  }m.param = function (a, b) {
    var c,
        d = [],
        e = function (a, b) {
      b = m.isFunction(b) ? b() : null == b ? "" : b, d[d.length] = encodeURIComponent(a) + "=" + encodeURIComponent(b);
    };if (void 0 === b && (b = m.ajaxSettings && m.ajaxSettings.traditional), m.isArray(a) || a.jquery && !m.isPlainObject(a)) m.each(a, function () {
      e(this.name, this.value);
    });else for (c in a) Vc(c, a[c], b, e);return d.join("&").replace(Qc, "+");
  }, m.fn.extend({ serialize: function () {
      return m.param(this.serializeArray());
    }, serializeArray: function () {
      return this.map(function () {
        var a = m.prop(this, "elements");return a ? m.makeArray(a) : this;
      }).filter(function () {
        var a = this.type;return this.name && !m(this).is(":disabled") && Uc.test(this.nodeName) && !Tc.test(a) && (this.checked || !W.test(a));
      }).map(function (a, b) {
        var c = m(this).val();return null == c ? null : m.isArray(c) ? m.map(c, function (a) {
          return { name: b.name, value: a.replace(Sc, "\r\n") };
        }) : { name: b.name, value: c.replace(Sc, "\r\n") };
      }).get();
    } }), m.ajaxSettings.xhr = void 0 !== a.ActiveXObject ? function () {
    return !this.isLocal && /^(get|post|head|put|delete|options)$/i.test(this.type) && Zc() || $c();
  } : Zc;var Wc = 0,
      Xc = {},
      Yc = m.ajaxSettings.xhr();a.ActiveXObject && m(a).on("unload", function () {
    for (var a in Xc) Xc[a](void 0, !0);
  }), k.cors = !!Yc && "withCredentials" in Yc, Yc = k.ajax = !!Yc, Yc && m.ajaxTransport(function (a) {
    if (!a.crossDomain || k.cors) {
      var b;return { send: function (c, d) {
          var e,
              f = a.xhr(),
              g = ++Wc;if (f.open(a.type, a.url, a.async, a.username, a.password), a.xhrFields) for (e in a.xhrFields) f[e] = a.xhrFields[e];a.mimeType && f.overrideMimeType && f.overrideMimeType(a.mimeType), a.crossDomain || c["X-Requested-With"] || (c["X-Requested-With"] = "XMLHttpRequest");for (e in c) void 0 !== c[e] && f.setRequestHeader(e, c[e] + "");f.send(a.hasContent && a.data || null), b = function (c, e) {
            var h, i, j;if (b && (e || 4 === f.readyState)) if (delete Xc[g], b = void 0, f.onreadystatechange = m.noop, e) 4 !== f.readyState && f.abort();else {
              j = {}, h = f.status, "string" == typeof f.responseText && (j.text = f.responseText);try {
                i = f.statusText;
              } catch (k) {
                i = "";
              }h || !a.isLocal || a.crossDomain ? 1223 === h && (h = 204) : h = j.text ? 200 : 404;
            }j && d(h, i, j, f.getAllResponseHeaders());
          }, a.async ? 4 === f.readyState ? setTimeout(b) : f.onreadystatechange = Xc[g] = b : b();
        }, abort: function () {
          b && b(void 0, !0);
        } };
    }
  });function Zc() {
    try {
      return new a.XMLHttpRequest();
    } catch (b) {}
  }function $c() {
    try {
      return new a.ActiveXObject("Microsoft.XMLHTTP");
    } catch (b) {}
  }m.ajaxSetup({ accepts: { script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript" }, contents: { script: /(?:java|ecma)script/ }, converters: { "text script": function (a) {
        return m.globalEval(a), a;
      } } }), m.ajaxPrefilter("script", function (a) {
    void 0 === a.cache && (a.cache = !1), a.crossDomain && (a.type = "GET", a.global = !1);
  }), m.ajaxTransport("script", function (a) {
    if (a.crossDomain) {
      var b,
          c = y.head || m("head")[0] || y.documentElement;return { send: function (d, e) {
          b = y.createElement("script"), b.async = !0, a.scriptCharset && (b.charset = a.scriptCharset), b.src = a.url, b.onload = b.onreadystatechange = function (a, c) {
            (c || !b.readyState || /loaded|complete/.test(b.readyState)) && (b.onload = b.onreadystatechange = null, b.parentNode && b.parentNode.removeChild(b), b = null, c || e(200, "success"));
          }, c.insertBefore(b, c.firstChild);
        }, abort: function () {
          b && b.onload(void 0, !0);
        } };
    }
  });var _c = [],
      ad = /(=)\?(?=&|$)|\?\?/;m.ajaxSetup({ jsonp: "callback", jsonpCallback: function () {
      var a = _c.pop() || m.expando + "_" + vc++;return this[a] = !0, a;
    } }), m.ajaxPrefilter("json jsonp", function (b, c, d) {
    var e,
        f,
        g,
        h = b.jsonp !== !1 && (ad.test(b.url) ? "url" : "string" == typeof b.data && !(b.contentType || "").indexOf("application/x-www-form-urlencoded") && ad.test(b.data) && "data");return h || "jsonp" === b.dataTypes[0] ? (e = b.jsonpCallback = m.isFunction(b.jsonpCallback) ? b.jsonpCallback() : b.jsonpCallback, h ? b[h] = b[h].replace(ad, "$1" + e) : b.jsonp !== !1 && (b.url += (wc.test(b.url) ? "&" : "?") + b.jsonp + "=" + e), b.converters["script json"] = function () {
      return g || m.error(e + " was not called"), g[0];
    }, b.dataTypes[0] = "json", f = a[e], a[e] = function () {
      g = arguments;
    }, d.always(function () {
      a[e] = f, b[e] && (b.jsonpCallback = c.jsonpCallback, _c.push(e)), g && m.isFunction(f) && f(g[0]), g = f = void 0;
    }), "script") : void 0;
  }), m.parseHTML = function (a, b, c) {
    if (!a || "string" != typeof a) return null;"boolean" == typeof b && (c = b, b = !1), b = b || y;var d = u.exec(a),
        e = !c && [];return d ? [b.createElement(d[1])] : (d = m.buildFragment([a], b, e), e && e.length && m(e).remove(), m.merge([], d.childNodes));
  };var bd = m.fn.load;m.fn.load = function (a, b, c) {
    if ("string" != typeof a && bd) return bd.apply(this, arguments);var d,
        e,
        f,
        g = this,
        h = a.indexOf(" ");return h >= 0 && (d = m.trim(a.slice(h, a.length)), a = a.slice(0, h)), m.isFunction(b) ? (c = b, b = void 0) : b && "object" == typeof b && (f = "POST"), g.length > 0 && m.ajax({ url: a, type: f, dataType: "html", data: b }).done(function (a) {
      e = arguments, g.html(d ? m("<div>").append(m.parseHTML(a)).find(d) : a);
    }).complete(c && function (a, b) {
      g.each(c, e || [a.responseText, b, a]);
    }), this;
  }, m.expr.filters.animated = function (a) {
    return m.grep(m.timers, function (b) {
      return a === b.elem;
    }).length;
  };var cd = a.document.documentElement;function dd(a) {
    return m.isWindow(a) ? a : 9 === a.nodeType ? a.defaultView || a.parentWindow : !1;
  }m.offset = { setOffset: function (a, b, c) {
      var d,
          e,
          f,
          g,
          h,
          i,
          j,
          k = m.css(a, "position"),
          l = m(a),
          n = {};"static" === k && (a.style.position = "relative"), h = l.offset(), f = m.css(a, "top"), i = m.css(a, "left"), j = ("absolute" === k || "fixed" === k) && m.inArray("auto", [f, i]) > -1, j ? (d = l.position(), g = d.top, e = d.left) : (g = parseFloat(f) || 0, e = parseFloat(i) || 0), m.isFunction(b) && (b = b.call(a, c, h)), null != b.top && (n.top = b.top - h.top + g), null != b.left && (n.left = b.left - h.left + e), "using" in b ? b.using.call(a, n) : l.css(n);
    } }, m.fn.extend({ offset: function (a) {
      if (arguments.length) return void 0 === a ? this : this.each(function (b) {
        m.offset.setOffset(this, a, b);
      });var b,
          c,
          d = { top: 0, left: 0 },
          e = this[0],
          f = e && e.ownerDocument;if (f) return b = f.documentElement, m.contains(b, e) ? (typeof e.getBoundingClientRect !== K && (d = e.getBoundingClientRect()), c = dd(f), { top: d.top + (c.pageYOffset || b.scrollTop) - (b.clientTop || 0), left: d.left + (c.pageXOffset || b.scrollLeft) - (b.clientLeft || 0) }) : d;
    }, position: function () {
      if (this[0]) {
        var a,
            b,
            c = { top: 0, left: 0 },
            d = this[0];return "fixed" === m.css(d, "position") ? b = d.getBoundingClientRect() : (a = this.offsetParent(), b = this.offset(), m.nodeName(a[0], "html") || (c = a.offset()), c.top += m.css(a[0], "borderTopWidth", !0), c.left += m.css(a[0], "borderLeftWidth", !0)), { top: b.top - c.top - m.css(d, "marginTop", !0), left: b.left - c.left - m.css(d, "marginLeft", !0) };
      }
    }, offsetParent: function () {
      return this.map(function () {
        var a = this.offsetParent || cd;while (a && !m.nodeName(a, "html") && "static" === m.css(a, "position")) a = a.offsetParent;return a || cd;
      });
    } }), m.each({ scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function (a, b) {
    var c = /Y/.test(b);m.fn[a] = function (d) {
      return V(this, function (a, d, e) {
        var f = dd(a);return void 0 === e ? f ? b in f ? f[b] : f.document.documentElement[d] : a[d] : void (f ? f.scrollTo(c ? m(f).scrollLeft() : e, c ? e : m(f).scrollTop()) : a[d] = e);
      }, a, d, arguments.length, null);
    };
  }), m.each(["top", "left"], function (a, b) {
    m.cssHooks[b] = Lb(k.pixelPosition, function (a, c) {
      return c ? (c = Jb(a, b), Hb.test(c) ? m(a).position()[b] + "px" : c) : void 0;
    });
  }), m.each({ Height: "height", Width: "width" }, function (a, b) {
    m.each({ padding: "inner" + a, content: b, "": "outer" + a }, function (c, d) {
      m.fn[d] = function (d, e) {
        var f = arguments.length && (c || "boolean" != typeof d),
            g = c || (d === !0 || e === !0 ? "margin" : "border");return V(this, function (b, c, d) {
          var e;return m.isWindow(b) ? b.document.documentElement["client" + a] : 9 === b.nodeType ? (e = b.documentElement, Math.max(b.body["scroll" + a], e["scroll" + a], b.body["offset" + a], e["offset" + a], e["client" + a])) : void 0 === d ? m.css(b, c, g) : m.style(b, c, d, g);
        }, b, f ? d : void 0, f, null);
      };
    });
  }), m.fn.size = function () {
    return this.length;
  }, m.fn.andSelf = m.fn.addBack, "function" == typeof define && define.amd && define("jquery", [], function () {
    return m;
  });var ed = a.jQuery,
      fd = a.$;return m.noConflict = function (b) {
    return a.$ === m && (a.$ = fd), b && a.jQuery === m && (a.jQuery = ed), m;
  }, typeof b === K && (a.jQuery = a.$ = m), m;
});
/*! jQuery v1.12.4 | (c) jQuery Foundation | jquery.org/license */
!function (a, b) {
  "object" == typeof module && "object" == typeof module.exports ? module.exports = a.document ? b(a, !0) : function (a) {
    if (!a.document) throw new Error("jQuery requires a window with a document");return b(a);
  } : b(a);
}("undefined" != typeof window ? window : this, function (a, b) {
  var c = [],
      d = a.document,
      e = c.slice,
      f = c.concat,
      g = c.push,
      h = c.indexOf,
      i = {},
      j = i.toString,
      k = i.hasOwnProperty,
      l = {},
      m = "1.12.4",
      n = function (a, b) {
    return new n.fn.init(a, b);
  },
      o = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
      p = /^-ms-/,
      q = /-([\da-z])/gi,
      r = function (a, b) {
    return b.toUpperCase();
  };n.fn = n.prototype = { jquery: m, constructor: n, selector: "", length: 0, toArray: function () {
      return e.call(this);
    }, get: function (a) {
      return null != a ? 0 > a ? this[a + this.length] : this[a] : e.call(this);
    }, pushStack: function (a) {
      var b = n.merge(this.constructor(), a);return b.prevObject = this, b.context = this.context, b;
    }, each: function (a) {
      return n.each(this, a);
    }, map: function (a) {
      return this.pushStack(n.map(this, function (b, c) {
        return a.call(b, c, b);
      }));
    }, slice: function () {
      return this.pushStack(e.apply(this, arguments));
    }, first: function () {
      return this.eq(0);
    }, last: function () {
      return this.eq(-1);
    }, eq: function (a) {
      var b = this.length,
          c = +a + (0 > a ? b : 0);return this.pushStack(c >= 0 && b > c ? [this[c]] : []);
    }, end: function () {
      return this.prevObject || this.constructor();
    }, push: g, sort: c.sort, splice: c.splice }, n.extend = n.fn.extend = function () {
    var a,
        b,
        c,
        d,
        e,
        f,
        g = arguments[0] || {},
        h = 1,
        i = arguments.length,
        j = !1;for ("boolean" == typeof g && (j = g, g = arguments[h] || {}, h++), "object" == typeof g || n.isFunction(g) || (g = {}), h === i && (g = this, h--); i > h; h++) if (null != (e = arguments[h])) for (d in e) a = g[d], c = e[d], g !== c && (j && c && (n.isPlainObject(c) || (b = n.isArray(c))) ? (b ? (b = !1, f = a && n.isArray(a) ? a : []) : f = a && n.isPlainObject(a) ? a : {}, g[d] = n.extend(j, f, c)) : void 0 !== c && (g[d] = c));return g;
  }, n.extend({ expando: "jQuery" + (m + Math.random()).replace(/\D/g, ""), isReady: !0, error: function (a) {
      throw new Error(a);
    }, noop: function () {}, isFunction: function (a) {
      return "function" === n.type(a);
    }, isArray: Array.isArray || function (a) {
      return "array" === n.type(a);
    }, isWindow: function (a) {
      return null != a && a == a.window;
    }, isNumeric: function (a) {
      var b = a && a.toString();return !n.isArray(a) && b - parseFloat(b) + 1 >= 0;
    }, isEmptyObject: function (a) {
      var b;for (b in a) return !1;return !0;
    }, isPlainObject: function (a) {
      var b;if (!a || "object" !== n.type(a) || a.nodeType || n.isWindow(a)) return !1;try {
        if (a.constructor && !k.call(a, "constructor") && !k.call(a.constructor.prototype, "isPrototypeOf")) return !1;
      } catch (c) {
        return !1;
      }if (!l.ownFirst) for (b in a) return k.call(a, b);for (b in a);return void 0 === b || k.call(a, b);
    }, type: function (a) {
      return null == a ? a + "" : "object" == typeof a || "function" == typeof a ? i[j.call(a)] || "object" : typeof a;
    }, globalEval: function (b) {
      b && n.trim(b) && (a.execScript || function (b) {
        a.eval.call(a, b);
      })(b);
    }, camelCase: function (a) {
      return a.replace(p, "ms-").replace(q, r);
    }, nodeName: function (a, b) {
      return a.nodeName && a.nodeName.toLowerCase() === b.toLowerCase();
    }, each: function (a, b) {
      var c,
          d = 0;if (s(a)) {
        for (c = a.length; c > d; d++) if (b.call(a[d], d, a[d]) === !1) break;
      } else for (d in a) if (b.call(a[d], d, a[d]) === !1) break;return a;
    }, trim: function (a) {
      return null == a ? "" : (a + "").replace(o, "");
    }, makeArray: function (a, b) {
      var c = b || [];return null != a && (s(Object(a)) ? n.merge(c, "string" == typeof a ? [a] : a) : g.call(c, a)), c;
    }, inArray: function (a, b, c) {
      var d;if (b) {
        if (h) return h.call(b, a, c);for (d = b.length, c = c ? 0 > c ? Math.max(0, d + c) : c : 0; d > c; c++) if (c in b && b[c] === a) return c;
      }return -1;
    }, merge: function (a, b) {
      var c = +b.length,
          d = 0,
          e = a.length;while (c > d) a[e++] = b[d++];if (c !== c) while (void 0 !== b[d]) a[e++] = b[d++];return a.length = e, a;
    }, grep: function (a, b, c) {
      for (var d, e = [], f = 0, g = a.length, h = !c; g > f; f++) d = !b(a[f], f), d !== h && e.push(a[f]);return e;
    }, map: function (a, b, c) {
      var d,
          e,
          g = 0,
          h = [];if (s(a)) for (d = a.length; d > g; g++) e = b(a[g], g, c), null != e && h.push(e);else for (g in a) e = b(a[g], g, c), null != e && h.push(e);return f.apply([], h);
    }, guid: 1, proxy: function (a, b) {
      var c, d, f;return "string" == typeof b && (f = a[b], b = a, a = f), n.isFunction(a) ? (c = e.call(arguments, 2), d = function () {
        return a.apply(b || this, c.concat(e.call(arguments)));
      }, d.guid = a.guid = a.guid || n.guid++, d) : void 0;
    }, now: function () {
      return +new Date();
    }, support: l }), "function" == typeof Symbol && (n.fn[Symbol.iterator] = c[Symbol.iterator]), n.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "), function (a, b) {
    i["[object " + b + "]"] = b.toLowerCase();
  });function s(a) {
    var b = !!a && "length" in a && a.length,
        c = n.type(a);return "function" === c || n.isWindow(a) ? !1 : "array" === c || 0 === b || "number" == typeof b && b > 0 && b - 1 in a;
  }var t = function (a) {
    var b,
        c,
        d,
        e,
        f,
        g,
        h,
        i,
        j,
        k,
        l,
        m,
        n,
        o,
        p,
        q,
        r,
        s,
        t,
        u = "sizzle" + 1 * new Date(),
        v = a.document,
        w = 0,
        x = 0,
        y = ga(),
        z = ga(),
        A = ga(),
        B = function (a, b) {
      return a === b && (l = !0), 0;
    },
        C = 1 << 31,
        D = {}.hasOwnProperty,
        E = [],
        F = E.pop,
        G = E.push,
        H = E.push,
        I = E.slice,
        J = function (a, b) {
      for (var c = 0, d = a.length; d > c; c++) if (a[c] === b) return c;return -1;
    },
        K = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",
        L = "[\\x20\\t\\r\\n\\f]",
        M = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",
        N = "\\[" + L + "*(" + M + ")(?:" + L + "*([*^$|!~]?=)" + L + "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + M + "))|)" + L + "*\\]",
        O = ":(" + M + ")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|" + N + ")*)|.*)\\)|)",
        P = new RegExp(L + "+", "g"),
        Q = new RegExp("^" + L + "+|((?:^|[^\\\\])(?:\\\\.)*)" + L + "+$", "g"),
        R = new RegExp("^" + L + "*," + L + "*"),
        S = new RegExp("^" + L + "*([>+~]|" + L + ")" + L + "*"),
        T = new RegExp("=" + L + "*([^\\]'\"]*?)" + L + "*\\]", "g"),
        U = new RegExp(O),
        V = new RegExp("^" + M + "$"),
        W = { ID: new RegExp("^#(" + M + ")"), CLASS: new RegExp("^\\.(" + M + ")"), TAG: new RegExp("^(" + M + "|[*])"), ATTR: new RegExp("^" + N), PSEUDO: new RegExp("^" + O), CHILD: new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + L + "*(even|odd|(([+-]|)(\\d*)n|)" + L + "*(?:([+-]|)" + L + "*(\\d+)|))" + L + "*\\)|)", "i"), bool: new RegExp("^(?:" + K + ")$", "i"), needsContext: new RegExp("^" + L + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + L + "*((?:-\\d)?\\d*)" + L + "*\\)|)(?=[^-]|$)", "i") },
        X = /^(?:input|select|textarea|button)$/i,
        Y = /^h\d$/i,
        Z = /^[^{]+\{\s*\[native \w/,
        $ = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
        _ = /[+~]/,
        aa = /'|\\/g,
        ba = new RegExp("\\\\([\\da-f]{1,6}" + L + "?|(" + L + ")|.)", "ig"),
        ca = function (a, b, c) {
      var d = "0x" + b - 65536;return d !== d || c ? b : 0 > d ? String.fromCharCode(d + 65536) : String.fromCharCode(d >> 10 | 55296, 1023 & d | 56320);
    },
        da = function () {
      m();
    };try {
      H.apply(E = I.call(v.childNodes), v.childNodes), E[v.childNodes.length].nodeType;
    } catch (ea) {
      H = { apply: E.length ? function (a, b) {
          G.apply(a, I.call(b));
        } : function (a, b) {
          var c = a.length,
              d = 0;while (a[c++] = b[d++]);a.length = c - 1;
        } };
    }function fa(a, b, d, e) {
      var f,
          h,
          j,
          k,
          l,
          o,
          r,
          s,
          w = b && b.ownerDocument,
          x = b ? b.nodeType : 9;if (d = d || [], "string" != typeof a || !a || 1 !== x && 9 !== x && 11 !== x) return d;if (!e && ((b ? b.ownerDocument || b : v) !== n && m(b), b = b || n, p)) {
        if (11 !== x && (o = $.exec(a))) if (f = o[1]) {
          if (9 === x) {
            if (!(j = b.getElementById(f))) return d;if (j.id === f) return d.push(j), d;
          } else if (w && (j = w.getElementById(f)) && t(b, j) && j.id === f) return d.push(j), d;
        } else {
          if (o[2]) return H.apply(d, b.getElementsByTagName(a)), d;if ((f = o[3]) && c.getElementsByClassName && b.getElementsByClassName) return H.apply(d, b.getElementsByClassName(f)), d;
        }if (c.qsa && !A[a + " "] && (!q || !q.test(a))) {
          if (1 !== x) w = b, s = a;else if ("object" !== b.nodeName.toLowerCase()) {
            (k = b.getAttribute("id")) ? k = k.replace(aa, "\\$&") : b.setAttribute("id", k = u), r = g(a), h = r.length, l = V.test(k) ? "#" + k : "[id='" + k + "']";while (h--) r[h] = l + " " + qa(r[h]);s = r.join(","), w = _.test(a) && oa(b.parentNode) || b;
          }if (s) try {
            return H.apply(d, w.querySelectorAll(s)), d;
          } catch (y) {} finally {
            k === u && b.removeAttribute("id");
          }
        }
      }return i(a.replace(Q, "$1"), b, d, e);
    }function ga() {
      var a = [];function b(c, e) {
        return a.push(c + " ") > d.cacheLength && delete b[a.shift()], b[c + " "] = e;
      }return b;
    }function ha(a) {
      return a[u] = !0, a;
    }function ia(a) {
      var b = n.createElement("div");try {
        return !!a(b);
      } catch (c) {
        return !1;
      } finally {
        b.parentNode && b.parentNode.removeChild(b), b = null;
      }
    }function ja(a, b) {
      var c = a.split("|"),
          e = c.length;while (e--) d.attrHandle[c[e]] = b;
    }function ka(a, b) {
      var c = b && a,
          d = c && 1 === a.nodeType && 1 === b.nodeType && (~b.sourceIndex || C) - (~a.sourceIndex || C);if (d) return d;if (c) while (c = c.nextSibling) if (c === b) return -1;return a ? 1 : -1;
    }function la(a) {
      return function (b) {
        var c = b.nodeName.toLowerCase();return "input" === c && b.type === a;
      };
    }function ma(a) {
      return function (b) {
        var c = b.nodeName.toLowerCase();return ("input" === c || "button" === c) && b.type === a;
      };
    }function na(a) {
      return ha(function (b) {
        return b = +b, ha(function (c, d) {
          var e,
              f = a([], c.length, b),
              g = f.length;while (g--) c[e = f[g]] && (c[e] = !(d[e] = c[e]));
        });
      });
    }function oa(a) {
      return a && "undefined" != typeof a.getElementsByTagName && a;
    }c = fa.support = {}, f = fa.isXML = function (a) {
      var b = a && (a.ownerDocument || a).documentElement;return b ? "HTML" !== b.nodeName : !1;
    }, m = fa.setDocument = function (a) {
      var b,
          e,
          g = a ? a.ownerDocument || a : v;return g !== n && 9 === g.nodeType && g.documentElement ? (n = g, o = n.documentElement, p = !f(n), (e = n.defaultView) && e.top !== e && (e.addEventListener ? e.addEventListener("unload", da, !1) : e.attachEvent && e.attachEvent("onunload", da)), c.attributes = ia(function (a) {
        return a.className = "i", !a.getAttribute("className");
      }), c.getElementsByTagName = ia(function (a) {
        return a.appendChild(n.createComment("")), !a.getElementsByTagName("*").length;
      }), c.getElementsByClassName = Z.test(n.getElementsByClassName), c.getById = ia(function (a) {
        return o.appendChild(a).id = u, !n.getElementsByName || !n.getElementsByName(u).length;
      }), c.getById ? (d.find.ID = function (a, b) {
        if ("undefined" != typeof b.getElementById && p) {
          var c = b.getElementById(a);return c ? [c] : [];
        }
      }, d.filter.ID = function (a) {
        var b = a.replace(ba, ca);return function (a) {
          return a.getAttribute("id") === b;
        };
      }) : (delete d.find.ID, d.filter.ID = function (a) {
        var b = a.replace(ba, ca);return function (a) {
          var c = "undefined" != typeof a.getAttributeNode && a.getAttributeNode("id");return c && c.value === b;
        };
      }), d.find.TAG = c.getElementsByTagName ? function (a, b) {
        return "undefined" != typeof b.getElementsByTagName ? b.getElementsByTagName(a) : c.qsa ? b.querySelectorAll(a) : void 0;
      } : function (a, b) {
        var c,
            d = [],
            e = 0,
            f = b.getElementsByTagName(a);if ("*" === a) {
          while (c = f[e++]) 1 === c.nodeType && d.push(c);return d;
        }return f;
      }, d.find.CLASS = c.getElementsByClassName && function (a, b) {
        return "undefined" != typeof b.getElementsByClassName && p ? b.getElementsByClassName(a) : void 0;
      }, r = [], q = [], (c.qsa = Z.test(n.querySelectorAll)) && (ia(function (a) {
        o.appendChild(a).innerHTML = "<a id='" + u + "'></a><select id='" + u + "-\r\\' msallowcapture=''><option selected=''></option></select>", a.querySelectorAll("[msallowcapture^='']").length && q.push("[*^$]=" + L + "*(?:''|\"\")"), a.querySelectorAll("[selected]").length || q.push("\\[" + L + "*(?:value|" + K + ")"), a.querySelectorAll("[id~=" + u + "-]").length || q.push("~="), a.querySelectorAll(":checked").length || q.push(":checked"), a.querySelectorAll("a#" + u + "+*").length || q.push(".#.+[+~]");
      }), ia(function (a) {
        var b = n.createElement("input");b.setAttribute("type", "hidden"), a.appendChild(b).setAttribute("name", "D"), a.querySelectorAll("[name=d]").length && q.push("name" + L + "*[*^$|!~]?="), a.querySelectorAll(":enabled").length || q.push(":enabled", ":disabled"), a.querySelectorAll("*,:x"), q.push(",.*:");
      })), (c.matchesSelector = Z.test(s = o.matches || o.webkitMatchesSelector || o.mozMatchesSelector || o.oMatchesSelector || o.msMatchesSelector)) && ia(function (a) {
        c.disconnectedMatch = s.call(a, "div"), s.call(a, "[s!='']:x"), r.push("!=", O);
      }), q = q.length && new RegExp(q.join("|")), r = r.length && new RegExp(r.join("|")), b = Z.test(o.compareDocumentPosition), t = b || Z.test(o.contains) ? function (a, b) {
        var c = 9 === a.nodeType ? a.documentElement : a,
            d = b && b.parentNode;return a === d || !(!d || 1 !== d.nodeType || !(c.contains ? c.contains(d) : a.compareDocumentPosition && 16 & a.compareDocumentPosition(d)));
      } : function (a, b) {
        if (b) while (b = b.parentNode) if (b === a) return !0;return !1;
      }, B = b ? function (a, b) {
        if (a === b) return l = !0, 0;var d = !a.compareDocumentPosition - !b.compareDocumentPosition;return d ? d : (d = (a.ownerDocument || a) === (b.ownerDocument || b) ? a.compareDocumentPosition(b) : 1, 1 & d || !c.sortDetached && b.compareDocumentPosition(a) === d ? a === n || a.ownerDocument === v && t(v, a) ? -1 : b === n || b.ownerDocument === v && t(v, b) ? 1 : k ? J(k, a) - J(k, b) : 0 : 4 & d ? -1 : 1);
      } : function (a, b) {
        if (a === b) return l = !0, 0;var c,
            d = 0,
            e = a.parentNode,
            f = b.parentNode,
            g = [a],
            h = [b];if (!e || !f) return a === n ? -1 : b === n ? 1 : e ? -1 : f ? 1 : k ? J(k, a) - J(k, b) : 0;if (e === f) return ka(a, b);c = a;while (c = c.parentNode) g.unshift(c);c = b;while (c = c.parentNode) h.unshift(c);while (g[d] === h[d]) d++;return d ? ka(g[d], h[d]) : g[d] === v ? -1 : h[d] === v ? 1 : 0;
      }, n) : n;
    }, fa.matches = function (a, b) {
      return fa(a, null, null, b);
    }, fa.matchesSelector = function (a, b) {
      if ((a.ownerDocument || a) !== n && m(a), b = b.replace(T, "='$1']"), c.matchesSelector && p && !A[b + " "] && (!r || !r.test(b)) && (!q || !q.test(b))) try {
        var d = s.call(a, b);if (d || c.disconnectedMatch || a.document && 11 !== a.document.nodeType) return d;
      } catch (e) {}return fa(b, n, null, [a]).length > 0;
    }, fa.contains = function (a, b) {
      return (a.ownerDocument || a) !== n && m(a), t(a, b);
    }, fa.attr = function (a, b) {
      (a.ownerDocument || a) !== n && m(a);var e = d.attrHandle[b.toLowerCase()],
          f = e && D.call(d.attrHandle, b.toLowerCase()) ? e(a, b, !p) : void 0;return void 0 !== f ? f : c.attributes || !p ? a.getAttribute(b) : (f = a.getAttributeNode(b)) && f.specified ? f.value : null;
    }, fa.error = function (a) {
      throw new Error("Syntax error, unrecognized expression: " + a);
    }, fa.uniqueSort = function (a) {
      var b,
          d = [],
          e = 0,
          f = 0;if (l = !c.detectDuplicates, k = !c.sortStable && a.slice(0), a.sort(B), l) {
        while (b = a[f++]) b === a[f] && (e = d.push(f));while (e--) a.splice(d[e], 1);
      }return k = null, a;
    }, e = fa.getText = function (a) {
      var b,
          c = "",
          d = 0,
          f = a.nodeType;if (f) {
        if (1 === f || 9 === f || 11 === f) {
          if ("string" == typeof a.textContent) return a.textContent;for (a = a.firstChild; a; a = a.nextSibling) c += e(a);
        } else if (3 === f || 4 === f) return a.nodeValue;
      } else while (b = a[d++]) c += e(b);return c;
    }, d = fa.selectors = { cacheLength: 50, createPseudo: ha, match: W, attrHandle: {}, find: {}, relative: { ">": { dir: "parentNode", first: !0 }, " ": { dir: "parentNode" }, "+": { dir: "previousSibling", first: !0 }, "~": { dir: "previousSibling" } }, preFilter: { ATTR: function (a) {
          return a[1] = a[1].replace(ba, ca), a[3] = (a[3] || a[4] || a[5] || "").replace(ba, ca), "~=" === a[2] && (a[3] = " " + a[3] + " "), a.slice(0, 4);
        }, CHILD: function (a) {
          return a[1] = a[1].toLowerCase(), "nth" === a[1].slice(0, 3) ? (a[3] || fa.error(a[0]), a[4] = +(a[4] ? a[5] + (a[6] || 1) : 2 * ("even" === a[3] || "odd" === a[3])), a[5] = +(a[7] + a[8] || "odd" === a[3])) : a[3] && fa.error(a[0]), a;
        }, PSEUDO: function (a) {
          var b,
              c = !a[6] && a[2];return W.CHILD.test(a[0]) ? null : (a[3] ? a[2] = a[4] || a[5] || "" : c && U.test(c) && (b = g(c, !0)) && (b = c.indexOf(")", c.length - b) - c.length) && (a[0] = a[0].slice(0, b), a[2] = c.slice(0, b)), a.slice(0, 3));
        } }, filter: { TAG: function (a) {
          var b = a.replace(ba, ca).toLowerCase();return "*" === a ? function () {
            return !0;
          } : function (a) {
            return a.nodeName && a.nodeName.toLowerCase() === b;
          };
        }, CLASS: function (a) {
          var b = y[a + " "];return b || (b = new RegExp("(^|" + L + ")" + a + "(" + L + "|$)")) && y(a, function (a) {
            return b.test("string" == typeof a.className && a.className || "undefined" != typeof a.getAttribute && a.getAttribute("class") || "");
          });
        }, ATTR: function (a, b, c) {
          return function (d) {
            var e = fa.attr(d, a);return null == e ? "!=" === b : b ? (e += "", "=" === b ? e === c : "!=" === b ? e !== c : "^=" === b ? c && 0 === e.indexOf(c) : "*=" === b ? c && e.indexOf(c) > -1 : "$=" === b ? c && e.slice(-c.length) === c : "~=" === b ? (" " + e.replace(P, " ") + " ").indexOf(c) > -1 : "|=" === b ? e === c || e.slice(0, c.length + 1) === c + "-" : !1) : !0;
          };
        }, CHILD: function (a, b, c, d, e) {
          var f = "nth" !== a.slice(0, 3),
              g = "last" !== a.slice(-4),
              h = "of-type" === b;return 1 === d && 0 === e ? function (a) {
            return !!a.parentNode;
          } : function (b, c, i) {
            var j,
                k,
                l,
                m,
                n,
                o,
                p = f !== g ? "nextSibling" : "previousSibling",
                q = b.parentNode,
                r = h && b.nodeName.toLowerCase(),
                s = !i && !h,
                t = !1;if (q) {
              if (f) {
                while (p) {
                  m = b;while (m = m[p]) if (h ? m.nodeName.toLowerCase() === r : 1 === m.nodeType) return !1;o = p = "only" === a && !o && "nextSibling";
                }return !0;
              }if (o = [g ? q.firstChild : q.lastChild], g && s) {
                m = q, l = m[u] || (m[u] = {}), k = l[m.uniqueID] || (l[m.uniqueID] = {}), j = k[a] || [], n = j[0] === w && j[1], t = n && j[2], m = n && q.childNodes[n];while (m = ++n && m && m[p] || (t = n = 0) || o.pop()) if (1 === m.nodeType && ++t && m === b) {
                  k[a] = [w, n, t];break;
                }
              } else if (s && (m = b, l = m[u] || (m[u] = {}), k = l[m.uniqueID] || (l[m.uniqueID] = {}), j = k[a] || [], n = j[0] === w && j[1], t = n), t === !1) while (m = ++n && m && m[p] || (t = n = 0) || o.pop()) if ((h ? m.nodeName.toLowerCase() === r : 1 === m.nodeType) && ++t && (s && (l = m[u] || (m[u] = {}), k = l[m.uniqueID] || (l[m.uniqueID] = {}), k[a] = [w, t]), m === b)) break;return t -= e, t === d || t % d === 0 && t / d >= 0;
            }
          };
        }, PSEUDO: function (a, b) {
          var c,
              e = d.pseudos[a] || d.setFilters[a.toLowerCase()] || fa.error("unsupported pseudo: " + a);return e[u] ? e(b) : e.length > 1 ? (c = [a, a, "", b], d.setFilters.hasOwnProperty(a.toLowerCase()) ? ha(function (a, c) {
            var d,
                f = e(a, b),
                g = f.length;while (g--) d = J(a, f[g]), a[d] = !(c[d] = f[g]);
          }) : function (a) {
            return e(a, 0, c);
          }) : e;
        } }, pseudos: { not: ha(function (a) {
          var b = [],
              c = [],
              d = h(a.replace(Q, "$1"));return d[u] ? ha(function (a, b, c, e) {
            var f,
                g = d(a, null, e, []),
                h = a.length;while (h--) (f = g[h]) && (a[h] = !(b[h] = f));
          }) : function (a, e, f) {
            return b[0] = a, d(b, null, f, c), b[0] = null, !c.pop();
          };
        }), has: ha(function (a) {
          return function (b) {
            return fa(a, b).length > 0;
          };
        }), contains: ha(function (a) {
          return a = a.replace(ba, ca), function (b) {
            return (b.textContent || b.innerText || e(b)).indexOf(a) > -1;
          };
        }), lang: ha(function (a) {
          return V.test(a || "") || fa.error("unsupported lang: " + a), a = a.replace(ba, ca).toLowerCase(), function (b) {
            var c;do if (c = p ? b.lang : b.getAttribute("xml:lang") || b.getAttribute("lang")) return c = c.toLowerCase(), c === a || 0 === c.indexOf(a + "-"); while ((b = b.parentNode) && 1 === b.nodeType);return !1;
          };
        }), target: function (b) {
          var c = a.location && a.location.hash;return c && c.slice(1) === b.id;
        }, root: function (a) {
          return a === o;
        }, focus: function (a) {
          return a === n.activeElement && (!n.hasFocus || n.hasFocus()) && !!(a.type || a.href || ~a.tabIndex);
        }, enabled: function (a) {
          return a.disabled === !1;
        }, disabled: function (a) {
          return a.disabled === !0;
        }, checked: function (a) {
          var b = a.nodeName.toLowerCase();return "input" === b && !!a.checked || "option" === b && !!a.selected;
        }, selected: function (a) {
          return a.parentNode && a.parentNode.selectedIndex, a.selected === !0;
        }, empty: function (a) {
          for (a = a.firstChild; a; a = a.nextSibling) if (a.nodeType < 6) return !1;return !0;
        }, parent: function (a) {
          return !d.pseudos.empty(a);
        }, header: function (a) {
          return Y.test(a.nodeName);
        }, input: function (a) {
          return X.test(a.nodeName);
        }, button: function (a) {
          var b = a.nodeName.toLowerCase();return "input" === b && "button" === a.type || "button" === b;
        }, text: function (a) {
          var b;return "input" === a.nodeName.toLowerCase() && "text" === a.type && (null == (b = a.getAttribute("type")) || "text" === b.toLowerCase());
        }, first: na(function () {
          return [0];
        }), last: na(function (a, b) {
          return [b - 1];
        }), eq: na(function (a, b, c) {
          return [0 > c ? c + b : c];
        }), even: na(function (a, b) {
          for (var c = 0; b > c; c += 2) a.push(c);return a;
        }), odd: na(function (a, b) {
          for (var c = 1; b > c; c += 2) a.push(c);return a;
        }), lt: na(function (a, b, c) {
          for (var d = 0 > c ? c + b : c; --d >= 0;) a.push(d);return a;
        }), gt: na(function (a, b, c) {
          for (var d = 0 > c ? c + b : c; ++d < b;) a.push(d);return a;
        }) } }, d.pseudos.nth = d.pseudos.eq;for (b in { radio: !0, checkbox: !0, file: !0, password: !0, image: !0 }) d.pseudos[b] = la(b);for (b in { submit: !0, reset: !0 }) d.pseudos[b] = ma(b);function pa() {}pa.prototype = d.filters = d.pseudos, d.setFilters = new pa(), g = fa.tokenize = function (a, b) {
      var c,
          e,
          f,
          g,
          h,
          i,
          j,
          k = z[a + " "];if (k) return b ? 0 : k.slice(0);h = a, i = [], j = d.preFilter;while (h) {
        c && !(e = R.exec(h)) || (e && (h = h.slice(e[0].length) || h), i.push(f = [])), c = !1, (e = S.exec(h)) && (c = e.shift(), f.push({ value: c, type: e[0].replace(Q, " ") }), h = h.slice(c.length));for (g in d.filter) !(e = W[g].exec(h)) || j[g] && !(e = j[g](e)) || (c = e.shift(), f.push({ value: c, type: g, matches: e }), h = h.slice(c.length));if (!c) break;
      }return b ? h.length : h ? fa.error(a) : z(a, i).slice(0);
    };function qa(a) {
      for (var b = 0, c = a.length, d = ""; c > b; b++) d += a[b].value;return d;
    }function ra(a, b, c) {
      var d = b.dir,
          e = c && "parentNode" === d,
          f = x++;return b.first ? function (b, c, f) {
        while (b = b[d]) if (1 === b.nodeType || e) return a(b, c, f);
      } : function (b, c, g) {
        var h,
            i,
            j,
            k = [w, f];if (g) {
          while (b = b[d]) if ((1 === b.nodeType || e) && a(b, c, g)) return !0;
        } else while (b = b[d]) if (1 === b.nodeType || e) {
          if (j = b[u] || (b[u] = {}), i = j[b.uniqueID] || (j[b.uniqueID] = {}), (h = i[d]) && h[0] === w && h[1] === f) return k[2] = h[2];if (i[d] = k, k[2] = a(b, c, g)) return !0;
        }
      };
    }function sa(a) {
      return a.length > 1 ? function (b, c, d) {
        var e = a.length;while (e--) if (!a[e](b, c, d)) return !1;return !0;
      } : a[0];
    }function ta(a, b, c) {
      for (var d = 0, e = b.length; e > d; d++) fa(a, b[d], c);return c;
    }function ua(a, b, c, d, e) {
      for (var f, g = [], h = 0, i = a.length, j = null != b; i > h; h++) (f = a[h]) && (c && !c(f, d, e) || (g.push(f), j && b.push(h)));return g;
    }function va(a, b, c, d, e, f) {
      return d && !d[u] && (d = va(d)), e && !e[u] && (e = va(e, f)), ha(function (f, g, h, i) {
        var j,
            k,
            l,
            m = [],
            n = [],
            o = g.length,
            p = f || ta(b || "*", h.nodeType ? [h] : h, []),
            q = !a || !f && b ? p : ua(p, m, a, h, i),
            r = c ? e || (f ? a : o || d) ? [] : g : q;if (c && c(q, r, h, i), d) {
          j = ua(r, n), d(j, [], h, i), k = j.length;while (k--) (l = j[k]) && (r[n[k]] = !(q[n[k]] = l));
        }if (f) {
          if (e || a) {
            if (e) {
              j = [], k = r.length;while (k--) (l = r[k]) && j.push(q[k] = l);e(null, r = [], j, i);
            }k = r.length;while (k--) (l = r[k]) && (j = e ? J(f, l) : m[k]) > -1 && (f[j] = !(g[j] = l));
          }
        } else r = ua(r === g ? r.splice(o, r.length) : r), e ? e(null, g, r, i) : H.apply(g, r);
      });
    }function wa(a) {
      for (var b, c, e, f = a.length, g = d.relative[a[0].type], h = g || d.relative[" "], i = g ? 1 : 0, k = ra(function (a) {
        return a === b;
      }, h, !0), l = ra(function (a) {
        return J(b, a) > -1;
      }, h, !0), m = [function (a, c, d) {
        var e = !g && (d || c !== j) || ((b = c).nodeType ? k(a, c, d) : l(a, c, d));return b = null, e;
      }]; f > i; i++) if (c = d.relative[a[i].type]) m = [ra(sa(m), c)];else {
        if (c = d.filter[a[i].type].apply(null, a[i].matches), c[u]) {
          for (e = ++i; f > e; e++) if (d.relative[a[e].type]) break;return va(i > 1 && sa(m), i > 1 && qa(a.slice(0, i - 1).concat({ value: " " === a[i - 2].type ? "*" : "" })).replace(Q, "$1"), c, e > i && wa(a.slice(i, e)), f > e && wa(a = a.slice(e)), f > e && qa(a));
        }m.push(c);
      }return sa(m);
    }function xa(a, b) {
      var c = b.length > 0,
          e = a.length > 0,
          f = function (f, g, h, i, k) {
        var l,
            o,
            q,
            r = 0,
            s = "0",
            t = f && [],
            u = [],
            v = j,
            x = f || e && d.find.TAG("*", k),
            y = w += null == v ? 1 : Math.random() || .1,
            z = x.length;for (k && (j = g === n || g || k); s !== z && null != (l = x[s]); s++) {
          if (e && l) {
            o = 0, g || l.ownerDocument === n || (m(l), h = !p);while (q = a[o++]) if (q(l, g || n, h)) {
              i.push(l);break;
            }k && (w = y);
          }c && ((l = !q && l) && r--, f && t.push(l));
        }if (r += s, c && s !== r) {
          o = 0;while (q = b[o++]) q(t, u, g, h);if (f) {
            if (r > 0) while (s--) t[s] || u[s] || (u[s] = F.call(i));u = ua(u);
          }H.apply(i, u), k && !f && u.length > 0 && r + b.length > 1 && fa.uniqueSort(i);
        }return k && (w = y, j = v), t;
      };return c ? ha(f) : f;
    }return h = fa.compile = function (a, b) {
      var c,
          d = [],
          e = [],
          f = A[a + " "];if (!f) {
        b || (b = g(a)), c = b.length;while (c--) f = wa(b[c]), f[u] ? d.push(f) : e.push(f);f = A(a, xa(e, d)), f.selector = a;
      }return f;
    }, i = fa.select = function (a, b, e, f) {
      var i,
          j,
          k,
          l,
          m,
          n = "function" == typeof a && a,
          o = !f && g(a = n.selector || a);if (e = e || [], 1 === o.length) {
        if (j = o[0] = o[0].slice(0), j.length > 2 && "ID" === (k = j[0]).type && c.getById && 9 === b.nodeType && p && d.relative[j[1].type]) {
          if (b = (d.find.ID(k.matches[0].replace(ba, ca), b) || [])[0], !b) return e;n && (b = b.parentNode), a = a.slice(j.shift().value.length);
        }i = W.needsContext.test(a) ? 0 : j.length;while (i--) {
          if (k = j[i], d.relative[l = k.type]) break;if ((m = d.find[l]) && (f = m(k.matches[0].replace(ba, ca), _.test(j[0].type) && oa(b.parentNode) || b))) {
            if (j.splice(i, 1), a = f.length && qa(j), !a) return H.apply(e, f), e;break;
          }
        }
      }return (n || h(a, o))(f, b, !p, e, !b || _.test(a) && oa(b.parentNode) || b), e;
    }, c.sortStable = u.split("").sort(B).join("") === u, c.detectDuplicates = !!l, m(), c.sortDetached = ia(function (a) {
      return 1 & a.compareDocumentPosition(n.createElement("div"));
    }), ia(function (a) {
      return a.innerHTML = "<a href='#'></a>", "#" === a.firstChild.getAttribute("href");
    }) || ja("type|href|height|width", function (a, b, c) {
      return c ? void 0 : a.getAttribute(b, "type" === b.toLowerCase() ? 1 : 2);
    }), c.attributes && ia(function (a) {
      return a.innerHTML = "<input/>", a.firstChild.setAttribute("value", ""), "" === a.firstChild.getAttribute("value");
    }) || ja("value", function (a, b, c) {
      return c || "input" !== a.nodeName.toLowerCase() ? void 0 : a.defaultValue;
    }), ia(function (a) {
      return null == a.getAttribute("disabled");
    }) || ja(K, function (a, b, c) {
      var d;return c ? void 0 : a[b] === !0 ? b.toLowerCase() : (d = a.getAttributeNode(b)) && d.specified ? d.value : null;
    }), fa;
  }(a);n.find = t, n.expr = t.selectors, n.expr[":"] = n.expr.pseudos, n.uniqueSort = n.unique = t.uniqueSort, n.text = t.getText, n.isXMLDoc = t.isXML, n.contains = t.contains;var u = function (a, b, c) {
    var d = [],
        e = void 0 !== c;while ((a = a[b]) && 9 !== a.nodeType) if (1 === a.nodeType) {
      if (e && n(a).is(c)) break;d.push(a);
    }return d;
  },
      v = function (a, b) {
    for (var c = []; a; a = a.nextSibling) 1 === a.nodeType && a !== b && c.push(a);return c;
  },
      w = n.expr.match.needsContext,
      x = /^<([\w-]+)\s*\/?>(?:<\/\1>|)$/,
      y = /^.[^:#\[\.,]*$/;function z(a, b, c) {
    if (n.isFunction(b)) return n.grep(a, function (a, d) {
      return !!b.call(a, d, a) !== c;
    });if (b.nodeType) return n.grep(a, function (a) {
      return a === b !== c;
    });if ("string" == typeof b) {
      if (y.test(b)) return n.filter(b, a, c);b = n.filter(b, a);
    }return n.grep(a, function (a) {
      return n.inArray(a, b) > -1 !== c;
    });
  }n.filter = function (a, b, c) {
    var d = b[0];return c && (a = ":not(" + a + ")"), 1 === b.length && 1 === d.nodeType ? n.find.matchesSelector(d, a) ? [d] : [] : n.find.matches(a, n.grep(b, function (a) {
      return 1 === a.nodeType;
    }));
  }, n.fn.extend({ find: function (a) {
      var b,
          c = [],
          d = this,
          e = d.length;if ("string" != typeof a) return this.pushStack(n(a).filter(function () {
        for (b = 0; e > b; b++) if (n.contains(d[b], this)) return !0;
      }));for (b = 0; e > b; b++) n.find(a, d[b], c);return c = this.pushStack(e > 1 ? n.unique(c) : c), c.selector = this.selector ? this.selector + " " + a : a, c;
    }, filter: function (a) {
      return this.pushStack(z(this, a || [], !1));
    }, not: function (a) {
      return this.pushStack(z(this, a || [], !0));
    }, is: function (a) {
      return !!z(this, "string" == typeof a && w.test(a) ? n(a) : a || [], !1).length;
    } });var A,
      B = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,
      C = n.fn.init = function (a, b, c) {
    var e, f;if (!a) return this;if (c = c || A, "string" == typeof a) {
      if (e = "<" === a.charAt(0) && ">" === a.charAt(a.length - 1) && a.length >= 3 ? [null, a, null] : B.exec(a), !e || !e[1] && b) return !b || b.jquery ? (b || c).find(a) : this.constructor(b).find(a);if (e[1]) {
        if (b = b instanceof n ? b[0] : b, n.merge(this, n.parseHTML(e[1], b && b.nodeType ? b.ownerDocument || b : d, !0)), x.test(e[1]) && n.isPlainObject(b)) for (e in b) n.isFunction(this[e]) ? this[e](b[e]) : this.attr(e, b[e]);return this;
      }if (f = d.getElementById(e[2]), f && f.parentNode) {
        if (f.id !== e[2]) return A.find(a);this.length = 1, this[0] = f;
      }return this.context = d, this.selector = a, this;
    }return a.nodeType ? (this.context = this[0] = a, this.length = 1, this) : n.isFunction(a) ? "undefined" != typeof c.ready ? c.ready(a) : a(n) : (void 0 !== a.selector && (this.selector = a.selector, this.context = a.context), n.makeArray(a, this));
  };C.prototype = n.fn, A = n(d);var D = /^(?:parents|prev(?:Until|All))/,
      E = { children: !0, contents: !0, next: !0, prev: !0 };n.fn.extend({ has: function (a) {
      var b,
          c = n(a, this),
          d = c.length;return this.filter(function () {
        for (b = 0; d > b; b++) if (n.contains(this, c[b])) return !0;
      });
    }, closest: function (a, b) {
      for (var c, d = 0, e = this.length, f = [], g = w.test(a) || "string" != typeof a ? n(a, b || this.context) : 0; e > d; d++) for (c = this[d]; c && c !== b; c = c.parentNode) if (c.nodeType < 11 && (g ? g.index(c) > -1 : 1 === c.nodeType && n.find.matchesSelector(c, a))) {
        f.push(c);break;
      }return this.pushStack(f.length > 1 ? n.uniqueSort(f) : f);
    }, index: function (a) {
      return a ? "string" == typeof a ? n.inArray(this[0], n(a)) : n.inArray(a.jquery ? a[0] : a, this) : this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
    }, add: function (a, b) {
      return this.pushStack(n.uniqueSort(n.merge(this.get(), n(a, b))));
    }, addBack: function (a) {
      return this.add(null == a ? this.prevObject : this.prevObject.filter(a));
    } });function F(a, b) {
    do a = a[b]; while (a && 1 !== a.nodeType);return a;
  }n.each({ parent: function (a) {
      var b = a.parentNode;return b && 11 !== b.nodeType ? b : null;
    }, parents: function (a) {
      return u(a, "parentNode");
    }, parentsUntil: function (a, b, c) {
      return u(a, "parentNode", c);
    }, next: function (a) {
      return F(a, "nextSibling");
    }, prev: function (a) {
      return F(a, "previousSibling");
    }, nextAll: function (a) {
      return u(a, "nextSibling");
    }, prevAll: function (a) {
      return u(a, "previousSibling");
    }, nextUntil: function (a, b, c) {
      return u(a, "nextSibling", c);
    }, prevUntil: function (a, b, c) {
      return u(a, "previousSibling", c);
    }, siblings: function (a) {
      return v((a.parentNode || {}).firstChild, a);
    }, children: function (a) {
      return v(a.firstChild);
    }, contents: function (a) {
      return n.nodeName(a, "iframe") ? a.contentDocument || a.contentWindow.document : n.merge([], a.childNodes);
    } }, function (a, b) {
    n.fn[a] = function (c, d) {
      var e = n.map(this, b, c);return "Until" !== a.slice(-5) && (d = c), d && "string" == typeof d && (e = n.filter(d, e)), this.length > 1 && (E[a] || (e = n.uniqueSort(e)), D.test(a) && (e = e.reverse())), this.pushStack(e);
    };
  });var G = /\S+/g;function H(a) {
    var b = {};return n.each(a.match(G) || [], function (a, c) {
      b[c] = !0;
    }), b;
  }n.Callbacks = function (a) {
    a = "string" == typeof a ? H(a) : n.extend({}, a);var b,
        c,
        d,
        e,
        f = [],
        g = [],
        h = -1,
        i = function () {
      for (e = a.once, d = b = !0; g.length; h = -1) {
        c = g.shift();while (++h < f.length) f[h].apply(c[0], c[1]) === !1 && a.stopOnFalse && (h = f.length, c = !1);
      }a.memory || (c = !1), b = !1, e && (f = c ? [] : "");
    },
        j = { add: function () {
        return f && (c && !b && (h = f.length - 1, g.push(c)), function d(b) {
          n.each(b, function (b, c) {
            n.isFunction(c) ? a.unique && j.has(c) || f.push(c) : c && c.length && "string" !== n.type(c) && d(c);
          });
        }(arguments), c && !b && i()), this;
      }, remove: function () {
        return n.each(arguments, function (a, b) {
          var c;while ((c = n.inArray(b, f, c)) > -1) f.splice(c, 1), h >= c && h--;
        }), this;
      }, has: function (a) {
        return a ? n.inArray(a, f) > -1 : f.length > 0;
      }, empty: function () {
        return f && (f = []), this;
      }, disable: function () {
        return e = g = [], f = c = "", this;
      }, disabled: function () {
        return !f;
      }, lock: function () {
        return e = !0, c || j.disable(), this;
      }, locked: function () {
        return !!e;
      }, fireWith: function (a, c) {
        return e || (c = c || [], c = [a, c.slice ? c.slice() : c], g.push(c), b || i()), this;
      }, fire: function () {
        return j.fireWith(this, arguments), this;
      }, fired: function () {
        return !!d;
      } };return j;
  }, n.extend({ Deferred: function (a) {
      var b = [["resolve", "done", n.Callbacks("once memory"), "resolved"], ["reject", "fail", n.Callbacks("once memory"), "rejected"], ["notify", "progress", n.Callbacks("memory")]],
          c = "pending",
          d = { state: function () {
          return c;
        }, always: function () {
          return e.done(arguments).fail(arguments), this;
        }, then: function () {
          var a = arguments;return n.Deferred(function (c) {
            n.each(b, function (b, f) {
              var g = n.isFunction(a[b]) && a[b];e[f[1]](function () {
                var a = g && g.apply(this, arguments);a && n.isFunction(a.promise) ? a.promise().progress(c.notify).done(c.resolve).fail(c.reject) : c[f[0] + "With"](this === d ? c.promise() : this, g ? [a] : arguments);
              });
            }), a = null;
          }).promise();
        }, promise: function (a) {
          return null != a ? n.extend(a, d) : d;
        } },
          e = {};return d.pipe = d.then, n.each(b, function (a, f) {
        var g = f[2],
            h = f[3];d[f[1]] = g.add, h && g.add(function () {
          c = h;
        }, b[1 ^ a][2].disable, b[2][2].lock), e[f[0]] = function () {
          return e[f[0] + "With"](this === e ? d : this, arguments), this;
        }, e[f[0] + "With"] = g.fireWith;
      }), d.promise(e), a && a.call(e, e), e;
    }, when: function (a) {
      var b = 0,
          c = e.call(arguments),
          d = c.length,
          f = 1 !== d || a && n.isFunction(a.promise) ? d : 0,
          g = 1 === f ? a : n.Deferred(),
          h = function (a, b, c) {
        return function (d) {
          b[a] = this, c[a] = arguments.length > 1 ? e.call(arguments) : d, c === i ? g.notifyWith(b, c) : --f || g.resolveWith(b, c);
        };
      },
          i,
          j,
          k;if (d > 1) for (i = new Array(d), j = new Array(d), k = new Array(d); d > b; b++) c[b] && n.isFunction(c[b].promise) ? c[b].promise().progress(h(b, j, i)).done(h(b, k, c)).fail(g.reject) : --f;return f || g.resolveWith(k, c), g.promise();
    } });var I;n.fn.ready = function (a) {
    return n.ready.promise().done(a), this;
  }, n.extend({ isReady: !1, readyWait: 1, holdReady: function (a) {
      a ? n.readyWait++ : n.ready(!0);
    }, ready: function (a) {
      (a === !0 ? --n.readyWait : n.isReady) || (n.isReady = !0, a !== !0 && --n.readyWait > 0 || (I.resolveWith(d, [n]), n.fn.triggerHandler && (n(d).triggerHandler("ready"), n(d).off("ready"))));
    } });function J() {
    d.addEventListener ? (d.removeEventListener("DOMContentLoaded", K), a.removeEventListener("load", K)) : (d.detachEvent("onreadystatechange", K), a.detachEvent("onload", K));
  }function K() {
    (d.addEventListener || "load" === a.event.type || "complete" === d.readyState) && (J(), n.ready());
  }n.ready.promise = function (b) {
    if (!I) if (I = n.Deferred(), "complete" === d.readyState || "loading" !== d.readyState && !d.documentElement.doScroll) a.setTimeout(n.ready);else if (d.addEventListener) d.addEventListener("DOMContentLoaded", K), a.addEventListener("load", K);else {
      d.attachEvent("onreadystatechange", K), a.attachEvent("onload", K);var c = !1;try {
        c = null == a.frameElement && d.documentElement;
      } catch (e) {}c && c.doScroll && !function f() {
        if (!n.isReady) {
          try {
            c.doScroll("left");
          } catch (b) {
            return a.setTimeout(f, 50);
          }J(), n.ready();
        }
      }();
    }return I.promise(b);
  }, n.ready.promise();var L;for (L in n(l)) break;l.ownFirst = "0" === L, l.inlineBlockNeedsLayout = !1, n(function () {
    var a, b, c, e;c = d.getElementsByTagName("body")[0], c && c.style && (b = d.createElement("div"), e = d.createElement("div"), e.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px", c.appendChild(e).appendChild(b), "undefined" != typeof b.style.zoom && (b.style.cssText = "display:inline;margin:0;border:0;padding:1px;width:1px;zoom:1", l.inlineBlockNeedsLayout = a = 3 === b.offsetWidth, a && (c.style.zoom = 1)), c.removeChild(e));
  }), function () {
    var a = d.createElement("div");l.deleteExpando = !0;try {
      delete a.test;
    } catch (b) {
      l.deleteExpando = !1;
    }a = null;
  }();var M = function (a) {
    var b = n.noData[(a.nodeName + " ").toLowerCase()],
        c = +a.nodeType || 1;return 1 !== c && 9 !== c ? !1 : !b || b !== !0 && a.getAttribute("classid") === b;
  },
      N = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
      O = /([A-Z])/g;function P(a, b, c) {
    if (void 0 === c && 1 === a.nodeType) {
      var d = "data-" + b.replace(O, "-$1").toLowerCase();if (c = a.getAttribute(d), "string" == typeof c) {
        try {
          c = "true" === c ? !0 : "false" === c ? !1 : "null" === c ? null : +c + "" === c ? +c : N.test(c) ? n.parseJSON(c) : c;
        } catch (e) {}n.data(a, b, c);
      } else c = void 0;
    }return c;
  }function Q(a) {
    var b;for (b in a) if (("data" !== b || !n.isEmptyObject(a[b])) && "toJSON" !== b) return !1;return !0;
  }function R(a, b, d, e) {
    if (M(a)) {
      var f,
          g,
          h = n.expando,
          i = a.nodeType,
          j = i ? n.cache : a,
          k = i ? a[h] : a[h] && h;if (k && j[k] && (e || j[k].data) || void 0 !== d || "string" != typeof b) return k || (k = i ? a[h] = c.pop() || n.guid++ : h), j[k] || (j[k] = i ? {} : { toJSON: n.noop }), "object" != typeof b && "function" != typeof b || (e ? j[k] = n.extend(j[k], b) : j[k].data = n.extend(j[k].data, b)), g = j[k], e || (g.data || (g.data = {}), g = g.data), void 0 !== d && (g[n.camelCase(b)] = d), "string" == typeof b ? (f = g[b], null == f && (f = g[n.camelCase(b)])) : f = g, f;
    }
  }function S(a, b, c) {
    if (M(a)) {
      var d,
          e,
          f = a.nodeType,
          g = f ? n.cache : a,
          h = f ? a[n.expando] : n.expando;if (g[h]) {
        if (b && (d = c ? g[h] : g[h].data)) {
          n.isArray(b) ? b = b.concat(n.map(b, n.camelCase)) : b in d ? b = [b] : (b = n.camelCase(b), b = b in d ? [b] : b.split(" ")), e = b.length;while (e--) delete d[b[e]];if (c ? !Q(d) : !n.isEmptyObject(d)) return;
        }(c || (delete g[h].data, Q(g[h]))) && (f ? n.cleanData([a], !0) : l.deleteExpando || g != g.window ? delete g[h] : g[h] = void 0);
      }
    }
  }n.extend({ cache: {}, noData: { "applet ": !0, "embed ": !0, "object ": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" }, hasData: function (a) {
      return a = a.nodeType ? n.cache[a[n.expando]] : a[n.expando], !!a && !Q(a);
    }, data: function (a, b, c) {
      return R(a, b, c);
    }, removeData: function (a, b) {
      return S(a, b);
    }, _data: function (a, b, c) {
      return R(a, b, c, !0);
    }, _removeData: function (a, b) {
      return S(a, b, !0);
    } }), n.fn.extend({ data: function (a, b) {
      var c,
          d,
          e,
          f = this[0],
          g = f && f.attributes;if (void 0 === a) {
        if (this.length && (e = n.data(f), 1 === f.nodeType && !n._data(f, "parsedAttrs"))) {
          c = g.length;while (c--) g[c] && (d = g[c].name, 0 === d.indexOf("data-") && (d = n.camelCase(d.slice(5)), P(f, d, e[d])));n._data(f, "parsedAttrs", !0);
        }return e;
      }return "object" == typeof a ? this.each(function () {
        n.data(this, a);
      }) : arguments.length > 1 ? this.each(function () {
        n.data(this, a, b);
      }) : f ? P(f, a, n.data(f, a)) : void 0;
    }, removeData: function (a) {
      return this.each(function () {
        n.removeData(this, a);
      });
    } }), n.extend({ queue: function (a, b, c) {
      var d;return a ? (b = (b || "fx") + "queue", d = n._data(a, b), c && (!d || n.isArray(c) ? d = n._data(a, b, n.makeArray(c)) : d.push(c)), d || []) : void 0;
    }, dequeue: function (a, b) {
      b = b || "fx";var c = n.queue(a, b),
          d = c.length,
          e = c.shift(),
          f = n._queueHooks(a, b),
          g = function () {
        n.dequeue(a, b);
      };"inprogress" === e && (e = c.shift(), d--), e && ("fx" === b && c.unshift("inprogress"), delete f.stop, e.call(a, g, f)), !d && f && f.empty.fire();
    }, _queueHooks: function (a, b) {
      var c = b + "queueHooks";return n._data(a, c) || n._data(a, c, { empty: n.Callbacks("once memory").add(function () {
          n._removeData(a, b + "queue"), n._removeData(a, c);
        }) });
    } }), n.fn.extend({ queue: function (a, b) {
      var c = 2;return "string" != typeof a && (b = a, a = "fx", c--), arguments.length < c ? n.queue(this[0], a) : void 0 === b ? this : this.each(function () {
        var c = n.queue(this, a, b);n._queueHooks(this, a), "fx" === a && "inprogress" !== c[0] && n.dequeue(this, a);
      });
    }, dequeue: function (a) {
      return this.each(function () {
        n.dequeue(this, a);
      });
    }, clearQueue: function (a) {
      return this.queue(a || "fx", []);
    }, promise: function (a, b) {
      var c,
          d = 1,
          e = n.Deferred(),
          f = this,
          g = this.length,
          h = function () {
        --d || e.resolveWith(f, [f]);
      };"string" != typeof a && (b = a, a = void 0), a = a || "fx";while (g--) c = n._data(f[g], a + "queueHooks"), c && c.empty && (d++, c.empty.add(h));return h(), e.promise(b);
    } }), function () {
    var a;l.shrinkWrapBlocks = function () {
      if (null != a) return a;a = !1;var b, c, e;return c = d.getElementsByTagName("body")[0], c && c.style ? (b = d.createElement("div"), e = d.createElement("div"), e.style.cssText = "position:absolute;border:0;width:0;height:0;top:0;left:-9999px", c.appendChild(e).appendChild(b), "undefined" != typeof b.style.zoom && (b.style.cssText = "-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:1px;width:1px;zoom:1", b.appendChild(d.createElement("div")).style.width = "5px", a = 3 !== b.offsetWidth), c.removeChild(e), a) : void 0;
    };
  }();var T = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,
      U = new RegExp("^(?:([+-])=|)(" + T + ")([a-z%]*)$", "i"),
      V = ["Top", "Right", "Bottom", "Left"],
      W = function (a, b) {
    return a = b || a, "none" === n.css(a, "display") || !n.contains(a.ownerDocument, a);
  };function X(a, b, c, d) {
    var e,
        f = 1,
        g = 20,
        h = d ? function () {
      return d.cur();
    } : function () {
      return n.css(a, b, "");
    },
        i = h(),
        j = c && c[3] || (n.cssNumber[b] ? "" : "px"),
        k = (n.cssNumber[b] || "px" !== j && +i) && U.exec(n.css(a, b));if (k && k[3] !== j) {
      j = j || k[3], c = c || [], k = +i || 1;do f = f || ".5", k /= f, n.style(a, b, k + j); while (f !== (f = h() / i) && 1 !== f && --g);
    }return c && (k = +k || +i || 0, e = c[1] ? k + (c[1] + 1) * c[2] : +c[2], d && (d.unit = j, d.start = k, d.end = e)), e;
  }var Y = function (a, b, c, d, e, f, g) {
    var h = 0,
        i = a.length,
        j = null == c;if ("object" === n.type(c)) {
      e = !0;for (h in c) Y(a, b, h, c[h], !0, f, g);
    } else if (void 0 !== d && (e = !0, n.isFunction(d) || (g = !0), j && (g ? (b.call(a, d), b = null) : (j = b, b = function (a, b, c) {
      return j.call(n(a), c);
    })), b)) for (; i > h; h++) b(a[h], c, g ? d : d.call(a[h], h, b(a[h], c)));return e ? a : j ? b.call(a) : i ? b(a[0], c) : f;
  },
      Z = /^(?:checkbox|radio)$/i,
      $ = /<([\w:-]+)/,
      _ = /^$|\/(?:java|ecma)script/i,
      aa = /^\s+/,
      ba = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|dialog|figcaption|figure|footer|header|hgroup|main|mark|meter|nav|output|picture|progress|section|summary|template|time|video";function ca(a) {
    var b = ba.split("|"),
        c = a.createDocumentFragment();if (c.createElement) while (b.length) c.createElement(b.pop());return c;
  }!function () {
    var a = d.createElement("div"),
        b = d.createDocumentFragment(),
        c = d.createElement("input");a.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>", l.leadingWhitespace = 3 === a.firstChild.nodeType, l.tbody = !a.getElementsByTagName("tbody").length, l.htmlSerialize = !!a.getElementsByTagName("link").length, l.html5Clone = "<:nav></:nav>" !== d.createElement("nav").cloneNode(!0).outerHTML, c.type = "checkbox", c.checked = !0, b.appendChild(c), l.appendChecked = c.checked, a.innerHTML = "<textarea>x</textarea>", l.noCloneChecked = !!a.cloneNode(!0).lastChild.defaultValue, b.appendChild(a), c = d.createElement("input"), c.setAttribute("type", "radio"), c.setAttribute("checked", "checked"), c.setAttribute("name", "t"), a.appendChild(c), l.checkClone = a.cloneNode(!0).cloneNode(!0).lastChild.checked, l.noCloneEvent = !!a.addEventListener, a[n.expando] = 1, l.attributes = !a.getAttribute(n.expando);
  }();var da = { option: [1, "<select multiple='multiple'>", "</select>"], legend: [1, "<fieldset>", "</fieldset>"], area: [1, "<map>", "</map>"], param: [1, "<object>", "</object>"], thead: [1, "<table>", "</table>"], tr: [2, "<table><tbody>", "</tbody></table>"], col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"], td: [3, "<table><tbody><tr>", "</tr></tbody></table>"], _default: l.htmlSerialize ? [0, "", ""] : [1, "X<div>", "</div>"] };da.optgroup = da.option, da.tbody = da.tfoot = da.colgroup = da.caption = da.thead, da.th = da.td;function ea(a, b) {
    var c,
        d,
        e = 0,
        f = "undefined" != typeof a.getElementsByTagName ? a.getElementsByTagName(b || "*") : "undefined" != typeof a.querySelectorAll ? a.querySelectorAll(b || "*") : void 0;if (!f) for (f = [], c = a.childNodes || a; null != (d = c[e]); e++) !b || n.nodeName(d, b) ? f.push(d) : n.merge(f, ea(d, b));return void 0 === b || b && n.nodeName(a, b) ? n.merge([a], f) : f;
  }function fa(a, b) {
    for (var c, d = 0; null != (c = a[d]); d++) n._data(c, "globalEval", !b || n._data(b[d], "globalEval"));
  }var ga = /<|&#?\w+;/,
      ha = /<tbody/i;function ia(a) {
    Z.test(a.type) && (a.defaultChecked = a.checked);
  }function ja(a, b, c, d, e) {
    for (var f, g, h, i, j, k, m, o = a.length, p = ca(b), q = [], r = 0; o > r; r++) if (g = a[r], g || 0 === g) if ("object" === n.type(g)) n.merge(q, g.nodeType ? [g] : g);else if (ga.test(g)) {
      i = i || p.appendChild(b.createElement("div")), j = ($.exec(g) || ["", ""])[1].toLowerCase(), m = da[j] || da._default, i.innerHTML = m[1] + n.htmlPrefilter(g) + m[2], f = m[0];while (f--) i = i.lastChild;if (!l.leadingWhitespace && aa.test(g) && q.push(b.createTextNode(aa.exec(g)[0])), !l.tbody) {
        g = "table" !== j || ha.test(g) ? "<table>" !== m[1] || ha.test(g) ? 0 : i : i.firstChild, f = g && g.childNodes.length;while (f--) n.nodeName(k = g.childNodes[f], "tbody") && !k.childNodes.length && g.removeChild(k);
      }n.merge(q, i.childNodes), i.textContent = "";while (i.firstChild) i.removeChild(i.firstChild);i = p.lastChild;
    } else q.push(b.createTextNode(g));i && p.removeChild(i), l.appendChecked || n.grep(ea(q, "input"), ia), r = 0;while (g = q[r++]) if (d && n.inArray(g, d) > -1) e && e.push(g);else if (h = n.contains(g.ownerDocument, g), i = ea(p.appendChild(g), "script"), h && fa(i), c) {
      f = 0;while (g = i[f++]) _.test(g.type || "") && c.push(g);
    }return i = null, p;
  }!function () {
    var b,
        c,
        e = d.createElement("div");for (b in { submit: !0, change: !0, focusin: !0 }) c = "on" + b, (l[b] = c in a) || (e.setAttribute(c, "t"), l[b] = e.attributes[c].expando === !1);e = null;
  }();var ka = /^(?:input|select|textarea)$/i,
      la = /^key/,
      ma = /^(?:mouse|pointer|contextmenu|drag|drop)|click/,
      na = /^(?:focusinfocus|focusoutblur)$/,
      oa = /^([^.]*)(?:\.(.+)|)/;function pa() {
    return !0;
  }function qa() {
    return !1;
  }function ra() {
    try {
      return d.activeElement;
    } catch (a) {}
  }function sa(a, b, c, d, e, f) {
    var g, h;if ("object" == typeof b) {
      "string" != typeof c && (d = d || c, c = void 0);for (h in b) sa(a, h, c, d, b[h], f);return a;
    }if (null == d && null == e ? (e = c, d = c = void 0) : null == e && ("string" == typeof c ? (e = d, d = void 0) : (e = d, d = c, c = void 0)), e === !1) e = qa;else if (!e) return a;return 1 === f && (g = e, e = function (a) {
      return n().off(a), g.apply(this, arguments);
    }, e.guid = g.guid || (g.guid = n.guid++)), a.each(function () {
      n.event.add(this, b, e, d, c);
    });
  }n.event = { global: {}, add: function (a, b, c, d, e) {
      var f,
          g,
          h,
          i,
          j,
          k,
          l,
          m,
          o,
          p,
          q,
          r = n._data(a);if (r) {
        c.handler && (i = c, c = i.handler, e = i.selector), c.guid || (c.guid = n.guid++), (g = r.events) || (g = r.events = {}), (k = r.handle) || (k = r.handle = function (a) {
          return "undefined" == typeof n || a && n.event.triggered === a.type ? void 0 : n.event.dispatch.apply(k.elem, arguments);
        }, k.elem = a), b = (b || "").match(G) || [""], h = b.length;while (h--) f = oa.exec(b[h]) || [], o = q = f[1], p = (f[2] || "").split(".").sort(), o && (j = n.event.special[o] || {}, o = (e ? j.delegateType : j.bindType) || o, j = n.event.special[o] || {}, l = n.extend({ type: o, origType: q, data: d, handler: c, guid: c.guid, selector: e, needsContext: e && n.expr.match.needsContext.test(e), namespace: p.join(".") }, i), (m = g[o]) || (m = g[o] = [], m.delegateCount = 0, j.setup && j.setup.call(a, d, p, k) !== !1 || (a.addEventListener ? a.addEventListener(o, k, !1) : a.attachEvent && a.attachEvent("on" + o, k))), j.add && (j.add.call(a, l), l.handler.guid || (l.handler.guid = c.guid)), e ? m.splice(m.delegateCount++, 0, l) : m.push(l), n.event.global[o] = !0);a = null;
      }
    }, remove: function (a, b, c, d, e) {
      var f,
          g,
          h,
          i,
          j,
          k,
          l,
          m,
          o,
          p,
          q,
          r = n.hasData(a) && n._data(a);if (r && (k = r.events)) {
        b = (b || "").match(G) || [""], j = b.length;while (j--) if (h = oa.exec(b[j]) || [], o = q = h[1], p = (h[2] || "").split(".").sort(), o) {
          l = n.event.special[o] || {}, o = (d ? l.delegateType : l.bindType) || o, m = k[o] || [], h = h[2] && new RegExp("(^|\\.)" + p.join("\\.(?:.*\\.|)") + "(\\.|$)"), i = f = m.length;while (f--) g = m[f], !e && q !== g.origType || c && c.guid !== g.guid || h && !h.test(g.namespace) || d && d !== g.selector && ("**" !== d || !g.selector) || (m.splice(f, 1), g.selector && m.delegateCount--, l.remove && l.remove.call(a, g));i && !m.length && (l.teardown && l.teardown.call(a, p, r.handle) !== !1 || n.removeEvent(a, o, r.handle), delete k[o]);
        } else for (o in k) n.event.remove(a, o + b[j], c, d, !0);n.isEmptyObject(k) && (delete r.handle, n._removeData(a, "events"));
      }
    }, trigger: function (b, c, e, f) {
      var g,
          h,
          i,
          j,
          l,
          m,
          o,
          p = [e || d],
          q = k.call(b, "type") ? b.type : b,
          r = k.call(b, "namespace") ? b.namespace.split(".") : [];if (i = m = e = e || d, 3 !== e.nodeType && 8 !== e.nodeType && !na.test(q + n.event.triggered) && (q.indexOf(".") > -1 && (r = q.split("."), q = r.shift(), r.sort()), h = q.indexOf(":") < 0 && "on" + q, b = b[n.expando] ? b : new n.Event(q, "object" == typeof b && b), b.isTrigger = f ? 2 : 3, b.namespace = r.join("."), b.rnamespace = b.namespace ? new RegExp("(^|\\.)" + r.join("\\.(?:.*\\.|)") + "(\\.|$)") : null, b.result = void 0, b.target || (b.target = e), c = null == c ? [b] : n.makeArray(c, [b]), l = n.event.special[q] || {}, f || !l.trigger || l.trigger.apply(e, c) !== !1)) {
        if (!f && !l.noBubble && !n.isWindow(e)) {
          for (j = l.delegateType || q, na.test(j + q) || (i = i.parentNode); i; i = i.parentNode) p.push(i), m = i;m === (e.ownerDocument || d) && p.push(m.defaultView || m.parentWindow || a);
        }o = 0;while ((i = p[o++]) && !b.isPropagationStopped()) b.type = o > 1 ? j : l.bindType || q, g = (n._data(i, "events") || {})[b.type] && n._data(i, "handle"), g && g.apply(i, c), g = h && i[h], g && g.apply && M(i) && (b.result = g.apply(i, c), b.result === !1 && b.preventDefault());if (b.type = q, !f && !b.isDefaultPrevented() && (!l._default || l._default.apply(p.pop(), c) === !1) && M(e) && h && e[q] && !n.isWindow(e)) {
          m = e[h], m && (e[h] = null), n.event.triggered = q;try {
            e[q]();
          } catch (s) {}n.event.triggered = void 0, m && (e[h] = m);
        }return b.result;
      }
    }, dispatch: function (a) {
      a = n.event.fix(a);var b,
          c,
          d,
          f,
          g,
          h = [],
          i = e.call(arguments),
          j = (n._data(this, "events") || {})[a.type] || [],
          k = n.event.special[a.type] || {};if (i[0] = a, a.delegateTarget = this, !k.preDispatch || k.preDispatch.call(this, a) !== !1) {
        h = n.event.handlers.call(this, a, j), b = 0;while ((f = h[b++]) && !a.isPropagationStopped()) {
          a.currentTarget = f.elem, c = 0;while ((g = f.handlers[c++]) && !a.isImmediatePropagationStopped()) a.rnamespace && !a.rnamespace.test(g.namespace) || (a.handleObj = g, a.data = g.data, d = ((n.event.special[g.origType] || {}).handle || g.handler).apply(f.elem, i), void 0 !== d && (a.result = d) === !1 && (a.preventDefault(), a.stopPropagation()));
        }return k.postDispatch && k.postDispatch.call(this, a), a.result;
      }
    }, handlers: function (a, b) {
      var c,
          d,
          e,
          f,
          g = [],
          h = b.delegateCount,
          i = a.target;if (h && i.nodeType && ("click" !== a.type || isNaN(a.button) || a.button < 1)) for (; i != this; i = i.parentNode || this) if (1 === i.nodeType && (i.disabled !== !0 || "click" !== a.type)) {
        for (d = [], c = 0; h > c; c++) f = b[c], e = f.selector + " ", void 0 === d[e] && (d[e] = f.needsContext ? n(e, this).index(i) > -1 : n.find(e, this, null, [i]).length), d[e] && d.push(f);d.length && g.push({ elem: i, handlers: d });
      }return h < b.length && g.push({ elem: this, handlers: b.slice(h) }), g;
    }, fix: function (a) {
      if (a[n.expando]) return a;var b,
          c,
          e,
          f = a.type,
          g = a,
          h = this.fixHooks[f];h || (this.fixHooks[f] = h = ma.test(f) ? this.mouseHooks : la.test(f) ? this.keyHooks : {}), e = h.props ? this.props.concat(h.props) : this.props, a = new n.Event(g), b = e.length;while (b--) c = e[b], a[c] = g[c];return a.target || (a.target = g.srcElement || d), 3 === a.target.nodeType && (a.target = a.target.parentNode), a.metaKey = !!a.metaKey, h.filter ? h.filter(a, g) : a;
    }, props: "altKey bubbles cancelable ctrlKey currentTarget detail eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "), fixHooks: {}, keyHooks: { props: "char charCode key keyCode".split(" "), filter: function (a, b) {
        return null == a.which && (a.which = null != b.charCode ? b.charCode : b.keyCode), a;
      } }, mouseHooks: { props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "), filter: function (a, b) {
        var c,
            e,
            f,
            g = b.button,
            h = b.fromElement;return null == a.pageX && null != b.clientX && (e = a.target.ownerDocument || d, f = e.documentElement, c = e.body, a.pageX = b.clientX + (f && f.scrollLeft || c && c.scrollLeft || 0) - (f && f.clientLeft || c && c.clientLeft || 0), a.pageY = b.clientY + (f && f.scrollTop || c && c.scrollTop || 0) - (f && f.clientTop || c && c.clientTop || 0)), !a.relatedTarget && h && (a.relatedTarget = h === a.target ? b.toElement : h), a.which || void 0 === g || (a.which = 1 & g ? 1 : 2 & g ? 3 : 4 & g ? 2 : 0), a;
      } }, special: { load: { noBubble: !0 }, focus: { trigger: function () {
          if (this !== ra() && this.focus) try {
            return this.focus(), !1;
          } catch (a) {}
        }, delegateType: "focusin" }, blur: { trigger: function () {
          return this === ra() && this.blur ? (this.blur(), !1) : void 0;
        }, delegateType: "focusout" }, click: { trigger: function () {
          return n.nodeName(this, "input") && "checkbox" === this.type && this.click ? (this.click(), !1) : void 0;
        }, _default: function (a) {
          return n.nodeName(a.target, "a");
        } }, beforeunload: { postDispatch: function (a) {
          void 0 !== a.result && a.originalEvent && (a.originalEvent.returnValue = a.result);
        } } }, simulate: function (a, b, c) {
      var d = n.extend(new n.Event(), c, { type: a, isSimulated: !0 });n.event.trigger(d, null, b), d.isDefaultPrevented() && c.preventDefault();
    } }, n.removeEvent = d.removeEventListener ? function (a, b, c) {
    a.removeEventListener && a.removeEventListener(b, c);
  } : function (a, b, c) {
    var d = "on" + b;a.detachEvent && ("undefined" == typeof a[d] && (a[d] = null), a.detachEvent(d, c));
  }, n.Event = function (a, b) {
    return this instanceof n.Event ? (a && a.type ? (this.originalEvent = a, this.type = a.type, this.isDefaultPrevented = a.defaultPrevented || void 0 === a.defaultPrevented && a.returnValue === !1 ? pa : qa) : this.type = a, b && n.extend(this, b), this.timeStamp = a && a.timeStamp || n.now(), void (this[n.expando] = !0)) : new n.Event(a, b);
  }, n.Event.prototype = { constructor: n.Event, isDefaultPrevented: qa, isPropagationStopped: qa, isImmediatePropagationStopped: qa, preventDefault: function () {
      var a = this.originalEvent;this.isDefaultPrevented = pa, a && (a.preventDefault ? a.preventDefault() : a.returnValue = !1);
    }, stopPropagation: function () {
      var a = this.originalEvent;this.isPropagationStopped = pa, a && !this.isSimulated && (a.stopPropagation && a.stopPropagation(), a.cancelBubble = !0);
    }, stopImmediatePropagation: function () {
      var a = this.originalEvent;this.isImmediatePropagationStopped = pa, a && a.stopImmediatePropagation && a.stopImmediatePropagation(), this.stopPropagation();
    } }, n.each({ mouseenter: "mouseover", mouseleave: "mouseout", pointerenter: "pointerover", pointerleave: "pointerout" }, function (a, b) {
    n.event.special[a] = { delegateType: b, bindType: b, handle: function (a) {
        var c,
            d = this,
            e = a.relatedTarget,
            f = a.handleObj;return e && (e === d || n.contains(d, e)) || (a.type = f.origType, c = f.handler.apply(this, arguments), a.type = b), c;
      } };
  }), l.submit || (n.event.special.submit = { setup: function () {
      return n.nodeName(this, "form") ? !1 : void n.event.add(this, "click._submit keypress._submit", function (a) {
        var b = a.target,
            c = n.nodeName(b, "input") || n.nodeName(b, "button") ? n.prop(b, "form") : void 0;c && !n._data(c, "submit") && (n.event.add(c, "submit._submit", function (a) {
          a._submitBubble = !0;
        }), n._data(c, "submit", !0));
      });
    }, postDispatch: function (a) {
      a._submitBubble && (delete a._submitBubble, this.parentNode && !a.isTrigger && n.event.simulate("submit", this.parentNode, a));
    }, teardown: function () {
      return n.nodeName(this, "form") ? !1 : void n.event.remove(this, "._submit");
    } }), l.change || (n.event.special.change = { setup: function () {
      return ka.test(this.nodeName) ? ("checkbox" !== this.type && "radio" !== this.type || (n.event.add(this, "propertychange._change", function (a) {
        "checked" === a.originalEvent.propertyName && (this._justChanged = !0);
      }), n.event.add(this, "click._change", function (a) {
        this._justChanged && !a.isTrigger && (this._justChanged = !1), n.event.simulate("change", this, a);
      })), !1) : void n.event.add(this, "beforeactivate._change", function (a) {
        var b = a.target;ka.test(b.nodeName) && !n._data(b, "change") && (n.event.add(b, "change._change", function (a) {
          !this.parentNode || a.isSimulated || a.isTrigger || n.event.simulate("change", this.parentNode, a);
        }), n._data(b, "change", !0));
      });
    }, handle: function (a) {
      var b = a.target;return this !== b || a.isSimulated || a.isTrigger || "radio" !== b.type && "checkbox" !== b.type ? a.handleObj.handler.apply(this, arguments) : void 0;
    }, teardown: function () {
      return n.event.remove(this, "._change"), !ka.test(this.nodeName);
    } }), l.focusin || n.each({ focus: "focusin", blur: "focusout" }, function (a, b) {
    var c = function (a) {
      n.event.simulate(b, a.target, n.event.fix(a));
    };n.event.special[b] = { setup: function () {
        var d = this.ownerDocument || this,
            e = n._data(d, b);e || d.addEventListener(a, c, !0), n._data(d, b, (e || 0) + 1);
      }, teardown: function () {
        var d = this.ownerDocument || this,
            e = n._data(d, b) - 1;e ? n._data(d, b, e) : (d.removeEventListener(a, c, !0), n._removeData(d, b));
      } };
  }), n.fn.extend({ on: function (a, b, c, d) {
      return sa(this, a, b, c, d);
    }, one: function (a, b, c, d) {
      return sa(this, a, b, c, d, 1);
    }, off: function (a, b, c) {
      var d, e;if (a && a.preventDefault && a.handleObj) return d = a.handleObj, n(a.delegateTarget).off(d.namespace ? d.origType + "." + d.namespace : d.origType, d.selector, d.handler), this;if ("object" == typeof a) {
        for (e in a) this.off(e, b, a[e]);return this;
      }return b !== !1 && "function" != typeof b || (c = b, b = void 0), c === !1 && (c = qa), this.each(function () {
        n.event.remove(this, a, c, b);
      });
    }, trigger: function (a, b) {
      return this.each(function () {
        n.event.trigger(a, b, this);
      });
    }, triggerHandler: function (a, b) {
      var c = this[0];return c ? n.event.trigger(a, b, c, !0) : void 0;
    } });var ta = / jQuery\d+="(?:null|\d+)"/g,
      ua = new RegExp("<(?:" + ba + ")[\\s/>]", "i"),
      va = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:-]+)[^>]*)\/>/gi,
      wa = /<script|<style|<link/i,
      xa = /checked\s*(?:[^=]|=\s*.checked.)/i,
      ya = /^true\/(.*)/,
      za = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,
      Aa = ca(d),
      Ba = Aa.appendChild(d.createElement("div"));function Ca(a, b) {
    return n.nodeName(a, "table") && n.nodeName(11 !== b.nodeType ? b : b.firstChild, "tr") ? a.getElementsByTagName("tbody")[0] || a.appendChild(a.ownerDocument.createElement("tbody")) : a;
  }function Da(a) {
    return a.type = (null !== n.find.attr(a, "type")) + "/" + a.type, a;
  }function Ea(a) {
    var b = ya.exec(a.type);return b ? a.type = b[1] : a.removeAttribute("type"), a;
  }function Fa(a, b) {
    if (1 === b.nodeType && n.hasData(a)) {
      var c,
          d,
          e,
          f = n._data(a),
          g = n._data(b, f),
          h = f.events;if (h) {
        delete g.handle, g.events = {};for (c in h) for (d = 0, e = h[c].length; e > d; d++) n.event.add(b, c, h[c][d]);
      }g.data && (g.data = n.extend({}, g.data));
    }
  }function Ga(a, b) {
    var c, d, e;if (1 === b.nodeType) {
      if (c = b.nodeName.toLowerCase(), !l.noCloneEvent && b[n.expando]) {
        e = n._data(b);for (d in e.events) n.removeEvent(b, d, e.handle);b.removeAttribute(n.expando);
      }"script" === c && b.text !== a.text ? (Da(b).text = a.text, Ea(b)) : "object" === c ? (b.parentNode && (b.outerHTML = a.outerHTML), l.html5Clone && a.innerHTML && !n.trim(b.innerHTML) && (b.innerHTML = a.innerHTML)) : "input" === c && Z.test(a.type) ? (b.defaultChecked = b.checked = a.checked, b.value !== a.value && (b.value = a.value)) : "option" === c ? b.defaultSelected = b.selected = a.defaultSelected : "input" !== c && "textarea" !== c || (b.defaultValue = a.defaultValue);
    }
  }function Ha(a, b, c, d) {
    b = f.apply([], b);var e,
        g,
        h,
        i,
        j,
        k,
        m = 0,
        o = a.length,
        p = o - 1,
        q = b[0],
        r = n.isFunction(q);if (r || o > 1 && "string" == typeof q && !l.checkClone && xa.test(q)) return a.each(function (e) {
      var f = a.eq(e);r && (b[0] = q.call(this, e, f.html())), Ha(f, b, c, d);
    });if (o && (k = ja(b, a[0].ownerDocument, !1, a, d), e = k.firstChild, 1 === k.childNodes.length && (k = e), e || d)) {
      for (i = n.map(ea(k, "script"), Da), h = i.length; o > m; m++) g = k, m !== p && (g = n.clone(g, !0, !0), h && n.merge(i, ea(g, "script"))), c.call(a[m], g, m);if (h) for (j = i[i.length - 1].ownerDocument, n.map(i, Ea), m = 0; h > m; m++) g = i[m], _.test(g.type || "") && !n._data(g, "globalEval") && n.contains(j, g) && (g.src ? n._evalUrl && n._evalUrl(g.src) : n.globalEval((g.text || g.textContent || g.innerHTML || "").replace(za, "")));k = e = null;
    }return a;
  }function Ia(a, b, c) {
    for (var d, e = b ? n.filter(b, a) : a, f = 0; null != (d = e[f]); f++) c || 1 !== d.nodeType || n.cleanData(ea(d)), d.parentNode && (c && n.contains(d.ownerDocument, d) && fa(ea(d, "script")), d.parentNode.removeChild(d));return a;
  }n.extend({ htmlPrefilter: function (a) {
      return a.replace(va, "<$1></$2>");
    }, clone: function (a, b, c) {
      var d,
          e,
          f,
          g,
          h,
          i = n.contains(a.ownerDocument, a);if (l.html5Clone || n.isXMLDoc(a) || !ua.test("<" + a.nodeName + ">") ? f = a.cloneNode(!0) : (Ba.innerHTML = a.outerHTML, Ba.removeChild(f = Ba.firstChild)), !(l.noCloneEvent && l.noCloneChecked || 1 !== a.nodeType && 11 !== a.nodeType || n.isXMLDoc(a))) for (d = ea(f), h = ea(a), g = 0; null != (e = h[g]); ++g) d[g] && Ga(e, d[g]);if (b) if (c) for (h = h || ea(a), d = d || ea(f), g = 0; null != (e = h[g]); g++) Fa(e, d[g]);else Fa(a, f);return d = ea(f, "script"), d.length > 0 && fa(d, !i && ea(a, "script")), d = h = e = null, f;
    }, cleanData: function (a, b) {
      for (var d, e, f, g, h = 0, i = n.expando, j = n.cache, k = l.attributes, m = n.event.special; null != (d = a[h]); h++) if ((b || M(d)) && (f = d[i], g = f && j[f])) {
        if (g.events) for (e in g.events) m[e] ? n.event.remove(d, e) : n.removeEvent(d, e, g.handle);j[f] && (delete j[f], k || "undefined" == typeof d.removeAttribute ? d[i] = void 0 : d.removeAttribute(i), c.push(f));
      }
    } }), n.fn.extend({ domManip: Ha, detach: function (a) {
      return Ia(this, a, !0);
    }, remove: function (a) {
      return Ia(this, a);
    }, text: function (a) {
      return Y(this, function (a) {
        return void 0 === a ? n.text(this) : this.empty().append((this[0] && this[0].ownerDocument || d).createTextNode(a));
      }, null, a, arguments.length);
    }, append: function () {
      return Ha(this, arguments, function (a) {
        if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
          var b = Ca(this, a);b.appendChild(a);
        }
      });
    }, prepend: function () {
      return Ha(this, arguments, function (a) {
        if (1 === this.nodeType || 11 === this.nodeType || 9 === this.nodeType) {
          var b = Ca(this, a);b.insertBefore(a, b.firstChild);
        }
      });
    }, before: function () {
      return Ha(this, arguments, function (a) {
        this.parentNode && this.parentNode.insertBefore(a, this);
      });
    }, after: function () {
      return Ha(this, arguments, function (a) {
        this.parentNode && this.parentNode.insertBefore(a, this.nextSibling);
      });
    }, empty: function () {
      for (var a, b = 0; null != (a = this[b]); b++) {
        1 === a.nodeType && n.cleanData(ea(a, !1));while (a.firstChild) a.removeChild(a.firstChild);a.options && n.nodeName(a, "select") && (a.options.length = 0);
      }return this;
    }, clone: function (a, b) {
      return a = null == a ? !1 : a, b = null == b ? a : b, this.map(function () {
        return n.clone(this, a, b);
      });
    }, html: function (a) {
      return Y(this, function (a) {
        var b = this[0] || {},
            c = 0,
            d = this.length;if (void 0 === a) return 1 === b.nodeType ? b.innerHTML.replace(ta, "") : void 0;if ("string" == typeof a && !wa.test(a) && (l.htmlSerialize || !ua.test(a)) && (l.leadingWhitespace || !aa.test(a)) && !da[($.exec(a) || ["", ""])[1].toLowerCase()]) {
          a = n.htmlPrefilter(a);try {
            for (; d > c; c++) b = this[c] || {}, 1 === b.nodeType && (n.cleanData(ea(b, !1)), b.innerHTML = a);b = 0;
          } catch (e) {}
        }b && this.empty().append(a);
      }, null, a, arguments.length);
    }, replaceWith: function () {
      var a = [];return Ha(this, arguments, function (b) {
        var c = this.parentNode;n.inArray(this, a) < 0 && (n.cleanData(ea(this)), c && c.replaceChild(b, this));
      }, a);
    } }), n.each({ appendTo: "append", prependTo: "prepend", insertBefore: "before", insertAfter: "after", replaceAll: "replaceWith" }, function (a, b) {
    n.fn[a] = function (a) {
      for (var c, d = 0, e = [], f = n(a), h = f.length - 1; h >= d; d++) c = d === h ? this : this.clone(!0), n(f[d])[b](c), g.apply(e, c.get());return this.pushStack(e);
    };
  });var Ja,
      Ka = { HTML: "block", BODY: "block" };function La(a, b) {
    var c = n(b.createElement(a)).appendTo(b.body),
        d = n.css(c[0], "display");return c.detach(), d;
  }function Ma(a) {
    var b = d,
        c = Ka[a];return c || (c = La(a, b), "none" !== c && c || (Ja = (Ja || n("<iframe frameborder='0' width='0' height='0'/>")).appendTo(b.documentElement), b = (Ja[0].contentWindow || Ja[0].contentDocument).document, b.write(), b.close(), c = La(a, b), Ja.detach()), Ka[a] = c), c;
  }var Na = /^margin/,
      Oa = new RegExp("^(" + T + ")(?!px)[a-z%]+$", "i"),
      Pa = function (a, b, c, d) {
    var e,
        f,
        g = {};for (f in b) g[f] = a.style[f], a.style[f] = b[f];e = c.apply(a, d || []);for (f in b) a.style[f] = g[f];return e;
  },
      Qa = d.documentElement;!function () {
    var b,
        c,
        e,
        f,
        g,
        h,
        i = d.createElement("div"),
        j = d.createElement("div");if (j.style) {
      j.style.cssText = "float:left;opacity:.5", l.opacity = "0.5" === j.style.opacity, l.cssFloat = !!j.style.cssFloat, j.style.backgroundClip = "content-box", j.cloneNode(!0).style.backgroundClip = "", l.clearCloneStyle = "content-box" === j.style.backgroundClip, i = d.createElement("div"), i.style.cssText = "border:0;width:8px;height:0;top:0;left:-9999px;padding:0;margin-top:1px;position:absolute", j.innerHTML = "", i.appendChild(j), l.boxSizing = "" === j.style.boxSizing || "" === j.style.MozBoxSizing || "" === j.style.WebkitBoxSizing, n.extend(l, { reliableHiddenOffsets: function () {
          return null == b && k(), f;
        }, boxSizingReliable: function () {
          return null == b && k(), e;
        }, pixelMarginRight: function () {
          return null == b && k(), c;
        }, pixelPosition: function () {
          return null == b && k(), b;
        }, reliableMarginRight: function () {
          return null == b && k(), g;
        }, reliableMarginLeft: function () {
          return null == b && k(), h;
        } });function k() {
        var k,
            l,
            m = d.documentElement;m.appendChild(i), j.style.cssText = "-webkit-box-sizing:border-box;box-sizing:border-box;position:relative;display:block;margin:auto;border:1px;padding:1px;top:1%;width:50%", b = e = h = !1, c = g = !0, a.getComputedStyle && (l = a.getComputedStyle(j), b = "1%" !== (l || {}).top, h = "2px" === (l || {}).marginLeft, e = "4px" === (l || { width: "4px" }).width, j.style.marginRight = "50%", c = "4px" === (l || { marginRight: "4px" }).marginRight, k = j.appendChild(d.createElement("div")), k.style.cssText = j.style.cssText = "-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:0", k.style.marginRight = k.style.width = "0", j.style.width = "1px", g = !parseFloat((a.getComputedStyle(k) || {}).marginRight), j.removeChild(k)), j.style.display = "none", f = 0 === j.getClientRects().length, f && (j.style.display = "", j.innerHTML = "<table><tr><td></td><td>t</td></tr></table>", j.childNodes[0].style.borderCollapse = "separate", k = j.getElementsByTagName("td"), k[0].style.cssText = "margin:0;border:0;padding:0;display:none", f = 0 === k[0].offsetHeight, f && (k[0].style.display = "", k[1].style.display = "none", f = 0 === k[0].offsetHeight)), m.removeChild(i);
      }
    }
  }();var Ra,
      Sa,
      Ta = /^(top|right|bottom|left)$/;a.getComputedStyle ? (Ra = function (b) {
    var c = b.ownerDocument.defaultView;return c && c.opener || (c = a), c.getComputedStyle(b);
  }, Sa = function (a, b, c) {
    var d,
        e,
        f,
        g,
        h = a.style;return c = c || Ra(a), g = c ? c.getPropertyValue(b) || c[b] : void 0, "" !== g && void 0 !== g || n.contains(a.ownerDocument, a) || (g = n.style(a, b)), c && !l.pixelMarginRight() && Oa.test(g) && Na.test(b) && (d = h.width, e = h.minWidth, f = h.maxWidth, h.minWidth = h.maxWidth = h.width = g, g = c.width, h.width = d, h.minWidth = e, h.maxWidth = f), void 0 === g ? g : g + "";
  }) : Qa.currentStyle && (Ra = function (a) {
    return a.currentStyle;
  }, Sa = function (a, b, c) {
    var d,
        e,
        f,
        g,
        h = a.style;return c = c || Ra(a), g = c ? c[b] : void 0, null == g && h && h[b] && (g = h[b]), Oa.test(g) && !Ta.test(b) && (d = h.left, e = a.runtimeStyle, f = e && e.left, f && (e.left = a.currentStyle.left), h.left = "fontSize" === b ? "1em" : g, g = h.pixelLeft + "px", h.left = d, f && (e.left = f)), void 0 === g ? g : g + "" || "auto";
  });function Ua(a, b) {
    return { get: function () {
        return a() ? void delete this.get : (this.get = b).apply(this, arguments);
      } };
  }var Va = /alpha\([^)]*\)/i,
      Wa = /opacity\s*=\s*([^)]*)/i,
      Xa = /^(none|table(?!-c[ea]).+)/,
      Ya = new RegExp("^(" + T + ")(.*)$", "i"),
      Za = { position: "absolute", visibility: "hidden", display: "block" },
      $a = { letterSpacing: "0", fontWeight: "400" },
      _a = ["Webkit", "O", "Moz", "ms"],
      ab = d.createElement("div").style;function bb(a) {
    if (a in ab) return a;var b = a.charAt(0).toUpperCase() + a.slice(1),
        c = _a.length;while (c--) if (a = _a[c] + b, a in ab) return a;
  }function cb(a, b) {
    for (var c, d, e, f = [], g = 0, h = a.length; h > g; g++) d = a[g], d.style && (f[g] = n._data(d, "olddisplay"), c = d.style.display, b ? (f[g] || "none" !== c || (d.style.display = ""), "" === d.style.display && W(d) && (f[g] = n._data(d, "olddisplay", Ma(d.nodeName)))) : (e = W(d), (c && "none" !== c || !e) && n._data(d, "olddisplay", e ? c : n.css(d, "display"))));for (g = 0; h > g; g++) d = a[g], d.style && (b && "none" !== d.style.display && "" !== d.style.display || (d.style.display = b ? f[g] || "" : "none"));return a;
  }function db(a, b, c) {
    var d = Ya.exec(b);return d ? Math.max(0, d[1] - (c || 0)) + (d[2] || "px") : b;
  }function eb(a, b, c, d, e) {
    for (var f = c === (d ? "border" : "content") ? 4 : "width" === b ? 1 : 0, g = 0; 4 > f; f += 2) "margin" === c && (g += n.css(a, c + V[f], !0, e)), d ? ("content" === c && (g -= n.css(a, "padding" + V[f], !0, e)), "margin" !== c && (g -= n.css(a, "border" + V[f] + "Width", !0, e))) : (g += n.css(a, "padding" + V[f], !0, e), "padding" !== c && (g += n.css(a, "border" + V[f] + "Width", !0, e)));return g;
  }function fb(a, b, c) {
    var d = !0,
        e = "width" === b ? a.offsetWidth : a.offsetHeight,
        f = Ra(a),
        g = l.boxSizing && "border-box" === n.css(a, "boxSizing", !1, f);if (0 >= e || null == e) {
      if (e = Sa(a, b, f), (0 > e || null == e) && (e = a.style[b]), Oa.test(e)) return e;d = g && (l.boxSizingReliable() || e === a.style[b]), e = parseFloat(e) || 0;
    }return e + eb(a, b, c || (g ? "border" : "content"), d, f) + "px";
  }n.extend({ cssHooks: { opacity: { get: function (a, b) {
          if (b) {
            var c = Sa(a, "opacity");return "" === c ? "1" : c;
          }
        } } }, cssNumber: { animationIterationCount: !0, columnCount: !0, fillOpacity: !0, flexGrow: !0, flexShrink: !0, fontWeight: !0, lineHeight: !0, opacity: !0, order: !0, orphans: !0, widows: !0, zIndex: !0, zoom: !0 }, cssProps: { "float": l.cssFloat ? "cssFloat" : "styleFloat" }, style: function (a, b, c, d) {
      if (a && 3 !== a.nodeType && 8 !== a.nodeType && a.style) {
        var e,
            f,
            g,
            h = n.camelCase(b),
            i = a.style;if (b = n.cssProps[h] || (n.cssProps[h] = bb(h) || h), g = n.cssHooks[b] || n.cssHooks[h], void 0 === c) return g && "get" in g && void 0 !== (e = g.get(a, !1, d)) ? e : i[b];if (f = typeof c, "string" === f && (e = U.exec(c)) && e[1] && (c = X(a, b, e), f = "number"), null != c && c === c && ("number" === f && (c += e && e[3] || (n.cssNumber[h] ? "" : "px")), l.clearCloneStyle || "" !== c || 0 !== b.indexOf("background") || (i[b] = "inherit"), !(g && "set" in g && void 0 === (c = g.set(a, c, d))))) try {
          i[b] = c;
        } catch (j) {}
      }
    }, css: function (a, b, c, d) {
      var e,
          f,
          g,
          h = n.camelCase(b);return b = n.cssProps[h] || (n.cssProps[h] = bb(h) || h), g = n.cssHooks[b] || n.cssHooks[h], g && "get" in g && (f = g.get(a, !0, c)), void 0 === f && (f = Sa(a, b, d)), "normal" === f && b in $a && (f = $a[b]), "" === c || c ? (e = parseFloat(f), c === !0 || isFinite(e) ? e || 0 : f) : f;
    } }), n.each(["height", "width"], function (a, b) {
    n.cssHooks[b] = { get: function (a, c, d) {
        return c ? Xa.test(n.css(a, "display")) && 0 === a.offsetWidth ? Pa(a, Za, function () {
          return fb(a, b, d);
        }) : fb(a, b, d) : void 0;
      }, set: function (a, c, d) {
        var e = d && Ra(a);return db(a, c, d ? eb(a, b, d, l.boxSizing && "border-box" === n.css(a, "boxSizing", !1, e), e) : 0);
      } };
  }), l.opacity || (n.cssHooks.opacity = { get: function (a, b) {
      return Wa.test((b && a.currentStyle ? a.currentStyle.filter : a.style.filter) || "") ? .01 * parseFloat(RegExp.$1) + "" : b ? "1" : "";
    }, set: function (a, b) {
      var c = a.style,
          d = a.currentStyle,
          e = n.isNumeric(b) ? "alpha(opacity=" + 100 * b + ")" : "",
          f = d && d.filter || c.filter || "";c.zoom = 1, (b >= 1 || "" === b) && "" === n.trim(f.replace(Va, "")) && c.removeAttribute && (c.removeAttribute("filter"), "" === b || d && !d.filter) || (c.filter = Va.test(f) ? f.replace(Va, e) : f + " " + e);
    } }), n.cssHooks.marginRight = Ua(l.reliableMarginRight, function (a, b) {
    return b ? Pa(a, { display: "inline-block" }, Sa, [a, "marginRight"]) : void 0;
  }), n.cssHooks.marginLeft = Ua(l.reliableMarginLeft, function (a, b) {
    return b ? (parseFloat(Sa(a, "marginLeft")) || (n.contains(a.ownerDocument, a) ? a.getBoundingClientRect().left - Pa(a, {
      marginLeft: 0 }, function () {
      return a.getBoundingClientRect().left;
    }) : 0)) + "px" : void 0;
  }), n.each({ margin: "", padding: "", border: "Width" }, function (a, b) {
    n.cssHooks[a + b] = { expand: function (c) {
        for (var d = 0, e = {}, f = "string" == typeof c ? c.split(" ") : [c]; 4 > d; d++) e[a + V[d] + b] = f[d] || f[d - 2] || f[0];return e;
      } }, Na.test(a) || (n.cssHooks[a + b].set = db);
  }), n.fn.extend({ css: function (a, b) {
      return Y(this, function (a, b, c) {
        var d,
            e,
            f = {},
            g = 0;if (n.isArray(b)) {
          for (d = Ra(a), e = b.length; e > g; g++) f[b[g]] = n.css(a, b[g], !1, d);return f;
        }return void 0 !== c ? n.style(a, b, c) : n.css(a, b);
      }, a, b, arguments.length > 1);
    }, show: function () {
      return cb(this, !0);
    }, hide: function () {
      return cb(this);
    }, toggle: function (a) {
      return "boolean" == typeof a ? a ? this.show() : this.hide() : this.each(function () {
        W(this) ? n(this).show() : n(this).hide();
      });
    } });function gb(a, b, c, d, e) {
    return new gb.prototype.init(a, b, c, d, e);
  }n.Tween = gb, gb.prototype = { constructor: gb, init: function (a, b, c, d, e, f) {
      this.elem = a, this.prop = c, this.easing = e || n.easing._default, this.options = b, this.start = this.now = this.cur(), this.end = d, this.unit = f || (n.cssNumber[c] ? "" : "px");
    }, cur: function () {
      var a = gb.propHooks[this.prop];return a && a.get ? a.get(this) : gb.propHooks._default.get(this);
    }, run: function (a) {
      var b,
          c = gb.propHooks[this.prop];return this.options.duration ? this.pos = b = n.easing[this.easing](a, this.options.duration * a, 0, 1, this.options.duration) : this.pos = b = a, this.now = (this.end - this.start) * b + this.start, this.options.step && this.options.step.call(this.elem, this.now, this), c && c.set ? c.set(this) : gb.propHooks._default.set(this), this;
    } }, gb.prototype.init.prototype = gb.prototype, gb.propHooks = { _default: { get: function (a) {
        var b;return 1 !== a.elem.nodeType || null != a.elem[a.prop] && null == a.elem.style[a.prop] ? a.elem[a.prop] : (b = n.css(a.elem, a.prop, ""), b && "auto" !== b ? b : 0);
      }, set: function (a) {
        n.fx.step[a.prop] ? n.fx.step[a.prop](a) : 1 !== a.elem.nodeType || null == a.elem.style[n.cssProps[a.prop]] && !n.cssHooks[a.prop] ? a.elem[a.prop] = a.now : n.style(a.elem, a.prop, a.now + a.unit);
      } } }, gb.propHooks.scrollTop = gb.propHooks.scrollLeft = { set: function (a) {
      a.elem.nodeType && a.elem.parentNode && (a.elem[a.prop] = a.now);
    } }, n.easing = { linear: function (a) {
      return a;
    }, swing: function (a) {
      return .5 - Math.cos(a * Math.PI) / 2;
    }, _default: "swing" }, n.fx = gb.prototype.init, n.fx.step = {};var hb,
      ib,
      jb = /^(?:toggle|show|hide)$/,
      kb = /queueHooks$/;function lb() {
    return a.setTimeout(function () {
      hb = void 0;
    }), hb = n.now();
  }function mb(a, b) {
    var c,
        d = { height: a },
        e = 0;for (b = b ? 1 : 0; 4 > e; e += 2 - b) c = V[e], d["margin" + c] = d["padding" + c] = a;return b && (d.opacity = d.width = a), d;
  }function nb(a, b, c) {
    for (var d, e = (qb.tweeners[b] || []).concat(qb.tweeners["*"]), f = 0, g = e.length; g > f; f++) if (d = e[f].call(c, b, a)) return d;
  }function ob(a, b, c) {
    var d,
        e,
        f,
        g,
        h,
        i,
        j,
        k,
        m = this,
        o = {},
        p = a.style,
        q = a.nodeType && W(a),
        r = n._data(a, "fxshow");c.queue || (h = n._queueHooks(a, "fx"), null == h.unqueued && (h.unqueued = 0, i = h.empty.fire, h.empty.fire = function () {
      h.unqueued || i();
    }), h.unqueued++, m.always(function () {
      m.always(function () {
        h.unqueued--, n.queue(a, "fx").length || h.empty.fire();
      });
    })), 1 === a.nodeType && ("height" in b || "width" in b) && (c.overflow = [p.overflow, p.overflowX, p.overflowY], j = n.css(a, "display"), k = "none" === j ? n._data(a, "olddisplay") || Ma(a.nodeName) : j, "inline" === k && "none" === n.css(a, "float") && (l.inlineBlockNeedsLayout && "inline" !== Ma(a.nodeName) ? p.zoom = 1 : p.display = "inline-block")), c.overflow && (p.overflow = "hidden", l.shrinkWrapBlocks() || m.always(function () {
      p.overflow = c.overflow[0], p.overflowX = c.overflow[1], p.overflowY = c.overflow[2];
    }));for (d in b) if (e = b[d], jb.exec(e)) {
      if (delete b[d], f = f || "toggle" === e, e === (q ? "hide" : "show")) {
        if ("show" !== e || !r || void 0 === r[d]) continue;q = !0;
      }o[d] = r && r[d] || n.style(a, d);
    } else j = void 0;if (n.isEmptyObject(o)) "inline" === ("none" === j ? Ma(a.nodeName) : j) && (p.display = j);else {
      r ? "hidden" in r && (q = r.hidden) : r = n._data(a, "fxshow", {}), f && (r.hidden = !q), q ? n(a).show() : m.done(function () {
        n(a).hide();
      }), m.done(function () {
        var b;n._removeData(a, "fxshow");for (b in o) n.style(a, b, o[b]);
      });for (d in o) g = nb(q ? r[d] : 0, d, m), d in r || (r[d] = g.start, q && (g.end = g.start, g.start = "width" === d || "height" === d ? 1 : 0));
    }
  }function pb(a, b) {
    var c, d, e, f, g;for (c in a) if (d = n.camelCase(c), e = b[d], f = a[c], n.isArray(f) && (e = f[1], f = a[c] = f[0]), c !== d && (a[d] = f, delete a[c]), g = n.cssHooks[d], g && "expand" in g) {
      f = g.expand(f), delete a[d];for (c in f) c in a || (a[c] = f[c], b[c] = e);
    } else b[d] = e;
  }function qb(a, b, c) {
    var d,
        e,
        f = 0,
        g = qb.prefilters.length,
        h = n.Deferred().always(function () {
      delete i.elem;
    }),
        i = function () {
      if (e) return !1;for (var b = hb || lb(), c = Math.max(0, j.startTime + j.duration - b), d = c / j.duration || 0, f = 1 - d, g = 0, i = j.tweens.length; i > g; g++) j.tweens[g].run(f);return h.notifyWith(a, [j, f, c]), 1 > f && i ? c : (h.resolveWith(a, [j]), !1);
    },
        j = h.promise({ elem: a, props: n.extend({}, b), opts: n.extend(!0, { specialEasing: {}, easing: n.easing._default }, c), originalProperties: b, originalOptions: c, startTime: hb || lb(), duration: c.duration, tweens: [], createTween: function (b, c) {
        var d = n.Tween(a, j.opts, b, c, j.opts.specialEasing[b] || j.opts.easing);return j.tweens.push(d), d;
      }, stop: function (b) {
        var c = 0,
            d = b ? j.tweens.length : 0;if (e) return this;for (e = !0; d > c; c++) j.tweens[c].run(1);return b ? (h.notifyWith(a, [j, 1, 0]), h.resolveWith(a, [j, b])) : h.rejectWith(a, [j, b]), this;
      } }),
        k = j.props;for (pb(k, j.opts.specialEasing); g > f; f++) if (d = qb.prefilters[f].call(j, a, k, j.opts)) return n.isFunction(d.stop) && (n._queueHooks(j.elem, j.opts.queue).stop = n.proxy(d.stop, d)), d;return n.map(k, nb, j), n.isFunction(j.opts.start) && j.opts.start.call(a, j), n.fx.timer(n.extend(i, { elem: a, anim: j, queue: j.opts.queue })), j.progress(j.opts.progress).done(j.opts.done, j.opts.complete).fail(j.opts.fail).always(j.opts.always);
  }n.Animation = n.extend(qb, { tweeners: { "*": [function (a, b) {
        var c = this.createTween(a, b);return X(c.elem, a, U.exec(b), c), c;
      }] }, tweener: function (a, b) {
      n.isFunction(a) ? (b = a, a = ["*"]) : a = a.match(G);for (var c, d = 0, e = a.length; e > d; d++) c = a[d], qb.tweeners[c] = qb.tweeners[c] || [], qb.tweeners[c].unshift(b);
    }, prefilters: [ob], prefilter: function (a, b) {
      b ? qb.prefilters.unshift(a) : qb.prefilters.push(a);
    } }), n.speed = function (a, b, c) {
    var d = a && "object" == typeof a ? n.extend({}, a) : { complete: c || !c && b || n.isFunction(a) && a, duration: a, easing: c && b || b && !n.isFunction(b) && b };return d.duration = n.fx.off ? 0 : "number" == typeof d.duration ? d.duration : d.duration in n.fx.speeds ? n.fx.speeds[d.duration] : n.fx.speeds._default, null != d.queue && d.queue !== !0 || (d.queue = "fx"), d.old = d.complete, d.complete = function () {
      n.isFunction(d.old) && d.old.call(this), d.queue && n.dequeue(this, d.queue);
    }, d;
  }, n.fn.extend({ fadeTo: function (a, b, c, d) {
      return this.filter(W).css("opacity", 0).show().end().animate({ opacity: b }, a, c, d);
    }, animate: function (a, b, c, d) {
      var e = n.isEmptyObject(a),
          f = n.speed(b, c, d),
          g = function () {
        var b = qb(this, n.extend({}, a), f);(e || n._data(this, "finish")) && b.stop(!0);
      };return g.finish = g, e || f.queue === !1 ? this.each(g) : this.queue(f.queue, g);
    }, stop: function (a, b, c) {
      var d = function (a) {
        var b = a.stop;delete a.stop, b(c);
      };return "string" != typeof a && (c = b, b = a, a = void 0), b && a !== !1 && this.queue(a || "fx", []), this.each(function () {
        var b = !0,
            e = null != a && a + "queueHooks",
            f = n.timers,
            g = n._data(this);if (e) g[e] && g[e].stop && d(g[e]);else for (e in g) g[e] && g[e].stop && kb.test(e) && d(g[e]);for (e = f.length; e--;) f[e].elem !== this || null != a && f[e].queue !== a || (f[e].anim.stop(c), b = !1, f.splice(e, 1));!b && c || n.dequeue(this, a);
      });
    }, finish: function (a) {
      return a !== !1 && (a = a || "fx"), this.each(function () {
        var b,
            c = n._data(this),
            d = c[a + "queue"],
            e = c[a + "queueHooks"],
            f = n.timers,
            g = d ? d.length : 0;for (c.finish = !0, n.queue(this, a, []), e && e.stop && e.stop.call(this, !0), b = f.length; b--;) f[b].elem === this && f[b].queue === a && (f[b].anim.stop(!0), f.splice(b, 1));for (b = 0; g > b; b++) d[b] && d[b].finish && d[b].finish.call(this);delete c.finish;
      });
    } }), n.each(["toggle", "show", "hide"], function (a, b) {
    var c = n.fn[b];n.fn[b] = function (a, d, e) {
      return null == a || "boolean" == typeof a ? c.apply(this, arguments) : this.animate(mb(b, !0), a, d, e);
    };
  }), n.each({ slideDown: mb("show"), slideUp: mb("hide"), slideToggle: mb("toggle"), fadeIn: { opacity: "show" }, fadeOut: { opacity: "hide" }, fadeToggle: { opacity: "toggle" } }, function (a, b) {
    n.fn[a] = function (a, c, d) {
      return this.animate(b, a, c, d);
    };
  }), n.timers = [], n.fx.tick = function () {
    var a,
        b = n.timers,
        c = 0;for (hb = n.now(); c < b.length; c++) a = b[c], a() || b[c] !== a || b.splice(c--, 1);b.length || n.fx.stop(), hb = void 0;
  }, n.fx.timer = function (a) {
    n.timers.push(a), a() ? n.fx.start() : n.timers.pop();
  }, n.fx.interval = 13, n.fx.start = function () {
    ib || (ib = a.setInterval(n.fx.tick, n.fx.interval));
  }, n.fx.stop = function () {
    a.clearInterval(ib), ib = null;
  }, n.fx.speeds = { slow: 600, fast: 200, _default: 400 }, n.fn.delay = function (b, c) {
    return b = n.fx ? n.fx.speeds[b] || b : b, c = c || "fx", this.queue(c, function (c, d) {
      var e = a.setTimeout(c, b);d.stop = function () {
        a.clearTimeout(e);
      };
    });
  }, function () {
    var a,
        b = d.createElement("input"),
        c = d.createElement("div"),
        e = d.createElement("select"),
        f = e.appendChild(d.createElement("option"));c = d.createElement("div"), c.setAttribute("className", "t"), c.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>", a = c.getElementsByTagName("a")[0], b.setAttribute("type", "checkbox"), c.appendChild(b), a = c.getElementsByTagName("a")[0], a.style.cssText = "top:1px", l.getSetAttribute = "t" !== c.className, l.style = /top/.test(a.getAttribute("style")), l.hrefNormalized = "/a" === a.getAttribute("href"), l.checkOn = !!b.value, l.optSelected = f.selected, l.enctype = !!d.createElement("form").enctype, e.disabled = !0, l.optDisabled = !f.disabled, b = d.createElement("input"), b.setAttribute("value", ""), l.input = "" === b.getAttribute("value"), b.value = "t", b.setAttribute("type", "radio"), l.radioValue = "t" === b.value;
  }();var rb = /\r/g,
      sb = /[\x20\t\r\n\f]+/g;n.fn.extend({ val: function (a) {
      var b,
          c,
          d,
          e = this[0];{
        if (arguments.length) return d = n.isFunction(a), this.each(function (c) {
          var e;1 === this.nodeType && (e = d ? a.call(this, c, n(this).val()) : a, null == e ? e = "" : "number" == typeof e ? e += "" : n.isArray(e) && (e = n.map(e, function (a) {
            return null == a ? "" : a + "";
          })), b = n.valHooks[this.type] || n.valHooks[this.nodeName.toLowerCase()], b && "set" in b && void 0 !== b.set(this, e, "value") || (this.value = e));
        });if (e) return b = n.valHooks[e.type] || n.valHooks[e.nodeName.toLowerCase()], b && "get" in b && void 0 !== (c = b.get(e, "value")) ? c : (c = e.value, "string" == typeof c ? c.replace(rb, "") : null == c ? "" : c);
      }
    } }), n.extend({ valHooks: { option: { get: function (a) {
          var b = n.find.attr(a, "value");return null != b ? b : n.trim(n.text(a)).replace(sb, " ");
        } }, select: { get: function (a) {
          for (var b, c, d = a.options, e = a.selectedIndex, f = "select-one" === a.type || 0 > e, g = f ? null : [], h = f ? e + 1 : d.length, i = 0 > e ? h : f ? e : 0; h > i; i++) if (c = d[i], (c.selected || i === e) && (l.optDisabled ? !c.disabled : null === c.getAttribute("disabled")) && (!c.parentNode.disabled || !n.nodeName(c.parentNode, "optgroup"))) {
            if (b = n(c).val(), f) return b;g.push(b);
          }return g;
        }, set: function (a, b) {
          var c,
              d,
              e = a.options,
              f = n.makeArray(b),
              g = e.length;while (g--) if (d = e[g], n.inArray(n.valHooks.option.get(d), f) > -1) try {
            d.selected = c = !0;
          } catch (h) {
            d.scrollHeight;
          } else d.selected = !1;return c || (a.selectedIndex = -1), e;
        } } } }), n.each(["radio", "checkbox"], function () {
    n.valHooks[this] = { set: function (a, b) {
        return n.isArray(b) ? a.checked = n.inArray(n(a).val(), b) > -1 : void 0;
      } }, l.checkOn || (n.valHooks[this].get = function (a) {
      return null === a.getAttribute("value") ? "on" : a.value;
    });
  });var tb,
      ub,
      vb = n.expr.attrHandle,
      wb = /^(?:checked|selected)$/i,
      xb = l.getSetAttribute,
      yb = l.input;n.fn.extend({ attr: function (a, b) {
      return Y(this, n.attr, a, b, arguments.length > 1);
    }, removeAttr: function (a) {
      return this.each(function () {
        n.removeAttr(this, a);
      });
    } }), n.extend({ attr: function (a, b, c) {
      var d,
          e,
          f = a.nodeType;if (3 !== f && 8 !== f && 2 !== f) return "undefined" == typeof a.getAttribute ? n.prop(a, b, c) : (1 === f && n.isXMLDoc(a) || (b = b.toLowerCase(), e = n.attrHooks[b] || (n.expr.match.bool.test(b) ? ub : tb)), void 0 !== c ? null === c ? void n.removeAttr(a, b) : e && "set" in e && void 0 !== (d = e.set(a, c, b)) ? d : (a.setAttribute(b, c + ""), c) : e && "get" in e && null !== (d = e.get(a, b)) ? d : (d = n.find.attr(a, b), null == d ? void 0 : d));
    }, attrHooks: { type: { set: function (a, b) {
          if (!l.radioValue && "radio" === b && n.nodeName(a, "input")) {
            var c = a.value;return a.setAttribute("type", b), c && (a.value = c), b;
          }
        } } }, removeAttr: function (a, b) {
      var c,
          d,
          e = 0,
          f = b && b.match(G);if (f && 1 === a.nodeType) while (c = f[e++]) d = n.propFix[c] || c, n.expr.match.bool.test(c) ? yb && xb || !wb.test(c) ? a[d] = !1 : a[n.camelCase("default-" + c)] = a[d] = !1 : n.attr(a, c, ""), a.removeAttribute(xb ? c : d);
    } }), ub = { set: function (a, b, c) {
      return b === !1 ? n.removeAttr(a, c) : yb && xb || !wb.test(c) ? a.setAttribute(!xb && n.propFix[c] || c, c) : a[n.camelCase("default-" + c)] = a[c] = !0, c;
    } }, n.each(n.expr.match.bool.source.match(/\w+/g), function (a, b) {
    var c = vb[b] || n.find.attr;yb && xb || !wb.test(b) ? vb[b] = function (a, b, d) {
      var e, f;return d || (f = vb[b], vb[b] = e, e = null != c(a, b, d) ? b.toLowerCase() : null, vb[b] = f), e;
    } : vb[b] = function (a, b, c) {
      return c ? void 0 : a[n.camelCase("default-" + b)] ? b.toLowerCase() : null;
    };
  }), yb && xb || (n.attrHooks.value = { set: function (a, b, c) {
      return n.nodeName(a, "input") ? void (a.defaultValue = b) : tb && tb.set(a, b, c);
    } }), xb || (tb = { set: function (a, b, c) {
      var d = a.getAttributeNode(c);return d || a.setAttributeNode(d = a.ownerDocument.createAttribute(c)), d.value = b += "", "value" === c || b === a.getAttribute(c) ? b : void 0;
    } }, vb.id = vb.name = vb.coords = function (a, b, c) {
    var d;return c ? void 0 : (d = a.getAttributeNode(b)) && "" !== d.value ? d.value : null;
  }, n.valHooks.button = { get: function (a, b) {
      var c = a.getAttributeNode(b);return c && c.specified ? c.value : void 0;
    }, set: tb.set }, n.attrHooks.contenteditable = { set: function (a, b, c) {
      tb.set(a, "" === b ? !1 : b, c);
    } }, n.each(["width", "height"], function (a, b) {
    n.attrHooks[b] = { set: function (a, c) {
        return "" === c ? (a.setAttribute(b, "auto"), c) : void 0;
      } };
  })), l.style || (n.attrHooks.style = { get: function (a) {
      return a.style.cssText || void 0;
    }, set: function (a, b) {
      return a.style.cssText = b + "";
    } });var zb = /^(?:input|select|textarea|button|object)$/i,
      Ab = /^(?:a|area)$/i;n.fn.extend({ prop: function (a, b) {
      return Y(this, n.prop, a, b, arguments.length > 1);
    }, removeProp: function (a) {
      return a = n.propFix[a] || a, this.each(function () {
        try {
          this[a] = void 0, delete this[a];
        } catch (b) {}
      });
    } }), n.extend({ prop: function (a, b, c) {
      var d,
          e,
          f = a.nodeType;if (3 !== f && 8 !== f && 2 !== f) return 1 === f && n.isXMLDoc(a) || (b = n.propFix[b] || b, e = n.propHooks[b]), void 0 !== c ? e && "set" in e && void 0 !== (d = e.set(a, c, b)) ? d : a[b] = c : e && "get" in e && null !== (d = e.get(a, b)) ? d : a[b];
    }, propHooks: { tabIndex: { get: function (a) {
          var b = n.find.attr(a, "tabindex");return b ? parseInt(b, 10) : zb.test(a.nodeName) || Ab.test(a.nodeName) && a.href ? 0 : -1;
        } } }, propFix: { "for": "htmlFor", "class": "className" } }), l.hrefNormalized || n.each(["href", "src"], function (a, b) {
    n.propHooks[b] = { get: function (a) {
        return a.getAttribute(b, 4);
      } };
  }), l.optSelected || (n.propHooks.selected = { get: function (a) {
      var b = a.parentNode;return b && (b.selectedIndex, b.parentNode && b.parentNode.selectedIndex), null;
    }, set: function (a) {
      var b = a.parentNode;b && (b.selectedIndex, b.parentNode && b.parentNode.selectedIndex);
    } }), n.each(["tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable"], function () {
    n.propFix[this.toLowerCase()] = this;
  }), l.enctype || (n.propFix.enctype = "encoding");var Bb = /[\t\r\n\f]/g;function Cb(a) {
    return n.attr(a, "class") || "";
  }n.fn.extend({ addClass: function (a) {
      var b,
          c,
          d,
          e,
          f,
          g,
          h,
          i = 0;if (n.isFunction(a)) return this.each(function (b) {
        n(this).addClass(a.call(this, b, Cb(this)));
      });if ("string" == typeof a && a) {
        b = a.match(G) || [];while (c = this[i++]) if (e = Cb(c), d = 1 === c.nodeType && (" " + e + " ").replace(Bb, " ")) {
          g = 0;while (f = b[g++]) d.indexOf(" " + f + " ") < 0 && (d += f + " ");h = n.trim(d), e !== h && n.attr(c, "class", h);
        }
      }return this;
    }, removeClass: function (a) {
      var b,
          c,
          d,
          e,
          f,
          g,
          h,
          i = 0;if (n.isFunction(a)) return this.each(function (b) {
        n(this).removeClass(a.call(this, b, Cb(this)));
      });if (!arguments.length) return this.attr("class", "");if ("string" == typeof a && a) {
        b = a.match(G) || [];while (c = this[i++]) if (e = Cb(c), d = 1 === c.nodeType && (" " + e + " ").replace(Bb, " ")) {
          g = 0;while (f = b[g++]) while (d.indexOf(" " + f + " ") > -1) d = d.replace(" " + f + " ", " ");h = n.trim(d), e !== h && n.attr(c, "class", h);
        }
      }return this;
    }, toggleClass: function (a, b) {
      var c = typeof a;return "boolean" == typeof b && "string" === c ? b ? this.addClass(a) : this.removeClass(a) : n.isFunction(a) ? this.each(function (c) {
        n(this).toggleClass(a.call(this, c, Cb(this), b), b);
      }) : this.each(function () {
        var b, d, e, f;if ("string" === c) {
          d = 0, e = n(this), f = a.match(G) || [];while (b = f[d++]) e.hasClass(b) ? e.removeClass(b) : e.addClass(b);
        } else void 0 !== a && "boolean" !== c || (b = Cb(this), b && n._data(this, "__className__", b), n.attr(this, "class", b || a === !1 ? "" : n._data(this, "__className__") || ""));
      });
    }, hasClass: function (a) {
      var b,
          c,
          d = 0;b = " " + a + " ";while (c = this[d++]) if (1 === c.nodeType && (" " + Cb(c) + " ").replace(Bb, " ").indexOf(b) > -1) return !0;return !1;
    } }), n.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "), function (a, b) {
    n.fn[b] = function (a, c) {
      return arguments.length > 0 ? this.on(b, null, a, c) : this.trigger(b);
    };
  }), n.fn.extend({ hover: function (a, b) {
      return this.mouseenter(a).mouseleave(b || a);
    } });var Db = a.location,
      Eb = n.now(),
      Fb = /\?/,
      Gb = /(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g;n.parseJSON = function (b) {
    if (a.JSON && a.JSON.parse) return a.JSON.parse(b + "");var c,
        d = null,
        e = n.trim(b + "");return e && !n.trim(e.replace(Gb, function (a, b, e, f) {
      return c && b && (d = 0), 0 === d ? a : (c = e || b, d += !f - !e, "");
    })) ? Function("return " + e)() : n.error("Invalid JSON: " + b);
  }, n.parseXML = function (b) {
    var c, d;if (!b || "string" != typeof b) return null;try {
      a.DOMParser ? (d = new a.DOMParser(), c = d.parseFromString(b, "text/xml")) : (c = new a.ActiveXObject("Microsoft.XMLDOM"), c.async = "false", c.loadXML(b));
    } catch (e) {
      c = void 0;
    }return c && c.documentElement && !c.getElementsByTagName("parsererror").length || n.error("Invalid XML: " + b), c;
  };var Hb = /#.*$/,
      Ib = /([?&])_=[^&]*/,
      Jb = /^(.*?):[ \t]*([^\r\n]*)\r?$/gm,
      Kb = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
      Lb = /^(?:GET|HEAD)$/,
      Mb = /^\/\//,
      Nb = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,
      Ob = {},
      Pb = {},
      Qb = "*/".concat("*"),
      Rb = Db.href,
      Sb = Nb.exec(Rb.toLowerCase()) || [];function Tb(a) {
    return function (b, c) {
      "string" != typeof b && (c = b, b = "*");var d,
          e = 0,
          f = b.toLowerCase().match(G) || [];if (n.isFunction(c)) while (d = f[e++]) "+" === d.charAt(0) ? (d = d.slice(1) || "*", (a[d] = a[d] || []).unshift(c)) : (a[d] = a[d] || []).push(c);
    };
  }function Ub(a, b, c, d) {
    var e = {},
        f = a === Pb;function g(h) {
      var i;return e[h] = !0, n.each(a[h] || [], function (a, h) {
        var j = h(b, c, d);return "string" != typeof j || f || e[j] ? f ? !(i = j) : void 0 : (b.dataTypes.unshift(j), g(j), !1);
      }), i;
    }return g(b.dataTypes[0]) || !e["*"] && g("*");
  }function Vb(a, b) {
    var c,
        d,
        e = n.ajaxSettings.flatOptions || {};for (d in b) void 0 !== b[d] && ((e[d] ? a : c || (c = {}))[d] = b[d]);return c && n.extend(!0, a, c), a;
  }function Wb(a, b, c) {
    var d,
        e,
        f,
        g,
        h = a.contents,
        i = a.dataTypes;while ("*" === i[0]) i.shift(), void 0 === e && (e = a.mimeType || b.getResponseHeader("Content-Type"));if (e) for (g in h) if (h[g] && h[g].test(e)) {
      i.unshift(g);break;
    }if (i[0] in c) f = i[0];else {
      for (g in c) {
        if (!i[0] || a.converters[g + " " + i[0]]) {
          f = g;break;
        }d || (d = g);
      }f = f || d;
    }return f ? (f !== i[0] && i.unshift(f), c[f]) : void 0;
  }function Xb(a, b, c, d) {
    var e,
        f,
        g,
        h,
        i,
        j = {},
        k = a.dataTypes.slice();if (k[1]) for (g in a.converters) j[g.toLowerCase()] = a.converters[g];f = k.shift();while (f) if (a.responseFields[f] && (c[a.responseFields[f]] = b), !i && d && a.dataFilter && (b = a.dataFilter(b, a.dataType)), i = f, f = k.shift()) if ("*" === f) f = i;else if ("*" !== i && i !== f) {
      if (g = j[i + " " + f] || j["* " + f], !g) for (e in j) if (h = e.split(" "), h[1] === f && (g = j[i + " " + h[0]] || j["* " + h[0]])) {
        g === !0 ? g = j[e] : j[e] !== !0 && (f = h[0], k.unshift(h[1]));break;
      }if (g !== !0) if (g && a["throws"]) b = g(b);else try {
        b = g(b);
      } catch (l) {
        return { state: "parsererror", error: g ? l : "No conversion from " + i + " to " + f };
      }
    }return { state: "success", data: b };
  }n.extend({ active: 0, lastModified: {}, etag: {}, ajaxSettings: { url: Rb, type: "GET", isLocal: Kb.test(Sb[1]), global: !0, processData: !0, async: !0, contentType: "application/x-www-form-urlencoded; charset=UTF-8", accepts: { "*": Qb, text: "text/plain", html: "text/html", xml: "application/xml, text/xml", json: "application/json, text/javascript" }, contents: { xml: /\bxml\b/, html: /\bhtml/, json: /\bjson\b/ }, responseFields: { xml: "responseXML", text: "responseText", json: "responseJSON" }, converters: { "* text": String, "text html": !0, "text json": n.parseJSON, "text xml": n.parseXML }, flatOptions: { url: !0, context: !0 } }, ajaxSetup: function (a, b) {
      return b ? Vb(Vb(a, n.ajaxSettings), b) : Vb(n.ajaxSettings, a);
    }, ajaxPrefilter: Tb(Ob), ajaxTransport: Tb(Pb), ajax: function (b, c) {
      "object" == typeof b && (c = b, b = void 0), c = c || {};var d,
          e,
          f,
          g,
          h,
          i,
          j,
          k,
          l = n.ajaxSetup({}, c),
          m = l.context || l,
          o = l.context && (m.nodeType || m.jquery) ? n(m) : n.event,
          p = n.Deferred(),
          q = n.Callbacks("once memory"),
          r = l.statusCode || {},
          s = {},
          t = {},
          u = 0,
          v = "canceled",
          w = { readyState: 0, getResponseHeader: function (a) {
          var b;if (2 === u) {
            if (!k) {
              k = {};while (b = Jb.exec(g)) k[b[1].toLowerCase()] = b[2];
            }b = k[a.toLowerCase()];
          }return null == b ? null : b;
        }, getAllResponseHeaders: function () {
          return 2 === u ? g : null;
        }, setRequestHeader: function (a, b) {
          var c = a.toLowerCase();return u || (a = t[c] = t[c] || a, s[a] = b), this;
        }, overrideMimeType: function (a) {
          return u || (l.mimeType = a), this;
        }, statusCode: function (a) {
          var b;if (a) if (2 > u) for (b in a) r[b] = [r[b], a[b]];else w.always(a[w.status]);return this;
        }, abort: function (a) {
          var b = a || v;return j && j.abort(b), y(0, b), this;
        } };if (p.promise(w).complete = q.add, w.success = w.done, w.error = w.fail, l.url = ((b || l.url || Rb) + "").replace(Hb, "").replace(Mb, Sb[1] + "//"), l.type = c.method || c.type || l.method || l.type, l.dataTypes = n.trim(l.dataType || "*").toLowerCase().match(G) || [""], null == l.crossDomain && (d = Nb.exec(l.url.toLowerCase()), l.crossDomain = !(!d || d[1] === Sb[1] && d[2] === Sb[2] && (d[3] || ("http:" === d[1] ? "80" : "443")) === (Sb[3] || ("http:" === Sb[1] ? "80" : "443")))), l.data && l.processData && "string" != typeof l.data && (l.data = n.param(l.data, l.traditional)), Ub(Ob, l, c, w), 2 === u) return w;i = n.event && l.global, i && 0 === n.active++ && n.event.trigger("ajaxStart"), l.type = l.type.toUpperCase(), l.hasContent = !Lb.test(l.type), f = l.url, l.hasContent || (l.data && (f = l.url += (Fb.test(f) ? "&" : "?") + l.data, delete l.data), l.cache === !1 && (l.url = Ib.test(f) ? f.replace(Ib, "$1_=" + Eb++) : f + (Fb.test(f) ? "&" : "?") + "_=" + Eb++)), l.ifModified && (n.lastModified[f] && w.setRequestHeader("If-Modified-Since", n.lastModified[f]), n.etag[f] && w.setRequestHeader("If-None-Match", n.etag[f])), (l.data && l.hasContent && l.contentType !== !1 || c.contentType) && w.setRequestHeader("Content-Type", l.contentType), w.setRequestHeader("Accept", l.dataTypes[0] && l.accepts[l.dataTypes[0]] ? l.accepts[l.dataTypes[0]] + ("*" !== l.dataTypes[0] ? ", " + Qb + "; q=0.01" : "") : l.accepts["*"]);for (e in l.headers) w.setRequestHeader(e, l.headers[e]);if (l.beforeSend && (l.beforeSend.call(m, w, l) === !1 || 2 === u)) return w.abort();v = "abort";for (e in { success: 1, error: 1, complete: 1 }) w[e](l[e]);if (j = Ub(Pb, l, c, w)) {
        if (w.readyState = 1, i && o.trigger("ajaxSend", [w, l]), 2 === u) return w;l.async && l.timeout > 0 && (h = a.setTimeout(function () {
          w.abort("timeout");
        }, l.timeout));try {
          u = 1, j.send(s, y);
        } catch (x) {
          if (!(2 > u)) throw x;y(-1, x);
        }
      } else y(-1, "No Transport");function y(b, c, d, e) {
        var k,
            s,
            t,
            v,
            x,
            y = c;2 !== u && (u = 2, h && a.clearTimeout(h), j = void 0, g = e || "", w.readyState = b > 0 ? 4 : 0, k = b >= 200 && 300 > b || 304 === b, d && (v = Wb(l, w, d)), v = Xb(l, v, w, k), k ? (l.ifModified && (x = w.getResponseHeader("Last-Modified"), x && (n.lastModified[f] = x), x = w.getResponseHeader("etag"), x && (n.etag[f] = x)), 204 === b || "HEAD" === l.type ? y = "nocontent" : 304 === b ? y = "notmodified" : (y = v.state, s = v.data, t = v.error, k = !t)) : (t = y, !b && y || (y = "error", 0 > b && (b = 0))), w.status = b, w.statusText = (c || y) + "", k ? p.resolveWith(m, [s, y, w]) : p.rejectWith(m, [w, y, t]), w.statusCode(r), r = void 0, i && o.trigger(k ? "ajaxSuccess" : "ajaxError", [w, l, k ? s : t]), q.fireWith(m, [w, y]), i && (o.trigger("ajaxComplete", [w, l]), --n.active || n.event.trigger("ajaxStop")));
      }return w;
    }, getJSON: function (a, b, c) {
      return n.get(a, b, c, "json");
    }, getScript: function (a, b) {
      return n.get(a, void 0, b, "script");
    } }), n.each(["get", "post"], function (a, b) {
    n[b] = function (a, c, d, e) {
      return n.isFunction(c) && (e = e || d, d = c, c = void 0), n.ajax(n.extend({ url: a, type: b, dataType: e, data: c, success: d }, n.isPlainObject(a) && a));
    };
  }), n._evalUrl = function (a) {
    return n.ajax({ url: a, type: "GET", dataType: "script", cache: !0, async: !1, global: !1, "throws": !0 });
  }, n.fn.extend({ wrapAll: function (a) {
      if (n.isFunction(a)) return this.each(function (b) {
        n(this).wrapAll(a.call(this, b));
      });if (this[0]) {
        var b = n(a, this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode && b.insertBefore(this[0]), b.map(function () {
          var a = this;while (a.firstChild && 1 === a.firstChild.nodeType) a = a.firstChild;return a;
        }).append(this);
      }return this;
    }, wrapInner: function (a) {
      return n.isFunction(a) ? this.each(function (b) {
        n(this).wrapInner(a.call(this, b));
      }) : this.each(function () {
        var b = n(this),
            c = b.contents();c.length ? c.wrapAll(a) : b.append(a);
      });
    }, wrap: function (a) {
      var b = n.isFunction(a);return this.each(function (c) {
        n(this).wrapAll(b ? a.call(this, c) : a);
      });
    }, unwrap: function () {
      return this.parent().each(function () {
        n.nodeName(this, "body") || n(this).replaceWith(this.childNodes);
      }).end();
    } });function Yb(a) {
    return a.style && a.style.display || n.css(a, "display");
  }function Zb(a) {
    if (!n.contains(a.ownerDocument || d, a)) return !0;while (a && 1 === a.nodeType) {
      if ("none" === Yb(a) || "hidden" === a.type) return !0;a = a.parentNode;
    }return !1;
  }n.expr.filters.hidden = function (a) {
    return l.reliableHiddenOffsets() ? a.offsetWidth <= 0 && a.offsetHeight <= 0 && !a.getClientRects().length : Zb(a);
  }, n.expr.filters.visible = function (a) {
    return !n.expr.filters.hidden(a);
  };var $b = /%20/g,
      _b = /\[\]$/,
      ac = /\r?\n/g,
      bc = /^(?:submit|button|image|reset|file)$/i,
      cc = /^(?:input|select|textarea|keygen)/i;function dc(a, b, c, d) {
    var e;if (n.isArray(b)) n.each(b, function (b, e) {
      c || _b.test(a) ? d(a, e) : dc(a + "[" + ("object" == typeof e && null != e ? b : "") + "]", e, c, d);
    });else if (c || "object" !== n.type(b)) d(a, b);else for (e in b) dc(a + "[" + e + "]", b[e], c, d);
  }n.param = function (a, b) {
    var c,
        d = [],
        e = function (a, b) {
      b = n.isFunction(b) ? b() : null == b ? "" : b, d[d.length] = encodeURIComponent(a) + "=" + encodeURIComponent(b);
    };if (void 0 === b && (b = n.ajaxSettings && n.ajaxSettings.traditional), n.isArray(a) || a.jquery && !n.isPlainObject(a)) n.each(a, function () {
      e(this.name, this.value);
    });else for (c in a) dc(c, a[c], b, e);return d.join("&").replace($b, "+");
  }, n.fn.extend({ serialize: function () {
      return n.param(this.serializeArray());
    }, serializeArray: function () {
      return this.map(function () {
        var a = n.prop(this, "elements");return a ? n.makeArray(a) : this;
      }).filter(function () {
        var a = this.type;return this.name && !n(this).is(":disabled") && cc.test(this.nodeName) && !bc.test(a) && (this.checked || !Z.test(a));
      }).map(function (a, b) {
        var c = n(this).val();return null == c ? null : n.isArray(c) ? n.map(c, function (a) {
          return { name: b.name, value: a.replace(ac, "\r\n") };
        }) : { name: b.name, value: c.replace(ac, "\r\n") };
      }).get();
    } }), n.ajaxSettings.xhr = void 0 !== a.ActiveXObject ? function () {
    return this.isLocal ? ic() : d.documentMode > 8 ? hc() : /^(get|post|head|put|delete|options)$/i.test(this.type) && hc() || ic();
  } : hc;var ec = 0,
      fc = {},
      gc = n.ajaxSettings.xhr();a.attachEvent && a.attachEvent("onunload", function () {
    for (var a in fc) fc[a](void 0, !0);
  }), l.cors = !!gc && "withCredentials" in gc, gc = l.ajax = !!gc, gc && n.ajaxTransport(function (b) {
    if (!b.crossDomain || l.cors) {
      var c;return { send: function (d, e) {
          var f,
              g = b.xhr(),
              h = ++ec;if (g.open(b.type, b.url, b.async, b.username, b.password), b.xhrFields) for (f in b.xhrFields) g[f] = b.xhrFields[f];b.mimeType && g.overrideMimeType && g.overrideMimeType(b.mimeType), b.crossDomain || d["X-Requested-With"] || (d["X-Requested-With"] = "XMLHttpRequest");for (f in d) void 0 !== d[f] && g.setRequestHeader(f, d[f] + "");g.send(b.hasContent && b.data || null), c = function (a, d) {
            var f, i, j;if (c && (d || 4 === g.readyState)) if (delete fc[h], c = void 0, g.onreadystatechange = n.noop, d) 4 !== g.readyState && g.abort();else {
              j = {}, f = g.status, "string" == typeof g.responseText && (j.text = g.responseText);try {
                i = g.statusText;
              } catch (k) {
                i = "";
              }f || !b.isLocal || b.crossDomain ? 1223 === f && (f = 204) : f = j.text ? 200 : 404;
            }j && e(f, i, j, g.getAllResponseHeaders());
          }, b.async ? 4 === g.readyState ? a.setTimeout(c) : g.onreadystatechange = fc[h] = c : c();
        }, abort: function () {
          c && c(void 0, !0);
        } };
    }
  });function hc() {
    try {
      return new a.XMLHttpRequest();
    } catch (b) {}
  }function ic() {
    try {
      return new a.ActiveXObject("Microsoft.XMLHTTP");
    } catch (b) {}
  }n.ajaxSetup({ accepts: { script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript" }, contents: { script: /\b(?:java|ecma)script\b/ }, converters: { "text script": function (a) {
        return n.globalEval(a), a;
      } } }), n.ajaxPrefilter("script", function (a) {
    void 0 === a.cache && (a.cache = !1), a.crossDomain && (a.type = "GET", a.global = !1);
  }), n.ajaxTransport("script", function (a) {
    if (a.crossDomain) {
      var b,
          c = d.head || n("head")[0] || d.documentElement;return { send: function (e, f) {
          b = d.createElement("script"), b.async = !0, a.scriptCharset && (b.charset = a.scriptCharset), b.src = a.url, b.onload = b.onreadystatechange = function (a, c) {
            (c || !b.readyState || /loaded|complete/.test(b.readyState)) && (b.onload = b.onreadystatechange = null, b.parentNode && b.parentNode.removeChild(b), b = null, c || f(200, "success"));
          }, c.insertBefore(b, c.firstChild);
        }, abort: function () {
          b && b.onload(void 0, !0);
        } };
    }
  });var jc = [],
      kc = /(=)\?(?=&|$)|\?\?/;n.ajaxSetup({ jsonp: "callback", jsonpCallback: function () {
      var a = jc.pop() || n.expando + "_" + Eb++;return this[a] = !0, a;
    } }), n.ajaxPrefilter("json jsonp", function (b, c, d) {
    var e,
        f,
        g,
        h = b.jsonp !== !1 && (kc.test(b.url) ? "url" : "string" == typeof b.data && 0 === (b.contentType || "").indexOf("application/x-www-form-urlencoded") && kc.test(b.data) && "data");return h || "jsonp" === b.dataTypes[0] ? (e = b.jsonpCallback = n.isFunction(b.jsonpCallback) ? b.jsonpCallback() : b.jsonpCallback, h ? b[h] = b[h].replace(kc, "$1" + e) : b.jsonp !== !1 && (b.url += (Fb.test(b.url) ? "&" : "?") + b.jsonp + "=" + e), b.converters["script json"] = function () {
      return g || n.error(e + " was not called"), g[0];
    }, b.dataTypes[0] = "json", f = a[e], a[e] = function () {
      g = arguments;
    }, d.always(function () {
      void 0 === f ? n(a).removeProp(e) : a[e] = f, b[e] && (b.jsonpCallback = c.jsonpCallback, jc.push(e)), g && n.isFunction(f) && f(g[0]), g = f = void 0;
    }), "script") : void 0;
  }), n.parseHTML = function (a, b, c) {
    if (!a || "string" != typeof a) return null;"boolean" == typeof b && (c = b, b = !1), b = b || d;var e = x.exec(a),
        f = !c && [];return e ? [b.createElement(e[1])] : (e = ja([a], b, f), f && f.length && n(f).remove(), n.merge([], e.childNodes));
  };var lc = n.fn.load;n.fn.load = function (a, b, c) {
    if ("string" != typeof a && lc) return lc.apply(this, arguments);var d,
        e,
        f,
        g = this,
        h = a.indexOf(" ");return h > -1 && (d = n.trim(a.slice(h, a.length)), a = a.slice(0, h)), n.isFunction(b) ? (c = b, b = void 0) : b && "object" == typeof b && (e = "POST"), g.length > 0 && n.ajax({ url: a, type: e || "GET", dataType: "html", data: b }).done(function (a) {
      f = arguments, g.html(d ? n("<div>").append(n.parseHTML(a)).find(d) : a);
    }).always(c && function (a, b) {
      g.each(function () {
        c.apply(this, f || [a.responseText, b, a]);
      });
    }), this;
  }, n.each(["ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend"], function (a, b) {
    n.fn[b] = function (a) {
      return this.on(b, a);
    };
  }), n.expr.filters.animated = function (a) {
    return n.grep(n.timers, function (b) {
      return a === b.elem;
    }).length;
  };function mc(a) {
    return n.isWindow(a) ? a : 9 === a.nodeType ? a.defaultView || a.parentWindow : !1;
  }n.offset = { setOffset: function (a, b, c) {
      var d,
          e,
          f,
          g,
          h,
          i,
          j,
          k = n.css(a, "position"),
          l = n(a),
          m = {};"static" === k && (a.style.position = "relative"), h = l.offset(), f = n.css(a, "top"), i = n.css(a, "left"), j = ("absolute" === k || "fixed" === k) && n.inArray("auto", [f, i]) > -1, j ? (d = l.position(), g = d.top, e = d.left) : (g = parseFloat(f) || 0, e = parseFloat(i) || 0), n.isFunction(b) && (b = b.call(a, c, n.extend({}, h))), null != b.top && (m.top = b.top - h.top + g), null != b.left && (m.left = b.left - h.left + e), "using" in b ? b.using.call(a, m) : l.css(m);
    } }, n.fn.extend({ offset: function (a) {
      if (arguments.length) return void 0 === a ? this : this.each(function (b) {
        n.offset.setOffset(this, a, b);
      });var b,
          c,
          d = { top: 0, left: 0 },
          e = this[0],
          f = e && e.ownerDocument;if (f) return b = f.documentElement, n.contains(b, e) ? ("undefined" != typeof e.getBoundingClientRect && (d = e.getBoundingClientRect()), c = mc(f), { top: d.top + (c.pageYOffset || b.scrollTop) - (b.clientTop || 0), left: d.left + (c.pageXOffset || b.scrollLeft) - (b.clientLeft || 0) }) : d;
    }, position: function () {
      if (this[0]) {
        var a,
            b,
            c = { top: 0, left: 0 },
            d = this[0];return "fixed" === n.css(d, "position") ? b = d.getBoundingClientRect() : (a = this.offsetParent(), b = this.offset(), n.nodeName(a[0], "html") || (c = a.offset()), c.top += n.css(a[0], "borderTopWidth", !0), c.left += n.css(a[0], "borderLeftWidth", !0)), { top: b.top - c.top - n.css(d, "marginTop", !0), left: b.left - c.left - n.css(d, "marginLeft", !0) };
      }
    }, offsetParent: function () {
      return this.map(function () {
        var a = this.offsetParent;while (a && !n.nodeName(a, "html") && "static" === n.css(a, "position")) a = a.offsetParent;return a || Qa;
      });
    } }), n.each({ scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function (a, b) {
    var c = /Y/.test(b);n.fn[a] = function (d) {
      return Y(this, function (a, d, e) {
        var f = mc(a);return void 0 === e ? f ? b in f ? f[b] : f.document.documentElement[d] : a[d] : void (f ? f.scrollTo(c ? n(f).scrollLeft() : e, c ? e : n(f).scrollTop()) : a[d] = e);
      }, a, d, arguments.length, null);
    };
  }), n.each(["top", "left"], function (a, b) {
    n.cssHooks[b] = Ua(l.pixelPosition, function (a, c) {
      return c ? (c = Sa(a, b), Oa.test(c) ? n(a).position()[b] + "px" : c) : void 0;
    });
  }), n.each({ Height: "height", Width: "width" }, function (a, b) {
    n.each({
      padding: "inner" + a, content: b, "": "outer" + a }, function (c, d) {
      n.fn[d] = function (d, e) {
        var f = arguments.length && (c || "boolean" != typeof d),
            g = c || (d === !0 || e === !0 ? "margin" : "border");return Y(this, function (b, c, d) {
          var e;return n.isWindow(b) ? b.document.documentElement["client" + a] : 9 === b.nodeType ? (e = b.documentElement, Math.max(b.body["scroll" + a], e["scroll" + a], b.body["offset" + a], e["offset" + a], e["client" + a])) : void 0 === d ? n.css(b, c, g) : n.style(b, c, d, g);
        }, b, f ? d : void 0, f, null);
      };
    });
  }), n.fn.extend({ bind: function (a, b, c) {
      return this.on(a, null, b, c);
    }, unbind: function (a, b) {
      return this.off(a, null, b);
    }, delegate: function (a, b, c, d) {
      return this.on(b, a, c, d);
    }, undelegate: function (a, b, c) {
      return 1 === arguments.length ? this.off(a, "**") : this.off(b, a || "**", c);
    } }), n.fn.size = function () {
    return this.length;
  }, n.fn.andSelf = n.fn.addBack, "function" == typeof define && define.amd && define("jquery", [], function () {
    return n;
  });var nc = a.jQuery,
      oc = a.$;return n.noConflict = function (b) {
    return a.$ === n && (a.$ = oc), b && a.jQuery === n && (a.jQuery = nc), n;
  }, b || (a.jQuery = a.$ = n), n;
});
/*! Respond.js v1.4.2: min/max-width media query polyfill
 * Copyright 2014 Scott Jehl
 * Licensed under MIT
 * http://j.mp/respondjs */

!function (a) {
  "use strict";
  a.matchMedia = a.matchMedia || function (a) {
    var b,
        c = a.documentElement,
        d = c.firstElementChild || c.firstChild,
        e = a.createElement("body"),
        f = a.createElement("div");return f.id = "mq-test-1", f.style.cssText = "position:absolute;top:-100em", e.style.background = "none", e.appendChild(f), function (a) {
      return f.innerHTML = '&shy;<style media="' + a + '"> #mq-test-1 { width: 42px; }</style>', c.insertBefore(e, d), b = 42 === f.offsetWidth, c.removeChild(e), { matches: b, media: a };
    };
  }(a.document);
}(this), function (a) {
  "use strict";
  function b() {
    v(!0);
  }var c = {};a.respond = c, c.update = function () {};var d = [],
      e = function () {
    var b = !1;try {
      b = new a.XMLHttpRequest();
    } catch (c) {
      b = new a.ActiveXObject("Microsoft.XMLHTTP");
    }return function () {
      return b;
    };
  }(),
      f = function (a, b) {
    var c = e();c && (c.open("GET", a, !0), c.onreadystatechange = function () {
      4 !== c.readyState || 200 !== c.status && 304 !== c.status || b(c.responseText);
    }, 4 !== c.readyState && c.send(null));
  },
      g = function (a) {
    return a.replace(c.regex.minmaxwh, "").match(c.regex.other);
  };if (c.ajax = f, c.queue = d, c.unsupportedmq = g, c.regex = { media: /@media[^\{]+\{([^\{\}]*\{[^\}\{]*\})+/gi, keyframes: /@(?:\-(?:o|moz|webkit)\-)?keyframes[^\{]+\{(?:[^\{\}]*\{[^\}\{]*\})+[^\}]*\}/gi, comments: /\/\*[^*]*\*+([^/][^*]*\*+)*\//gi, urls: /(url\()['"]?([^\/\)'"][^:\)'"]+)['"]?(\))/g, findStyles: /@media *([^\{]+)\{([\S\s]+?)$/, only: /(only\s+)?([a-zA-Z]+)\s?/, minw: /\(\s*min\-width\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/, maxw: /\(\s*max\-width\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/, minmaxwh: /\(\s*m(in|ax)\-(height|width)\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/gi, other: /\([^\)]*\)/g }, c.mediaQueriesSupported = a.matchMedia && null !== a.matchMedia("only all") && a.matchMedia("only all").matches, !c.mediaQueriesSupported) {
    var h,
        i,
        j,
        k = a.document,
        l = k.documentElement,
        m = [],
        n = [],
        o = [],
        p = {},
        q = 30,
        r = k.getElementsByTagName("head")[0] || l,
        s = k.getElementsByTagName("base")[0],
        t = r.getElementsByTagName("link"),
        u = function () {
      var a,
          b = k.createElement("div"),
          c = k.body,
          d = l.style.fontSize,
          e = c && c.style.fontSize,
          f = !1;return b.style.cssText = "position:absolute;font-size:1em;width:1em", c || (c = f = k.createElement("body"), c.style.background = "none"), l.style.fontSize = "100%", c.style.fontSize = "100%", c.appendChild(b), f && l.insertBefore(c, l.firstChild), a = b.offsetWidth, f ? l.removeChild(c) : c.removeChild(b), l.style.fontSize = d, e && (c.style.fontSize = e), a = j = parseFloat(a);
    },
        v = function (b) {
      var c = "clientWidth",
          d = l[c],
          e = "CSS1Compat" === k.compatMode && d || k.body[c] || d,
          f = {},
          g = t[t.length - 1],
          p = new Date().getTime();if (b && h && q > p - h) return a.clearTimeout(i), i = a.setTimeout(v, q), void 0;h = p;for (var s in m) if (m.hasOwnProperty(s)) {
        var w = m[s],
            x = w.minw,
            y = w.maxw,
            z = null === x,
            A = null === y,
            B = "em";x && (x = parseFloat(x) * (x.indexOf(B) > -1 ? j || u() : 1)), y && (y = parseFloat(y) * (y.indexOf(B) > -1 ? j || u() : 1)), w.hasquery && (z && A || !(z || e >= x) || !(A || y >= e)) || (f[w.media] || (f[w.media] = []), f[w.media].push(n[w.rules]));
      }for (var C in o) o.hasOwnProperty(C) && o[C] && o[C].parentNode === r && r.removeChild(o[C]);o.length = 0;for (var D in f) if (f.hasOwnProperty(D)) {
        var E = k.createElement("style"),
            F = f[D].join("\n");E.type = "text/css", E.media = D, r.insertBefore(E, g.nextSibling), E.styleSheet ? E.styleSheet.cssText = F : E.appendChild(k.createTextNode(F)), o.push(E);
      }
    },
        w = function (a, b, d) {
      var e = a.replace(c.regex.comments, "").replace(c.regex.keyframes, "").match(c.regex.media),
          f = e && e.length || 0;b = b.substring(0, b.lastIndexOf("/"));var h = function (a) {
        return a.replace(c.regex.urls, "$1" + b + "$2$3");
      },
          i = !f && d;b.length && (b += "/"), i && (f = 1);for (var j = 0; f > j; j++) {
        var k, l, o, p;i ? (k = d, n.push(h(a))) : (k = e[j].match(c.regex.findStyles) && RegExp.$1, n.push(RegExp.$2 && h(RegExp.$2))), o = k.split(","), p = o.length;for (var q = 0; p > q; q++) l = o[q], g(l) || m.push({ media: l.split("(")[0].match(c.regex.only) && RegExp.$2 || "all", rules: n.length - 1, hasquery: l.indexOf("(") > -1, minw: l.match(c.regex.minw) && parseFloat(RegExp.$1) + (RegExp.$2 || ""), maxw: l.match(c.regex.maxw) && parseFloat(RegExp.$1) + (RegExp.$2 || "") });
      }v();
    },
        x = function () {
      if (d.length) {
        var b = d.shift();f(b.href, function (c) {
          w(c, b.href, b.media), p[b.href] = !0, a.setTimeout(function () {
            x();
          }, 0);
        });
      }
    },
        y = function () {
      for (var b = 0; b < t.length; b++) {
        var c = t[b],
            e = c.href,
            f = c.media,
            g = c.rel && "stylesheet" === c.rel.toLowerCase();e && g && !p[e] && (c.styleSheet && c.styleSheet.rawCssText ? (w(c.styleSheet.rawCssText, e, f), p[e] = !0) : (!/^([a-zA-Z:]*\/\/)/.test(e) && !s || e.replace(RegExp.$1, "").split("/")[0] === a.location.host) && ("//" === e.substring(0, 2) && (e = a.location.protocol + e), d.push({ href: e, media: f })));
      }x();
    };y(), c.update = y, c.getEmValue = u, a.addEventListener ? a.addEventListener("resize", b, !1) : a.attachEvent && a.attachEvent("onresize", b);
  }
}(this);
// jquery.daterangepicker.js
// author : Chunlong Liu
// license : MIT

(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery', 'moment'], factory);
  } else if (typeof exports === 'object' && typeof module !== 'undefined') {
    // CommonJS. Register as a module
    module.exports = factory(require('jquery'), require('moment'));
  } else {
    // Browser globals
    factory(jQuery, moment);
  }
})(function ($, moment) {
  'use strict';

  $.dateRangePickerLanguages = {
    "default": //default language: English
    {
      "selected": "Selected:",
      "day": "Day",
      "days": "Days",
      "apply": "Close",
      "week-1": "m",
      "week-2": "t",
      "week-3": "w",
      "week-4": "t",
      "week-5": "f",
      "week-6": "s",
      "week-7": "s",
      "week-number": "W",
      "month-name": ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"],
      "shortcuts": "Shortcuts",
      "custom-values": "Custom Values",
      "past": "Past",
      "following": "Following",
      "previous": "Previous",
      "prev-week": "Week",
      "prev-month": "Month",
      "prev-year": "Year",
      "next": "Next",
      "next-week": "Week",
      "next-month": "Month",
      "next-year": "Year",
      "less-than": "Date range should not be more than %d days",
      "more-than": "Date range should not be less than %d days",
      "default-more": "Please select a date range longer than %d days",
      "default-single": "Please select a date",
      "default-less": "Please select a date range less than %d days",
      "default-range": "Please select a date range between %d and %d days",
      "default-default": "Please select a date range",
      "time": "Time",
      "hour": "Hour",
      "minute": "Minute"
    },
    "id": {
      "selected": "Terpilih:",
      "day": "Hari",
      "days": "Hari",
      "apply": "Tutup",
      "week-1": "sen",
      "week-2": "sel",
      "week-3": "rab",
      "week-4": "kam",
      "week-5": "jum",
      "week-6": "sab",
      "week-7": "min",
      "week-number": "W",
      "month-name": ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"],
      "shortcuts": "Pintas",
      "custom-values": "Nilai yang ditentukan",
      "past": "Yang Lalu",
      "following": "Mengikuti",
      "previous": "Sebelumnya",
      "prev-week": "Minggu",
      "prev-month": "Bulan",
      "prev-year": "Tahun",
      "next": "Selanjutnya",
      "next-week": "Minggu",
      "next-month": "Bulan",
      "next-year": "Tahun",
      "less-than": "Tanggal harus lebih dari %d hari",
      "more-than": "Tanggal harus kurang dari %d hari",
      "default-more": "Jarak tanggal harus lebih lama dari %d hari",
      "default-single": "Silakan pilih tanggal",
      "default-less": "Jarak rentang tanggal tidak boleh lebih lama dari %d hari",
      "default-range": "Rentang tanggal harus antara %d dan %d hari",
      "default-default": "Silakan pilih rentang tanggal",
      "time": "Waktu",
      "hour": "Jam",
      "minute": "Menit"
    },
    "az": {
      "selected": "Seçildi:",
      "day": " gün",
      "days": " gün",
      "apply": "tətbiq",
      "week-1": "1",
      "week-2": "2",
      "week-3": "3",
      "week-4": "4",
      "week-5": "5",
      "week-6": "6",
      "week-7": "7",
      "month-name": ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"],
      "shortcuts": "Qısayollar",
      "past": "Keçmiş",
      "following": "Növbəti",
      "previous": "&nbsp;&nbsp;&nbsp;",
      "prev-week": "Öncəki həftə",
      "prev-month": "Öncəki ay",
      "prev-year": "Öncəki il",
      "next": "&nbsp;&nbsp;&nbsp;",
      "next-week": "Növbəti həftə",
      "next-month": "Növbəti ay",
      "next-year": "Növbəti il",
      "less-than": "Tarix aralığı %d gündən çox olmamalıdır",
      "more-than": "Tarix aralığı %d gündən az olmamalıdır",
      "default-more": "%d gündən çox bir tarix seçin",
      "default-single": "Tarix seçin",
      "default-less": "%d gündən az bir tarix seçin",
      "default-range": "%d və %d gün aralığında tarixlər seçin",
      "default-default": "Tarix aralığı seçin"
    },
    "bg": {
      "selected": "Избрано:",
      "day": "Ден",
      "days": "Дни",
      "apply": "Затвори",
      "week-1": "пн",
      "week-2": "вт",
      "week-3": "ср",
      "week-4": "чт",
      "week-5": "пт",
      "week-6": "сб",
      "week-7": "нд",
      "week-number": "С",
      "month-name": ["януари", "февруари", "март", "април", "май", "юни", "юли", "август", "септември", "октомври", "ноември", "декември"],
      "shortcuts": "Преки пътища",
      "custom-values": "Персонализирани стойности",
      "past": "Минал",
      "following": "Следващ",
      "previous": "Предишен",
      "prev-week": "Седмица",
      "prev-month": "Месец",
      "prev-year": "Година",
      "next": "Следващ",
      "next-week": "Седмица",
      "next-month": "Месец",
      "next-year": "Година",
      "less-than": "Периодът от време не трябва да е повече от %d дни",
      "more-than": "Периодът от време не трябва да е по-малко от %d дни",
      "default-more": "Моля изберете период по-дълъг от %d дни",
      "default-single": "Моля изберете дата",
      "default-less": "Моля изберете период по-къс от %d дни",
      "default-range": "Моля изберете период между %d и %d дни",
      "default-default": "Моля изберете период",
      "time": "Време",
      "hour": "Час",
      "minute": "Минута"
    },
    "cn": //simplified chinese
    {
      "selected": "已选择:",
      "day": "天",
      "days": "天",
      "apply": "确定",
      "week-1": "一",
      "week-2": "二",
      "week-3": "三",
      "week-4": "四",
      "week-5": "五",
      "week-6": "六",
      "week-7": "日",
      "week-number": "周",
      "month-name": ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
      "shortcuts": "快捷选择",
      "past": "过去",
      "following": "将来",
      "previous": "&nbsp;&nbsp;&nbsp;",
      "prev-week": "上周",
      "prev-month": "上个月",
      "prev-year": "去年",
      "next": "&nbsp;&nbsp;&nbsp;",
      "next-week": "下周",
      "next-month": "下个月",
      "next-year": "明年",
      "less-than": "所选日期范围不能大于%d天",
      "more-than": "所选日期范围不能小于%d天",
      "default-more": "请选择大于%d天的日期范围",
      "default-less": "请选择小于%d天的日期范围",
      "default-range": "请选择%d天到%d天的日期范围",
      "default-single": "请选择一个日期",
      "default-default": "请选择一个日期范围",
      "time": "时间",
      "hour": "小时",
      "minute": "分钟"
    },
    "cz": {
      "selected": "Vybráno:",
      "day": "Den",
      "days": "Dny",
      "apply": "Zavřít",
      "week-1": "po",
      "week-2": "út",
      "week-3": "st",
      "week-4": "čt",
      "week-5": "pá",
      "week-6": "so",
      "week-7": "ne",
      "month-name": ["leden", "únor", "březen", "duben", "květen", "červen", "červenec", "srpen", "září", "říjen", "listopad", "prosinec"],
      "shortcuts": "Zkratky",
      "past": "po",
      "following": "následující",
      "previous": "předchozí",
      "prev-week": "týden",
      "prev-month": "měsíc",
      "prev-year": "rok",
      "next": "další",
      "next-week": "týden",
      "next-month": "měsíc",
      "next-year": "rok",
      "less-than": "Rozsah data by neměl být větší než %d dnů",
      "more-than": "Rozsah data by neměl být menší než %d dnů",
      "default-more": "Prosím zvolte rozsah data větší než %d dnů",
      "default-single": "Prosím zvolte datum",
      "default-less": "Prosím zvolte rozsah data menší než %d dnů",
      "default-range": "Prosím zvolte rozsah data mezi %d a %d dny",
      "default-default": "Prosím zvolte rozsah data"
    },
    "de": {
      "selected": "Auswahl:",
      "day": "Tag",
      "days": "Tage",
      "apply": "Schließen",
      "week-1": "mo",
      "week-2": "di",
      "week-3": "mi",
      "week-4": "do",
      "week-5": "fr",
      "week-6": "sa",
      "week-7": "so",
      "month-name": ["januar", "februar", "märz", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "dezember"],
      "shortcuts": "Schnellwahl",
      "past": "Vorherige",
      "following": "Folgende",
      "previous": "Vorherige",
      "prev-week": "Woche",
      "prev-month": "Monat",
      "prev-year": "Jahr",
      "next": "Nächste",
      "next-week": "Woche",
      "next-month": "Monat",
      "next-year": "Jahr",
      "less-than": "Datumsbereich darf nicht größer sein als %d Tage",
      "more-than": "Datumsbereich darf nicht kleiner sein als %d Tage",
      "default-more": "Bitte mindestens %d Tage auswählen",
      "default-single": "Bitte ein Datum auswählen",
      "default-less": "Bitte weniger als %d Tage auswählen",
      "default-range": "Bitte einen Datumsbereich zwischen %d und %d Tagen auswählen",
      "default-default": "Bitte ein Start- und Enddatum auswählen",
      "Time": "Zeit",
      "hour": "Stunde",
      "minute": "Minute"
    },
    "es": {
      "selected": "Seleccionado:",
      "day": "Día",
      "days": "Días",
      "apply": "Cerrar",
      "week-1": "lu",
      "week-2": "ma",
      "week-3": "mi",
      "week-4": "ju",
      "week-5": "vi",
      "week-6": "sa",
      "week-7": "do",
      "month-name": ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
      "shortcuts": "Accesos directos",
      "past": "Pasado",
      "following": "Siguiente",
      "previous": "Anterior",
      "prev-week": "Semana",
      "prev-month": "Mes",
      "prev-year": "Año",
      "next": "Siguiente",
      "next-week": "Semana",
      "next-month": "Mes",
      "next-year": "Año",
      "less-than": "El rango no debería ser mayor de %d días",
      "more-than": "El rango no debería ser menor de %d días",
      "default-more": "Por favor selecciona un rango mayor a %d días",
      "default-single": "Por favor selecciona un día",
      "default-less": "Por favor selecciona un rango menor a %d días",
      "default-range": "Por favor selecciona un rango entre %d y %d días",
      "default-default": "Por favor selecciona un rango de fechas."
    },
    "fr": {
      "selected": "Sélection:",
      "day": "Jour",
      "days": "Jours",
      "apply": "Fermer",
      "week-1": "lu",
      "week-2": "ma",
      "week-3": "me",
      "week-4": "je",
      "week-5": "ve",
      "week-6": "sa",
      "week-7": "di",
      "month-name": ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
      "shortcuts": "Raccourcis",
      "past": "Passé",
      "following": "Suivant",
      "previous": "Précédent",
      "prev-week": "Semaine",
      "prev-month": "Mois",
      "prev-year": "Année",
      "next": "Suivant",
      "next-week": "Semaine",
      "next-month": "Mois",
      "next-year": "Année",
      "less-than": "L'intervalle ne doit pas être supérieure à %d jours",
      "more-than": "L'intervalle ne doit pas être inférieure à %d jours",
      "default-more": "Merci de choisir une intervalle supérieure à %d jours",
      "default-single": "Merci de choisir une date",
      "default-less": "Merci de choisir une intervalle inférieure %d jours",
      "default-range": "Merci de choisir une intervalle comprise entre %d et %d jours",
      "default-default": "Merci de choisir une date"
    },
    "hu": {
      "selected": "Kiválasztva:",
      "day": "Nap",
      "days": "Nap",
      "apply": "Ok",
      "week-1": "h",
      "week-2": "k",
      "week-3": "sz",
      "week-4": "cs",
      "week-5": "p",
      "week-6": "sz",
      "week-7": "v",
      "month-name": ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"],
      "shortcuts": "Gyorsválasztó",
      "past": "Múlt",
      "following": "Következő",
      "previous": "Előző",
      "prev-week": "Hét",
      "prev-month": "Hónap",
      "prev-year": "Év",
      "next": "Következő",
      "next-week": "Hét",
      "next-month": "Hónap",
      "next-year": "Év",
      "less-than": "A kiválasztás nem lehet több %d napnál",
      "more-than": "A kiválasztás nem lehet több %d napnál",
      "default-more": "Válassz ki egy időszakot ami hosszabb mint %d nap",
      "default-single": "Válassz egy napot",
      "default-less": "Válassz ki egy időszakot ami rövidebb mint %d nap",
      "default-range": "Válassz ki egy %d - %d nap hosszú időszakot",
      "default-default": "Válassz ki egy időszakot"
    },
    "it": {
      "selected": "Selezionati:",
      "day": "Giorno",
      "days": "Giorni",
      "apply": "Chiudi",
      "week-1": "lu",
      "week-2": "ma",
      "week-3": "me",
      "week-4": "gi",
      "week-5": "ve",
      "week-6": "sa",
      "week-7": "do",
      "month-name": ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"],
      "shortcuts": "Scorciatoie",
      "past": "Scorso",
      "following": "Successivo",
      "previous": "Precedente",
      "prev-week": "Settimana",
      "prev-month": "Mese",
      "prev-year": "Anno",
      "next": "Prossimo",
      "next-week": "Settimana",
      "next-month": "Mese",
      "next-year": "Anno",
      "less-than": "L'intervallo non dev'essere maggiore di %d giorni",
      "more-than": "L'intervallo non dev'essere minore di %d giorni",
      "default-more": "Seleziona un intervallo maggiore di %d giorni",
      "default-single": "Seleziona una data",
      "default-less": "Seleziona un intervallo minore di %d giorni",
      "default-range": "Seleziona un intervallo compreso tra i %d e i %d giorni",
      "default-default": "Seleziona un intervallo di date"
    },
    "ko": {
      "selected": "기간:",
      "day": "일",
      "days": "일간",
      "apply": "닫기",
      "week-1": "월",
      "week-2": "화",
      "week-3": "수",
      "week-4": "목",
      "week-5": "금",
      "week-6": "토",
      "week-7": "일",
      "week-number": "주",
      "month-name": ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
      "shortcuts": "단축키들",
      "past": "지난(오늘기준)",
      "following": "이후(오늘기준)",
      "previous": "이전",
      "prev-week": "1주",
      "prev-month": "1달",
      "prev-year": "1년",
      "next": "다음",
      "next-week": "1주",
      "next-month": "1달",
      "next-year": "1년",
      "less-than": "날짜 범위는 %d 일보다 많을 수 없습니다",
      "more-than": "날짜 범위는 %d 일보다 작을 수 없습니다",
      "default-more": "날짜 범위를 %d 일보다 길게 선택해 주세요",
      "default-single": "날짜를 선택해 주세요",
      "default-less": "%d 일보다 작은 날짜를 선택해 주세요",
      "default-range": "%d와 %d 일 사이의 날짜 범위를 선택해 주세요",
      "default-default": "날짜 범위를 선택해 주세요",
      "time": "시각",
      "hour": "시",
      "minute": "분"
    },
    "no": {
      "selected": "Valgt:",
      "day": "Dag",
      "days": "Dager",
      "apply": "Lukk",
      "week-1": "ma",
      "week-2": "ti",
      "week-3": "on",
      "week-4": "to",
      "week-5": "fr",
      "week-6": "lø",
      "week-7": "sø",
      "month-name": ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"],
      "shortcuts": "Snarveier",
      "custom-values": "Egendefinerte Verdier",
      "past": "Over", // Not quite sure about the context of this one
      "following": "Følger",
      "previous": "Forrige",
      "prev-week": "Uke",
      "prev-month": "Måned",
      "prev-year": "År",
      "next": "Neste",
      "next-week": "Uke",
      "next-month": "Måned",
      "next-year": "År",
      "less-than": "Datoperioden skal ikkje være lengre enn %d dager",
      "more-than": "Datoperioden skal ikkje være kortere enn %d dager",
      "default-more": "Vennligst velg ein datoperiode lengre enn %d dager",
      "default-single": "Vennligst velg ein dato",
      "default-less": "Vennligst velg ein datoperiode mindre enn %d dager",
      "default-range": "Vennligst velg ein datoperiode mellom %d og %d dager",
      "default-default": "Vennligst velg ein datoperiode",
      "time": "Tid",
      "hour": "Time",
      "minute": "Minutter"
    },
    "nl": {
      "selected": "Geselecteerd:",
      "day": "Dag",
      "days": "Dagen",
      "apply": "Ok",
      "week-1": "ma",
      "week-2": "di",
      "week-3": "wo",
      "week-4": "do",
      "week-5": "vr",
      "week-6": "za",
      "week-7": "zo",
      "month-name": ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"],
      "shortcuts": "Snelkoppelingen",
      "custom-values": "Aangepaste waarden",
      "past": "Verleden",
      "following": "Komend",
      "previous": "Vorige",
      "prev-week": "Week",
      "prev-month": "Maand",
      "prev-year": "Jaar",
      "next": "Volgende",
      "next-week": "Week",
      "next-month": "Maand",
      "next-year": "Jaar",
      "less-than": "Interval moet langer dan %d dagen zijn",
      "more-than": "Interval mag niet minder dan %d dagen zijn",
      "default-more": "Selecteer een interval langer dan %dagen",
      "default-single": "Selecteer een datum",
      "default-less": "Selecteer een interval minder dan %d dagen",
      "default-range": "Selecteer een interval tussen %d en %d dagen",
      "default-default": "Selecteer een interval",
      "time": "Tijd",
      "hour": "Uur",
      "minute": "Minuut"
    },
    "ru": {
      "selected": "Выбрано:",
      "day": "День",
      "days": "Дней",
      "apply": "Применить",
      "week-1": "пн",
      "week-2": "вт",
      "week-3": "ср",
      "week-4": "чт",
      "week-5": "пт",
      "week-6": "сб",
      "week-7": "вс",
      "month-name": ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"],
      "shortcuts": "Быстрый выбор",
      "custom-values": "Пользовательские значения",
      "past": "Прошедшие",
      "following": "Следующие",
      "previous": "&nbsp;&nbsp;&nbsp;",
      "prev-week": "Неделя",
      "prev-month": "Месяц",
      "prev-year": "Год",
      "next": "&nbsp;&nbsp;&nbsp;",
      "next-week": "Неделя",
      "next-month": "Месяц",
      "next-year": "Год",
      "less-than": "Диапазон не может быть больше %d дней",
      "more-than": "Диапазон не может быть меньше %d дней",
      "default-more": "Пожалуйста выберите диапазон больше %d дней",
      "default-single": "Пожалуйста выберите дату",
      "default-less": "Пожалуйста выберите диапазон меньше %d дней",
      "default-range": "Пожалуйста выберите диапазон между %d и %d днями",
      "default-default": "Пожалуйста выберите диапазон",
      "time": "Время",
      "hour": "Часы",
      "minute": "Минуты"
    },
    "pl": {
      "selected": "Wybrany:",
      "day": "Dzień",
      "days": "Dni",
      "apply": "Zamknij",
      "week-1": "pon",
      "week-2": "wt",
      "week-3": "śr",
      "week-4": "czw",
      "week-5": "pt",
      "week-6": "so",
      "week-7": "nd",
      "month-name": ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"],
      "shortcuts": "Skróty",
      "custom-values": "Niestandardowe wartości",
      "past": "Przeszłe",
      "following": "Następne",
      "previous": "Poprzednie",
      "prev-week": "tydzień",
      "prev-month": "miesiąc",
      "prev-year": "rok",
      "next": "Następny",
      "next-week": "tydzień",
      "next-month": "miesiąc",
      "next-year": "rok",
      "less-than": "Okres nie powinien być dłuższy niż %d dni",
      "more-than": "Okres nie powinien być krótszy niż  %d ni",
      "default-more": "Wybierz okres dłuższy niż %d dni",
      "default-single": "Wybierz datę",
      "default-less": "Wybierz okres krótszy niż %d dni",
      "default-range": "Wybierz okres trwający od %d do %d dni",
      "default-default": "Wybierz okres",
      "time": "Czas",
      "hour": "Godzina",
      "minute": "Minuta"
    },
    "se": {
      "selected": "Vald:",
      "day": "dag",
      "days": "dagar",
      "apply": "godkänn",
      "week-1": "ma",
      "week-2": "ti",
      "week-3": "on",
      "week-4": "to",
      "week-5": "fr",
      "week-6": "lö",
      "week-7": "sö",
      "month-name": ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"],
      "shortcuts": "genvägar",
      "custom-values": "Anpassade värden",
      "past": "över",
      "following": "följande",
      "previous": "förra",
      "prev-week": "vecka",
      "prev-month": "månad",
      "prev-year": "år",
      "next": "nästa",
      "next-week": "vecka",
      "next-month": "måned",
      "next-year": "år",
      "less-than": "Datumintervall bör inte vara mindre än %d dagar",
      "more-than": "Datumintervall bör inte vara mer än %d dagar",
      "default-more": "Välj ett datumintervall längre än %d dagar",
      "default-single": "Välj ett datum",
      "default-less": "Välj ett datumintervall mindre än %d dagar",
      "default-range": "Välj ett datumintervall mellan %d och %d dagar",
      "default-default": "Välj ett datumintervall",
      "time": "tid",
      "hour": "timme",
      "minute": "minut"
    },
    "pt": //Portuguese (European)
    {
      "selected": "Selecionado:",
      "day": "Dia",
      "days": "Dias",
      "apply": "Fechar",
      "week-1": "seg",
      "week-2": "ter",
      "week-3": "qua",
      "week-4": "qui",
      "week-5": "sex",
      "week-6": "sab",
      "week-7": "dom",
      "week-number": "N",
      "month-name": ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
      "shortcuts": "Atalhos",
      "custom-values": "Valores Personalizados",
      "past": "Passado",
      "following": "Seguinte",
      "previous": "Anterior",
      "prev-week": "Semana",
      "prev-month": "Mês",
      "prev-year": "Ano",
      "next": "Próximo",
      "next-week": "Próxima Semana",
      "next-month": "Próximo Mês",
      "next-year": "Próximo Ano",
      "less-than": "O período selecionado não deve ser maior que %d dias",
      "more-than": "O período selecionado não deve ser menor que %d dias",
      "default-more": "Selecione um período superior a %d dias",
      "default-single": "Selecione uma data",
      "default-less": "Selecione um período inferior a %d dias",
      "default-range": "Selecione um período de %d a %d dias",
      "default-default": "Selecione um período",
      "time": "Tempo",
      "hour": "Hora",
      "minute": "Minuto"
    },
    "tc": // traditional chinese
    {
      "selected": "已選擇:",
      "day": "天",
      "days": "天",
      "apply": "確定",
      "week-1": "一",
      "week-2": "二",
      "week-3": "三",
      "week-4": "四",
      "week-5": "五",
      "week-6": "六",
      "week-7": "日",
      "week-number": "周",
      "month-name": ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
      "shortcuts": "快速選擇",
      "past": "過去",
      "following": "將來",
      "previous": "&nbsp;&nbsp;&nbsp;",
      "prev-week": "上週",
      "prev-month": "上個月",
      "prev-year": "去年",
      "next": "&nbsp;&nbsp;&nbsp;",
      "next-week": "下周",
      "next-month": "下個月",
      "next-year": "明年",
      "less-than": "所選日期範圍不能大於%d天",
      "more-than": "所選日期範圍不能小於%d天",
      "default-more": "請選擇大於%d天的日期範圍",
      "default-less": "請選擇小於%d天的日期範圍",
      "default-range": "請選擇%d天到%d天的日期範圍",
      "default-single": "請選擇一個日期",
      "default-default": "請選擇一個日期範圍",
      "time": "日期",
      "hour": "小時",
      "minute": "分鐘"
    },
    "ja": {
      "selected": "選択しました:",
      "day": "日",
      "days": "日々",
      "apply": "閉じる",
      "week-1": "月",
      "week-2": "火",
      "week-3": "水",
      "week-4": "木",
      "week-5": "金",
      "week-6": "土",
      "week-7": "日",
      "month-name": ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
      "shortcuts": "クイック選択",
      "past": "過去",
      "following": "将来",
      "previous": "&nbsp;&nbsp;&nbsp;",
      "prev-week": "先週、",
      "prev-month": "先月",
      "prev-year": "昨年",
      "next": "&nbsp;&nbsp;&nbsp;",
      "next-week": "来週",
      "next-month": "来月",
      "next-year": "来年",
      "less-than": "日付の範囲は ％d 日以上にすべきではありません",
      "more-than": "日付の範囲は ％d 日を下回ってはいけません",
      "default-more": "％d 日よりも長い期間を選択してください",
      "default-less": "％d 日未満の期間を選択してください",
      "default-range": "％d と％ d日の間の日付範囲を選択してください",
      "default-single": "日付を選択してください",
      "default-default": "日付範囲を選択してください",
      "time": "時間",
      "hour": "時間",
      "minute": "分"
    },
    "da": {
      "selected": "Valgt:",
      "day": "Dag",
      "days": "Dage",
      "apply": "Luk",
      "week-1": "ma",
      "week-2": "ti",
      "week-3": "on",
      "week-4": "to",
      "week-5": "fr",
      "week-6": "lö",
      "week-7": "sö",
      "month-name": ["januar", "februar", "marts", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"],
      "shortcuts": "genveje",
      "custom-values": "Brugerdefinerede værdier",
      "past": "Forbi",
      "following": "Følgende",
      "previous": "Forrige",
      "prev-week": "uge",
      "prev-month": "månad",
      "prev-year": "år",
      "next": "Næste",
      "next-week": "Næste uge",
      "next-month": "Næste måned",
      "next-year": "Næste år",
      "less-than": "Dato interval bør ikke være med end %d dage",
      "more-than": "Dato interval bør ikke være mindre end %d dage",
      "default-more": "Vælg datointerval længere end %d dage",
      "default-single": "Vælg dato",
      "default-less": "Vælg datointerval mindre end %d dage",
      "default-range": "Vælg datointerval mellem %d og %d dage",
      "default-default": "Vælg datointerval",
      "time": "tid",
      "hour": "time",
      "minute": "minut"
    },
    "fi": // Finnish
    {
      "selected": "Valittu:",
      "day": "Päivä",
      "days": "Päivää",
      "apply": "Sulje",
      "week-1": "ma",
      "week-2": "ti",
      "week-3": "ke",
      "week-4": "to",
      "week-5": "pe",
      "week-6": "la",
      "week-7": "su",
      "week-number": "V",
      "month-name": ["tammikuu", "helmikuu", "maaliskuu", "huhtikuu", "toukokuu", "kesäkuu", "heinäkuu", "elokuu", "syyskuu", "lokakuu", "marraskuu", "joulukuu"],
      "shortcuts": "Pikavalinnat",
      "custom-values": "Mukautetut Arvot",
      "past": "Menneet",
      "following": "Tulevat",
      "previous": "Edellinen",
      "prev-week": "Viikko",
      "prev-month": "Kuukausi",
      "prev-year": "Vuosi",
      "next": "Seuraava",
      "next-week": "Viikko",
      "next-month": "Kuukausi",
      "next-year": "Vuosi",
      "less-than": "Aikajakson tulisi olla vähemmän kuin %d päivää",
      "more-than": "Aikajakson ei tulisi olla vähempää kuin %d päivää",
      "default-more": "Valitse pidempi aikajakso kuin %d päivää",
      "default-single": "Valitse päivä",
      "default-less": "Valitse lyhyempi aikajakso kuin %d päivää",
      "default-range": "Valitse aikajakso %d ja %d päivän väliltä",
      "default-default": "Valitse aikajakso",
      "time": "Aika",
      "hour": "Tunti",
      "minute": "Minuutti"
    },
    "cat": // Catala
    {
      "selected": "Seleccionats:",
      "day": "Dia",
      "days": "Dies",
      "apply": "Tanca",
      "week-1": "Dl",
      "week-2": "Dm",
      "week-3": "Dc",
      "week-4": "Dj",
      "week-5": "Dv",
      "week-6": "Ds",
      "week-7": "Dg",
      "week-number": "S",
      "month-name": ["gener", "febrer", "març", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"],
      "shortcuts": "Dreçeres",
      "custom-values": "Valors personalitzats",
      "past": "Passat",
      "following": "Futur",
      "previous": "Anterior",
      "prev-week": "Setmana",
      "prev-month": "Mes",
      "prev-year": "Any",
      "next": "Següent",
      "next-week": "Setmana",
      "next-month": "Mes",
      "next-year": "Any",
      "less-than": "El període no hauria de ser de més de %d dies",
      "more-than": "El període no hauria de ser de menys de %d dies",
      "default-more": "Perfavor selecciona un període més gran de %d dies",
      "default-single": "Perfavor selecciona una data",
      "default-less": "Perfavor selecciona un període de menys de %d dies",
      "default-range": "Perfavor selecciona un període d'entre %d i %d dies",
      "default-default": "Perfavor selecciona un període",
      "time": "Temps",
      "hour": "Hora",
      "minute": "Minut"
    }
  };

  $.fn.dateRangePicker = function (opt) {
    if (!opt) opt = {};
    opt = $.extend(true, {
      autoClose: false,
      format: 'YYYY-MM-DD',
      separator: ' to ',
      language: 'auto',
      startOfWeek: 'sunday', // or monday
      getValue: function () {
        return $(this).val();
      },
      setValue: function (s) {
        if (!$(this).attr('readonly') && !$(this).is(':disabled') && s != $(this).val()) {
          $(this).val(s);
        }
      },
      startDate: false,
      endDate: false,
      time: {
        enabled: false
      },
      minDays: 0,
      maxDays: 0,
      showShortcuts: false,
      shortcuts: {
        //'prev-days': [1,3,5,7],
        // 'next-days': [3,5,7],
        //'prev' : ['week','month','year'],
        // 'next' : ['week','month','year']
      },
      customShortcuts: [],
      inline: false,
      container: 'body',
      alwaysOpen: false,
      singleDate: false,
      lookBehind: false,
      batchMode: false,
      duration: 200,
      stickyMonths: false,
      dayDivAttrs: [],
      dayTdAttrs: [],
      selectForward: false,
      selectBackward: false,
      applyBtnClass: '',
      singleMonth: 'auto',
      hoveringTooltip: function (days, startTime, hoveringTime) {
        return days > 1 ? days + ' ' + translate('days') : '';
      },
      showTopbar: true,
      swapTime: false,
      showWeekNumbers: false,
      getWeekNumber: function (date) //date will be the first day of a week
      {
        return moment(date).format('w');
      },
      customOpenAnimation: null,
      customCloseAnimation: null,
      customArrowPrevSymbol: null,
      customArrowNextSymbol: null
    }, opt);

    opt.start = false;
    opt.end = false;

    opt.startWeek = false;

    //detect a touch device
    opt.isTouchDevice = 'ontouchstart' in window || navigator.msMaxTouchPoints;

    //if it is a touch device, hide hovering tooltip
    if (opt.isTouchDevice) opt.hoveringTooltip = false;

    //show one month on mobile devices
    if (opt.singleMonth == 'auto') opt.singleMonth = $(window).width() < 480;
    if (opt.singleMonth) opt.stickyMonths = false;

    if (!opt.showTopbar) opt.autoClose = false;

    if (opt.startDate && typeof opt.startDate == 'string') opt.startDate = moment(opt.startDate, opt.format).toDate();
    if (opt.endDate && typeof opt.endDate == 'string') opt.endDate = moment(opt.endDate, opt.format).toDate();

    var languages = getLanguages();
    var box;
    var initiated = false;
    var self = this;
    var selfDom = $(self).get(0);
    var domChangeTimer;

    $(this).unbind('.datepicker').bind('click.datepicker', function (evt) {
      var isOpen = box.is(':visible');
      if (!isOpen) open(opt.duration);
    }).bind('change.datepicker', function (evt) {
      checkAndSetDefaultValue();
    }).bind('keyup.datepicker', function () {
      try {
        clearTimeout(domChangeTimer);
      } catch (e) {}
      domChangeTimer = setTimeout(function () {
        checkAndSetDefaultValue();
      }, 2000);
    });

    init_datepicker.call(this);

    if (opt.alwaysOpen) {
      open(0);
    }

    // expose some api
    $(this).data('dateRangePicker', {
      setStart: function (d1) {
        if (typeof d1 == 'string') {
          d1 = moment(d1, opt.format).toDate();
        }

        opt.end = false;
        setSingleDate(d1);

        return this;
      },
      setEnd: function (d2, silent) {
        var start = new Date();
        start.setTime(opt.start);
        if (typeof d2 == 'string') {
          d2 = moment(d2, opt.format).toDate();
        }
        setDateRange(start, d2, silent);
        return this;
      },
      setDateRange: function (d1, d2, silent) {
        if (typeof d1 == 'string' && typeof d2 == 'string') {
          d1 = moment(d1, opt.format).toDate();
          d2 = moment(d2, opt.format).toDate();
        }
        setDateRange(d1, d2, silent);
      },
      clear: clearSelection,
      close: closeDatePicker,
      open: open,
      redraw: redrawDatePicker,
      getDatePicker: getDatePicker,
      resetMonthsView: resetMonthsView,
      destroy: function () {
        $(self).unbind('.datepicker');
        $(self).data('dateRangePicker', '');
        $(self).data('date-picker-opened', null);
        box.remove();
        $(window).unbind('resize.datepicker', calcPosition);
        $(document).unbind('click.datepicker', closeDatePicker);
      }
    });

    $(window).bind('resize.datepicker', calcPosition);

    return this;

    function IsOwnDatePickerClicked(evt, selfObj) {
      return selfObj.contains(evt.target) || evt.target == selfObj || selfObj.childNodes != undefined && $.inArray(evt.target, selfObj.childNodes) >= 0;
    }

    function init_datepicker() {
      var self = this;

      if ($(this).data('date-picker-opened')) {
        closeDatePicker();
        return;
      }
      $(this).data('date-picker-opened', true);

      box = createDom().hide();
      box.append('<div class="date-range-length-tip"></div>');

      $(opt.container).append(box);

      if (!opt.inline) {
        calcPosition();
      } else {
        box.addClass('inline-wrapper');
      }

      if (opt.alwaysOpen) {
        box.find('.apply-btn').hide();
      }

      var defaultTime = getDefaultTime();
      resetMonthsView(defaultTime);

      if (opt.time.enabled) {
        if (opt.startDate && opt.endDate || opt.start && opt.end) {
          showTime(moment(opt.start || opt.startDate).toDate(), 'time1');
          showTime(moment(opt.end || opt.endDate).toDate(), 'time2');
        } else {
          var defaultEndTime = opt.defaultEndTime ? opt.defaultEndTime : defaultTime;
          showTime(defaultTime, 'time1');
          showTime(defaultEndTime, 'time2');
        }
      }

      //showSelectedInfo();


      var defaultTopText = '';
      if (opt.singleDate) defaultTopText = translate('default-single');else if (opt.minDays && opt.maxDays) defaultTopText = translate('default-range');else if (opt.minDays) defaultTopText = translate('default-more');else if (opt.maxDays) defaultTopText = translate('default-less');else defaultTopText = translate('default-default');

      box.find('.default-top').html(defaultTopText.replace(/\%d/, opt.minDays).replace(/\%d/, opt.maxDays));
      if (opt.singleMonth) {
        box.addClass('single-month');
      } else {
        box.addClass('two-months');
      }

      setTimeout(function () {
        updateCalendarWidth();
        initiated = true;
      }, 0);

      box.click(function (evt) {
        evt.stopPropagation();
      });

      //if user click other place of the webpage, close date range picker window
      $(document).bind('click.datepicker', function (evt) {
        if (!IsOwnDatePickerClicked(evt, self[0])) {
          if (box.is(':visible')) closeDatePicker();
        }
      });

      box.find('.next').click(function () {
        if (!opt.stickyMonths) {
          gotoNextMonth(this);
        } else {
          gotoNextMonth_stickily(this);
        }
      });

      function gotoNextMonth(self) {
        var isMonth2 = $(self).parents('table').hasClass('month2');
        var month = isMonth2 ? opt.month2 : opt.month1;
        month = nextMonth(month);
        if (!opt.singleMonth && !opt.singleDate && !isMonth2 && compare_month(month, opt.month2) >= 0 || isMonthOutOfBounds(month)) return;
        showMonth(month, isMonth2 ? 'month2' : 'month1');
        showGap();
        showDaysBorders();
      }

      function gotoNextMonth_stickily(self) {
        var nextMonth1 = nextMonth(opt.month1);
        var nextMonth2 = nextMonth(opt.month2);
        if (isMonthOutOfBounds(nextMonth2)) return;
        if (!opt.singleDate && compare_month(nextMonth1, nextMonth2) >= 0) return;
        showMonth(nextMonth1, 'month1');
        showMonth(nextMonth2, 'month2');
        showSelectedDays();
      }

      box.find('.prev').click(function () {
        if (!opt.stickyMonths) {
          gotoPrevMonth(this);
        } else {
          gotoPrevMonth_stickily(this);
        }
      });

      function gotoPrevMonth(self) {
        var isMonth2 = $(self).parents('table').hasClass('month2');
        var month = isMonth2 ? opt.month2 : opt.month1;
        month = prevMonth(month);
        if (isMonth2 && compare_month(month, opt.month1) <= 0 || isMonthOutOfBounds(month)) return;
        showMonth(month, isMonth2 ? 'month2' : 'month1');
        showGap();
        showDaysBorders();
      }

      function gotoPrevMonth_stickily(self) {
        var prevMonth1 = prevMonth(opt.month1);
        var prevMonth2 = prevMonth(opt.month2);
        if (isMonthOutOfBounds(prevMonth1)) return;
        if (!opt.singleDate && compare_month(prevMonth2, prevMonth1) <= 0) return;
        showMonth(prevMonth2, 'month2');
        showMonth(prevMonth1, 'month1');
        showSelectedDays();
      }

      box.attr('unselectable', 'on').css('user-select', 'none').bind('selectstart', function (e) {
        e.preventDefault();
        return false;
      });

      box.find('.apply-btn').click(function () {
        closeDatePicker();
        var dateRange = getDateString(new Date(opt.start)) + opt.separator + getDateString(new Date(opt.end));
        $(self).trigger('datepicker-apply', {
          'value': dateRange,
          'date1': new Date(opt.start),
          'date2': new Date(opt.end)
        });
      });

      box.find('.close-btn').click(function () {
        closeDatePicker();
        clearSelection();
      });

      box.find('[custom]').click(function () {
        var valueName = $(this).attr('custom');
        opt.start = false;
        opt.end = false;
        box.find('.day.checked').removeClass('checked');
        opt.setValue.call(selfDom, valueName);
        checkSelectionValid();
        showSelectedInfo(true);
        showSelectedDays();
        if (opt.autoClose) closeDatePicker();
      });

      box.find('[shortcut]').click(function () {
        var shortcut = $(this).attr('shortcut');
        var end = new Date(),
            start = false;
        var dir;
        if (shortcut.indexOf('day') != -1) {
          var day = parseInt(shortcut.split(',', 2)[1], 10);
          start = new Date(new Date().getTime() + 86400000 * day);
          end = new Date(end.getTime() + 86400000 * (day > 0 ? 1 : -1));
        } else if (shortcut.indexOf('week') != -1) {
          dir = shortcut.indexOf('prev,') != -1 ? -1 : 1;
          var stopDay;
          if (dir == 1) stopDay = opt.startOfWeek == 'monday' ? 1 : 0;else stopDay = opt.startOfWeek == 'monday' ? 0 : 6;

          end = new Date(end.getTime() - 86400000);
          while (end.getDay() != stopDay) end = new Date(end.getTime() + dir * 86400000);
          start = new Date(end.getTime() + dir * 86400000 * 6);
        } else if (shortcut.indexOf('month') != -1) {
          dir = shortcut.indexOf('prev,') != -1 ? -1 : 1;
          if (dir == 1) start = nextMonth(end);else start = prevMonth(end);
          start.setDate(1);
          end = nextMonth(start);
          end.setDate(1);
          end = new Date(end.getTime() - 86400000);
        } else if (shortcut.indexOf('year') != -1) {
          dir = shortcut.indexOf('prev,') != -1 ? -1 : 1;
          start = new Date();
          start.setFullYear(end.getFullYear() + dir);
          start.setMonth(0);
          start.setDate(1);
          end.setFullYear(end.getFullYear() + dir);
          end.setMonth(11);
          end.setDate(31);
        } else if (shortcut == 'custom') {
          var name = $(this).html();
          if (opt.customShortcuts && opt.customShortcuts.length > 0) {
            for (var i = 0; i < opt.customShortcuts.length; i++) {
              var sh = opt.customShortcuts[i];
              if (sh.name == name) {
                var data = [];
                // try
                // {
                data = sh['dates'].call();
                //}catch(e){}
                if (data && data.length == 2) {
                  start = data[0];
                  end = data[1];
                }

                // if only one date is specified then just move calendars there
                // move calendars to show this date's month and next months
                if (data && data.length == 1) {
                  var movetodate = data[0];
                  showMonth(movetodate, 'month1');
                  showMonth(nextMonth(movetodate), 'month2');
                  showGap();
                }

                break;
              }
            }
          }
        }
        if (start && end) {
          setDateRange(start, end);
          checkSelectionValid();
        }
      });

      box.find('.time1 input[type=range]').bind('change touchmove', function (e) {
        var target = e.target,
            hour = target.name == 'hour' ? $(target).val().replace(/^(\d{1})$/, '0$1') : undefined,
            min = target.name == 'minute' ? $(target).val().replace(/^(\d{1})$/, '0$1') : undefined;
        setTime('time1', hour, min);
      });

      box.find('.time2 input[type=range]').bind('change touchmove', function (e) {
        var target = e.target,
            hour = target.name == 'hour' ? $(target).val().replace(/^(\d{1})$/, '0$1') : undefined,
            min = target.name == 'minute' ? $(target).val().replace(/^(\d{1})$/, '0$1') : undefined;
        setTime('time2', hour, min);
      });
    }

    function calcPosition() {
      if (!opt.inline) {
        var offset = $(self).offset();
        var offsetParent = $(self).parent().offset();
        if ($(opt.container).css('position') == 'relative') {
          var containerOffset = $(opt.container).offset();
          box.css({
            top: offset.top - containerOffset.top + $(self).outerHeight() + 4,
            left: offsetParent.left - containerOffset.left
          });
        } else {
          if (offset.left < 460) //left to right
            {
              box.css({
                top: offset.top + $(self).outerHeight() + parseInt($('body').css('border-top') || 0, 10),
                left: offsetParent.left
              });
            } else {
            box.css({
              top: offset.top + $(self).outerHeight() + parseInt($('body').css('border-top') || 0, 10),
              left: offsetParent.left + $(self).width() - box.width() - 16
            });
          }
        }
      }
    }

    // Return the date picker wrapper element
    function getDatePicker() {
      return box;
    }

    function open(animationTime) {
      calcPosition();
      redrawDatePicker();
      checkAndSetDefaultValue();
      timePicker();
      if (opt.customOpenAnimation) {
        opt.customOpenAnimation.call(box.get(0), function () {
          $(self).trigger('datepicker-opened', {
            relatedTarget: box
          });
        });
      } else {
        box.slideDown(animationTime, function () {
          $(self).trigger('datepicker-opened', {
            relatedTarget: box
          });
        });
      }
      $(self).trigger('datepicker-open', {
        relatedTarget: box
      });
      showGap();
      updateCalendarWidth();
    }

    function checkAndSetDefaultValue() {
      var __default_string = opt.getValue.call(selfDom);
      var defaults = __default_string ? __default_string.split(opt.separator) : '';

      if (defaults && (defaults.length == 1 && opt.singleDate || defaults.length >= 2)) {
        var ___format = opt.format;
        if (___format.match(/Do/)) {

          ___format = ___format.replace(/Do/, 'D');
          defaults[0] = defaults[0].replace(/(\d+)(th|nd|st)/, '$1');
          if (defaults.length >= 2) {
            defaults[1] = defaults[1].replace(/(\d+)(th|nd|st)/, '$1');
          }
        }
        // set initiated  to avoid triggerring datepicker-change event
        initiated = false;
        if (defaults.length >= 2) {
          setDateRange(getValidValue(defaults[0], ___format, moment.locale(opt.language)), getValidValue(defaults[1], ___format, moment.locale(opt.language)));
        } else if (defaults.length == 1 && opt.singleDate) {
          setSingleDate(getValidValue(defaults[0], ___format, moment.locale(opt.language)));
        }

        initiated = true;
      }
    }

    function getValidValue(date, format, locale) {
      if (moment(date, format, locale).isValid()) {
        return moment(date, format, locale).toDate();
      } else {
        return moment().toDate();
      }
    }

    function updateCalendarWidth() {
      var gapMargin = box.find('.gap').css('margin-left');
      var elementWidth = $(self).parent().width();
      if (gapMargin) gapMargin = parseInt(gapMargin);
      var w1 = box.find('.month1').width();
      var w2 = box.find('.gap').width() + (gapMargin ? gapMargin * 2 : 0);
      var w3 = box.find('.month2').width();
      box.find('.month-wrapper').width(elementWidth);
    }

    function renderTime(name, date) {
      box.find('.' + name + ' input[type=range].hour-range').val(moment(date).hours());
      box.find('.' + name + ' input[type=range].minute-range').val(moment(date).minutes());
      setTime(name, moment(date).format('HH'), moment(date).format('mm'));
    }

    function changeTime(name, date) {
      opt[name] = parseInt(moment(parseInt(date)).startOf('day').add(moment(opt[name + 'Time']).format('HH'), 'h').add(moment(opt[name + 'Time']).format('mm'), 'm').valueOf());
    }

    function swapTime() {
      renderTime('time1', opt.start);
      renderTime('time2', opt.end);
    }

    function setTime(name, hour, minute) {
      hour && box.find('.' + name + ' .hour-val').text(hour);
      minute && box.find('.' + name + ' .minute-val').text(minute);
      switch (name) {
        case 'time1':
          if (opt.start) {
            setRange('start', moment(opt.start));
          }
          setRange('startTime', moment(opt.startTime || moment().valueOf()));
          break;
        case 'time2':
          if (opt.end) {
            setRange('end', moment(opt.end));
          }
          setRange('endTime', moment(opt.endTime || moment().valueOf()));
          break;
      }

      function setRange(name, timePoint) {
        var h = timePoint.format('HH'),
            m = timePoint.format('mm');
        opt[name] = timePoint.startOf('day').add(hour || h, 'h').add(minute || m, 'm').valueOf();
      }
      checkSelectionValid();
      showSelectedInfo();
      showSelectedDays();
    }

    function clearSelection() {
      opt.start = false;
      opt.end = false;
      box.find('.day.checked').removeClass('checked');
      box.find('.day.last-date-selected').removeClass('last-date-selected');
      box.find('.day.first-date-selected').removeClass('first-date-selected');
      opt.setValue.call(selfDom, '');
      checkSelectionValid();
      showSelectedInfo();
      showSelectedDays();
    }

    function handleStart(time) {
      var r = time;
      if (opt.batchMode === 'week-range') {
        if (opt.startOfWeek === 'monday') {
          r = moment(parseInt(time)).startOf('isoweek').valueOf();
        } else {
          r = moment(parseInt(time)).startOf('week').valueOf();
        }
      } else if (opt.batchMode === 'month-range') {
        r = moment(parseInt(time)).startOf('month').valueOf();
      }
      return r;
    }

    function handleEnd(time) {
      var r = time;
      if (opt.batchMode === 'week-range') {
        if (opt.startOfWeek === 'monday') {
          r = moment(parseInt(time)).endOf('isoweek').valueOf();
        } else {
          r = moment(parseInt(time)).endOf('week').valueOf();
        }
      } else if (opt.batchMode === 'month-range') {
        r = moment(parseInt(time)).endOf('month').valueOf();
      }
      return r;
    }

    function dayClicked(day) {
      if (day.hasClass('invalid')) return;
      var time = day.attr('time');
      day.addClass('checked');
      if (opt.singleDate) {
        opt.start = time;
        opt.end = false;
      } else if (opt.batchMode === 'week') {
        if (opt.startOfWeek === 'monday') {
          opt.start = moment(parseInt(time)).startOf('isoweek').valueOf();
          opt.end = moment(parseInt(time)).endOf('isoweek').valueOf();
        } else {
          opt.end = moment(parseInt(time)).endOf('week').valueOf();
          opt.start = moment(parseInt(time)).startOf('week').valueOf();
        }
      } else if (opt.batchMode === 'workweek') {
        opt.start = moment(parseInt(time)).day(1).valueOf();
        opt.end = moment(parseInt(time)).day(5).valueOf();
      } else if (opt.batchMode === 'weekend') {
        opt.start = moment(parseInt(time)).day(6).valueOf();
        opt.end = moment(parseInt(time)).day(7).valueOf();
      } else if (opt.batchMode === 'month') {
        opt.start = moment(parseInt(time)).startOf('month').valueOf();
        opt.end = moment(parseInt(time)).endOf('month').valueOf();
      } else if (opt.start && opt.end || !opt.start && !opt.end) {
        opt.start = handleStart(time);
        opt.end = false;
      } else if (opt.start) {
        opt.end = handleEnd(time);
        if (opt.time.enabled) {
          changeTime('end', opt.end);
        }
      }

      //Update time in case it is enabled and timestamps are available
      if (opt.time.enabled) {
        if (opt.start) {
          changeTime('start', opt.start);
        }
        if (opt.end) {
          changeTime('end', opt.end);
        }
      }

      //In case the start is after the end, swap the timestamps
      if (!opt.singleDate && opt.start && opt.end && opt.start > opt.end) {
        var tmp = opt.end;
        opt.end = handleEnd(opt.start);
        opt.start = handleStart(tmp);
        if (opt.time.enabled && opt.swapTime) {
          swapTime();
        }
      }

      opt.start = parseInt(opt.start);
      opt.end = parseInt(opt.end);

      clearHovering();
      if (opt.start && !opt.end) {
        $(self).trigger('datepicker-first-date-selected', {
          'date1': new Date(opt.start)
        });
        dayHovering(day);
      }
      updateSelectableRange(time);

      checkSelectionValid();
      showSelectedInfo();
      showSelectedDays();
      showDaysBorders();
      // autoclose();
    }

    function weekNumberClicked(weekNumberDom) {
      var thisTime = parseInt(weekNumberDom.attr('data-start-time'), 10);
      var date1, date2;
      if (!opt.startWeek) {
        opt.startWeek = thisTime;
        weekNumberDom.addClass('week-number-selected');
        date1 = new Date(thisTime);
        opt.start = moment(date1).day(opt.startOfWeek == 'monday' ? 1 : 0).valueOf();
        opt.end = moment(date1).day(opt.startOfWeek == 'monday' ? 7 : 6).valueOf();
      } else {
        box.find('.week-number-selected').removeClass('week-number-selected');
        date1 = new Date(thisTime < opt.startWeek ? thisTime : opt.startWeek);
        date2 = new Date(thisTime < opt.startWeek ? opt.startWeek : thisTime);
        opt.startWeek = false;
        opt.start = moment(date1).day(opt.startOfWeek == 'monday' ? 1 : 0).valueOf();
        opt.end = moment(date2).day(opt.startOfWeek == 'monday' ? 7 : 6).valueOf();
      }
      updateSelectableRange();
      checkSelectionValid();
      showSelectedInfo();
      showSelectedDays();
      autoclose();
    }

    function isValidTime(time) {
      time = parseInt(time, 10);
      if (opt.startDate && compare_day(time, opt.startDate) < 0) return false;
      if (opt.endDate && compare_day(time, opt.endDate) > 0) return false;

      if (opt.start && !opt.end && !opt.singleDate) {
        //check maxDays and minDays setting
        if (opt.maxDays > 0 && countDays(time, opt.start) > opt.maxDays) return false;
        if (opt.minDays > 0 && countDays(time, opt.start) < opt.minDays) return false;

        //check selectForward and selectBackward
        if (opt.selectForward && time < opt.start) return false;
        if (opt.selectBackward && time > opt.start) return false;

        //check disabled days
        if (opt.beforeShowDay && typeof opt.beforeShowDay == 'function') {
          var valid = true;
          var timeTmp = time;
          while (countDays(timeTmp, opt.start) > 1) {
            var arr = opt.beforeShowDay(new Date(timeTmp));
            if (!arr[0]) {
              valid = false;
              break;
            }
            if (Math.abs(timeTmp - opt.start) < 86400000) break;
            if (timeTmp > opt.start) timeTmp -= 86400000;
            if (timeTmp < opt.start) timeTmp += 86400000;
          }
          if (!valid) return false;
        }
      }
      return true;
    }

    function updateSelectableRange() {
      box.find('.day.invalid.tmp').removeClass('tmp invalid').addClass('valid');
      if (opt.start && !opt.end) {
        box.find('.day.toMonth.valid').each(function () {
          var time = parseInt($(this).attr('time'), 10);
          if (!isValidTime(time)) $(this).addClass('invalid tmp').removeClass('valid');else $(this).addClass('valid tmp').removeClass('invalid');
        });
      }

      return true;
    }

    function dayHovering(day) {
      var hoverTime = parseInt(day.attr('time'));
      var tooltip = '';

      if (day.hasClass('has-tooltip') && day.attr('data-tooltip')) {
        tooltip = '<span style="white-space:nowrap">' + day.attr('data-tooltip') + '</span>';
      } else if (!day.hasClass('invalid')) {
        if (opt.singleDate) {
          box.find('.day.hovering').removeClass('hovering');
          day.addClass('hovering');
        } else {
          box.find('.day').each(function () {
            var time = parseInt($(this).attr('time')),
                start = opt.start,
                end = opt.end;

            if (time == hoverTime) {
              $(this).addClass('hovering');
            } else {
              $(this).removeClass('hovering');
            }

            if (opt.start && !opt.end && (opt.start < time && hoverTime >= time || opt.start > time && hoverTime <= time)) {
              $(this).addClass('hovering');
            } else {
              $(this).removeClass('hovering');
            }
          });

          if (opt.start && !opt.end) {
            var days = countDays(hoverTime, opt.start);
            if (opt.hoveringTooltip) {
              if (typeof opt.hoveringTooltip == 'function') {
                tooltip = opt.hoveringTooltip(days, opt.start, hoverTime);
              } else if (opt.hoveringTooltip === true && days > 1) {
                tooltip = days + ' ' + translate('days');
              }
            }
          }
        }
      }

      if (tooltip) {
        var posDay = day.offset();
        var posBox = box.offset();

        var _left = posDay.left - posBox.left;
        var _top = posDay.top - posBox.top;
        _left += day.width() / 2;

        var $tip = box.find('.date-range-length-tip');
        var w = $tip.css({
          'visibility': 'hidden',
          'display': 'none'
        }).html(tooltip).width();
        var h = $tip.height();
        _left -= w / 2;
        _top -= h;
        setTimeout(function () {
          $tip.css({
            left: _left,
            top: _top,
            display: 'block',
            'visibility': 'visible'
          });
        }, 10);
      } else {
        box.find('.date-range-length-tip').hide();
      }
    }

    function clearHovering() {
      box.find('.day.hovering').removeClass('hovering');
      box.find('.date-range-length-tip').hide();
    }

    function autoclose() {
      if (opt.singleDate === true) {
        if (initiated && opt.start) {
          if (opt.autoClose) closeDatePicker();
        }
      } else {
        if (initiated && opt.start && opt.end) {
          if (opt.autoClose) closeDatePicker();
        }
      }
    }

    function checkSelectionValid() {
      var days = Math.ceil((opt.end - opt.start) / 86400000) + 1;
      if (opt.singleDate) {
        // Validate if only start is there
        if (opt.start && !opt.end) box.find('.drp_top-bar').removeClass('error').addClass('normal');else box.find('.drp_top-bar').removeClass('error').removeClass('normal');
      } else if (opt.maxDays && days > opt.maxDays) {
        opt.start = false;
        opt.end = false;
        box.find('.day').removeClass('checked');
        box.find('.drp_top-bar').removeClass('normal').addClass('error').find('.error-top').html(translate('less-than').replace('%d', opt.maxDays));
      } else if (opt.minDays && days < opt.minDays) {
        opt.start = false;
        opt.end = false;
        box.find('.day').removeClass('checked');
        box.find('.drp_top-bar').removeClass('normal').addClass('error').find('.error-top').html(translate('more-than').replace('%d', opt.minDays));
      } else {
        if (opt.start || opt.end) box.find('.drp_top-bar').removeClass('error').addClass('normal');else box.find('.drp_top-bar').removeClass('error').removeClass('normal');
      }

      if (opt.singleDate && opt.start && !opt.end || !opt.singleDate && opt.start && opt.end) {
        box.find('.apply-btn').removeClass('disabled');
      } else {
        box.find('.apply-btn').addClass('disabled');
      }

      if (opt.batchMode) {
        if (opt.start && opt.startDate && compare_day(opt.start, opt.startDate) < 0 || opt.end && opt.endDate && compare_day(opt.end, opt.endDate) > 0) {
          opt.start = false;
          opt.end = false;
          box.find('.day').removeClass('checked');
        }
      }
    }

    function showSelectedInfo(forceValid, silent) {
      box.find('.start-day').html('...');
      box.find('.end-day').html('...');
      box.find('.selected-days').hide();
      if (opt.start) {
        box.find('.start-day').html(getDateString(new Date(parseInt(opt.start))));
      }
      if (opt.end) {
        box.find('.end-day').html(getDateString(new Date(parseInt(opt.end))));
      }
      var dateRange;
      if (opt.start && opt.singleDate) {
        box.find('.apply-btn').removeClass('disabled');
        dateRange = getDateString(new Date(opt.start));
        opt.setValue.call(selfDom, dateRange, getDateString(new Date(opt.start)), getDateString(new Date(opt.end)));

        if (initiated && !silent) {
          $(self).trigger('datepicker-change', {
            'value': dateRange,
            'date1': new Date(opt.start)
          });
        }
      } else if (opt.start && opt.end) {
        box.find('.selected-days').show().find('.selected-days-num').html(countDays(opt.end, opt.start));
        box.find('.apply-btn').removeClass('disabled');
        var startTime = $('.start-time input[type=time]').val();
        var endTime = $('.end-time input[type=time]').val();
        // dateRange = getDateString(new Date(opt.start)) + opt.separator + getDateString(new Date(opt.end));

        // output all data in input
        dateRange = moment(new Date(opt.start)).format('DD.MM.YYYY') + ' ' + startTime + opt.separator + moment(new Date(opt.end)).format('DD.MM.YYYY') + ' ' + endTime;

        opt.setValue.call(selfDom, dateRange);

        if (initiated && !silent) {
          $(self).trigger('datepicker-change', {
            'value': dateRange,
            'date1': new Date(opt.start),
            'date2': new Date(opt.end)
          });
        }
      } else if (forceValid) {
        box.find('.apply-btn').removeClass('disabled');
      } else {
        box.find('.apply-btn').addClass('disabled');
      }
    }

    function showDaysBorders() {
      console.log('showDaysBorders');
      var first = $('.first-date-selected');
      var last = $('.last-date-selected');
      var borderRight = '<div class="round-border round-border-right"></div>';
      var borderLeft = '<div class="round-border round-border-left"></div>';
      var borderBg = '<div class="round-border"></div>';

      first.siblings('.round-border').not(':first').remove();
      last.siblings('.round-border').not(':first').remove();
      $('.real-today').siblings('.round-border').not(':first').remove();
      first.after(borderRight);
      last.after(borderLeft);

      $('.date-picker-wrapper tbody > tr > td:first-child .real-today.checked').after(borderRight);
      $('.date-picker-wrapper tbody > tr > td:last-child .real-today.checked').after(borderLeft);

      if ($('.date-picker-wrapper tbody > tr > td').not(':first').not(':last').children('.real-today').hasClass('first-date-selected') || $('.date-picker-wrapper tbody > tr > td').not(':first').not(':last').children('.real-today').hasClass('last-date-selected')) {
        $('.date-picker-wrapper tbody > tr > td').not(':first').not(':last').children('.real-today').children('.round-border').remove();
      } else {
        $('.date-picker-wrapper tbody > tr > td').not(':first').not(':last').children('.real-today').after(borderBg);
      }
    }

    function countDays(start, end) {
      return Math.abs(daysFrom1970(start) - daysFrom1970(end)) + 1;
    }

    function setDateRange(date1, date2, silent) {
      if (date1.getTime() > date2.getTime()) {
        var tmp = date2;
        date2 = date1;
        date1 = tmp;
        tmp = null;
      }
      var valid = true;
      if (opt.startDate && compare_day(date1, opt.startDate) < 0) valid = false;
      if (opt.endDate && compare_day(date2, opt.endDate) > 0) valid = false;
      if (!valid) {
        showMonth(opt.startDate, 'month1');
        showMonth(nextMonth(opt.startDate), 'month2');
        showGap();
        return;
      }

      opt.start = date1.getTime();
      opt.end = date2.getTime();

      if (opt.time.enabled) {
        renderTime('time1', date1);
        renderTime('time2', date2);
      }

      if (opt.stickyMonths || compare_day(date1, date2) > 0 && compare_month(date1, date2) === 0) {
        if (opt.lookBehind) {
          date1 = prevMonth(date2);
        } else {
          date2 = nextMonth(date1);
        }
      }

      if (opt.stickyMonths && opt.endDate !== false && compare_month(date2, opt.endDate) > 0) {
        date1 = prevMonth(date1);
        date2 = prevMonth(date2);
      }

      if (!opt.stickyMonths) {
        if (compare_month(date1, date2) === 0) {
          if (opt.lookBehind) {
            date1 = prevMonth(date2);
          } else {
            date2 = nextMonth(date1);
          }
        }
      }

      showMonth(date1, 'month1');
      showMonth(date2, 'month2');
      showGap();
      checkSelectionValid();
      showSelectedInfo(false, silent);
      // show borders when open after save
      showDaysBorders();
      autoclose();
    }

    function setSingleDate(date1) {

      var valid = true;
      if (opt.startDate && compare_day(date1, opt.startDate) < 0) valid = false;
      if (opt.endDate && compare_day(date1, opt.endDate) > 0) valid = false;
      if (!valid) {
        showMonth(opt.startDate, 'month1');
        return;
      }

      opt.start = date1.getTime();

      if (opt.time.enabled) {
        renderTime('time1', date1);
      }
      showMonth(date1, 'month1');
      if (opt.singleMonth !== true) {
        var date2 = nextMonth(date1);
        showMonth(date2, 'month2');
      }
      showGap();
      showSelectedInfo();
      autoclose();
    }

    function showSelectedDays() {
      if (!opt.start && !opt.end) return;
      box.find('.day').each(function () {
        var time = parseInt($(this).attr('time')),
            start = opt.start,
            end = opt.end;
        if (opt.time.enabled) {
          time = moment(time).startOf('day').valueOf();
          start = moment(start || moment().valueOf()).startOf('day').valueOf();
          end = moment(end || moment().valueOf()).startOf('day').valueOf();
        }
        if (opt.start && opt.end && end >= time && start <= time || opt.start && !opt.end && moment(start).format('YYYY-MM-DD') == moment(time).format('YYYY-MM-DD')) {
          $(this).addClass('checked');
        } else {
          $(this).removeClass('checked');
        }

        $('.start-time .date .month').text(moment(start).format('MMMM') + ' ');
        $('.start-time .date .year').text(moment(start).format('YYYY'));
        $('.start-time .date .day').text(moment(start).format('Do'));

        $('.end-time .date .month').text(moment(end).format('MMMM') + ' ');
        $('.end-time .date .year').text(moment(end).format('YYYY'));
        $('.end-time .date .day').text(moment(end).format('Do'));

        //add first-date-selected class name to the first date selected
        if (opt.start && moment(start).format('YYYY-MM-DD') == moment(time).format('YYYY-MM-DD')) {
          $(this).addClass('first-date-selected');
        } else {
          $(this).removeClass('first-date-selected');
        }
        //add last-date-selected
        if (opt.end && moment(end).format('YYYY-MM-DD') == moment(time).format('YYYY-MM-DD')) {
          $(this).addClass('last-date-selected');
        } else {
          $(this).removeClass('last-date-selected');
        }
      });

      box.find('.week-number').each(function () {
        if ($(this).attr('data-start-time') == opt.startWeek) {
          $(this).addClass('week-number-selected');
        }
      });
    }

    function showMonth(date, month) {
      date = moment(date).toDate();
      var monthName = nameMonth(date.getMonth());
      box.find('.' + month + ' .month-name').html('<span class="year">' + date.getFullYear() + '</span> ' + '<span class="month">' + monthName + '</span>');
      box.find('.' + month + ' tbody').html(createMonthHTML(date));
      opt[month] = date;
      updateSelectableRange();
      bindDayEvents();
    }

    function bindDayEvents() {
      box.find('.day').unbind("click").click(function (evt) {
        dayClicked($(this));
      });

      box.find('.day').unbind("mouseenter").mouseenter(function (evt) {
        dayHovering($(this));
      });

      box.find('.day').unbind("mouseleave").mouseleave(function (evt) {
        box.find('.date-range-length-tip').hide();
        if (opt.singleDate) {
          clearHovering();
        }
      });

      box.find('.week-number').unbind("click").click(function (evt) {
        weekNumberClicked($(this));
      });
    }

    function showTime(date, name) {
      box.find('.' + name).append(getTimeHTML());
      renderTime(name, date);
    }

    function nameMonth(m) {
      return translate('month-name')[m];
    }

    function getDateString(d) {
      return moment(d).format(opt.format);
    }

    function showGap() {
      showSelectedDays();
      var m1 = parseInt(moment(opt.month1).format('YYYYMM'));
      var m2 = parseInt(moment(opt.month2).format('YYYYMM'));
      var p = Math.abs(m1 - m2);
      var shouldShow = p > 1 && p != 89;
      if (shouldShow) {
        box.addClass('has-gap').removeClass('no-gap').find('.gap').css('visibility', 'visible');
      } else {
        box.removeClass('has-gap').addClass('no-gap').find('.gap').css('visibility', 'hidden');
      }
      var h1 = box.find('table.month1').height();
      var h2 = box.find('table.month2').height();
      box.find('.gap').height(Math.max(h1, h2) + 10);
    }

    function closeDatePicker() {
      if (opt.alwaysOpen) return;

      var afterAnim = function () {
        $(self).data('date-picker-opened', false);
        $(self).trigger('datepicker-closed', {
          relatedTarget: box
        });
      };
      if (opt.customCloseAnimation) {
        opt.customCloseAnimation.call(box.get(0), afterAnim);
      } else {
        $(box).slideUp(opt.duration, afterAnim);
      }
      $(self).trigger('datepicker-close', {
        relatedTarget: box
      });
    }

    function redrawDatePicker() {
      showMonth(opt.month1, 'month1');
      showMonth(opt.month2, 'month2');
    }

    function compare_month(m1, m2) {
      var p = parseInt(moment(m1).format('YYYYMM')) - parseInt(moment(m2).format('YYYYMM'));
      if (p > 0) return 1;
      if (p === 0) return 0;
      return -1;
    }

    function compare_day(m1, m2) {
      var p = parseInt(moment(m1).format('YYYYMMDD')) - parseInt(moment(m2).format('YYYYMMDD'));
      if (p > 0) return 1;
      if (p === 0) return 0;
      return -1;
    }

    function nextMonth(month) {
      return moment(month).add(1, 'months').toDate();
    }

    function prevMonth(month) {
      return moment(month).add(-1, 'months').toDate();
    }

    function getTimeHTML() {
      return "<div class='time-block'>" + "<input type='time' value='12:30'>" + "<span class='up'></span>" + "<span class='down'></span>" + "</div>" + "<div class='am-pm'>" + "<div class='showing am'>AM</div>" + "<span class='up-arrow'></span>" + "<span class='down-arrow'></span>" + "</div>";
      // return '<div>' +
      //   '<span>' + translate('Time') + '</span>' +
      //   '</div>' +
      //   '<div class="hour">' +
      //   '<span>' + translate('Hour') + '</span>' +
      //   '</div>' +
      //   '<div class="minute">' +
      //   '<label>' + translate('Minute') + '</label>' +
      //   '</div>';
    }

    function createDom() {
      var html = '<div class="date-picker-wrapper';
      if (opt.extraClass) html += ' ' + opt.extraClass + ' ';
      if (opt.singleDate) html += ' single-date ';
      if (!opt.showShortcuts) html += ' no-shortcuts ';
      if (!opt.showTopbar) html += ' no-topbar ';
      if (opt.customTopBar) html += ' custom-topbar ';
      html += '">';

      if (opt.showTopbar) {
        html += '<div class="drp_top-bar">';

        if (opt.customTopBar) {
          if (typeof opt.customTopBar == 'function') opt.customTopBar = opt.customTopBar();
          html += '<div class="custom-top">' + opt.customTopBar + '</div>';
        } else {
          html += '<div class="normal-top">' + '<span style="color:#333">' + translate('selected') + ' </span> <b class="start-day">...</b>';
          if (!opt.singleDate) {
            html += ' <span class="separator-day">' + opt.separator + '</span> <b class="end-day">...</b> <i class="selected-days">(<span class="selected-days-num">3</span> ' + translate('days') + ')</i>';
          }
          html += '</div>';
          html += '<div class="error-top">error</div>' + '<div class="default-top">default</div>';
        }

        html += '</div>';
      }

      var _colspan = opt.showWeekNumbers ? 6 : 5;

      var arrowPrev = '&lt;';
      if (opt.customArrowPrevSymbol) arrowPrev = opt.customArrowPrevSymbol;

      var arrowNext = '&gt;';
      if (opt.customArrowNextSymbol) arrowNext = opt.customArrowNextSymbol;

      html += '<div class="month-wrapper">' + '   <table class="month1" cellspacing="0" border="0" cellpadding="0">' + '       <thead>' + '           <tr class="caption">' + '               <th style="width:27px;">' + '                   <span class="prev">' + arrowPrev + '                   </span>' + '               </th>' + '               <th colspan="' + _colspan + '" class="month-name">' + '               </th>' + '               <th style="width:27px;">' + (opt.singleDate || !opt.stickyMonths ? '<span class="next">' + arrowNext + '</span>' : '') + '               </th>' + '           </tr>' + '           <tr class="week-name">' + getWeekHead() + '       </thead>' + '       <tbody></tbody>' + '   </table>';

      if (hasMonth2()) {
        html += '<div class="gap">' + getGapHTML() + '</div>' + '<table class="month2" cellspacing="0" border="0" cellpadding="0">' + '   <thead>' + '   <tr class="caption">' + '       <th style="width:27px;">' + (!opt.stickyMonths ? '<span class="prev">' + arrowPrev + '</span>' : '') + '       </th>' + '       <th colspan="' + _colspan + '" class="month-name">' + '       </th>' + '       <th style="width:27px;">' + '           <span class="next">' + arrowNext + '</span>' + '       </th>' + '   </tr>' + '   <tr class="week-name">' + getWeekHead() + '   </thead>' + '   <tbody></tbody>' + '</table>';
      }
      //+'</div>'
      var date = moment(date).toDate();
      var monthName = nameMonth(date.getMonth());
      html += '<div style="clear:both;height:0;font-size:0;"></div>' + '<div class="time">' + '<div class="time1 start-time">' + '<div class="title-time">Start</div>' + '<div class="date"><span class="month">' + monthName + ' </span><span class="day"> ' + moment(new Date()).format('Do') + '</span> <span class="year">' + date.getFullYear() + '</span></div>' + '</div>' + '<span class="to">to</span>';
      if (!opt.singleDate) {
        html += '' + '' + '<div class="time2 end-time">' + '<div class="title-time">End</div>' + '<div class="date"><span class="month">' + monthName + ' </span><span class="day"> ' + moment(new Date()).format('Do') + '</span> <span class="year">' + date.getFullYear() + '</span></div>' + '</div>';
      }
      html += '<div class="buttons"><input type="button" class="close-btn cancel btn-dark-grey btn open-sans-font" value="Cancel" />';
      html += '<input type="button" class="apply-btn disabled btn-primary btn open-sans-font' + getApplyBtnClass() + '" value="Save Time" /></div>';

      html += '</div>' + '<div style="clear:both;height:0;font-size:0;"></div>' + '</div>';

      html += '</div></div>';

      return $(html);
    }

    function getApplyBtnClass() {
      var klass = '';
      if (opt.autoClose === true) {
        klass += ' hide';
      }
      if (opt.applyBtnClass !== '') {
        klass += ' ' + opt.applyBtnClass;
      }
      return klass;
    }

    function getWeekHead() {
      var prepend = opt.showWeekNumbers ? '<th>' + translate('week-number') + '</th>' : '';
      if (opt.startOfWeek == 'monday') {
        return prepend + '<th>' + translate('week-1') + '</th>' + '<th>' + translate('week-2') + '</th>' + '<th>' + translate('week-3') + '</th>' + '<th>' + translate('week-4') + '</th>' + '<th>' + translate('week-5') + '</th>' + '<th>' + translate('week-6') + '</th>' + '<th>' + translate('week-7') + '</th>';
      } else {
        return prepend + '<th>' + translate('week-7') + '</th>' + '<th>' + translate('week-1') + '</th>' + '<th>' + translate('week-2') + '</th>' + '<th>' + translate('week-3') + '</th>' + '<th>' + translate('week-4') + '</th>' + '<th>' + translate('week-5') + '</th>' + '<th>' + translate('week-6') + '</th>';
      }
    }

    function isMonthOutOfBounds(month) {
      month = moment(month);
      if (opt.startDate && month.endOf('month').isBefore(opt.startDate)) {
        return true;
      }
      if (opt.endDate && month.startOf('month').isAfter(opt.endDate)) {
        return true;
      }
      return false;
    }

    function getGapHTML() {
      var html = ['<div class="gap-top-mask"></div><div class="gap-bottom-mask"></div><div class="gap-lines">'];
      for (var i = 0; i < 20; i++) {
        html.push('<div class="gap-line">' + '<div class="gap-1"></div>' + '<div class="gap-2"></div>' + '<div class="gap-3"></div>' + '</div>');
      }
      html.push('</div>');
      return html.join('');
    }

    function hasMonth2() {
      return !opt.singleMonth;
    }

    function attributesCallbacks(initialObject, callbacksArray, today) {
      var resultObject = $.extend(true, {}, initialObject);

      $.each(callbacksArray, function (cbAttrIndex, cbAttr) {
        var addAttributes = cbAttr(today);
        for (var attr in addAttributes) {
          if (resultObject.hasOwnProperty(attr)) {
            resultObject[attr] += addAttributes[attr];
          } else {
            resultObject[attr] = addAttributes[attr];
          }
        }
      });

      var attrString = '';

      for (var attr in resultObject) {
        if (resultObject.hasOwnProperty(attr)) {
          attrString += attr + '="' + resultObject[attr] + '" ';
        }
      }

      return attrString;
    }

    function daysFrom1970(t) {
      return Math.floor(toLocalTimestamp(t) / 86400000);
    }

    function toLocalTimestamp(t) {
      if (moment.isMoment(t)) t = t.toDate().getTime();
      if (typeof t == 'object' && t.getTime) t = t.getTime();
      if (typeof t == 'string' && !t.match(/\d{13}/)) t = moment(t, opt.format).toDate().getTime();
      t = parseInt(t, 10) - new Date().getTimezoneOffset() * 60 * 1000;
      return t;
    }

    function createMonthHTML(d) {
      var days = [];
      d.setDate(1);
      var lastMonth = new Date(d.getTime() - 86400000);
      var now = new Date();

      var dayOfWeek = d.getDay();
      if (dayOfWeek === 0 && opt.startOfWeek === 'monday') {
        // add one week
        dayOfWeek = 7;
      }
      var today, valid;

      if (dayOfWeek > 0) {
        for (var i = dayOfWeek; i > 0; i--) {
          var day = new Date(d.getTime() - 86400000 * i);
          valid = isValidTime(day.getTime());
          if (opt.startDate && compare_day(day, opt.startDate) < 0) valid = false;
          if (opt.endDate && compare_day(day, opt.endDate) > 0) valid = false;
          days.push({
            date: day,
            type: 'lastMonth',
            day: day.getDate(),
            time: day.getTime(),
            valid: valid
          });
        }
      }
      var toMonth = d.getMonth();
      for (var i = 0; i < 40; i++) {
        today = moment(d).add(i, 'days').toDate();
        valid = isValidTime(today.getTime());
        if (opt.startDate && compare_day(today, opt.startDate) < 0) valid = false;
        if (opt.endDate && compare_day(today, opt.endDate) > 0) valid = false;
        days.push({
          date: today,
          type: today.getMonth() == toMonth ? 'toMonth' : 'nextMonth',
          day: today.getDate(),
          time: today.getTime(),
          valid: valid
        });
      }
      var html = [];
      for (var week = 0; week < 6; week++) {
        if (days[week * 7].type == 'nextMonth') break;
        html.push('<tr>');

        for (var day = 0; day < 7; day++) {
          var _day = opt.startOfWeek == 'monday' ? day + 1 : day;
          today = days[week * 7 + _day];
          var highlightToday = moment(today.time).format('L') == moment(now).format('L');
          today.extraClass = '';
          today.tooltip = '';
          if (today.valid && opt.beforeShowDay && typeof opt.beforeShowDay == 'function') {
            var _r = opt.beforeShowDay(moment(today.time).toDate());
            today.valid = _r[0];
            today.extraClass = _r[1] || '';
            today.tooltip = _r[2] || '';
            if (today.tooltip !== '') today.extraClass += ' has-tooltip ';
          }

          var todayDivAttr = {
            time: today.time,
            'data-tooltip': today.tooltip,
            'class': 'day ' + today.type + ' ' + today.extraClass + ' ' + (today.valid ? 'valid' : 'invalid') + ' ' + (highlightToday ? 'real-today' : '')
          };

          if (day === 0 && opt.showWeekNumbers) {
            html.push('<td><div class="week-number" data-start-time="' + today.time + '">' + opt.getWeekNumber(today.date) + '</div></td>');
          }

          html.push('<td ' + attributesCallbacks({}, opt.dayTdAttrs, today) + '><div ' + attributesCallbacks(todayDivAttr, opt.dayDivAttrs, today) + '>' + showDayHTML(today.time, today.day) + '</div></td>');
        }
        html.push('</tr>');
      }
      return html.join('');
    }

    function showDayHTML(time, date) {
      if (opt.showDateFilter && typeof opt.showDateFilter == 'function') return opt.showDateFilter(time, date);
      return date;
    }

    function getLanguages() {
      if (opt.language == 'auto') {
        var language = navigator.language ? navigator.language : navigator.browserLanguage;
        if (!language) {
          return $.dateRangePickerLanguages['default'];
        }
        language = language.toLowerCase();
        if (language in $.dateRangePickerLanguages) {
          return $.dateRangePickerLanguages[language];
        }

        return $.dateRangePickerLanguages['default'];
      } else if (opt.language && opt.language in $.dateRangePickerLanguages) {
        return $.dateRangePickerLanguages[opt.language];
      } else {
        return $.dateRangePickerLanguages['default'];
      }
    }

    /**
     * Translate language string, try both the provided translation key, as the lower case version
     */
    function translate(translationKey) {
      var translationKeyLowerCase = translationKey.toLowerCase();
      var result = translationKey in languages ? languages[translationKey] : translationKeyLowerCase in languages ? languages[translationKeyLowerCase] : null;
      var defaultLanguage = $.dateRangePickerLanguages['default'];
      if (result == null) result = translationKey in defaultLanguage ? defaultLanguage[translationKey] : translationKeyLowerCase in defaultLanguage ? defaultLanguage[translationKeyLowerCase] : '';

      return result;
    }

    function getDefaultTime() {
      var defaultTime = opt.defaultTime ? opt.defaultTime : new Date();

      if (opt.lookBehind) {
        if (opt.startDate && compare_month(defaultTime, opt.startDate) < 0) defaultTime = nextMonth(moment(opt.startDate).toDate());
        if (opt.endDate && compare_month(defaultTime, opt.endDate) > 0) defaultTime = moment(opt.endDate).toDate();
      } else {
        if (opt.startDate && compare_month(defaultTime, opt.startDate) < 0) defaultTime = moment(opt.startDate).toDate();
        if (opt.endDate && compare_month(nextMonth(defaultTime), opt.endDate) > 0) defaultTime = prevMonth(moment(opt.endDate).toDate());
      }

      if (opt.singleDate) {
        if (opt.startDate && compare_month(defaultTime, opt.startDate) < 0) defaultTime = moment(opt.startDate).toDate();
        if (opt.endDate && compare_month(defaultTime, opt.endDate) > 0) defaultTime = moment(opt.endDate).toDate();
      }

      return defaultTime;
    }

    function resetMonthsView(time) {
      if (!time) {
        time = getDefaultTime();
      }

      if (opt.lookBehind) {
        showMonth(prevMonth(time), 'month1');
        showMonth(time, 'month2');
      } else {
        showMonth(time, 'month1');
        showMonth(nextMonth(time), 'month2');
      }

      if (opt.singleDate) {
        showMonth(time, 'month1');
      }

      showSelectedDays();
      showGap();
    }

    function timePicker() {
      var setTimeStart = moment($('.start-time input[type="time"]').val(), 'hh:mm');
      var setTimeEnd = moment($('.end-time input[type="time"]').val(), 'hh:mm');

      $('.start-time .up').click(function () {

        setTimeStart = moment(setTimeStart).add(30 - setTimeStart.minute() % 30, 'minutes');
        $('.start-time input[type="time"]').attr({
          'value': setTimeStart.format('hh:mm')
        });
        showSelectedInfo();
      });
      $('.start-time .down').click(function () {
        setTimeStart = moment(setTimeStart).subtract(30 + setTimeStart.minute() % 30, 'minutes');
        $('.start-time input[type="time"]').attr({
          'value': setTimeStart.format('hh:mm')
        });
        showSelectedInfo();
      });
      $('.end-time .up').click(function () {
        setTimeEnd = moment(setTimeEnd).add(30 - setTimeEnd.minute() % 30, 'minutes');
        $('.end-time input[type="time"]').attr({
          'value': setTimeEnd.format('hh:mm')
        });
        showSelectedInfo();
      });
      $('.end-time .down').click(function () {
        setTimeEnd = moment(setTimeEnd).subtract(30 + setTimeEnd.minute() % 30, 'minutes');
        $('.end-time input[type="time"]').attr({
          'value': setTimeEnd.format('hh:mm')
        });
        showSelectedInfo();
      });

      $('.am-pm .up-arrow, .am-pm .down-arrow').click(function () {
        if ($(this).siblings('.showing').hasClass('am')) {
          $(this).siblings('.showing').removeClass('am').addClass('pm').text('PM');
        } else if ($('.am-pm .showing').hasClass('pm')) {
          $(this).siblings('.showing').removeClass('pm').addClass('am').text('AM');
        }
      });
    }
  };
});
/*!
Chosen, a Select Box Enhancer for jQuery and Prototype
by Patrick Filler for Harvest, http://getharvest.com

Version 1.7.0
Full source at https://github.com/harvesthq/chosen
Copyright (c) 2011-2017 Harvest http://getharvest.com

MIT License, https://github.com/harvesthq/chosen/blob/master/LICENSE.md
This file is generated by `grunt build`, do not edit it by hand.
*/

(function () {
  var $,
      AbstractChosen,
      Chosen,
      SelectParser,
      _ref,
      __bind = function (fn, me) {
    return function () {
      return fn.apply(me, arguments);
    };
  },
      __hasProp = {}.hasOwnProperty,
      __extends = function (child, parent) {
    for (var key in parent) {
      if (__hasProp.call(parent, key)) child[key] = parent[key];
    }function ctor() {
      this.constructor = child;
    }ctor.prototype = parent.prototype;child.prototype = new ctor();child.__super__ = parent.prototype;return child;
  };

  SelectParser = function () {
    function SelectParser() {
      this.options_index = 0;
      this.parsed = [];
    }

    SelectParser.prototype.add_node = function (child) {
      if (child.nodeName.toUpperCase() === "OPTGROUP") {
        return this.add_group(child);
      } else {
        return this.add_option(child);
      }
    };

    SelectParser.prototype.add_group = function (group) {
      var group_position, option, _i, _len, _ref, _results;
      group_position = this.parsed.length;
      this.parsed.push({
        array_index: group_position,
        group: true,
        label: this.escapeExpression(group.label),
        title: group.title ? group.title : void 0,
        children: 0,
        disabled: group.disabled,
        classes: group.className
      });
      _ref = group.childNodes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        _results.push(this.add_option(option, group_position, group.disabled));
      }
      return _results;
    };

    SelectParser.prototype.add_option = function (option, group_position, group_disabled) {
      if (option.nodeName.toUpperCase() === "OPTION") {
        if (option.text !== "") {
          if (group_position != null) {
            this.parsed[group_position].children += 1;
          }
          this.parsed.push({
            array_index: this.parsed.length,
            options_index: this.options_index,
            value: option.value,
            text: option.text,
            html: option.innerHTML,
            title: option.title ? option.title : void 0,
            selected: option.selected,
            disabled: group_disabled === true ? group_disabled : option.disabled,
            group_array_index: group_position,
            group_label: group_position != null ? this.parsed[group_position].label : null,
            classes: option.className,
            style: option.style.cssText
          });
        } else {
          this.parsed.push({
            array_index: this.parsed.length,
            options_index: this.options_index,
            empty: true
          });
        }
        return this.options_index += 1;
      }
    };

    SelectParser.prototype.escapeExpression = function (text) {
      var map, unsafe_chars;
      if (text == null || text === false) {
        return "";
      }
      if (!/[\&\<\>\"\'\`]/.test(text)) {
        return text;
      }
      map = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "`": "&#x60;"
      };
      unsafe_chars = /&(?!\w+;)|[\<\>\"\'\`]/g;
      return text.replace(unsafe_chars, function (chr) {
        return map[chr] || "&amp;";
      });
    };

    return SelectParser;
  }();

  SelectParser.select_to_array = function (select) {
    var child, parser, _i, _len, _ref;
    parser = new SelectParser();
    _ref = select.childNodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      parser.add_node(child);
    }
    return parser.parsed;
  };

  AbstractChosen = function () {
    function AbstractChosen(form_field, options) {
      this.form_field = form_field;
      this.options = options != null ? options : {};
      this.label_click_handler = __bind(this.label_click_handler, this);
      if (!AbstractChosen.browser_is_supported()) {
        return;
      }
      this.is_multiple = this.form_field.multiple;
      this.set_default_text();
      this.set_default_values();
      this.setup();
      this.set_up_html();
      this.register_observers();
      this.on_ready();
    }

    AbstractChosen.prototype.set_default_values = function () {
      var _this = this;
      this.click_test_action = function (evt) {
        return _this.test_active_click(evt);
      };
      this.activate_action = function (evt) {
        return _this.activate_field(evt);
      };
      this.active_field = false;
      this.mouse_on_container = false;
      this.results_showing = false;
      this.result_highlighted = null;
      this.is_rtl = this.options.rtl || /\bchosen-rtl\b/.test(this.form_field.className);
      this.allow_single_deselect = this.options.allow_single_deselect != null && this.form_field.options[0] != null && this.form_field.options[0].text === "" ? this.options.allow_single_deselect : false;
      this.disable_search_threshold = this.options.disable_search_threshold || 0;
      this.disable_search = this.options.disable_search || false;
      this.enable_split_word_search = this.options.enable_split_word_search != null ? this.options.enable_split_word_search : true;
      this.group_search = this.options.group_search != null ? this.options.group_search : true;
      this.search_contains = this.options.search_contains || false;
      this.single_backstroke_delete = this.options.single_backstroke_delete != null ? this.options.single_backstroke_delete : true;
      this.max_selected_options = this.options.max_selected_options || Infinity;
      this.inherit_select_classes = this.options.inherit_select_classes || false;
      this.display_selected_options = this.options.display_selected_options != null ? this.options.display_selected_options : true;
      this.display_disabled_options = this.options.display_disabled_options != null ? this.options.display_disabled_options : true;
      this.include_group_label_in_selected = this.options.include_group_label_in_selected || false;
      this.max_shown_results = this.options.max_shown_results || Number.POSITIVE_INFINITY;
      this.case_sensitive_search = this.options.case_sensitive_search || false;
      return this.hide_results_on_select = this.options.hide_results_on_select != null ? this.options.hide_results_on_select : true;
    };

    AbstractChosen.prototype.set_default_text = function () {
      if (this.form_field.getAttribute("data-placeholder")) {
        this.default_text = this.form_field.getAttribute("data-placeholder");
      } else if (this.is_multiple) {
        this.default_text = this.options.placeholder_text_multiple || this.options.placeholder_text || AbstractChosen.default_multiple_text;
      } else {
        this.default_text = this.options.placeholder_text_single || this.options.placeholder_text || AbstractChosen.default_single_text;
      }
      this.default_text = this.escape_html(this.default_text);
      return this.results_none_found = this.form_field.getAttribute("data-no_results_text") || this.options.no_results_text || AbstractChosen.default_no_result_text;
    };

    AbstractChosen.prototype.choice_label = function (item) {
      if (this.include_group_label_in_selected && item.group_label != null) {
        return "<b class='group-name'>" + item.group_label + "</b>" + item.html;
      } else {
        return item.html;
      }
    };

    AbstractChosen.prototype.mouse_enter = function () {
      return this.mouse_on_container = true;
    };

    AbstractChosen.prototype.mouse_leave = function () {
      return this.mouse_on_container = false;
    };

    AbstractChosen.prototype.input_focus = function (evt) {
      var _this = this;
      if (this.is_multiple) {
        if (!this.active_field) {
          return setTimeout(function () {
            return _this.container_mousedown();
          }, 50);
        }
      } else {
        if (!this.active_field) {
          return this.activate_field();
        }
      }
    };

    AbstractChosen.prototype.input_blur = function (evt) {
      var _this = this;
      if (!this.mouse_on_container) {
        this.active_field = false;
        return setTimeout(function () {
          return _this.blur_test();
        }, 100);
      }
    };

    AbstractChosen.prototype.label_click_handler = function (evt) {
      if (this.is_multiple) {
        return this.container_mousedown(evt);
      } else {
        return this.activate_field();
      }
    };

    AbstractChosen.prototype.results_option_build = function (options) {
      var content, data, data_content, shown_results, _i, _len, _ref;
      content = '';
      shown_results = 0;
      _ref = this.results_data;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        data = _ref[_i];
        data_content = '';
        if (data.group) {
          data_content = this.result_add_group(data);
        } else {
          data_content = this.result_add_option(data);
        }
        if (data_content !== '') {
          shown_results++;
          content += data_content;
        }
        if (options != null ? options.first : void 0) {
          if (data.selected && this.is_multiple) {
            this.choice_build(data);
          } else if (data.selected && !this.is_multiple) {
            this.single_set_selected_text(this.choice_label(data));
          }
        }
        if (shown_results >= this.max_shown_results) {
          break;
        }
      }
      return content;
    };

    AbstractChosen.prototype.result_add_option = function (option) {
      var classes, option_el;
      if (!option.search_match) {
        return '';
      }
      if (!this.include_option_in_results(option)) {
        return '';
      }
      classes = [];
      if (!option.disabled && !(option.selected && this.is_multiple)) {
        classes.push("active-result");
      }
      if (option.disabled && !(option.selected && this.is_multiple)) {
        classes.push("disabled-result");
      }
      if (option.selected) {
        classes.push("result-selected");
      }
      if (option.group_array_index != null) {
        classes.push("group-option");
      }
      if (option.classes !== "") {
        classes.push(option.classes);
      }
      option_el = document.createElement("li");
      option_el.className = classes.join(" ");
      option_el.style.cssText = option.style;
      option_el.setAttribute("data-option-array-index", option.array_index);
      option_el.innerHTML = option.search_text;
      if (option.title) {
        option_el.title = option.title;
      }
      return this.outerHTML(option_el);
    };

    AbstractChosen.prototype.result_add_group = function (group) {
      var classes, group_el;
      if (!(group.search_match || group.group_match)) {
        return '';
      }
      if (!(group.active_options > 0)) {
        return '';
      }
      classes = [];
      classes.push("group-result");
      if (group.classes) {
        classes.push(group.classes);
      }
      group_el = document.createElement("li");
      group_el.className = classes.join(" ");
      group_el.innerHTML = group.search_text;
      if (group.title) {
        group_el.title = group.title;
      }
      return this.outerHTML(group_el);
    };

    AbstractChosen.prototype.results_update_field = function () {
      this.set_default_text();
      if (!this.is_multiple) {
        this.results_reset_cleanup();
      }
      this.result_clear_highlight();
      this.results_build();
      if (this.results_showing) {
        return this.winnow_results();
      }
    };

    AbstractChosen.prototype.reset_single_select_options = function () {
      var result, _i, _len, _ref, _results;
      _ref = this.results_data;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        result = _ref[_i];
        if (result.selected) {
          _results.push(result.selected = false);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    AbstractChosen.prototype.results_toggle = function () {
      if (this.results_showing) {
        return this.results_hide();
      } else {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.results_search = function (evt) {
      if (this.results_showing) {
        return this.winnow_results();
      } else {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.winnow_results = function () {
      var escapedSearchText, highlightRegex, option, regex, results, results_group, searchText, startpos, text, _i, _len, _ref;
      this.no_results_clear();
      results = 0;
      searchText = this.get_search_text();
      escapedSearchText = searchText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      regex = this.get_search_regex(escapedSearchText);
      highlightRegex = this.get_highlight_regex(escapedSearchText);
      _ref = this.results_data;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        option.search_match = false;
        results_group = null;
        if (this.include_option_in_results(option)) {
          if (option.group) {
            option.group_match = false;
            option.active_options = 0;
          }
          if (option.group_array_index != null && this.results_data[option.group_array_index]) {
            results_group = this.results_data[option.group_array_index];
            if (results_group.active_options === 0 && results_group.search_match) {
              results += 1;
            }
            results_group.active_options += 1;
          }
          option.search_text = option.group ? option.label : option.html;
          if (!(option.group && !this.group_search)) {
            option.search_match = this.search_string_match(option.search_text, regex);
            if (option.search_match && !option.group) {
              results += 1;
            }
            if (option.search_match) {
              if (searchText.length) {
                startpos = option.search_text.search(highlightRegex);
                text = option.search_text.substr(0, startpos + searchText.length) + '</em>' + option.search_text.substr(startpos + searchText.length);
                option.search_text = text.substr(0, startpos) + '<em>' + text.substr(startpos);
              }
              if (results_group != null) {
                results_group.group_match = true;
              }
            } else if (option.group_array_index != null && this.results_data[option.group_array_index].search_match) {
              option.search_match = true;
            }
          }
        }
      }
      this.result_clear_highlight();
      if (results < 1 && searchText.length) {
        this.update_results_content("");
        return this.no_results(searchText);
      } else {
        this.update_results_content(this.results_option_build());
        return this.winnow_results_set_highlight();
      }
    };

    AbstractChosen.prototype.get_search_regex = function (escaped_search_string) {
      var regex_anchor, regex_flag;
      regex_anchor = this.search_contains ? "" : "^";
      regex_flag = this.case_sensitive_search ? "" : "i";
      return new RegExp(regex_anchor + escaped_search_string, regex_flag);
    };

    AbstractChosen.prototype.get_highlight_regex = function (escaped_search_string) {
      var regex_anchor, regex_flag;
      regex_anchor = this.search_contains ? "" : "\\b";
      regex_flag = this.case_sensitive_search ? "" : "i";
      return new RegExp(regex_anchor + escaped_search_string, regex_flag);
    };

    AbstractChosen.prototype.search_string_match = function (search_string, regex) {
      var part, parts, _i, _len;
      if (regex.test(search_string)) {
        return true;
      } else if (this.enable_split_word_search && (search_string.indexOf(" ") >= 0 || search_string.indexOf("[") === 0)) {
        parts = search_string.replace(/\[|\]/g, "").split(" ");
        if (parts.length) {
          for (_i = 0, _len = parts.length; _i < _len; _i++) {
            part = parts[_i];
            if (regex.test(part)) {
              return true;
            }
          }
        }
      }
    };

    AbstractChosen.prototype.choices_count = function () {
      var option, _i, _len, _ref;
      if (this.selected_option_count != null) {
        return this.selected_option_count;
      }
      this.selected_option_count = 0;
      _ref = this.form_field.options;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        if (option.selected) {
          this.selected_option_count += 1;
        }
      }
      return this.selected_option_count;
    };

    AbstractChosen.prototype.choices_click = function (evt) {
      evt.preventDefault();
      this.activate_field();
      if (!(this.results_showing || this.is_disabled)) {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.keydown_checker = function (evt) {
      var stroke, _ref;
      stroke = (_ref = evt.which) != null ? _ref : evt.keyCode;
      this.search_field_scale();
      if (stroke !== 8 && this.pending_backstroke) {
        this.clear_backstroke();
      }
      switch (stroke) {
        case 8:
          this.backstroke_length = this.get_search_field_value().length;
          break;
        case 9:
          if (this.results_showing && !this.is_multiple) {
            this.result_select(evt);
          }
          this.mouse_on_container = false;
          break;
        case 13:
          if (this.results_showing) {
            evt.preventDefault();
          }
          break;
        case 27:
          if (this.results_showing) {
            evt.preventDefault();
          }
          break;
        case 32:
          if (this.disable_search) {
            evt.preventDefault();
          }
          break;
        case 38:
          evt.preventDefault();
          this.keyup_arrow();
          break;
        case 40:
          evt.preventDefault();
          this.keydown_arrow();
          break;
      }
    };

    AbstractChosen.prototype.keyup_checker = function (evt) {
      var stroke, _ref;
      stroke = (_ref = evt.which) != null ? _ref : evt.keyCode;
      this.search_field_scale();
      switch (stroke) {
        case 8:
          if (this.is_multiple && this.backstroke_length < 1 && this.choices_count() > 0) {
            this.keydown_backstroke();
          } else if (!this.pending_backstroke) {
            this.result_clear_highlight();
            this.results_search();
          }
          break;
        case 13:
          evt.preventDefault();
          if (this.results_showing) {
            this.result_select(evt);
          }
          break;
        case 27:
          if (this.results_showing) {
            this.results_hide();
          }
          break;
        case 9:
        case 16:
        case 17:
        case 18:
        case 38:
        case 40:
        case 91:
          break;
        default:
          this.results_search();
          break;
      }
    };

    AbstractChosen.prototype.clipboard_event_checker = function (evt) {
      var _this = this;
      if (this.is_disabled) {
        return;
      }
      return setTimeout(function () {
        return _this.results_search();
      }, 50);
    };

    AbstractChosen.prototype.container_width = function () {
      if (this.options.width != null) {
        return this.options.width;
      } else {
        return "" + this.form_field.offsetWidth + "px";
      }
    };

    AbstractChosen.prototype.include_option_in_results = function (option) {
      if (this.is_multiple && !this.display_selected_options && option.selected) {
        return false;
      }
      if (!this.display_disabled_options && option.disabled) {
        return false;
      }
      if (option.empty) {
        return false;
      }
      return true;
    };

    AbstractChosen.prototype.search_results_touchstart = function (evt) {
      this.touch_started = true;
      return this.search_results_mouseover(evt);
    };

    AbstractChosen.prototype.search_results_touchmove = function (evt) {
      this.touch_started = false;
      return this.search_results_mouseout(evt);
    };

    AbstractChosen.prototype.search_results_touchend = function (evt) {
      if (this.touch_started) {
        return this.search_results_mouseup(evt);
      }
    };

    AbstractChosen.prototype.outerHTML = function (element) {
      var tmp;
      if (element.outerHTML) {
        return element.outerHTML;
      }
      tmp = document.createElement("div");
      tmp.appendChild(element);
      return tmp.innerHTML;
    };

    AbstractChosen.prototype.get_single_html = function () {
      return "<a class=\"chosen-single chosen-default\">\n  <span>" + this.default_text + "</span>\n  <div><b></b></div>\n</a>\n<div class=\"chosen-drop\">\n  <div class=\"chosen-search\">\n    <input class=\"chosen-search-input\" type=\"text\" autocomplete=\"off\" />\n  </div>\n  <ul class=\"chosen-results\"></ul>\n</div>";
    };

    AbstractChosen.prototype.get_multi_html = function () {
      return "<ul class=\"chosen-choices\">\n  <li class=\"search-field\">\n    <input class=\"chosen-search-input\" type=\"text\" autocomplete=\"off\" value=\"" + this.default_text + "\" />\n  </li>\n</ul>\n<div class=\"chosen-drop\">\n  <ul class=\"chosen-results\"></ul>\n</div>";
    };

    AbstractChosen.prototype.get_no_results_html = function (terms) {
      return "<li class=\"no-results\">\n  " + this.results_none_found + " <span>" + terms + "</span>\n</li>";
    };

    AbstractChosen.browser_is_supported = function () {
      if ("Microsoft Internet Explorer" === window.navigator.appName) {
        return document.documentMode >= 8;
      }
      if (/iP(od|hone)/i.test(window.navigator.userAgent) || /IEMobile/i.test(window.navigator.userAgent) || /Windows Phone/i.test(window.navigator.userAgent) || /BlackBerry/i.test(window.navigator.userAgent) || /BB10/i.test(window.navigator.userAgent) || /Android.*Mobile/i.test(window.navigator.userAgent)) {
        return false;
      }
      return true;
    };

    AbstractChosen.default_multiple_text = "Select Some Options";

    AbstractChosen.default_single_text = "Select an Option";

    AbstractChosen.default_no_result_text = "No results match";

    return AbstractChosen;
  }();

  $ = jQuery;

  $.fn.extend({
    chosen: function (options) {
      if (!AbstractChosen.browser_is_supported()) {
        return this;
      }
      return this.each(function (input_field) {
        var $this, chosen;
        $this = $(this);
        chosen = $this.data('chosen');
        if (options === 'destroy') {
          if (chosen instanceof Chosen) {
            chosen.destroy();
          }
          return;
        }
        if (!(chosen instanceof Chosen)) {
          $this.data('chosen', new Chosen(this, options));
        }
      });
    }
  });

  Chosen = function (_super) {
    __extends(Chosen, _super);

    function Chosen() {
      _ref = Chosen.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Chosen.prototype.setup = function () {
      this.form_field_jq = $(this.form_field);
      return this.current_selectedIndex = this.form_field.selectedIndex;
    };

    Chosen.prototype.set_up_html = function () {
      var container_classes, container_props;
      container_classes = ["chosen-container"];
      container_classes.push("chosen-container-" + (this.is_multiple ? "multi" : "single"));
      if (this.inherit_select_classes && this.form_field.className) {
        container_classes.push(this.form_field.className);
      }
      if (this.is_rtl) {
        container_classes.push("chosen-rtl");
      }
      container_props = {
        'class': container_classes.join(' '),
        'title': this.form_field.title
      };
      if (this.form_field.id.length) {
        container_props.id = this.form_field.id.replace(/[^\w]/g, '_') + "_chosen";
      }
      this.container = $("<div />", container_props);
      this.container.width(this.container_width());
      if (this.is_multiple) {
        this.container.html(this.get_multi_html());
      } else {
        this.container.html(this.get_single_html());
      }
      this.form_field_jq.hide().after(this.container);
      this.dropdown = this.container.find('div.chosen-drop').first();
      this.search_field = this.container.find('input').first();
      this.search_results = this.container.find('ul.chosen-results').first();
      this.search_field_scale();
      this.search_no_results = this.container.find('li.no-results').first();
      if (this.is_multiple) {
        this.search_choices = this.container.find('ul.chosen-choices').first();
        this.search_container = this.container.find('li.search-field').first();
      } else {
        this.search_container = this.container.find('div.chosen-search').first();
        this.selected_item = this.container.find('.chosen-single').first();
      }
      this.results_build();
      this.set_tab_index();
      return this.set_label_behavior();
    };

    Chosen.prototype.on_ready = function () {
      return this.form_field_jq.trigger("chosen:ready", {
        chosen: this
      });
    };

    Chosen.prototype.register_observers = function () {
      var _this = this;
      this.container.bind('touchstart.chosen', function (evt) {
        _this.container_mousedown(evt);
      });
      this.container.bind('touchend.chosen', function (evt) {
        _this.container_mouseup(evt);
      });
      this.container.bind('mousedown.chosen', function (evt) {
        _this.container_mousedown(evt);
      });
      this.container.bind('mouseup.chosen', function (evt) {
        _this.container_mouseup(evt);
      });
      this.container.bind('mouseenter.chosen', function (evt) {
        _this.mouse_enter(evt);
      });
      this.container.bind('mouseleave.chosen', function (evt) {
        _this.mouse_leave(evt);
      });
      this.search_results.bind('mouseup.chosen', function (evt) {
        _this.search_results_mouseup(evt);
      });
      this.search_results.bind('mouseover.chosen', function (evt) {
        _this.search_results_mouseover(evt);
      });
      this.search_results.bind('mouseout.chosen', function (evt) {
        _this.search_results_mouseout(evt);
      });
      this.search_results.bind('mousewheel.chosen DOMMouseScroll.chosen', function (evt) {
        _this.search_results_mousewheel(evt);
      });
      this.search_results.bind('touchstart.chosen', function (evt) {
        _this.search_results_touchstart(evt);
      });
      this.search_results.bind('touchmove.chosen', function (evt) {
        _this.search_results_touchmove(evt);
      });
      this.search_results.bind('touchend.chosen', function (evt) {
        _this.search_results_touchend(evt);
      });
      this.form_field_jq.bind("chosen:updated.chosen", function (evt) {
        _this.results_update_field(evt);
      });
      this.form_field_jq.bind("chosen:activate.chosen", function (evt) {
        _this.activate_field(evt);
      });
      this.form_field_jq.bind("chosen:open.chosen", function (evt) {
        _this.container_mousedown(evt);
      });
      this.form_field_jq.bind("chosen:close.chosen", function (evt) {
        _this.close_field(evt);
      });
      this.search_field.bind('blur.chosen', function (evt) {
        _this.input_blur(evt);
      });
      this.search_field.bind('keyup.chosen', function (evt) {
        _this.keyup_checker(evt);
      });
      this.search_field.bind('keydown.chosen', function (evt) {
        _this.keydown_checker(evt);
      });
      this.search_field.bind('focus.chosen', function (evt) {
        _this.input_focus(evt);
      });
      this.search_field.bind('cut.chosen', function (evt) {
        _this.clipboard_event_checker(evt);
      });
      this.search_field.bind('paste.chosen', function (evt) {
        _this.clipboard_event_checker(evt);
      });
      if (this.is_multiple) {
        return this.search_choices.bind('click.chosen', function (evt) {
          _this.choices_click(evt);
        });
      } else {
        return this.container.bind('click.chosen', function (evt) {
          evt.preventDefault();
        });
      }
    };

    Chosen.prototype.destroy = function () {
      $(this.container[0].ownerDocument).unbind('click.chosen', this.click_test_action);
      if (this.form_field_label.length > 0) {
        this.form_field_label.unbind('click.chosen');
      }
      if (this.search_field[0].tabIndex) {
        this.form_field_jq[0].tabIndex = this.search_field[0].tabIndex;
      }
      this.container.remove();
      this.form_field_jq.removeData('chosen');
      return this.form_field_jq.show();
    };

    Chosen.prototype.search_field_disabled = function () {
      this.is_disabled = this.form_field.disabled || this.form_field_jq.parents('fieldset').is(':disabled');
      this.container.toggleClass('chosen-disabled', this.is_disabled);
      this.search_field[0].disabled = this.is_disabled;
      if (!this.is_multiple) {
        this.selected_item.unbind('focus.chosen', this.activate_field);
      }
      if (this.is_disabled) {
        return this.close_field();
      } else if (!this.is_multiple) {
        return this.selected_item.bind('focus.chosen', this.activate_field);
      }
    };

    Chosen.prototype.container_mousedown = function (evt) {
      var _ref1;
      if (this.is_disabled) {
        return;
      }
      if (evt && ((_ref1 = evt.type) === 'mousedown' || _ref1 === 'touchstart') && !this.results_showing) {
        evt.preventDefault();
      }
      if (!(evt != null && $(evt.target).hasClass("search-choice-close"))) {
        if (!this.active_field) {
          if (this.is_multiple) {
            this.search_field.val("");
          }
          $(this.container[0].ownerDocument).bind('click.chosen', this.click_test_action);
          this.results_show();
        } else if (!this.is_multiple && evt && ($(evt.target)[0] === this.selected_item[0] || $(evt.target).parents("a.chosen-single").length)) {
          evt.preventDefault();
          this.results_toggle();
        }
        return this.activate_field();
      }
    };

    Chosen.prototype.container_mouseup = function (evt) {
      if (evt.target.nodeName === "ABBR" && !this.is_disabled) {
        return this.results_reset(evt);
      }
    };

    Chosen.prototype.search_results_mousewheel = function (evt) {
      var delta;
      if (evt.originalEvent) {
        delta = evt.originalEvent.deltaY || -evt.originalEvent.wheelDelta || evt.originalEvent.detail;
      }
      if (delta != null) {
        evt.preventDefault();
        if (evt.type === 'DOMMouseScroll') {
          delta = delta * 40;
        }
        return this.search_results.scrollTop(delta + this.search_results.scrollTop());
      }
    };

    Chosen.prototype.blur_test = function (evt) {
      if (!this.active_field && this.container.hasClass("chosen-container-active")) {
        return this.close_field();
      }
    };

    Chosen.prototype.close_field = function () {
      $(this.container[0].ownerDocument).unbind("click.chosen", this.click_test_action);
      this.active_field = false;
      this.results_hide();
      this.container.removeClass("chosen-container-active");
      this.clear_backstroke();
      this.show_search_field_default();
      this.search_field_scale();
      return this.search_field.blur();
    };

    Chosen.prototype.activate_field = function () {
      if (this.is_disabled) {
        return;
      }
      this.container.addClass("chosen-container-active");
      this.active_field = true;
      this.search_field.val(this.search_field.val());
      return this.search_field.focus();
    };

    Chosen.prototype.test_active_click = function (evt) {
      var active_container;
      active_container = $(evt.target).closest('.chosen-container');
      if (active_container.length && this.container[0] === active_container[0]) {
        return this.active_field = true;
      } else {
        return this.close_field();
      }
    };

    Chosen.prototype.results_build = function () {
      this.parsing = true;
      this.selected_option_count = null;
      this.results_data = SelectParser.select_to_array(this.form_field);
      if (this.is_multiple) {
        this.search_choices.find("li.search-choice").remove();
      } else if (!this.is_multiple) {
        this.single_set_selected_text();
        if (this.disable_search || this.form_field.options.length <= this.disable_search_threshold) {
          this.search_field[0].readOnly = true;
          this.container.addClass("chosen-container-single-nosearch");
        } else {
          this.search_field[0].readOnly = false;
          this.container.removeClass("chosen-container-single-nosearch");
        }
      }
      this.update_results_content(this.results_option_build({
        first: true
      }));
      this.search_field_disabled();
      this.show_search_field_default();
      this.search_field_scale();
      return this.parsing = false;
    };

    Chosen.prototype.result_do_highlight = function (el) {
      var high_bottom, high_top, maxHeight, visible_bottom, visible_top;
      if (el.length) {
        this.result_clear_highlight();
        this.result_highlight = el;
        this.result_highlight.addClass("highlighted");
        maxHeight = parseInt(this.search_results.css("maxHeight"), 10);
        visible_top = this.search_results.scrollTop();
        visible_bottom = maxHeight + visible_top;
        high_top = this.result_highlight.position().top + this.search_results.scrollTop();
        high_bottom = high_top + this.result_highlight.outerHeight();
        if (high_bottom >= visible_bottom) {
          return this.search_results.scrollTop(high_bottom - maxHeight > 0 ? high_bottom - maxHeight : 0);
        } else if (high_top < visible_top) {
          return this.search_results.scrollTop(high_top);
        }
      }
    };

    Chosen.prototype.result_clear_highlight = function () {
      if (this.result_highlight) {
        this.result_highlight.removeClass("highlighted");
      }
      return this.result_highlight = null;
    };

    Chosen.prototype.results_show = function () {
      if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
        this.form_field_jq.trigger("chosen:maxselected", {
          chosen: this
        });
        return false;
      }
      this.container.addClass("chosen-with-drop");
      this.results_showing = true;
      this.search_field.focus();
      this.search_field.val(this.get_search_field_value());
      this.winnow_results();
      return this.form_field_jq.trigger("chosen:showing_dropdown", {
        chosen: this
      });
    };

    Chosen.prototype.update_results_content = function (content) {
      return this.search_results.html(content);
    };

    Chosen.prototype.results_hide = function () {
      if (this.results_showing) {
        this.result_clear_highlight();
        this.container.removeClass("chosen-with-drop");
        this.form_field_jq.trigger("chosen:hiding_dropdown", {
          chosen: this
        });
      }
      return this.results_showing = false;
    };

    Chosen.prototype.set_tab_index = function (el) {
      var ti;
      if (this.form_field.tabIndex) {
        ti = this.form_field.tabIndex;
        this.form_field.tabIndex = -1;
        return this.search_field[0].tabIndex = ti;
      }
    };

    Chosen.prototype.set_label_behavior = function () {
      this.form_field_label = this.form_field_jq.parents("label");
      if (!this.form_field_label.length && this.form_field.id.length) {
        this.form_field_label = $("label[for='" + this.form_field.id + "']");
      }
      if (this.form_field_label.length > 0) {
        return this.form_field_label.bind('click.chosen', this.label_click_handler);
      }
    };

    Chosen.prototype.show_search_field_default = function () {
      if (this.is_multiple && this.choices_count() < 1 && !this.active_field) {
        this.search_field.val(this.default_text);
        return this.search_field.addClass("default");
      } else {
        this.search_field.val("");
        return this.search_field.removeClass("default");
      }
    };

    Chosen.prototype.search_results_mouseup = function (evt) {
      var target;
      target = $(evt.target).hasClass("active-result") ? $(evt.target) : $(evt.target).parents(".active-result").first();
      if (target.length) {
        this.result_highlight = target;
        this.result_select(evt);
        return this.search_field.focus();
      }
    };

    Chosen.prototype.search_results_mouseover = function (evt) {
      var target;
      target = $(evt.target).hasClass("active-result") ? $(evt.target) : $(evt.target).parents(".active-result").first();
      if (target) {
        return this.result_do_highlight(target);
      }
    };

    Chosen.prototype.search_results_mouseout = function (evt) {
      if ($(evt.target).hasClass("active-result" || $(evt.target).parents('.active-result').first())) {
        return this.result_clear_highlight();
      }
    };

    Chosen.prototype.choice_build = function (item) {
      var choice,
          close_link,
          _this = this;
      choice = $('<li />', {
        "class": "search-choice"
      }).html("<span>" + this.choice_label(item) + "</span>");
      if (item.disabled) {
        choice.addClass('search-choice-disabled');
      } else {
        close_link = $('<a />', {
          "class": 'search-choice-close',
          'data-option-array-index': item.array_index
        });
        close_link.bind('click.chosen', function (evt) {
          return _this.choice_destroy_link_click(evt);
        });
        choice.append(close_link);
      }
      return this.search_container.before(choice);
    };

    Chosen.prototype.choice_destroy_link_click = function (evt) {
      evt.preventDefault();
      evt.stopPropagation();
      if (!this.is_disabled) {
        return this.choice_destroy($(evt.target));
      }
    };

    Chosen.prototype.choice_destroy = function (link) {
      if (this.result_deselect(link[0].getAttribute("data-option-array-index"))) {
        if (this.active_field) {
          this.search_field.focus();
        } else {
          this.show_search_field_default();
        }
        if (this.is_multiple && this.choices_count() > 0 && this.get_search_field_value().length < 1) {
          this.results_hide();
        }
        link.parents('li').first().remove();
        return this.search_field_scale();
      }
    };

    Chosen.prototype.results_reset = function () {
      this.reset_single_select_options();
      this.form_field.options[0].selected = true;
      this.single_set_selected_text();
      this.show_search_field_default();
      this.results_reset_cleanup();
      this.trigger_form_field_change();
      if (this.active_field) {
        return this.results_hide();
      }
    };

    Chosen.prototype.results_reset_cleanup = function () {
      this.current_selectedIndex = this.form_field.selectedIndex;
      return this.selected_item.find("abbr").remove();
    };

    Chosen.prototype.result_select = function (evt) {
      var high, item;
      if (this.result_highlight) {
        high = this.result_highlight;
        this.result_clear_highlight();
        if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
          this.form_field_jq.trigger("chosen:maxselected", {
            chosen: this
          });
          return false;
        }
        if (this.is_multiple) {
          high.removeClass("active-result");
        } else {
          this.reset_single_select_options();
        }
        high.addClass("result-selected");
        item = this.results_data[high[0].getAttribute("data-option-array-index")];
        item.selected = true;
        this.form_field.options[item.options_index].selected = true;
        this.selected_option_count = null;
        if (this.is_multiple) {
          this.choice_build(item);
        } else {
          this.single_set_selected_text(this.choice_label(item));
        }
        if (!(this.is_multiple && (!this.hide_results_on_select || evt.metaKey || evt.ctrlKey))) {
          this.results_hide();
          this.show_search_field_default();
        }
        if (this.is_multiple || this.form_field.selectedIndex !== this.current_selectedIndex) {
          this.trigger_form_field_change({
            selected: this.form_field.options[item.options_index].value
          });
        }
        this.current_selectedIndex = this.form_field.selectedIndex;
        evt.preventDefault();
        return this.search_field_scale();
      }
    };

    Chosen.prototype.single_set_selected_text = function (text) {
      if (text == null) {
        text = this.default_text;
      }
      if (text === this.default_text) {
        this.selected_item.addClass("chosen-default");
      } else {
        this.single_deselect_control_build();
        this.selected_item.removeClass("chosen-default");
      }
      return this.selected_item.find("span").html(text);
    };

    Chosen.prototype.result_deselect = function (pos) {
      var result_data;
      result_data = this.results_data[pos];
      if (!this.form_field.options[result_data.options_index].disabled) {
        result_data.selected = false;
        this.form_field.options[result_data.options_index].selected = false;
        this.selected_option_count = null;
        this.result_clear_highlight();
        if (this.results_showing) {
          this.winnow_results();
        }
        this.trigger_form_field_change({
          deselected: this.form_field.options[result_data.options_index].value
        });
        this.search_field_scale();
        return true;
      } else {
        return false;
      }
    };

    Chosen.prototype.single_deselect_control_build = function () {
      if (!this.allow_single_deselect) {
        return;
      }
      if (!this.selected_item.find("abbr").length) {
        this.selected_item.find("span").first().after("<abbr class=\"search-choice-close\"></abbr>");
      }
      return this.selected_item.addClass("chosen-single-with-deselect");
    };

    Chosen.prototype.get_search_field_value = function () {
      return this.search_field.val();
    };

    Chosen.prototype.get_search_text = function () {
      return this.escape_html($.trim(this.get_search_field_value()));
    };

    Chosen.prototype.escape_html = function (text) {
      return $('<div/>').text(text).html();
    };

    Chosen.prototype.winnow_results_set_highlight = function () {
      var do_high, selected_results;
      selected_results = !this.is_multiple ? this.search_results.find(".result-selected.active-result") : [];
      do_high = selected_results.length ? selected_results.first() : this.search_results.find(".active-result").first();
      if (do_high != null) {
        return this.result_do_highlight(do_high);
      }
    };

    Chosen.prototype.no_results = function (terms) {
      var no_results_html;
      no_results_html = this.get_no_results_html(terms);
      this.search_results.append(no_results_html);
      return this.form_field_jq.trigger("chosen:no_results", {
        chosen: this
      });
    };

    Chosen.prototype.no_results_clear = function () {
      return this.search_results.find(".no-results").remove();
    };

    Chosen.prototype.keydown_arrow = function () {
      var next_sib;
      if (this.results_showing && this.result_highlight) {
        next_sib = this.result_highlight.nextAll("li.active-result").first();
        if (next_sib) {
          return this.result_do_highlight(next_sib);
        }
      } else {
        return this.results_show();
      }
    };

    Chosen.prototype.keyup_arrow = function () {
      var prev_sibs;
      if (!this.results_showing && !this.is_multiple) {
        return this.results_show();
      } else if (this.result_highlight) {
        prev_sibs = this.result_highlight.prevAll("li.active-result");
        if (prev_sibs.length) {
          return this.result_do_highlight(prev_sibs.first());
        } else {
          if (this.choices_count() > 0) {
            this.results_hide();
          }
          return this.result_clear_highlight();
        }
      }
    };

    Chosen.prototype.keydown_backstroke = function () {
      var next_available_destroy;
      if (this.pending_backstroke) {
        this.choice_destroy(this.pending_backstroke.find("a").first());
        return this.clear_backstroke();
      } else {
        next_available_destroy = this.search_container.siblings("li.search-choice").last();
        if (next_available_destroy.length && !next_available_destroy.hasClass("search-choice-disabled")) {
          this.pending_backstroke = next_available_destroy;
          if (this.single_backstroke_delete) {
            return this.keydown_backstroke();
          } else {
            return this.pending_backstroke.addClass("search-choice-focus");
          }
        }
      }
    };

    Chosen.prototype.clear_backstroke = function () {
      if (this.pending_backstroke) {
        this.pending_backstroke.removeClass("search-choice-focus");
      }
      return this.pending_backstroke = null;
    };

    Chosen.prototype.search_field_scale = function () {
      var container_width, div, style, style_block, styles, width, _i, _len;
      if (!this.is_multiple) {
        return;
      }
      style_block = {
        position: 'absolute',
        left: '-1000px',
        top: '-1000px',
        display: 'none',
        whiteSpace: 'pre'
      };
      styles = ['fontSize', 'fontStyle', 'fontWeight', 'fontFamily', 'lineHeight', 'textTransform', 'letterSpacing'];
      for (_i = 0, _len = styles.length; _i < _len; _i++) {
        style = styles[_i];
        style_block[style] = this.search_field.css(style);
      }
      div = $('<div />').css(style_block);
      div.text(this.get_search_field_value());
      $('body').append(div);
      width = div.width() + 25;
      div.remove();
      container_width = this.container.outerWidth();
      width = Math.min(container_width - 10, width);
      return this.search_field.width(width);
    };

    Chosen.prototype.trigger_form_field_change = function (extra) {
      this.form_field_jq.trigger("input", extra);
      return this.form_field_jq.trigger("change", extra);
    };

    return Chosen;
  }(AbstractChosen);
}).call(this);
/* Chosen v1.7.0 | (c) 2011-2017 by Harvest | MIT License, https://github.com/harvesthq/chosen/blob/master/LICENSE.md */
(function () {
  var a,
      b,
      c,
      d,
      e,
      f = function (a, b) {
    return function () {
      return a.apply(b, arguments);
    };
  },
      g = {}.hasOwnProperty,
      h = function (a, b) {
    function c() {
      this.constructor = a;
    }for (var d in b) g.call(b, d) && (a[d] = b[d]);return c.prototype = b.prototype, a.prototype = new c(), a.__super__ = b.prototype, a;
  };d = function () {
    function a() {
      this.options_index = 0, this.parsed = [];
    }return a.prototype.add_node = function (a) {
      return "OPTGROUP" === a.nodeName.toUpperCase() ? this.add_group(a) : this.add_option(a);
    }, a.prototype.add_group = function (a) {
      var b, c, d, e, f, g;for (b = this.parsed.length, this.parsed.push({ array_index: b, group: !0, label: this.escapeExpression(a.label), title: a.title ? a.title : void 0, children: 0, disabled: a.disabled, classes: a.className }), f = a.childNodes, g = [], d = 0, e = f.length; e > d; d++) c = f[d], g.push(this.add_option(c, b, a.disabled));return g;
    }, a.prototype.add_option = function (a, b, c) {
      return "OPTION" === a.nodeName.toUpperCase() ? ("" !== a.text ? (null != b && (this.parsed[b].children += 1), this.parsed.push({ array_index: this.parsed.length, options_index: this.options_index, value: a.value, text: a.text, html: a.innerHTML, title: a.title ? a.title : void 0, selected: a.selected, disabled: c === !0 ? c : a.disabled, group_array_index: b, group_label: null != b ? this.parsed[b].label : null, classes: a.className, style: a.style.cssText })) : this.parsed.push({ array_index: this.parsed.length, options_index: this.options_index, empty: !0 }), this.options_index += 1) : void 0;
    }, a.prototype.escapeExpression = function (a) {
      var b, c;return null == a || a === !1 ? "" : /[\&\<\>\"\'\`]/.test(a) ? (b = { "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;", "`": "&#x60;" }, c = /&(?!\w+;)|[\<\>\"\'\`]/g, a.replace(c, function (a) {
        return b[a] || "&amp;";
      })) : a;
    }, a;
  }(), d.select_to_array = function (a) {
    var b, c, e, f, g;for (c = new d(), g = a.childNodes, e = 0, f = g.length; f > e; e++) b = g[e], c.add_node(b);return c.parsed;
  }, b = function () {
    function a(b, c) {
      this.form_field = b, this.options = null != c ? c : {}, this.label_click_handler = f(this.label_click_handler, this), a.browser_is_supported() && (this.is_multiple = this.form_field.multiple, this.set_default_text(), this.set_default_values(), this.setup(), this.set_up_html(), this.register_observers(), this.on_ready());
    }return a.prototype.set_default_values = function () {
      var a = this;return this.click_test_action = function (b) {
        return a.test_active_click(b);
      }, this.activate_action = function (b) {
        return a.activate_field(b);
      }, this.active_field = !1, this.mouse_on_container = !1, this.results_showing = !1, this.result_highlighted = null, this.is_rtl = this.options.rtl || /\bchosen-rtl\b/.test(this.form_field.className), this.allow_single_deselect = null != this.options.allow_single_deselect && null != this.form_field.options[0] && "" === this.form_field.options[0].text ? this.options.allow_single_deselect : !1, this.disable_search_threshold = this.options.disable_search_threshold || 0, this.disable_search = this.options.disable_search || !1, this.enable_split_word_search = null != this.options.enable_split_word_search ? this.options.enable_split_word_search : !0, this.group_search = null != this.options.group_search ? this.options.group_search : !0, this.search_contains = this.options.search_contains || !1, this.single_backstroke_delete = null != this.options.single_backstroke_delete ? this.options.single_backstroke_delete : !0, this.max_selected_options = this.options.max_selected_options || 1 / 0, this.inherit_select_classes = this.options.inherit_select_classes || !1, this.display_selected_options = null != this.options.display_selected_options ? this.options.display_selected_options : !0, this.display_disabled_options = null != this.options.display_disabled_options ? this.options.display_disabled_options : !0, this.include_group_label_in_selected = this.options.include_group_label_in_selected || !1, this.max_shown_results = this.options.max_shown_results || Number.POSITIVE_INFINITY, this.case_sensitive_search = this.options.case_sensitive_search || !1, this.hide_results_on_select = null != this.options.hide_results_on_select ? this.options.hide_results_on_select : !0;
    }, a.prototype.set_default_text = function () {
      return this.form_field.getAttribute("data-placeholder") ? this.default_text = this.form_field.getAttribute("data-placeholder") : this.is_multiple ? this.default_text = this.options.placeholder_text_multiple || this.options.placeholder_text || a.default_multiple_text : this.default_text = this.options.placeholder_text_single || this.options.placeholder_text || a.default_single_text, this.default_text = this.escape_html(this.default_text), this.results_none_found = this.form_field.getAttribute("data-no_results_text") || this.options.no_results_text || a.default_no_result_text;
    }, a.prototype.choice_label = function (a) {
      return this.include_group_label_in_selected && null != a.group_label ? "<b class='group-name'>" + a.group_label + "</b>" + a.html : a.html;
    }, a.prototype.mouse_enter = function () {
      return this.mouse_on_container = !0;
    }, a.prototype.mouse_leave = function () {
      return this.mouse_on_container = !1;
    }, a.prototype.input_focus = function (a) {
      var b = this;if (this.is_multiple) {
        if (!this.active_field) return setTimeout(function () {
          return b.container_mousedown();
        }, 50);
      } else if (!this.active_field) return this.activate_field();
    }, a.prototype.input_blur = function (a) {
      var b = this;return this.mouse_on_container ? void 0 : (this.active_field = !1, setTimeout(function () {
        return b.blur_test();
      }, 100));
    }, a.prototype.label_click_handler = function (a) {
      return this.is_multiple ? this.container_mousedown(a) : this.activate_field();
    }, a.prototype.results_option_build = function (a) {
      var b, c, d, e, f, g, h;for (b = "", e = 0, h = this.results_data, f = 0, g = h.length; g > f && (c = h[f], d = "", d = c.group ? this.result_add_group(c) : this.result_add_option(c), "" !== d && (e++, b += d), (null != a ? a.first : void 0) && (c.selected && this.is_multiple ? this.choice_build(c) : c.selected && !this.is_multiple && this.single_set_selected_text(this.choice_label(c))), !(e >= this.max_shown_results)); f++);return b;
    }, a.prototype.result_add_option = function (a) {
      var b, c;return a.search_match && this.include_option_in_results(a) ? (b = [], a.disabled || a.selected && this.is_multiple || b.push("active-result"), !a.disabled || a.selected && this.is_multiple || b.push("disabled-result"), a.selected && b.push("result-selected"), null != a.group_array_index && b.push("group-option"), "" !== a.classes && b.push(a.classes), c = document.createElement("li"), c.className = b.join(" "), c.style.cssText = a.style, c.setAttribute("data-option-array-index", a.array_index), c.innerHTML = a.search_text, a.title && (c.title = a.title), this.outerHTML(c)) : "";
    }, a.prototype.result_add_group = function (a) {
      var b, c;return (a.search_match || a.group_match) && a.active_options > 0 ? (b = [], b.push("group-result"), a.classes && b.push(a.classes), c = document.createElement("li"), c.className = b.join(" "), c.innerHTML = a.search_text, a.title && (c.title = a.title), this.outerHTML(c)) : "";
    }, a.prototype.results_update_field = function () {
      return this.set_default_text(), this.is_multiple || this.results_reset_cleanup(), this.result_clear_highlight(), this.results_build(), this.results_showing ? this.winnow_results() : void 0;
    }, a.prototype.reset_single_select_options = function () {
      var a, b, c, d, e;for (d = this.results_data, e = [], b = 0, c = d.length; c > b; b++) a = d[b], a.selected ? e.push(a.selected = !1) : e.push(void 0);return e;
    }, a.prototype.results_toggle = function () {
      return this.results_showing ? this.results_hide() : this.results_show();
    }, a.prototype.results_search = function (a) {
      return this.results_showing ? this.winnow_results() : this.results_show();
    }, a.prototype.winnow_results = function () {
      var a, b, c, d, e, f, g, h, i, j, k, l;for (this.no_results_clear(), e = 0, g = this.get_search_text(), a = g.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), d = this.get_search_regex(a), b = this.get_highlight_regex(a), l = this.results_data, j = 0, k = l.length; k > j; j++) c = l[j], c.search_match = !1, f = null, this.include_option_in_results(c) && (c.group && (c.group_match = !1, c.active_options = 0), null != c.group_array_index && this.results_data[c.group_array_index] && (f = this.results_data[c.group_array_index], 0 === f.active_options && f.search_match && (e += 1), f.active_options += 1), c.search_text = c.group ? c.label : c.html, (!c.group || this.group_search) && (c.search_match = this.search_string_match(c.search_text, d), c.search_match && !c.group && (e += 1), c.search_match ? (g.length && (h = c.search_text.search(b), i = c.search_text.substr(0, h + g.length) + "</em>" + c.search_text.substr(h + g.length), c.search_text = i.substr(0, h) + "<em>" + i.substr(h)), null != f && (f.group_match = !0)) : null != c.group_array_index && this.results_data[c.group_array_index].search_match && (c.search_match = !0)));return this.result_clear_highlight(), 1 > e && g.length ? (this.update_results_content(""), this.no_results(g)) : (this.update_results_content(this.results_option_build()), this.winnow_results_set_highlight());
    }, a.prototype.get_search_regex = function (a) {
      var b, c;return b = this.search_contains ? "" : "^", c = this.case_sensitive_search ? "" : "i", new RegExp(b + a, c);
    }, a.prototype.get_highlight_regex = function (a) {
      var b, c;return b = this.search_contains ? "" : "\\b", c = this.case_sensitive_search ? "" : "i", new RegExp(b + a, c);
    }, a.prototype.search_string_match = function (a, b) {
      var c, d, e, f;if (b.test(a)) return !0;if (this.enable_split_word_search && (a.indexOf(" ") >= 0 || 0 === a.indexOf("[")) && (d = a.replace(/\[|\]/g, "").split(" "), d.length)) for (e = 0, f = d.length; f > e; e++) if (c = d[e], b.test(c)) return !0;
    }, a.prototype.choices_count = function () {
      var a, b, c, d;if (null != this.selected_option_count) return this.selected_option_count;for (this.selected_option_count = 0, d = this.form_field.options, b = 0, c = d.length; c > b; b++) a = d[b], a.selected && (this.selected_option_count += 1);return this.selected_option_count;
    }, a.prototype.choices_click = function (a) {
      return a.preventDefault(), this.activate_field(), this.results_showing || this.is_disabled ? void 0 : this.results_show();
    }, a.prototype.keydown_checker = function (a) {
      var b, c;switch (b = null != (c = a.which) ? c : a.keyCode, this.search_field_scale(), 8 !== b && this.pending_backstroke && this.clear_backstroke(), b) {case 8:
          this.backstroke_length = this.get_search_field_value().length;break;case 9:
          this.results_showing && !this.is_multiple && this.result_select(a), this.mouse_on_container = !1;break;case 13:
          this.results_showing && a.preventDefault();break;case 27:
          this.results_showing && a.preventDefault();break;case 32:
          this.disable_search && a.preventDefault();break;case 38:
          a.preventDefault(), this.keyup_arrow();break;case 40:
          a.preventDefault(), this.keydown_arrow();}
    }, a.prototype.keyup_checker = function (a) {
      var b, c;switch (b = null != (c = a.which) ? c : a.keyCode, this.search_field_scale(), b) {case 8:
          this.is_multiple && this.backstroke_length < 1 && this.choices_count() > 0 ? this.keydown_backstroke() : this.pending_backstroke || (this.result_clear_highlight(), this.results_search());break;case 13:
          a.preventDefault(), this.results_showing && this.result_select(a);break;case 27:
          this.results_showing && this.results_hide();break;case 9:case 16:case 17:case 18:case 38:case 40:case 91:
          break;default:
          this.results_search();}
    }, a.prototype.clipboard_event_checker = function (a) {
      var b = this;if (!this.is_disabled) return setTimeout(function () {
        return b.results_search();
      }, 50);
    }, a.prototype.container_width = function () {
      return null != this.options.width ? this.options.width : "" + this.form_field.offsetWidth + "px";
    }, a.prototype.include_option_in_results = function (a) {
      return this.is_multiple && !this.display_selected_options && a.selected ? !1 : !this.display_disabled_options && a.disabled ? !1 : a.empty ? !1 : !0;
    }, a.prototype.search_results_touchstart = function (a) {
      return this.touch_started = !0, this.search_results_mouseover(a);
    }, a.prototype.search_results_touchmove = function (a) {
      return this.touch_started = !1, this.search_results_mouseout(a);
    }, a.prototype.search_results_touchend = function (a) {
      return this.touch_started ? this.search_results_mouseup(a) : void 0;
    }, a.prototype.outerHTML = function (a) {
      var b;return a.outerHTML ? a.outerHTML : (b = document.createElement("div"), b.appendChild(a), b.innerHTML);
    }, a.prototype.get_single_html = function () {
      return '<a class="chosen-single chosen-default">\n  <span>' + this.default_text + '</span>\n  <div><b></b></div>\n</a>\n<div class="chosen-drop">\n  <div class="chosen-search">\n    <input class="chosen-search-input" type="text" autocomplete="off" />\n  </div>\n  <ul class="chosen-results"></ul>\n</div>';
    }, a.prototype.get_multi_html = function () {
      return '<ul class="chosen-choices">\n  <li class="search-field">\n    <input class="chosen-search-input" type="text" autocomplete="off" value="' + this.default_text + '" />\n  </li>\n</ul>\n<div class="chosen-drop">\n  <ul class="chosen-results"></ul>\n</div>';
    }, a.prototype.get_no_results_html = function (a) {
      return '<li class="no-results">\n  ' + this.results_none_found + " <span>" + a + "</span>\n</li>";
    }, a.browser_is_supported = function () {
      return "Microsoft Internet Explorer" === window.navigator.appName ? document.documentMode >= 8 : /iP(od|hone)/i.test(window.navigator.userAgent) || /IEMobile/i.test(window.navigator.userAgent) || /Windows Phone/i.test(window.navigator.userAgent) || /BlackBerry/i.test(window.navigator.userAgent) || /BB10/i.test(window.navigator.userAgent) || /Android.*Mobile/i.test(window.navigator.userAgent) ? !1 : !0;
    }, a.default_multiple_text = "Select Some Options", a.default_single_text = "Select an Option", a.default_no_result_text = "No results match", a;
  }(), a = jQuery, a.fn.extend({ chosen: function (d) {
      return b.browser_is_supported() ? this.each(function (b) {
        var e, f;return e = a(this), f = e.data("chosen"), "destroy" === d ? void (f instanceof c && f.destroy()) : void (f instanceof c || e.data("chosen", new c(this, d)));
      }) : this;
    } }), c = function (b) {
    function c() {
      return e = c.__super__.constructor.apply(this, arguments);
    }return h(c, b), c.prototype.setup = function () {
      return this.form_field_jq = a(this.form_field), this.current_selectedIndex = this.form_field.selectedIndex;
    }, c.prototype.set_up_html = function () {
      var b, c;return b = ["chosen-container"], b.push("chosen-container-" + (this.is_multiple ? "multi" : "single")), this.inherit_select_classes && this.form_field.className && b.push(this.form_field.className), this.is_rtl && b.push("chosen-rtl"), c = { "class": b.join(" "), title: this.form_field.title }, this.form_field.id.length && (c.id = this.form_field.id.replace(/[^\w]/g, "_") + "_chosen"), this.container = a("<div />", c), this.container.width(this.container_width()), this.is_multiple ? this.container.html(this.get_multi_html()) : this.container.html(this.get_single_html()), this.form_field_jq.hide().after(this.container), this.dropdown = this.container.find("div.chosen-drop").first(), this.search_field = this.container.find("input").first(), this.search_results = this.container.find("ul.chosen-results").first(), this.search_field_scale(), this.search_no_results = this.container.find("li.no-results").first(), this.is_multiple ? (this.search_choices = this.container.find("ul.chosen-choices").first(), this.search_container = this.container.find("li.search-field").first()) : (this.search_container = this.container.find("div.chosen-search").first(), this.selected_item = this.container.find(".chosen-single").first()), this.results_build(), this.set_tab_index(), this.set_label_behavior();
    }, c.prototype.on_ready = function () {
      return this.form_field_jq.trigger("chosen:ready", { chosen: this });
    }, c.prototype.register_observers = function () {
      var a = this;return this.container.bind("touchstart.chosen", function (b) {
        a.container_mousedown(b);
      }), this.container.bind("touchend.chosen", function (b) {
        a.container_mouseup(b);
      }), this.container.bind("mousedown.chosen", function (b) {
        a.container_mousedown(b);
      }), this.container.bind("mouseup.chosen", function (b) {
        a.container_mouseup(b);
      }), this.container.bind("mouseenter.chosen", function (b) {
        a.mouse_enter(b);
      }), this.container.bind("mouseleave.chosen", function (b) {
        a.mouse_leave(b);
      }), this.search_results.bind("mouseup.chosen", function (b) {
        a.search_results_mouseup(b);
      }), this.search_results.bind("mouseover.chosen", function (b) {
        a.search_results_mouseover(b);
      }), this.search_results.bind("mouseout.chosen", function (b) {
        a.search_results_mouseout(b);
      }), this.search_results.bind("mousewheel.chosen DOMMouseScroll.chosen", function (b) {
        a.search_results_mousewheel(b);
      }), this.search_results.bind("touchstart.chosen", function (b) {
        a.search_results_touchstart(b);
      }), this.search_results.bind("touchmove.chosen", function (b) {
        a.search_results_touchmove(b);
      }), this.search_results.bind("touchend.chosen", function (b) {
        a.search_results_touchend(b);
      }), this.form_field_jq.bind("chosen:updated.chosen", function (b) {
        a.results_update_field(b);
      }), this.form_field_jq.bind("chosen:activate.chosen", function (b) {
        a.activate_field(b);
      }), this.form_field_jq.bind("chosen:open.chosen", function (b) {
        a.container_mousedown(b);
      }), this.form_field_jq.bind("chosen:close.chosen", function (b) {
        a.close_field(b);
      }), this.search_field.bind("blur.chosen", function (b) {
        a.input_blur(b);
      }), this.search_field.bind("keyup.chosen", function (b) {
        a.keyup_checker(b);
      }), this.search_field.bind("keydown.chosen", function (b) {
        a.keydown_checker(b);
      }), this.search_field.bind("focus.chosen", function (b) {
        a.input_focus(b);
      }), this.search_field.bind("cut.chosen", function (b) {
        a.clipboard_event_checker(b);
      }), this.search_field.bind("paste.chosen", function (b) {
        a.clipboard_event_checker(b);
      }), this.is_multiple ? this.search_choices.bind("click.chosen", function (b) {
        a.choices_click(b);
      }) : this.container.bind("click.chosen", function (a) {
        a.preventDefault();
      });
    }, c.prototype.destroy = function () {
      return a(this.container[0].ownerDocument).unbind("click.chosen", this.click_test_action), this.form_field_label.length > 0 && this.form_field_label.unbind("click.chosen"), this.search_field[0].tabIndex && (this.form_field_jq[0].tabIndex = this.search_field[0].tabIndex), this.container.remove(), this.form_field_jq.removeData("chosen"), this.form_field_jq.show();
    }, c.prototype.search_field_disabled = function () {
      return this.is_disabled = this.form_field.disabled || this.form_field_jq.parents("fieldset").is(":disabled"), this.container.toggleClass("chosen-disabled", this.is_disabled), this.search_field[0].disabled = this.is_disabled, this.is_multiple || this.selected_item.unbind("focus.chosen", this.activate_field), this.is_disabled ? this.close_field() : this.is_multiple ? void 0 : this.selected_item.bind("focus.chosen", this.activate_field);
    }, c.prototype.container_mousedown = function (b) {
      var c;if (!this.is_disabled) return !b || "mousedown" !== (c = b.type) && "touchstart" !== c || this.results_showing || b.preventDefault(), null != b && a(b.target).hasClass("search-choice-close") ? void 0 : (this.active_field ? this.is_multiple || !b || a(b.target)[0] !== this.selected_item[0] && !a(b.target).parents("a.chosen-single").length || (b.preventDefault(), this.results_toggle()) : (this.is_multiple && this.search_field.val(""), a(this.container[0].ownerDocument).bind("click.chosen", this.click_test_action), this.results_show()), this.activate_field());
    }, c.prototype.container_mouseup = function (a) {
      return "ABBR" !== a.target.nodeName || this.is_disabled ? void 0 : this.results_reset(a);
    }, c.prototype.search_results_mousewheel = function (a) {
      var b;return a.originalEvent && (b = a.originalEvent.deltaY || -a.originalEvent.wheelDelta || a.originalEvent.detail), null != b ? (a.preventDefault(), "DOMMouseScroll" === a.type && (b = 40 * b), this.search_results.scrollTop(b + this.search_results.scrollTop())) : void 0;
    }, c.prototype.blur_test = function (a) {
      return !this.active_field && this.container.hasClass("chosen-container-active") ? this.close_field() : void 0;
    }, c.prototype.close_field = function () {
      return a(this.container[0].ownerDocument).unbind("click.chosen", this.click_test_action), this.active_field = !1, this.results_hide(), this.container.removeClass("chosen-container-active"), this.clear_backstroke(), this.show_search_field_default(), this.search_field_scale(), this.search_field.blur();
    }, c.prototype.activate_field = function () {
      return this.is_disabled ? void 0 : (this.container.addClass("chosen-container-active"), this.active_field = !0, this.search_field.val(this.search_field.val()), this.search_field.focus());
    }, c.prototype.test_active_click = function (b) {
      var c;return c = a(b.target).closest(".chosen-container"), c.length && this.container[0] === c[0] ? this.active_field = !0 : this.close_field();
    }, c.prototype.results_build = function () {
      return this.parsing = !0, this.selected_option_count = null, this.results_data = d.select_to_array(this.form_field), this.is_multiple ? this.search_choices.find("li.search-choice").remove() : this.is_multiple || (this.single_set_selected_text(), this.disable_search || this.form_field.options.length <= this.disable_search_threshold ? (this.search_field[0].readOnly = !0, this.container.addClass("chosen-container-single-nosearch")) : (this.search_field[0].readOnly = !1, this.container.removeClass("chosen-container-single-nosearch"))), this.update_results_content(this.results_option_build({ first: !0 })), this.search_field_disabled(), this.show_search_field_default(), this.search_field_scale(), this.parsing = !1;
    }, c.prototype.result_do_highlight = function (a) {
      var b, c, d, e, f;if (a.length) {
        if (this.result_clear_highlight(), this.result_highlight = a, this.result_highlight.addClass("highlighted"), d = parseInt(this.search_results.css("maxHeight"), 10), f = this.search_results.scrollTop(), e = d + f, c = this.result_highlight.position().top + this.search_results.scrollTop(), b = c + this.result_highlight.outerHeight(), b >= e) return this.search_results.scrollTop(b - d > 0 ? b - d : 0);if (f > c) return this.search_results.scrollTop(c);
      }
    }, c.prototype.result_clear_highlight = function () {
      return this.result_highlight && this.result_highlight.removeClass("highlighted"), this.result_highlight = null;
    }, c.prototype.results_show = function () {
      return this.is_multiple && this.max_selected_options <= this.choices_count() ? (this.form_field_jq.trigger("chosen:maxselected", { chosen: this }), !1) : (this.container.addClass("chosen-with-drop"), this.results_showing = !0, this.search_field.focus(), this.search_field.val(this.get_search_field_value()), this.winnow_results(), this.form_field_jq.trigger("chosen:showing_dropdown", { chosen: this }));
    }, c.prototype.update_results_content = function (a) {
      return this.search_results.html(a);
    }, c.prototype.results_hide = function () {
      return this.results_showing && (this.result_clear_highlight(), this.container.removeClass("chosen-with-drop"), this.form_field_jq.trigger("chosen:hiding_dropdown", { chosen: this })), this.results_showing = !1;
    }, c.prototype.set_tab_index = function (a) {
      var b;return this.form_field.tabIndex ? (b = this.form_field.tabIndex, this.form_field.tabIndex = -1, this.search_field[0].tabIndex = b) : void 0;
    }, c.prototype.set_label_behavior = function () {
      return this.form_field_label = this.form_field_jq.parents("label"), !this.form_field_label.length && this.form_field.id.length && (this.form_field_label = a("label[for='" + this.form_field.id + "']")), this.form_field_label.length > 0 ? this.form_field_label.bind("click.chosen", this.label_click_handler) : void 0;
    }, c.prototype.show_search_field_default = function () {
      return this.is_multiple && this.choices_count() < 1 && !this.active_field ? (this.search_field.val(this.default_text), this.search_field.addClass("default")) : (this.search_field.val(""), this.search_field.removeClass("default"));
    }, c.prototype.search_results_mouseup = function (b) {
      var c;return c = a(b.target).hasClass("active-result") ? a(b.target) : a(b.target).parents(".active-result").first(), c.length ? (this.result_highlight = c, this.result_select(b), this.search_field.focus()) : void 0;
    }, c.prototype.search_results_mouseover = function (b) {
      var c;return c = a(b.target).hasClass("active-result") ? a(b.target) : a(b.target).parents(".active-result").first(), c ? this.result_do_highlight(c) : void 0;
    }, c.prototype.search_results_mouseout = function (b) {
      return a(b.target).hasClass("active-result") ? this.result_clear_highlight() : void 0;
    }, c.prototype.choice_build = function (b) {
      var c,
          d,
          e = this;return c = a("<li />", { "class": "search-choice" }).html("<span>" + this.choice_label(b) + "</span>"), b.disabled ? c.addClass("search-choice-disabled") : (d = a("<a />", { "class": "search-choice-close", "data-option-array-index": b.array_index }), d.bind("click.chosen", function (a) {
        return e.choice_destroy_link_click(a);
      }), c.append(d)), this.search_container.before(c);
    }, c.prototype.choice_destroy_link_click = function (b) {
      return b.preventDefault(), b.stopPropagation(), this.is_disabled ? void 0 : this.choice_destroy(a(b.target));
    }, c.prototype.choice_destroy = function (a) {
      return this.result_deselect(a[0].getAttribute("data-option-array-index")) ? (this.active_field ? this.search_field.focus() : this.show_search_field_default(), this.is_multiple && this.choices_count() > 0 && this.get_search_field_value().length < 1 && this.results_hide(), a.parents("li").first().remove(), this.search_field_scale()) : void 0;
    }, c.prototype.results_reset = function () {
      return this.reset_single_select_options(), this.form_field.options[0].selected = !0, this.single_set_selected_text(), this.show_search_field_default(), this.results_reset_cleanup(), this.trigger_form_field_change(), this.active_field ? this.results_hide() : void 0;
    }, c.prototype.results_reset_cleanup = function () {
      return this.current_selectedIndex = this.form_field.selectedIndex, this.selected_item.find("abbr").remove();
    }, c.prototype.result_select = function (a) {
      var b, c;return this.result_highlight ? (b = this.result_highlight, this.result_clear_highlight(), this.is_multiple && this.max_selected_options <= this.choices_count() ? (this.form_field_jq.trigger("chosen:maxselected", { chosen: this }), !1) : (this.is_multiple ? b.removeClass("active-result") : this.reset_single_select_options(), b.addClass("result-selected"), c = this.results_data[b[0].getAttribute("data-option-array-index")], c.selected = !0, this.form_field.options[c.options_index].selected = !0, this.selected_option_count = null, this.is_multiple ? this.choice_build(c) : this.single_set_selected_text(this.choice_label(c)), (!this.is_multiple || this.hide_results_on_select && !a.metaKey && !a.ctrlKey) && (this.results_hide(), this.show_search_field_default()), (this.is_multiple || this.form_field.selectedIndex !== this.current_selectedIndex) && this.trigger_form_field_change({ selected: this.form_field.options[c.options_index].value }), this.current_selectedIndex = this.form_field.selectedIndex, a.preventDefault(), this.search_field_scale())) : void 0;
    }, c.prototype.single_set_selected_text = function (a) {
      return null == a && (a = this.default_text), a === this.default_text ? this.selected_item.addClass("chosen-default") : (this.single_deselect_control_build(), this.selected_item.removeClass("chosen-default")), this.selected_item.find("span").html(a);
    }, c.prototype.result_deselect = function (a) {
      var b;return b = this.results_data[a], this.form_field.options[b.options_index].disabled ? !1 : (b.selected = !1, this.form_field.options[b.options_index].selected = !1, this.selected_option_count = null, this.result_clear_highlight(), this.results_showing && this.winnow_results(), this.trigger_form_field_change({ deselected: this.form_field.options[b.options_index].value }), this.search_field_scale(), !0);
    }, c.prototype.single_deselect_control_build = function () {
      return this.allow_single_deselect ? (this.selected_item.find("abbr").length || this.selected_item.find("span").first().after('<abbr class="search-choice-close"></abbr>'), this.selected_item.addClass("chosen-single-with-deselect")) : void 0;
    }, c.prototype.get_search_field_value = function () {
      return this.search_field.val();
    }, c.prototype.get_search_text = function () {
      return this.escape_html(a.trim(this.get_search_field_value()));
    }, c.prototype.escape_html = function (b) {
      return a("<div/>").text(b).html();
    }, c.prototype.winnow_results_set_highlight = function () {
      var a, b;return b = this.is_multiple ? [] : this.search_results.find(".result-selected.active-result"), a = b.length ? b.first() : this.search_results.find(".active-result").first(), null != a ? this.result_do_highlight(a) : void 0;
    }, c.prototype.no_results = function (a) {
      var b;return b = this.get_no_results_html(a), this.search_results.append(b), this.form_field_jq.trigger("chosen:no_results", { chosen: this });
    }, c.prototype.no_results_clear = function () {
      return this.search_results.find(".no-results").remove();
    }, c.prototype.keydown_arrow = function () {
      var a;return this.results_showing && this.result_highlight ? (a = this.result_highlight.nextAll("li.active-result").first()) ? this.result_do_highlight(a) : void 0 : this.results_show();
    }, c.prototype.keyup_arrow = function () {
      var a;return this.results_showing || this.is_multiple ? this.result_highlight ? (a = this.result_highlight.prevAll("li.active-result"), a.length ? this.result_do_highlight(a.first()) : (this.choices_count() > 0 && this.results_hide(), this.result_clear_highlight())) : void 0 : this.results_show();
    }, c.prototype.keydown_backstroke = function () {
      var a;return this.pending_backstroke ? (this.choice_destroy(this.pending_backstroke.find("a").first()), this.clear_backstroke()) : (a = this.search_container.siblings("li.search-choice").last(), a.length && !a.hasClass("search-choice-disabled") ? (this.pending_backstroke = a, this.single_backstroke_delete ? this.keydown_backstroke() : this.pending_backstroke.addClass("search-choice-focus")) : void 0);
    }, c.prototype.clear_backstroke = function () {
      return this.pending_backstroke && this.pending_backstroke.removeClass("search-choice-focus"), this.pending_backstroke = null;
    }, c.prototype.search_field_scale = function () {
      var b, c, d, e, f, g, h, i;if (this.is_multiple) {
        for (e = { position: "absolute", left: "-1000px", top: "-1000px", display: "none", whiteSpace: "pre" }, f = ["fontSize", "fontStyle", "fontWeight", "fontFamily", "lineHeight", "textTransform", "letterSpacing"], h = 0, i = f.length; i > h; h++) d = f[h], e[d] = this.search_field.css(d);return c = a("<div />").css(e), c.text(this.get_search_field_value()), a("body").append(c), g = c.width() + 25, c.remove(), b = this.container.outerWidth(), g = Math.min(b - 10, g), this.search_field.width(g);
      }
    }, c.prototype.trigger_form_field_change = function (a) {
      return this.form_field_jq.trigger("input", a), this.form_field_jq.trigger("change", a);
    }, c;
  }(b);
}).call(this);
/*!
Chosen, a Select Box Enhancer for jQuery and Prototype
by Patrick Filler for Harvest, http://getharvest.com

Version 1.7.0
Full source at https://github.com/harvesthq/chosen
Copyright (c) 2011-2017 Harvest http://getharvest.com

MIT License, https://github.com/harvesthq/chosen/blob/master/LICENSE.md
This file is generated by `grunt build`, do not edit it by hand.
*/

(function () {
  var AbstractChosen,
      SelectParser,
      _ref,
      __bind = function (fn, me) {
    return function () {
      return fn.apply(me, arguments);
    };
  },
      __hasProp = {}.hasOwnProperty,
      __extends = function (child, parent) {
    for (var key in parent) {
      if (__hasProp.call(parent, key)) child[key] = parent[key];
    }function ctor() {
      this.constructor = child;
    }ctor.prototype = parent.prototype;child.prototype = new ctor();child.__super__ = parent.prototype;return child;
  };

  SelectParser = function () {
    function SelectParser() {
      this.options_index = 0;
      this.parsed = [];
    }

    SelectParser.prototype.add_node = function (child) {
      if (child.nodeName.toUpperCase() === "OPTGROUP") {
        return this.add_group(child);
      } else {
        return this.add_option(child);
      }
    };

    SelectParser.prototype.add_group = function (group) {
      var group_position, option, _i, _len, _ref, _results;
      group_position = this.parsed.length;
      this.parsed.push({
        array_index: group_position,
        group: true,
        label: this.escapeExpression(group.label),
        title: group.title ? group.title : void 0,
        children: 0,
        disabled: group.disabled,
        classes: group.className
      });
      _ref = group.childNodes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        _results.push(this.add_option(option, group_position, group.disabled));
      }
      return _results;
    };

    SelectParser.prototype.add_option = function (option, group_position, group_disabled) {
      if (option.nodeName.toUpperCase() === "OPTION") {
        if (option.text !== "") {
          if (group_position != null) {
            this.parsed[group_position].children += 1;
          }
          this.parsed.push({
            array_index: this.parsed.length,
            options_index: this.options_index,
            value: option.value,
            text: option.text,
            html: option.innerHTML,
            title: option.title ? option.title : void 0,
            selected: option.selected,
            disabled: group_disabled === true ? group_disabled : option.disabled,
            group_array_index: group_position,
            group_label: group_position != null ? this.parsed[group_position].label : null,
            classes: option.className,
            style: option.style.cssText
          });
        } else {
          this.parsed.push({
            array_index: this.parsed.length,
            options_index: this.options_index,
            empty: true
          });
        }
        return this.options_index += 1;
      }
    };

    SelectParser.prototype.escapeExpression = function (text) {
      var map, unsafe_chars;
      if (text == null || text === false) {
        return "";
      }
      if (!/[\&\<\>\"\'\`]/.test(text)) {
        return text;
      }
      map = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "`": "&#x60;"
      };
      unsafe_chars = /&(?!\w+;)|[\<\>\"\'\`]/g;
      return text.replace(unsafe_chars, function (chr) {
        return map[chr] || "&amp;";
      });
    };

    return SelectParser;
  }();

  SelectParser.select_to_array = function (select) {
    var child, parser, _i, _len, _ref;
    parser = new SelectParser();
    _ref = select.childNodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      parser.add_node(child);
    }
    return parser.parsed;
  };

  AbstractChosen = function () {
    function AbstractChosen(form_field, options) {
      this.form_field = form_field;
      this.options = options != null ? options : {};
      this.label_click_handler = __bind(this.label_click_handler, this);
      if (!AbstractChosen.browser_is_supported()) {
        return;
      }
      this.is_multiple = this.form_field.multiple;
      this.set_default_text();
      this.set_default_values();
      this.setup();
      this.set_up_html();
      this.register_observers();
      this.on_ready();
    }

    AbstractChosen.prototype.set_default_values = function () {
      var _this = this;
      this.click_test_action = function (evt) {
        return _this.test_active_click(evt);
      };
      this.activate_action = function (evt) {
        return _this.activate_field(evt);
      };
      this.active_field = false;
      this.mouse_on_container = false;
      this.results_showing = false;
      this.result_highlighted = null;
      this.is_rtl = this.options.rtl || /\bchosen-rtl\b/.test(this.form_field.className);
      this.allow_single_deselect = this.options.allow_single_deselect != null && this.form_field.options[0] != null && this.form_field.options[0].text === "" ? this.options.allow_single_deselect : false;
      this.disable_search_threshold = this.options.disable_search_threshold || 0;
      this.disable_search = this.options.disable_search || false;
      this.enable_split_word_search = this.options.enable_split_word_search != null ? this.options.enable_split_word_search : true;
      this.group_search = this.options.group_search != null ? this.options.group_search : true;
      this.search_contains = this.options.search_contains || false;
      this.single_backstroke_delete = this.options.single_backstroke_delete != null ? this.options.single_backstroke_delete : true;
      this.max_selected_options = this.options.max_selected_options || Infinity;
      this.inherit_select_classes = this.options.inherit_select_classes || false;
      this.display_selected_options = this.options.display_selected_options != null ? this.options.display_selected_options : true;
      this.display_disabled_options = this.options.display_disabled_options != null ? this.options.display_disabled_options : true;
      this.include_group_label_in_selected = this.options.include_group_label_in_selected || false;
      this.max_shown_results = this.options.max_shown_results || Number.POSITIVE_INFINITY;
      this.case_sensitive_search = this.options.case_sensitive_search || false;
      return this.hide_results_on_select = this.options.hide_results_on_select != null ? this.options.hide_results_on_select : true;
    };

    AbstractChosen.prototype.set_default_text = function () {
      if (this.form_field.getAttribute("data-placeholder")) {
        this.default_text = this.form_field.getAttribute("data-placeholder");
      } else if (this.is_multiple) {
        this.default_text = this.options.placeholder_text_multiple || this.options.placeholder_text || AbstractChosen.default_multiple_text;
      } else {
        this.default_text = this.options.placeholder_text_single || this.options.placeholder_text || AbstractChosen.default_single_text;
      }
      this.default_text = this.escape_html(this.default_text);
      return this.results_none_found = this.form_field.getAttribute("data-no_results_text") || this.options.no_results_text || AbstractChosen.default_no_result_text;
    };

    AbstractChosen.prototype.choice_label = function (item) {
      if (this.include_group_label_in_selected && item.group_label != null) {
        return "<b class='group-name'>" + item.group_label + "</b>" + item.html;
      } else {
        return item.html;
      }
    };

    AbstractChosen.prototype.mouse_enter = function () {
      return this.mouse_on_container = true;
    };

    AbstractChosen.prototype.mouse_leave = function () {
      return this.mouse_on_container = false;
    };

    AbstractChosen.prototype.input_focus = function (evt) {
      var _this = this;
      if (this.is_multiple) {
        if (!this.active_field) {
          return setTimeout(function () {
            return _this.container_mousedown();
          }, 50);
        }
      } else {
        if (!this.active_field) {
          return this.activate_field();
        }
      }
    };

    AbstractChosen.prototype.input_blur = function (evt) {
      var _this = this;
      if (!this.mouse_on_container) {
        this.active_field = false;
        return setTimeout(function () {
          return _this.blur_test();
        }, 100);
      }
    };

    AbstractChosen.prototype.label_click_handler = function (evt) {
      if (this.is_multiple) {
        return this.container_mousedown(evt);
      } else {
        return this.activate_field();
      }
    };

    AbstractChosen.prototype.results_option_build = function (options) {
      var content, data, data_content, shown_results, _i, _len, _ref;
      content = '';
      shown_results = 0;
      _ref = this.results_data;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        data = _ref[_i];
        data_content = '';
        if (data.group) {
          data_content = this.result_add_group(data);
        } else {
          data_content = this.result_add_option(data);
        }
        if (data_content !== '') {
          shown_results++;
          content += data_content;
        }
        if (options != null ? options.first : void 0) {
          if (data.selected && this.is_multiple) {
            this.choice_build(data);
          } else if (data.selected && !this.is_multiple) {
            this.single_set_selected_text(this.choice_label(data));
          }
        }
        if (shown_results >= this.max_shown_results) {
          break;
        }
      }
      return content;
    };

    AbstractChosen.prototype.result_add_option = function (option) {
      var classes, option_el;
      if (!option.search_match) {
        return '';
      }
      if (!this.include_option_in_results(option)) {
        return '';
      }
      classes = [];
      if (!option.disabled && !(option.selected && this.is_multiple)) {
        classes.push("active-result");
      }
      if (option.disabled && !(option.selected && this.is_multiple)) {
        classes.push("disabled-result");
      }
      if (option.selected) {
        classes.push("result-selected");
      }
      if (option.group_array_index != null) {
        classes.push("group-option");
      }
      if (option.classes !== "") {
        classes.push(option.classes);
      }
      option_el = document.createElement("li");
      option_el.className = classes.join(" ");
      option_el.style.cssText = option.style;
      option_el.setAttribute("data-option-array-index", option.array_index);
      option_el.innerHTML = option.search_text;
      if (option.title) {
        option_el.title = option.title;
      }
      return this.outerHTML(option_el);
    };

    AbstractChosen.prototype.result_add_group = function (group) {
      var classes, group_el;
      if (!(group.search_match || group.group_match)) {
        return '';
      }
      if (!(group.active_options > 0)) {
        return '';
      }
      classes = [];
      classes.push("group-result");
      if (group.classes) {
        classes.push(group.classes);
      }
      group_el = document.createElement("li");
      group_el.className = classes.join(" ");
      group_el.innerHTML = group.search_text;
      if (group.title) {
        group_el.title = group.title;
      }
      return this.outerHTML(group_el);
    };

    AbstractChosen.prototype.results_update_field = function () {
      this.set_default_text();
      if (!this.is_multiple) {
        this.results_reset_cleanup();
      }
      this.result_clear_highlight();
      this.results_build();
      if (this.results_showing) {
        return this.winnow_results();
      }
    };

    AbstractChosen.prototype.reset_single_select_options = function () {
      var result, _i, _len, _ref, _results;
      _ref = this.results_data;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        result = _ref[_i];
        if (result.selected) {
          _results.push(result.selected = false);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    AbstractChosen.prototype.results_toggle = function () {
      if (this.results_showing) {
        return this.results_hide();
      } else {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.results_search = function (evt) {
      if (this.results_showing) {
        return this.winnow_results();
      } else {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.winnow_results = function () {
      var escapedSearchText, highlightRegex, option, regex, results, results_group, searchText, startpos, text, _i, _len, _ref;
      this.no_results_clear();
      results = 0;
      searchText = this.get_search_text();
      escapedSearchText = searchText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      regex = this.get_search_regex(escapedSearchText);
      highlightRegex = this.get_highlight_regex(escapedSearchText);
      _ref = this.results_data;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        option.search_match = false;
        results_group = null;
        if (this.include_option_in_results(option)) {
          if (option.group) {
            option.group_match = false;
            option.active_options = 0;
          }
          if (option.group_array_index != null && this.results_data[option.group_array_index]) {
            results_group = this.results_data[option.group_array_index];
            if (results_group.active_options === 0 && results_group.search_match) {
              results += 1;
            }
            results_group.active_options += 1;
          }
          option.search_text = option.group ? option.label : option.html;
          if (!(option.group && !this.group_search)) {
            option.search_match = this.search_string_match(option.search_text, regex);
            if (option.search_match && !option.group) {
              results += 1;
            }
            if (option.search_match) {
              if (searchText.length) {
                startpos = option.search_text.search(highlightRegex);
                text = option.search_text.substr(0, startpos + searchText.length) + '</em>' + option.search_text.substr(startpos + searchText.length);
                option.search_text = text.substr(0, startpos) + '<em>' + text.substr(startpos);
              }
              if (results_group != null) {
                results_group.group_match = true;
              }
            } else if (option.group_array_index != null && this.results_data[option.group_array_index].search_match) {
              option.search_match = true;
            }
          }
        }
      }
      this.result_clear_highlight();
      if (results < 1 && searchText.length) {
        this.update_results_content("");
        return this.no_results(searchText);
      } else {
        this.update_results_content(this.results_option_build());
        return this.winnow_results_set_highlight();
      }
    };

    AbstractChosen.prototype.get_search_regex = function (escaped_search_string) {
      var regex_anchor, regex_flag;
      regex_anchor = this.search_contains ? "" : "^";
      regex_flag = this.case_sensitive_search ? "" : "i";
      return new RegExp(regex_anchor + escaped_search_string, regex_flag);
    };

    AbstractChosen.prototype.get_highlight_regex = function (escaped_search_string) {
      var regex_anchor, regex_flag;
      regex_anchor = this.search_contains ? "" : "\\b";
      regex_flag = this.case_sensitive_search ? "" : "i";
      return new RegExp(regex_anchor + escaped_search_string, regex_flag);
    };

    AbstractChosen.prototype.search_string_match = function (search_string, regex) {
      var part, parts, _i, _len;
      if (regex.test(search_string)) {
        return true;
      } else if (this.enable_split_word_search && (search_string.indexOf(" ") >= 0 || search_string.indexOf("[") === 0)) {
        parts = search_string.replace(/\[|\]/g, "").split(" ");
        if (parts.length) {
          for (_i = 0, _len = parts.length; _i < _len; _i++) {
            part = parts[_i];
            if (regex.test(part)) {
              return true;
            }
          }
        }
      }
    };

    AbstractChosen.prototype.choices_count = function () {
      var option, _i, _len, _ref;
      if (this.selected_option_count != null) {
        return this.selected_option_count;
      }
      this.selected_option_count = 0;
      _ref = this.form_field.options;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        if (option.selected) {
          this.selected_option_count += 1;
        }
      }
      return this.selected_option_count;
    };

    AbstractChosen.prototype.choices_click = function (evt) {
      evt.preventDefault();
      this.activate_field();
      if (!(this.results_showing || this.is_disabled)) {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.keydown_checker = function (evt) {
      var stroke, _ref;
      stroke = (_ref = evt.which) != null ? _ref : evt.keyCode;
      this.search_field_scale();
      if (stroke !== 8 && this.pending_backstroke) {
        this.clear_backstroke();
      }
      switch (stroke) {
        case 8:
          this.backstroke_length = this.get_search_field_value().length;
          break;
        case 9:
          if (this.results_showing && !this.is_multiple) {
            this.result_select(evt);
          }
          this.mouse_on_container = false;
          break;
        case 13:
          if (this.results_showing) {
            evt.preventDefault();
          }
          break;
        case 27:
          if (this.results_showing) {
            evt.preventDefault();
          }
          break;
        case 32:
          if (this.disable_search) {
            evt.preventDefault();
          }
          break;
        case 38:
          evt.preventDefault();
          this.keyup_arrow();
          break;
        case 40:
          evt.preventDefault();
          this.keydown_arrow();
          break;
      }
    };

    AbstractChosen.prototype.keyup_checker = function (evt) {
      var stroke, _ref;
      stroke = (_ref = evt.which) != null ? _ref : evt.keyCode;
      this.search_field_scale();
      switch (stroke) {
        case 8:
          if (this.is_multiple && this.backstroke_length < 1 && this.choices_count() > 0) {
            this.keydown_backstroke();
          } else if (!this.pending_backstroke) {
            this.result_clear_highlight();
            this.results_search();
          }
          break;
        case 13:
          evt.preventDefault();
          if (this.results_showing) {
            this.result_select(evt);
          }
          break;
        case 27:
          if (this.results_showing) {
            this.results_hide();
          }
          break;
        case 9:
        case 16:
        case 17:
        case 18:
        case 38:
        case 40:
        case 91:
          break;
        default:
          this.results_search();
          break;
      }
    };

    AbstractChosen.prototype.clipboard_event_checker = function (evt) {
      var _this = this;
      if (this.is_disabled) {
        return;
      }
      return setTimeout(function () {
        return _this.results_search();
      }, 50);
    };

    AbstractChosen.prototype.container_width = function () {
      if (this.options.width != null) {
        return this.options.width;
      } else {
        return "" + this.form_field.offsetWidth + "px";
      }
    };

    AbstractChosen.prototype.include_option_in_results = function (option) {
      if (this.is_multiple && !this.display_selected_options && option.selected) {
        return false;
      }
      if (!this.display_disabled_options && option.disabled) {
        return false;
      }
      if (option.empty) {
        return false;
      }
      return true;
    };

    AbstractChosen.prototype.search_results_touchstart = function (evt) {
      this.touch_started = true;
      return this.search_results_mouseover(evt);
    };

    AbstractChosen.prototype.search_results_touchmove = function (evt) {
      this.touch_started = false;
      return this.search_results_mouseout(evt);
    };

    AbstractChosen.prototype.search_results_touchend = function (evt) {
      if (this.touch_started) {
        return this.search_results_mouseup(evt);
      }
    };

    AbstractChosen.prototype.outerHTML = function (element) {
      var tmp;
      if (element.outerHTML) {
        return element.outerHTML;
      }
      tmp = document.createElement("div");
      tmp.appendChild(element);
      return tmp.innerHTML;
    };

    AbstractChosen.prototype.get_single_html = function () {
      return "<a class=\"chosen-single chosen-default\">\n  <span>" + this.default_text + "</span>\n  <div><b></b></div>\n</a>\n<div class=\"chosen-drop\">\n  <div class=\"chosen-search\">\n    <input class=\"chosen-search-input\" type=\"text\" autocomplete=\"off\" />\n  </div>\n  <ul class=\"chosen-results\"></ul>\n</div>";
    };

    AbstractChosen.prototype.get_multi_html = function () {
      return "<ul class=\"chosen-choices\">\n  <li class=\"search-field\">\n    <input class=\"chosen-search-input\" type=\"text\" autocomplete=\"off\" value=\"" + this.default_text + "\" />\n  </li>\n</ul>\n<div class=\"chosen-drop\">\n  <ul class=\"chosen-results\"></ul>\n</div>";
    };

    AbstractChosen.prototype.get_no_results_html = function (terms) {
      return "<li class=\"no-results\">\n  " + this.results_none_found + " <span>" + terms + "</span>\n</li>";
    };

    AbstractChosen.browser_is_supported = function () {
      if ("Microsoft Internet Explorer" === window.navigator.appName) {
        return document.documentMode >= 8;
      }
      if (/iP(od|hone)/i.test(window.navigator.userAgent) || /IEMobile/i.test(window.navigator.userAgent) || /Windows Phone/i.test(window.navigator.userAgent) || /BlackBerry/i.test(window.navigator.userAgent) || /BB10/i.test(window.navigator.userAgent) || /Android.*Mobile/i.test(window.navigator.userAgent)) {
        return false;
      }
      return true;
    };

    AbstractChosen.default_multiple_text = "Select Some Options";

    AbstractChosen.default_single_text = "Select an Option";

    AbstractChosen.default_no_result_text = "No results match";

    return AbstractChosen;
  }();

  this.Chosen = function (_super) {
    var triggerHtmlEvent;

    __extends(Chosen, _super);

    function Chosen() {
      _ref = Chosen.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Chosen.prototype.setup = function () {
      return this.current_selectedIndex = this.form_field.selectedIndex;
    };

    Chosen.prototype.set_default_values = function () {
      Chosen.__super__.set_default_values.call(this);
      return this.no_results_temp = new Template(this.get_no_results_html('#{terms}'));
    };

    Chosen.prototype.set_up_html = function () {
      var container_classes, container_props;
      container_classes = ["chosen-container"];
      container_classes.push("chosen-container-" + (this.is_multiple ? "multi" : "single"));
      if (this.inherit_select_classes && this.form_field.className) {
        container_classes.push(this.form_field.className);
      }
      if (this.is_rtl) {
        container_classes.push("chosen-rtl");
      }
      container_props = {
        'class': container_classes.join(' '),
        'title': this.form_field.title
      };
      if (this.form_field.id.length) {
        container_props.id = this.form_field.id.replace(/[^\w]/g, '_') + "_chosen";
      }
      this.container = new Element('div', container_props);
      this.container.setStyle({
        width: this.container_width()
      });
      if (this.is_multiple) {
        this.container.update(this.get_multi_html());
      } else {
        this.container.update(this.get_single_html());
      }
      this.form_field.hide().insert({
        after: this.container
      });
      this.dropdown = this.container.down('div.chosen-drop');
      this.search_field = this.container.down('input');
      this.search_results = this.container.down('ul.chosen-results');
      this.search_field_scale();
      this.search_no_results = this.container.down('li.no-results');
      if (this.is_multiple) {
        this.search_choices = this.container.down('ul.chosen-choices');
        this.search_container = this.container.down('li.search-field');
      } else {
        this.search_container = this.container.down('div.chosen-search');
        this.selected_item = this.container.down('.chosen-single');
      }
      this.results_build();
      this.set_tab_index();
      return this.set_label_behavior();
    };

    Chosen.prototype.on_ready = function () {
      return this.form_field.fire("chosen:ready", {
        chosen: this
      });
    };

    Chosen.prototype.register_observers = function () {
      var _this = this;
      this.container.observe("touchstart", function (evt) {
        return _this.container_mousedown(evt);
      });
      this.container.observe("touchend", function (evt) {
        return _this.container_mouseup(evt);
      });
      this.container.observe("mousedown", function (evt) {
        return _this.container_mousedown(evt);
      });
      this.container.observe("mouseup", function (evt) {
        return _this.container_mouseup(evt);
      });
      this.container.observe("mouseenter", function (evt) {
        return _this.mouse_enter(evt);
      });
      this.container.observe("mouseleave", function (evt) {
        return _this.mouse_leave(evt);
      });
      this.search_results.observe("mouseup", function (evt) {
        return _this.search_results_mouseup(evt);
      });
      this.search_results.observe("mouseover", function (evt) {
        return _this.search_results_mouseover(evt);
      });
      this.search_results.observe("mouseout", function (evt) {
        return _this.search_results_mouseout(evt);
      });
      this.search_results.observe("mousewheel", function (evt) {
        return _this.search_results_mousewheel(evt);
      });
      this.search_results.observe("DOMMouseScroll", function (evt) {
        return _this.search_results_mousewheel(evt);
      });
      this.search_results.observe("touchstart", function (evt) {
        return _this.search_results_touchstart(evt);
      });
      this.search_results.observe("touchmove", function (evt) {
        return _this.search_results_touchmove(evt);
      });
      this.search_results.observe("touchend", function (evt) {
        return _this.search_results_touchend(evt);
      });
      this.form_field.observe("chosen:updated", function (evt) {
        return _this.results_update_field(evt);
      });
      this.form_field.observe("chosen:activate", function (evt) {
        return _this.activate_field(evt);
      });
      this.form_field.observe("chosen:open", function (evt) {
        return _this.container_mousedown(evt);
      });
      this.form_field.observe("chosen:close", function (evt) {
        return _this.close_field(evt);
      });
      this.search_field.observe("blur", function (evt) {
        return _this.input_blur(evt);
      });
      this.search_field.observe("keyup", function (evt) {
        return _this.keyup_checker(evt);
      });
      this.search_field.observe("keydown", function (evt) {
        return _this.keydown_checker(evt);
      });
      this.search_field.observe("focus", function (evt) {
        return _this.input_focus(evt);
      });
      this.search_field.observe("cut", function (evt) {
        return _this.clipboard_event_checker(evt);
      });
      this.search_field.observe("paste", function (evt) {
        return _this.clipboard_event_checker(evt);
      });
      if (this.is_multiple) {
        return this.search_choices.observe("click", function (evt) {
          return _this.choices_click(evt);
        });
      } else {
        return this.container.observe("click", function (evt) {
          return evt.preventDefault();
        });
      }
    };

    Chosen.prototype.destroy = function () {
      var event, _i, _len, _ref1;
      this.container.ownerDocument.stopObserving("click", this.click_test_action);
      _ref1 = ['chosen:updated', 'chosen:activate', 'chosen:open', 'chosen:close'];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        event = _ref1[_i];
        this.form_field.stopObserving(event);
      }
      this.container.stopObserving();
      this.search_results.stopObserving();
      this.search_field.stopObserving();
      if (this.form_field_label != null) {
        this.form_field_label.stopObserving();
      }
      if (this.is_multiple) {
        this.search_choices.stopObserving();
        this.container.select(".search-choice-close").each(function (choice) {
          return choice.stopObserving();
        });
      } else {
        this.selected_item.stopObserving();
      }
      if (this.search_field.tabIndex) {
        this.form_field.tabIndex = this.search_field.tabIndex;
      }
      this.container.remove();
      return this.form_field.show();
    };

    Chosen.prototype.search_field_disabled = function () {
      var _ref1;
      this.is_disabled = this.form_field.disabled || ((_ref1 = this.form_field.up('fieldset')) != null ? _ref1.disabled : void 0) || false;
      if (this.is_disabled) {
        this.container.addClassName('chosen-disabled');
      } else {
        this.container.removeClassName('chosen-disabled');
      }
      this.search_field.disabled = this.is_disabled;
      if (!this.is_multiple) {
        this.selected_item.stopObserving('focus', this.activate_field);
      }
      if (this.is_disabled) {
        return this.close_field();
      } else if (!this.is_multiple) {
        return this.selected_item.observe('focus', this.activate_field);
      }
    };

    Chosen.prototype.container_mousedown = function (evt) {
      var _ref1;
      if (this.is_disabled) {
        return;
      }
      if (evt && ((_ref1 = evt.type) === 'mousedown' || _ref1 === 'touchstart') && !this.results_showing) {
        evt.preventDefault();
      }
      if (!(evt != null && evt.target.hasClassName("search-choice-close"))) {
        if (!this.active_field) {
          if (this.is_multiple) {
            this.search_field.clear();
          }
          this.container.ownerDocument.observe("click", this.click_test_action);
          this.results_show();
        } else if (!this.is_multiple && evt && (evt.target === this.selected_item || evt.target.up("a.chosen-single"))) {
          this.results_toggle();
        }
        return this.activate_field();
      }
    };

    Chosen.prototype.container_mouseup = function (evt) {
      if (evt.target.nodeName === "ABBR" && !this.is_disabled) {
        return this.results_reset(evt);
      }
    };

    Chosen.prototype.search_results_mousewheel = function (evt) {
      var delta;
      delta = evt.deltaY || -evt.wheelDelta || evt.detail;
      if (delta != null) {
        evt.preventDefault();
        if (evt.type === 'DOMMouseScroll') {
          delta = delta * 40;
        }
        return this.search_results.scrollTop = delta + this.search_results.scrollTop;
      }
    };

    Chosen.prototype.blur_test = function (evt) {
      if (!this.active_field && this.container.hasClassName("chosen-container-active")) {
        return this.close_field();
      }
    };

    Chosen.prototype.close_field = function () {
      this.container.ownerDocument.stopObserving("click", this.click_test_action);
      this.active_field = false;
      this.results_hide();
      this.container.removeClassName("chosen-container-active");
      this.clear_backstroke();
      this.show_search_field_default();
      this.search_field_scale();
      return this.search_field.blur();
    };

    Chosen.prototype.activate_field = function () {
      if (this.is_disabled) {
        return;
      }
      this.container.addClassName("chosen-container-active");
      this.active_field = true;
      this.search_field.value = this.get_search_field_value();
      return this.search_field.focus();
    };

    Chosen.prototype.test_active_click = function (evt) {
      if (evt.target.up('.chosen-container') === this.container) {
        return this.active_field = true;
      } else {
        return this.close_field();
      }
    };

    Chosen.prototype.results_build = function () {
      this.parsing = true;
      this.selected_option_count = null;
      this.results_data = SelectParser.select_to_array(this.form_field);
      if (this.is_multiple) {
        this.search_choices.select("li.search-choice").invoke("remove");
      } else if (!this.is_multiple) {
        this.single_set_selected_text();
        if (this.disable_search || this.form_field.options.length <= this.disable_search_threshold) {
          this.search_field.readOnly = true;
          this.container.addClassName("chosen-container-single-nosearch");
        } else {
          this.search_field.readOnly = false;
          this.container.removeClassName("chosen-container-single-nosearch");
        }
      }
      this.update_results_content(this.results_option_build({
        first: true
      }));
      this.search_field_disabled();
      this.show_search_field_default();
      this.search_field_scale();
      return this.parsing = false;
    };

    Chosen.prototype.result_do_highlight = function (el) {
      var high_bottom, high_top, maxHeight, visible_bottom, visible_top;
      this.result_clear_highlight();
      this.result_highlight = el;
      this.result_highlight.addClassName("highlighted");
      maxHeight = parseInt(this.search_results.getStyle('maxHeight'), 10);
      visible_top = this.search_results.scrollTop;
      visible_bottom = maxHeight + visible_top;
      high_top = this.result_highlight.positionedOffset().top;
      high_bottom = high_top + this.result_highlight.getHeight();
      if (high_bottom >= visible_bottom) {
        return this.search_results.scrollTop = high_bottom - maxHeight > 0 ? high_bottom - maxHeight : 0;
      } else if (high_top < visible_top) {
        return this.search_results.scrollTop = high_top;
      }
    };

    Chosen.prototype.result_clear_highlight = function () {
      if (this.result_highlight) {
        this.result_highlight.removeClassName('highlighted');
      }
      return this.result_highlight = null;
    };

    Chosen.prototype.results_show = function () {
      if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
        this.form_field.fire("chosen:maxselected", {
          chosen: this
        });
        return false;
      }
      this.container.addClassName("chosen-with-drop");
      this.results_showing = true;
      this.search_field.focus();
      this.search_field.value = this.get_search_field_value();
      this.winnow_results();
      return this.form_field.fire("chosen:showing_dropdown", {
        chosen: this
      });
    };

    Chosen.prototype.update_results_content = function (content) {
      return this.search_results.update(content);
    };

    Chosen.prototype.results_hide = function () {
      if (this.results_showing) {
        this.result_clear_highlight();
        this.container.removeClassName("chosen-with-drop");
        this.form_field.fire("chosen:hiding_dropdown", {
          chosen: this
        });
      }
      return this.results_showing = false;
    };

    Chosen.prototype.set_tab_index = function (el) {
      var ti;
      if (this.form_field.tabIndex) {
        ti = this.form_field.tabIndex;
        this.form_field.tabIndex = -1;
        return this.search_field.tabIndex = ti;
      }
    };

    Chosen.prototype.set_label_behavior = function () {
      this.form_field_label = this.form_field.up("label");
      if (this.form_field_label == null) {
        this.form_field_label = $$("label[for='" + this.form_field.id + "']").first();
      }
      if (this.form_field_label != null) {
        return this.form_field_label.observe("click", this.label_click_handler);
      }
    };

    Chosen.prototype.show_search_field_default = function () {
      if (this.is_multiple && this.choices_count() < 1 && !this.active_field) {
        this.search_field.value = this.default_text;
        return this.search_field.addClassName("default");
      } else {
        this.search_field.value = "";
        return this.search_field.removeClassName("default");
      }
    };

    Chosen.prototype.search_results_mouseup = function (evt) {
      var target;
      target = evt.target.hasClassName("active-result") ? evt.target : evt.target.up(".active-result");
      if (target) {
        this.result_highlight = target;
        this.result_select(evt);
        return this.search_field.focus();
      }
    };

    Chosen.prototype.search_results_mouseover = function (evt) {
      var target;
      target = evt.target.hasClassName("active-result") ? evt.target : evt.target.up(".active-result");
      if (target) {
        return this.result_do_highlight(target);
      }
    };

    Chosen.prototype.search_results_mouseout = function (evt) {
      if (evt.target.hasClassName('active-result') || evt.target.up('.active-result')) {
        return this.result_clear_highlight();
      }
    };

    Chosen.prototype.choice_build = function (item) {
      var choice,
          close_link,
          _this = this;
      choice = new Element('li', {
        "class": "search-choice"
      }).update("<span>" + this.choice_label(item) + "</span>");
      if (item.disabled) {
        choice.addClassName('search-choice-disabled');
      } else {
        close_link = new Element('a', {
          href: '#',
          "class": 'search-choice-close',
          rel: item.array_index
        });
        close_link.observe("click", function (evt) {
          return _this.choice_destroy_link_click(evt);
        });
        choice.insert(close_link);
      }
      return this.search_container.insert({
        before: choice
      });
    };

    Chosen.prototype.choice_destroy_link_click = function (evt) {
      evt.preventDefault();
      evt.stopPropagation();
      if (!this.is_disabled) {
        return this.choice_destroy(evt.target);
      }
    };

    Chosen.prototype.choice_destroy = function (link) {
      if (this.result_deselect(link.readAttribute("rel"))) {
        if (this.active_field) {
          this.search_field.focus();
        } else {
          this.show_search_field_default();
        }
        if (this.is_multiple && this.choices_count() > 0 && this.get_search_field_value().length < 1) {
          this.results_hide();
        }
        link.up('li').remove();
        return this.search_field_scale();
      }
    };

    Chosen.prototype.results_reset = function () {
      this.reset_single_select_options();
      this.form_field.options[0].selected = true;
      this.single_set_selected_text();
      this.show_search_field_default();
      this.results_reset_cleanup();
      this.trigger_form_field_change();
      if (this.active_field) {
        return this.results_hide();
      }
    };

    Chosen.prototype.results_reset_cleanup = function () {
      var deselect_trigger;
      this.current_selectedIndex = this.form_field.selectedIndex;
      deselect_trigger = this.selected_item.down("abbr");
      if (deselect_trigger) {
        return deselect_trigger.remove();
      }
    };

    Chosen.prototype.result_select = function (evt) {
      var high, item;
      if (this.result_highlight) {
        high = this.result_highlight;
        this.result_clear_highlight();
        if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
          this.form_field.fire("chosen:maxselected", {
            chosen: this
          });
          return false;
        }
        if (this.is_multiple) {
          high.removeClassName("active-result");
        } else {
          this.reset_single_select_options();
        }
        high.addClassName("result-selected");
        item = this.results_data[high.getAttribute("data-option-array-index")];
        item.selected = true;
        this.form_field.options[item.options_index].selected = true;
        this.selected_option_count = null;
        if (this.is_multiple) {
          this.choice_build(item);
        } else {
          this.single_set_selected_text(this.choice_label(item));
        }
        if (!(this.is_multiple && (!this.hide_results_on_select || evt.metaKey || evt.ctrlKey))) {
          this.results_hide();
          this.show_search_field_default();
        }
        if (this.is_multiple || this.form_field.selectedIndex !== this.current_selectedIndex) {
          this.trigger_form_field_change();
        }
        this.current_selectedIndex = this.form_field.selectedIndex;
        evt.preventDefault();
        return this.search_field_scale();
      }
    };

    Chosen.prototype.single_set_selected_text = function (text) {
      if (text == null) {
        text = this.default_text;
      }
      if (text === this.default_text) {
        this.selected_item.addClassName("chosen-default");
      } else {
        this.single_deselect_control_build();
        this.selected_item.removeClassName("chosen-default");
      }
      return this.selected_item.down("span").update(text);
    };

    Chosen.prototype.result_deselect = function (pos) {
      var result_data;
      result_data = this.results_data[pos];
      if (!this.form_field.options[result_data.options_index].disabled) {
        result_data.selected = false;
        this.form_field.options[result_data.options_index].selected = false;
        this.selected_option_count = null;
        this.result_clear_highlight();
        if (this.results_showing) {
          this.winnow_results();
        }
        this.trigger_form_field_change();
        this.search_field_scale();
        return true;
      } else {
        return false;
      }
    };

    Chosen.prototype.single_deselect_control_build = function () {
      if (!this.allow_single_deselect) {
        return;
      }
      if (!this.selected_item.down("abbr")) {
        this.selected_item.down("span").insert({
          after: "<abbr class=\"search-choice-close\"></abbr>"
        });
      }
      return this.selected_item.addClassName("chosen-single-with-deselect");
    };

    Chosen.prototype.get_search_field_value = function () {
      return this.search_field.value;
    };

    Chosen.prototype.get_search_text = function () {
      return this.escape_html(this.get_search_field_value().strip());
    };

    Chosen.prototype.escape_html = function (text) {
      return text.escapeHTML();
    };

    Chosen.prototype.winnow_results_set_highlight = function () {
      var do_high;
      if (!this.is_multiple) {
        do_high = this.search_results.down(".result-selected.active-result");
      }
      if (do_high == null) {
        do_high = this.search_results.down(".active-result");
      }
      if (do_high != null) {
        return this.result_do_highlight(do_high);
      }
    };

    Chosen.prototype.no_results = function (terms) {
      this.search_results.insert(this.no_results_temp.evaluate({
        terms: terms
      }));
      return this.form_field.fire("chosen:no_results", {
        chosen: this
      });
    };

    Chosen.prototype.no_results_clear = function () {
      var nr, _results;
      nr = null;
      _results = [];
      while (nr = this.search_results.down(".no-results")) {
        _results.push(nr.remove());
      }
      return _results;
    };

    Chosen.prototype.keydown_arrow = function () {
      var next_sib;
      if (this.results_showing && this.result_highlight) {
        next_sib = this.result_highlight.next('.active-result');
        if (next_sib) {
          return this.result_do_highlight(next_sib);
        }
      } else {
        return this.results_show();
      }
    };

    Chosen.prototype.keyup_arrow = function () {
      var actives, prevs, sibs;
      if (!this.results_showing && !this.is_multiple) {
        return this.results_show();
      } else if (this.result_highlight) {
        sibs = this.result_highlight.previousSiblings();
        actives = this.search_results.select("li.active-result");
        prevs = sibs.intersect(actives);
        if (prevs.length) {
          return this.result_do_highlight(prevs.first());
        } else {
          if (this.choices_count() > 0) {
            this.results_hide();
          }
          return this.result_clear_highlight();
        }
      }
    };

    Chosen.prototype.keydown_backstroke = function () {
      var next_available_destroy;
      if (this.pending_backstroke) {
        this.choice_destroy(this.pending_backstroke.down("a"));
        return this.clear_backstroke();
      } else {
        next_available_destroy = this.search_container.siblings().last();
        if (next_available_destroy && next_available_destroy.hasClassName("search-choice") && !next_available_destroy.hasClassName("search-choice-disabled")) {
          this.pending_backstroke = next_available_destroy;
          if (this.pending_backstroke) {
            this.pending_backstroke.addClassName("search-choice-focus");
          }
          if (this.single_backstroke_delete) {
            return this.keydown_backstroke();
          } else {
            return this.pending_backstroke.addClassName("search-choice-focus");
          }
        }
      }
    };

    Chosen.prototype.clear_backstroke = function () {
      if (this.pending_backstroke) {
        this.pending_backstroke.removeClassName("search-choice-focus");
      }
      return this.pending_backstroke = null;
    };

    Chosen.prototype.search_field_scale = function () {
      var container_width, div, style, style_block, styles, width, _i, _len;
      if (!this.is_multiple) {
        return;
      }
      style_block = {
        position: 'absolute',
        left: '-1000px',
        top: '-1000px',
        display: 'none',
        whiteSpace: 'pre'
      };
      styles = ['fontSize', 'fontStyle', 'fontWeight', 'fontFamily', 'lineHeight', 'textTransform', 'letterSpacing'];
      for (_i = 0, _len = styles.length; _i < _len; _i++) {
        style = styles[_i];
        style_block[style] = this.search_field.getStyle(style);
      }
      div = new Element('div').update(this.escape_html(this.get_search_field_value()));
      div.setStyle(style_block);
      document.body.appendChild(div);
      width = div.measure('width') + 25;
      div.remove();
      container_width = this.container.getWidth();
      width = Math.min(container_width - 10, width);
      return this.search_field.setStyle({
        width: width + 'px'
      });
    };

    Chosen.prototype.trigger_form_field_change = function () {
      triggerHtmlEvent(this.form_field, 'input');
      return triggerHtmlEvent(this.form_field, 'change');
    };

    triggerHtmlEvent = function (element, eventType) {
      var evt;
      if (element.dispatchEvent) {
        try {
          evt = new Event(eventType, {
            bubbles: true,
            cancelable: true
          });
        } catch (_error) {
          evt = document.createEvent('HTMLEvents');
          evt.initEvent(eventType, true, true);
        }
        return element.dispatchEvent(evt);
      } else {
        return element.fireEvent("on" + eventType, document.createEventObject());
      }
    };

    return Chosen;
  }(AbstractChosen);
}).call(this);
/* Chosen v1.7.0 | (c) 2011-2017 by Harvest | MIT License, https://github.com/harvesthq/chosen/blob/master/LICENSE.md */
(function () {
  var a,
      b,
      c,
      d = function (a, b) {
    return function () {
      return a.apply(b, arguments);
    };
  },
      e = {}.hasOwnProperty,
      f = function (a, b) {
    function c() {
      this.constructor = a;
    }for (var d in b) e.call(b, d) && (a[d] = b[d]);return c.prototype = b.prototype, a.prototype = new c(), a.__super__ = b.prototype, a;
  };b = function () {
    function a() {
      this.options_index = 0, this.parsed = [];
    }return a.prototype.add_node = function (a) {
      return "OPTGROUP" === a.nodeName.toUpperCase() ? this.add_group(a) : this.add_option(a);
    }, a.prototype.add_group = function (a) {
      var b, c, d, e, f, g;for (b = this.parsed.length, this.parsed.push({ array_index: b, group: !0, label: this.escapeExpression(a.label), title: a.title ? a.title : void 0, children: 0, disabled: a.disabled, classes: a.className }), f = a.childNodes, g = [], d = 0, e = f.length; e > d; d++) c = f[d], g.push(this.add_option(c, b, a.disabled));return g;
    }, a.prototype.add_option = function (a, b, c) {
      return "OPTION" === a.nodeName.toUpperCase() ? ("" !== a.text ? (null != b && (this.parsed[b].children += 1), this.parsed.push({ array_index: this.parsed.length, options_index: this.options_index, value: a.value, text: a.text, html: a.innerHTML, title: a.title ? a.title : void 0, selected: a.selected, disabled: c === !0 ? c : a.disabled, group_array_index: b, group_label: null != b ? this.parsed[b].label : null, classes: a.className, style: a.style.cssText })) : this.parsed.push({ array_index: this.parsed.length, options_index: this.options_index, empty: !0 }), this.options_index += 1) : void 0;
    }, a.prototype.escapeExpression = function (a) {
      var b, c;return null == a || a === !1 ? "" : /[\&\<\>\"\'\`]/.test(a) ? (b = { "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;", "`": "&#x60;" }, c = /&(?!\w+;)|[\<\>\"\'\`]/g, a.replace(c, function (a) {
        return b[a] || "&amp;";
      })) : a;
    }, a;
  }(), b.select_to_array = function (a) {
    var c, d, e, f, g;for (d = new b(), g = a.childNodes, e = 0, f = g.length; f > e; e++) c = g[e], d.add_node(c);return d.parsed;
  }, a = function () {
    function a(b, c) {
      this.form_field = b, this.options = null != c ? c : {}, this.label_click_handler = d(this.label_click_handler, this), a.browser_is_supported() && (this.is_multiple = this.form_field.multiple, this.set_default_text(), this.set_default_values(), this.setup(), this.set_up_html(), this.register_observers(), this.on_ready());
    }return a.prototype.set_default_values = function () {
      var a = this;return this.click_test_action = function (b) {
        return a.test_active_click(b);
      }, this.activate_action = function (b) {
        return a.activate_field(b);
      }, this.active_field = !1, this.mouse_on_container = !1, this.results_showing = !1, this.result_highlighted = null, this.is_rtl = this.options.rtl || /\bchosen-rtl\b/.test(this.form_field.className), this.allow_single_deselect = null != this.options.allow_single_deselect && null != this.form_field.options[0] && "" === this.form_field.options[0].text ? this.options.allow_single_deselect : !1, this.disable_search_threshold = this.options.disable_search_threshold || 0, this.disable_search = this.options.disable_search || !1, this.enable_split_word_search = null != this.options.enable_split_word_search ? this.options.enable_split_word_search : !0, this.group_search = null != this.options.group_search ? this.options.group_search : !0, this.search_contains = this.options.search_contains || !1, this.single_backstroke_delete = null != this.options.single_backstroke_delete ? this.options.single_backstroke_delete : !0, this.max_selected_options = this.options.max_selected_options || 1 / 0, this.inherit_select_classes = this.options.inherit_select_classes || !1, this.display_selected_options = null != this.options.display_selected_options ? this.options.display_selected_options : !0, this.display_disabled_options = null != this.options.display_disabled_options ? this.options.display_disabled_options : !0, this.include_group_label_in_selected = this.options.include_group_label_in_selected || !1, this.max_shown_results = this.options.max_shown_results || Number.POSITIVE_INFINITY, this.case_sensitive_search = this.options.case_sensitive_search || !1, this.hide_results_on_select = null != this.options.hide_results_on_select ? this.options.hide_results_on_select : !0;
    }, a.prototype.set_default_text = function () {
      return this.form_field.getAttribute("data-placeholder") ? this.default_text = this.form_field.getAttribute("data-placeholder") : this.is_multiple ? this.default_text = this.options.placeholder_text_multiple || this.options.placeholder_text || a.default_multiple_text : this.default_text = this.options.placeholder_text_single || this.options.placeholder_text || a.default_single_text, this.default_text = this.escape_html(this.default_text), this.results_none_found = this.form_field.getAttribute("data-no_results_text") || this.options.no_results_text || a.default_no_result_text;
    }, a.prototype.choice_label = function (a) {
      return this.include_group_label_in_selected && null != a.group_label ? "<b class='group-name'>" + a.group_label + "</b>" + a.html : a.html;
    }, a.prototype.mouse_enter = function () {
      return this.mouse_on_container = !0;
    }, a.prototype.mouse_leave = function () {
      return this.mouse_on_container = !1;
    }, a.prototype.input_focus = function (a) {
      var b = this;if (this.is_multiple) {
        if (!this.active_field) return setTimeout(function () {
          return b.container_mousedown();
        }, 50);
      } else if (!this.active_field) return this.activate_field();
    }, a.prototype.input_blur = function (a) {
      var b = this;return this.mouse_on_container ? void 0 : (this.active_field = !1, setTimeout(function () {
        return b.blur_test();
      }, 100));
    }, a.prototype.label_click_handler = function (a) {
      return this.is_multiple ? this.container_mousedown(a) : this.activate_field();
    }, a.prototype.results_option_build = function (a) {
      var b, c, d, e, f, g, h;for (b = "", e = 0, h = this.results_data, f = 0, g = h.length; g > f && (c = h[f], d = "", d = c.group ? this.result_add_group(c) : this.result_add_option(c), "" !== d && (e++, b += d), (null != a ? a.first : void 0) && (c.selected && this.is_multiple ? this.choice_build(c) : c.selected && !this.is_multiple && this.single_set_selected_text(this.choice_label(c))), !(e >= this.max_shown_results)); f++);return b;
    }, a.prototype.result_add_option = function (a) {
      var b, c;return a.search_match && this.include_option_in_results(a) ? (b = [], a.disabled || a.selected && this.is_multiple || b.push("active-result"), !a.disabled || a.selected && this.is_multiple || b.push("disabled-result"), a.selected && b.push("result-selected"), null != a.group_array_index && b.push("group-option"), "" !== a.classes && b.push(a.classes), c = document.createElement("li"), c.className = b.join(" "), c.style.cssText = a.style, c.setAttribute("data-option-array-index", a.array_index), c.innerHTML = a.search_text, a.title && (c.title = a.title), this.outerHTML(c)) : "";
    }, a.prototype.result_add_group = function (a) {
      var b, c;return (a.search_match || a.group_match) && a.active_options > 0 ? (b = [], b.push("group-result"), a.classes && b.push(a.classes), c = document.createElement("li"), c.className = b.join(" "), c.innerHTML = a.search_text, a.title && (c.title = a.title), this.outerHTML(c)) : "";
    }, a.prototype.results_update_field = function () {
      return this.set_default_text(), this.is_multiple || this.results_reset_cleanup(), this.result_clear_highlight(), this.results_build(), this.results_showing ? this.winnow_results() : void 0;
    }, a.prototype.reset_single_select_options = function () {
      var a, b, c, d, e;for (d = this.results_data, e = [], b = 0, c = d.length; c > b; b++) a = d[b], a.selected ? e.push(a.selected = !1) : e.push(void 0);return e;
    }, a.prototype.results_toggle = function () {
      return this.results_showing ? this.results_hide() : this.results_show();
    }, a.prototype.results_search = function (a) {
      return this.results_showing ? this.winnow_results() : this.results_show();
    }, a.prototype.winnow_results = function () {
      var a, b, c, d, e, f, g, h, i, j, k, l;for (this.no_results_clear(), e = 0, g = this.get_search_text(), a = g.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), d = this.get_search_regex(a), b = this.get_highlight_regex(a), l = this.results_data, j = 0, k = l.length; k > j; j++) c = l[j], c.search_match = !1, f = null, this.include_option_in_results(c) && (c.group && (c.group_match = !1, c.active_options = 0), null != c.group_array_index && this.results_data[c.group_array_index] && (f = this.results_data[c.group_array_index], 0 === f.active_options && f.search_match && (e += 1), f.active_options += 1), c.search_text = c.group ? c.label : c.html, (!c.group || this.group_search) && (c.search_match = this.search_string_match(c.search_text, d), c.search_match && !c.group && (e += 1), c.search_match ? (g.length && (h = c.search_text.search(b), i = c.search_text.substr(0, h + g.length) + "</em>" + c.search_text.substr(h + g.length), c.search_text = i.substr(0, h) + "<em>" + i.substr(h)), null != f && (f.group_match = !0)) : null != c.group_array_index && this.results_data[c.group_array_index].search_match && (c.search_match = !0)));return this.result_clear_highlight(), 1 > e && g.length ? (this.update_results_content(""), this.no_results(g)) : (this.update_results_content(this.results_option_build()), this.winnow_results_set_highlight());
    }, a.prototype.get_search_regex = function (a) {
      var b, c;return b = this.search_contains ? "" : "^", c = this.case_sensitive_search ? "" : "i", new RegExp(b + a, c);
    }, a.prototype.get_highlight_regex = function (a) {
      var b, c;return b = this.search_contains ? "" : "\\b", c = this.case_sensitive_search ? "" : "i", new RegExp(b + a, c);
    }, a.prototype.search_string_match = function (a, b) {
      var c, d, e, f;if (b.test(a)) return !0;if (this.enable_split_word_search && (a.indexOf(" ") >= 0 || 0 === a.indexOf("[")) && (d = a.replace(/\[|\]/g, "").split(" "), d.length)) for (e = 0, f = d.length; f > e; e++) if (c = d[e], b.test(c)) return !0;
    }, a.prototype.choices_count = function () {
      var a, b, c, d;if (null != this.selected_option_count) return this.selected_option_count;for (this.selected_option_count = 0, d = this.form_field.options, b = 0, c = d.length; c > b; b++) a = d[b], a.selected && (this.selected_option_count += 1);return this.selected_option_count;
    }, a.prototype.choices_click = function (a) {
      return a.preventDefault(), this.activate_field(), this.results_showing || this.is_disabled ? void 0 : this.results_show();
    }, a.prototype.keydown_checker = function (a) {
      var b, c;switch (b = null != (c = a.which) ? c : a.keyCode, this.search_field_scale(), 8 !== b && this.pending_backstroke && this.clear_backstroke(), b) {case 8:
          this.backstroke_length = this.get_search_field_value().length;break;case 9:
          this.results_showing && !this.is_multiple && this.result_select(a), this.mouse_on_container = !1;break;case 13:
          this.results_showing && a.preventDefault();break;case 27:
          this.results_showing && a.preventDefault();break;case 32:
          this.disable_search && a.preventDefault();break;case 38:
          a.preventDefault(), this.keyup_arrow();break;case 40:
          a.preventDefault(), this.keydown_arrow();}
    }, a.prototype.keyup_checker = function (a) {
      var b, c;switch (b = null != (c = a.which) ? c : a.keyCode, this.search_field_scale(), b) {case 8:
          this.is_multiple && this.backstroke_length < 1 && this.choices_count() > 0 ? this.keydown_backstroke() : this.pending_backstroke || (this.result_clear_highlight(), this.results_search());break;case 13:
          a.preventDefault(), this.results_showing && this.result_select(a);break;case 27:
          this.results_showing && this.results_hide();break;case 9:case 16:case 17:case 18:case 38:case 40:case 91:
          break;default:
          this.results_search();}
    }, a.prototype.clipboard_event_checker = function (a) {
      var b = this;if (!this.is_disabled) return setTimeout(function () {
        return b.results_search();
      }, 50);
    }, a.prototype.container_width = function () {
      return null != this.options.width ? this.options.width : "" + this.form_field.offsetWidth + "px";
    }, a.prototype.include_option_in_results = function (a) {
      return this.is_multiple && !this.display_selected_options && a.selected ? !1 : !this.display_disabled_options && a.disabled ? !1 : a.empty ? !1 : !0;
    }, a.prototype.search_results_touchstart = function (a) {
      return this.touch_started = !0, this.search_results_mouseover(a);
    }, a.prototype.search_results_touchmove = function (a) {
      return this.touch_started = !1, this.search_results_mouseout(a);
    }, a.prototype.search_results_touchend = function (a) {
      return this.touch_started ? this.search_results_mouseup(a) : void 0;
    }, a.prototype.outerHTML = function (a) {
      var b;return a.outerHTML ? a.outerHTML : (b = document.createElement("div"), b.appendChild(a), b.innerHTML);
    }, a.prototype.get_single_html = function () {
      return '<a class="chosen-single chosen-default">\n  <span>' + this.default_text + '</span>\n  <div><b></b></div>\n</a>\n<div class="chosen-drop">\n  <div class="chosen-search">\n    <input class="chosen-search-input" type="text" autocomplete="off" />\n  </div>\n  <ul class="chosen-results"></ul>\n</div>';
    }, a.prototype.get_multi_html = function () {
      return '<ul class="chosen-choices">\n  <li class="search-field">\n    <input class="chosen-search-input" type="text" autocomplete="off" value="' + this.default_text + '" />\n  </li>\n</ul>\n<div class="chosen-drop">\n  <ul class="chosen-results"></ul>\n</div>';
    }, a.prototype.get_no_results_html = function (a) {
      return '<li class="no-results">\n  ' + this.results_none_found + " <span>" + a + "</span>\n</li>";
    }, a.browser_is_supported = function () {
      return "Microsoft Internet Explorer" === window.navigator.appName ? document.documentMode >= 8 : /iP(od|hone)/i.test(window.navigator.userAgent) || /IEMobile/i.test(window.navigator.userAgent) || /Windows Phone/i.test(window.navigator.userAgent) || /BlackBerry/i.test(window.navigator.userAgent) || /BB10/i.test(window.navigator.userAgent) || /Android.*Mobile/i.test(window.navigator.userAgent) ? !1 : !0;
    }, a.default_multiple_text = "Select Some Options", a.default_single_text = "Select an Option", a.default_no_result_text = "No results match", a;
  }(), this.Chosen = function (a) {
    function d() {
      return c = d.__super__.constructor.apply(this, arguments);
    }var e;return f(d, a), d.prototype.setup = function () {
      return this.current_selectedIndex = this.form_field.selectedIndex;
    }, d.prototype.set_default_values = function () {
      return d.__super__.set_default_values.call(this), this.no_results_temp = new Template(this.get_no_results_html("#{terms}"));
    }, d.prototype.set_up_html = function () {
      var a, b;return a = ["chosen-container"], a.push("chosen-container-" + (this.is_multiple ? "multi" : "single")), this.inherit_select_classes && this.form_field.className && a.push(this.form_field.className), this.is_rtl && a.push("chosen-rtl"), b = { "class": a.join(" "), title: this.form_field.title }, this.form_field.id.length && (b.id = this.form_field.id.replace(/[^\w]/g, "_") + "_chosen"), this.container = new Element("div", b), this.container.setStyle({ width: this.container_width() }), this.is_multiple ? this.container.update(this.get_multi_html()) : this.container.update(this.get_single_html()), this.form_field.hide().insert({ after: this.container }), this.dropdown = this.container.down("div.chosen-drop"), this.search_field = this.container.down("input"), this.search_results = this.container.down("ul.chosen-results"), this.search_field_scale(), this.search_no_results = this.container.down("li.no-results"), this.is_multiple ? (this.search_choices = this.container.down("ul.chosen-choices"), this.search_container = this.container.down("li.search-field")) : (this.search_container = this.container.down("div.chosen-search"), this.selected_item = this.container.down(".chosen-single")), this.results_build(), this.set_tab_index(), this.set_label_behavior();
    }, d.prototype.on_ready = function () {
      return this.form_field.fire("chosen:ready", { chosen: this });
    }, d.prototype.register_observers = function () {
      var a = this;return this.container.observe("touchstart", function (b) {
        return a.container_mousedown(b);
      }), this.container.observe("touchend", function (b) {
        return a.container_mouseup(b);
      }), this.container.observe("mousedown", function (b) {
        return a.container_mousedown(b);
      }), this.container.observe("mouseup", function (b) {
        return a.container_mouseup(b);
      }), this.container.observe("mouseenter", function (b) {
        return a.mouse_enter(b);
      }), this.container.observe("mouseleave", function (b) {
        return a.mouse_leave(b);
      }), this.search_results.observe("mouseup", function (b) {
        return a.search_results_mouseup(b);
      }), this.search_results.observe("mouseover", function (b) {
        return a.search_results_mouseover(b);
      }), this.search_results.observe("mouseout", function (b) {
        return a.search_results_mouseout(b);
      }), this.search_results.observe("mousewheel", function (b) {
        return a.search_results_mousewheel(b);
      }), this.search_results.observe("DOMMouseScroll", function (b) {
        return a.search_results_mousewheel(b);
      }), this.search_results.observe("touchstart", function (b) {
        return a.search_results_touchstart(b);
      }), this.search_results.observe("touchmove", function (b) {
        return a.search_results_touchmove(b);
      }), this.search_results.observe("touchend", function (b) {
        return a.search_results_touchend(b);
      }), this.form_field.observe("chosen:updated", function (b) {
        return a.results_update_field(b);
      }), this.form_field.observe("chosen:activate", function (b) {
        return a.activate_field(b);
      }), this.form_field.observe("chosen:open", function (b) {
        return a.container_mousedown(b);
      }), this.form_field.observe("chosen:close", function (b) {
        return a.close_field(b);
      }), this.search_field.observe("blur", function (b) {
        return a.input_blur(b);
      }), this.search_field.observe("keyup", function (b) {
        return a.keyup_checker(b);
      }), this.search_field.observe("keydown", function (b) {
        return a.keydown_checker(b);
      }), this.search_field.observe("focus", function (b) {
        return a.input_focus(b);
      }), this.search_field.observe("cut", function (b) {
        return a.clipboard_event_checker(b);
      }), this.search_field.observe("paste", function (b) {
        return a.clipboard_event_checker(b);
      }), this.is_multiple ? this.search_choices.observe("click", function (b) {
        return a.choices_click(b);
      }) : this.container.observe("click", function (a) {
        return a.preventDefault();
      });
    }, d.prototype.destroy = function () {
      var a, b, c, d;for (this.container.ownerDocument.stopObserving("click", this.click_test_action), d = ["chosen:updated", "chosen:activate", "chosen:open", "chosen:close"], b = 0, c = d.length; c > b; b++) a = d[b], this.form_field.stopObserving(a);return this.container.stopObserving(), this.search_results.stopObserving(), this.search_field.stopObserving(), null != this.form_field_label && this.form_field_label.stopObserving(), this.is_multiple ? (this.search_choices.stopObserving(), this.container.select(".search-choice-close").each(function (a) {
        return a.stopObserving();
      })) : this.selected_item.stopObserving(), this.search_field.tabIndex && (this.form_field.tabIndex = this.search_field.tabIndex), this.container.remove(), this.form_field.show();
    }, d.prototype.search_field_disabled = function () {
      var a;return this.is_disabled = this.form_field.disabled || (null != (a = this.form_field.up("fieldset")) ? a.disabled : void 0) || !1, this.is_disabled ? this.container.addClassName("chosen-disabled") : this.container.removeClassName("chosen-disabled"), this.search_field.disabled = this.is_disabled, this.is_multiple || this.selected_item.stopObserving("focus", this.activate_field), this.is_disabled ? this.close_field() : this.is_multiple ? void 0 : this.selected_item.observe("focus", this.activate_field);
    }, d.prototype.container_mousedown = function (a) {
      var b;if (!this.is_disabled) return !a || "mousedown" !== (b = a.type) && "touchstart" !== b || this.results_showing || a.preventDefault(), null != a && a.target.hasClassName("search-choice-close") ? void 0 : (this.active_field ? this.is_multiple || !a || a.target !== this.selected_item && !a.target.up("a.chosen-single") || this.results_toggle() : (this.is_multiple && this.search_field.clear(), this.container.ownerDocument.observe("click", this.click_test_action), this.results_show()), this.activate_field());
    }, d.prototype.container_mouseup = function (a) {
      return "ABBR" !== a.target.nodeName || this.is_disabled ? void 0 : this.results_reset(a);
    }, d.prototype.search_results_mousewheel = function (a) {
      var b;return b = a.deltaY || -a.wheelDelta || a.detail, null != b ? (a.preventDefault(), "DOMMouseScroll" === a.type && (b = 40 * b), this.search_results.scrollTop = b + this.search_results.scrollTop) : void 0;
    }, d.prototype.blur_test = function (a) {
      return !this.active_field && this.container.hasClassName("chosen-container-active") ? this.close_field() : void 0;
    }, d.prototype.close_field = function () {
      return this.container.ownerDocument.stopObserving("click", this.click_test_action), this.active_field = !1, this.results_hide(), this.container.removeClassName("chosen-container-active"), this.clear_backstroke(), this.show_search_field_default(), this.search_field_scale(), this.search_field.blur();
    }, d.prototype.activate_field = function () {
      return this.is_disabled ? void 0 : (this.container.addClassName("chosen-container-active"), this.active_field = !0, this.search_field.value = this.get_search_field_value(), this.search_field.focus());
    }, d.prototype.test_active_click = function (a) {
      return a.target.up(".chosen-container") === this.container ? this.active_field = !0 : this.close_field();
    }, d.prototype.results_build = function () {
      return this.parsing = !0, this.selected_option_count = null, this.results_data = b.select_to_array(this.form_field), this.is_multiple ? this.search_choices.select("li.search-choice").invoke("remove") : this.is_multiple || (this.single_set_selected_text(), this.disable_search || this.form_field.options.length <= this.disable_search_threshold ? (this.search_field.readOnly = !0, this.container.addClassName("chosen-container-single-nosearch")) : (this.search_field.readOnly = !1, this.container.removeClassName("chosen-container-single-nosearch"))), this.update_results_content(this.results_option_build({ first: !0 })), this.search_field_disabled(), this.show_search_field_default(), this.search_field_scale(), this.parsing = !1;
    }, d.prototype.result_do_highlight = function (a) {
      var b, c, d, e, f;return this.result_clear_highlight(), this.result_highlight = a, this.result_highlight.addClassName("highlighted"), d = parseInt(this.search_results.getStyle("maxHeight"), 10), f = this.search_results.scrollTop, e = d + f, c = this.result_highlight.positionedOffset().top, b = c + this.result_highlight.getHeight(), b >= e ? this.search_results.scrollTop = b - d > 0 ? b - d : 0 : f > c ? this.search_results.scrollTop = c : void 0;
    }, d.prototype.result_clear_highlight = function () {
      return this.result_highlight && this.result_highlight.removeClassName("highlighted"), this.result_highlight = null;
    }, d.prototype.results_show = function () {
      return this.is_multiple && this.max_selected_options <= this.choices_count() ? (this.form_field.fire("chosen:maxselected", { chosen: this }), !1) : (this.container.addClassName("chosen-with-drop"), this.results_showing = !0, this.search_field.focus(), this.search_field.value = this.get_search_field_value(), this.winnow_results(), this.form_field.fire("chosen:showing_dropdown", { chosen: this }));
    }, d.prototype.update_results_content = function (a) {
      return this.search_results.update(a);
    }, d.prototype.results_hide = function () {
      return this.results_showing && (this.result_clear_highlight(), this.container.removeClassName("chosen-with-drop"), this.form_field.fire("chosen:hiding_dropdown", { chosen: this })), this.results_showing = !1;
    }, d.prototype.set_tab_index = function (a) {
      var b;return this.form_field.tabIndex ? (b = this.form_field.tabIndex, this.form_field.tabIndex = -1, this.search_field.tabIndex = b) : void 0;
    }, d.prototype.set_label_behavior = function () {
      return this.form_field_label = this.form_field.up("label"), null == this.form_field_label && (this.form_field_label = $$("label[for='" + this.form_field.id + "']").first()), null != this.form_field_label ? this.form_field_label.observe("click", this.label_click_handler) : void 0;
    }, d.prototype.show_search_field_default = function () {
      return this.is_multiple && this.choices_count() < 1 && !this.active_field ? (this.search_field.value = this.default_text, this.search_field.addClassName("default")) : (this.search_field.value = "", this.search_field.removeClassName("default"));
    }, d.prototype.search_results_mouseup = function (a) {
      var b;return b = a.target.hasClassName("active-result") ? a.target : a.target.up(".active-result"), b ? (this.result_highlight = b, this.result_select(a), this.search_field.focus()) : void 0;
    }, d.prototype.search_results_mouseover = function (a) {
      var b;return b = a.target.hasClassName("active-result") ? a.target : a.target.up(".active-result"), b ? this.result_do_highlight(b) : void 0;
    }, d.prototype.search_results_mouseout = function (a) {
      return a.target.hasClassName("active-result") || a.target.up(".active-result") ? this.result_clear_highlight() : void 0;
    }, d.prototype.choice_build = function (a) {
      var b,
          c,
          d = this;return b = new Element("li", { "class": "search-choice" }).update("<span>" + this.choice_label(a) + "</span>"), a.disabled ? b.addClassName("search-choice-disabled") : (c = new Element("a", { href: "#", "class": "search-choice-close", rel: a.array_index }), c.observe("click", function (a) {
        return d.choice_destroy_link_click(a);
      }), b.insert(c)), this.search_container.insert({ before: b });
    }, d.prototype.choice_destroy_link_click = function (a) {
      return a.preventDefault(), a.stopPropagation(), this.is_disabled ? void 0 : this.choice_destroy(a.target);
    }, d.prototype.choice_destroy = function (a) {
      return this.result_deselect(a.readAttribute("rel")) ? (this.active_field ? this.search_field.focus() : this.show_search_field_default(), this.is_multiple && this.choices_count() > 0 && this.get_search_field_value().length < 1 && this.results_hide(), a.up("li").remove(), this.search_field_scale()) : void 0;
    }, d.prototype.results_reset = function () {
      return this.reset_single_select_options(), this.form_field.options[0].selected = !0, this.single_set_selected_text(), this.show_search_field_default(), this.results_reset_cleanup(), this.trigger_form_field_change(), this.active_field ? this.results_hide() : void 0;
    }, d.prototype.results_reset_cleanup = function () {
      var a;return this.current_selectedIndex = this.form_field.selectedIndex, a = this.selected_item.down("abbr"), a ? a.remove() : void 0;
    }, d.prototype.result_select = function (a) {
      var b, c;return this.result_highlight ? (b = this.result_highlight, this.result_clear_highlight(), this.is_multiple && this.max_selected_options <= this.choices_count() ? (this.form_field.fire("chosen:maxselected", { chosen: this }), !1) : (this.is_multiple ? b.removeClassName("active-result") : this.reset_single_select_options(), b.addClassName("result-selected"), c = this.results_data[b.getAttribute("data-option-array-index")], c.selected = !0, this.form_field.options[c.options_index].selected = !0, this.selected_option_count = null, this.is_multiple ? this.choice_build(c) : this.single_set_selected_text(this.choice_label(c)), (!this.is_multiple || this.hide_results_on_select && !a.metaKey && !a.ctrlKey) && (this.results_hide(), this.show_search_field_default()), (this.is_multiple || this.form_field.selectedIndex !== this.current_selectedIndex) && this.trigger_form_field_change(), this.current_selectedIndex = this.form_field.selectedIndex, a.preventDefault(), this.search_field_scale())) : void 0;
    }, d.prototype.single_set_selected_text = function (a) {
      return null == a && (a = this.default_text), a === this.default_text ? this.selected_item.addClassName("chosen-default") : (this.single_deselect_control_build(), this.selected_item.removeClassName("chosen-default")), this.selected_item.down("span").update(a);
    }, d.prototype.result_deselect = function (a) {
      var b;return b = this.results_data[a], this.form_field.options[b.options_index].disabled ? !1 : (b.selected = !1, this.form_field.options[b.options_index].selected = !1, this.selected_option_count = null, this.result_clear_highlight(), this.results_showing && this.winnow_results(), this.trigger_form_field_change(), this.search_field_scale(), !0);
    }, d.prototype.single_deselect_control_build = function () {
      return this.allow_single_deselect ? (this.selected_item.down("abbr") || this.selected_item.down("span").insert({ after: '<abbr class="search-choice-close"></abbr>' }), this.selected_item.addClassName("chosen-single-with-deselect")) : void 0;
    }, d.prototype.get_search_field_value = function () {
      return this.search_field.value;
    }, d.prototype.get_search_text = function () {
      return this.escape_html(this.get_search_field_value().strip());
    }, d.prototype.escape_html = function (a) {
      return a.escapeHTML();
    }, d.prototype.winnow_results_set_highlight = function () {
      var a;return this.is_multiple || (a = this.search_results.down(".result-selected.active-result")), null == a && (a = this.search_results.down(".active-result")), null != a ? this.result_do_highlight(a) : void 0;
    }, d.prototype.no_results = function (a) {
      return this.search_results.insert(this.no_results_temp.evaluate({ terms: a })), this.form_field.fire("chosen:no_results", { chosen: this });
    }, d.prototype.no_results_clear = function () {
      var a, b;for (a = null, b = []; a = this.search_results.down(".no-results");) b.push(a.remove());return b;
    }, d.prototype.keydown_arrow = function () {
      var a;return this.results_showing && this.result_highlight ? (a = this.result_highlight.next(".active-result")) ? this.result_do_highlight(a) : void 0 : this.results_show();
    }, d.prototype.keyup_arrow = function () {
      var a, b, c;return this.results_showing || this.is_multiple ? this.result_highlight ? (c = this.result_highlight.previousSiblings(), a = this.search_results.select("li.active-result"), b = c.intersect(a), b.length ? this.result_do_highlight(b.first()) : (this.choices_count() > 0 && this.results_hide(), this.result_clear_highlight())) : void 0 : this.results_show();
    }, d.prototype.keydown_backstroke = function () {
      var a;return this.pending_backstroke ? (this.choice_destroy(this.pending_backstroke.down("a")), this.clear_backstroke()) : (a = this.search_container.siblings().last(), a && a.hasClassName("search-choice") && !a.hasClassName("search-choice-disabled") ? (this.pending_backstroke = a, this.pending_backstroke && this.pending_backstroke.addClassName("search-choice-focus"), this.single_backstroke_delete ? this.keydown_backstroke() : this.pending_backstroke.addClassName("search-choice-focus")) : void 0);
    }, d.prototype.clear_backstroke = function () {
      return this.pending_backstroke && this.pending_backstroke.removeClassName("search-choice-focus"), this.pending_backstroke = null;
    }, d.prototype.search_field_scale = function () {
      var a, b, c, d, e, f, g, h;if (this.is_multiple) {
        for (d = { position: "absolute", left: "-1000px", top: "-1000px", display: "none", whiteSpace: "pre" }, e = ["fontSize", "fontStyle", "fontWeight", "fontFamily", "lineHeight", "textTransform", "letterSpacing"], g = 0, h = e.length; h > g; g++) c = e[g], d[c] = this.search_field.getStyle(c);return b = new Element("div").update(this.escape_html(this.get_search_field_value())), b.setStyle(d), document.body.appendChild(b), f = b.measure("width") + 25, b.remove(), a = this.container.getWidth(), f = Math.min(a - 10, f), this.search_field.setStyle({ width: f + "px" });
      }
    }, d.prototype.trigger_form_field_change = function () {
      return e(this.form_field, "input"), e(this.form_field, "change");
    }, e = function (a, b) {
      var c;if (a.dispatchEvent) {
        try {
          c = new Event(b, { bubbles: !0, cancelable: !0 });
        } catch (d) {
          c = document.createEvent("HTMLEvents"), c.initEvent(b, !0, !0);
        }return a.dispatchEvent(c);
      }return a.fireEvent("on" + b, document.createEventObject());
    }, d;
  }(a);
}).call(this);
//# sourceMappingURL=bundle.js.map
