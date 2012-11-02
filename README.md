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
## lanstart.rb
iPhone4Sにnode.jsサーバ経由で読み込ませるhtmlの生成を行う。

現在はOSXでのみ動かせる。