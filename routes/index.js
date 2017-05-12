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
	sqlAction = require("../common/mysql.js"), //mysql 配置文件
// info        = require('./_base.js'), //基本配置信息
// event       = require('../event/_event'),
	tools = require('../common/utils');

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
				console.log($.html());
				if($('.alert-danger').html()) { //关键词过短
					ress.render('search', {
						title: '关键词过短',
						url: originUrl,
						total: '关键词过短，请重试'
					});
				}else {
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
			}
		})
});


/**
 * 关联搜索 页面
 */
router.get('/q/:p', function (req, ress, next) {
	let url = 'http://www.sobt5.org/q/' + req.params.p;
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
	let url = 'http://www.sobt5.org/torrent/' + req.params.p;
	info.headers.Referer = urlParse(url);
	superagent
		.get(urlParse(url))
		.set(info.headers)
		.buffer()
		.parse(binaryParser)
		.end(function (err, res) {
			if (res && res.body) {
				var $ = cheerio.load(res.body, {decodeEntities: false});
				console.log($.html())
				var reg = /\'.*?\'/ig;
				var res = reg.exec($('script').text()) && reg.exec($('script').text())[0];
				res = res ? res.substring(1, res.length - 1) : null; //查询热度的编号
				$('script').remove();
				$('.link_op').remove();
				$('.search-tips').remove();
				$('.search-statu').remove();
				$('.search-list div').removeAttr('style');
				$('style').remove();
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

/**
 * 热度page
 */
router.get('/top', function (req, ress, next) {
	var topUrl = 'http://www.cilisoba.net/top';
	info.headers.Host = 'www.cilisoba.net';
	delete info.headers.Referer;
	superagent
		.get(urlParse(topUrl))
		.set(info.headers)
		.buffer()
		.parse(binaryParser)
		.end(function (err, res) {
			if (res && res.body) {
				var $ = cheerio.load(res.body, {decodeEntities: false});
				var _firstArr = [];
				var _secondArr = [];
				$('ol li').each(function (index, item) {
					console.log(index);
					index < 50 ? _firstArr.push($(item).html()) : _secondArr.push($(item).html());
				})
				ress.render('top', {
					keyWords: _firstArr,
					hotSearch: _secondArr,
					//test: $('.col-md-4 ol').html(),
					url: originUrl,
					title: 'top key'
				});
			} else {
				console.log('获取cilisoba top 失败')
			}
		});
});

/**
 * 热度list
 */
router.get('/search/:key', function (req, ress, next) {
	var searchUrl = 'http://www.cilisoba.net/search/';
	if (!tools.isEmptyObject(req.query)) {
		var _query = '';
		for (var i in req.query) {
			_query += i + '=' + req.query[i] + '&';
		}
		_query = '/?' + _query.substring(0, _query.length - 1);
	}
	var getUrl = searchUrl + req.params.key;
	_query && (getUrl = getUrl + _query);
	superagent
		.get(urlParse(getUrl))
		.set(info.headers)
		.buffer()
		.parse(binaryParser)
		.end(function (err, res) {
			if (res && res.body) {
				var $ = cheerio.load(res.body, {decodeEntities: false});
				ress.render('top-search', {
					title: req.params.key,
					url: originUrl,
					static: $('h4').text(),
					total: $('.table').html(),
					pagination: $('.pagination').html()
				});
			} else {
				console.log('列表跳转失败')
			}
		});
});
/**
 * 热度detail
 */
router.get('/h/:key', function (req, ress, next) {
	var searchUrl = 'http://www.cilisoba.net/h/';

	var getUrl = searchUrl + req.params.key;
	superagent
		.get(urlParse(getUrl))
		.buffer()
		.parse(binaryParser)
		.end(function (err, res) {
			if (res && res.body) {
				var $ = cheerio.load(res.body, {decodeEntities: false});
				var tmp = $.html();
				tmp = tmp.match(/(\$\.get\()(.*?)\)/ig);
				tmp = tmp[0].split('=')[2];
				tmp = tmp.substring(0, tmp.length - 2); //获得hashId
				$('.magnet-play').remove();
				$('.x-find-torrent').remove();

				getTorrent(tmp, function (data) {
					var info = data.result[0];
					console.log(data);


					var link1 = 'magnet:' + '?xt=urn' + ':btih:' + info.info_hash;
					var link2 = link1 + '&dn=' + encodeURIComponent(info.name);
					var link3 = 'http://pan.bai' + 'du.com/disk/home?ssbc_magnet=' + info.info_hash;
					var link4 = 'http://www.hao' + 'sou.com/s?q=' + encodeURIComponent(info.name) + '&amp;src=ssbc&amp;ie=utf-8';
					$('.magnet-link,.magnet-download').attr('href', link2);
					$('.magnet-link').html(link1);
					//$('.x-play').attr('href', link3);
					//$('.x-play').attr('data-url', link3);
					//$('.x-find-torrent').attr('href', link4);
					$('.tr-magnet-link').removeClass('hide');
					//$('.magnet-play').attr('href', 'http://lixianbaobao.com/');


					var _tmp = $('body>.container').html();
					_tmp = _tmp.replace(/cilibaba/gi, 'btyisou');


					ress.render('top-detail', {
						title: req.params.key,
						url: originUrl,
						total: _tmp,
					});
				})

			} else {
				console.log('error')
			}
		});
});


function getTorrent(id, callback) {
	var getTorrent = 'http://www.cilisoba.net/api/json_info?hashes=' + id;
	superagent
		.get(urlParse(getTorrent))
		.buffer()
		.parse(binaryParser)
		.end(function (err, res) {
			callback && callback(JSON.parse(res.body));
		});
}


module.exports = router;
