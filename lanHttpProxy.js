// 例外が発生してもサービスを停止しないようにする
process.on('uncaughtException', function(err) {
	console.log(err.stack);
});

var isStartProxy = false;

var app = require('http').createServer(handler), io = require('socket.io')
		.listen(app), fs = require('fs');

app.listen(8000);

function handler(req, res) {
	fs.readFile(__dirname + '/index.html', function(err, data) {
		if (err) {
			res.writeHead(500);
			return res.end('Error loading index.html');
		}

		res.writeHead(200);
		res.end(data);
	});
}

var server = "";
io.sockets.on('connection', function(wsclient) {
	// index.htmlからの接続を受けた場合の処理
	
	// HttpProxyを開始する。
	var port = 8081;
	var sys = require('util');
	var net = require('net');

	if(server != "" ) {
		server.close();
	}
	server = net.createServer(function(c) {

		console.log('server connected');

		// クライアント(Webブラウザ)からデータを受けた場合
		c.on('data', function(data) {
			var parseheader = data.toString().split(/\n/);
			if (parseheader[0].match(/^GET/)
					|| parseheader[0].match(/^CONNECT/)
					|| parseheader[0].match(/^POST/)) {
				console.log("client send : " + parseheader[0].toString());
			} else {
				console.log("client send ");
			}

			// Base64化してWS->HttpProxyへ送る
			var c = data.toString('base64');
			console.log("to ws : " + c);
			wsclient.emit('httptows', {httpdata:c});
			// wsclient.emit('httptows' ,data);
		});

		c.on('end', function() {
			console.log('client disconnected');
		});

		wsclient.on('wstohttp', function(data) {
			// WebSocket経由で結果受取、Base64デコードしてブラウザに返す。
			
			var base64str =  data['httpdata'].toString();
			console.log('from server :' + base64str);
			var a = new Buffer(base64str, 'base64');
			
			c.write(a);
			//c.write("HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nok" );
			dumpResponse(a);
			// c.write(data);
		});

		wsclient.on('httpend', function(data) {
			// HttpProxy先でコネクションが切れたら、こちらもクライアントを切断
			console.log("from server connection close");
			//c.write(httpRes);
			c.end();
		});
		wsclient.on('end', function() {
			console.log('server disconnected');
			c.end();
		});

	});
	
	server.listen(port, function() { // 'listening' listener
		console.log('server bound');
	});
	
	wsclient.on('end', function() {
		console.log('server close');
		server.clode();
	});
	sys.puts('Server listening on port ' + port);
});

function dumpResponse(buf) {
    var tmp = "";
    // 表示できる文字は表示する
    for (var i = 0; i < buf.length ; i++) {
            var c = buf.readUInt8(i);
            if( (c > 31 && c < 127) || c==13 || c==10) {
                    tmp = tmp + String.fromCharCode(c);
            } else {
                    tmp = tmp + c + ":";
            }
    }
    console.log(tmp);
}
