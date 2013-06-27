(function() {

var url = require('sdk/url');
var data = require('sdk/self').data;

var base = 'https://www.facebook.com/';

function is_eligible_page(url_string, callback) {
	var u = url.URL(url_string);
	var result = {
		eligible: false,
		kind: undefined,
		wordifier: undefined,
		albumlist: undefined
	};
	var m;
	if (m = u.path.match(/^\/profile\.php\?(.*&)?id=(\d+)(&|$)/)) {
		result.eligible = true;
		result.kind = 'PERSON';
		result.wordifier = false;
		result.albumlist = base + 'profile.php?id=' + m[2] +
			'&sk=photos_albums';
		callback(result);
	} else if (m = u.path.match(/^\/pages\/([A-Za-z0-9-]+)\/(\d+)(\?|$)/)) {
		result.eligible = true;
		result.kind = 'EGAP';
		result.wordifier = false;
		result.albumlist = base + 'pages/x/' + m[2] +
			'?sk=photos_albums';
		callback(result);
	} else if (m = u.path.match(/^\/groups\/(\d+)\/(\?|$)/)) {
		result.eligible = true;
		result.kind = 'GROUP';
		result.wordifier = false;
		result.albumlist = base + 'groups/' + m[1] +
			'/photos/';
		callback(result);
	} else if (m = u.path.match(/^\/groups\/([A-Za-z0-9.]{5,})\/(\?|$)/)) {
		result.eligible = true;
		result.kind = 'GROUP';
		result.wordifier = true;
		result.albumlist = base + 'groups/' + m[1] +
			'/photos/';
		callback(result);
	} else if (m = u.path.match(/^\/([A-Za-z0-9.]{5,})(\?|$)/)) {
		var p = require('sdk/page-worker').Page({
			contentURL: url_string,
			contentScriptWhen: 'ready',
			contentScriptFile:
			data.url('content/engine/disambiguate_eligibility.js')
		});
		p.port.on('eligibility', function(result) {
			callback(result);
			p.destroy();
		});
	} else {
		callback(result);
	}
}

exports.is_eligible_page = is_eligible_page;

})();
