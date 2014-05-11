
/**
 * application flow: 
 *   1) host starts server, shares address with clients
 *   2) host sets game configuration with input from clients while connecting,
 *   3) when all connected clients say "i'm ready!" host starts game:
 *     a) pick and generate Random cards
 *     b) generate players
 *     c) deal starting decks
 *   4) when game loop completes, announce the Winner
 *   5) display game stats, and options to "play again" and "edit game config"
 *   6) host can kill the server at any time
 * 
 */
var gameConfig = {
    numPlayers:2,
    cards: { treasure : [], victory : [], action : [] },
    numPiles:10,
    piles:[],
    exhausted : [],
    exhaustLimit : 1

};
function startGame(config) {
    // load the adminion module
    var Game = new require(['adminion']);
        
    return Game(config);
    

};
console.log(gameConfig);
var exhausted = 0;
var players = ['zane'];
//later on, establish a way to set # of players and their names, and add them to players list
var trash = [];

function generatePlayer(name) {
    return {
        id : 0,
        Name: name,
        deck: [],
        actions:1,
        buys:1,
        money:0,
        victory:0,
        hand: [],
        discard:[]
    };
}

// cardLog will keep track of all the cards that were gained throughout the game. this will be useful with cards like Treasury, Smugglers, etc. STILL NEEDS WORK!
var cardLog = [];

// function to reveal a card, to every player in the game
function reveal(player, card) {

}

// function to look at a card, to just a select player
function cardLook(player, whichCard, number) {
	statusUpdate(player);
	var count = 0;
	var lookbox = document.getElementById('lookBox');
	lookbox.innerHTML = '<button id = "lookboxButton1" </button> <button id = "lookboxButton2" </button>';
	if (player.deck.length === 0) {
		console.log('drawUntil( no cards in deck! run shuffleDeck()');
		shuffleDeck(player);
	}
	if (number > count) {

		console.log('cardLook( running');
		// grab the yet to be made element, lookBox, to later add the image of the card revealed

		console.log('cardLook( make lookbox visible');
		lookbox.style.display = 'inline-block';
		// depending om which card is to be looked at (top card of deck, bottom card of deck, etc) the var card is set
		var card = whichCard;

		console.log(card);
		addImage('100px', '5px', card.image, lookbox, 'card');


		var button1 = document.getElementById('lookboxButton1')

		button1.innerHTML = 'discard card';

		button1.onclick = function() {
			console.log('button1.onclick( PLAYER chooses to put ' + card.name + ' into discard pile');
			player.discard.push(card);
			statusUpdate(player);

		

			console.log('button1.onclick( run drawUntil() again');
			cardLook(player, player.deck.shift(), number);
			console.log('button1.onclick( lookbox disappear');
		}

		var button2 = document.getElementById('lookboxButton2')

		button2.innerHTML = 'put card in hand';

		button2.onclick = function() {
			console.log('button1.onclick( PLAYER chooses to put ' + card.name + ' into hand');
			player.hand.push(card);
			updateHand(player);
			number = number -1;
			console.log('run cardlook() again with number: ' + number);
			cardLook(player, player.deck.shift(), number);
			// reset lookbox to be just buttons, no card

			// if draw until numbers are met: reset lookbox to disappear

		}
	}
	else {
		lookbox.style.display = 'none';
		actionCheck(player);
	}
	console.log('cardLook( ending');
}

