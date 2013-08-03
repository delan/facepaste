'use strict';

var {Cc, Ci, Cu, Cr} = require("chrome");
var lib_shared = require('./shared');
var lib_ui = require('./ui');
var L = lib_ui.log_for('download');

Cu.import("resource://gre/modules/FileUtils.jsm");
Cu.import("resource://gre/modules/PrivateBrowsingUtils.jsm");

var outdir = new FileUtils.File(lib_shared.prefs.outputDirectory);

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

function download_file(url, directory_file, success, failure) {
	// returns boolean: true = success/skip, false = failure
	var wbp = Cc['@mozilla.org/embedding/browser/nsWebBrowserPersist;1'].
		createInstance(Ci.nsIWebBrowserPersist);
	var ios = Cc["@mozilla.org/network/io-service;1"].
		getService(Ci.nsIIOService);
	var uri = ios.newURI(url, null, null);
	var leaf = get_leaf_from_url(url);
	var file = clone_and_append(directory_file, leaf);
	L('download_file:', url, '=>', file.path);
	if (file.exists()) {
		L('skipping because file exists:', file.path);
		return true;
	}
	if (!mkfile(file)) {
		return false;
	}
	wbp.progressListener = {
		onProgressChange: function() {},
		onLocationChange: function() {},
		onSecurityChange: function() {},
		onStatusChange: function() {},
		onStateChange: callback_onStateChange.
			bind(null, success, failure, wbp, file.path)
	};
	wbp.saveURI(uri, null, null, null, '', file, null);
	return true;
}

function callback_onStateChange(success, failure, wbp, path, wp, rq, sf, st) {
	if (wbp.currentState == wbp.PERSIST_STATE_FINISHED) {
		var chan = rq.QueryInterface(Ci.nsIHttpChannel);
		if (chan.requestSucceeded) {
			L('download success:', path);
			success(chan);
		} else {
			L('download failure:', path);
			failure(chan);
		}
	}
}

function callback_download_file_success(queue_item, queue_index, chan) {
	L('callback_download_file_success');
	queue_item.status = lib_shared.DOWNLOAD_STATUS.COMPLETE;
	this.active--;
	this.replenish();
}

function callback_download_file_failure(queue_item, queue_index, chan) {
	L('callback_download_file_failure');
	L(
		'reason for failure:',
		chan.responseStatus + ':',
		chan.responseStatusText
	);
	queue_item.status = lib_shared.DOWNLOAD_STATUS.ERROR;
	this.active--;
	this.replenish();
}

function DownloadManager() {
	this.queue = [];
	this.active = 0;
}

DownloadManager.prototype.replenish = function() {
	L('DownloadManager.replenish');
	for (var i = 0; i < this.queue.length; i++) {
		if (this.active >= lib_shared.DOWNLOAD_CONCURRENCY)
			break;
		if (this.queue[i].status == lib_shared.DOWNLOAD_STATUS.WAITING)
			this.download(i);
	}
};

DownloadManager.prototype.add_album = function(album) {
	L('DownloadManager.add_album');
	var that = this;
	album.media.forEach(function(medium, index_in_album) {
		if (medium.type != 'PHOTO' && medium.type != 'VIDEO')
			return;
		that.queue.push({
			url: medium.url,
			directory: clone_and_append(outdir, album.name),
			index_in_album: index_in_album,
			status: lib_shared.DOWNLOAD_STATUS.WAITING
		});
	});
	this.replenish();
};

DownloadManager.prototype.download = function(index) {
	L('DownloadManager.download');
	var item = this.queue[index];
	this.active++;
	item.status = lib_shared.DOWNLOAD_STATUS.ACTIVE;
	if (!download_file(
		item.url,
		item.directory,
		callback_download_file_success.bind(this, item, index),
		callback_download_file_failure.bind(this, item, index)
	)) {
		this.active--;
		item.status = lib_shared.DOWNLOAD_STATUS.ERROR;
		this.replenish();
	}
};

mkdir(outdir);

exports.DownloadManager = DownloadManager;

L('module initialised');
