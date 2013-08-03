(function(global) {

'use strict';

var exports = {};

if (global.module && module.exports)
	module.exports = exports;
else
	global.$facepaste$shared$ = exports;

// preferences (main code only)

if (global.require) {
	var sdk_sp = require('sdk/simple-prefs');
	exports.prefs = JSON.parse(JSON.stringify(sdk_sp.prefs));
}

// enumeration generator

function enumeration() {
	var result = {};
	for (var i = 0; i < arguments.length; i++) {
		var key = arguments[i];
		result[i] = result[key] = {
			toString: (function(key) {
				return key;
			}).bind(null, key)
		};
	}
	return result;
}

// constants

exports.HOSTNAME = 'www.facebook.com';
exports.BASE_URL = 'https://' + exports.HOSTNAME + '/';
exports.DOWNLOAD_CONCURRENCY = 4;
exports.DOWNLOAD_STATUS = enumeration('WAITING', 'ACTIVE', 'COMPLETE', 'ERROR');
exports.DOWNLOAD_FILE_RET = enumeration('ACTIVE', 'ERROR', 'SKIP');

// functions

exports.J = function(thing) {
	return JSON.stringify(thing);
};

exports.P = function(thing) {
	return JSON.stringify(thing, null, '\t');
};

exports.Q = function() {
	/*
		// examples:
		// get all links in the document
		var allLinks = Q('a[href]');
		// get all links that are descendants of myNode
		var someLinks = Q(myNode, 'a[href]');
		// equivalent to allLinks.forEach(function(a) { ... });
		Q('a[href]', function(a) { ... });
		// equivalent to someLinks.forEach(function(a) { ... });
		Q(myNode, 'a[href]', function(a) { ... });
	*/
	var root = document;
	var selector;
	var callback;
	for (var i = 0; i < arguments.length; i++)
		switch (typeof arguments[i]) {
		case 'function':
			callback = arguments[i];
			break;
		case 'object':
			root = arguments[i];
			break;
		case 'string':
			selector = arguments[i];
			break;
		}
	var elements = root.querySelectorAll(selector);
	var array = Array.prototype.slice.call(elements);
	if (callback)
		array.forEach(callback);
	return array;
};

exports.begin_scrolling = function(callback) {
	var scroll_attempts = 0, scroll_events = 0;
	window.addEventListener('scroll', function() {
		scroll_events++;
	}, false);
	var timer = window.setInterval(function() {
		scroll_attempts++;
		window.scrollBy(0, 1000);
		if (scroll_attempts > scroll_events + 50) {
			window.clearInterval(timer);
			if (callback)
				callback();
		}
	}, 100);
};

exports.enumeration = enumeration;

})(this);
