var BaseServer = require('framework/baseApp');
var ConnectorServer = BaseServer.extend({
	init : function(typ,id,info) {
		this._super(typ,id,info);
		this.uidUserMapping = {};
        this.onlineUserCount = 0;
	},
	_genTicket : function(uid){
		var now = new Date().getTime();
	}
});
module.exports = ConnectorServer;