// a function to choose cards from a players hands, for specific actions ('trash a card'), reactions('gain a card per discarded'), and howmany to do
function choose(player, action, howMany, reaction, conditions, buttonChoice) {
	console.log('===( action: ' + action + ', howMany: ' + howMany + ', reaction: ' + reaction + ', conditions: ' + conditions + ', buttonChoice: ' + buttonChoice);

	//  a function for applying the reaction of the card-choosing (draw per chosen, etc)
	function applyReaction(reaction) {

		// if the reaction is to draw a card 														
		if (reaction === 'draw') {
			console.log('===( applyReaction( reaction is to draw:');

			// loops through as many times as cards were chosen (thisMany)							
			for (var i = 1; i <= thisMany; i += 1) {

				// and draws a card for each one 													
				action = false;
				console.log('===( applyReaction( run drawCard() for the ' + i + 'th time');
				drawCard(player, true);
			};
		}

		// if you are gaining money from the reaction, 											
		else if (reaction.indexOf('money') != -1) {

			// creates a multiplier based on the last character of reaction (a number, hopefully, inputted in with the card.action)													
			var multiplier = reaction[reaction.length-1]

			// the money gained is equal to thisMany * the multiplier gleaned from the function call
			, moneyz = thisMany * multiplier;

			console.log('===( applyReaction( reaction is to gain money: gain ' + moneyz + ' moneys');

			// add corresponding moneyz amount to player's money
			player.money += moneyz;
		}

		// KEY: 
		//			reaction[0] = 'gain'
		//			reaction[1] = the cost differential that you seek (+3, -2, etc.)
		// 			reaction[2] = the type of card, if any specific, that you seek to gain (action, treasure, victory)
		//			reaction[3] = the location that the card will go to (hand, discard, deck)
		else if (reaction[0] === 'gain') {

			// costModifier is gotten from the card, and adds or subtracts a certain amount from the original cost
			// (something that costs 1 more, 2 more, 3 less, etc)
			var costModifier = reaction[1]
			, 	cost = chosen[0].cost + costModifier
			
			// if the type of card specified is treasure, run setGainable with the treasure property, otherwise, run normally
			if (reaction[2] === 'treasure') {
				setGainable(player, cost, false, 'treasure', reaction[3]);
			}

			else {
				setGainable(player, cost, false, false, reaction[3]);
			}
		}
		turnClickOff();
	}

	// a function to apply the action of the chosen cards, given what action, and what card element
	function applyAction(action, card){
		$("#playerCards img").unbind();

		var cardArray = $.makeArray($("#playerCards img"))
		,	index = cardArray.indexOf(card)
		,	cardObject = player.hand[index];

		chosen.push(cardObject);

		switch (action) {
			case 'discard':
				console.log('===( applyAction( action is to discard, run discardCard() on ' + cardObject.name);
				// discard this card, according to the card element given
				discardCard(player, index);
			break;
			case 'trash':
				console.log('===( applyAction( action is to trash, run trashCard() on ' + cardObject.name);
				// trash this card!
				trashCard(player, card, 'hand');
			break;
			case 'play': 
				var timesPlayed = parseInt(action[action.length-1]);

				// grabs the inPlay element
				var inPlay = document.getElementById('inPlay');

				playCards.push(cardObject);

				console.log('playCard( add ' + cardObject.name + ' to inPlay element');	
				// adds the image of the played card to the inPlay element
				addImage('70px', '5px', cardObject.image, inPlay, 'inPlayCard', 'play'+playCard.length);


				console.log('applyAction( splice ' + cardObject.name + ' from player.hand');
				// splice the card from the player's hand
				player.hand.splice(index, 1);
				updateHand(player);

				for (var k = 0; k < timesPlayed; k ++) {
					console.log('appplyAction( ' + cardObject.name + '.action run');
					cardObject.action(player);
					statusUpdate(player);
				}
			break;
			case 'move':
				switch (reaction) {

					// if it calls for moving the card to the top of the deck:
					case 'deck0':

						// splice cardObject into the beginning of the deck and remove it from the players hand
						player.deck.splice(0,0, cardObject);
						player.hand.splice(index, 1);
						updateHand(player);
					break;
				}
			break;
		}

		// adds 1 to thisMany, a counter for counting how many cards have been chosen
		thisMany += 1;
		console.log('===( applyAction( ++ to thisMany is: '+thisMany);
	}

	// a function to add the onclick event of (CHOICE) to all the cards in the hand	
	function addOnclick(player) {

		if (typeof conditions === 'object') {
			// if conditions is presented as an object, it will be in this format:
			// conditions[0] = conditions
			// conditions[1] = what to do if conditions dont exist...
			console.log('its an array!');
			var endConditions = conditions[1];
			conditions = conditions[0];

		}
		// sets wrapped set equal to a wrapped set of all the img's in playercards
		var count = 0
		,	wrappedSet = $('#playerCards>img')

			// then filters that wrapped set to match conditions, if given by original command
			.filter( function(index) {
		
				// runs a switch statement if there are conditions to be followed
				if (conditions !== 'none') {
					switch (conditions) {

						// when statement returns false, the item in the wrapped set is removed from the wrapped set
						case 'copper': 
							return (this.id === 'Copper') ? true : false;
						break;

						case 'action':
							return (this.className === 'Action') ? true : false;
						break;

						case 'treasure':
							return (this.className === 'treasure') ? true : false;						
						break;

						case 'Estate':
							return (this.id === 'Estate') ? true : false;
						break;
						// by this time, if there are conditions to be met, only cards who meet the conditions will be in the wrapped set
					}
				}

				// if there are no conditions, return true for all the cards
				else {
					return true;
				};
			});

		// if the wrapped set contains anything,
		if (wrappedSet.length !== 0) {
			wrappedSet

			// add the 'handSelect' class to the cards in the set
			.addClass('handSelect')
			.bind('click', function() {
				
				// and then add a click function to the card to apply the action upon the given card
				applyAction(action, this);
				console.log(this.id + ' onclick( run applyAction()');

				// and then check how many have occurred, to see if we need to run it again
				howManyCheck(howMany);
			});
		}
		// if the wrapped set is empty:
		else {

			// we revert to the end conditions given by the card
			console.log('end conditions!' + endConditions);
			switch (endConditions) {

				// in the case of 'gain', we gain the card that the conditions was checking for, and gain it into player.discard
				case 'gain':
					gainCard(conditions, player, 'discard');
				break;
			}
		}

		// if there's no more cards in the player's hand
		if (player.hand.length === 0) {

			// re-enable the buy and cleanup buttons
			document.getElementById('clean').disabled = false;
			document.getElementById('buy').disabled = false;

			// check for more actions!
			actionCheck(player);	
			return;
		}
	}

	// function to turn the clicks off
	function turnClickOff() {
		// unbind all events from the player's card imgs
		$('#playerCards img').unbind(); 
	}

	// a function to check if the amount of cards chosen is adequate or not to keep choosing! 
	function howManyCheck(howMany) {

// EXAMPLE: a card allows for discarding 2 cards- if you've only discarded 1 so far, the  howManyCheck 
// will check to see if another onclick event should be added to the refreshed  playerhand, and since 
// thisMany would be 1, and howMany = 2, howManyCheck will add another round of onclick events to the player hand 

		// if you do run out of cards in your hand to action upon, there are events set into place:
		if (player.hand.length === 0) {

			console.log('===( howManyCheck( player.hand is out of cards, run applyReaction()');
			// apply reaction with curent thisMany times!
			applyReaction(reaction);

			console.log('===( howManyCheck( hide button');
			// hide the button!
			$('#doneDiscarding').hide().unbind();

			console.log('===( howManyCheck( run actionCheck()');

			// re-enable the buy and cleanup buttons
			document.getElementById('clean').disabled = false;
			document.getElementById('buy').disabled = false;

			// check for more actions!
			actionCheck(player);	
			return;
		}

		// if howMany is infinite ( = 0), the onclick event will be added no matter what thisMany is,
		//	until a user button is pushed to end the choosing process or you run out of cards
		if (howMany === 0) {
			console.log('===( howManyCheck( infinit howManys: run addOnclick()');
			addOnclick(player);
		}

		// in that case, if thisMany is under howMany(ok to go!), the click events will be added again
		else if (thisMany < howMany) {
			console.log('===( howManyCheck( ' + thisMany + ' is less than ' + howMany + ': run addOnclick()');
			addOnclick(player);
		}

		// if you've chosen the maximum amount to be chosen
		else if (thisMany == howMany) {

			console.log('===( howManyCheck( run applyReaction()');
			// apply reaction with curent thisMany times!
			applyReaction(reaction);

			if (buttonChoice) {
				console.log('===( howManyCheck( hide the button');
				// hide the button!
			$('#doneDiscarding').hide();
			}
				
			// re-enable the buy and clean buttons,
			document.getElementById('clean').disabled = false;
			document.getElementById('buy').disabled = false;

			if (reaction.indexOf('gain') == -1) {
				// check for more actions!
				actionCheck(player);			
			}
		}
	}
	//////////////////////////////////////////////////////////////////////////////////////
	//////					BEGINNING OF CHOOSE() FUNCTION 							//////
	//////////////////////////////////////////////////////////////////////////////////////

	// 	an array to store the cards that get chosen, for access later
	var chosen = [];
	// creates thisMany, to keep track of how many cards have been chosen and actioned upon
	var thisMany = 0;
	// if the player's hand is empty, and there is nothing to choose upon,
	if (player.hand.length === 0) {

		// re-enable the buy and clean buttons,
		document.getElementById('clean').disabled = false;
		document.getElementById('buy').disabled = false;

		// perform actioncheck
		actionCheck(player);

		// get out of the function and return to play
		return;	
	}

	// disables the clean and buy button, so the player can't escape from the choose function
	document.getElementById('clean').disabled = true;
	document.getElementById('buy').disabled = true;



	if (buttonChoice) {

		// grabs the button that says 'done discarding?', toggles it to visible, and sets its html to fit the action prescribed
		$('#doneDiscarding').toggle().html('Done '+ action + 'ing?');

		console.log('===( assign onclick function to button');

		// change the button's behavior:
		// it will be a user option for pretty much ending the chosen function 

		$('#doneDiscarding').click(function() {

			console.log('button onclick( run applyReaction()');
			////// apply the given reaction 
			applyReaction(reaction);

			console.log('button onclick( make button disappear');
			//////make the button disappear..
			////// for now!
			$(this).hide().unbind();


			console.log('button onclick( run actionCheck()');
			//////carry on with the action phase!
			updateHand(player);

			// turn the cleanup and buy buttons back on
			document.getElementById('clean').disabled = false;
			document.getElementById('buy').disabled = false;

			actionCheck(player);
		});
	}
	console.log('adding on click soon...');
	////// add the onlick events to the cards, so that player can start choosing!
	addOnclick(player);

	//////////////////////////////////////////////////////////////////////////////////////
	//////						END OF CHOOSE() FUNCTION							//////
	//////////////////////////////////////////////////////////////////////////////////////
}

