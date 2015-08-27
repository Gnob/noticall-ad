/**
* @author ChzMo
*/

(function () {
    "use strict";

    var app = angular.module('noticallAD');

    app.controller('MainCtrl', MainCtrl);

    MainCtrl.$inject=['$scope','$location', '$window','$q','$http','Upload','auth','itemCom','baseUrl'];

    function MainCtrl($scope, $location, $window, $q, $http, Upload, auth, itemCom, baseUrl) {
        var vm = this;

        // TODO: /upload Response 제대로

        // TODO: 지역 Ajax로 받아오기
        vm.baseUrl = baseUrl;
        vm.locs = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
        vm.maxSize = 1024 * 1024 * 1;
        vm.submitLbl = "업로드하기";

        vm.listTab = true;
        vm.curPage = 1;
        vm.numPerPage = 5;
        vm.showingItems = [];


        fillList();


        vm.changePage = function() {
            var begin = (vm.curPage - 1) * vm.numPerPage;
            var end = begin + vm.numPerPage;

            vm.showingItems = vm.list.slice(begin, end);
            // while(vm.showingItems.length) { vm.showingItems.pop(); }
            //
            // var temp = vm.list.slice(begin, end);
            //
            // while(temp.length) { vm.showingItems.push(temp.pop()) }
        }


        vm.resetUploadForm = function() {
            vm.progress.amount = 0;
            vm.progress.status = 'danger';
            vm.item.title = '';
            vm.item.location = '서울';
            vm.ADmp3.files = undefined;
            vm.ADjpg.files = undefined;
            vm.rejFiles = [];
            vm.failAlert.active = false;
            vm.failAlert.msg = '';
        };

        vm.ADmp3 = {
            name: 'ADmp3',
            change: function(files) {
                if (files && files.length) {
                    vm.ADmp3.value = 0
                }
                console.log(files);
            }
        };

        vm.ADjpg = {
            name: 'ADjpg',
            change: function(files) {
                if (files && files.length) {
                    vm.ADjpg.amount = 0
                }
                console.log(files);
            }
        };

        vm.progress = {
            amount: 0,
            status: 'danger'
        };

        vm.failAlert = {
            active: false,
            msg: ''
        }

        vm.closeAlert = function(num) {
            if (num == 1) {
                vm.rejFiles = [];
            }
            else if (num == 2) {
                vm.failAlert.active = false;
            }
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
                $location.path('web/signin');
            });
        }

        vm.uploading = {};


        vm.upload = function(objs) {
            console.log(objs);
            if (objs[0].files && objs[0].files.length) {
                var file = [objs[0].files[0], objs[1].files[0]];
                Upload.upload({
                    url: baseUrl + '/files/upload',
                    file: file,
                    fileFormDataName: 'dataSet',
                    headers: { 'Authorization': vm.userInfo.token },
                    fields: vm.item
                })
                .progress(function(e) {
                    vm.progress.status = 'warning';
                    vm.progress.amount = parseInt(100.0 * e.loaded / e.total);
                })
                .success(function(data, status, headers, config) {
                    console.log(data);
                    console.log(status);

                    if (data.status == "200") {
                        vm.progress.status = 'success';
                        vm.listTab = true;
                        vm.resetUploadForm();
                        fillList();
                    }
                    else {
                        vm.resetUploadForm();
                        vm.failAlert.active = true;
                        vm.failAlert.msg = data.message;
                    }
                    // $window.location.href = '/router';
                })
                .error(function(a,b,c,d) {
                    vm.resetUploadForm();
                    vm.failAlert.active = true;
                    vm.failAlert.msg = a;
                    console.log(a);
                    console.log(b);
                    console.log(c);
                    console.log(d);
                });
            }
        }


        vm.delete = function(id) {
            itemCom.deleteItem(vm.userInfo.token, id)
            .then(function(data) {
                fillList();
            })
            .catch(function(err) {
                console.log(JSON.stringify(err));
                console.log('삭제에 실패했습니다.');
                return err;
            });
        }


        function fillList() {
            auth.getUserInfo()
            .then(function (userInfo) {
                console.log(userInfo);
                vm.userInfo.username = userInfo.username;
                vm.userInfo.token = userInfo.token;
                vm.userInfo.isSuper = userInfo.isSuper;

                itemCom.getList(userInfo.token)
                    .then(function (data) {
                        console.log('success get list routine');
                        console.log(data);
                        angular.forEach(data, function(value, key) {
                            if (value.allow) {
                                value.style = {color: 'dodgerblue'};
                            }
                            else {
                                value.style = {color: 'red'};
                            }
                        });
                        vm.list = data;
                        vm.changePage();
                    })
                    .catch(function () {
                        console.log('fail get list');
                        auth.clearUserInfo();
                        $location.path('web/signin');
                    });
            })
            .catch(function () {
                console.log('fail get userinfo');
                auth.signOut();
                auth.clearUserInfo();
                $location.path('web/signin');
            });;
        }
        // function(id, index) {
        //     var targetIdx = (vm.curPage - 1) * vm.numPerPage + index;
        //
        //     deleteItem(vm.userInfo.token)
        //     .then(function() {
        //         vm.list.
        //     });
        // }
    }
}) ();
