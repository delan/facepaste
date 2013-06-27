(function() {

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

function tab_handler() {
	var t = tabs.activeTab;
	var u = url.URL(t.url);
	if (u.host && /\.facebook\.com$/.test(u.host)) {
		log('checking eligibility for', t.url);
		require('./eligibility').is_eligible_page(t.url,
			function(result) {
				log(JSON.stringify(result));
			}
		);
	}
}

// traversing pages on Facebook generally doesn't trigger any events because
// the site appears to use the History API, so we need to occasionally poll
// tabs.on('ready', tab_handler);
// tabs.on('activate', tab_handler);
(function() {
	var last;
	require('sdk/timers').setInterval(function() {
		if (tabs.activeTab.url != last) {
			tab_handler();
			last = tabs.activeTab.url;
		}
	}, 1000);
})();

var panel = require('sdk/panel').Panel({
	width: 800,
	height: 480,
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

})();
