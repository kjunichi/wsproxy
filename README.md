Wsproxy
----
http://kjunichi.cocolog-nifty.com/misc/2012/04/ipad-wifiiphone.html

iPad Wifi版とiPhone4Sアドホック接続し、iPhone4Sの３G回線を経由してネットにアクセスできるようにします。

#
LAN側(iPad -(http)- > node.js -(websocket)-> iPhone4S -(websocket)-> 3G回線)の設定

# 主要ファイルの説明
## lanstart.rb
iPhone4Sにnode.jsサーバ経由で読み込ませるhtmlの生成を行う。

現在はOSXでのみ動かせる。