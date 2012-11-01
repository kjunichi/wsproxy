// 例外が発生してもサービスを停止しないようにする 
process.on('uncaughtException', function(err) {
	console.log(err.stack);
});
var sys = require('util'), url = require('url'), http = require('http');
var port = 8080;

http.createServer(function(req, res) {
	var pathname = url.parse(req.url).pathname;
	console.log("Request for " + req.url + " received.");
	var postData = "";
	if (req.method == "CONNECT") {
		// httpsの場合
		doConnect2(req, res);
		return;
	}

	req.setEncoding("utf8");
	req.addListener("data", function(postDataChunk) {
		postData += postDataChunk;
		// console.log("Received POST data chunk '"+
		// postDataChunk + "'.");
	});
	req.addListener("end", function() {
		// リクエストを受けきったら以下の処理を実行する。
		if (req.method == "POST") {
			var post_req = http.request({
				host : req.headers.host,
				port : url.parse(req.url).port || 80,
				method : 'POST',
				path : req.url,
				headers : req.headers
			}, function(response) {
				response.setEncoding('utf8');
				response.on('data', function(chunk) {
					// console.log('Response: ' + chunk);
					res.write(chunk);
				});
				response.on('end', function() {
					res.end();
				});
			});
			post_req.write(postData);
			post_req.end();
		} else {
			http.get({
				host : req.headers.host,
				port : url.parse(req.url).port || 80,
				method : 'GET',
				path : req.url,
				headers : req.headers
			}, function(response) {
				res.writeHead(response.statusCode, response.headers);
				response.on('data', function(chunk) {
					res.write(chunk);
				});
				response.on('end', function() {
					res.end();
				});
			});
		}
	});
}).listen(port);

// httpsの処理
function doConnect(req, res) {
	var host = url.parse(req.url).host;
	var port = url.parse(req.url).port;
	console.log('doConnect (host,port)= ' + host + ", " + port);
	var conn_req = http.request({
		host : req.headers.host,
		port : url.parse(req.url).port || 80,
		method : 'CONNECT',
		path : req.url,
		headers : req.headers
	}, function(response) {
		// response.setEncoding('utf8');
		// response.on('data', function (chunk) { res.write(chunk); });
		// response.on('end', function(){ res.end(); });
		// InetSocketAddress inetAddress = new InetSocketAddress (host,
		// Integer.parseInt(port));
		// Socket socket = new
		// Socket(inetAddress.getAddress(),inetAddress.getPort());

		var socket = new Socket();
		socket.connect(port, host, function() {
			req.addListener("data", function(httpsDataChunk) {
				console.log('req data: ');
				socket.write(httpsDataChunk);
				socket.addListner("data", function(httpsDataChunk) {
					console.log('socket data: ');
					res.write(httpsDataChunk);
				});
				socket.addListner("end", function() {
					console.log('socket end: ');
					res.end();
				});
			});
			req.addListner("end", function() {
				console.log('req end: ');
				socket.end();
			});
		});
	});
	conn_req.end();
}
sys.puts('Server listening on port ' + port);