PORT = 80;
HOST = null;//localhost
var http = require('http');
var url  = require('url');
var fs   = require('fs');


// --------------------------
// create server
// --------------------------
var server = http.createServer(function(req, res){
	var path = url.parse(req.url).pathname;
    switch(path){
		  case '/':
			fs.readFile(__dirname + '/public/user.html', function(err, data){
				if (err) return send404(res);
				res.writeHead(200, {'Content-Type': 'text/html'});
				res.write(data, 'utf8');res.end();
			});
			break;
      case '/screen':
			fs.readFile(__dirname + '/public/viewer.html', function(err, data){
				if (err) return send404(res);
				res.writeHead(200, {'Content-Type': 'text/html'});
				res.write(data, 'utf8');res.end();
			});
			break;
      case '/js/client.js':
      case '/js/util.js':
            fs.readFile(__dirname + path, function(err, data) {
                if (err) return send404(res);
                res.writeHead(200, {'Content-Type': 'text/javascript'});
                res.write(data);res.end();
            });
      break;
      case '/css/style.css':
      case '/css/smartphone.css':
            fs.readFile(__dirname + path, function(err, data) {
                if (err) return send404(res);
                res.writeHead(200, {'Content-Type': 'text/css'});
                res.write(data, 'utf8');res.end();
            });
      break;
      case '/logo.png':
            fs.readFile(__dirname +'/public/'+ path, function(err, data) {
                if (err) return send404(res);
                res.writeHead(200, {'Content-Type': 'image/png'});
                res.write(data);res.end();
            });
      break;
      case /csv$/:
            fs.readFile(__dirname +'/log/'+ path, function(err, data) {
                if (err) return send404(res);
                res.writeHead(200, {'Content-Type': 'text/csv'});
                res.write(data);res.end();
            });
      break;
      default:
        send404(res);
      break;
    }
});
var send404 = function(res){
	res.writeHead(404);res.write("404 Not Found");res.end();
};
server.listen(PORT);

// --------------------------
// アプリ内変数
// --------------------------
var nicks  = {};
var colors = {};
var messages = [];
var screen = null;
// --------------------------
// io
// --------------------------
var io   = require('socket.io').listen(server);
io.sockets.on('connection',function(_client){
  //_client.json.emit("message",'from sv:接続したよ');

  //クライアントが画面を開いたイベント
  _client.on('join',function(json){
    nicks[_client.id] = json["nam"];
    colors[_client.id] = json["col"];
    if(json["nam"] === "screen"){
      screen = _client;
      console.log(_client);
    }
    console.log('user joined:' + json["nam"] +":"+ _client.id);
    //io.sockets.emit('first_connection', _client.id);
    _client.json.emit('first_connection', _client.id);
  });
  
  //join完了したユーザから受け取るイベント
  _client.on('first',function(msg){
    console.log('sv:recieve first:' + msg + _client.id);
    _client.broadcast.json.emit("user_add",{"user":nicks[_client.id],"msg":'connected'});
    updateMember();
    logMessage(_client.id,"接続");
  });


  //クライアントからメッセージを受け取ったとき（つかわない)
  _client.on('message', function(msg){
    console.log('sv:recieve message:' + msg);
    _client.json.emit("message","__mymsg:" + msg);//自分
    //socket.broadcast({message: msg});//全員
  });


  //毎回ツイートしてくるイベント
  //クライアントから受けて、viewerに出す
  _client.on('tweet',function(msg){
    console.log('sv:recieve TWEET:' + msg + _client.id);
    // 自分以外の全員にメッセージを送る
    _client.broadcast.json.emit("tw",{"user":nicks[_client.id],"msg":msg,"col":colors[_client.id]});
    logMessage(_client.id,msg);
  });
  
  //お描き画像を受け取ったイベント
  //クライアントから受けて、viewerに出す
  _client.on('oekaki',function(data){
    console.log('sv:recieve img:' + _client.id);
    // スクリーンだけにメッセージを送る
    if(screen != null){
      screen.json.emit("oekaki",{"user":nicks[_client.id],"msg":data,"col":colors[_client.id]});
      logMessage(_client.id,data);
    }
  });
  
  
  //クライアントが接続切れた
  _client.on('disconnect', function(){
    _client.broadcast.json.emit("discon",{"user":nicks[_client.id],"msg":'disconnected'});
    delete nicks[_client.id];
    updateMember();
    logMessage(_client.id,"切断");
  });
  
  
  //ユーザ数とメモリを更新(viewerから定期的に受信)
  _client.on('condition',function(msg){
    console.log('sv:recieve CONDITION:' + msg + _client.id);
    updateMember();
  });
  
  //ユーザ数とメモリを計算して更新
  var updateMember=function(){
    var _mem = process.memoryUsage().rss;
    var _usr = (function(o){
      var k=0;
      for(var i in o){k++}
       return (k-1)<0 ? 0 : k-1;
    })(nicks)
    _client.json.emit("condition",{"user":_usr,"mem":_mem});
  }
  
  //今日の日付のテキストファイル(CSV)に保存
  var logMessage=function(clientid,msg){
    messages.push(
      new Date() + ","
      +clientid + "," 
      +nicks[clientid]+","
      +msg +"\n"
    );
    
    var day = fulldate() + ".csv";//YYYYMMDD
    //fs.open("/log/"+day,"a+",777,function(err,fd){
    //  var file_info = messages[messages.length-1];
    //  var buf = new Buffer(file_info);
    //  fs.write(fd, buf, 0, Buffer.byteLength(file_info), null, function(){
    //    fs.close(fd);
    //  });
    //});
  }
  // return yyyymmdd
  var fulldate=function(){
    var d = new Date();
    var ret = d.getFullYear().toString();
    var m = d.getMonth()+1;
    if(m < 10){ m = "0"+ m.toString();
    }else{
     m = m.toString();
    }
    ret += m;
    var dy = d.getDate();
    if(dy<10){ dy = "0"+dy.toString();
    }else{
    dy = dy.toString();
    }
    ret += dy;
    return ret;
  }
  
  
});//connection

