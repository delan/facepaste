(function() {

'use strict';

function L() {
	self.port.emit('pwalbumlist/albumlist/request/log', {
		source: 'pwalbumlist',
		args: [].slice.call(arguments)
	});
}

function handle_albumlist_request_albums(payload) {
	L('handle_albumlist_request_albums');
	function push_album(album_name, album_url) {
		var album = {};
		album.name = album_name;
		album.url = album_url;
		A.push(album);
	}
	function humanifier_person() {
		return Q('a._8_2')[0].textContent;
	}
	function humanifier_egap() {
		return Q('.nameButton')[0].textContent;
	}
	function humanifier_group() {
		return Q('#groupsJumpTitle')[0].textContent;
	}
	function photos_of_person(t) {
		var n, u;
		n = 'Photos of ' + humanifier_person();
		if (t.wordifier)
			u = B + t.wordifier + '/photos_of';
		else
			u = B + 'profile.php?sk=photos&id=' + t.numifier;
		push_album(n, u);
	}
	function photos_by_person(t) {
		var n, u;
		n = 'Photos by ' + humanifier_person();
		if (t.wordifier)
			u = B + t.wordifier + '/photos_all';
		else
			u = B + 'profile.php?sk=photos_stream&id=' + t.numifier;
		push_album(n, u);
	}
	function photos_of_egap(t) {
		var n, u;
		n = 'Photos of ' + humanifier_egap();
		if (t.wordifier)
			u = B + t.wordifier + '/photos';
		else
			u = B + 'pages/x/' + t.numifier + '?sk=photos';
		push_album(n, u);
	}
	function photos_by_egap(t) {
		var n, u;
		n = 'Photos by ' + humanifier_egap();
		if (t.wordifier)
			u = B + t.wordifier + '/photos_stream';
		else
			u = B + 'pages/x/' + t.numifier + '?sk=photos_stream';
		push_album(n, u);
	}
	function photos_by_group(t) {
		var n, u;
		n = 'Photos by ' + humanifier_group();
		u = B + 'groups/' + (t.wordifier || t.numifier) + '/photos/';
		push_album(n, u);
	}
	var A = [];
	var B = $facepaste$shared$.BASE_URL;
	var Q = $facepaste$shared$.Q;
	var t = payload;
	// Special albums
	switch (t.kind) {
	case 'PERSON':
		Q('a[aria-controls]', function(a) {
			var ac = a.getAttribute('aria-controls');
			if (/^pagelet_timeline_app_collection_/.test(ac))
				if (/:4$/.test(ac))
					photos_of_person(t);
				else if (/:5$/.test(ac))
					photos_by_person(t);
		});
		break;
	case 'EGAP':
		if (Q('a.fbPhotosRedesignNavContent i[class~=sx_5ce602]')[0])
			photos_of_egap(t);
		if (Q('a.fbPhotosRedesignNavContent i[class~=sx_cdf4e6]')[0])
			photos_by_egap(t);
		break;
	case 'GROUP':
		photos_by_group(t);
		break;
	}
	// Generic albums
	switch (t.kind) {
	case 'PERSON':
	case 'EGAP':
		Q('a.albumThumbLink', function(a) {
			var l = Q(a.parentNode, 'a.photoTextTitle strong');
			push_album(l[0].textContent, a.href);
		});
		break;
	case 'GROUP':
		Q('a.uiMediaThumbAlb', function(a) {
			var l = Q(a.parentNode, 'a.photoTextTitle strong');
			push_album(l[0].textContent, a.href);
		});
		break;
	}
	emit_albumlist_response_albums(A);
}

function emit_albumlist_response_albums(albumlist) {
	L('emit_albumlist_response_albums');
	L('hint: found', albumlist.length, 'albums');
	self.port.emit(
		'albumlist/pwalbumlist/response/albums',
		albumlist
	);
}

self.port.on(
	'albumlist/pwalbumlist/request/albums',
	handle_albumlist_request_albums
);

L('module initialised');

})();