////// INTRIGUE FUNCTIONS


// a function for choosing what an action card is going to do, with an array of choices and how many to choose from
function chooseAction(player, choices, number) {

	function executeChoices(player, choices) {

		for (var each in choices) {

			// if there is a + in the choice, 
			if (choices[each].indexOf('+') != -1) {

				// the variable count is used to store the integer located within the character following the + in the choice 
				// EXAMPLE: '+5' turns into just the usable #, 5
				var count = parseInt(choices[each][choices[each].indexOf('+')+1]);
			}

			// if the word 'card' is in the choice, and it doesn't have the word 'trash', go ahead and draw cards equal to the count #
			if (choices[each].indexOf('card') != -1 && choices[each].indexOf('Trash') == -1) {
				for (var i = 0; i < count; i ++) {
					drawCard(player, true);
				}
				
			}

			else if (choices[each].indexOf('action') != -1) {
				player.actions += count;
				console.log('added actions');

			}

			else if (choices[each].indexOf('buy') != -1) {
				player.buys += count;
				console.log('buy added: ' + player.buys)
			}

			else if (choices[each].indexOf('money') != -1) {
				player.money += count;
			}

			else if (choices[each].indexOf('Trash') != -1) {
				choose(player, 'trash', choices[each][6], 'none', 'none', false);
				// break, because the actionCheck is built into the choose() function, and running it right after this point right now would make it not work..
				break
			}
			
		}

		// while there is a button still existing associated with this function
		//  (getElements brings an array, [0] means first in that array)
		while (document.getElementsByClassName('choiceButton')[0]) {
			// remove that button
			document.getElementsByClassName('choiceButton')[0].parentNode.removeChild(document.getElementsByClassName('choiceButton')[0]);
		}
			console.log('running actioncheck now');
			actionCheck(player);
		statusUpdate(player);
	}

	// choices is the array supplied by the action card
	for (each in choices) {

		var newButton = document.createElement('button');	

		// sets the button to say the text of the choice
		newButton.innerHTML = choices[each];

		// sets display of button to block/visible, set classname
		newButton.display = 'block';
		newButton.className = 'choiceButton';

		// for storing the chosen choices to later execute
		var choiceArray = [];

		// set it's onclick function
		newButton.onclick = function() {

			// push the text from the button into the choiceArray, for later use
			choiceArray.push(this.innerHTML);

			// remove the button
			this.parentNode.removeChild(this);

			// if the number of items chosen already meet the number of choices allowed, execute said choices
			if (choiceArray.length >= number) {
				executeChoices(player, choiceArray);
			}
		}

		// add this new button
		document.getElementById('inPlay').appendChild(newButton);
	}		
}

function drawUntil(player, condition, number) {

	var count = 0;

	// if the player's deck is down to 0, shuffle the deck!
	if (player.deck.length === 0) {
		console.log('drawUntil( no cards in deck! run shuffleDeck()');
		shuffleDeck(player);
	}

	// create a newCard variable that is equal to the first card in the player's deck. 
	// shift() returns and removes the first item from an array
	var newCard = player.deck.shift();

	// if the condition is a number (draw until you have 7 cards in hand)
	if (typeof(condition) === 'number') {

		// set number equal to the condition minus player.hand.length, the number of cards left to draw
		console.log('drawUntil( condition is a number: ' + condition);
		number = condition - player.hand.length;

		// if the number of cards is met, return from the function and say true- that the drawUntil condition has been met
		if (number === 0) {
			return true;
		}

		console.log('drawUntil( so we shall draw ' + number + ' cards');
		console.log('drawUntil( condition is a number, run cardLook()');
		cardLook(player, newCard, number);

	}

	// if the condition is NOT a number 
	// EXAMPLE: 'draw 2 treasure cards'
	else {

		// while what you've done is less than what's maximally allowed:
		while (count < number) {

			// if the condition is a treasure card, 
			if (condition === 'treasure') {

				// if the newCard's type is treasure as well, put it into player's hand and increase count by 1
				if (newCard.type === 'treasure') {
					player.hand.push(newCard);
					count += 1;
					console.log('drawUntil( draw ' + newCard.name + ' into player.hand');
				}

				// if it's not a treasure, discard
				else {
					player.discard.push(newCard);
				}

			updateHand(player);	

			}
		}
	}
}


function useButton(player, text, action) {
	console.log('useButton( action: ' + action + ', text: ' + text);

	button = document.getElementById('actionButton');

	console.log('useButton( set button text to: "' + text + '"" and make visible');
	button.innerHTML = text;
	button.style.display='block';

	button.onclick = function() {
		if (action === 'discardDeck') {
			var decklength = player.deck.length
			for (i = 0; i<decklength; i ++) {
				player.discard.push(player.deck[0]);
				player.deck.splice(0, 1);
			} 
			console.log('actionButton onclick( deck has been discarded!');

			statusUpdate(player);

		}
		console.log('useButton( hide button');
		button.style.display='none';
	}
}

