(function() {

function log() {
	self.port.emit('log', {
		source: 'eligible',
		args: [].slice.call(arguments)
	});
}

function response(payload) {
	self.port.emit('eligible', payload);
}

var m;

log('starting');

if ('www.facebook.com' != location.hostname)
	return response({ eligible: false });

if ('/profile.php' == location.pathname)
if (m = location.search.match(/^(?:\?|&)id=(\d+)(?:&|$)/))
	return response({
		eligible: true,
		kind: 'PERSON',
		numifier: m[1]
	});

if (m = location.pathname.match(/^\/pages\/[A-Za-z0-9-]+\/(\d+)$/))
	return response({
		eligible: true,
		kind: 'EGAP',
		numifier: m[1]
	});

// The following two tests should remain in the numifier/wordifier order.

if (m = location.pathname.match(/^\/groups\/(\d+)\/?$/))
	return response({
		eligible: true,
		kind: 'GROUP',
		numifier: m[1]
	});

if (m = location.pathname.match(/^\/groups\/([A-Za-z0-9.]{5,})\/?$/))
	return response({
		eligible: true,
		kind: 'GROUP',
		wordifier: m[1]
	});

if (m = location.pathname.match(/^\/([A-Za-z0-9.]{5,})$/)) {
if (document.querySelector('#timelineHeadlineLikeButton'))
	return response({
		eligible: true,
		kind: 'EGAP',
		wordifier: m[1]
	});
if (document.querySelector('a[data-medley-id=pagelet_timeline_medley_friends]'))
	return response({
		eligible: true,
		kind: 'PERSON',
		wordifier: m[1]
	});
}

return response({ eligible: false });

})();
