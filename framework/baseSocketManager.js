var BaseSocketManager = Class.extend({
	init : function(app,typ) {
		this.app = app;
		this.typ = typ;
		this.packageRouter = {};

		this.socketClientMapping = {};
		this.idClientMapping = {};

		this.connectCount = 0;
		this.loginedCount = 0;
	},
	onNewSocketConnect : function(clientSession,socket) {
		this.socketClientMapping[socket.socket_id] = clientSession;
		this.connectCount++;
	},

	onCloseSocketConnect : function(socket) {
		if (!F.isset(this.socketClientMapping[socket.socket_id])) {
			return;
		}
		if (this.socketClientMapping[socket.socket_id].isLogined) {
			var id = this.socketClientMapping[socket.socket_id].id;
			this.idClientMapping[id] = null;
		}
		this.socketClientMapping[socket.socket_id] = null;
		this.connectCount--;
	}

});

module.exports = BaseSocketManager;
