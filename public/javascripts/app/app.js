/**
* @author ChzMo
*/

(function() {
  "use strict";

  var app = angular.module('noticallAD', ['ngRoute']);

  app.value('projectName', 'Noticall AD Server');
  //app.value('baseUrl', 'http://210.118.74.170:9000/'); // SECMEM
  app.value('baseUrl', 'http://localhost:3000'); // House

  app.config(function ($routeProvider) {
     $routeProvider
  .when('/signin', {
            controller:'SignInCtrl',
            templateUrl: 'view/template/signin.html'
  })
  .when('/signup', {
            // controller:'SignUpCtrl',
            templateUrl: 'view/template/signup.html'
  })
  .otherwise({ redirectTo: '/signin' });
  });
})();
