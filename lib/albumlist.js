'use strict';

var sdk_data = require('sdk/self').data;
var sdk_pw = require('sdk/page-worker');
var lib_shared = require('./shared');
var lib_ui = require('./ui');
var L = lib_ui.log_for('albumlist');

function get_albumlist_url(target) {
	var t = target;
	var b = lib_shared.BASE_URL;
	var r;
	switch (t.kind) {
	case 'PERSON':
		if (t.wordifier)
			r = b + t.wordifier + '/photos_albums';
		else
			r = b + 'profile.php?sk=photos_albums&id=' + t.numifier;
		break;
	case 'EGAP':
		if (t.wordifier)
			r = b + t.wordifier + '/photos_albums';
		else
			r = b + 'pages/x/' + t.numifier + '?sk=photos_albums';
		break;
	case 'GROUP':
		r = b + 'groups/' + (t.wordifier || t.numifier) + '/photos/';
		break;
	}
	return r;
}

function emit_pwalbumlist_request_albums() {
	L('emit_pwalbumlist_request_albums');
	this.worker.port.emit(
		'albumlist/pwalbumlist/request/albums',
		this.target
	);
}

function handle_pwalbumlist_response_albums(payload) {
	L('handle_pwalbumlist_response_albums');
	this.worker.destroy();
	this.callback(payload);
}

function handle_pwalbumlist_request_log(payload) {
	lib_ui.log_handler(payload);
}

function AlbumlistRequest(target) {
	this.target = target;
	this.url = get_albumlist_url(target);
	this.worker = sdk_pw.Page({
		contentURL: this.url,
		contentScriptFile: [
			sdk_data.url('../lib/shared.js'),
			sdk_data.url('content/engine/pwalbumlist.js')
		]
	});
	this.worker.port.on(
		'pwalbumlist/albumlist/request/log',
		handle_pwalbumlist_request_log
	);
	this.worker.port.on(
		'albumlist/pwalbumlist/response/albums',
		handle_pwalbumlist_response_albums.bind(this)
	);
};

AlbumlistRequest.prototype.execute = function(callback) {
	this.callback = callback;
	emit_pwalbumlist_request_albums.call(this);
};

exports.AlbumlistRequest = AlbumlistRequest;

L('module initialised');
