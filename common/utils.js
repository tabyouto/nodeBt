'use strict';
var tools = {
	isEmptyObject: function (e) {
		var t;
		for (t in e)
			return !1;
		return !0
	}
}
module.exports = tools;