'use strict';

var sdk_data = require('sdk/self').data;
var sdk_pw = require('sdk/page-worker');
var lib_shared = require('./shared');
var lib_ui = require('./ui');
var L = lib_ui.log_for('album');

function emit_pwalbum_request_albuminfo() {
	L('emit_pwalbum_request_albuminfo');
	this.worker.port.emit(
		'album/pwalbum/request/albuminfo',
		this.album
	);
}

function handle_pwalbum_response_albuminfo(payload) {
	L('handle_pwalbum_response_albuminfo');
	this.worker.destroy();
	this.callback(payload);
}

function handle_pwalbum_request_log(payload) {
	lib_ui.log_handler(payload);
}

function emit_pwmedium_request_dereference() {
	L('emit_pwmedium_request_dereference');
	this.worker.port.emit(
		'album/pwmedium/request/dereference',
		this.medium
	);
}

function handle_pwmedium_response_dereference(payload) {
	L('handle_pwmedium_response_dereference');
	this.worker.destroy();
	this.callback(payload);
}

function handle_pwmedium_request_log(payload) {
	lib_ui.log_handler(payload);
}

function AlbumRequest(album) {
	this.album = album;
	this.worker = sdk_pw.Page({
		contentURL: album.url,
		contentScriptFile: [
			sdk_data.url('../lib/shared.js'),
			sdk_data.url('content/engine/pwalbum.js')
		]
	});
	this.worker.port.on(
		'pwalbum/album/request/log',
		handle_pwalbum_request_log
	);
	this.worker.port.on(
		'album/pwalbum/response/albuminfo',
		handle_pwalbum_response_albuminfo.bind(this)
	);
};

AlbumRequest.prototype.execute = function(callback) {
	this.callback = callback;
	emit_pwalbum_request_albuminfo.call(this);
};

AlbumRequest.prototype.cancel = function() {
	delete this.callback;
	this.worker.destroy();
};

function DereferenceRequest(medium) {
	this.medium = medium;
	this.worker = sdk_pw.Page({
		contentURL: medium.url,
		contentScriptFile: [
			sdk_data.url('../lib/shared.js'),
			sdk_data.url('content/engine/pwmedium.js')
		]
	});
	this.worker.port.on(
		'pwmedium/album/request/log',
		handle_pwmedium_request_log
	);
	this.worker.port.on(
		'album/pwmedium/response/dereference',
		handle_pwmedium_response_dereference.bind(this)
	);
};

DereferenceRequest.prototype.execute = function(callback) {
	this.callback = callback;
	emit_pwmedium_request_dereference.call(this);
};

DereferenceRequest.prototype.cancel = function() {
	delete this.callback;
	this.worker.destroy();
};

exports.AlbumRequest = AlbumRequest;
exports.DereferenceRequest = DereferenceRequest;

L('module initialised');
