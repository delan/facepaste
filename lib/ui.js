'use strict';

function emit_panel_request_display_log(payload) {
	var args = [payload.source + ':'].concat(payload.args);
	// DEBUG: disable the next line in production for performance
	// console.log.apply(console, args);
	panel.port.emit(
		'ui/panel/request/display_log',
		args
	);
}

function internal_log() {
	var args = [].slice.call(arguments);
	var source = args.shift();
	emit_panel_request_display_log({
		source: source,
		args: args
	});
}

function internal_log_for_source(source) {
	return internal_log.bind(null, source);
}

var sdk_data = require('sdk/self').data;
var L = internal_log_for_source('ui');

var panel = require('sdk/panel').Panel({
	width: 800,
	height: 480,
	contentURL: sdk_data.url('content/panel/panel.html'),
	contentScriptFile: [
		sdk_data.url('content/panel/contrib/jquery-2.0.2.min.js'),
		sdk_data.url('content/panel/contrib/lumberjack/lumberjack.js'),
		sdk_data.url('../lib/shared.js'),
		sdk_data.url('content/panel/panel.js')
	]
});

var widget = require('sdk/widget').Widget({
	id: 'facepaste-widget',
	label: 'Download Facebook albums',
	contentURL: sdk_data.url('icons/icon16.png'),
	panel: panel
});

panel.port.on(
	'panel/ui/request/log',
	emit_panel_request_display_log
);

exports.panel = panel;
exports.widget = widget;
exports.log = internal_log;
exports.log_for = internal_log_for_source;
exports.log_handler = emit_panel_request_display_log;

L('module initialised');
