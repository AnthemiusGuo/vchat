var WebSocketServer = require('ws').Server;
var UUID = require('node-uuid');
var events = require('events');
var util = require('util');
var errorCb = function(rtc) {
	return function(error) {
		if (error) {
			rtc.emit("error", error);
		}
	};
};
function webRTC (){
	this.sockets = [];//用来存储所有用户的socket
	this.rooms = {};



	this.on('__join', function(data, socket) {
		console.log("__join socket.id is: " + socket.id);
		var ids = [],
		room = data.room || "__default",
		curSocket,
		curRoom;

		this.rooms[room] = this.rooms[room] || [];
		curRoom = this.rooms[room];//当前房间所有的人

		//房间有人
		for (i = 0, m = curRoom.length; i < m; i++) {
			curSocket = curRoom[i];
			if (curSocket.id === socket.id) {
				continue;
			}
			ids.push(curSocket.id);
			curSocket.send(JSON.stringify({
				"eventName": "_new_peer",
				"data": {
					"socketId": socket.id
				}
			}), errorCb);
		}

		curRoom.push(socket);
		socket.room = room;

		socket.send(JSON.stringify({
			"eventName": "_peers",
			"data": {
				"connections": ids,
				"you": socket.id
			}
		}),errorCb);


	});



	this.on('__offer', function(data, socket) {
		console.log("__offer");
		var soc = this.getSocket(data.socketId);

		if (soc) {
			soc.send(JSON.stringify({
				"eventName": "_offer",
				"data": {
					"sdp": data.sdp,
					"socketId": socket.id
				}
			}), errorCb);
		}
	});
		this.on('__answer', function(data, socket) {
		console.log("__answer");
		var soc = this.getSocket(data.socketId);
		if (soc) {
			soc.send(JSON.stringify({
				"eventName": "_answer",
				"data": {
					"sdp": data.sdp,
					"socketId": socket.id
				}
			}), errorCb);
			this.emit('answer', socket, data);
		}
	});



	this.on('__ice_candidate', function(data, socket) {
		console.log("__ice_candidate");
		var soc = this.getSocket(data.socketId);
		console.log("52 "+data.candidate);
		if (soc) {
			soc.send(JSON.stringify({
				"eventName": "_ice_candidate",
				"data": {
					"label": data.label,
					"candidate": data.candidate,
					"socketId": socket.id
				}
			}), errorCb);
		}
	});
}


//webRTC 继承 事件处理器 用来处理事件,及回调
util.inherits(webRTC, events.EventEmitter);

/**
对当前用的socket对象进行二次加工，方便我们使用。
**/
webRTC.prototype.init = function(socket) {
	console.log("对当前用的socket对象进行二次加工，方便我们使用。");
	var that = this;
	socket.id = UUID.v4();//给当前的soket设置一个唯一的id
	that.addSocket(socket);//将当前用户的socket添加到sockets数组中。

	//为socket绑定事件处理器用来派发接收到的事件命令
	socket.on('message', function(data) {
		var json = JSON.parse(data);
		if (json.eventName) {
			that.emit(json.eventName, json.data, socket);
		} else {
			console.log("命令为空，你想要做什么？");
		}
	});

	//连接关闭后从webRTC实例中移除连接，并通知其他连接
	socket.on('close', function() {
		console.log("关闭socket连接");
	});



}

webRTC.prototype.addSocket = function(socket) {
	this.sockets.push(socket);
}


webRTC.prototype.getSocket = function(id) {
	var i,
		curSocket;
	if (!this.sockets) {
		return;
	}
	for (i = this.sockets.length; i--;) {
		curSocket = this.sockets[i];
		if (id === curSocket.id) {
			return curSocket;
		}
	}
	return;
};



module.exports.create = function(server){
	var webRTCServer = new webRTC();
	webRTCServer.webSocketServer  = new WebSocketServer({
		server: server
	});
	errorCb = errorCb(webRTCServer);
	webRTCServer.webSocketServer.on('connection', function(socket) {
		console.log("socket链接成功");
		webRTCServer.init(socket);
	});
	return webRTCServer;
}
