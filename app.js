//这是我用的John Resig的 class继承写法，可以看我的例子或者John Resig的官网
global.Class = require('node.class');
//utils是我写的一些通用函数
global.utils = require('framework/baseFunction');
//phpjs 项目提供了大量 php 函数的 js 转写，尤其是 array 函数和字符串函数，很好用哦
global.F = require('phpjs');
//async 库是一个基础流程控制库，语法糖，用于解决 js 的多层回调写法太恶心的问题，这个都是语法糖，所以务必阅读教程文档
global.async = require("async");

var log4js = require('log4js');
log4js.replaceConsole();
global.logger = log4js.getLogger();

global.rootDir = __dirname;
global.config = require('app/config/config')

//nohup node app.js --typ=rtcServer --id=lobby-server-1 & >room_1.out
//预留着吧，将来写分布式需要
var init_param = {typ:"rtcServer",id:"rtcServer-server-1"};

//处理参数
process.argv.forEach(function (val, index, array) {
    if (index<2){
      //node and app
      return;
    }
    var kv = val.replace(/\-\-/,'').split('=');
    init_param[kv[0]] = kv[1];
});

global.appTyp = init_param.typ;
global.appId = init_param.id;

logger.info("App Begin");

//log4js用法，参考官网
//log4js.loadAppender('console');
//log4js.loadAppender('file');
//log4js.addAppender(log4js.appenders.file('logs/cheese.log'), 'cheese');

// var logger = log4js.getLogger('cheese');
logger.setLevel('ALL');
// OFF nothing is logged
// FATAL   fatal errors are logged
// ERROR   errors are logged
// WARN    warnings are logged
// INFO    infos are logged
// DEBUG   debug infos are logged
// TRACE   traces are logged
// ALL everything is logged

// logger.trace('Entering cheese testing');
// logger.debug('Got cheese.');
// logger.info('Cheese is Gouda.');
// logger.warn('Cheese is quite smelly.');
// logger.error('Cheese is too ripe!');
// logger.fatal('Cheese was breeding ground for listeria.');

var configInfo = config.servers[appTyp];
var serversInfo = config.servers[appTyp].serverList[appId];
/*prepare*/
async.parallel(
    [
        function mysqlCon(callback){
            /*prepare mysql*/
            if (configInfo.dbMods.mysql && config.mysql!=undefined) {
                var mysql      = require('mysql');
                global.db = mysql.createConnection({
                  host     : config.mysql.host,
                  user     : config.mysql.user,
                  password : config.mysql.password,
                  database : config.mysql.db,
                });
                db.allReady = false;

                db.connect(function(err) {
                    if (err) {
                        logger.error('mysql error connecting: ' + err.stack);
                         callback(-1,err);
                    }
                    db.allReady = true;
                    logger.info('mysql connected as id ' + db.threadId);
                    callback(null);
                });

            } else {
                callback(null);
            }
        },
        function redisCon(callback){
            /*prepare redis*/
            if (configInfo.dbMods.redis && config.redis!=undefined) {
                global.redis = require("redis");
                global.kvdb = redis.createClient();
                kvdb.allReady = false;
                // if you'd like to select database 3, instead of 0 (default), call
                // kvdb.select(3, function() { /* ... */ });
                kvdb.on("connect", function () {
                    logger.info('redis connected');
                    kvdb.allReady = true;
                    callback(null);
                }).on("error", function (err) {
                    logger.debug("redis Error " + err);
                    callback(-3,err);
                });

            } else {
                callback(null);
            }
        }
    ],
    // optional callback
    function(err, results){
        // the results array will equal ['one','two'] even though
        // the second function had a shorter timeout.
        if (err!=null) {
            logger.error("INIT FAILED!!!");
            process.exit();
            return;
        }

        logger.info('app prepare done! will init app...');

        //DmManager是个数据结构的对象工厂
        DmManager = require('framework/dataModelManager');
        global.dmManager = new DmManager();

        //主程序
        var LogicApp = require('app/'+appTyp);
        global.logicApp = new LogicApp(appTyp,appId,serversInfo);
        
        logicApp.prepare();
        logicApp.run();
    }
);


//e.g.
//rpc.run("lobby","recudeCoin",{uid:1},{uid:1,count:1000});
