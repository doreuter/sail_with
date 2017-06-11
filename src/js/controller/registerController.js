projectXApp.controller('registerController', function($scope, $http, $log, $location, $state, $timeout, AuthService, notify) {

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
    var registerFormValidate = function() {
        validForm = true;
        //check if fields are not empty
        if($scope.registerUser.name === '') {
            $log.debug('registerUser.name empty!');
            validForm = false;
        }
        if($scope.registerUser.email === '') {
            $log.debug('registerUser.email empty!');
            validForm = false;
        }
        if($scope.registerUser.password === '') {
            $log.debug('registerUser.password empty!');
            validForm = false;
        }
        if($scope.validateData.confirmPassword === '') {
            $log.debug('confirmPassword.cpw empty!');
            validForm = false;
        }
        // check if pw's match
        if($scope.registerUser.password !== $scope.validateData.confirmPassword) {
            $log.debug('Passwords do no match!');
            validForm = false;
        }
        if($scope.validateData.terms === false) {
            $log.debug('Didn\'t accepted the terms!');
            validForm = false;
        }
        $log.debug("validForm: " + validForm);
        return validForm;
    };

    //
    $scope.register = function(registerUser) {
        if(registerFormValidate()) {
          AuthService.register(registerUser).then(function(msg) {
            notify('You successfully signed up!');
            notify('Please log in!');
            $state.go('start');
          }, function(errMsg) {
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

});
