'use strict';

var fs = require('fs');

let superagent = require('superagent'), //
	cheerio = require('cheerio'),    //转成jquery
	iconv = require("iconv-lite");

let sqlAction = require("./common/mysql.js");

var header = {
	'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
	'Accept-Encoding': 'gzip, deflate, sdch',
	'Accept-Language': 'zh-CN,zh;q=0.8',
	'Host': 'www.sobt5.org',
	'Referer': '',
	'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36'
};

var file = "url.json";
var result = JSON.parse(fs.readFileSync(file));


function binaryParser(res, callback) { //转换成buffer
	res.setEncoding('binary');
	res.data = '';
	res.on('data', function (chunk) {
		res.data += chunk;
	});
	res.on('end', function () {
		callback(null, new Buffer(res.data, 'binary'));
	});
}


var length = result.url.length;

var fetch = function (length) {
	header.Host = result.url[length];
	superagent
		.get('http://'+ result.url[length])
		.set(header)
		.timeout({
			response: 7000,  // Wait 5 seconds for the server to start sending,
		})
		.buffer()
		.parse(binaryParser)
		.end(function (err, res) {
			if (res && res.body) {
				var $ = cheerio.load(res.body, {decodeEntities: false});
				var arr = [];
				$('.hotwords a').each(function(index,item) {
					console.log('   ',$(item).text())
					arr.push([
						'',
						$(item).text()
					])
				});
				sqlAction.insert('INSERT REPLACE INTO hotWords (id,words) values ?',[arr],function() {

				});
			}
		});
	if(length!=0) fetch(--length);
};

fetch(length-1);