var KingdomCards = [

	{name: 		"Cellar",
	type:		"Action",
	cost:		2,
	quantity: 	10, 
	instructions: 	"+1 Action. Discard any number of cards. +1 Card per card discarded.",
	image:		"/home/zane/git/adminion/public/cardImages/cellar.jpg",
		action: 	function(player) {
			player.actions += 1;
			choose(player, 'discard', 0, 'draw', 'none', true);
			//emit finished event HERE! "THIS CARD IS DONE" finish and like something
		},
	actionWait: true
	},

	{name:		"Courtyard",
	type:		"Action",
	cost:		2,
	quantity: 	10,
	instructions:	"+3 Cards. Put a card from your hand on top of your deck.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/courtyard.jpg",
		action: 	function(player) {
			for (i = 0; i < 4; i += 1) {
				drawCard(player, true);
			};
			choose(player, 'move', 1, 'deck0',  false, false);
		},
	actionWait: true
	},

	{name:		"Pawn",
	type:		"Action",
	cost:		2,
	quantity: 	10,
	instructions:	"Choose two: +1 Card; +1 Action; +1 Buy; +$1. (The choices must be different.)",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/pawn.jpg",
		action: function(player) {
			chooseAction(player, ['+1 card', '+1 action', '+1 buy', '+1 money'],
 				2)		
			},
	actionWait: true },

	{name:		"Secret-Chamber",
	type:		"Action Reaction",
	cost:		2,
	quantity: 	10,
	instructions:	"Discard any number of cards. +$1 per card discarded. When another player plays an Attack card, you may reveal this from your hand. If you do, +2 cards, then put 2 cards from your hand on top of your deck.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/secretchamber.jpg" },

	{name:		"Great-Hall",
	type:		"Action Victory",
	cost:		3,
	quantity: 	10,
	victory:	1,
	instructions:	"1 Victory Point. +1 Card; +1 Action.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/greathall.jpg",
		action: 	function(player) {
			player.actions += 1;
			drawCard(player, true);
		}, 
	},

	{name:		"Masquerade",
	type:		"Action",
	cost:		3,
	quantity: 	10,
	instructions:	"+2 Cards. Each player passes a card in their hand to the player on their left. You may trash a card from your hand.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/masquerade.jpg",
		action: 	function(player) {
			drawCard(player);
			drawCard(player, true);
		}, 
	},

	{name:		"Shanty Town",
	type:		"Action",
	cost:		3,
	quantity: 	10,
	instructions:	"+2 Actions. Reveal your hand. If you have no Action cards in hand, +2 Cards.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/shantytown.jpg",
		action: 	function(player) {
			player.actions += 2;
		}, 
	},
	
	{name:		"Steward",
	type:		"Action",
	cost:		3,
	quantity: 	10,
	instructions:	"Choose one: +2 Cards; or +$2; or trash 2 cards from your hand.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/steward.jpg",
		action: 	function(player) {
			chooseAction(player, ['+2 card', '+2 money', 'Trash 2 cards'],
 				1)		
			
		}, 
	actionWait: true
	},

	{name:		"Swindler",
	type:		"Action-Attack",
	cost:		3,
	quantity: 	10,
	instructions:	"+$2. Each other player trashes the top card of his deck and gains a card with the same cost that you choose.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/swindler.jpg",
		action: 	function(player) {
			player.money += 2;
		}, 
	},

	{name: 		"Wishing-Well",
	type:		"Action",
	cost:		3,
	quantity: 	10,
	instructions:	"+1 Card; +1 Action. Name a card, then reveal the top card of your deck. If it is the named card, put it in your hand.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/wishingwell.jpg",
		action: 	function(player) {
			drawCard(player, true);
			player.actions += 1;
		}, 
	},
	{name:		"Nobles",
	type:		"Action Victory",
	cost:		6,
	victory:	2,
	instructions:	"2 Victory Points. Choose one: +3 Cards; or +2 Actions.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/nobles.jpg",
		action: 	function(player) {
			chooseAction(player, ['+3 card', '+2 action'],
 				1)	
		}, 
	actionWait: true
	}

];

function cardConstructor (type, cards) {
    for (var card in cards) {
        var Card = cards[card];
        Card.type = type;
        gameConfig.piles.push(Card);
    };
};

cardConstructor (       'treasure',     Treasure        );
cardConstructor (       'victory',      Victory         );

//when trashing a card, the trashed card is put in trash and taken out of player's hand
function trashCard(player, card, location) {

	if (location === 'hand') {
	console.log('trashCard( location is in hand');

		console.log('trashCard( push ' + player.hand[card.id-1].name + ' into trash');
		trash.push(player.hand[card.id-1]);

		console.log('trashCard( splice ' + player.hand[card.id-1].name + 'from player.hand');
		player.hand.splice(parseInt(card.id)-1, 1);

		updateHand(player);
	}
	else if (location === 'play') {
		console.log('trashCard( location is in play');
		console.log('trashCard( push ' + card.name + ' into trash');
		console.log('card.id: ' + card.id);
		console.log(card);
		console.log('trying to trash ' + player.hand[card.id-1]);
		card.byWho = player.Name;
		trash.push(card);
		console.log('trash contents: ');
		console.log(trash);


		console.log('trashCard( splice ' + card.name + ' from playCards');
		playCards.splice(playCards.length-1, 1);


		console.log('trashCard( remove ' + card.name + ' from inPlay element/playCards array');
		var inPlay = document.getElementById('inPlay');
		console.log(inPlay.lastChild);
		inPlay.removeChild(inPlay.lastChild);

	}
}

function cardInspect(cardId) {
	var displaybox = document.getElementById('cardDisplay');
	displaybox.innerHTML = "";
	addImage('200px', '3px', cardId, displaybox, 'displaybox');
	setTimeout(function(){
		displaybox.innerHTML = "";
	},5000);
}

function updateHealthMeters() {

	$.each(KingdomCards, function() {
		var healthMeter = $('#kingdom #' + this.name).find('.healthMeter')
		switch (this.quantity) {
			case 9:
				healthMeter.css('backgroundColor', '#1Ce800');
				break;
			case 8:
				healthMeter.css('backgroundColor', '#39D200');
				break;
			case 7:
				healthMeter.css('backgroundColor', '#55BB00');
				break;
			case 6:
				healthMeter.css('backgroundColor', '#71A400');
				break;
			case 5:
				healthMeter.css('backgroundColor', '#8E8E00');
				break;
			case 4:
				healthMeter.css('backgroundColor', '#AA7700');
				break;
			case 3:
				healthMeter.css('backgroundColor', '#C66000');
				break;
			case 2:
				healthMeter.css('backgroundColor', '#E34A00');
				break;
			case 1:
				healthMeter.css('backgroundColor', '#FF3300');
				break;
			case 0:
				healthMeter.css('backgroundColor', '#FF3300');

		}
		if (this.quantity > 0) {
			healthMeter.height(this.quantity/10 * 102);
		}
		else {
			healthMeter.height(102);
		}
	});
};


// a function to calculate the probability of drawing a certain card next
function calculateProbability(cardName) {

	// creates variable quantity, to keep track of how many of the certain card there is
	var quantity = 0;

	// for each card in the player's deck
	for (var each in players[0].deck) {
		// if the name of the card is the card we're trying to calculate for, add 1 to the quantity
		if (players[0].deck[each].name === cardName) {
			quantity += 1;
		}
	}

	// calculate the percentage of the quantity of that card over how many total cards in the deck
	var percentage = Math.round(quantity/players[0].deck.length*100);

	if (percentage > 0) {
		// create a div to display probability
		var probz = document.createElement('div');
		probz.id = 'probability';

		// put text in it and add to the card's element
		var text = document.createTextNode(percentage + '%');
		probz.appendChild(text);
		document.getElementById(cardName).appendChild(probz);

		// remove the element after 200 ms
		setTimeout(function(){
			document.getElementById(cardName).removeChild(probz);
		},500);
	}
}

