var panel;

exports.handler = function(payload) {
	panel.port.emit('log', payload);
}

exports.log = function() {
	var args = [].slice.call(arguments);
	var source = args.shift();
	exports.handler({
		source: source,
		args: args
	});
};

exports.setPanel = function(p) {
	panel = p;
	panel.port.on('log', exports.handler);
};
