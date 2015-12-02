var BaseCtrller = require('framework/BaseController.js');
var ThisCtrller = BaseCtrller.extend({
    loginReq : function(data,session) {
        //应该到 http 验证是否可以登录
        httpCaller.callCommand('user','verifyTick',data.uid,data,function(ret,json){
            if (ret>0){
                logger.debug("verifyTick by http",json);
                session.send('user','loginAck',1,0,{});
            }
        });
    },

});
module.exports = ThisCtrller;
