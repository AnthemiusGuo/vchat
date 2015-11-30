var BaseServer = require('framework/baseConnectorServer');
var ThisServer = BaseServer.extend({

    prepare : function() {
        this.LOGIN_CACHE_EXPIRE = 86400;
    },
    run : function() {

    }
});
module.exports = ThisServer;