//DEAL IS ONLY DONE ONCE IN THE START OF THE GAME
function deal() {

	for (var player in players) {

		//CREATES A NEW PLAYER PROFILE AND INSERTS IT INTO THE ARRAY OF PLAYERS
		var newPlayer = generatePlayer(players[player]);
		
		console.log('new player created: ' + newPlayer.Name);

		//replaces what used to be just the player's name with the full player's profile(newPlayer)
		players.splice(player, 1, newPlayer);

		console.log('starting cards given to players');
		
		//PUSHES 7 COPPER AND 3 ESTATES INTO NEW PLAYER'S DISCARD PILE
		players[player].discard.push(		
			gameConfig.piles[1],
			gameConfig.piles[1],
			gameConfig.piles[1],
			gameConfig.piles[1],
			gameConfig.piles[4],

			KingdomCards[0],
			KingdomCards[0],
			KingdomCards[4],
			KingdomCards[4]			
			);

		// shuffles the deck and draws a hand	
		shuffleDeck(players[player]);
		drawHand(players[player]);

		// sets the player's victory points to 3 (probably change this later)
		players[player].victory = 3;
	};
};

// functino for drawing a hand
function drawHand(player) {

	console.log('drawHand()')
	// grabs playerCards DIV and resets it to contain nothing
	var playerHand = document.getElementById("playerCards");
	playerHand.innerHTML = "";

	// draws five cards
	for (n = 0; n < 5; n += 1) {
		drawCard(player,true);
	}
}
//updates player's hand visualization. keeps it up to date with player.hand object array
function updateHand(player) {
	// grab playerCards dom and calls it playerHand
	var playerHand = document.getElementById('playerCards');

	// reset playerHand to nothing
	playerHand.innerHTML = '';

	// for each card in player.hand, add a corresponding image to the playerHand DOM
	for (i = 1; i <= player.hand.length; i ++) {
		var card = player.hand[i-1];
		// i is set to start at 1 because i is also assigned as the image element's id (0 as an id wasn't working out..)
		addImage('80px', '3px', card.image, playerHand, card.type, card.name);
	}
}

// a function for a player to draw a card from their deck
function drawCard(player, partOfAction){
	// if the player's deck is down to 0, shuffle the deck!
	if (player.deck.length === 0) {
		console.log('drawCard( no cards in deck! run shuffleDeck()');
		shuffleDeck(player);
	}
	
	// create a newCard variable that is equal to the first card in the player's deck. shift() returns and removes the first item from an array
	var newCard = player.deck.shift();
	//	console.log('drawCard( create newCard from top of player.deck (' + newCard.name + ')');

	if (newCard) {

		// push the newCard into the player's hand
		player.hand.push(newCard);

		// update visual of player's hand
		updateHand(player);	
	}

	// might need to change this for multiplayer use
	// if this is during the player's actionphase, update the actionevent on the newcard so that it can be bought
	if (player.actions > 0 && action && !partOfAction) {
		console.log('drawCard( player has ' + player.actions + ' actions left, and still has action cards in their hand');
		var playerHand = document.getElementById("playerCards");

		console.log('drawCard( run updateActionEvent() on newly drawn card');
		updateActionEvent(player,playerHand.lastChild);

		console.log('drawCard( run actionCheck()');
		actionCheck(player);
	}
}

// condition is a cost condition (lets say only cards costing up to 6 are affected)
// modifier is how much the cost is going to be modified (-1 for bridge)
// type is if the cost alteration is specific to only one type(s) of cards
function alterCost(condition, modifier, type) {

	$('#kingdom>div, #victories>div, #treasures>div')
	.filter( function() {
		var cardCost = $(this).find('.cost').attr('id');
		if (condition !== 'none') {

			return (cardCost <= condition) ? true : false;

		}
		else {
			return true;
		}

	})
	.each(function() {
		var cardCost = $(this).find('.cost').attr('id');
		
		console.log(this);
		console.log('modifier: ' + modifier + ' cardCost: '+cardCost);

		var newCost = parseInt(cardCost) + parseInt(modifier);
		if (newCost <= 0) {
			newCost = 0;
		}
		
		console.log('new cost is ' + newCost+ ' ('+cardCost+' + '+modifier+')');
		
		$(this).find('.cost').attr('id', newCost).find('p').html(newCost);

	})



	switch (type){
		
	}
}

//move the discarded cards back into the deck, empty the discard pile. this function essentially swaps each card in the deck (from place 0 to end of deck) with a random other card in the deck. i found this method of shuffling online somewhere- if it isn't random enough, maybe it would work better running through the for loop multiple times?
function shuffleDeck(player) {
		console.log('deck: ' + player.deck.length + ', discard: ' + player.discard.length);

	// if the discard pile has no cards in it (and there's no more cards to draw..)
	if (player.discard.length === 0) {

		console.log('nomorecards!');
		return 'nomorecards';

	}
	// else means that there are still cards in the discard pile, in which to shuffle into your deck
	else {
		console.log('shuffling cards');
		// for each card in player.discard,
		for (var n = 0; n < player.discard.length - 1; n++) {

			// the variable k is set equal to n, the index of the current loop, plus a random value between 0-1 multiplied by player.discard.length - the current index
			//  k = n + random other number (in player.discard)
			var k = n + Math.floor(Math.random() * (player.discard.length - n));

			// temp is the card holder, it takes the randomized index # and stores that kth card
			var temp = player.discard[k];

			// the randomized index card is set equal to the nth index card
			player.discard[k] = player.discard[n];

			// the nth index card is set equal to temp, which used to be the randomized index card
			player.discard[n] = temp;

			// basically, we're going through the discard pile card by card, replacing it with another random card in the deck
		}
		player.deck = player.discard;
		player.discard = [];
	}
	statusUpdate(player);
}

var action = false;

// a function to check if the player has action cards in their hand
function actionCheck(player) {
	// starts by switching action variable to false. the action variable is used to determine if there are action cards in the player's hand or not
	if (player.actions === 0) {
		console.log('actionCheck( player has no more actions, continue');
		buyPhase(player);
		return;
	}

	console.log('actionCheck( action variable set to false');
	action = false;
		if ($('#playerCards img').hasClass('Action')) {
			action = true;
		}

		if (action) {
			actionPhase(player);
			console.log('action!');
		}
		else {
			buyPhase(player);
			console.log('buy!');
		}
	// goes through each card in your hand and determines if it is an action card or not. used to turn Actionphase on/off
/*	for (var n in player.hand) {	
console.log('testing for actions on player.hand[n] '+ player.hand[n].name);
		if (action) {
			continue;
		}
		// runs if the card's type has the string 'Action' in it


		if (player.hand[n].type.indexOf('Action') != -1) {

			console.log('actionCheck( ' + player.hand[n].name + ' is an Action card, so action = true');

			// var action is a switch to 
			
		}
	}

	// if action is true and there are action cards in the player's hand, actionPhase() is initiated
	if (action) {

		console.log('actionCheck( there are action cards, so begin actionPhase()');
		announce('action phase is initiated!');
		actionPhase(player);
	}
	else {

		buyPhase(player);
	}*/
	// if there are no action cards in their hand, the player's buyphase() is initiated
}

