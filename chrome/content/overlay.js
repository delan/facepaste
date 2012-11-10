(function() {

function type() {
	if (content.location.hostname != 'www.facebook.com')
		return '';
	if (content.location.pathname == '/media/set/')
		return 'album';
	if (
		/^\/[A-Za-z0-9.]+\/photos$/.test(content.location.pathname) ||
		/(\?|&)sk=photos(&|$)/.test(content.location.search)
	)
		return 'user_photos_of';
	if (
		/^\/[A-Za-z0-9.]+\/photos_stream$/.test(content.location.pathname) ||
		/(\?|&)sk=photos_stream(&|$)/.test(content.location.search)
	)
		return 'user_photos';
	if (
		/^\/[A-Za-z0-9.]+\/photos_albums$/.test(content.location.pathname) ||
		/(\?|&)sk=photos_albums(&|$)/.test(content.location.search)
	)
		return 'user_albums';
	return '';
}

function facepaste() {
	openDialog('chrome://facepaste/content/facepaste.xul', '',
		'chrome,centerscreen', { content: content, type: type() });
}

function showhide() {
	document.getElementById('facepaste_menuitem').hidden = !type();
}

/*
	very weird; without waiting for the load event, calling d.gEBI('cACM') will
	mysteriously perma-hide all custom menu entries from any add-on, with no
	errors
*/

addEventListener('load', function(e) {
	document.getElementById('facepaste_menuitem').
		addEventListener('command', facepaste, false);
	document.getElementById('contentAreaContextMenu').
		addEventListener('popupshowing', showhide, false);
}, false);

})();
