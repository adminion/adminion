


var foo = ':global:';
console.log(foo);

function bar () {
	var foo = ':function:';
	console.log(foo);

	if (foo) {
		let foo = ':block:';
		console.log(foo);

	}

	console.log(foo);
};

bar();

console.log(foo);
