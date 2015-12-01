var BaseApp = require('framework/baseApp');
var ThisApp = BaseApp.extend({

    prepare : function() {
        this.LOGIN_CACHE_EXPIRE = 86400;
        //这里做一些准备工作，注意，这是异步的！！

        //如果什么都不需要，设置自己为 ready
        this.serverInitReady = true;
        
    },
    doArrangeUser : function(){
        //10秒清理一次无用的用户链接数据，解约内存

    }
});
module.exports = ThisApp;
