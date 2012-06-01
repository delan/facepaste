if ("undefined" == typeof(facepaste)) {
  var facepaste = {};
}

facepaste.download = function(e) {
	var pagelet = content.document.getElementById('album_photos_pagelet');
	var imageLinks, imageAjaxify = [];
	if (!pagelet) {
		alert("Sorry, this doesn't appear to be a Facebook album page.");
		return;
	}
	if (!confirm("Would you like to save this album? It's a good idea to empty your downloads directory and clear your downloads list first so the images don't mix up with other downloads."))
		return;
	/* first, let's get the thumbnail image links on the page */
	imageLinks = pagelet.querySelectorAll('a.uiMediaThumb');
	/* each thumbnail link has an 'ajaxify' attribute that has a URI with HTML for the download */
	for (var i = 0; i < imageLinks.length; i++)
		imageAjaxify.push(imageLinks[i].attributes.ajaxify.value);
	alert('Preparing ' + imageAjaxify.length + ' images for download to your default downloads directory.');
	/* now we use AJAX to get each of the ajaxify URIs, parsing each to queue the image URI when ready */
	var imageCount = imageAjaxify.length;
	imageAjaxify.forEach(function(s) {
		var r = new XMLHttpRequest();
		var fallback = decodeURIComponent(s.match(/&src=([^&]+)/)[1]);
		r.addEventListener('readystatechange', function() {
			if (r.readyState == 4) {
				var match = r.responseText.match(/<a href="([^"]+)">Download<\/a>/);
				saveURL(match ? match[1] : fallback, null, null, false, true, null);
				if (!(--imageCount))
					alert('All images have now been queued.');
			}
		}, false);
		r.open('GET', s, true);
		r.send(null);
	});
};
