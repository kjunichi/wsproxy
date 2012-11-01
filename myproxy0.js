// myporxy0.js

// 例外が発生してもサービスを停止しないようにする
process.on('uncaughtException', function(err) {
	console.log(err.stack);
});

var sys = require('util');
var net = require('net');
var url = require('url');

var server = net.createServer(function(c) {
	// 'connection' listener
	console.log('server connected');
	var socket = "";
	var isClientClosed = false;

	c.on('data', function(data) {
		c.pause();
		//if (socket == "") {
		// ソケットが未作成の場合、HTTP要求とみなし解析する。

		var parseheader = data.toString().split(/\n/);
		if (parseheader[0].match(/^GET/) || parseheader[0].match(/^CONNECT/)
				|| parseheader[0].match(/^POST/)) {
			var hthead = parseheader[0].split(/ /);
			// console.log(hthead[1]);
			var destPort = "";
			var destHost = "";
			if (parseheader[0].match(/^CONNECT/)) {
				// httpsの場合の処理
				// hostname:port
				var parseheader = data.toString().split(/\n/);
				var hthead = parseheader[0].split(/ /);

				var tmp = hthead[1].split(/:/);
				destHost = tmp[0];
				destPort = tmp[1];

			} else {
				// GET,POSTの場合の処理
				destPort = url.parse(hthead[1]).port || 80;
				destHost = url.parse(hthead[1]).host;
			}
			console.log("destPort = " + destPort);
			console.log("destHost = " + destHost);

			console.log("client send : " + parseheader[0].toString());
			//if(socket == "") {
			socket = net.createConnection(destPort, destHost, function() {
				console.log('server connected');

				if (parseheader[0].match(/^CONNECT/)) {
					c.pause();
					//socket.write(data);
					c.write("HTTP/1.0 200 OK\r\nConnection: close\r\n\r\n");
					c.resume();
				} else {
					socket.write(data);
				}

				// c.resume();
			});
			socket.on('data', function(data) {
				// socket.pause();
				if (isClientClosed) {
					socket.end();
					return;
				}
				c.pause();
				socket.pause();
				console.log('server send data');
				c.write(data);
				// socket.resume();
				c.resume();
				socket.resume();
			});

			socket.on('end', function() {
				console.log('server is disconnected');
				c.end();
				socket = "";
			});

			socket.on('close', function() {
				console.log('server has been disconnected');
				c.end();
				socket = "";
			});

			socket.on('error', function(err) {
				console.log("socket error! " + err);
				socket = "";
				c.end();
			});
			//} else {
				// 既に接続済みのソケットに対してのHTTP要求の場合
			//	console.log("socket has made! ");
			//}
		} else {
			if (socket != "") {
				socket.pause();
				c.pause();
				socket.write(data);
				c.resume();
				socket.resume();
			}
		}

		//	} else {
		//		console.log("client send ");
		//	if (socket != "") {
		//		socket.pause();
		//			c.pause();
		//			socket.write(data);
		//			c.resume();
		//			socket.resume();
		//		} else {
		//			console.log("Oops! no socket.");
		//			dumpResponse(data);
		//			c.end();
		//		}
		// socket.write(data);

		//	}

	});
	c.on('end', function() {
		console.log('client disconnected');
		if (socket != "") {
			socket.end();
			socket = "";
		}
		isClientClosed = true;
	});

	c.on('close', function() {
		console.log('client is closed');
		if (socket != "") {
			socket.end();
			socket = "";
		}
		isClientClosed = true;
	});

	c.on('error', function(err) {
		console.log('client error! ' + err);
		if (socket != "") {
			socket.end();
			socket = "";
		}
		isClientClosed = true;
	});
});

// https接続
function doConnect(client, data) {
	var parseheader = data.toString().split(/\n/);
	var hthead = parseheader[0].split(/ /);

	var tmp = hthead[1].split(/:/);
	var destHost = tmp[0];
	var destPort = tmp[1];
	var isClientClosed = false;

	console.log("destPort = " + destPort);
	console.log("destHost = " + destHost);

	var socket = net.createConnection(destPort, destHost, function() {
		console.log('server connected');
		client.write("HTTP/1.0 200 OK\r\nConnection: close\r\n\r\n");
		client.resume();
	});
	client.on('data', function(dt) {
		client.pause();
		socket.pause();
		console.log('client send');
		socket.write(dt);
		// client.resume();
		socket.resume();
		client.resume();
	});
	client.on('err', function(err) {
		console.log("client error! " + err);
		socket.end();
		isClientClosed = true;
	});
	client.on('close', function() {
		console.log("client has been closed.");
		socket.end();
		isClientClosed = true;
	});
	client.on('end', function() {
		console.log("client is closed.");
		socket.end();
		isClientClosed = true;
	});
	socket.on('data', function(dt) {
		socket.pause();

		if (isClientClosed) {
			console.log("client socket has been closed.");
			socket.end();
		}
		client.pause();
		// socket.pause();
		console.log('sever send');
		client.write(dt);
		client.resume();
		socket.resume();
	});
	socket.on('end', function() {
		client.end();
		console.log('sever close1');
	});
	socket.on('close', function() {
		client.end();
		console.log('sever close1');
	});
	socket.on('error', function(err) {
		console("socket error! " + err);
		client.end();
	});
	// socket.write(data);
	// client.pipe(socket);
	// socket.pipe(client);

}
var port = process.env.PORT || 8080;
server.listen(port, function() { // 'listening' listener
	console.log('server bound');
});

sys.puts('Server listening on port ' + port);

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