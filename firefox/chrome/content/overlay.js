(function() {

function type() {
	if (content.location.hostname != 'www.facebook.com')
		return '';
	if (content.location.pathname == '/media/set/' || content.location.pathname.indexOf('media_set') !== -1)
		return 'album';
	if (
		/^\/[A-Za-z0-9.]+\/photos_albums$/.test(
			content.location.pathname) ||
		/(\?|&)sk=photos_albums(&|$)/.test(content.location.search) ||
		/(\?|&)collection_token=.*6$/.test(content.location.search)
	)
		return 'user_albums';
	if (
		/^\/[A-Za-z0-9.]+\/photos_stream$/.test(
			content.location.pathname) ||
		/(\?|&)sk=photos_stream(&|$)/.test(content.location.search) ||
		/(\?|&)collection_token=.*5$/.test(content.location.search)
	)
		return 'user_photos';
	if (
		/^\/[A-Za-z0-9.]+\/photos$/.test(content.location.pathname) ||
		/(\?|&)sk=photos(&|$)/.test(content.location.search) ||
		/(\?|&)collection_token=.*4$/.test(content.location.search)
	)
		return 'user_photos_of';
	return '';
}

function facepaste() {
	openDialog('chrome://facepaste/content/facepaste.xul', '',
		'chrome,centerscreen', { content: content, type: type() });
}

function showhide() {
	document.getElementById('facepaste_menuitem').hidden = !type();
}

// you MUST wait for the load event to fire before touching
// contentAreaContextMenu; if you even get the element before load is fired,
// all entries from any extensions will be permanently hidden for the entire
// browser session, with no errors thrown

addEventListener('load', function(e) {
	document.getElementById('facepaste_menuitem').
		addEventListener('command', facepaste, false);
	document.getElementById('contentAreaContextMenu').
		addEventListener('popupshowing', showhide, false);
}, false);

})();