// a function for turning off action events
function turnOffActions(player) {
		console.log('turnOffActions( turn all cards in player.hand onclick to null');


	// goes through each card in the player's hand
	for (var each in player.hand) {

		// sets element equal to the card element and nullifies the onlick event
		var element = document.getElementById('playerCards').children[each];
		element.onclick = null;
		element.setAttribute('class', 'playerHand');

	}
} 
var actionPhaze = false;

// initiates action phase for player
function actionPhase(player){

	$('#playerCards img').each(function() {
		updateActionEvent(player,this);
	})
	console.log('actionPhase( updating action events for all cards!');

}

// a function to play a card, given the card's element and the player
function playCard(element, player, wait) {
	console.log('========================================================');
	console.log('=PLAYING CARD: ' + element.id + ' )+++++++++++++++++++++++');
	console.log('============================================')

	var cardArray = $.makeArray($("#playerCards img"))
	,	index = cardArray.indexOf(element)
	// creates cardOb, the element in the player's hand according to the newly found index

	, 	cardOb = player.hand[index]	
	// grabs the inPlay element
	,	inPlay = document.getElementById('inPlay');

	playCards.push(cardOb);

	console.log('=( add ' + cardOb.name + ' to inPlay element )+++++++++++++++');	
	// adds the image of the played card to the inPlay element
	addImage('70px', '5px', cardOb.image, inPlay, 'inPlayCard', 'play'+playCard.length + ' )+++++++++++++++++++++++');

	// announce that the player played the card
	announce(player.Name + ' has played a ' + cardOb.name);

	console.log('=( splice ' + cardOb.name + ' from player.hand )+++++++++++++++++++');
	// splice the card from the player's hand
	player.hand.splice(index, 1);

	updateHand(player);

	// subtract one from the player's actions	
	player.actions -= 1;

	console.log('=( -1 from player.actions: ' + player.actions + ' )++++++++++++');

	console.log('=( execute ' + cardOb.name + "'s .action function )++++++++++++++");
	// now that the correct object is found, execute the card's action
	console.log('***********************************************************');
	console.log('==========NOWPLAYINGACTION METHOD!===========================');
	cardOb.action(player, cardOb);

	statusUpdate(player);

	if (!cardOb.actionWait) {
		console.log('no actionwait.... run action check');
		actionCheck(player);
	}
}

// an array for storing the cards in play- during cleanupphase, they move into discard pile
var playCards = [];

// a function for updating the click event on a card, based upon the element/card's class name
function updateActionEvent(player, element) {

	// if it's an Action card, give it an onclick event to playCard
	if ($('#'+element.id).hasClass('Action')) {

		element.onclick = function() {
			var cardArray = $.makeArray($("#playerCards img"))
			,	index = cardArray.indexOf(this);

			if (player.hand[index].actionWait) {
				playCard(this, players[0], 'wait');
			}
			else {
				console.log(player.hand[index].name + ' onclick( runPlayCard()');
				playCard(this, players[0]);
			}
		};
	}
}

// a function to add an event in order to trigger buycard()
function updateBuyEvent(element, pay, location) {

	var buyButton = $(element).find('.buyButton');

	buyButton.toggle();

	if (pay) {
		buyButton.bind('click', function() {
			buyCard(this, players[0]);
		});
	}

	else {
		buyButton.bind('click', function() {
			gainCard(element.id, players[0], location)
			if (location === 'hand') {
				updateHand(players[0]);
			}
			//actionCheck(players[0]);
		});
	}
}

// a variable to signify that its the player's first buy in the turn, so that treasure cards aren't counted more than once
var firstBuy = true;

//the buy phase of a player's turn
function buyPhase(player) {
            // a click event is added to the card, based on its buyability

	console.log('buyPhase( run turnOffActions()');
	turnOffActions(player);

	announce('choose card to buy!');

	console.log('buyPhase( disable the buy button');
	document.getElementById('buy').disabled = true;

	// if player has buys left:
	if (player.buys > 0) {

		console.log('buyPhase( player still has buys');
		console.log('firstBuy: ' + firstBuy);
		// only runs while its the player's first buy
		if (firstBuy === true) {
	
			console.log('buyPhase( its the players first buy');
			// goes through each card in the player's hand to check if there are treasure cards
			$.each(player.hand, function() {
				if (this.treasure) {
					player.money += this.treasure;
					console.log('processing ' + this.name + ': add ' + this.treasure);
				};

			});

			// since its run through and counted treasure cards in the player's hand, firstBuy is turned off, so that next time buyPhase is run, money is not counted again
			console.log('buyPhase( firstBuy done with');
			firstBuy = false;
		}

		statusUpdate(player);

		setGainable(player, player.money, true, false, 'discard');
	}
}

function setGainable(player, cost, pay, type, location) {
	$.each($('#kingdom>div, #treasures>div, #victories>div').find('.cost'), function() {

		if (parseInt(this.id) <= cost) {
			var buyButton = $(this).parent()
			.not('.exhausted')
			.find('.buyButton')
			.unbind()
			.toggle();
		
			if (pay) {
				buyButton.bind('click', function() {
					buyCard($(this).parent().attr('id'), players[0]);

				});
			}

			else {
				buyButton.bind('click', function() {
					gainCard($(this).parent().attr('id'), players[0], location)
					if (location === 'hand') {
						updateHand(players[0]);
					}
					actionCheck(players[0]);
				});
			}
		}
		else {
			$(this).parent().css('opacity', '0.4');
		}
	});
}

// a function to buy a card, given a player and the name of a card
function buyCard(card, player) {
	console.log('buyCard( buying ' + card);
	
	// subract 1 buy from the player
	console.log(player.buys);
	console.log('buyCard( minus buys');
	player.buys -= 1;
	console.log(player.buys);

	var cardCost = parseInt($('#'+card).find('.cost').attr('id'));
	// and player gains that card
	card = gainCard(card, player, 'discard');


	console.log('buyCard( minus ' + cardCost + ' from player.money');
	// subtract the cost of the card from the player's money
	player.money -= cardCost;

	// if the player has no more buys,
	if (player.buys === 0) {

		console.log('buyCard( no more buys..');
		console.log('buyCard( begin Cleanup');
		// engage cleanup Phase
		cleanupPhase(player);
	}

	// if they still have more buys, engage buyphase() again!
	else {
		console.log('buyCard( still have more buys!, initiate buyPhase');
		buyPhase(player);
	}

	console.log('buyCard( status update');
	statusUpdate(player);
}

