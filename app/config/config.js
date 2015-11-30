var config = module.exports;
if (process.env.NODE_ENV === undefined) {
	var PRODUCTION = "development";//"production";
} else {
	var PRODUCTION = process.env.NODE_ENV;
}

if (PRODUCTION==="production") {
    config.redis = {
    	port: 27017,
    	host: 'localhost'
    };

    config.mysql = {
    	port: 3306,
    	host: 'localhost',
    	user: 'test',
    	password: 'test',
    	db: 'card_game'
    };


    config.upstreamUrl = {
    	url:""
    }
} else {
    config.redis = {
    	port: 27017,
    	host: 'localhost'
    };

    config.mysql = {
    	port: 3306,
    	host: 'localhost',
    	user: 'test',
    	password: 'test',
    	db: 'card_game'
    };


    config.upstreamUrl = {
    	url:""
    }
}
config.servers = {
    //聊天服务
    "rtcServer":{
        "runTyp":"nodejs",//nodejs 在本机启动,用于runner脚本
        "dbMods" : {"mongodb":true,"redis":true,"mysql":false},
        "serverList" : {
            "rtcServer-server-1":{
                "id":"rtcServer-server-1",
                "typ":"rtcServer",
                "host":"127.0.0.1",
                "clientPort":3000,
                "frontend":true}
        }
    }
}
