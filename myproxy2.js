// 例外が発生してもサービスを停止しないようにする
process.on('uncaughtException', function(err){ console.log(err.stack); });

var port = 8080;
var sys = require('util');
var net = require('net');

var server = net.createServer(function(c) { //'connection' listener
  console.log('server connected');
  
  var client_req = "";
  c.pause();
  var socket = net.createConnection(8080,'10.1.24.16',function(){
        console.log('server connected');
        c.resume();
        c.on('data', function(data) {
                var parseheader = data.toString().split(/\n/);
                if(parseheader[0].match(/^GET/) ||
                 parseheader[0].match(/^CONNECT/) ||
                 parseheader[0].match(/^POST/)) {
                        console.log("client send : " + parseheader[0].toString());
                 } else {
                        console.log("client send ");
                }
                client_req = client_req + data;
                socket.write(data);
        } );
        c.on('end', function() {
        console.log('client disconnected');
        //socket.end();
        });
  
        //console.log(c);
  
  });
  socket.on('data', function(data) {
        console.log('server send data');
        c.write(data);
        //socket.end();
  });
  socket.on('end', function() {
        console.log('server disconnected');
        c.end();
  });
  
  
});
server.listen(port, function() { //'listening' listener
  console.log('server bound');
});

sys.puts('Server listening on port ' + port);
