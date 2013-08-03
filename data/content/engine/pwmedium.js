(function() {

'use strict';

function L() {
	self.port.emit('pwmedium/album/request/log', {
		source: 'pwmedium',
		args: [].slice.call(arguments)
	});
}

function handle_album_request_dereference(payload) {
	L('handle_album_request_dereference');
	var Q = $facepaste$shared$.Q;
	payload.indirect = payload.url;
	if (payload.type == 'PHOTO_PAGE') {
		var a = Q('a.fbPhotosPhotoActionsItem[rel=ignore]');
		if (a[0]) {
			payload.url = a[0].href;
			payload.type = 'PHOTO';
		}
	} else if (payload.type == 'VIDEO_PAGE') {
		var e = Q('embed')[0];
		if (e) {
			var fv = e.getAttribute('flashvars');
			var params = fv.match(/(?:^|&)params=([^&]+)(?:&|$)/);
			var json = decodeURIComponent(params);
			var object = JSON.parse(json);
			payload.url = object.video_data.hd_src ||
				object.video_data.sd_src;
			payload.type = 'VIDEO';
		}
	}
	emit_album_response_dereference(payload);
}

function emit_album_response_dereference(payload) {
	L('emit_album_response_dereference');
	L('hint:', payload.indirect, '=>', payload.url);
	self.port.emit(
		'album/pwmedium/response/dereference',
		payload
	);
}

self.port.on(
	'album/pwmedium/request/dereference',
	handle_album_request_dereference
);

L('module initialised');

})();
