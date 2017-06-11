projectXApp.controller('startController', function($scope, $http) {

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



});
