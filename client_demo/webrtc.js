var PeerConnection = (window.PeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection || window.mozRTCPeerConnection); //对等链接
 var URL = (window.URL || window.webkitURL || window.msURL || window.oURL);
 var getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
 var nativeRTCIceCandidate = (window.mozRTCIceCandidate || window.RTCIceCandidate);
 var nativeRTCSessionDescription = (window.mozRTCSessionDescription || window.RTCSessionDescription); // order is very important: "RTCSessionDescription" defined in Nighly but useless
 var moz = !!navigator.mozGetUserMedia;

 // "url": "stun:stun.l.google.com:19302"
 var iceServer = {
     "iceServers": [{
         "url": "stun:stun.l.google.com:19302"
     }]
 };



 /**********************************************************/
 /*                                                        */
 /*                   流及信道建立部分                     */
 /*                                                        */
 /**********************************************************/
function webRTC(){
    //本地WebSocket连接
    this.socket = null;

    //本地socket的id，由后台服务器创建
    this.me = null;

    //保存所有与本地连接的socket的id
    this.connections = [];

    //本地media stream
    this.localMediaStream = null;

    //保存所有与本地相连的peer connection， 键为socket id，值为PeerConnection类型
    this.peerConnections = {};

    var that = this;

    this.on('user_loginAck',function(data){
        consoleLog('登录成功',data);
        that.joinRoom(100);
        consoleLog('发送加入聊天室',data);
	});

    this.on('_peers', function(data) {
         //获取所有服务器上的
         that.connections = data.connections;
         that.me = data.you;
         that.emit('connected', this.socket);
    });
    this.on('ready', function() {
        that.createPeerConnections();
        that.addStreams();
        that.sendOffers();
    });

    this.on('_offer', function(data) {
        that.receiveOffer(data.socketId, data.sdp);
    });

    this.on('_answer', function(data) {
        that.receiveAnswer(data.socketId, data.sdp);
        that.emit('get_answer', data);
    });

    this.on("_ice_candidate", function(data) {
         var candidate = new nativeRTCIceCandidate(data);
         var pc = that.peerConnections[data.socketId];
         pc.addIceCandidate(candidate);
    });


    this.on('_new_peer', function(data) {
         that.connections.push(data.socketId);
         var pc = that.createPeerConnection(data.socketId);
         pc.addStream(that.localMediaStream);
     });
}
//继承自事件处理器，提供绑定事件和触发事件的功能
webRTC.prototype = new EventEmitter();

/*************************流和服务器建立连接部分*******************************/

webRTC.prototype.sendPackage = function(category,method,data) {
	var dd = new Date();
	var ts = dd.getTime();
	var packet = {'c':category,'m':method,'d':data,'t':ts,'s':packetId,'r':1};
	this.socket.send(JSON.stringify(packet));
	packetId++;
	sendLog("rtcServer",packet);
}

webRTC.prototype.init = function(user,server){
    this.uid = user.uid;
    this.ticket = user.ticket;
    this.server = server;
}

webRTC.prototype.joinRoom = function(room){
    this.room = room || "";
    this.sendPackage('rtc','joinReq',{room:room});
}

webRTC.prototype.connect = function() {
  var socket;
  that = this;
  socket = this.socket = new WebSocket(this.server);
  socket.onopen = function() {
      consoleLog("打开socket");
      that.sendPackage('user','loginReq',{uid:that.uid,ticket:that.ticket});
  };

  socket.onmessage = function(message) {
      console.log(message);
     var json = JSON.parse(message.data);
     recvLog('rtc',json);
     if (json.c && json.m) {
         that.emit(json.c+"_"+json.m, json.d);
     } else {
         consoleLog("命令为空，你想要做什么？");
     }
 };

  socket.onerror = function(error) {
      consoleLog("链接错误");
 };

  socket.onclose = function(data) {
     consoleLog("关闭socket");
  };
}

