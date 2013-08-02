var tabs = require('sdk/tabs');
var url = require('sdk/url');
var data = require('sdk/self').data;

function log() {
	log_handler({
		source: 'main',
		args: [].slice.call(arguments)
	});
}

function log_handler(payload) {
	panel.port.emit('log', payload);
}

function panel_show() {
	log("panel_show called");
	var w = tabs.activeTab.attach({
		contentScriptFile: data.url('content/engine/eligible.js')
	});
	w.port.on('log', log_handler);
	w.port.on('eligible', function(payload) {
		log('< eligible', JSON.stringify(payload));
	});
}

var panel = require('sdk/panel').Panel({
	width: 800,
	height: 480,
	onShow: panel_show,
	contentURL: data.url('content/panel/html/ui.html'),
	contentScriptFile: [
		data.url('content/panel/contrib/lumberjack/lumberjack.js'),
		data.url('content/panel/contrib/jquery/jquery-2.0.2.min.js'),
		data.url('content/panel/js/ui.js')
	]
});

panel.port.on('log', log_handler);

var widget = require('sdk/widget').Widget({
	id: 'facepaste-widget',
	label: 'Download Facebook albums',
	contentURL: data.url('icons/icon16.png'),
	panel: panel
});

log('ready for action');
