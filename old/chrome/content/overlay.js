(function() {

function type() {
	if (content.location.hostname != 'www.facebook.com')
		return '';
	// first is for business page album
	// second is for user album
	if (
		/^\/media\/set\/$/.test(content.location.pathname) || 
		/^\/[A-Za-z0-9.]+\/media_set$/.test(content.location.pathname)
	)
		return 'album';
	// \/photos_albums$/ is for user albums
	// tab=photos_albums is for business page albums
	// rest might be deprecated, kept for redundancy
	if (
		/(\/photos_stream).*?(\?tab=photos_albums)/.test(content.location) || 
		/^\/[A-Za-z0-9.]+\/photos_albums$/.test(content.location.pathname) || 
		/(\?|&)sk=photos_albums(&|$)/.test(content.location.search) || 
		/(\?|&)collection_token=.*6$/.test(content.location.search)
	)
		return 'user_albums';
	// first one is for business page photos, might become deprecated
	// second is for new user photos (/photos or /photos_all)
	// but doesn't work directly if user has only albums visible
	// rest might be deprecated, kept for redundancy
	if (
		/(\/photos_stream(?!\?tab=photos_albums).*)/.test(content.location) || 
		/^\/[A-Za-z0-9.]+\/photos(_all)?$/.test(content.location.pathname) || 
		/(\?|&)sk=photos_stream(&|$)/.test(content.location.search) || 
		/(\?|&)collection_token=.*5$/.test(content.location.search)
	)
		return 'user_photos';
	// is this needed? not working if it's default as /photos, goes as 'photos by'
	// it only works if the user is actively accessing the tab (of, by, albums)
	if (
		/^\/[A-Za-z0-9.]+\/photos(_of)?$/.test(content.location.pathname) || 
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