var gameLog = [];

// function for displaying messages, typically ones pertaining to what just happened in the game
function announce(message) {

	gameLog.push(message);

function logger () {

    var logger = Object.create(null);

	// clears the contents of commentary
	//	commentary.innerHTML = '';
	var announcements = [];

    logger.announce = function (message) {
        announcements.push(message);

        // grabs the dom object 'commentary' and sets it equal to commentary
        var commentary = document.getElementById('commentary');

        // clears the contents of commentary
    //  commentary.innerHTML = '';

        var comment = document.createElement('p');
        comment.setAttribute('id', 'comment');

        // creates comment, a new textNode with the message inside of it
        var txt = document.createTextNode(message); 

        comment.appendChild(txt);
        // adds comment to commentary
        commentary.appendChild(comment);

	document.getElementById('comment').scrollIntoView();
}
		document.getElementById('comment').scrollIntoView();
	};


};

// a function to gain a card, given its name, the target player, & where the card is going to be placed
function gainCard(card, player, location) {
console.log('running gainCard() with card: ' + card + ' and location: ' + location);

	// creates an array containing all gainable cards
	var allCards = KingdomCards.concat(Treasure, Victory);
	
	// for each of the cards, see if the name given to the function matches the card's name
	$.each(allCards, function() {
		if (card === this.name) {
			card = this;
			// if it does match, return false to get out of the .each loop
			return false;
		};
	});

	switch (location) {
		case 'hand': 
			player.hand.push(card);
			console.log('gainCard( push ' + card.name + ' into player.hand');
			updateHand(player);
		break;	
		case 'discard':
			player.discard.push(card);
			console.log('gainCard( push ' + card.name + ' into player.discard');
		break;
		case 'deck':
			player.deck.push(card); 
			console.log('gainCard( push ' + card.name + ' into player.deck');

		break;
	}

	// subtract 1 from the card's quantity
	card.quantity --;

	announce(player.Name+ ' gained a '+card.name);

	updateHealthMeters();


	// if the gained card is a victory card, add the victory points from the card to the player's victory points
	if (card.type === 'victory') {

		console.log('gainCard( ' + card.victory + ' victory points added to player.victory: ' + player.victory);
		player.victory += card.victory;
	}
	
	// if the card pile has run out (quantity = 0), 
	if (card.quantity <= 0) {

		$('#'+card.name).addClass('exhausted');

		console.log('gainCard( ' + card.name + ' has run out..');

		console.log('gainCard( push ' + card.name + ' into gameConfig.exhausted');
		// push the card into the list of exhausted cards
		gameConfig.exhausted.push(card);	
	}

	$('.buyButton')
		.hide()
		.parent()
		.not('.exhausted')
		.css('opacity', '1');
	
	return card;
} 

// a function to start a player's turn
function turn(player) {
	console.log('===============');
	console.log('BEGIN NEW TURN');
	
	// performs test to see if there are action cards in the player's hand
	actionCheck(player);
}

// a function to discard a given card from a given player's hand
function discardCard(player, cardIndex, element) {
	if (element) {
		// push given card into player's discard pile
		player.discard.push(player.hand[parseInt(element.id)-1]);


		player.hand.splice(parseInt(element.id)-1, 1);
	}
	else {
		player.discard.push(player.hand[cardIndex]);

		player.hand.splice(cardIndex, 1);
	}

	updateHand(player);

	statusUpdate(player);
};

// a function to discard a given player's hand
function discardHand(player) {

    // while a player's hand has cards in it:
    // this loop will keep discarding cards from the player's hand until there are no cards to discard
    while (player.hand.length > 0) {

		// discard the first card in the player's hand
		discardCard(player, 0);
	}
}

// a variable to tell if a player's turn has been ended/cleanedUp
// starts as false because it opens on player's turn, before clean up
var cleanedUp = false

//to prepare for the players next turn, all player attributes get reset to default values, hand is discarded and a new one drawn
function cleanupPhase(player) {

	// a function to reset the cost div of the cards, given a wrapped set and array of corresponding objects
	function resetCost(wrappedSet, objects) {

		// within the wrapped set, get the elements with the cost class
		wrappedSet.find('.cost')

		// for each of these cost div's, 
		.each( function(index) {

			// get the original cost of the card, from the card Object
			var originalCost = objects[index].cost;

			// this refers to the cost div, 
			$(this)

			// set its id to the original cost,
			.attr('id', originalCost)

			// then find the paragraph element within and change the text to match the original cost
			.find('p')
			.text(originalCost)
		})
	}
	// now run the above function for kingdom, treasure, and victory cards
	resetCost($('#kingdom>div'), KingdomCards);
	resetCost($('#treasures>div'), Treasure);
	resetCost($('#victories>div'), Victory);
	

	// goes through all kingdom, treasure, and victory supply DOM elements
	$('#kingdom>div, #treasures>div, #victories>div')

	// excludes exhausted cards
	.not('.exhausted')

	// change opacity back to 1
	.css('opacity', 1)

	// find the corresponding buy button and hide it
	.find('.buyButton').hide();
		console.log('cleanupPhase( begin');

	for (var each in playCards) {
	
		// if the card in play has to be return to the deck, returnToDeck is turned back to false and the card is added to the deck instead of discard pile
		if (playCards[each].returnToDeck) {
			console.log('cleanupPhase( ' + playCards[each].name + ' is marked to return to deck upon cleanup, returning to deck');
			playCards[each].returnToDeck = false;
			player.deck.splice(0,0, playCards[each]);
		}

		// otherwise, put the card into the discard pile
		else {	
			console.log('cleanupPhase( push ' + playCards[each].name + ' into player.discard');
			player.discard.push(playCards[each]);
		}
	}


	console.log('cleanupPhase( reset playCards array and inPlay element');
	playCards = [];
	var inPlay = document.getElementById('inPlay');
	inPlay.innerHTML = '';

	console.log('cleanupPhase( firstBuy set to True');
	firstBuy = true;

	console.log('cleanupPhase( discard hand');
	// discard the player's hand
	discardHand(player);

	console.log('cleanupPhase( Draw new hand');
	// player draws a new hand
	drawHand(player);

	console.log('cleanupPhase( set money back to 0, actions to 1, buys to 1');
	// player's money goes to 0,
	player.money = 0;

	// actions go back to 1
	player.actions = 1;
	// buys go back to 1
	player.buys = 1;

	// we have completed clean up, so we switch cleanedUp to true
	cleanedUp = true;
	
	// update player's status on the screen
	statusUpdate(player);

	console.log('cleanupPhase( re-enabled buy button');
	// enables the 'buy' button, in case it got turned off during the player's turn
	document.getElementById('buy').disabled = false;
	


	// start player's turn ((this WILL have to change when it comes time to add multiplayer functionality
	turn(players[0]);					
}

