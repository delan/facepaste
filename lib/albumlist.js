var data = require('sdk/self').data;
var pw = require('sdk/page-worker');
var log = require('./log');

function get_url(e) {
	var b = 'https://www.facebook.com/';
	var r;
	switch (e.kind) {
	case 'PERSON':
		if (e.wordifier)
			r = b + e.wordifier + '/photos_albums';
		else
			r = b + 'profile.php?sk=photos_albums&id=' + e.numifier;
		break;
	case 'EGAP':
		if (e.wordifier)
			r = b + e.wordifier + '/photos_albums';
		else
			r = b + 'pages/x/' + e.numifier + '?sk=photos_albums';
		break;
	case 'GROUP':
		r = b + 'groups/' + (e.wordifier || e.numifier) + '/photos/';
		break;
	}
	return r;
}

exports.fetch = function(eligibility, callback) {
	log.log('albumlist', 'fetch: starting')
	var url = get_url(eligibility);
	var w = pw.Page({
		contentURL: url,
		contentScriptFile: data.url('content/engine/alworker.js')
	});
	w.port.emit('input', eligibility);
	w.port.on('albumlist', function(albums) {
		w.destroy();
		log.log('albumlist', 'fetch: found', albums.length, 'albums');
		callback(albums);
	});
};
