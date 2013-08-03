'use strict';

var sdk_data = require('sdk/self').data;
var lib_shared = require('./shared');
var lib_ui = require('./ui');
var lib_target = require('./target');
var lib_albumlist = require('./albumlist');
var lib_album = require('./album');
var lib_download = require('./download');
var L = lib_ui.log_for('main');

function handle_panel_request_target() {
	L('handle_panel_request_target');
	var tr = new lib_target.TargetRequest();
	tr.execute(callback_target_request);
}

function callback_target_request(payload) {
	L('callback_target_request');
	emit_panel_response_target(payload);
}

function emit_panel_response_target(payload) {
	L('emit_panel_response_target');
	lib_ui.panel.port.emit(
		'panel/main/response/target',
		payload
	);
}

function handle_panel_request_albums(target) {
	L('handle_panel_request_albums');
	var alr = new lib_albumlist.AlbumlistRequest(target);
	alr.execute(callback_albums_request);
}

function callback_albums_request(payload) {
	L('callback_albums_request');
	emit_panel_response_albums(payload);
}

function emit_panel_response_albums(payload) {
	L('emit_panel_response_albums');
	lib_ui.panel.port.emit(
		'panel/main/response/albums',
		payload
	);
}

function handle_panel_request_albuminfo(album) {
	L('handle_panel_request_albuminfo');
	var ar = new lib_album.AlbumRequest(album);
	ar.execute(callback_albuminfo_request);
}

function callback_albuminfo_request(payload) {
	L('callback_albuminfo_request');
	emit_panel_response_albuminfo(payload);
}

function emit_panel_response_albuminfo(payload) {
	L('emit_panel_response_albuminfo');
	lib_ui.panel.port.emit(
		'panel/main/response/albuminfo',
		payload
	);
}

function handle_panel_request_dereference(medium) {
	L('handle_panel_request_dereference');
	var dr = new lib_album.DereferenceRequest(medium);
	dr.execute(callback_dereference_request);
}

function callback_dereference_request(payload) {
	L('callback_dereference_request');
	emit_panel_response_dereference(payload);
}

function emit_panel_response_dereference(payload) {
	L('emit_panel_response_dereference');
	lib_ui.panel.port.emit(
		'panel/main/response/dereference',
		payload
	);
}

function handle_panel_request_download_album(album) {
	L('handle_panel_request_download_album');
	var dm = new lib_download.DownloadManager();
	dm.add_album(album);
}

lib_ui.panel.port.on(
	'panel/main/request/target',
	handle_panel_request_target
);

lib_ui.panel.port.on(
	'panel/main/request/albums',
	handle_panel_request_albums
);

lib_ui.panel.port.on(
	'panel/main/request/albuminfo',
	handle_panel_request_albuminfo
);

lib_ui.panel.port.on(
	'panel/main/request/dereference',
	handle_panel_request_dereference
);

lib_ui.panel.port.on(
	'panel/main/request/download_album',
	handle_panel_request_download_album
);

L('preferences:', lib_shared.P(lib_shared.prefs));
L('module initialised');
