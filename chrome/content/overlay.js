if (!facepaste)
	var facepaste = {};

facepaste.download = function(e) {
	window.openDialog('chrome://facepaste/content/main.xul', '',
		'chrome,centerscreen', {
			content: content
		});
};

facepaste.showhide = function(e) {
	document.getElementById('facepaste-download-menuitem').hidden = !(
		content.location.hostname == 'www.facebook.com' && (
			/^\/[A-Za-z0-9.]+\/photos$/.test(content.location.pathname) ||
			content.location.pathname == '/media/set/' ||
			(
				content.location.pathname == '/profile.php' &&
				/(\?|&)sk=photos(&|$)/.test(content.location.search)
			)
		));
};

/*
	very weird; without waiting for the load event, calling d.gEBI('cACM') will
	mysteriously perma-hide all custom menu entries from any add-on, with no
	errors
*/

addEventListener('load', function(e) {
	document.getElementById('contentAreaContextMenu').
		addEventListener('popupshowing', facepaste.showhide, false);
}, false);
