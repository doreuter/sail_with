projectXApp.service('AuthService', function($q, $http, $log, $cookieStore, API_ENDPOINT) {
  var LOCAL_TOKEN_KEY = 'authToken';
  var isAuthenticated = false;
  var authToken;

  function loadUserCredentials() {
    var token = $cookieStore.get(LOCAL_TOKEN_KEY);
    if(token) {
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

  var register = function(user) {
    return $q(function(resolve, reject) {
      $http.post(API_ENDPOINT.url + '/auth/register', user)
        .then(function(result) {
          if(result.data.success) {
            resolve(result.data.msg);
          } else {
            reject(result.data.msg);
          }
        })
        .catch(function(err) {
          $log.debug(err);
        });
    });
  };

  var login = function(user) {
    return $q(function(resolve, reject) {
      $http.post(API_ENDPOINT.url + '/auth/login', user)
        .then(function(result) {
          if(result.data.success) {
            storeUserCredentials(result.data.token);
            resolve(result.data.msg);
          } else {
            reject(result.data.msg);
          }
        })
        .catch(function(err) {
          $log.debug(err);
        });
    });
  };

  var logout = function() {
    destroyUserCredentials();
  };

  loadUserCredentials();

  return {
    login: login,
    register: register,
    logout: logout,
    isAuthenticated: function() { return isAuthenticated }
  };

});
