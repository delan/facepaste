'use strict';

var sdk_data = require('sdk/self').data;
var lib_shared = require('./shared');
var lib_ui = require('./ui');
var lib_target = require('./target');
var lib_albumlist = require('./albumlist');
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

lib_ui.panel.port.on(
	'panel/main/request/target',
	handle_panel_request_target
);

lib_ui.panel.port.on(
	'panel/main/request/albums',
	handle_panel_request_albums
);

// var tabs = require('sdk/tabs');
// var url = require('sdk/url');
// var data = require('sdk/self').data;
// var log = require('./log');
// var L = log.log_for('main');

// function albumlist_handler(A) {
// 	function next_album() {
// 		var a = A[++i];
// 		if (!a)
// 			return L('all ready',
// 				JSON.stringify(A, null, 4));
// 		require('./pvlist').fetch(a.url, function(M) {
// 			a.pvlist = M;
// 			next_album();
// 		});
// 	}
// 	var i = -1;
// 	next_album();
// }

// function get_albumlist_handler() {
// }
// panel.port.on('get_albumlist', get_albumlist_handler);

L('module initialised');
