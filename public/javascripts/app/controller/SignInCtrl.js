/**
* @author ChzMo
*/

(function () {
    "use strict";

    var app = angular.module('noticallAD');

    app.controller('SignInCtrl', SignInCtrl);

    SignInCtrl.$inject = ['$scope', '$window', '$location', 'auth', 'baseUrl'];

    function SignInCtrl($scope, $window, $location, auth, baseUrl) {
        var vm = this;

        vm.user = {
            mail: '',
            pw: ''
        }

        vm.submitLbl = '로그인';

        vm.submit = function() {
            console.log(vm.user);

            if ($scope.signInForm.$valid) {
                vm.submitLbl = "요청중...";

                return auth.signIn(vm.user)
                    .then(function (data) {
                        console.log('login success routine');
                        console.log(data);
                        if (data.isSuper) {
                            $location.path('web/manager');
                        }
                        else {
                            $location.path('web/main');
                        }
                    })
                    .catch(function (err) {
                        console.log('Sign in canceled');
                        console.log(err);
                        vm.user.pw = '';
                    })
                    .finally(function () {
                        vm.submitLbl = vm.user.pw ? "완료" : "로그인";
                    });
            }
            else {
                console.log('signinForm is not in scope');
            }
        }

        var user = {};

        auth.getUserInfo(user)
        .then(function (userInfo) {
            if (userInfo.isSuper) {
                console.log('He is manager');
                $location.path('web/manager');
            }
            else {
                console.log('He is a user');
                $location.path('web/main');
            }
        })
        .catch(function(err) {
            console.log('getUserInfo Error');
            console.log(err);
            auth.signOut();
        });
    }
}) ();
