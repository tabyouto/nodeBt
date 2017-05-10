'use strict';
var express = require('express');
var router = express.Router();

const originUrl = 'https://www.btyisou.top';

let superagent = require('superagent'), //
	cheerio = require('cheerio'),    //转成jquery
	url = require('url'),
	iconv = require("iconv-lite"),  //编码转换
// async       = require('async'), //处理异步回调
// querystring = require("querystring"),
	sqlAction = require("../common/mysql.js"); //mysql 配置文件
// info        = require('./_base.js'), //基本配置信息
// event       = require('../event/_event'),
// tools       = require('../common/util');

let info = {
	headers: {
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
		'Accept-Encoding': 'gzip, deflate, sdch',
		'Accept-Language': 'zh-CN,zh;q=0.8',
		'Host': 'www.sobt5.org',
		'Referer': '',
		'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36'
	}
};


var async = require('async');

function urlParse(url) {
	return encodeURI(url);
}
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

/**
 * 处理抓取的 html
 * @param data
 * @returns {void|*|String}
 */
function parseHtml(data) {
	var text = iconv.decode(data, 'GBK'); //编码成正确的gbk
	return cheerio.load(text, {decodeEntities: false});  //默认是转实体的
}


/* GET home page. */
router.get('/', function (req, res, next) {
	sqlAction.query("select words from hotWords", '', function (err, vals, fields) {
		res.render('index', {
			title: '最好的BT搜索,海量种子搜索网站-XBT',
			hot: vals
		});
	});
});

/**
 * 初始搜索
 */
router.get('/s/:p', function (req, ress, next) {
	let url = 'http://www.sobt5.org/q/' + req.params.p + '.html';
	info.headers.Referer = urlParse(url);
	superagent
		.get(info.headers.Referer)
		.timeout({
			response: 7000,  // Wait 5 seconds for the server to start sending,
		})
		.buffer()
		.parse(binaryParser)
		.end(function (err, res) {
			if (res && res.body) {
				var $ = cheerio.load(res.body, {decodeEntities: false});
				$('script').remove();
				var tmp = '';
				$('.pagination li').each(function (index, item) {
					tmp = $(item).find('a').attr('href');
					if (tmp) {
						tmp = tmp.substring(tmp.lastIndexOf('/'), tmp.length);
						$(item).find('a').attr('href', '/s' + tmp);
					}

				});
				ress.render('search', {
					title: req.params.p.substring(0, req.params.p.indexOf('.')),
					url: originUrl,
					total: $('.search-list').html()
				});
			}
		})
});


/**
 * 关联搜索 页面
 */
router.get('/q/:p', function (req, ress, next) {
	let url = 'http://www.sobt5.org/q/' + req.params.p + '.html';
	info.headers.Referer = urlParse(url);
	superagent
		.get(info.headers.Referer)
		.timeout({
			response: 7000,  // Wait 5 seconds for the server to start sending,
		})
		.buffer()
		.parse(binaryParser)
		.end(function (err, res) {
			if (res && res.body) {
				var $ = cheerio.load(res.body, {decodeEntities: false});
				$('script').remove();
				var tmp = '';
				$('.pagination li').each(function (index, item) {
					tmp = $(item).find('a').attr('href');
					if (tmp) {
						tmp = tmp.substring(tmp.lastIndexOf('/'), tmp.length);
						$(item).find('a').attr('href', '/s' + tmp);
					}

				});
				ress.render('search', {
					title: req.params.p.substring(0, req.params.p.indexOf('.')),
					url: originUrl,
					total: $('.search-list').html()
				});
			}
		})
});


/**
 * detail 页面
 */
router.get('/torrent/:p', function (req, ress, next) {
	let url = 'http://www.sobt5.org/q/' + req.params.p;
	superagent
		.get(urlParse(url))
		.buffer()
		.parse(binaryParser)
		.end(function (err, res) {
			if (res && res.body) {
				var $ = cheerio.load(res.body, {decodeEntities: false});
				var reg = /\'.*?\'/ig;
				var res = reg.exec($('script').text())[0];
				res = res.substring(1, res.length - 1); //查询热度的编号
				$('script').remove();
				$('.link_op').remove();
				var tmp = '';
				$('.fileDetail p').each(function (index, item) {
					$(item).find('a').each(function (i, dom) {
						tmp = $(dom).text();
						if (tmp == '下载种子' || tmp == '复制链接' || tmp == '加入收藏' || tmp == '在线云播') {
							$(dom).remove();
						}
					})
				});
				ress.render('detail', {
					title: $('.res-title').text(),
					id: res,
					url: originUrl,
					total: $('#content').html()
				});
			}
		})
});






router.get('/top', function (req, ress, next) {
	var topUrl = 'http://www.cilisoba.net/top/';
	header.Host = 'www.cilisoba.net';
	header.Referer = 'http://www.cilisoba.net';
	superagent
		.get(topUrl)
		//.set(header)
		.timeout({
			response: 7000,  // Wait 5 seconds for the server to start sending,
		})
		.buffer()
		.parse(binaryParser)
		.end(function (err, res) {
			if (res && res.body) {
				var $ = cheerio.load(res.body, {decodeEntities: false});
				//$('ol li').each(function(index,item) {
				//	console.log($(item).html());
				//})
				ress.render('top', {
					list: $('ol li')
				});
			}else {
				console.log('error')
			}
		});
});




module.exports = router;
