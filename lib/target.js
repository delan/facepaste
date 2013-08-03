'use strict';

var sdk_data = require('sdk/self').data;
var sdk_tabs = require('sdk/tabs');
var lib_shared = require('./shared');
var lib_ui = require('./ui');
var L = lib_ui.log_for('target');

function emit_twtarget_request_target() {
	L('emit_twtarget_request_target');
	this.worker.port.emit('target/twtarget/request/target');
}

function handle_twtarget_response_target(payload) {
	L('handle_twtarget_response_target');
	this.callback(payload);
}

function handle_twtarget_request_log(payload) {
	lib_ui.log_handler(payload);
}

function TargetRequest() {
	this.worker = sdk_tabs.activeTab.attach({
		contentScriptFile: [
			sdk_data.url('../lib/shared.js'),
			sdk_data.url('content/engine/twtarget.js')
		]
	});
	this.worker.port.on(
		'twtarget/target/request/log',
		handle_twtarget_request_log
	);
	this.worker.port.on(
		'target/twtarget/response/target',
		handle_twtarget_response_target.bind(this)
	);
};

TargetRequest.prototype.execute = function(callback) {
	this.callback = callback;
	emit_twtarget_request_target.call(this);
};

TargetRequest.prototype.cancel = function() {
	delete this.callback;
	this.worker.destroy();
};

exports.TargetRequest = TargetRequest;

L('module initialised');
