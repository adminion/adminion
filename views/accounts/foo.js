
function passwordsMatch () {
	if ($('password').value === $('verifyPassword').value) {
		return true;
	} else {
		return false;
	}
};

$(document).ready(function() {
	$('#password').on('mouseup', function () {
		if (passwordsMatch()) {
			// set backgrounds to green
		} else {
			// set backgrounds to red
		}
	}); 
	$('#verifyPassword').on('mouseup', function () {
		if (passwordsMatch()) {
			// set backgrounds to green
		} else {
			// set backgrounds to red
		}
	});


	$('#updateAccount').on('submit', function (event) {
		if (!passwordsMatch()) {
			// i don't know if this is the correct syntax... but you get the jist. 
			console.error('passwords do not match!');
			event.preventDefault();
		} else {
			return true;
		}
	});
});