var end = false;

// a function to insert a line BReak in a given location
function insertBR(location) {
    
    // creates a <BR> element called br
    var br = document.createElement('br');

    // appends br to the given location
    location.appendChild(br);
}

// a function to add a stat to the stats list
function addStat(text, style) {

	// creates a text node called stat with the given text
	var stat = document.createTextNode(text);

	if (style === 'bold') {
		var span = document.createElement('span');
		span.style.fontSize = '25px';
		span.style.margin = '30px';
		span.appendChild(stat);
		stat = span;
	}

	// appends the text node to the stats list
	stats.appendChild(stat);
	
	// instert a line break
	insertBR(stats);
}

// updates player's stats
function statusUpdate (player) {
	
	var array = [player.actions, player.money, player.buys, player.deck.length, player.discard.length];

	$('#bigStats li')
		.each( function(stat,element) {		
			$(element).text(array[stat]);
		});

}	

function wrap(parent, child) {
        var wrap = document.createElement('div');
        wrap.setAttribute('class', child.className+'Wrap');
        wrap.appendChild(child);
        parent.appendChild(wrap);
}

// a function to add an image to a dom object
// you call it with a width, margin, where you're getting the img.src, the dom object you're trying to add it to, and if applicable, a style that you want to add to the image (buyable, unbuyable, etc)
function addImage(width, margin, source, destination, crass, id) {

    // create a new img element and name it image
    var image = document.createElement("img");

    // set the src of the new img to the above inputted source url
    image.src = source;

    // sets width and margin to requested width
    image.setAttribute('width', width);
    image.setAttribute('margin', margin);
    
    // if there is an id provided, set image's id to match  
    if (id) {
        image.setAttribute('id', id);
    }

	// if the image is being added to playerCards, log the player's handlength
	if (destination === document.getElementById("playerCards")) {
	}

    // if there is a class specified, set image's class to match
    if (crass) {
        image.setAttribute('class', crass);

		// if the class of the image is kingdomcard, the image is going to have to be wrapped in a div wrapper, in order to display only part of the card
		if (crass === 'kingdomCard' || crass === 'kingdomCardBottom' || crass === 'kingdomTreasure' || crass === 'victoryAttr' || crass === 'victoryName') {
			wrap(destination, image)
		}

		else {
			destination.appendChild(image);
		}

	}
	else {
		destination.appendChild(image);
	}	
}

		var playerhands = [];
		
function populateKingdom() {

	// sets the kingdom variable equal to the div in the document by the same name
	var kingdom = document.getElementById("kingdom");

	// clears what was on there before
	kingdom.innerHTML = '';
	
	// gets the kingdomcards array built from cards.html page
	var cardNames = JSON.parse(localStorage.getItem('kingdomcards'));

	// sets KingdomCards to empty
	KingdomCards = [];

	// goes through each chosen card
	$.each(cardNames, function(index) {

		// CARD is the indv card
		var CARD = cardNames[index];

		// goes through each expansion
		$.each(ALLEXPANSIONS, function() {

			var EXPANSION = this;

			// goes through each expansion
			$.each(EXPANSION, function() {

				if (this.name === CARD) {
					// add quantity property (make it adjustable in initial settings LATER ON)
					this.quantity = 10;
					// pushes this card into KingdomCards
					KingdomCards.push(this);
				}
			});
		});
	});

	// goes through each newly created kingdomcard
	$.each(KingdomCards, function(){
		// set card equal to this particular card
		var card = this;
		// create a div for storing the card, with id equal to card's name
		$('<div id = '+ card.name+'></div>')

			// add corresponding class (type of card)
			.addClass(card.type)

			// inside it, append all other divs associated with the card
						// a img wrapper for the graphic portion of the card
			.append(	$('<div class = "kingdomCardWrap"> <img class = "kingdomCard" src = ' + card.image + ' width = "100px"> </div>'),
						// a img wrapper for the bottom portion of the card
						$('<div class = "kingdomCardBottomWrap"> <img class = "kingdomCardBottom" src = ' + card.image +' width = "100px"></div>'),
						// a buy button div
						$('<div class = "buyButton"> + </div>'),
						// a cost div, with a coin img and id equal to card's cost
						$('<div class = "cost"><img src = "images/coin.png"><p>' + card.cost + '</p></div>').attr('id', card.cost),
						// a div for storing the healthmeter of the card, used to estimate the quantity of the card
						$('<div class = "healthMeter"></div>'),
						// a div for storing the probability of drawing the card next
						$('<div class = "probability"></div>')
			)
			// bind events to the card div
			.bind({
				// on click, its going to run cardInspect and show a larger preview of the card
				click: function() {
					cardInspect($(this).find('img').attr('src'))
				},
				// upon mouse enter, the probability is going to be calculated
				mouseenter: function() {
					calculateProbability(this.id)
				}
			})
			// after all this creationing, put into the kingdom div on the page
			.appendTo('#kingdom');
	})

	$.each(Treasure, function() {
		var card = this;
		$('<div id = '+ card.name + ' class = "treasure"></div>')
			.append(	$('<div class = "kingdomTreasureWrap"> <img class = "kingdomTreasure" src = ' + card.image + ' width = "100px"> </div>'),
						$('<div class = "buyButton"> + </div>'),
						$('<div class = "cost"><img src = "images/coin.png"><p>' + card.cost + '</p></div>').attr('id', card.cost),
						$('<div class = "probability"></div>')
			)
			.bind({
				click: function() {
					cardInspect($(this).find('img').attr('src'))
				},
				mouseenter: function() {
					calculateProbability(this.id)
				}
			})
			.appendTo('#treasures');
	});
		
	$.each(Victory, function() {
		var card = this;
		$('<div id = '+ card.name + ' class = "victory"></div>')
			.append(	$('<div class = "victoryAttrWrap"> <img class = "victoryAttr" src = ' + card.image + ' width = "164px"> </div>'),
						$('<div class = "victoryNameWrap"> <img class = "victoryName" src = ' + card.image + ' width = "164px"> </div>'),
						$('<div class = "buyButton"> + </div>'),
						$('<div class = "cost"><img src = "images/coin.png"><p>' + card.cost + '</p></div>').attr('id', card.cost),
						$('<div class = "probability"></div><br>')
			)
			.bind({
				click: function() {
					cardInspect($(this).find('img').attr('src'))
				},
				mouseenter: function() {
					calculateProbability(this.id)
				}
			})
			.appendTo('#victories');
	});
}

populateKingdom();

//THE START OF THE GAME

function startGame() {

	deal();

			cleanedUp = false;
			statusUpdate(players[0]);

			//assign phase buttons to current player
			document.getElementById("buy").onclick = function() {buyPhase(players[0])};
			document.getElementById("clean").onclick = function() {cleanupPhase(players[0])};

			turn(players[0]);
}
