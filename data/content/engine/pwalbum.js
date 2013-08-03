(function() {

'use strict';

function L() {
	self.port.emit('pwalbum/album/request/log', {
		source: 'pwalbum',
		args: [].slice.call(arguments)
	});
}

function begin_scrolling(callback) {
	L('begin_scrolling');
	var scroll_attempts = 0, scroll_events = 0;
	window.addEventListener('scroll', function() {
		L('begin_scrolling: scroll event');
		scroll_events++;
	}, false);
	var timer = window.setInterval(function() {
		L('begin_scrolling: scroll attempt');
		scroll_attempts++;
		window.scrollBy(0, 1000);
		if (scroll_attempts > scroll_events + 50) {
			window.clearInterval(timer);
			if (callback)
				callback();
		}
	}, 100);
}

function callback_begin_scrolling(payload) {
	L('callback_begin_scrolling');
	parse_album_index(payload);
}

function parse_album_index(album) {
	L('parse_album_index');
	var Q = $facepaste$shared$.Q;
	var M = [];
	// Photos
	Q('a.uiMediaThumb:not(.uiMediaThumbAlb):not(.albumThumbLink)',
		function(a) {
		var src = a.href.match(/(?:\?|&)src=([^&]+)(?:&|$)/);
		if (src)
			M.push({
				type: 'PHOTO',
				url: decodeURIComponent(src[1])
			});
		else
			M.push({
				type: 'PHOTO_PAGE',
				url: a.href
			});
	});
	// Video pages
	Q('a.uiVideoLink', function(a) {
		M.push({
			type: 'VIDEO_PAGE',
			url: a.href
		});
	});
	album.media = M;
	emit_album_response_albuminfo(album);
}

function handle_album_request_albuminfo(payload) {
	L('handle_album_request_albuminfo');
	begin_scrolling(callback_begin_scrolling.bind(null, payload));
}

function emit_album_response_albuminfo(album) {
	L('emit_album_response_albuminfo');
	L('hint: found', album.media.length, 'photos and/or videos');
	self.port.emit(
		'album/pwalbum/response/albuminfo',
		album
	);
}

self.port.on(
	'album/pwalbum/request/albuminfo',
	handle_album_request_albuminfo
);

L('module initialised');

})();