/*************************流处理部分*******************************/
 //创建本地流
 webRTC.prototype.createStream = function(options) {
     var that = this;

     if (getUserMedia) {
         getUserMedia.call(navigator, options, function(stream) {
                 that.localMediaStream = stream;
                 that.emit("stream_created", stream);
                 that.emit("ready");
             },
             function(error) {
                 console.log("创建视频流失败！");
             });
     } else {
         console.log("浏览器不支持视频流创建");
     }
 };

    //将本地流添加到所有的PeerConnection实例中
 webRTC.prototype.addStreams = function() {
     var i, m,
         stream,
         connection;
     for (connection in this.peerConnections) {
         this.peerConnections[connection].addStream(this.localMediaStream);
     }
 };


 //将流绑定到video标签上用于输出
 webRTC.prototype.attachStream = function(stream, domId) {
     var element = document.getElementById(domId);
     if (navigator.mozGetUserMedia) {
         element.mozSrcObject = stream;
         element.play();
     } else {
         element.src = webkitURL.createObjectURL(stream);
     }
     element.src = webkitURL.createObjectURL(stream);
 };


 //创建与其他用户连接的PeerConnections
 webRTC.prototype.createPeerConnections = function() {
     var i, m;
     for (i = 0, m = this.connections.length; i < m; i++) {
         this.createPeerConnection(this.connections[i]);
     }
 };
 //创建单个PeerConnection
 webRTC.prototype.createPeerConnection = function(socketId) {
     var that = this;
     var pc = new PeerConnection(iceServer);
     this.peerConnections[socketId] = pc;
         pc.onicecandidate = function(evt) {
         if (evt.candidate)
             that.socket.send(JSON.stringify({
                 "eventName": "__ice_candidate",
                 "data": {
                     "label": evt.candidate.sdpMLineIndex,
                     "candidate": evt.candidate.candidate,
                     "socketId": socketId
                 }
             }));
     };

     pc.onopen = function() {
         that.emit("pc_opened", socketId, pc);
     };

     pc.onaddstream = function(evt) {
         that.emit('pc_add_stream', evt.stream, socketId, pc);
     };

     pc.ondatachannel = function(evt) {
         that.addDataChannel(socketId, evt.channel);
         that.emit('pc_add_data_channel', evt.channel, socketId, pc);
     };
     return pc;
 };


/***********************信令交换部分*******************************/

 //向所有PeerConnection发送Offer类型信令
 webRTC.prototype.sendOffers = function() {
     var i, m,
         pc,
         that = this,
         pcCreateOfferCbGen = function(pc, socketId) {
             return function(session_desc) {
                 pc.setLocalDescription(session_desc);
                 that.socket.send(JSON.stringify({
                     "eventName": "__offer",
                     "data": {
                         "sdp": session_desc,
                         "socketId": socketId
                     }
                 }));
             };
         },
         pcCreateOfferErrorCb = function(error) {
             console.log(error);
         };
     for (i = 0, m = this.connections.length; i < m; i++) {
         pc = this.peerConnections[this.connections[i]];
         pc.createOffer(pcCreateOfferCbGen(pc, this.connections[i]), pcCreateOfferErrorCb);
     }
 };

   //接收到Offer类型信令后作为回应返回answer类型信令
 webRTC.prototype.receiveOffer = function(socketId, sdp) {
   //  var pc = this.peerConnections[socketId];
     this.sendAnswer(socketId, sdp);
 };

 //发送answer类型信令
 webRTC.prototype.sendAnswer = function(socketId, sdp) {
     var pc = this.peerConnections[socketId];
     var that = this;
     pc.setRemoteDescription(new nativeRTCSessionDescription(sdp));
     pc.createAnswer(function(session_desc) {
         pc.setLocalDescription(session_desc);
         that.socket.send(JSON.stringify({
             "eventName": "__answer",
             "data": {
                 "socketId": socketId,
                 "sdp": session_desc
             }
         }));
     }, function(error) {
         console.log(error);
     });
 };

  //接收到answer类型信令后将对方的session描述写入PeerConnection中
 webRTC.prototype.receiveAnswer = function(socketId, sdp) {
     var pc = this.peerConnections[socketId];
     pc.setRemoteDescription(new nativeRTCSessionDescription(sdp));
 };

/**********************************************************/
 /*                                                        */
 /*                       事件处理器                        */
 /*                                                        */
 /**********************************************************/
 function EventEmitter() {
     this.events = {};
 }
 //绑定事件函数
 EventEmitter.prototype.on = function(eventName, callback) {
     this.events[eventName] = this.events[eventName] || [];
     this.events[eventName].push(callback);
 };
 //触发事件函数
 EventEmitter.prototype.emit = function(eventName, _) {
     var events = this.events[eventName],
         args = Array.prototype.slice.call(arguments, 1),
         i, m;

     if (!events) {
         return;
     }
     for (i = 0, m = events.length; i < m; i++) {
         events[i].apply(null, args);
     }
 };
