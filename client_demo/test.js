// // connect to the socket server
// // var socket = io.connect("ws://127.0.0.1:3000");
// var socket = eio.Socket("ws://127.0.0.1:3000");
// // socket.on('open', function () {
// //     socket.send('hi');
// //     socket.on('message', function (msg)
// // 	{
// // 		console.log(msg);
// // 	});
// //  });
// var socket = eio('ws://127.0.0.1:3000');
// socket.on('open', function(){
// 	socket.on('message', function(data){console.log(msg);});
// 	socket.on('close', function(){});
// });

// Let the library know where WebSocketMain.swf is:
WEB_SOCKET_SWF_LOCATION = "WebSocketMain.swf";
var packetId = 0;
var uid = 21;
var webUrl = "http://127.0.0.1/vchat/client_demo/server.php";
var nowRoomId = null;

function rand(min, max) {
  //  discuss at: http://phpjs.org/functions/rand/
  // original by: Leslie Hoare
  // bugfixed by: Onno Marsman
  //        note: See the commented out code below for a version which will work with our experimental (though probably unnecessary) srand() function)
  //   example 1: rand(1, 1);
  //   returns 1: 1

  var argc = arguments.length;
  if (argc === 0) {
    min = 0;
    max = 2147483647;
  } else if (argc === 1) {
    throw new Error('Warning: rand() expects exactly 2 parameters, 1 given');
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sendChatServer(category,method,data) {
	var dd = new Date();
	var ts = dd.getTime();
	var packet = {'c':category,'m':method,'d':data,'t':ts,'s':packetId,'r':1};
	chatSocket.send(JSON.stringify(packet));
	packetId++;
	sendLog("rtcServer",packet);
}

function consoleLog(typ,msg){
	if (typeof(msg)=="object") {
		var log = JSON.stringify(msg);
	} else {
		var log = msg;
	}
	$("#console").append("<b>sock "+typ+"</b>:"+log+"<br/>");
}

function sendLog(typ,msg) {
	if (typeof(msg)=="object") {
		var log = JSON.stringify(msg);
	} else {
		var log = msg;
	}
	console.log("send");
	$("#send").append("<b>sock "+typ+"</b>:"+log+"<br/>");
}
var recvCounter = 0;
function recvLog(typ,msg) {
	if (typeof(msg)=="object") {
		var log = JSON.stringify(msg);
	} else {
		var log = msg;
	}
	if (recvCounter>10){
		$("#recv").html("");
		recvCounter = 0;
	}
	$("#recv").append("<b>sock "+typ+"</b>:"+log+"<br/>");
	recvCounter++;
}

var User = function(uid){
	this.uid = uid;
}
User.prototype.onUserMsg_loginAck = function(category,method,data,ts,packetId,ret) {

}

User.prototype.onUserMsg_unknown = function(category,method,data,ts,packetId,ret) {
	consoleLog("lobby","unkonwn package!!!");
}


user = new User(uid);
var chatSocket;
var ticket = "";

$.getJSON(webUrl+"?m=user&a=login&uid="+uid,function(json){
	// Write your code in the same way as for native WebSocket:
	if (json.ret!=1) {
		consoleLog("web","login failed!!!");
		return;
	}
	ticket = json.data.ticket;
	rtcServer = json.data.rtcServer;
	chatSocket = new WebSocket("ws://"+rtcServer.host+":"+rtcServer.clientPort);
	chatSocket.onopen = function() {
		consoleLog("rtcServer","open");
		sendChatServer('user','loginReq',{uid:user.uid,ticket:ticket})
	};
	chatSocket.onmessage = function(e) {
	       // Receives a message.
		recvLog("game",e.data);
		var msg = JSON.parse(e.data);
		if (msg.r<0) {
			consoleLog("game",'<span class="red">'+msg.d.e+'</span>');
			return;
		}
		if (msg.c == "user") {
			if (typeof(user["onUserMsg_"+msg.m])=="undefined") {
				user.onUserMsg_unknown(msg.c,msg.m,msg.d,msg.t,msg.s,msg.r);
			} else {
				user["onUserMsg_"+msg.m](msg.c,msg.m,msg.d,msg.t,msg.s,msg.r);
			}
		} else if (msg.c == "error") {
			consoleLog("game",'<span class="red">'+msg.d.e+'</span>');
		} else if (msg.c == "table") {
			if (typeof(table["onGameMsg_"+msg.m])=="undefined") {
				table.onMsg_unknown(msg.c,msg.m,msg.d,msg.t,msg.s,msg.r);
			} else {
				table["onGameMsg_"+msg.m](msg.c,msg.m,msg.d,msg.t,msg.s,msg.r);
			}
		} else if (msg.c == "game") {
			if (typeof(game["onGameMsg_"+msg.m])=="undefined") {
				game.onGameMsg_unknown(msg.c,msg.m,msg.d,msg.t,msg.s,msg.r);
			} else {
				game["onGameMsg_"+msg.m](msg.c,msg.m,msg.d,msg.t,msg.s,msg.r);
			}
		}
	};
	chatSocket.onclose = function() {
		consoleLog("rtcServer","closed");
	};
});


setInterval(function(){
	$.getJSON(webUrl+"?m=user&a=refresh&uid="+uid,function(json){
		if (typeof(json.data.ticket)!="undefined"){
			ticket = json.data.ticket;
		}
	});
},180000)
