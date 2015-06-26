/**
* @author ChzMo
*/

(function() {
    "use strict";

    angular
        .module('noticallAD')
        .factory('itemCom', itemCom);

    itemCom.$inject = ['$http', '$q', '$cookies', 'base64', 'baseUrl'];

    function itemCom($http, $q, $cookies, base64, baseUrl) {
        var userInfo = {
            token: null,
            isSuper: false,
            username: null
        };

        var service = {
            getList: getList,
            getListAll: getListAll,
            deleteItem: deleteItem,
            chmodItem: chmodItem
        };

        return service;

        ///////////////////////

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


        function getListAll(token) {
            var reqConfig = {
                method: 'GET',
                url: baseUrl + '/manager/list',
                headers: {
                    'Authorization': token
                }
            };


            return $http(reqConfig)
                .then(getListAllComplete)
                .catch(getListAllFailed);

            ///////////////////////////

            function getListAllComplete(response) {
                var data = response.data;

                if (response.status == 200) {
                    console.log("Success to get all list from server");
                }
                else {
                    console.log('Success to get all list but unknown behavior.');
                }
                console.log(JSON.stringify(response));

                return response.data;
            }


            function getListAllFailed(error) {
                console.log('Fail to get all list');
                console.log(error);

                return $q.reject();
            }
        }


        function deleteItem(token, id) {
            var reqConfig = {
                method: 'GET',
                url: baseUrl + '/files/delete/' + id,
                headers: {
                    'Authorization': token
                }
            };


            return $http(reqConfig)
                .then(deleteItemComplete)
                .catch(deleteItemFailed);

            ///////////////////////////

            function deleteItemComplete(response) {
                var data = response.data;

                if (response.status == 200) {
                    console.log("Success to delete item from server");
                }
                else {
                    console.log('Success to delete but unknown behavior.');
                }
                console.log(JSON.stringify(response));

                return response.data;
            }


            function deleteItemFailed(error) {
                console.log('Fail to delete item');
                console.log(error);

                return $q.reject();
            }
        }


        function chmodItem(token, item_id, method, memo) {
            var reqConfig = {
                method: 'POST',
                url: baseUrl + '/manager/chmod/',
                headers: {
                    'Authorization': token
                },
                data: {
                    item_id: item_id,
                    method: method,
                    memo: memo
                }
            };


            return $http(reqConfig)
                .then(chmodItemComplete)
                .catch(chmodItemFailed);

            ///////////////////////////

            function chmodItemComplete(response) {
                var data = response.data;

                if (response.status == 200) {
                    console.log("Success to change mode of item from server");
                }
                else {
                    console.log('Success to change mode of item but unknown behavior.');
                }
                console.log(JSON.stringify(response));

                return response.data;
            }


            function chmodItemFailed(error) {
                console.log('Fail to change mode of item');
                console.log(error);

                return $q.reject();
            }
        }
    }
}) ();
