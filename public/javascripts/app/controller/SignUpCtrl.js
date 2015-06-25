/**
* @author ChzMo
*/

(function () {
    "use strict";

    var app = angular.module('noticallAD');

    app.controller('SignUpCtrl', SignUpCtrl);

    SignUpCtrl.$inject = ['$scope', '$window', '$location', 'auth', 'baseUrl'];

    function SignUpCtrl($scope, $window, $location, auth, baseUrl) {
        var vm = this;

        vm.user = {
            username: '',
            mail: '',
            pw: ''
        }

        vm.submitLbl = '회원가입';

        vm.submit = function() {
            console.log(vm.user);

            if ($scope.signUpForm.$valid) {
                vm.submitLbl = "요청중...";

                return auth.signUp(vm.user)
                    .then(function (path) {
                        $location.path(path);
                    })
                    .catch(function () {
                        console.log('Sign up canceled');

                        vm.res_error = error.data.msg;
                        vm.submitLbl = '회원가입';
                    })
                    .finally(function () {
                        vm.submitLbl = vm.res_error ? "완료" : "회원가입";
                    });
            }
            else {
                console.log('signUpForm is not in scope');
            }
        }
    }
}) ();
