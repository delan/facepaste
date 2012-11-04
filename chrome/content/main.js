Components.utils.import("resource://gre/modules/NetUtil.jsm");
Components.utils.import("resource://gre/modules/FileUtils.jsm");

(function(a) {
	var Cc = Components.classes;
	var Ci = Components.interfaces;
	var d = document; // XUL dialog document
	var w = a.content; // content window
	var cd = w.document; // content document
	var album; // album information object
	var max_progress_row = 40; // width of progress map
	var in_last_progress_row = 40; // number of images in last row
	var last_progress_row; // DOM object of last progress row box
	var max_in_progress = 8; // maximum number of active images
	var in_progress = 0; // number of active images
	var num_done = 0; // number of completed images
	var output_directory; // nsIFile with the output directory
	var poll_interval; // setInterval timer ID
	var zero_pad_string; // string to pad photo numbers with zeros
	function _(array_like) {
		return Array.prototype.slice.call(array_like);
	}
	function log(string) {
		d.querySelector('#facepaste-status').value = string;
	}
	function progress(i, progress) {
		album[i].progress = progress;
		d.querySelectorAll('#facepaste-progress-box .facepaste-progress')[i].
			className = 'facepaste-progress facepaste-progress-' + progress;
	}
	function ajax(url, binary, type, callback, callback_data) {
		var r = new XMLHttpRequest;
		r.onload = function() {
			callback(r.response, r, callback_data);
		};
		r.open('GET', url);
		/*
			this is disgusting and I'd prefer to just use a responseType of
			blob or arraybuffer, but I can't find anything in the Firefox addon
			API to turn these into a stream that can be used to write to a file.
		*/
		if (binary)
			r.overrideMimeType('text/plain; charset=x-user-defined');
		r.responseType = type;
		r.send(null);
	}
	function choose_directory() {
		var picker = Cc["@mozilla.org/filepicker;1"].
			createInstance(Ci.nsIFilePicker);
		picker.init(window, 'Choose a directory to download photos to',
			Ci.nsIFilePicker.modeGetFolder);
		var retval = picker.show();
		if (retval == Ci.nsIFilePicker.returnOK)
			return picker.file;
	}
	function write_file(name, data) {
		var file = output_directory.clone();
		file.append(name);
		var istream = Cc["@mozilla.org/io/string-input-stream;1"].
			createInstance(Ci.nsIStringInputStream);
		var ostream = FileUtils.openSafeFileOutputStream(file);
		istream.data = data;
		NetUtil.asyncCopy(istream, ostream);
	}
	function start() {
		poll_interval = setInterval(function() {
			var done_in_this_round = 0;
			album.forEach(function(p, pi) {
				if (p.progress == 'waiting' && in_progress < max_in_progress) {
					progress(pi, 'preparing');
					// ajax(p.pageurl, false, 'document', handle_page, pi);
					ajax(p.pageurl, false, '', handle_page, pi);
					in_progress++;
				} else if (p.progress == 'complete') {
					done_in_this_round++;
				}
			});
			if (done_in_this_round == album.length)
				all_done();
		}, 1000);
	}
	function all_done() {
		clearInterval(poll_interval);
		document.getElementById('facepaste-closecancel').label = 'Close';
	}
	function handle_page(res, req, pi) {
		progress(pi, 'downloading');
		album[pi].imageurl = res.match(
			/<a class="fbPhotosPhotoActionsItem" href="([^"]+)" rel="ignore">/
		)[1];
		ajax(album[pi].imageurl, true, '', handle_image, pi);
	}
	function handle_image(res, req, pi) {
		progress(pi, 'complete');
		// name photos according to their order in the album for easy sorting
		write_file(
			(zero_pad_string + (pi + 1)).slice(-zero_pad_string.length) +
			'.jpg', res); // at the moment, Facebook photos are always JPEG
		in_progress--;
		num_done++;
		log('Downloaded ' + num_done + ' of ' + album.length + ' images');
	}
	d.querySelector('#facepaste-title').setAttribute('title',
		cd.querySelector('title').textContent);
	album = _(cd.querySelectorAll(
		'a.uiMediaThumb:not(.uiMediaThumbAlb):not(.albumThumbLink)')).
		map(function(l) {
		if (in_last_progress_row == max_progress_row) {
			last_progress_row = d.createElement('box');
			last_progress_row.setAttribute('orient', 'horizontal');
			d.querySelector('#facepaste-progress-box').
				appendChild(last_progress_row);
			in_last_progress_row = 0;
		}
		var progress_dot = document.createElement('box');
		progress_dot.className =
			'facepaste-progress facepaste-progress-waiting';
		last_progress_row.appendChild(progress_dot);
		in_last_progress_row++;
		return { pageurl: l.href, progress: 'waiting' };
	});
	zero_pad_string = Array(1 + String(album.length).length).join('0');
	output_directory = choose_directory();
	if (output_directory)
		start();
	else
		window.close();
})(arguments[0]);
