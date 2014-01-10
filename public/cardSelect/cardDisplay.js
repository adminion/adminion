var selectedCards = [];

//a function to select a random selection of cards from a certain source into a certain destination
function selectRandom(source, destination) {
	
//cardNum is set equal to the number set by the user on the config page. it determines how many cards get chosen
	var cardNum = document.cardNum.number.value;

//goes through for each number from 0-cardNum
	for (i = 0; i < cardNum; i++) {

//a random card index is chosen out of the source set of cards
		var random = Math.floor(Math.random()*source.length);

//the randomly chosen card from the source is pushed into the destination
		destination.push(source[random]);

//in order to prevent choosing the same card more than once, once the chosen card is pushed to its destination, it is spliced out of the source array
		source.splice(random, 1);
	}
}

//variables dealing with the ensure functions. these will essentially act as switches for telling if these specific conditions are met
var ACTION = false;
var BUY = false;
var CARD = false;
var twoACTION = false;
var TRASHING = false;

//chooseRandom is separate from selectRandom, in that chooseRandom() is run when the 'choose' button is clicked while the "random" choice is checked
function chooseRandom() {

//populates an array of cards to choose from
	createChoices();

//from that created array(selectedCards), random cards are selected to be pushed into CHOSEN array
	selectRandom(selectedCards, CHOSEN);
}



//this function creates an array (selectedCards) consisting of the cards from the selected sets from which to choose cards from
function createChoices() {

//reset the selectedCards array, in case the function is run more than once in an instance
	selectedCards = [];

//creates an array containing the names of all the sets that the user wants to choose from. later on can be important for stat collecting
	var selectedSets = [];

//creates a variable containing all the checkboxes of expansion names
	var sets = document.selectedSets.set;

//for each expansion set
	for (i=0;i<sets.length;i++) {

//if it is checked off by the user
	  if (sets[i].checked) {

//the name of the expansion set is pushed into the selectedSets array
    	selectedSets.push(sets[i].value);

//an array setName is created by evaluating the name of the expansion set. in cards.js there are arrays of cards that correspond with each expansion set name
			var setName = eval(sets[i].value);

//for each card in that given expansion set
			for (var each in setName) {
				console.log(setName[each]);
//a property 'origin' is added to that card, based on the name of the expansion set that the card originated from. this can be later used when referencing chosen card sets. like if user wants to know more about the set of cards they played with, they could check and see 'oh, this one had 5 cards from seaside,3 from intrigue, 2 from base set' or whatnot
				setName[each].origin = sets[i].value;

//the card is pushed into the selectedCards array, which is the end product of this function. 
				selectedCards.push(setName[each]);
			}
    }
  }

	separatePrice(selectedCards);
	CHOSEN = [];
}

//an array to collect the values of the different ensure functions, to tell if all conditions were met or not
var ensure = [];

//this function runs when the "choose" button is clicked
function chooseCards() {

//if RANDOM method of 'choose' is selected
	if (document.choose.type[0].checked == true) {

//utilizing do/while loop, because we want this list of functions to run once regardless of the condition being met
		do {

//starts off by choosing random cards
			chooseRandom();

//resets the ensure array to contain nothing, in case this function has to run more than once
			ensure = [];

//runs all 'ensure' functions. the actual functions' doing anything depends on if the corresponding checkboxes are marked or not.
//each 'ensure' function(if checked off) will add a boolean value to the ensure array based on if its corresponding condition is met or not
			ensureAction();
			ensureBuy();
			ensuretwoActions();
			ensureTrashing();
			ensureCard();
		}

//once ensure is populated from the above functions, if the array contains a false value, the whole loop is repeated. this continues until all ensure conditions are met. this makes sure that all conditions are met, and cannot continue with the card display portion of the function until all user-chosen conditions are met
		while (ensure.indexOf(false) != -1);
	}

//once an adequate set of cards is chosen and gets past the 'ensure' test, the cards are prepared for display by being sorted by cost
	sortByCost();

//creates a variable cardbox, which refers to the div in the page by the ID 'chosenCards'
	var cardbox = document.getElementById("chosenCards");

//the contents of cardbox is reset, in case the user chooses to rechoose cards. without this, the new chosen cards would just stack on top of the old
	cardbox.innerHTML = "";

//for each card in the array of chosen cards, CHOSEN
	for (var each in CHOSEN) {
		$('<div class = "card"><img src = '+CHOSEN[each].image+'></div>')
		.appendTo($('#chosenCards'));
	}	
}
var CHOSEN = [];

function newRandomCard() {

	var random = Math.floor(Math.random()*selectedCards.length);

//the randomly chosen card from the source is pushed into the destination
		CHOSEN.push(selectedCards[random]);

//in order to prevent choosing the same card more than once, once the chosen card is pushed to its destination, it is spliced out of the source array
		selectedCards.splice(random, 1);

	var newCard = CHOSEN[CHOSEN.length-1];	
	$('<div class = "card"><img src = '+newCard.image+'></div>')
	.appendTo($('#chosenCards'));

}
//sorts CHOSEN into ordered array, based on card-cost
function sortByCost() {

//separates by price all cards in CHOSEN
	separatePrice(CHOSEN);

//for each cost 
			var newarray = [];
	for(i=0;i<12;i++) {
		// for each cost in the costs array 
		for (var cost in costs[i]) {
			
			newarray.push(costs[i][cost]);
		}
	}

	CHOSEN = newarray;
}

	var costs = {};
