/**
* @author ChzMo
*/

(function () {
    "use strict";

    var app = angular.module('noticallAD');

    app.controller('SignInCtrl', SignInCtrl);

    SignInCtrl.$inject = ['$scope', '$http', '$q', '$window', 'baseUrl'];

    function SignInCtrl($scope, $http, $q, $window, baseUrl) {
        var vm = this;

        vm.user = {
            mail: '',
            pw: ''
        }

        vm.submitLbl = '로그인';

        vm.submit = function() {
            console.log(vm.user);

            if ($scope.signInForm.$valid) {
                vm.submitLbl = "로그인 중...";

                return signIn(vm.user)
                    .then()
                    .catch(function () {
                        console.log('Sign in canceled');
                    })
                    .finally(function () {
                        vm.submitLbl = "완료";
                    });
            }
            else {
                console.log('signinForm is not in scope');
            }
        }

        //////////////////////////////////

        function signIn(user) {
            var reqConfig = {
                method: 'POST',
                url: baseUrl + '/users/signin',
                data: user
            };


            return $http(reqConfig)
                .then(signInComplete)
                .catch(signInFailed);

            ///////////////////////////

            function signInComplete(response) {
                if (response.status == 200) {
                    console.log("Success to login server");
                }
                else {
                    console.log('Success to sign in but unknown behavior.');
                }
                console.log(JSON.stringify(response));

                $window.location.href = baseUrl + response.data.path;
            }


            function signInFailed(error) {
                console.log('Fail to sign in');
                console.log(JSON.stringify(error));

                return $q.reject();
            }
        }
    }
}) ();
