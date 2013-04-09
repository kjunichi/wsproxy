// ws2http.js
// WebSocketで受けた要求をHttpProxyに転送する。
// HttpProxyで受けた応答をWebSocketに転送する。

// iPhone4SからのWebSocketを待ち受けるポート
var WEB_SOCKET_PORT = 8123;

// インターネットにつながっているHTTPプロキシのホスト名
var HTTP_PROXY_HOST = "127.0.0.1";

// インターネットにつながっているHTTPプロキシのポート番号
var HTTP_PROXY_PORT = 8080;

// 例外が発生してもサービスを停止しないようにする
process.on('uncaughtException', function(err) {
	console.log(err.stack);
});

var app = require('http').createServer(handler), io = require('socket.io')
		.listen(app), fs = require('fs');

var net = require('net');

app.listen(WEB_SOCKET_PORT);

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

io.sockets.on('connection', function(socket) {
	var isProxyClose = true;
	// HTTP Proxyサーバへ接続する。
	doProxyProc(socket, isProxyClose);
});

var proxys = {};

function doProxyProc(socket, isProxyClose) {
	console.log('server connected');

	socket.on('wstohttp', function(data) {
		console.log("from client : " + data);
		console.log("proxys at " + data['wid'] + " is " + proxys[data['wid']]);
		if (proxys[data['wid']] == undefined) {
			var proxy = net.createConnection(HTTP_PROXY_PORT, HTTP_PROXY_PORT, function() {
				proxys[data['wid']] = proxy;
				proxy.wid = data['wid'];
				// WebSocketでデータを受けたらHttpProxyに接続する
				proxy.pause();

				// base64デコードしてproxyサーバに送る
				var a = new Buffer(data['httpdata'].toString(), 'base64');
				wid = data['wid'];

				proxy.write(a);
				dumpResponse(a);
				proxy.resume();
			});

			proxy.on('data', function(pdata) {
				// HttpProxyからの応答をWebSocketに転送する。

				proxy.pause();

				// WebSocketでHttpProxyからの応答をBase64エンコードして返す。
				socket.emit('httptows', {
					httpdata : pdata.toString('base64'),
					wid : proxy.wid
				});

				proxy.resume();
			});

			proxy.on('end', function() {
				console.log('server disconnected');
				socket.emit('httpend', {
					wid : proxy.wid
				});
				proxys[proxy.wid] = "";
			});

			proxy.on('close', function() {
				// HttpProxyから切断された場合の処理
				console.log('server close![' + proxy.wid + "]");
				socket.emit('httpend', {
					wid : proxy.wid
				});
				proxys[proxy.wid] = "";
			});

			proxy.on('error', function(err) {
				console.log("proxy[" + proxy.wid + "] error! " + err);
				socket.emit('httpend', {
					wid : proxy.wid
				});
			});
		} else {
			console.log("from client : " + data);
			
			// 既に接続済みのHttpProxyへのSocketを利用する。
			var workProxy = proxys[data['wid']];
			if (workProxy == "") {
				console.log("proxy has been closed.");
				socket.emit('httpend', {
					wid : data['wid']
				});
				return;
			}
			workProxy.pause();
			var a = new Buffer(data['httpdata'].toString(), 'base64');
			workProxy.write(a);
			dumpResponse(a);
			workProxy.resume();
		}

	}); // end socket.on('wstohttp'

	socket.on('httpend', function(data) {
		console.log('client disconnected[' + data['wid'] + "]");
		var p = proxys[data['wid']];
		console.log("P = " + p);
		if (p != "" && p != undefined) {
			p.end();
			proxys[data['wid']] = "";
		}
	});
}

function dumpString(str) {
	var tmp = "";
	// 表示できる文字は表示する
	for ( var i = 0; i < str.length; i++) {
		var c = str.charAt(i);
		if ((c > 31 && c < 127) || c == 13 || c == 10) {
			tmp = tmp + String.fromCharCode(c);
		} else {
			tmp = tmp + c + ":";
		}
	}
	console.log(tmp);
}

function dumpResponse(buf) {
	var tmp = "";
	// 表示できる文字は表示する
	for ( var i = 0; i < buf.length; i++) {
		var c = buf.readUInt8(i);
		if ((c > 31 && c < 127) || c == 13 || c == 10) {
			tmp = tmp + String.fromCharCode(c);
		} else {
			tmp = tmp + c + ":";
		}
	}
	console.log(tmp);
}
