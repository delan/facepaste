(function() {

function log() {
	self.port.emit('log', {
		source: 'ui',
		args: [].slice.call(arguments)
	});
}

function hashchange() {
	var id = location.hash.substr(1);
	$('nav a').removeClass('active');
	$('#l_' + id).addClass('active');
	$('section').removeClass('active');
	$('#' + id).addClass('active');
}

var l = new Lumber('#log');

self.port.on('log', function(payload) {
	l.log.apply(null, [payload.source + ':'].concat(payload.args));
});

// poor man's REPL
// $('#log').click(function() {
// 	log('repl:', eval(prompt()));
// });

$(window).on('hashchange', hashchange);

location.hash = 's_log';
hashchange();

log('ready for action');

})();
