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
                console.log(JSON.stringify(response));

                if (response.data.status == 200) {
                    return response.data.data;
                }
                else {
                    return $q.reject(response.data);
                }
            }


            function getListFailed(error) {
                console.log('Fail to get list');
                console.log(error);

                return $q.reject(error);
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
                console.log(JSON.stringify(response));

                if (response.data.status == 200) {
                    return response.data.data;
                }
                else {
                    return $q.reject(response.data);
                }
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
                console.log(JSON.stringify(response));

                if (response.data.status == 200) {
                    return response.data.data;
                }
                else {
                    return $q.reject(response.data);
                }
            }


            function deleteItemFailed(error) {
                console.log('Fail to delete item');
                console.log(error);

                return $q.reject(error);
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
                console.log(JSON.stringify(response));

                if (response.data.status == 200) {
                    return response.data;
                }
                else {
                    return $q.reject(response.data);
                }
            }


            function chmodItemFailed(error) {
                console.log('Fail to change mode of item');
                console.log(error);

                return $q.reject();
            }
        }
    }
}) ();
