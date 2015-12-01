var BaseSocketManager = require("framework/baseSocketManager");

var BaseApp = Class.extend({
	init : function(typ,id,info) {
		this.typ = typ;
		this.id = id;
		this.info = info;
		this.errorInfo = "";

		this.allReady = false;
		this.firstAllReady = false;

		this.serverInitReady = true;
		this.serverSocketListenReady = false;

		this.startTS = new Date().getTime();
		this.readyTS = 0;

		dmManager.setHashKeyValueKVDBGlobal("srvSta/"+this.typ,this.id,0);

		this.globalTicket = F.md5(this.startTS+"sKlaa"+this.id);

		logger.info("this.globalTicket",this.globalTicket);
		this.checkReadyTick = null;

		this.ctrllers = {};
	},
	getErr : function(){
		return this.errorInfo;
	},
	setErr : function(msg){
		this.errorInfo = msg;
		logger.warn(this.id+"@"+this.typ+" : "+msg);
	},
	prepare : function() {
		utils.PLEASE_OVERWRITE_ME();
	},
	genLoadBalance : function() {
		utils.PLEASE_OVERWRITE_ME();
		return 0;
	},
	run : function() {
		//如果启动需要先读取数据库什么的, 就重写初始化时候把this.serverInitReady置为false,
		//这样定时执行等好了再说
		if (this.serverInitReady) {
			this.openSocketServer();
		}
		if (this.checkReadyTick ==null) {
			this.checkReadyTick = setInterval(this.checkStatus.bind(this),3000);
		}

	},
	checkStatus : function() {
		if (!this.serverInitReady) {
			logger.info("init not ready now!!");
			this.allReady = false;
			return;
		}

		this.allReady = true;
		clearInterval(this.checkReadyTick);
		this.checkReadyTick = null;
		logger.info("All server Ready!!");

		if (this.firstAllReady==false) {
			this.firstAllReady = true;
			this.onAllReady();
		} else {
			this.onReReady();
		}
	},
	onAllReady : function() {
		this.readyTS = new Date().getTime();
		dmManager.setHashKeyValueKVDBGlobal("srvSta/"+this.typ,this.id,1);
		dmManager.setHashKeyValueKVDBGlobal("srvRun/"+this.id,"readyTS",this.readyTS);
		dmManager.setHashKeyValueKVDBGlobal("srvRun/"+this.id,"startTS",this.startTS);
		clearInterval(this.checkReadyTick);
		this.checkReadyTick = null;

	},
	onReReady : function() {
		this.readyTS = new Date().getTime();
		dmManager.setHashKeyValueKVDBGlobal("srvSta/"+this.typ,this.id,1);
		dmManager.setHashKeyValueKVDBGlobal("srvRun/"+this.id,"readyTS",this.readyTS);
		clearInterval(this.checkReadyTick);
		this.checkReadyTick = null;
	},
	onPause : function(reason) {
		//故障暂停，
		this.allReady = false;
		this.readyTS = new Date().getTime();
		dmManager.setHashKeyValueKVDBGlobal("srvSta/"+this.typ,this.id,2);
		dmManager.setHashKeyValueKVDBGlobal("srvRun/"+this.id,"readyTS",this.readyTS);

		logger.info("server onPause by reason ",reason);
		if (this.checkReadyTick ==null) {
			this.checkReadyTick = setInterval(this.checkStatus.bind(this),3000);
		}
	},
	sendToClientBySocket : function(socket,category,method,ret,packetId,data){
		var ts =  new Date().getTime();
		var packet = {'c':category,'m':method,'d':data,'t':ts,'s':packetId,'r':ret};
		socket.send(JSON.stringify(packet));
	},
	sendToClientErrBySocket : function(socket,errorId,errorInfo,packetId) {
		this.sendToClientBySocket(socket,'error','packageErr',errorId,packetId,{e:errorInfo});
	},

	doLogin : function(uid,userSession,packetId) {
		utils.PLEASE_OVERWRITE_ME();
	},

	openUserServer : function(){

		this.userSocketManager = new BaseSocketManager(this,this.typ);
		var serversInfo = this.info;
		//支持对用户接入,监听用户端口
	    global.frontServer = new WebSocketServer({port: serversInfo.clientPort});

	    var UserClient = require('framework/clients/userClient');
	    frontServer.userClients = {};
	    this._user_sock_id = 0;
	    frontServer.on('connection', function(socket) {
	        logger.debug('someone connected');
	        this._user_sock_id ++;
	        var ts = new Date().getTime();
	        socket.socket_id = F.md5(this._user_sock_id+"sd"+ts);
	        var clientSession = new UserClient(socket);
	        if (logicApp.allReady==false) {
	            clientSession.kickUser("serverNotReady");
	            return;
	        }
	        logicApp.userSocketManager.onNewSocketConnect(clientSession,socket);
	        socket.on('message', function(message) {
	            logicApp.onRecv(clientSession,message)
	        })
	        .on('close',function(code, message){
	            logger.debug("===closed user client");
	            logicApp.userSocketManager.onCloseSocketConnect(socket);
	            clientSession.onCloseSocket();

	        });
	    });
	    setInterval(this.doArrangeUser,10000);
	},
	doArrangeUser : function(){
		utils.PLEASE_OVERWRITE_ME();
	},
	openSocketServer : function(){
		global.WebSocketServer = require('ws').Server;
		//不用管是否执行完, 只要执行过了就好了
		this.serverSocketListenReady = true;
		var serversInfo = this.info;
		//先放在这里,将来移到run函数
		if (this.info.frontend) {
			this.openUserServer();
		}
	},
	onRecv: function(clientSession,message) {
		var pkg = JSON.parse(message);
		if (!F.isset(pkg.c) || !F.isset(pkg.m) || !F.isset(pkg.d) || !F.isset(pkg.t) || !F.isset(pkg.s) || !F.isset(pkg.r)) {
			var packetSerId = pkg.s;
			clientSession.sendErr(-9999,"信令格式有误",packetSerId);
			return;
		}
		logger.info("app/controllers/"+pkg.c);

		if (!F.isset(this.ctrllers[pkg.c])){
			var Controller = require("app/controllers/"+pkg.c);
			this.ctrllers[pkg.c] = new Controller(this.typ,this.app);
		}
		this.ctrllers[pkg.c][pkg.m](pkg.d,clientSession);
	}
});

module.exports = BaseApp;
