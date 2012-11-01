#!/usr/bin/ruby
# -*- coding: utf-8 -*-

#LAN側のHTTP Proxyのポート番号
lanHttpProxyPort="8000"

#IPアドレスを取得する
result=`ipconfig getifaddr en0`

#取得したIPアドレスに置き換えてindex.htmlを生成する。
open("index.html_tmp","w"){ |o|
	open("index.html.template").each{ |line|
			o.puts line.gsub("<<LAN_IP_ADDRESS>>",result.chomp)
	}
}

open("index.html","w"){ |o|
	open("index.html_tmp").each{ |line|
			o.puts line.gsub("<<LAN_PORT>>",lanHttpProxyPort)
	}
}

#nodeを起動
system 'node lanHttpProxy.js &'

puts "iPhoneで以下のURLにアクセスしてください。"
puts "http://" + result.chomp + ":" + lanHttpProxyPort

