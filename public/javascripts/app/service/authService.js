/**
* @author ChzMo
*/

(function() {
    "use strict";

    angular
        .module('noticallAD')
        .factory('auth', auth);

    auth.$inject = ['$http', '$q', '$cookies', 'base64', 'baseUrl'];

    function auth($http, $q, $cookies, base64, baseUrl) {
        var userInfo = {
            token: null,
            isSuper: false,
            username: null
        };

        var service = {
            signIn: signIn,
            signOut: signOut,
            signUp: signUp,
            setUserInfo: setUserInfo,
            getUserInfo: getUserInfo,
            clearUserInfo: clearUserInfo
        };

        return service;

        ///////////////////////

        function signIn(user) {
            var data =  {
                token: base64.encode(user.mail + ':' + user.pw)
            }

            var reqConfig = {
                method: 'POST',
                url: baseUrl + '/users/signin',
                data: data
            };


            return $http(reqConfig)
                .then(signInComplete)
                .catch(signInFailed);

            ///////////////////////////

            function signInComplete(response) {
                var data = response.data;

                if (response.status == 200) {
                    console.log("Success to login server");
                }
                else {
                    console.log('Success to sign in but unknown behavior.');
                }
                console.log(JSON.stringify(response));

                return setUserInfo(data);
            }


            function signInFailed(error) {
                console.log('Fail to sign in');
                console.log(JSON.stringify(error));

                return $q.reject();
            }
        }


        function signOut() {
            var reqConfig = {
                method: 'GET',
                url: baseUrl + '/users/signout',
            };


            return $http(reqConfig)
                .then(signOutComplete)
                .catch(signOutFailed);

            ///////////////////////////

            function signOutComplete(response) {
                if (response.status == 200) {
                    console.log("Success to sign out from server");
                }
                else {
                    console.log('Success to sign out but unknown behavior.');
                }
                console.log(JSON.stringify(response));

                clearUserInfo();

                return;
            }


            function signOutFailed(error) {
                console.log('Fail to sign out');
                console.log(JSON.stringify(error));

                return $q.reject();
            }
        }


        function signUp(user) {
            var reqConfig = {
                method: 'POST',
                url: baseUrl + '/users/signup',
                data: user
            };


            return $http(reqConfig)
                .then(signUpComplete)
                .catch(signUpFailed);

            ///////////////////////////

            function signUpComplete(response) {
                if (response.status == 200) {
                    console.log("Success to sign up server");
                }
                else {
                    console.log('Success to sign up but unknown behavior.');
                }
                console.log(JSON.stringify(response));

                return response.data.path;
            }


            function signUpFailed(error) {
                console.log('Fail to sign up');
                console.log(JSON.stringify(error));

                return $q.reject();
            }
        }


        function setUserInfo(data) {
            if (data.token) {
                userInfo.token = data.token;
                userInfo.isSuper = data.isSuper;
                userInfo.username = data.username;
                ///Please add check routine to if statement
                //userInfo.nickname = inUserInfo.nickname;

                var expire = new Date();
	            expire.setDate(expire.getDate() + 1);

                $cookies.putObject('userInfo', userInfo, {
                    expires: expire.toGMTString()
                });

                console.log("in setUserInfo");
                console.log(userInfo);


                return data;
            }

            return false;
        }


        function getUserInfo() {
            var rUserInfo = {};
            var deferred = $q.defer();

            if (!userInfo.token) {
                var item = $cookies.getObject('userInfo');

                if (item && item.token) {
                    userInfo.token = item.token;
                    rUserInfo.token = userInfo.token;

                    userInfo.isSuper = item.isSuper;
                    rUserInfo.isSuper = userInfo.isSuper;

                    userInfo.username = item.username;
                    rUserInfo.username = userInfo.username;

                    //userInfo.nickname = item.nickname;

                    deferred.resolve(rUserInfo);
                }
                else {
                    userInfo.token = null;
                    rUserInfo.token = null;
                    userInfo.isSuper = null;
                    rUserInfo.isSuper = null;
                    userInfo.username = null;
                    rUserInfo.username = null;
                    //userInfo.nickname = null;
                    deferred.reject();
                }

            }
            else {
                rUserInfo.token = userInfo.token;
                rUserInfo.isSuper = userInfo.isSuper;
                rUserInfo.username = userInfo.username;
                deferred.resolve(rUserInfo);
            }


            return deferred.promise;
        }


        function clearUserInfo() {
            userInfo.token = null;
            userInfo.isSuper = false;
            userInfo.username = null;
            //userInfo.nickname = null;

            $cookies.remove('userInfo');

        }
    }
}) ();
