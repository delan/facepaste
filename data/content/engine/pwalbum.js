(function() {

'use strict';

function L() {
	self.port.emit('pwalbum/album/request/log', {
		source: 'pwalbum',
		args: [].slice.call(arguments)
	});
}

function handle_album_request_albuminfo(payload) {
	L('handle_album_request_albuminfo');
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
	payload.media = M;
	emit_album_response_albuminfo(payload);
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
