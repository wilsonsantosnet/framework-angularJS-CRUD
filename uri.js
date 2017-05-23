(function () {
    'use strict';

    angular.module('common.utils')
        .service('Uri', Uri);

    Uri.$inject = ['$httpParamSerializer', 'endpoints']

    function Uri($httpParamSerializer, endpoints) {


        var init = function (o) {

            this.Resourse = o;
            this.Filter = {};

            this.DefaultFilter = {
                PageSize: 50,
                PageIndex: 0,
                IsPaginate: true,
                QueryOptimizerBehavior: "",
            };
           

            this.QueryStringFilter = _queryStringFilter;
            this.MakeGetBaseUrl = _makeGetBaseUrl;
            this.MakeGetMoreResourceBaseUrl = _makeGetMoreResourceBaseUrl;
            this.MakeDeleteBaseUrl = _makeDeleteBaseUrl;
            this.MakeUri = _makeUri;
            this.makeEndPoint = _makeEndPoint;

            var self = this;

            function _queryStringFilter(filterBehavior) {

                if (self.Filter.OrderFields !== undefined) {
                    self.Filter.IsOrderByDynamic = true;
                    if (self.Filter.OrderByType === undefined)
                        self.Filter.OrderByType = 1;
                }

                if (filterBehavior !== undefined)
                    self.Filter.FilterBehavior = filterBehavior;

                var filterMerged = $httpParamSerializer(angular.merge({}, self.DefaultFilter, self.Filter));

                if (self.Filter.Id !== undefined)
                    return String.format("{0}?{1}", self.Filter.Id, filterMerged);

                return String.format("?{0}", filterMerged);

            }

            function _makeGetBaseUrl() {
                return String.format("{0}/{1}", _makeUri(), _queryStringFilter());
            }

            function _makeGetMoreResourceBaseUrl(filterBehavior) {
                return String.format("{0}/more/{1}", _makeUri(), _queryStringFilter(filterBehavior));
            }

            function _makeDeleteBaseUrl() {
                return String.format("{0}/?{1}", _makeUri(), $httpParamSerializer(self.Filter));
            }

            function _makeUri() {

                return String.format("{0}/{1}", _makeEndPoint(), self.Resourse)
            }

            function _makeEndPoint() {

                if (!self.EndPoint)
                    return endpoints.DEFAULT;

                return endpoints[self.EndPoint];
            }

            String.format = function () {
                var theString = arguments[0];
                for (var i = 1; i < arguments.length; i++) {
                    var regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
                    theString = theString.replace(regEx, arguments[i]);
                }

                return theString;
            }

        }

        this.resourse = function (o) {
            return new init(o);
        }


    };

})();