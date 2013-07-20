// myproxy4.js
// HttpProxyとして要求を受けて、WebSocketにして要求を転送する。
// WebSocketから応答を受けて、HttpProxyに転送する。

var WEB_SOCKET_PORT = 8001;
var HTTP_PROXY_PORT = 8081;

// 例外が発生してもサービスを停止しないようにする
process.on('uncaughtException', function(err) {
	console.log(err.stack);
});

var app = require('http').createServer(handler), io = require('socket.io')
		.listen(app), fs = require('fs'),uuid=require('node-uuid');

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

var myWsClient = {};
var count = 0;
var webClients = {};
var httpProxyServer;

io.sockets.on('connection', function(wsclient) {
	myWsClient = wsclient;
	console.log("HTTP Proxy start");
if(httpProxyServer) {
 // close
	httpProxyServer.close();
}
	httpProxyServer = doProxy(wsclient);
	wsclient.on('end', function() {
		console.log("HTTP Proxy end");
		httpProxyServer.close();
	});
});

function doProxy(wsclient) {
	// HttpProxyを開始する。

	var sys = require('util');
	var net = require('net');

	var server = net.createServer(function(webBrowser) {
		count++;
		// 接続してきたブラウザのソケットを保持する。
		var wid = uuid.v4();
		webClients[wid] = webBrowser;
		webBrowser.wid = wid;

		console.log('web client connected [' + count + "]");

		// クライアントからデータを受けた場合
		webBrowser.on('data', function(data) {
			webBrowser.pause();
			var parseheader = data.toString().split(/\n/);
			if (parseheader[0].match(/^GET/)
					|| parseheader[0].match(/^CONNECT/)
					|| parseheader[0].match(/^POST/)) {
				console.log("client send : " + parseheader[0].toString());
			} else {
				console.log("client send ");
			}

			// Base64化してWS->HttpProxyへ送る
			//console.log("to ws : " + data.toString('base64'));
			wsclient.emit('httptows', {
				httpdata : data.toString('base64'),
				wid : webBrowser.wid
			});
			webBrowser.resume();
		});

		webBrowser.on('end', function() {
			// ブラウザの接続が切断された場合の処理
			console.log('client disconnected[' + webBrowser.wid + ']');
			wsclient.emit('httpend', {
				wid : webBrowser.wid
			});
			webClients[webBrowser.wid] = "";
		});

		webBrowser.on('close',
				function() {
					// ブラウザの接続が切断された場合の処理
					console.log('client connection is closed.['
							+ webBrowser.wid + ']');
					webClients[webBrowser.wid] = "";

					wsclient.emit('httpend', {
						wid : webBrowser.wid
					});
				});

		webBrowser.on('error', function(err) {
			// ブラウザの接続が切断された場合の処理
			console.log('client err[' + webBrowser.wid + '].' + err);
			webClients[webBrowser.wid] = "";

			wsclient.emit('httpend', {
				wid : webBrowser.wid
			});
		});

	}); // server

	server.listen(HTTP_PROXY_PORT, function() { //'listening' listener
		console.log('server bound');
	});

	wsclient.on('wstohttp', function(data) {
		// WebSocketからの応答をブラウザに返す。
		if (webClients[data['wid']] == "") {
			console.log('web client connection has been closed.');
			wsclient.emit('httpend', {
				wid : data['wid']
			});
			return;
		}
		// WebSocket経由で結果受取、Base64デコードしてブラウザに返す。
		console.log('server send data : [' + data['wid'] + "]");
		var a = new Buffer(data['httpdata'].toString(), 'base64');
		var clientSocket = webClients[data['wid']];
		clientSocket.pause();
		clientSocket.write(a);
		//dumpResponse(a);
		clientSocket.resume();
	});

	wsclient.on('httpend', function(data) {
		console.log("server is closed.[" + data['wid'] + "]");
		// HttpProxy先でコネクションが切れたら、こちらもクライアントを切断
		var clientSocket = webClients[data['wid']];
		console.log("clientSocket = "+clientSocket);
		if (clientSocket == "") {
			return;
		}
		clientSocket.end();
		webClients[data['wid']] = "";
	});

	wsclient.on('end', function() {
		console.log('server disconnected');
		
		//var clientSocket = webClients[data['wid']];
		//clientSocket.end();
	});

	sys.puts('Server listening on port ' + HTTP_PROXY_PORT);
	return server;
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
