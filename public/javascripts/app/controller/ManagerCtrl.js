/**
* @author ChzMo
*/

(function () {
    "use strict";

    var app = angular.module('noticallAD');

    app.controller('ManagerCtrl', ManagerCtrl);

    ManagerCtrl.$inject=['$scope','$location', '$window','$q','$http','Upload','auth','itemCom','baseUrl'];

    function ManagerCtrl($scope, $location, $window, $q, $http, Upload, auth, itemCom, baseUrl) {
        var vm = this;

        // TODO: /upload Response 제대로

        // TODO: 지역 Ajax로 받아오기
        vm.baseUrl = baseUrl;
        vm.locs = ["서울", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

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

        vm.delete = function(id) {
            itemCom.deleteItem(vm.userInfo.token, id)
            .then(function(data) {
                fillList();
            });
        }

        vm.chmod = function(item_id, method) {
            var memo = '컨텐츠가 부적절합니다.';
            itemCom.chmodItem(vm.userInfo.token, item_id, method, memo)
            .then(function(data) {
                console.log('success change : ' + data.msg);
                fillList();
            })
            .catch(function(err) {
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

                itemCom.getListAll(userInfo.token)
                    .then(function (data) {
                        console.log('success get all list routine');
                        console.log(data);
                        vm.list = data;
                        vm.changePage();
                    })
                    .catch(function () {
                        console.log('fail get all list');
                        auth.clearUserInfo();
                        $location.path('/signin');
                    });
            })
            .catch(function () {
                console.log('fail get userinfo');
                auth.signOut();
                auth.clearUserInfo();
                $location.path('/signin');
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
