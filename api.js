(function () {
    'use strict';

    angular.module('common.utils')
        .service('Api', Api);

    Api.$inject = ['$http', 'Uri', '$log', 'Loading', 'Cache', 'Notification', 'JsonParseService', 'configsConstants', '$state', '$q']

    function Api($http, Uri, $log, Loading, Cache, Notification, JsonParseService, configsConstants, $state, $q) {

        var init = function (o) {

            this.Resourse = o;
            this.EnableLoading = true;
            this.EnableErrorMessage = true;
            this.EnableLogs = true;
            this.Filter = {};
            this.Data = {};
            this.Cache = false;
            this.LastAction = "none";
            this.Url = "";

            this.SuccessHandle = function (data) { return data; };
            this.ErrorHandle = function (err) { return err; };

            this.Get = _get;
            this.GetDetails = _getDetails;
            this.Post = _post;
            this.Upload = _upload;
            this.UploadDelete = _uploadDelete;
            this.Put = _put;
            this.Delete = _delete;
            this.DataItem = _dataitem;
            this.GetDataListCustom = _getDataListCustom;
            this.GetDataCustom = _getDataCustom;
            this.GetDataCustomPlus = _getDataCustomPlus;
            this.GetMoreResource = _getMoreResource;
            this.UriResource = new Uri.resourse(o);

            var self = this;


            function _post() {

                ShowLoading();

                self.LastAction = "post";

                self.UriResource.Filter = self.Filter
                self.UriResource.EndPoint = self.EndPoint
                self.Url = self.UriResource.MakeUri();

                return $http
                    .post(self.Url, self.Data)
                    .then(handleSuccess, handleError);
            }

            function _put() {

                ShowLoading();

                self.LastAction = "put";

                self.UriResource.Filter = self.Filter
                self.UriResource.EndPoint = self.EndPoint
                self.Url = self.UriResource.MakeUri();


                return $http
                    .put(self.Url, self.Data)
                    .then(handleSuccess, handleError);
            }

            function _delete() {

                ShowLoading();

                self.LastAction = "delete";

                self.UriResource.Filter = self.Filter
                self.UriResource.EndPoint = self.EndPoint
                self.Url = self.UriResource.MakeDeleteBaseUrl();

                return $http
                    .delete(self.Url)
                    .then(handleSuccess, handleError);
            }

            function _get() {

                ShowLoading();

                self.LastAction = "get";

                self.UriResource.Filter = self.Filter
                self.UriResource.EndPoint = self.EndPoint
                self.Url = self.UriResource.MakeGetBaseUrl();

                if (isOffline())
                    return LoadFromCache();

                return $http
                    .get(self.Url)
                    .then(handleSuccess, handleError);
            }

            function _uploadDelete() {

                ShowLoading();

                self.LastAction = "uploadDelete";

                self.UriResource.Filter = self.Filter
                self.UriResource.EndPoint = self.EndPoint
                self.Url = self.UriResource.MakeDeleteUploadBaseUrl();

                return $http
                    .delete(self.Url)
                    .then(handleSuccess, handleError);
            }

            function _upload() {

                ShowLoading();

                self.LastAction = "upload";

                self.UriResource.Filter = self.Filter
                self.UriResource.EndPoint = self.EndPoint
                self.Url = self.UriResource.MakeEndPointUpload();

                $http.post(self.Url, self.Data,
                    {
                        headers: { 'Content-Type': undefined },
                        transformRequest: angular.identity
                    }).then(handleSuccess, handleError);
            }


            function _getDataListCustom() {
                return _getMoreResource("GetDataListCustom");
            }

            function _getDetails() {
                return _getMoreResource("GetDetails");
            }

            function _getDataCustom() {
                return _getMoreResource("GetDataCustom");
            }

            function _getDataCustomPlus() {

                ShowLoading();

                self.LastAction = "get";

                self.UriResource.Filter = self.Filter
                self.UriResource.EndPoint = self.EndPoint
                self.Url = self.UriResource.MakeGetMoreResourceBaseUrl("GetDataCustom");

                if (isOffline())
                    return LoadFromCache();

                return $http
                    .get(self.Url)
            }

            function _dataitem() {
                return _getMoreResource("GetDataItem");
            }

            function _getMoreResource(filterBehavior) {

                ShowLoading();

                self.LastAction = "get";

                self.UriResource.Filter = self.Filter
                self.UriResource.EndPoint = self.EndPoint
                self.Url = self.UriResource.MakeGetMoreResourceBaseUrl(filterBehavior);

                if (isOffline())
                    return LoadFromCache();

                return $http
                    .get(self.Url)
                    .then(handleSuccess, handleError);
            }

            function dataPost() {
                return JSON.stringify(self.Data);
            }

            function handleSuccess(response) {

                HideLoading();

                self.UriResource.Filter = self.Filter
                self.UriResource.EndPoint = self.EndPoint

                if (self.EnableLogs)
                    $log.debug("sucesso na API >>", self.UriResource.MakeUri(), response)

                AddCache(response.data);

                self.SuccessHandle(JsonParseService.exec(response.data));
            }

            function handleError(err) {

                HideLoading();

                if (err.data == null)
                    return;

                self.UriResource.Filter = self.Filter
                self.UriResource.EndPoint = self.EndPoint

                if (self.EnableLogs)
                    $log.error("erro na API >>", self.UriResource.MakeUri())


                if (self.EnableErrorMessage) {

                    if (err.data != "" && err.data.result.errors != null)
                        Notification.error({ message: err.data.result.errors[0], title: 'Ops, ocorreu um erro!' })
                }

                if (err.status == 401)
                    window.location = configsConstants.STATE_STATUSCODE_401;

                if (err.status == 415)
                    Notification.error({ message: err.statusText, title: 'Ops, ocorreu um erro!' })


                self.ErrorHandle(JsonParseService.exec(err.data));
            }

            function ShowLoading() {
                if (self.EnableLoading)
                    Loading.show();

            }

            function HideLoading() {
                if (self.EnableLoading)
                    Loading.hide();
            }

            function AddCache(data) {

                if (!self.Cache)
                    return;

                if (self.Url == "")
                    return;

                if (self.LastAction == "get") {
                    if (data.Data != null || (data.DataList != null && data.DataList.length > 0)) {
                        data = JSON.stringify(data);
                        Cache.Add(self.Url, data)
                    }
                }
            }

            function LoadFromCache() {

                if (!self.Cache)
                    return;

                HideLoading();

                self.UriResource.Filter = self.Filter
                self.UriResource.EndPoint = self.EndPoint

                if (self.EnableLogs)
                    $log.debug("sucesso na API (by Cache) >>", self.UriResource.makeUri())

                var data = Cache.Get(self.Url);
                data = JSON.parse(data);

                if (data != null)
                    self.SuccessHandle(data);

            }

            function isOffline() {

                if (navigator.network != null) {
                    var isOffline = !navigator.onLine;
                    return isOffline;
                }

                return false;
            }



        }

        this.resourse = function (o) {
            return new init(o);
        }

    }

})();