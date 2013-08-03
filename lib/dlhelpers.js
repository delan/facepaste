'use strict';

var {Cc, Ci, Cu, Cr} = require("chrome");
var lib_shared = require('./shared');
var lib_ui = require('./ui');
var L = lib_ui.log_for('dlhelpers');

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

exports.sanitise = sanitise;
exports.clone_and_append = clone_and_append;
exports.mkdir = mkdir;
exports.mkfile = mkfile;
exports.get_leaf_from_url = get_leaf_from_url;

L('module initialised');
