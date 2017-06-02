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
function urlParse(url) {
	return encodeURI(url);
}

var length = result.url.length;

/**
 * 常规抓取
 * @param length
 */
var fetch = function (length) {
	header['Host'] = result.url[length];
	header['Referer']= 'http://' + result.url[length];
	result.url[length] == 'www.sobt5.org' && delete header.Referer;
	console.log(urlParse('http://' + result.url[length]))
	superagent
		.get('http://' + result.url[length])
		.buffer()
		.parse(binaryParser)
		.end(function (err, res) {
			if (res && res.body) {
				var $ = cheerio.load(res.body, {decodeEntities: false});
				var arr = [];
				result.url[length] == 'btkitty.kim' && $('.hotwords a').each(function(index,item) {
					$(item).text() && arr.push([
						'',
						$(item).text()
					])
				});
				result.url[length] == 'www.sobt5.org' && $('.info-box li').each(function(index,item) {
					$(item).find('a').text() && arr.push([
						'',
						$(item).find('a').text()
					])
				});
				sqlAction.insert('INSERT REPLACE INTO hotWords (id,words) values ?',[arr],function() {
				});
				if(length>0) fetch(--length);
			}else {
				console.log('抓取失败')
			}
		});
};

/**
 * 清空表
 */
function emptyTable() {
	sqlAction.insert('truncate table hotWords','',function() {

	});
}



emptyTable();
setTimeout(function() {
	fetch(length-1);
},1000);
//fetchTop();