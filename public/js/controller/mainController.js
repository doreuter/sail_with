projectXApp.controller('mainController', function($rootScope, $scope, $state, $log, $http, AuthService, API_ENDPOINT, AUTH_EVENTS, notify) {

  $scope.$on(AUTH_EVENTS.notAuthenticated, function(event) {
    AuthService.logout();
    $state.go('start');
    $rootScope.currentUser = undefined;
    notify('Session lost! \nSorry you have to log in again!');
  });

  if(AuthService.isAuthenticated()) {
    $http.get(API_ENDPOINT.url + '/account' )
      .then(function(data) {
        $rootScope.currentUser = data.data;
      })
      .catch(function(err) {
        $log.debug(err);
      });
  }


  $scope.isAuthenticated = AuthService.isAuthenticated;


  $scope.logout = function() {
    AuthService.logout();
    $state.go('start');
    notify('Logged out!');
  };

});
