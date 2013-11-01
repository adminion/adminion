
function make_promise () {

	var status = 'unresolved',
		outcome,
		waiting = [],
		dreading = [];

	function vouch (deed, callback) { 
		switch (status) {
			case 'unresolved':
				(deed === 'fulfilled' ? waiting : dreading).push(callback);
				break;

			case deed:
				callback(outcome);
				break;
		}
	};

	function resolve (deed, value) { 
		if ( status !== 'unresolved') {
			throw new Error('The promise has already been resolved: ' + status);
		}

		status = deed;
		outcome = value;

		(deed === 'fulfilled' ? waiting : dreading)
				.forEach(function (callback) {
			try {
				callback(outcome);
			} catch (ignore) {}

		});

	};

	return {
		when: function (callback) {
			vouch('fulfilled', callback);
		},

		fail: function (callback) {
			vouch('smashed', callback);
		},

		fulfill: function (value) {
			resolve('fulfilled', value);
		},
		smash: function (string) {
			resolve('smashed', string)
		}
	};
}