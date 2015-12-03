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
    this.ticket = '';
}
User.prototype.onUserMsg_loginAck = function(category,method,data,ts,packetId,ret) {

}

User.prototype.onUserMsg_unknown = function(category,method,data,ts,packetId,ret) {
	consoleLog("lobby","unkonwn package!!!");
}


user = new User(uid);

var chatSocket;
var ticket = "";
var videos = document.getElementById("videos");
var sendBtn = document.getElementById("sendBtn");
var msgs = document.getElementById("msgs");
var sendFileBtn = document.getElementById("sendFileBtn");
var files = document.getElementById("files");
var webRTC = new webRTC();


//成功创建WebSocket连接
webRTC.on("connected", function(socket) {
      console.log("创建连接成功，创建本地视频流。");
    log("创建连接成功，创建本地视频流。");
    //创建本地视频流  //
      webRTC.createStream({
        "video": true,
        "audio": false
      });
});

//创建本地视频流成功
webRTC.on("stream_created", function(stream) {
  document.getElementById('me').src = URL.createObjectURL(stream);
  document.getElementById('me').play();
});

 //创建本地视频流失败
webRTC.on("stream_create_error", function() {
  alert("create stream failed!");
});
//接收到其他用户的视频流
webRTC.on('pc_add_stream', function(stream, socketId) {
  console.log(socketId);
  var newVideo = document.createElement("video"),
      id = "other-" + socketId;
  newVideo.setAttribute("class", "other");
  newVideo.setAttribute("autoplay", "autoplay");
  newVideo.setAttribute("id", id);
  videos.appendChild(newVideo);
  webRTC.attachStream(stream, id);
});

$.getJSON(webUrl+"?m=user&a=login&uid="+uid,function(json){
	// Write your code in the same way as for native WebSocket:
	if (json.ret!=1) {
		consoleLog("web","login failed!!!");
		return;
	}
    user.uid = json.data.uid;
	user.ticket = json.data.ticket;
	rtcServer = json.data.rtcServer;

    webRTC.init(user,"ws://"+rtcServer.host+":"+rtcServer.clientPort);
    webRTC.connect();
    //
	// chatSocket = new WebSocket();
	// chatSocket.onopen = function() {
	// 	consoleLog("rtcServer","open");
	// 	sendChatServer('user','loginReq',{uid:user.uid,ticket:ticket})
	// };
	// chatSocket.onmessage = function(e) {
	//        // Receives a message.
	// 	recvLog("game",e.data);
	// 	var msg = JSON.parse(e.data);
	// 	if (msg.r<0) {
	// 		consoleLog("game",'<span class="red">'+msg.d.e+'</span>');
	// 		return;
	// 	}
	// 	if (msg.c == "user") {
	// 		if (typeof(user["onUserMsg_"+msg.m])=="undefined") {
	// 			user.onUserMsg_unknown(msg.c,msg.m,msg.d,msg.t,msg.s,msg.r);
	// 		} else {
	// 			user["onUserMsg_"+msg.m](msg.c,msg.m,msg.d,msg.t,msg.s,msg.r);
	// 		}
	// 	} else {
	// 		console.log(msg);
	// 	}
	// };
	// chatSocket.onclose = function() {
	// 	consoleLog("rtcServer","closed");
	// };
});


setInterval(function(){
	$.getJSON(webUrl+"?m=user&a=refresh&uid="+uid,function(json){
		if (typeof(json.data.ticket)!="undefined"){
			ticket = json.data.ticket;
		}
	});
},180000)

function log(info){
    $("#console").append('<div>'+info+'</div>');
}
