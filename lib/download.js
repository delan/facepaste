'use strict';

var {Cc, Ci, Cu, Cr} = require("chrome");
var lib_shared = require('./shared');
var lib_ui = require('./ui');
var {
	download_file,
	sanitise,
	clone_and_append,
	mkdir,
	mkfile,
	get_leaf_from_url,
	get_leaf_complete,
} =
	require('./dlhelpers');
var L = lib_ui.log_for('download');

Cu.import("resource://gre/modules/FileUtils.jsm");

var outdir = new FileUtils.File(lib_shared.prefs.outputDirectory);

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
	L('DownloadManager.replenish');
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
		var directory = clone_and_append(outdir, album.name);
		var leaf = get_leaf_complete(
			medium.url,
			index_in_album,
			album.media.length
		);
		var file = clone_and_append(directory, leaf);
		that.queue.push({
			url: medium.url,
			file: file,
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
		item.file,
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
