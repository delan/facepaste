var tabs = require('sdk/tabs');
var url = require('sdk/url');
var data = require('sdk/self').data;
var log = require('./log');

function panel_show() {
	log.log('main', "panel_show called");
	var w = tabs.activeTab.attach({
		contentScriptFile: data.url('content/engine/eligible.js')
	});
	w.port.on('log', log.handler);
	w.port.on('eligible', function(e) {
		log.log('main', 'from eligible:', JSON.stringify(e));
		if (!e.eligible)
			return;
		require('./albumlist').fetch(e, function(x) {
			log.log('main', 'in callback');
		});
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

log.setPanel(panel);

var widget = require('sdk/widget').Widget({
	id: 'facepaste-widget',
	label: 'Download Facebook albums',
	contentURL: data.url('icons/icon16.png'),
	panel: panel
});

log.log('main', 'ready for action');
