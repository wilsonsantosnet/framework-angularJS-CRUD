(function () {
    'use strict';

    angular.module('common.utils')
        .service('Crud', Crud);

    Crud.$inject = ['Api', 'endpoints', '$uibModal', '$location', '$window', 'XlsExport', '$timeout',];

    function Crud(Api, endpoints, $uibModal, $location, $window, XlsExport, $timeout) {

        var init = function () {

            this.default = {
                resource: null,
                endPoint: "DEFAULT",
                Filter: {
                    QueryOptimizerBehavior: null,
                    OrderFields: null,
                    OrderByType: 1,
                    IsOrderByDomain: false,
                    CustomFilters: null,
                },
                Create: {
                    message: "Registro criado com sucesso!",
                    pathModal: null,
                    sizeModal: "lg",
                    urlRedirect: null,
                    callBack: function (model) {
                    },
                    cancel: null
                },
                Edit: {
                    message: "Registro alterado com sucesso!",
                    pathModal: null,
                    sizeModal: "lg",
                    onAfterRenderEdit: function (model) { return model; },
                    urlRedirect: null
                },
                Upload: {
                    Folder: "upload",
                    CallBackUpload: function (model, result) {

                    },
                    CallBackDelete: function (model, result) {

                    },
                },
                LoadSelects: {
                    dataitem: [],
                    CallBack: function (dataitem) {

                    },
                    onSelectCallback: function (item, vm, index) {

                    }
                },
                Details: {
                    pathModal: null,
                    sizeModal: "lg",
                    onAfterRenderDetails: function (model) { return model; },
                },
                Delete: {
                    message: "Registro excluir com sucesso!",
                    confirm: "Tem certeza que deseja excluir este registro?",
                    pathModal: "view/shared/_exclusao.modal.html",
                },
                Execute: {
                    message: "Operação realizada com sucesso!",
                    confirm: "Tem certeza que deseja realizar essa operação?",
                    pathModal: "view/shared/_execute.modal.html",
                    urlRedirect: null
                },
                ChangeDataPost: function (model) {
                    return model;
                }
            };

            this.Config = {};
            this.Filter = _filter;
            this.LastFilters = {};
            this.Delete = _delete;
            this.Edit = _edit;
            this.xlsExport = _xlsExport;
            this.ConfigSelect = _configSelect
            this.ConfigInPage = _configInPage;
            this.Details = _details;
            this.Print = _print;
            this.Execute = _execute;
            this.ExecuteWithOutConfirmation = _executeWithOutConfirmation;
            this.Create = _create;
            this.GetConfigs = _getConfigs;
            this.SetViewModel = _setViewModel;
            this.LastAction = "none";
            this.ViewModel = null;

            this.Pagination = {
                PageChanged: _pageChanged,
                CurrentPage: 1,
                MaxSize: 10,
                ItensPerPage: 50,
                TotalItens: 0
            };

            var self = this;

            function _setViewModel(vm) {
                self.ViewModel = vm;
            }

            function _randomNum() {
                return Math.random();
            }

            function _filter(filters) {

                self.LastFilters = filters || {};
                self.LastFilters.PageIndex = 1;

                self.LastFilters.OrderFields = self.GetConfigs().Filter.OrderFields;
                self.LastFilters.OrderByType = self.GetConfigs().Filter.OrderByType;
                self.LastFilters.IsOrderByDomain = self.GetConfigs().Filter.IsOrderByDomain;

                _load(self.LastFilters);
            };

            function _load(filters) {

                self.ApiResource = new Api.resourse(self.GetConfigs().resource);
                self.ApiResource.Filter = filters || {};

                self.ApiResource.Filter = angular.merge({}, self.GetConfigs().Filter.CustomFilters, filters || {});

                self.ApiResource.Filter.PageSize = self.Pagination.ItensPerPage;
                self.ApiResource.Filter.QueryOptimizerBehavior = self.GetConfigs().Filter.QueryOptimizerBehavior;

                self.ApiResource.SuccessHandle = function (data) {
                    self.ViewModel.FilterResult = data.dataList;
                    self.Pagination.TotalItens = data.summary.total;
                };

                self.ApiResource.EndPoint = self.GetConfigs().endPoint;
                self.ApiResource.Get();
            }

            function _pageChanged() {
                self.LastFilters.PageIndex = self.Pagination.CurrentPage;
                _load(self.LastFilters);
            }

            function _delete(model, callback) {

                if (self.GetConfigs().Delete.pathModal == null)
                    throw "caminho do html do modal não enviado";

                self.LastAction = "delete";

                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: self.GetConfigs().Delete.pathModal + "?v=" + _randomNum(),
                    controller: ExecuteDeleteNow,
                    controllerAs: 'vm',
                    resolve: {
                        model: function () {
                            return model;
                        },
                        callback: function () {
                            return callback;
                        }
                    }
                });
            };

            function _xlsExport(filters) {

                self.ApiResource = new Api.resourse(self.GetConfigs().resource);
                self.ApiResource.Filter = filters || {};

                self.ApiResource.Filter = angular.merge({}, self.GetConfigs().Filter.CustomFilters, filters || {});

                self.ApiResource.Filter.PageSize = self.Pagination.ItensPerPage;
                self.ApiResource.Filter.QueryOptimizerBehavior = self.GetConfigs().Filter.QueryOptimizerBehavior;

                self.ApiResource.SuccessHandle = function (data) {

                    XlsExport.Export(data.dataList, self.GetConfigs().resource);
                };

                self.ApiResource.EndPoint = self.GetConfigs().endPoint;
                self.ApiResource.Get();
            }

            function _edit(id) {

                self.ApiResource = new Api.resourse(self.GetConfigs().resource);
                self.ApiResource.Filter.Id = id;

                self.ApiResource.SuccessHandle = function (data) {

                    if (self.GetConfigs().Edit.pathModal == null)
                        throw "caminho do html do modal não enviado";

                    self.LastAction = "edit";

                    var modalInstance = $uibModal.open({
                        animation: true,
                        templateUrl: self.GetConfigs().Edit.pathModal + "?v=" + _randomNum(),
                        controller: ExecuteEditCreateNowModal,
                        size: self.GetConfigs().Edit.sizeModal,
                        controllerAs: 'vm',
                        resolve: {
                            labels: function () {
                                return self.GetConfigs().Labels;
                            },
                            attributes: function () {
                                return self.GetConfigs().Attributes;
                            },
                            model: function () {
                                return data.data;
                            }
                        }
                    });

                    self.GetConfigs().Edit.onAfterRenderEdit(data.data);
                };

                self.ApiResource.EndPoint = self.GetConfigs().endPoint;
                self.ApiResource.Get();
            };

            function _configInPage($stateParams, vm, Notification, $timeout) {

                if ($stateParams.Id != undefined) {

                    self.LastAction = "edit";
                    self.ApiResource = new Api.resourse(self.GetConfigs().resource);
                    self.ApiResource.Filter.Id = $stateParams.Id;

                    self.ApiResource.SuccessHandle = function (data) {

                        vm.Model = data.data;
                        self.GetConfigs().Edit.onAfterRenderEdit(data.data);
                        ExecuteEditCreateNow(vm, Notification, function (data) {

                            if (self.GetConfigs().Edit.urlRedirect != null)
                                $location.path(self.GetConfigs().Edit.urlRedirect)
                        });

                    };

                    self.ApiResource.EndPoint = self.GetConfigs().endPoint;
                    self.ApiResource.Get();


                } else {

                    self.LastAction = "create";
                    vm.Model = {};
                    ExecuteEditCreateNow(vm, Notification, function (data) {

                        if (self.GetConfigs().Create.urlRedirect != null)
                            $location.path(self.GetConfigs().Create.urlRedirect)

                        self.GetConfigs().Create.callBack(data);

                    }, self.GetConfigs().Create.cancel);
                }

            };

            function _configSelect(attr, vm) {

                
                var api = new Api.resourse(attr.dataitem);

                api.EnableLogs = false;
                api.EnableLoading = false;
                api.Filter.IsPaginate = false;

                if (attr.filterKey != null) {
                    api.Filter.FilterKey = attr.filterKey
                }

                api.SuccessHandle = function (data) {

                    for (var i = 0; i < data.dataList.length; i++) {
                        data.dataList[i].id = parseInt(data.dataList[i].id);
                    }
                    vm["DataItem" + attr.dataitem] = data.dataList;
                    self.GetConfigs().LoadSelects.CallBack(vm["DataItem" + attr.dataitem], vm);
                };
                api.DataItem();

            }

            function _details(id) {

                self.ApiResource = new Api.resourse(self.GetConfigs().resource);
                self.ApiResource.Filter.Id = id;

                self.ApiResource.SuccessHandle = function (data) {

                    if (self.GetConfigs().Details.pathModal == null)
                        throw "caminho do html do modal não enviado";

                    self.LastAction = "details";

                    var modalInstance = $uibModal.open({
                        animation: true,
                        controller: ExecuteDetailsNow,
                        templateUrl: self.GetConfigs().Details.pathModal + "?v=" + _randomNum(),
                        size: self.GetConfigs().Details.sizeModal,
                        controllerAs: 'vm',
                        resolve: {
                            labels: function () {
                                return self.GetConfigs().Labels;
                            },
                            attributes: function () {
                                return self.GetConfigs().Attributes;
                            },
                            model: function () {
                                return data.data;
                            }
                        }
                    });

                    self.GetConfigs().Details.onAfterRenderDetails(data.data);



                };

                self.ApiResource.EndPoint = self.GetConfigs().endPoint;
                self.ApiResource.Get();
            };

            function _print(id) {

                var url = self.GetConfigs().resource + "/Print/" + id;
                $location.path(url);

            };

            function _executeWithOutConfirmation(model, notification, callback) {

                self.LastAction = "execute";
                ExecuteNowWithOutConfirmation(model, notification, callback);

            };

            function _execute(model, callback) {

                if (self.GetConfigs().Execute.pathModal == null)
                    throw "caminho do html do modal não enviado";

                self.LastAction = "execute";

                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: self.GetConfigs().Execute.pathModal + "?v=" + _randomNum(),
                    controller: ExecuteNow,
                    controllerAs: 'vm',
                    resolve: {
                        model: function () {
                            return model;
                        },
                        callback: function () {
                            return callback;
                        },
                    }
                });
            };

            function _create() {

                if (self.GetConfigs().Create.pathModal == null)
                    throw "caminho do html do modal não enviado";

                self.LastAction = "create";

                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: self.GetConfigs().Create.pathModal + "?v=" + _randomNum(),
                    controller: ExecuteEditCreateNowModal,
                    size: self.GetConfigs().Create.sizeModal,
                    controllerAs: 'vm',
                    resolve: {
                        labels: function () {
                            return self.GetConfigs().Labels;
                        },
                        attributes: function () {
                            return self.GetConfigs().Attributes;
                        },
                        model: function () {
                            return {
                            };
                        }
                    }
                });
            };

            function _getConfigs() {

                return angular.merge({}, self.default, self.Config);
            };

            var ExecuteDeleteNow = function ($uibModalInstance, model, Notification, callback) {

                var vm = this;

                vm.MensagemDeletar = self.GetConfigs().Delete.confirm;

                vm.ok = function () {

                    self.ApiResource = new Api.resourse(self.GetConfigs().resource);
                    self.ApiResource.Filter = model;

                    self.ApiResource.SuccessHandle = function (data) {
                        Notification.success({ message: self.GetConfigs().Delete.message, title: "Sucesso" })
                        $uibModalInstance.close();
                        if (callback == null)
                            _load(self.LastFilters);
                        else
                            callback();
                    };

                    self.ApiResource.EndPoint = self.GetConfigs().endPoint;
                    self.ApiResource.Delete();
                };

                vm.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            };

            var ExecuteDetailsNow = function ($uibModalInstance, model, labels, attributes, Notification) {

                var vm = this;

                vm.Model = model;
                vm.Labels = labels;
                vm.Attributes = attributes;

                vm.ActionTitle = "Detalhes";

                vm.ok = function (model) {

                };

                vm.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };


            };

            var ExecuteEditCreateNow = function (vm, Notification, actionEnd, actionCancel) {

                var datatItem = self.GetConfigs().LoadSelects.dataitem;
                for (var i = 0; i < datatItem.length; i++) {
                    _configSelect({ dataitem: datatItem[i] }, vm);
                }

                vm.ok = function (model) {

                    var msg = self.LastAction == "create" ? self.GetConfigs().Create.message : self.GetConfigs().Edit.message;

                    self.ApiResource = new Api.resourse(self.GetConfigs().resource);

                    model = self.GetConfigs().ChangeDataPost(model);
                    self.ApiResource.Data = model;

                    self.ApiResource.SuccessHandle = function (data) {


                        if (data.result != null) {
                            if (data.result.isValid) {
                                Notification.success({ message: data.result.message, title: "<i class='fa fa-check-square'> Sucesso" })
                            }
                        }

                        if (data.warning != null) {
                            if (!data.warning.isValid) {
                                for (var i = 0; i < data.warning.warnings.length; i++) {
                                    Notification.warning({ message: data.warning.warnings[i], positionY: 'bottom', title: "<i class='fa fa-warning'> Atenção" })
                                }
                            }
                        }
                        else {
                            Notification.success({ message: msg, title: "Sucesso" })
                        }

                        actionEnd(model);
                        _load(self.LastFilters);
                    };

                    self.ApiResource.EndPoint = self.GetConfigs().endPoint;
                    self.ApiResource.Post();
                };

                vm.cancel = function () {

                    if (actionCancel != null)
                        actionCancel();
                    else
                        actionEnd();
                };

                vm.delete = function (fileName, model) {

                    var uploadConfig = self.GetConfigs().Upload
                    self.ApiResource = new Api.resourse(self.GetConfigs().resource);
                    self.ApiResource.Filter = {
                        fileName: fileName,
                        folder: uploadConfig.Folder
                    };
                    self.ApiResource.SuccessHandle = function (result) {

                        uploadConfig.CallBackDelete(model, result);

                    };
                    self.ApiResource.EndPoint = self.GetConfigs().endPoint;
                    self.ApiResource.UploadDelete();

                };

                vm.upload = function ($files, model) {

                   

                    for (var i = 0; i < $files.length; i++) {

                        var $file = $files[i];
                        var fd = new FormData();
                        var uploadConfig = self.GetConfigs().Upload

                        fd.append("files", $file);
                        fd.append("folder", uploadConfig.Folder);


                        self.ApiResource = new Api.resourse(self.GetConfigs().resource);
                        self.ApiResource.Data = fd;
                        self.ApiResource.SuccessHandle = function (result) {

                            console.log("vm.upload SuccessHandle", model, result);
                            console.log("vm.upload SuccessHandle", self.Config);

                            uploadConfig.CallBackUpload(model, result);

                        };
                        self.ApiResource.EndPoint = self.GetConfigs().endPoint;
                        self.ApiResource.Upload();

                    }
                };

                vm.openCalendar = function (e, vm, index) {
                    e.preventDefault();
                    e.stopPropagation();
                    vm[index] = true;
                };

                vm.onSelectCallback = function (item, vm, index) {
                    self.GetConfigs().LoadSelects.onSelectCallback(item, vm, index)
                };

                vm.enabledPrint = true;

                vm.print = function () {
                    vm.enabledPrint = false;
                    $timeout(function () {
                        window.print();
                    }, 500);
                }


            };

            var ExecuteEditCreateNowModal = function ($uibModalInstance, model, labels, attributes, Notification) {

                var vm = this;

                vm.Model = model;
                vm.Labels = labels;
                vm.Attributes = attributes;
                vm.uploadUri = endpoints.DEFAULT + "document/download/";

                var subActionTitle = self.LastAction == "create" ? "Cadastro" : "Edição";
                vm.ActionTitle = subActionTitle;
                if (self.ViewModel != null)
                    vm.ActionTitle = self.ViewModel.ActionTitle + " : " + subActionTitle;

                ExecuteEditCreateNow(vm, Notification, function () {
                    $uibModalInstance.dismiss('cancel');
                });
            };

            var ExecuteNow = function ($uibModalInstance, model, Notification, callback) {

                var vm = this;
                vm.Model = model;

                vm.MensagemConfirm = self.GetConfigs().Execute.confirm;

                console.log("ExecuteNow", vm.MensagemConfirm, self.GetConfigs());

                vm.ok = function () {

                    self.ApiResource = new Api.resourse(self.GetConfigs().resource);

                    model = self.GetConfigs().ChangeDataPost(model);
                    self.ApiResource.Data = model;

                    self.ApiResource.SuccessHandle = function (data) {

                        Notification.success({ message: self.GetConfigs().Execute.message, title: "Sucesso" })

                        if (callback != null)
                            callback();

                        $uibModalInstance.close();

                    };

                    self.ApiResource.EndPoint = self.GetConfigs().endPoint;
                    self.ApiResource.Put();
                };

                vm.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            };

            var ExecuteNowWithOutConfirmation = function (model, Notification, callback) {


                self.ApiResource = new Api.resourse(self.GetConfigs().resource);
                model = self.GetConfigs().ChangeDataPost(model);
                self.ApiResource.Data = model;
                self.ApiResource.EnableLoading = false;

                self.ApiResource.SuccessHandle = function (data) {

                    Notification.success({ message: self.GetConfigs().Execute.message, title: "Sucesso" })

                    if (callback != null)
                        callback();
                };

                self.ApiResource.EndPoint = self.GetConfigs().endPoint;
                self.ApiResource.Put();


            };

        }

        this.start = function () {
            return new init();
        };
    };

})();