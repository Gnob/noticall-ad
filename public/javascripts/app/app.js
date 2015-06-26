/**
* @author ChzMo
*/

(function() {
  "use strict";

  var app = angular.module('noticallAD', ['ngRoute', 'ngCookies', 'ui.bootstrap', 'ngFileUpload']);

  app.value('projectName', 'Noticall AD Server');
  //app.value('baseUrl', 'http://210.118.74.170:9000/'); // SECMEM
  app.value('baseUrl', 'http://localhost:3000'); // House

  app.config(function ($routeProvider) {
     $routeProvider
  .when('/signin', {
            controller:'SignInCtrl',
            controllerAs: 'signin',
            templateUrl: 'templates/signin.html'
  })
  .when('/signup', {
            controller:'SignUpCtrl',
            controllerAs: 'signup',
            templateUrl: 'templates/signup.html'
  })
  .when('/main', {
            controller:'MainCtrl',
            controllerAs: 'main',
            templateUrl: 'templates/main.html'
  })
  .when('/manager', {
            controller:'ManagerCtrl',
            controllerAs: 'manager',
            templateUrl: 'templates/manager.html'
  })
  .otherwise({ redirectTo: '/signin' });
  });

  app.config(function($locationProvider) {
      $locationProvider.html5Mode(true).hashPrefix('!');
  });
})();
