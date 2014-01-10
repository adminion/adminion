
/**
 *	My goal is to create an ordered list of key/value pairs that provides some of the better 
 * parts of php's associative arrays in javascript using prototypical inheritence
 *
 * 	* an ordered list of key/value pairs
 *  * iterable by means of an internal pointer and helper methods
 * 	* 
 */

function AssociativeArray ( names, values ) {
	// the list of named elements
    this.elements = Object.create(null);

    // the order of the elements
    this.order = [];

    // a pointer to the current element
    this.pointer = 0;

    if (arguments.length) {
    	
	    // initialize the array with the given primitive list
	    // * names and values must be arrays of equal length
	    if ( (!Array.isArray(names) || !Array.isArray(values)) || names.length !== values.length) {
	 		
	 		throw new Error('names and values parameters must be arrays of equal length!');
	 	}

	 	// go through the list of names
	 	for (var i = 0; i < names.length; i += 1 ) {

	 		// create an element using each respective name/value pair
	 		this.set(names[i], values[i]);

	 	}
    }
}

function convertCleanly (value) {
	// returns whether or not the value will convert cleanly to a string



	return !!(typeof value === "object" && !Array.isArray(value))
};

////////////////////////////////////////////////////////////////////////////
//
// MUTATOR METHODS
//
////////////////////////////////////////////////////////////////////////////

/**
 *	Add a named element to the list
 *
 * If the key is not yet used in the list, add it to the end, 
 * otherwise, replace the existing value and preserver list order
 */ 
AssociativeArray.prototype.set = function (key, val) {
	// if the string doesn't evaluate to true
	if (!key) {

    	// if key's value converts to boolean false
		throw new Error('key must not evaluate to false!');
			
	}

	// convert key to a string
	key = String(key);


	
	// store the value in elements
	this.elements[key] = val;

	// if the key already exists, we're going to replace the value and 
	// preserve this.order rather than creating a new property

	// ask order if it has an element who's value matches key's
	// indexOf will give -1 if the value isn't found, but otherwise gives the numeric index
	var position = this.order.indexOf(key);

	// if the value of key was found, 
	if (position > -1) {
		// leave this.order alone, but set the internal pointer to the element after the one we just set
		this.pointer = position +1; 
	
	// however, if the key did not already exist,	
	} else {

    	// splice the key into this.order at whichever index the pointer points
    	this.order.splice(this.pointer, 0, key);

    	this.pointer +=1;

	}

	return this.order.length;
	
};

// pops the last element off the end and returns that element (right? whatever Array.pop() does...)
AssociativeArray.prototype.pop = function () {

};

////////////////////////////////////////////////////////////////////////////
//
// ITERATOR METHODS
//
////////////////////////////////////////////////////////////////////////////

AssociativeArray.prototype.start = function () {
	this.pointer = 0;

	return true;

};

AssociativeArray.prototype.fastForward = function () {
	this.pointer = this.count();

};

////////////////////////////////////////////////////////////////////////////
//
// ACCESSOR METHODS
//
////////////////////////////////////////////////////////////////////////////

AssociativeArray.prototype.get = function (key) {
	if (!!key) {
		if (convertCleanly(key)) {
			return this.elements[key];
		} 
	}
			
	var err = new Error('key must be a string');
	console.error(err);
	throw err;
	return false;
};

// returns the number of elements in the list
AssociativeArray.prototype.count = function () {
    return this.order.length;
};

// returns the first element
AssociativeArray.prototype.first = function () {
	
	var key = this.order[0];

	return this.elements[key];
};

// returns the last element
AssociativeArray.prototype.last = function () {

	var key = this.order[this.count()-1];

	return this.elements[key];
};
