/**
* @author ChzMo
*/

(function () {
    "use strict";

    var app = angular.module('noticallAD');

    app.controller('MainCtrl', MainCtrl);

    MainCtrl.$inject=['$scope','$location','$q','$http','Upload','auth','baseUrl'];

    function MainCtrl($scope, $location, $q, $http, Upload, auth, baseUrl) {
        var vm = this;

        // TODO: /upload Response 제대로

        // TODO: 지역 Ajax로 받아오기
        vm.locs = ["서울", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
        vm.maxSize = 1024 * 1024 * 5;
        vm.submitLbl = "업로드하기";

        vm.ADmp3 = {
            name: 'ADmp3',
            label: "MP3 파일을 선택해주세요.",
            change: function(files) {
                if (files && files.length) {
                    vm.ADmp3.value = 0
                    vm.ADmp3.label = files[0].name;
                }
                console.log(files);
            }
        };

        vm.ADjpg = {
            name: 'ADjpg',
            label: "JPG 파일을 선택해주세요.",
            change: function(files) {
                if (files && files.length) {
                    vm.ADjpg.amount = 0
                    vm.ADjpg.label = files[0].name;
                }
                console.log(files);
            }
        };

        vm.progress = {
            amount: 0,
            status: 'danger'
        };

        vm.closeAlert = function() {
            vm.rejFiles = [];
        }

        vm.item = {
            title: '',
            location: vm.locs[0]
        };

        vm.userInfo = {
            username: null,
            token: null,
            isSuper: null
        };

        vm.signout = function() {
            auth.signOut()
            .then(function () {
                $location.path('/signin');
            });
        }

        vm.uploading = {};

        // vm.upload = function(objs) {
        //     console.log(objs);
        //     for(var i = 0; i < objs.length; i++) {
        //         if (objs[i].files && objs[i].files.length) {
        //             for(var i = 0; i < objs[i].files.length; i++) {
        //                 var obj = objs[i];
        //                 var file = obj.files[i];
        //                 vm.uploading[obj.name] = Upload.upload({
        //                     url: baseUrl + '/test/upload',
        //                     file: file,
        //                     fileFormDataName: obj.name,
        //                     headers: { 'Authorization': vm.userInfo.token},
        //                     fields: vm.item
        //                 })
        //                 .progress(function(e) {
        //                     obj.status = 'warning';
        //                     obj.value = parseInt(100.0 * e.loaded / e.total);
        //                 })
        //                 .success(function(data, status, headers, config) {
        //                   // file is uploaded successfully
        //                     obj.status = 'success';
        //                 })
        //                 .error(function(a,b,c,d) {
        //                     console.log(a);
        //                     console.log(b);
        //                     console.log(c);
        //                     console.log(d);
        //                 });
        //             }
        //         }
        //     }
        // }


        vm.upload = function(objs) {
            console.log(objs);
            var file = [objs[0].files[0], objs[1].files[0]];
            Upload.upload({
                url: baseUrl + '/files/upload',
                file: file,
                fileFormDataName: 'dataSet',
                headers: { 'Authorization': vm.userInfo.token},
                fields: vm.item
            })
            .progress(function(e) {
                vm.progress.status = 'warning';
                vm.progress.amount = parseInt(100.0 * e.loaded / e.total);
            })
            .success(function(data, status, headers, config) {
                vm.progress.status = 'success';
            })
            .error(function(a,b,c,d) {
                console.log(a);
                console.log(b);
                console.log(c);
                console.log(d);
            });
        }


        auth.getUserInfo()
        .then(function (userInfo) {
            console.log(userInfo);
            vm.userInfo.username = userInfo.username;
            vm.userInfo.token = userInfo.token;
            vm.userInfo.isSuper = userInfo.isSuper;

            getList(userInfo.token)
                .then(function (data) {
                    console.log('success get list routine');
                    console.log(data);
                    vm.list = data;
                })
                .catch(function () {
                    console.log('fail get list');
                    auth.clearUserInfo();
                    $location.path('/signin');
                });
        })
        .catch(function () {
            console.log('fail get userinfo');
            auth.clearUserInfo();
            $location.path('/signin');
        });;


        function getList(token) {
            var reqConfig = {
                method: 'GET',
                url: baseUrl + '/files/list',
                headers: {
                    'Authorization': token
                }
            };


            return $http(reqConfig)
                .then(getListComplete)
                .catch(getListFailed);

            ///////////////////////////

            function getListComplete(response) {
                var data = response.data;

                if (response.status == 200) {
                    console.log("Success to get list from server");
                }
                else {
                    console.log('Success to get list but unknown behavior.');
                }
                console.log(JSON.stringify(response));

                return response.data;
            }


            function getListFailed(error) {
                console.log('Fail to get list');
                console.log(error);

                return $q.reject();
            }
        }
    }
}) ();
