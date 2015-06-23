'use strict';

(function (ng) {

    var module = ng.module('springsApp');

    if (!document.URL.match(/\?nobackend$/) && window.localStorage.nobackend !== 'true') {
        module.constant('nobackend', false);
        return;
    }

    module
        .constant('nobackend', true)
        .config(['$provide', function ($provide) {
            $provide.decorator('$httpBackend', angular.mock.e2e.$httpBackendDecorator);
        }])
        .run(['$httpBackend', function ($httpBackend) {
            $httpBackend.whenGET(/^(?!(api)).+/).passThrough();
        }])
        .config(['$httpProvider', function ($httpProvider) {
            $httpProvider.interceptors.push(['$log', '$q', function ($log, $q) {
                return {
                    request: function (config) {
                        if (needLog(config.url)) {
                            logRequest(config);
                        }
                        return config;
                    },
                    response: function (response) {
                        var config = response.config;
                        if (!config) {
                            return;
                        }
                        if (needLog(config.url)) {
                            $log.info(config.method, ' <- [', response.status, ']', config.url, response.data);
                        }

                        return response;
                    },
                    responseError: function (rejection) {
                        var config = rejection.config;
                        if (!config) {
                            return;
                        }
                        $log.warn(config.method, ' <- [', rejection.status, ']', config.url, rejection.data);
                        return $q.reject(rejection);
                    }
                };

                function needLog(url) {
                    return (/^api.+/).test(url);
                }

                function logRequest(config) {
                    $log.info(config.method, ' -> ', config.url, config.params, config.data);
                }
            }]);
        }]);

})(angular);
