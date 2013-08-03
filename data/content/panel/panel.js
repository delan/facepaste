'use strict';

function L() {
	self.port.emit('panel/ui/request/log', {
		source: 'panel',
		args: [].slice.call(arguments)
	});
}

function handle_ui_request_display_log(payload) {
	lumber.log.apply(null, payload);
}

function emit_main_request_target() {
	L('emit_main_request_target');
	self.port.emit('panel/main/request/target');
}

function handle_main_response_target(payload) {
	L('handle_main_response_target');
	if (payload.eligible)
		emit_main_request_albums(payload);
}

function emit_main_request_albums(payload) {
	L('emit_main_request_albums');
	self.port.emit(
		'panel/main/request/albums',
		payload
	);
}

function handle_main_response_albums(payload) {
	L('handle_main_response_albums');
	// TODO: replace with real implementation instead of automatically
	// getting info about the first album
	emit_main_request_albuminfo(payload[0]);
}

function emit_main_request_albuminfo(payload) {
	L('emit_main_request_albuminfo');
	self.port.emit(
		'panel/main/request/albuminfo',
		payload
	);
}

function handle_main_response_albuminfo(payload) {
	L('handle_main_response_albuminfo');
	// TODO: real implementation please
	for (var i = 0, j = 5; j && i < payload.media.length; i++)
		if (
			payload.media[i].type == 'VIDEO_PAGE' ||
			payload.media[i].type == 'PHOTO_PAGE'
		)
			j--,emit_main_request_dereference(payload.media[i]);
}

function emit_main_request_dereference(payload) {
	L('emit_main_request_dereference');
	self.port.emit(
		'panel/main/request/dereference',
		payload
	);
}

function handle_main_response_dereference(payload) {
	L('handle_main_response_dereference');
	// TODO: real implementation please
}

var lumber = new Lumber('#log');

self.port.on(
	'ui/panel/request/display_log',
	handle_ui_request_display_log
);

self.port.on(
	'panel/main/response/target',
	handle_main_response_target
);

self.port.on(
	'panel/main/response/albums',
	handle_main_response_albums
);

self.port.on(
	'panel/main/response/albuminfo',
	handle_main_response_albuminfo
);

$('#log').click(function() {
	emit_main_request_target();
});

L('module initialised');
