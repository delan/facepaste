(function() {

self.port.on('input', function(e) {

var A = [];
var B = 'https://www.facebook.com/';

function push_album(album_name, album_url) {
	var album = {};
	album.name = album_name;
	album.url = album_url;
	A.push(album);
}

function humanifier_person() {
	return document.querySelector('a._8_2').textContent;
}

function humanifier_egap() {
	return document.querySelector('[itemprop=name]').textContent;
}

function humanifier_group() {
	return document.querySelector('#groupsJumpTitle').textContent;
}

function photos_of_person(e) {
	var n, u;
	n = 'Photos of ' + humanifier_person();
	if (e.wordifier)
		u = B + e.wordifier + '/photos_of';
	else
		u = B + 'profile.php?sk=photos&id=' + e.numifier;
	push_album(n, u);
}

function photos_by_person(e) {
	var n, u;
	n = 'Photos by ' + humanifier_person();
	if (e.wordifier)
		u = B + e.wordifier + '/photos_all';
	else
		u = B + 'profile.php?sk=photos_stream&id=' + e.numifier;
	push_album(n, u);
}

function photos_of_egap(e) {
	var n, u;
	n = 'Photos of ' + humanifier_egap();
	if (e.wordifier)
		u = B + e.wordifier + '/photos';
	else
		u = B + 'pages/x/' + e.numifier + '?sk=photos';
	push_album(n, u);
}

function photos_by_egap(e) {
	var n, u;
	n = 'Photos by ' + humanifier_egap();
	if (e.wordifier)
		u = B + e.wordifier + '/photos_stream';
	else
		u = B + 'pages/x/' + e.numifier + '?sk=photos_stream';
	push_album(n, u);
}

function photos_by_group(e) {
	var n, u;
	n = 'Photos by ' + humanifier_group();
	u = B + 'groups/' + (e.wordifier || e.numifier) + '/photos/';
	push_album(n, u);
}

// Special albums

switch (e.kind) {
case 'PERSON':
	[].slice.call(document.querySelectorAll
		('a[aria-controls]')).forEach(function(a) {
		var ac = a.getAttribute('aria-controls');
		if (/^pagelet_timeline_app_collection_/.test(ac))
			if (/:4$/.test(ac))
				photos_of_person(e);
			else if (/:5$/.test(ac))
				photos_by_person(e);
	});
	break;
case 'EGAP':
	if (document.querySelector('a.fbPhotosRedesignNavContent ' +
		'i[class~=sx_5ce602]'))
		photos_of_egap(e);
	if (document.querySelector('a.fbPhotosRedesignNavContent ' +
		'i[class~=sx_cdf4e6]'))
		photos_by_egap(e);
	break;
case 'GROUP':
	photos_by_group(e);
	break;
}

// Generic albums

switch (e.kind) {
case 'PERSON':
case 'EGAP':
	var a = document.querySelectorAll('a.albumThumbLink');
	[].slice.call(a).forEach(function(a) {
		var l = a.parentNode.querySelector('a.photoTextTitle strong');
		push_album(l.textContent, a.href);
	});
	break;
case 'GROUP':
	var a = document.querySelectorAll('a.uiMediaThumbAlb');
	[].slice.call(a).forEach(function(a) {
		var l = a.parentNode.querySelector('a.photoTextTitle strong');
		push_album(l.textContent, a.href);
	});
	break;
}

// Send album list back

self.port.emit('albumlist', A);

});

})();