//SEPARATES ALL CARDS INTO COST-BASED ARRAYS
function separatePrice(cardSet) {

	costs = {};
	var MAX_COST = 12;
// create cost storage containers	
	for (var cost=0; cost<MAX_COST; cost++) {
		costs[cost] = [];


	}
	costs.posh= [];
// go through cards and fill up containers
	for (var card = 0; card<cardSet.length; card++) {


		if (typeof cardSet[card].cost == 'number') {
//push the card from the cardSet into the corresponding cost's array inside the costs object based on the cost of the card from the cardSet

			costs[cardSet[card].cost].push(cardSet[card]);


		}
// if cost contains potion, push into potion container
		else {
			costs.posh.push(cardSet[card]);
		}
	}

}

var GAMECARDS = []

//this function is run when the 'START GAME' button is clicked. it is meant to run once the user has chosen a satisfactory card set.  the first portion of the function is dedicated to gathering the treasure and victory cards that the user has chosen, via checkboxes
function startGame() {
	var cardNames = [];
	$.each(CHOSEN, function(index) {
		cardNames.push(this.name);
	});

	localStorage.setItem('kingdomcards', JSON.stringify(cardNames));

//creates an array treasures containing the names of all the treasure cards that are checked on/off
	var treasures = document.treasure.type;

//same thing for victory checkboxes
	var victory = document.victory.type;	

//creates an array of cards to add to the game
	var treasuresUsed = [];

//for each treasure name in the treasures array
	for (i=0;i<treasures.length;i++) {

//if the treasure is checked
	  if (treasures[i].checked) {

//loop through the Treasure array, which is located in cards.js and contains allll the treasure cards and their properties
			for (var j=0;j<Treasure.length;j++) {

//if the checked treasure is equal to the name of the Treasure card
				if (treasures[i].value == Treasure[j].name) {

//push the Treasure object into the addCards array, as it is a treasure card that the user has chosen to play with
					treasuresUsed.push(Treasure[j]);

//log it
					console.log(Treasure[j].name);
				}
			}
    }
  }

//repeat for victory cards too
	var victorysUsed = [];
	for (i=0;i<victory.length;i++) {
	  if (victory[i].checked) {
			for (var j=0;j<Victory.length;j++) {
				if (victory[i].value == Victory[j].name) {
					victorysUsed.push(Victory[j]);
					console.log(Victory[j].name);

				}
			}
    }
  }
//	for (var each in CHOSEN) {
//		kingdomCards.push(CHOSEN[each]);
//	}


}
//this function will ensure that the chosen cards will have at least one card that gives the player +1 Action or +2 Actions
function ensureAction() {

//the function will only do anything if the corresponding checkbox is checked
	if (document.cardType.action.checked == true) {

//set ACTION to false initially in order to reset the switch from the last time it was run
		ACTION = false;

//go through each card to see if it is a card that gives you extra actions. if there is at least one found in the CHOSEN cards, the ACTION switch is flipped on (ACTION = true). the other ensure functions are formatted the same way
		for (var each in CHOSEN) {

			if (CHOSEN[each].instructions.indexOf("+1 Action") != -1 || CHOSEN[each].instructions.indexOf("+2 Actions") != -1 ) {
				ACTION = true;			
			}
		}

// the value of ACTION is pushed into the ensure array, which will collect all the needed ensurance values. later on, cards will be rechosen unless all ensurance values are true.
		ensure.push(ACTION);
	}
}

function ensureBuy() {
	if (document.cardType.buy.checked == true) {
		BUY = false;
		for (var each in CHOSEN) {
			if (CHOSEN[each].instructions.indexOf("+1 Buy") != -1 || CHOSEN[each].instructions.indexOf("+2 Buys") != -1 ) {
				BUY = true;			
			}
		}
		ensure.push( BUY);
	}
}

function ensureCard() {
	if (document.cardType.card.checked == true) {
		CARD = false;
		for (var each in CHOSEN) {
			if (CHOSEN[each].instructions.indexOf("+1 Card") != -1 || CHOSEN[each].instructions.indexOf("+2 Cards") != -1 || CHOSEN[each].instructions.indexOf("+3 Cards") != -1 || CHOSEN[each].instructions.indexOf("+4 Cards") != -1 || CHOSEN[each].instructions.indexOf("+5 Cards") != -1) {
				CARD = true;			
			}
		}
		ensure.push(CARD);
	}
}

function ensureTrashing() {
	if (document.cardType.trash.checked == true) {
		TRASHING = false;
		for (var each in CHOSEN) {
			if (CHOSEN[each].instructions.indexOf("trash a") != -1 || CHOSEN[each].instructions.indexOf("Trash a") != -1 || CHOSEN[each].instructions.indexOf("Trash up to") != -1 ) {
				TRASHING = true;			
			}
		}
	ensure.push(TRASHING);
	}
}

function ensuretwoActions() {
	if (document.cardType.twoActions.checked == true) {
		twoACTION = false;
		for (var each in CHOSEN) {
			if (CHOSEN[each].instructions.indexOf("+2 Actions") != -1 ) {
				twoACTION = true;			
			}
		}
		ensure.push(twoACTION);
	}
}
  var kingdomCards = [];
