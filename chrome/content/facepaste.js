(function(global) {

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cr = Components.results;
var O = window.arguments[0];
var C = O.content;
var D = C.document;
var A = [], P = [];
var Ad = 0, Pd = 0, Pa = 0;

var browser;
var outdir;
var progress_line_albums;
var progress_line_albums_used = 25;
var progress_line_photos;
var progress_line_photos_used = 50;
var album_list_available = false;

/* utils */

function _(iterable) {
	return Array.prototype.slice.call(iterable);
}

function $q(doc, elsel) {
	return (typeof elsel === 'string') ?
		_(doc.querySelectorAll(elsel)) : [elsel];
}

function $(elsel) {
	return $q(document, elsel);
}

function $c(elsel) {
	return $q(D, elsel);
}

function $b(elsel) {
	return $q(browser.contentDocument, elsel);
}

function $$(elsel) {
	return $(elsel)[0];
}

function $$c(elsel) {
	return $c(elsel)[0];
}

function $$b(elsel) {
	return $b(elsel)[0];
}

function E(selector, event, func) {
	$(selector).forEach(function(e) {
		e.addEventListener(event, func, false);
	});
}

function Ec(selector, event, func) {
	$c(selector).forEach(function(e) {
		e.addEventListener(event, func, false);
	});
}

function ER(selector, event, func) {
	$(selector).forEach(function(e) {
		e.removeEventListener(event, func, false);
	});
}

function sanitise_fn(name) {
	// msdn.microsoft.com/en-us/library/windows/desktop/aa365247%28v=vs.85%29
	return name.
		replace(/[<>:"\/\\|?*\u0000-\u001f]/g, '_').
		replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/,'_$1').
		replace(/\.+$|^\.+/g, '');
}

function padded_number(p) {
	var max = p.album.photos.length;
	var len = max.toString().length;
	var out = p.number.toString();
	while (out.length < len)
		out = '0' + out;
	return out;
}

function log(message) {
	var x = $$('#log');
	x.value += message + '\n';
	x.selectionStart = x.value.length;
	x.selectionEnd = x.value.length;
}

function ajax(url, rtype, success, failure) {
	var r = new XMLHttpRequest;
	r.open('GET', url, true);
	if (rtype)
		r.responseType = rtype;
	r.onload = function() {
		if (r.readyState < 4)
			return;
		if (r.status >= 200 && r.status < 300)
			success(r);
		if (r.status >= 400 && r.status < 600)
			failure(r);
	};
	r.onerror = function() {
		failure(r);
	};
	r.send(null);
}

function new_browser() {
	if (browser)
		browser.parentNode.removeChild(browser);
	browser = document.createElementNS(
		'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul',
		'browser');
	browser.setAttribute('type', 'content');
	document.documentElement.appendChild(browser);
}

/* main actions */

function init() {
	if (O.type == 'user_albums')
		// autoscroll the albums page before calling get_available_albums
		fetch_album_list();
	else
		// call get_available_albums directly as current page is an album
		get_available_albums();
	E('#albums', 'select', start_enable);
	E('#browse', 'command', browse);
	E('#start', 'command', start);
	E('#cancel', 'command', cancel);
	E('#cancelrunning', 'command', cancel);
}

function browse() {
	var p = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
	p.init(window, 'Choose a directory to download photos to',
		Ci.nsIFilePicker.modeGetFolder);
	if (p.show() == Ci.nsIFilePicker.returnOK) {
		outdir = p.file;
		$$('#path').value = outdir.path;
	}
	start_enable();
}

function start() {
	O.naming = $$('#naming').selectedIndex;
	get_selected_albums(); // MUST do this before hiding the lobby
	$$('#lobby').hidden = true;
	$$('#engine').hidden = false;
	sizeToContent();
	log('preparing to download ' + A.length + ' album' +
		(A.length ? 's' : '') + ':');
	A.forEach(function(a) {
		a.log(a.name);
	});
	log('________________________________');
	queue_poll();
	start_album(0);
}

function cancel() {
	close();
}

/* object structures */

function Album() {
	/* waiting, preparing, downloading, complete, error */
	this.name = '';
	this.url = '';
	this.outdir = null;
	this.number = 0;
	this.photos = [];
	this.status = 'waiting';
	this.dot = null;
	this.set_status = function(status) {
		this.status = status;
		this.dot.className = status;
	};
	this.log = function(message) {
		log('(album ' + this.number + ') ' + message);
	};
}

function Photo() {
	/* waiting, preparing, downloading, complete, error */
	this.pageurl = '';
	this.photourl = '';
	this.album = null;
	this.number = 0;
	this.status = 'waiting';
	this.dot = new_progress_dot(false);
	this.set_status = function(status) {
		this.status = status;
		this.dot.className = status;
		this.update_tooltip();
	};
	this.update_tooltip = function() {
		this.dot.setAttribute('tooltiptext',
			'Album ' + this.album.number + ': ' + this.album.name + '\n' +
			'Photo ' + this.number + ' of ' + this.album.photos.length + '\n' +
			'URL: ' + (this.photourl || 'not yet known')
		);
	};
	this.log = function(message) {
		log('(album ' + this.album.number +
			' photo ' + this.number + ') ' + message);
	};
}

/* behind the scenes */

function new_progress_dot(is_album) {
	if (is_album) {
		if (progress_line_albums_used == 25) {
			progress_line_albums = document.createElement('box');
			$$('#progress_albums').appendChild(progress_line_albums);
			sizeToContent();
			progress_line_albums_used = 0;
		}
		var dot = document.createElement('box');
		dot.className = 'waiting';
		progress_line_albums.appendChild(dot);
		progress_line_albums_used++;
		return dot;
	} else {
		if (progress_line_photos_used == 50) {
			progress_line_photos = document.createElement('box');
			$$('#progress_photos').appendChild(progress_line_photos);
			sizeToContent();
			progress_line_photos_used = 0;
		}
		var dot = document.createElement('box');
		dot.className = 'waiting';
		progress_line_photos.appendChild(dot);
		progress_line_photos_used++;
		return dot;
	}
}

function start_enable() {
	$$('#start').disabled = !(album_list_available &&
		outdir && $$('#albums').selectedCount);
}

function get_user_name() {
	return $$c('.name .uiButtonText').textContent;
}

function get_page_description() {
	switch (O.type) {
	case 'album':
		return get_user_name() + ' - ' + $$c('.fbPhotoAlbumTitle').textContent;
	case 'user_photos_of':
		return 'Photos of ' + get_user_name();
	case 'user_photos':
		return 'Photos by ' + get_user_name();
	case 'user_albums':
		return 'Albums by ' + get_user_name();
	}
	return 'Unknown';
}

function fetch_album_list() {
	new_browser();
	E(browser, 'DOMContentLoaded', begin_scrolling.bind(
		global, get_available_albums));
	browser.loadURI(C.location.toString());
}

function get_available_albums() {
	var list = $$('#albums');
	if (O.type == 'user_albums') {
		$b('li:not(.fbPhotosRedesignNavSelected) .fbPhotosRedesignNavContent').
			map(function(x, i, links) {
			var a = new Album;
			// if the target user is a friend, the links will be:
			//     photos of | photos by
			// if the target user is not a friend, the links will be:
			//     photos by
			if (links.length == 1 || i == 1)
				var prefix = 'Photos by ';
			else
				var prefix = 'Photos of ';
			a.name = prefix + get_user_name();
			a.url = x.href;
			A.push(a);
			return a.name;
		}).forEach(function(x) {
			var item = document.createElement('listitem');
			item.setAttribute('label', x);
			list.appendChild(item);
		});
		$b('.albumThumbLink').map(function(x) {
			var a = new Album;
			a.name = x.parentNode.querySelector(
				'.photoTextTitle strong').textContent;
			a.url = x.href;
			A.push(a);
			return a.name;
		}).forEach(function(x) {
			var item = document.createElement('listitem');
			item.setAttribute('label', x);
			list.appendChild(item);
		});
	} else {
		var a = new Album;
		a.name = get_page_description();
		a.url = C.location.toString();
		A.push(a);
		var item = document.createElement('listitem');
		item.setAttribute('label', a.name);
		list.appendChild(item);
	}
	$$('#loading_msg').hidden = true;
	album_list_available = true;
	start_enable();
	sizeToContent();
}

function get_selected_albums() {
	var list = $$('#albums');
	var count = list.selectedCount;
	var selected = [];
	while (count--) {
		var index = list.getIndexOfItem(list.selectedItems[count]);
		selected.push(A[index]);
		A[index].number = selected.length;
		A[index].dot = new_progress_dot(true);
	}
	A = selected;
}

function start_album(i) {
	var a = A[i];
	a.set_status('preparing');
	a.log('creating album folder');
	a.outdir = outdir.clone();
	a.outdir.append(sanitise_fn(a.name));
	try {
		a.outdir.create(Ci.nsIFile.DIRECTORY_TYPE, 0755);
	} catch (e) {
		switch (e.result) {
		case Cr.NS_ERROR_FILE_NOT_FOUND:
			a.log('error creating album folder: path would be too long');
			break;
		case Cr.NS_ERROR_FILE_ACCESS_DENIED:
			a.log('error creating album folder: access denied');
			break;
		case Cr.NS_ERROR_FILE_ALREADY_EXISTS:
			a.log('error creating album folder: folder already exists');
			break;
		default:
			a.log('error creating album folder: ' + e.message);
			break;
		}
		a.set_status('error');
		Ad++;
		if (A[i + 1])
			start_album(i + 1);
		return;
	}
	a.log('fetching album index');
	new_browser();
	E(browser, 'DOMContentLoaded', begin_scrolling.bind(
		global, handle_album_index.bind(global, a, i)));
	browser.loadURI(a.url);
}

function begin_scrolling(callback, event) {
	if (event.target instanceof Ci.nsIDOMHTMLDocument &&
		event.target != browser.contentDocument)
		return; // only continue for the main document, not any frames
	var x = 0, y = 0;
	/*
		OLD SOLUTION (doesn't appear to work at all):
		
		// although argumetns.callee is deprecated, we need it here because the
		// current function is never actually the original begin_scrolling, but
		// a bound function with a supplied callback argument
		ER(browser, 'DOMContentLoaded', arguments.callee);
		
		NEW SOLUTION: delete and create a new browser element = no listeners
		see: new_browser calls in start_album and fetch_album_list
	*/
	var bcw = browser.contentWindow;
	E(bcw, 'scroll', function() { y++; });
	var t = bcw.setInterval(function() {
		x++;
		bcw.scrollBy(0, 50);
		if (x > y + 50) {
			bcw.clearInterval(t);
			if (callback)
				callback();
		}
	}, 100);
}

function handle_album_index(a, ai) {
	a.log('parsing album index');
	var bcd = browser.contentDocument;
	var photo_page_links = _(bcd.querySelectorAll(
		'a.uiMediaThumb:not(.uiMediaThumbAlb):not(.albumThumbLink)'));
	a.log('found ' + photo_page_links.length + ' photos');
	photo_page_links.forEach(function(x) {
			var p = new Photo;
			p.pageurl = x.href;
			p.number = a.photos.length + 1;
			p.album = a;
			P.push(p);
			a.photos.push(p);
		});
	a.photos.forEach(function(p) {
		p.update_tooltip();
	});
	a.set_status('complete');
	Ad++;
	if (A[ai + 1])
		start_album(ai + 1);
}

function queue_poll() {
	if (A.length == Ad && P.length == Pd) {
		log('\nall albums and photos complete');
		$$('#cancelrunning').setAttribute('label', 'Close');
		return;
	}
	var waiting = P.filter(function(x) { return x.status == 'waiting'; });
	while (Pa < 8 && waiting.length) {
		get_photo(waiting[0]);
		waiting = P.filter(function(x) { return x.status == 'waiting'; });
	}
	setTimeout(queue_poll, 500);
}

function get_photo(p) {
	Pa++;
	p.set_status('preparing');
	ajax(p.pageurl, 'document',
		handle_photo_page.bind(global, p),
		handle_photo_page_error.bind(global, p));
}

function handle_photo_page(p, r) {
	p.log('successfully received photo page, creating photo file');
	var download_link = _(r.response.querySelectorAll('a')).filter(
		function(x) {
			return (x.rel == 'ignore') &&
				(x.className == 'fbPhotosPhotoActionsItem');
		})[0];
	var image_element = r.response.querySelector('.fbPhotoImage');
	if (!download_link && !image_element) {
		p.log(
			'error: no download link or photo found on photo page, ' +
			'are you accepting third party cookies?'
		);
		p.set_status('error');
		Pa--;
		Pd++;
	}
	// fall back to the img's src when no download link given, e.g. cover photos
	p.photourl = download_link ? download_link.href : image_element.src;
	p.set_status('downloading');
	p.outfile = p.album.outdir.clone();
	var orig_name = p.photourl.match(/\/([^\/]+.jpg)(?:\?dl=1)?/)[1];
	switch (O.naming) {
	case 0:
		p.outfile.append(sanitise_fn(padded_number(p) + '.jpg'));
		break;
	case 1:
		p.outfile.append(sanitise_fn(orig_name));
		break;
	case 2:
		p.outfile.append(sanitise_fn(padded_number(p) + '_' + orig_name));
		break;
	}
	try {
		p.outfile.create(Ci.nsIFile.NORMAL_FILE_TYPE, 0644);
	} catch (e) {
		switch (e.result) {
		case Cr.NS_ERROR_FILE_NOT_FOUND:
			p.log('error creating photo file: path would be too long');
			break;
		case Cr.NS_ERROR_FILE_ACCESS_DENIED:
			p.log('error creating photo file: access denied');
			break;
		case Cr.NS_ERROR_FILE_ALREADY_EXISTS:
			p.log('error creating photo file: file already exists');
			break;
		default:
			p.log('error creating photo file: ' + e.message);
			break;
		}
		p.set_status('error');
		Pa--;
		Pd++;
		return;
	}
	var wbp = Cc['@mozilla.org/embedding/browser/nsWebBrowserPersist;1'].
		createInstance(Ci.nsIWebBrowserPersist);
	wbp.progressListener = {
		onProgressChange: function() {},
		onLocationChange: function() {},
		onSecurityChange: function() {},
		onStatusChange: function() {},
		onStateChange: function(aWebProgress, aRequest, aStateFlags, aStatus) {
			if (wbp.currentState == wbp.PERSIST_STATE_FINISHED) {
				var chan = aRequest.QueryInterface(Ci.nsIHttpChannel);
				if (chan.requestSucceeded)
					handle_photo_success(p);
				else
					handle_photo_error(p, chan);
			}
		}
	};
	var ios = Cc["@mozilla.org/network/io-service;1"].
		getService(Ci.nsIIOService);
	wbp.saveURI(ios.newURI(p.photourl, null, null),
		null, null, null, '', p.outfile, null);
}

function handle_photo_page_error(p, r) {
	if (r.status)
		p.log('failed to download photo page: error ' + r.status);
	else
		p.log('failed to download photo page: connection error');
	p.set_status('error');
	Pa--;
	Pd++;
}

function handle_photo_success(p) {
	p.log('finished downloading photo file');
	p.set_status('complete');
	Pa--;
	Pd++;
}

function handle_photo_error(p, chan) {
	p.log('failed to download photo file: ' + chan.responseStatus + ' ' +
		chan.responseStatusText);
	p.set_status('error');
	Pa--;
	Pd++;
}

E(global, 'load', init);

})(this);
