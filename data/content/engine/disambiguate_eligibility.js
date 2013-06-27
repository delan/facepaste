(function() {

var result = {
	eligible: false,
	kind: undefined,
	wordifier: undefined
};

var base = 'https://www.facebook.com/';
var wordifier = location.pathname.match(/^\/([A-Za-z0-9.]{5,})(\?|$)/)[1];

if (document.querySelector('#timelineHeadlineLikeButton')) {
	result.eligible = true;
	result.kind = 'EGAP';
	result.wordifier = true;
	result.albumlist = base + wordifier + '/photos_albums';
} else if (document.querySelector(
	'a[data-medley-id=pagelet_timeline_medley_friends]')) {
	result.eligible = true;
	result.kind = 'PERSON';
	result.wordifier = true;
	result.albumlist = base + wordifier + '/photos_albums';
}

self.port.emit('eligibility', result);

})();
