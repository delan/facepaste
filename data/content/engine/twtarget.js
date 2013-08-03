(function() {

'use strict';

function L() {
	self.port.emit('twtarget/target/request/log', {
		source: 'twtarget',
		args: [].slice.call(arguments)
	});
}

function handle_target_request_target() {
	L('handle_target_request_target');
	var lh = location.hostname;
	var lp = location.pathname;
	var ls = location.search;
	var Q = $facepaste$shared$.Q;
	var m;
	if ($facepaste$shared$.HOSTNAME != lh)
		return emit_target_response_target({ eligible: false });
	if ('/profile.php' == lp)
	if (m = /^(?:\?|&)id=(\d+)(?:&|$)/.exec(ls))
		return emit_target_response_target({
			eligible: true,
			kind: 'PERSON',
			numifier: m[1]
		});
	if (m = /^\/pages\/[A-Za-z0-9-]+\/(\d+)$/.exec(lp))
		return emit_target_response_target({
			eligible: true,
			kind: 'EGAP',
			numifier: m[1]
		});
	// The following two tests should stay in order: numifier, wordifier.
	if (m = /^\/groups\/(\d+)\/?$/.exec(lp))
		return emit_target_response_target({
			eligible: true,
			kind: 'GROUP',
			numifier: m[1]
		});
	if (m = /^\/groups\/([A-Za-z0-9.]{5,})\/?$/.exec(lp))
		return emit_target_response_target({
			eligible: true,
			kind: 'GROUP',
			wordifier: m[1]
		});
	if (m = /^\/([A-Za-z0-9.]{5,})$/.exec(lp)) {
		if (Q('#timelineHeadlineLikeButton')[0])
			return emit_target_response_target({
				eligible: true,
				kind: 'EGAP',
				wordifier: m[1]
			});
		if (Q('a[data-medley-id=pagelet_timeline_medley_friends]')[0])
			return emit_target_response_target({
				eligible: true,
				kind: 'PERSON',
				wordifier: m[1]
			});
	}
	return emit_target_response_target({ eligible: false });
}

function emit_target_response_target(payload) {
	L('emit_target_response_target');
	L('hint:', $facepaste$shared$.J(payload));
	self.port.emit('target/twtarget/response/target', payload);
}

self.port.on(
	'target/twtarget/request/target',
	handle_target_request_target
);

L('module initialised');

})();
