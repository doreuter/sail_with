projectXApp.controller('dashboardController', function($scope, $rootScope, $http, $log, $cookieStore, $state, API_ENDPOINT, AuthService, notify) {

  $scope.user = {};
  $scope.changePasswordModel = {
    oldPassword: '',
    newPassword: '',
    newPasswordConfirm: '',
  };
  $scope.delAccount = {
    password: ''
  };

  if(AuthService.isAuthenticated()) {
    $http.get(API_ENDPOINT.url + '/account')
      .then(function(data) {
        $scope.user = data.data;
      })
      .catch(function(err) {
        $log.debug(err);
      });
  }

  var validForm;
  function validatePasswordForm(passwordModel) {
    validForm = true;
    if(passwordModel.oldPassword === '') {
      notify('Please provide your old password!');
      validForm = false;
    }
    if(passwordModel.newPassword === '') {
      notify('Please enter a new password!');
      validForm = false;
    }
    if(passwordModel.newPassword !== '' && passwordModel.newPasswordConfirm === '') {
      notify('Please confirm your new password!');
      validForm = false;
    }
    if(passwordModel.newPassword !== '' && passwordModel.newPasswordConfirm !== '' && passwordModel.newPassword !== passwordModel.newPasswordConfirm) {
      notify('Your new passwords do not match!');
      validForm = false;
    }
    if(passwordModel.oldPassword === passwordModel.newPassword) {
      notify('You can not use your old password as your new one!');
      validForm = false;
    }
    return validForm;
  }

  $scope.changePassword = function(changePasswordModel) {
    if(validatePasswordForm(changePasswordModel)) {
      $http.put(API_ENDPOINT.url + '/auth/change-password', changePasswordModel)
        .then(function(result) {
          notify('Your password has been successfully changed');
        })
        .catch(function(error) {
          $log.debug(error);
          notify('Your password could not be changed. Please try again later.');
        });
    }
  }

  $scope.deleteAccount = function(delAccount) {
    if(delAccount.password) {
      $http.post(API_ENDPOINT.url + '/auth/delete', delAccount)
        .then(function(result) {
          AuthService.logout();
          $state.go('start');
          notify('Your account has been successfully deleted');
        })
        .catch(function(error) {
          $log.debug(error);
          notify('Your account could not be deleted. Please try again later.');
        });
    }
  };


});
