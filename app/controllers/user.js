var BaseCtrller = require('framework/BaseController.js');
var ThisCtrller = BaseCtrller.extend({
    loginReq : function(data,session) {
        logger.info(data);

    },

});
module.exports = ThisCtrller;
