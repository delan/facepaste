'use strict';

var {Cc, Ci, Cu, Cr} = require("chrome");
var lib_shared = require('./shared');
var lib_ui = require('./ui');
var {sanitise, clone_and_append, mkdir, mkfile, get_leaf_from_url} =
	require('./dlhelpers');
var L = lib_ui.log_for('download');

Cu.import("resource://gre/modules/FileUtils.jsm");

var outdir = new FileUtils.File(lib_shared.prefs.outputDirectory);

function download_file(url, directory_file, success, failure) {
	var wbp = Cc['@mozilla.org/embedding/browser/nsWebBrowserPersist;1'].
		createInstance(Ci.nsIWebBrowserPersist);
	var ios = Cc["@mozilla.org/network/io-service;1"].
		getService(Ci.nsIIOService);
	var uri = ios.newURI(url, null, null);
	var leaf = get_leaf_from_url(url);
	var file = clone_and_append(directory_file, leaf);
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
			bind(null, success, failure, wbp, file.path)
	};
	wbp.saveURI(uri, null, null, null, '', file, null);
	L(
		'download_file: return value:',
		String(lib_shared.DOWNLOAD_FILE_RET.ACTIVE)
	);
	return lib_shared.DOWNLOAD_FILE_RET.ACTIVE;
}

function callback_onStateChange(success, failure, wbp, path, wp, rq, sf, st) {
	// The first two arguments are callbacks passed through download_file
	// from its call in DownloadManager.download. The following two are
	// internal state (wbp and file.path respectively) from download_file.
	// The remaining four arguments are provided by nsIWebBrowserPersist as
	// state change information for this callback.
	L('callback_onStateChange');
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
	this.set_status(queue_index, lib_shared.DOWNLOAD_STATUS.COMPLETE);
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
	this.set_status(queue_index, lib_shared.DOWNLOAD_STATUS.ERROR);
	this.active--;
	this.replenish();
}

function DownloadManager() {
	this.queue = [];
	this.active = 0;
}

DownloadManager.prototype.replenish = function() {
	var num_started = 0;
	for (var i = 0; i < this.queue.length; i++) {
		var item = this.queue[i];
		if (this.active >= lib_shared.DOWNLOAD_CONCURRENCY)
			break;
		if (item.status == lib_shared.DOWNLOAD_STATUS.WAITING) {
			this.download(i);
			num_started++;
		}
	}
	L('DownloadManager.replenish: started', num_started, 'downloads');
};

DownloadManager.prototype.add_album = function(album) {
	L('DownloadManager.add_album');
	var that = this;
	album.media.forEach(function(medium, index_in_album) {
		if (medium.type != 'PHOTO' && medium.type != 'VIDEO')
			return;
		L(
			'DownloadManager.add_album:',
			'queue[' + (that.queue.length) + ']',
			'=>',
			medium.url
		);
		that.queue.push({
			url: medium.url,
			directory: clone_and_append(outdir, album.name),
			index_in_album: index_in_album,
			status: lib_shared.DOWNLOAD_STATUS.WAITING
		});
	});
	this.replenish();
};

DownloadManager.prototype.set_status = function(index, status) {
	var item = this.queue[index];
	item.status = status;
	L(
		'DownloadManager.set_status:',
		String(item.status)
	);
}

DownloadManager.prototype.download = function(index) {
	L('DownloadManager.download');
	var item = this.queue[index];
	this.active++;
	this.set_status(index, lib_shared.DOWNLOAD_STATUS.ACTIVE);
	var return_value = download_file(
		item.url,
		item.directory,
		callback_download_file_success.bind(this, item, index),
		callback_download_file_failure.bind(this, item, index)
	);
	switch (return_value) {
	case lib_shared.DOWNLOAD_FILE_RET.ACTIVE:
		// do nothing
		break;
	case lib_shared.DOWNLOAD_FILE_RET.SKIP:
		this.set_status(index, lib_shared.DOWNLOAD_STATUS.COMPLETE);
		this.active--;
		break;
	case lib_shared.DOWNLOAD_FILE_RET.ERROR:
		this.set_status(index, lib_shared.DOWNLOAD_STATUS.ERROR);
		this.active--;
		break;
	}
	this.replenish();
};

mkdir(outdir);

exports.DownloadManager = DownloadManager;

L('module initialised');
