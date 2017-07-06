(function () {
    'use strict';

// Setup the filter
angular.module('common.utils').filter('decimaToTime', function () {

    // Create the return function
    // set the required parameter name to **number**
    return function (number) {

        if (number == null)
            return "00:00";

        var hours = Math.floor(number);
        var mins = (number - hours).toFixed(2) * 100;

        if (hours <= 9)
            hours = "0" + hours;

        if (mins <= 9)
            mins = "0" + Math.floor(mins);

        return hours + ":" + mins;
    }
    });

})();