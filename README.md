Wsproxy
----
http://kjunichi.cocolog-nifty.com/misc/2012/04/ipad-wifiiphone.html

iPad Wifi版とiPhone4Sアドホック接続し、iPhone4Sの３G回線を経由してネットにアクセスできるようにします。

#システム構成
## LAN側
iPad <-(http)- > PC1[node.js] <-(websocket)-> iPhone4S <-(websocket)-> 3G回線

## WAN側
3G回線<-(websocket)>PC2[node.js]<-(http)->PC2'<-(http)->インターネット

※PC2,PC2'は同一マシンでも可

# 主要ファイルの説明
## index.html
iPhone4Sにnode.jsサーバ経由で読み込ませるhtml

## myproxy4.js
LAN側（iPhone4Sと一緒に持ち歩くnode.jsを動かせる端末）で動かす

iPhone4SからのWebSocketを待受けつつ、HTTP Proxyサーバーとして振る舞い、
リクエストをWebSocket経由でiPhone4Sに転送、またiPhone4SからのWebSocketの
応答をHTTPに変換してHTTPクライアントに返す。

## lanstart.rb
iPhone4Sにnode.jsサーバ経由で読み込ませるhtmlの生成を行う。

現在はOSXでのみ動かせる。

MacのIPアドレスを取得してindex.htmlのLAN側のアドレス欄を編集する。


## ws2http2.js
WAN側で動かすWebSocketを受信してHTTPに変換してWAN側のHTTP Proxyに
転送する。WAN側のHTTP Proxyの応答をWebSocketに変換して要求元のLAN側の
iPhone4Sに返す

## myproxy0.js
WAN側で動かすHTTP Proxy.Squidとかのほうが良いと思う。
