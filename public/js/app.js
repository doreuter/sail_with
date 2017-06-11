'use strict';

var projectXApp = angular.module('projectXApp',
  [
    'ui.router',
    'angular-loading-bar',
    'cgNotify',
    'ngCookies',
    'ngSanitize',
    'LocalStorageModule',
    'angular-jwt',
    'mm.foundation'
  ]
);

projectXApp.constant('API_ENDPOINT', {
  url: 'http://localhost:5050/api'
});

projectXApp.constant('AUTH_EVENTS', {
  notAuthenticated: 'auth-not-authenticated'
});

projectXApp.config(function ($stateProvider, $urlRouterProvider, $locationProvider) {

  $urlRouterProvider.otherwise('/');

  $locationProvider.html5Mode({
    enabled: true,
    rewriteLinks: false
  });

  $stateProvider
    .state('start', {
      url: '/',
      templateUrl: 'templates/start.html',
      controller: 'startController',
      controllerAs: 'vm'
    })
    .state('register', {
      url: '/register',
      templateUrl: 'templates/register.html',
      controller: 'registerController'
    })
    .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'loginController'
    })
    .state('dashboard', {
      url: '/dashboard',
      templateUrl: 'templates/dashboard.html',
      controller: 'dashboardController'
    });
});

projectXApp.config(function ($logProvider) {
  $logProvider.debugEnabled(true);
});

projectXApp.config(function (cfpLoadingBarProvider) {
  //deactivate spinner and show only loading bar
  cfpLoadingBarProvider.includeSpinner = false;}
);

projectXApp.config(function ($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
});

projectXApp.run(function($rootScope, $state, AuthService, AUTH_EVENTS, notify) {
  notify.config({
    position: 'right',
    duration: 4000,
    startTop: 80
  });
  $rootScope.$on('$viewContentLoaded', function () {
    //$(document).foundation();
  });
  $rootScope.$on('$stateChangeStart', function(event, next, nextParams, fromState) {
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
  $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
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
  $rootScope.$on('$stateNotFound', function(event, unfoundState, fromState, fromParams) {
    $log.debug(event);
    $log.debug(unfoundState);
    $log.debug(fromState);
    $log.debug(fromParams);
  });
});
