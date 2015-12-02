var HTTPCaller = Class.extend({
	init : function (serverConfig){
		this.serverConfig = serverConfig;
		//TODO,启动之后应该先检测一下服务是否可达
		this.allReady = true;
	},
	_buildReqUrl : function(controller,method,id){
		if (id!=null){
			return this.serverConfig.url+utils.supplant(this.serverConfig.routerStrId,{c:controller,m:method,id:id});
		} else {
			return this.serverConfig.url+utils.supplant(this.serverConfig.routerStr,{c:controller,m:method});
		}
	},

	callCommand : function(controller,method,id,data,cb){
		logger.debug("callCommand",controller,method,id,data);

		this.seqId++;
		var seqId = this.seqId;
		var reqData = {s:seqId,c:controller,m:method,id:id,d:data};

		var url = this._buildReqUrl(controller,method,id);
		this.sendHttpPost(url,reqData,cb);
	},

	sendHttpPost : function(url,reqData,cb){

		var http = require('http');
		var post_data = "data="+JSON.stringify(reqData);
		var options = {
		    host: this.serverConfig.host,
		    path: url,
		    method: 'POST',
		    headers:{
			  	'Content-Type':'application/x-www-form-urlencoded',
			  	'Content-Length':post_data.length
		    },
		    agent:false
		};
		var self = this;
		var req = http.request(options, function(res) {
			logger.trace('STATUS: ' + res.statusCode);
  			if (res.statusCode!=200) {
  				cb(0-res.statusCode,JSON.stringify(res.headers),self.requestQueue[reqId]);
  				return;
  			}
		    res.setEncoding('utf8');
		    var total_data = '';
		    res.on('data', function(data) {
		    	total_data += data;
		    }).on('end',function(){
		    	try {
		    		logger.trace("web return:",total_data);
		    		var resp_data = JSON.parse(total_data);
					logger.trace("web return as json:",resp_data);
		    		if (cb==undefined) {
		    			self.onMsgAck(req.c,req.m,1,resp_data);
		    		} else {
		    			cb(1,resp_data);
		    		}
		    		self.requestQueue[reqId] = null;
		    	}
		    	catch(err){
		    		if (cb==undefined) {
		    			self.onMsgAck(req.c,req.m,-1,err);
		    		} else {
		    			cb(-1,err);
		    		}
		    	}

		    });
		});
		req.write(post_data);
		req.end();
	},
	sendHttpGet : function(reqId,host,url,cb){
		var http = require('http');

		var options = {
		    host: host,
		    path: url,
		    method: 'GET',
		    headers: {
		        'Accept': 'text/html'
		    },
		    agent:false
		};
		logger.trace('fetching '+url);
		var req = http.request(options, function(res) {
		    res.setEncoding('utf8');
		    var total_data = '';
		    res.on('data', function(data) {
		    	total_data += data;
		    }).on('end',function(){
		    	try {
		    		var data = JSON.parse(total_data);
		    		cb(self.requestQueue[reqId].category,self.requestQueue[reqId].method,-1,err,self.requestQueue[reqId]);
		    	}
		    	catch(err){
		    		cb(self.requestQueue[reqId].category,self.requestQueue[reqId].method,-1,err,self.requestQueue[reqId]);
		    		logger.error(err);
		    	}

		    });
		});
		req.end();
	},
	onMsgAck: function(category,method,ret,data) {
		logger.error("unhandled rpc response package!",ret,data);
	}

});
module.exports = HTTPCaller;
