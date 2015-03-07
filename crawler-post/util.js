//======================== HashMap Util =========================================
HashMap = function() {
    this.keys = [];
    this.values = [];

    this.put = function(key, value){
        this.keys.push(key);
        this.values.push(value);
    }

    this.size = function(){
        return this.keys.length;
    }

    this.get = function(key){
        var index = this.keys.indexOf(key);
        if(index < 0) return "";
        return this.values[index];
    }

    this.remove = function(key){
        var index = this.keys.indexOf(key);
        if(index < 0) return;
        this.keys.slice(index);
        this.values.slice(index);
    }
}
//=============================Date Util ===============================
var moment = require('moment');

DateUtil = function(){}
DateUtil.convertToDateString = function(input){
    //Thứ Ba, ngày 27/01/2015 09:44 AM (GMT+7)
    if(input.indexOf('/') > 2){
        input = input.substring(input.indexOf('/') - 2);
        var lastIndexSplash = input.lastIndexOf('/');
        input = input.substring(0, lastIndexSplash + 5);
    }
    return input.split('/').reverse().join('-');
}

DateUtil.toDateTime = function(rawDataStr){
   return moment(DateUtil.convertToDateString(rawDataStr));
}

DateUtil.rangeOfTwoDate = function(startDate, endDate){
    return startDate.diff(endDate, 'days');
}