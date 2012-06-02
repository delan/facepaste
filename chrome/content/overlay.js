if (!facepaste)
	var facepaste = {};

facepaste.download = function(e) {
	window.openDialog('chrome://facepaste/content/main.xul', '',
		'chrome,centerscreen', {
			content: content
		});
};
