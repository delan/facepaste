'use strict';

var {Cc, Ci, Cu, Cr} = require("chrome");
var lib_shared = require('./shared');
var lib_ui = require('./ui');
var L = lib_ui.log_for('dlhelpers');

Cu.import("resource://gre/modules/PrivateBrowsingUtils.jsm");

function download_file(url, file, success, failure) {
	function callback_onStateChange(success, failure, wp, rq, sf, st) {
		// The first two arguments are callbacks passed through
		// download_file from its call in DownloadManager.download. The
		// remaining four arguments are provided by nsIWebBrowserPersist
		// as state change information for this callback.
		L('callback_onStateChange');
		if (wbp.currentState == wbp.PERSIST_STATE_FINISHED) {
			var chan = rq.QueryInterface(Ci.nsIHttpChannel);
			if (chan.requestSucceeded) {
				L('download success:', file.path);
				success(chan);
			} else {
				L('download failure:', file.path);
				failure(chan);
			}
		}
	}
	var wbp = Cc['@mozilla.org/embedding/browser/nsWebBrowserPersist;1'].
		createInstance(Ci.nsIWebBrowserPersist);
	var ios = Cc["@mozilla.org/network/io-service;1"].
		getService(Ci.nsIIOService);
	var privacy = PrivateBrowsingUtils.
		privacyContextFromWindow(aURLSourceWindow);
	var uri = ios.newURI(url, null, null);
	L('download_file:', url, '=>', file.path);
	if (file.exists()) {
		L('download_file: skipping because file exists:', file.path);
		L(
			'download_file: return value:',
			String(lib_shared.DOWNLOAD_FILE_RET.SKIP)
		);
		return lib_shared.DOWNLOAD_FILE_RET.SKIP;
	}
	if (!mkfile(file)) {
		L(
			'download_file: return value:',
			String(lib_shared.DOWNLOAD_FILE_RET.ERROR)
		);
		return lib_shared.DOWNLOAD_FILE_RET.ERROR;
	}
	wbp.progressListener = {
		onProgressChange: function() {},
		onLocationChange: function() {},
		onSecurityChange: function() {},
		onStatusChange: function() {},
		onStateChange: callback_onStateChange.
			bind(null, success, failure)
	};
	wbp.saveURI(uri, null, null, null, '', file, privacy);
	L(
		'download_file: return value:',
		String(lib_shared.DOWNLOAD_FILE_RET.ACTIVE)
	);
	return lib_shared.DOWNLOAD_FILE_RET.ACTIVE;
}

function sanitise(filename) {
	// Windows is the most restrictive with file names, to make the logic
	// a little simpler we'll use Windows' rules for everyone as per:
	// msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85)
	return filename.
		// no C0 control codes or characters in <>:"/\|?*
		replace(/[<>:"\/\\|?*\u0000-\u001f]/g, '_').
		// no file names that are entirely reserved DOS device names
		replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/,'_$1').
		// no trailing or leading dots
		replace(/\.+$|^\.+/g, '_');
}

function clone_and_append(file, node) {
	file = file.clone();
	file.append(sanitise(node));
	return file;
}

function mkdir(directory_file) {
	L("mkdir: creating", directory_file.path);
	try {
		directory_file.create(
			Ci.nsIFile.DIRECTORY_TYPE,
			493 /* 0755 */
		);
		return directory_file;
	} catch (e) {
		switch (e.result) {
		case Cr.NS_ERROR_FILE_NOT_FOUND:
			L('error creating directory: path too long');
			break;
		case Cr.NS_ERROR_FILE_ACCESS_DENIED:
			L('error creating directory: access denied');
			break;
		case Cr.NS_ERROR_FILE_ALREADY_EXISTS:
			L('hint: directory already exists');
			return directory_file;
			break;
		default:
			L('error creating directory:', e.message);
			break;
		}
	}
}

function mkfile(file) {
	L("mkfile: creating", file.path);
	try {
		file.create(
			Ci.nsIFile.NORMAL_FILE_TYPE,
			420 /* 0644 BLAZE IT */
		);
		return file;
	} catch (e) {
		switch (e.result) {
		case Cr.NS_ERROR_FILE_NOT_FOUND:
			L('error creating file: path too long');
			break;
		case Cr.NS_ERROR_FILE_ACCESS_DENIED:
			L('error creating file: access denied');
			break;
		case Cr.NS_ERROR_FILE_ALREADY_EXISTS:
			L('error: file already exists');
			break;
		default:
			L('error creating file:', e.message);
			break;
		}
	}
}

function get_leaf_from_url(url) {
	// 'https://host/path/to/file.jpg?param=value&foo=bar' => 'file.jpg'
	return url.match(/\/([^\/?]+)(?:\?.*)?$/)[1];
}

function get_leaf_complete(url, index_in_album, total_in_album) {
	index_in_album++; // use one-based numbering in filenames
	var leaf = get_leaf_from_url(url);
	var filext = leaf.match(/(\.[^.]+)$/)[1];
	var total_len = String(total_in_album).length;
	var index_len = String(index_in_album).length;
	var padding = Array(1 + total_len - index_len).join('0');
	var number = padding + index_in_album;
	switch (lib_shared.prefs.namingScheme) {
	case 'order':
		return number + filext;
		break;
	case 'unique':
		return leaf;
		break;
	case 'both':
		return number + '_' + leaf;
		break;
	}
}

exports.download_file = download_file;
exports.sanitise = sanitise;
exports.clone_and_append = clone_and_append;
exports.mkdir = mkdir;
exports.mkfile = mkfile;
exports.get_leaf_from_url = get_leaf_from_url;
exports.get_leaf_complete = get_leaf_complete;

L('module initialised');
