projectXApp.controller('loginController', function($rootScope, $scope, $http, $log, $state, AuthService, $location, $cookieStore, notify) {

  //
  $scope.loginUser = {
    'email': '',
    'password': ''
  };

  var validForm = true;
  var loginFormValidate = function() {
    if($scope.loginUser.email === '') {
      $log.debug('loginUser.email empty!');
      validForm = false;
    }
    if($scope.loginUser.password === '') {
      $log.debug('loginUser.password empty!');
      validForm = false;
    }
    $log.debug("validForm: " + validForm);
    return validForm;
  };

  $scope.login = function(loginUser) {
    if(loginFormValidate()) {
      AuthService.login(loginUser).then(function(result) {
        $log.debug(result);
        notify('You have successfully logged in');
        $state.go('dashboard');
      })
      .catch(function(err) {
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
  }

});
