
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
	var count = 0;
	var lookbox = document.getElementById('lookBox');
	lookbox.innerHTML = '<button id = "lookboxButton1" </button> <button id = "lookboxButton2" </button>';
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
	console.log('choose( action: ' + action + ', howMany: ' + howMany + ', reaction: ' + reaction + ', conditions: ' + conditions + ', buttonChoice: ' + buttonChoice);


	//  a function for applying the reaction of the card-choosing (draw per chosen, etc)
	function applyReaction(reaction) {

		// if the reaction is to draw a card 														
		if (reaction == 'draw') {
			console.log('choose( applyReaction( reaction is to draw:');

			// loops through as many times as cards were chosen (thisMany)							
			for (var i = 1; i <= thisMany; i += 1) {

				// and draws a card for each one 													
				action = false;
				console.log('choose( applyReaction( run drawCard() for the ' + i + 'th time');
				drawCard(player, true);
			};
		}

		// if you are gaining money from the reaction, 											
		else if (reaction.indexOf('money') != -1) {

			// creates a multiplier based on the last character of reaction (a number, hopefully, inputted in with the card.action)													
			var multiplier = reaction[reaction.length-1];

			// the money gained is equal to thisMany * the multiplier gleaned from the function call
			var moneyz = thisMany * multiplier;

			console.log('choose( applyReaction( reaction is to gain money: gain ' + moneyz + ' moneys');
			// add corresponding moneyz amount to player's money
			player.money += moneyz;
		}

		else if (reaction.indexOf('gain') != -1) {
			var costModifier = 0;
			costModifier += parseInt(reaction[reaction.length-1]);

			costModifier = chosen[0].cost + costModifier;
			console.log(costModifier);

			if (reaction[reaction.length-2] == '+') {
				setGainable(player, costModifier, false);
			}
		}
		turnClickOff();
	}

	// a function to apply the action of the chosen cards, given what action, and what card element
	function applyAction(action, card){
		chosen.push(player.hand[card.id-1]);
		// if the action is to discard:
		if (action == 'discard') {
			console.log('choose( applyAction( action is to discard');

			console.log('choose( applyAction( run discardCard() on ' + player.hand[card.id-1].name);
			// discard this card, according to the card element given
			discardCard(player, i, card);
		}

		// if the action is to trash:
		else if (action == 'trash') {
		console.log('choose( applyAction( action is to trash');

			console.log('choose( applyAction( run trashCard() on ' + player.hand[card.id-1].name);
			// trash this card!
			trashCard(player, card, 'hand');
		}

		// adds 1 to thisMany, a counter for counting how many cards have been chosen
		thisMany += 1;
		console.log('choose( applyAction( ++ to thisMany is: '+thisMany);
	}

	// a function to add the onclick event of (CHOICE) to all the cards in the hand	
	function addOnclick(player) {

		var count = 0;

		// goes through each card in player's hand 
		for (i = 1; i<=player.hand.length; i++) {
	
			if (conditions == 'copper') {
				if (player.hand[i-1].name != 'Copper') {
					continue;
				}
			
			}

			document.getElementById(i).setAttribute('class', 'handSelect');
			console.log('choose( addOnclick( change ' + player.hand[i-1].name + "'s class to " + document.getElementById(i).className);

			console.log('choose( addOnclick( add onclick to ' + i +'th card in player.hand, ' + player.hand[i-1].name);	
			// grabs the corresponding card element and assigns an onclick function 
			document.getElementById(i).onclick = function() {
				
				console.log(player.hand[this.id-1].name + ' onclick( run applyAction()');

				// narme is a variable for storing the name of the card
				var narme = player.hand[this.id-1].name;

				// when you click on the card, the action is applied upon THIS! 
				applyAction(action, this);

				console.log(narme + ' onclick( run howManyCheck()');
				// after action is applied, check to see is howmany is fulfilled, and whether or not to add click events again!
				howManyCheck(howMany);		

			}
			count += 1;

		}
		if (count == 0) {

			// re-enable the buy and cleanup buttons
			document.getElementById('clean').disabled = false;
			document.getElementById('buy').disabled = false;

			// check for more actions!
			actionCheck(player);	
			return;
		}
	}

	function turnClickOff() {


		for (i = 1; i<=player.hand.length; i++) {

			console.log('choose( turnClickOff( ' + player.hand[i-1].name + "'s onclick declared null");
			// grabs the corresponding card element and assigns an onclick function
			document.getElementById(i).onclick = null;
		}

	}

	// a function to check if the amount of cards chosen is adequate or not to keep choosing! 
	function howManyCheck(howMany) {

// EXAMPLE: a card allows for discarding 2 cards- if you've only discarded 1 so far, the  howManyCheck 
// will check to see if another onclick event should be added to the refreshed  playerhand, and since 
// thisMany would be 1, and howMany = 2, howManyCheck will add another round of onclick events to the player hand 

			// if you do run out of cards in your hand to action upon, there are events set into place:
			if (player.hand.length == 0) {

				console.log('choose( howManyCheck( player.hand is out of cards, run applyReaction()');
				// apply reaction with curent thisMany times!
				applyReaction(reaction);

				console.log('choose( howManyCheck( hide button');
				// hide the button!
				button.style.display='none';
				console.log('choose( howManyCheck( run actionCheck()');

				// re-enable the buy and cleanup buttons
				document.getElementById('clean').disabled = false;
				document.getElementById('buy').disabled = false;

				// check for more actions!
				actionCheck(player);	
				return;
			}


			// if howMany is infinite ( = 0), the onclick event will be added no matter what thisMany is,
			//	until a user button is pushed to end the choosing process or you run out of cards
			if (howMany == 0) {
				console.log('choose( howManyCheck( infinit howManys: run addOnclick()');
				addOnclick(player);
			}

			// in that case, if thisMany is under howMany(ok to go!), the click events will be added again
			else if (thisMany < howMany) {
				console.log('choose( howManyCheck( ' + thisMany + ' is less than ' + howMany + ': run addOnclick()');
				addOnclick(player);
			}
			else if (thisMany == howMany) {
				console.log('choose( howManyCheck( thisMany meets howMany (' + thisMany + '): run turnClickOff()');
				turnClickOff();		

				console.log('choose( howManyCheck( run applyReaction()');
				// apply reaction with curent thisMany times!
				applyReaction(reaction);

				if (buttonChoice) {
					console.log('choose( howManyCheck( hide the button');
					// hide the button!
					button.style.display='none';
				}
				
				
				// re-enable the buy and clean buttons,
				document.getElementById('clean').disabled = false;
				document.getElementById('buy').disabled = false;

				if (reaction.indexOf('gain') != -1) {


				}
				else {
					// check for more actions!
					actionCheck(player);			
				}
			}
			console.log('thisMany = ' + thisMany);
	}
	//////////////////////////////////////////////////////////////////////////////////////
	//////					BEGINNING OF CHOOSE() FUNCTION 							//////
	//////////////////////////////////////////////////////////////////////////////////////

	console.log('choose( create chosen array');
	// 	an array to store the cards that get chosen, for access later
	var chosen = [];

	// if the player's hand is empty, and there is nothing to choose upon,
	if (player.hand.length == 0) {

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

	// creates thisMany, to keep track of how many cards have been chosen and actioned upon
	var thisMany = 0;

	if (buttonChoice) {
		// grabs the button that says 'done discarding?'
		var button = document.getElementById('doneDiscarding');

		console.log('choose( make button visible');
		// make the button visible again
		button.style.display='block';

		console.log('choose( make button say: "Done ' + action + 'ing?"');
		// change the text on the button to match the action being done to the chosen cards
		button.innerHTML = 'Done '+ action +'ing?';

		console.log('choose( set thisMany = 0');


		console.log('choose( assign onclick function to button');

		// change the button's behavior:
		// it will be a user option for pretty much ending the chosen function 

		button.onclick = function() {

			console.log('button onclick( run applyReaction()');
			////// apply the given reaction 
			applyReaction(reaction);

			console.log('button onclick( make button disappear');
			//////make the button disappear..
			////// for now!
			button.style.display='none';

			console.log('button onclick( run actionCheck()');
			//////carry on with the action phase!
			updateHand(player);

			// turn the cleanup and buy buttons back on
			document.getElementById('clean').disabled = false;
			document.getElementById('buy').disabled = false;

			actionCheck(player);
		}
	}

	console.log('choose( run addOnclick()');
	////// add the onlick events to the cards, so that player can start choosing!
	addOnclick(player);

	//////////////////////////////////////////////////////////////////////////////////////
	//////						END OF CHOOSE() FUNCTION							//////
	//////////////////////////////////////////////////////////////////////////////////////
}

function drawUntil(player, condition, number) {

	var count = 0;
	// if the player's deck is down to 0, shuffle the deck!
	if (player.deck.length == 0) {
		console.log('drawUntil( no cards in deck! run shuffleDeck()');
		shuffleDeck(player);
	}
	// create a newCard variable that is equal to the first card in the player's deck. shift() returns and removes the first item from an array
	var newCard = player.deck.shift();

	// if the condition is a number (draw until you have 7 cards in hand)
	if (typeof(condition) == 'number') {

		// set number equal to the condition minus player.hand.length, the number of cards left to draw
		console.log('drawUntil( condition is a number: ' + condition);
		number = condition - player.hand.length;

		// if the number of cards is met, return from the function and say true- that the drawUntil condition has been met
		if (number == 0) {
			return true;
		}

		console.log('drawUntil( so we shall draw ' + number + ' cards');

		console.log('drawUntil( condition is a number, run cardLook()');
		cardLook(player, newCard, number);

		console.log('break from else if condition');
	}

	else {
		while (count < number) {
			console.log('running, while count < number');




			if (condition == 'treasure') {
				if (newCard.type == 'treasure') {
					console.log('drawUntil( draw ' + newCard.name + ' into player.hand');
					// push the newCard into the player's hand
					player.hand.push(newCard);
					count += 1;
				}

				else {
					player.discard.push(newCard);
				}
			// update visual of player's hand
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
		if (action == 'discardDeck') {
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
		},
	actionWait: true
	},

	{name: 		"Chapel",
	type:		"Action",
	cost:		2,
	quantity: 	10, 
	instructions: 	"Trash up to 4 cards from your hand.",
	image:		"/home/zane/git/adminion/public/cardImages/chapel.jpg",
		action: function(player) {
			choose(player, 'trash', 4, 'none', 'none', true)
		},
			actionWait: true

	},

	{name: 		"Moat",
	type:		"Action-Reaction",
	cost:		2,
	quantity: 	10,
	instructions: 	"+2 Cards. When another player plays an Attack card, you may reveal this from your hand. If you do, you are unaffected by that Attack.",
	image:		"/home/zane/git/adminion/public/cardImages/moat.jpg",
		action: function(player) {
			drawCard(player);
			drawCard(player);
		}
	},



	{name: 		"Chancellor",
	type:		"Action",
	cost:		3,
	quantity: 	10,
	instructions: 	"+2 Money. You may immediately put your deck into your discard pile.",
	image:		"/home/zane/git/adminion/public/cardImages/chancellor.jpg",
		action: function(player) {
			player.money += 2;
			useButton(player, 'put deck into discard pile?', 'discardDeck');

		},
	actionWait: true
	},

	{name: 		"Village",
	type:		"Action",
	cost:		3,
	quantity: 	10, 
	instructions: 	"+1 Card; +2 Actions.",
	image:		"/home/zane/git/adminion/public/cardImages/village.jpg",
		action: function(player) {
			drawCard(player);
			player.actions += 2;
		}
	},

	{name: 		"Woodcutter",
	type:		"Action",
	cost:		3,
	quantity: 	10,
	instructions: 	"+1 Buy; +2 Money.",
	image:		"/home/zane/git/adminion/public/cardImages/woodcutter.jpg",
		action: function(player) {
			player.buys +=1;
			player.money +=2;
		} 
	},

	{name: 		"Workshop",
	type:		"Action",
	cost:		3,
	quantity: 	10,
	instructions: 	"Gain a card costing up to $4.",
	image:		"/home/zane/git/adminion/public/cardImages/workshop.jpg",
		action: function(player) {
			setGainable(player, 4);
		},
	actionWait: true
	},

	{name: 		"Bureaucrat",
	type:		"Action-Attack",
	cost:		4,
	quantity: 	10,
	instructions: 	"Gain a silver card; put it on top of your deck. Each other player reveals a Victory card from his hand and puts it on his deck (or reveals a hand with no Victory cards).",
	image:		"/home/zane/git/adminion/public/cardImages/bureaucrat.jpg",
		action: function(player) {
		
		}
	},

	{name: 		"Feast",
	type:		"Action",
	cost:		4,
	quantity: 	10,
	instructions: 	"Trash this card. Gain a card costing up to $5.",
	image:		"/home/zane/git/adminion/public/cardImages/feast.jpg",
		action: function(player) {
			trashCard(player, this, 'play');
			setGainable(player, 5);
		},
	actionWait: true
	},

	{name: 		"Gardens",
	type:		"Victory",
	cost:		4,
	quantity: 	10,
	instructions: 	"Worth 1 Victory for every 10 cards in your deck (rounded down).",
	image:		"/home/zane/git/adminion/public/cardImages/gardens.jpg",
		action: function(player) {
		
		}
	},

	{name: 		"Militia",
	type:		"Action-Attack",
	cost:		4,
	quantity: 	10,
	instructions: 	"+$2; Each other player discards down to 3 cards in his hand.",
	image:		"/home/zane/git/adminion/public/cardImages/militia.jpg",
		action: function(player) {
			player.money += 2;
		}
	},

	{name: 		"Moneylender",
	type:		"Action",
	cost:		4,
	quantity: 	10,
	instructions: 	"Trash a Copper from your hand. If you do, +$3.",
	image:		"/home/zane/git/adminion/public/cardImages/moneylender.jpg",
		action: function(player) {
			choose(player, 'trash', 1, 'money3', 'copper', false);

		},
	actionWait: true
	},

	{name: 		"Remodel",
	type:		"Action",
	cost:		4,
	quantity: 	10,
	instructions: 	"Trash a card from your hand. Gain a card costing up to $2 more than the trashed card.",
	image:		"/home/zane/git/adminion/public/cardImages/remodel.jpg",
		action: function(player) {
			choose(player, 'trash', 1, 'gain+2', 'none', false);
		
		},
	actionWait: true
	},

	{name: 		"Smithy",
	type:		"Action",
	cost:		4,
	quantity: 	10,
	instructions: 	"+3 Cards.",
	image:		"/home/zane/git/adminion/public/cardImages/smithy.jpg",
		action:	function(player) {
			for (var i=0;i<3;i +=1) {
				drawCard(player);
			}	
		} 
	},

	{name: 		"Spy",
	type:		"Action-Attack",
	cost:		4,
	quantity: 	10,
	instructions: 	"+1 Card; +1 Action; Each player (including you) reveals the top card of his deck and either discards it or puts it back, your choice.",
	image:		"/home/zane/git/adminion/public/cardImages/spy.jpg",
		action: function(player) {
			drawCard(player);
			player.actions += 1;
		}
	},

	{name: 		"Thief",
	type:		"Action-Attack",
	cost:		4,
	quantity: 	10,
	instructions: 	"Each other player reveals the top 2 cards of his deck. If they revealed any Treasure cards, they trash one of them that you choose. You may gain any or all of these trashed cards. They discard the other revealed cards.",
	image:		"/home/zane/git/adminion/public/cardImages/thief.jpg",
		action: function(player) {
		
		}
	},

	{name: 		"Throne Room",
	type:		"Action",
	cost:		4,
	quantity: 	10,
	instructions:	"Choose an Action card in your hand. Play it twice.",
	image:		"/home/zane/git/adminion/public/cardImages/throneroom.jpg",
		action: function(player) {
		
		}
	},
	
	{name:		"Council Room",
	type:		"Action",
	cost:		5,
	quantity: 	10,
	instructions:	"+4 Cards; +1 Buy. Each other player draws a card.",
	image:		"/home/zane/git/adminion/public/cardImages/councilroom.jpg",
		action:	function(player) {
			player.buys += 1;
			drawCard(player);
			drawCard(player);
			drawCard(player);
			drawCard(player);
		}
	},

	{name:		"Festival",
	type:		"Action",
	cost:		5,
	instructions:	"+2 Actions, +1 Buy; +$2.",
	image:		"/home/zane/git/adminion/public/cardImages/festival.jpg",
	quantity: 10,
		action: function(player) {
			player.actions += 2;
			player.buys += 1;
			player.money += 2;

		} 
	},
	
	{name:		"Laboratory",
	type:		"Action",
	cost:		5,
	instructions:	"+2 Cards; +1 Action.",
	image:		"/home/zane/git/adminion/public/cardImages/laboratory.jpg",
	quantity: 10,
		action: function(player) {
			player.actions += 1;
			drawCard(player);
			drawCard(player);
		}  
	},

	{name:		"Library",
	type:		"Action",
	cost:		5,
	quantity: 	10,
	instructions:	"Draw until you have 7 cards in hand. You may set aside any Action cards drawn this way, as you draw them; discard the set aside cards after you finish drawing.",
	image:		"/home/zane/git/adminion/public/cardImages/library.jpg",
		action: function(player) {
			drawUntil(player, 7);
		},
	actionWait: true
	},

	{name:		"Market",
	type:		"Action",
	cost:		5,
	quantity: 	10,
	instructions:	"+1 Card; +1 Action; +1 Buy; +$1.",
	image:		"/home/zane/git/adminion/public/cardImages/market.jpg",
		action: function(player) {
			drawCard(player);
			player.actions += 1;
			player.money += 1;
			player.buys += 1;
		}
	},

	{name:		"Mine",
	type:		"Action",
	cost:		5,
	quantity: 	10,
	instructions:	"Trash a Treasure card from your hand. Gain a Treasure card costing up to $3 more; put it into your hand.",
	image:		"/home/zane/git/adminion/public/cardImages/mine.jpg",
		action: function(player) {
		
		}
	},

	{name:		"Witch",
	type:		"Action-Attack",
	cost:		5,
	quantity: 	10,
	instructions:	"+2 Cards. Each other player gains a Curse card.",
	image:		"/home/zane/git/adminion/public/cardImages/witch.jpg",
		action: function(player) {
			drawCard(player);
			drawCard(player);
		}
	},

	{name:		"Adventurer",
	type:		"Action",
	cost:		6,
	quantity: 	10,
	instructions:	"Reveal cards from your deck until you reveal 2 Treasure cards. Put those Treasure cards in your hand and discard the other revealed cards.",
	image:		"/home/zane/git/adminion/public/cardImages/adventurer.jpg",
		action: function(player) {
			drawUntil(player, 'Treasure', 2);
		}
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

	if (location == 'hand') {
	console.log('trashCard( location is in hand');

		console.log('trashCard( push ' + player.hand[card.id-1].name + ' into trash');
		trash.push(player.hand[card.id-1]);

		console.log('trashCard( splice ' + player.hand[card.id-1].name + 'from player.hand');
		player.hand.splice(parseInt(card.id)-1, 1);

		updateHand(player);
	}
	else if (location == 'play') {
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

function cardInspect(card) {
    window.open(card, 'name', 'location=no, height=480px, width=300px, menubar=no,status=no, titlebar=no, toolbar=no');
}

// a function to calculate the probability of drawing a certain card next
function calculateProbability(card) {

	// creates variable quantity, to keep track of how many of the certain card there is
	var quantity = 0;

	// for each card in the player's deck
	for (var each in players[0].deck) {
		// if the name of the card is the card we're trying to calculate for, add 1 to the quantity
		if (players[0].deck[each].name == card) {
			quantity += 1;
		}
	}
	console.log(quantity);

	// calculate the percentage of the quantity of that card over how many total cards in the deck
	var percentage = quantity/players[0].deck.length;

	// report that ratio as a percentage
	console.log(percentage*100+'%');

}

function probability() {
    console.log('copper..');
    calculateProbability('Pearl Diver')
    console.log('/');
    console.log(players[0].deck.length);

}

//DEAL IS ONLY DONE ONCE IN THE START OF THE GAME
function deal() {
    for (var player in players) {
//CREATES A NEW PLAYER PROFILE AND INSERTS IT INTO THE ARRAY OF PLAYERS
        var newPlayer = generatePlayer(players[player]);
        //replaces what used to be just the player's name with the full player's profile(newPlayer)
        players.splice(player, 1, newPlayer);

//PUSHES 7 COPPER AND 3 ESTATES INTO NEW PLAYER'S DISCARD PILE
		players[player].discard.push(		
			gameConfig.piles[1], 
			gameConfig.piles[1], 
			gameConfig.piles[1], 
			gameConfig.piles[1], 
			gameConfig.piles[1],
 			gameConfig.piles[1], 
			gameConfig.piles[1],
			KingdomCards[20],
			KingdomCards[20],
			KingdomCards[20],
			KingdomCards[20]);

		// shuffles the deck and draws a hand		
		shuffleDeck(players[player]);
		drawHand(players[player]);

		// sets the player's victory points to 3 (probably change this later)
		players[player].victory = 3;
	};
};

// functino for drawing a hand
function drawHand(player) {

	// grabs playerCards DIV and resets it to contain nothing
	var playerHand = document.getElementById("playerCards");
	playerHand.innerHTML = "";

	// draws five cards
	for (n = 0; n < 5; n += 1) {
		drawCard(player);
	}
}
//updates player's hand visualization. keeps it up to date with player.hand object array
function updateHand(player) {
	console.log('updateHand()');
	// grab playerCards dom and calls it playerHand
	var playerHand = document.getElementById('playerCards');
	// reset playerHand to nothing
	playerHand.innerHTML = '';
	// for each card in player.hand, add a corresponding image to the playerHand DOM
	for (i = 1; i <= player.hand.length; i ++) {
		// i is set to start at 1 because i is also assigned as the image element's id (0 as an id wasn't working out..)
		addImage('80px', '3px', player.hand[i-1].image, playerHand, 'playerhand', i);
	}
}

// a function for a player to draw a card from their deck
function drawCard(player, partOfAction){

	// if the player's deck is down to 0, shuffle the deck!
	if (player.deck.length == 0) {
		console.log('drawCard( no cards in deck! run shuffleDeck()');
		shuffleDeck(player);
	}

	// create a newCard variable that is equal to the first card in the player's deck. shift() returns and removes the first item from an array
	var newCard = player.deck.shift();
	console.log('drawCard( create newCard from top of player.deck (' + newCard.name + ')');

	if (newCard) {

	console.log('drawCard( push ' + newCard.name + ' into player.hand');
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

//move the discarded cards back into the deck, empty the discard pile. this function essentially swaps each card in the deck (from place 0 to end of deck) with a random other card in the deck. i found this method of shuffling online somewhere- if it isn't random enough, maybe it would work better running through the for loop multiple times?
function shuffleDeck(player) {
	if (player.discard.length == 0) {
		console.log('nomorecards!');

	}
	else {
		for (var n = 0; n < player.discard.length - 1; n++) {
			var k = n + Math.floor(Math.random() * (player.discard.length - n));
			var temp = player.discard[k];
			player.discard[k] = player.discard[n];
			player.discard[n] = temp;
		}
		player.deck = player.discard;
		player.discard = [];
	}
}
	var action = false;

// a function to check if the player has action cards in their hand
function actionCheck(player) {
	// starts by switching action variable to false. the action variable is used to determine if there are action cards in the player's hand or not
console.log('player.actions: ' + player.actions);
	if (player.actions == 0) {
		console.log('actionCheck( player has no more actions, continue');
		buyPhase(player);
		return;
	}
console.log('player.actions: ' + player.actions);

	console.log('actionCheck( action variable set to false');
	action = false;
console.log('player.actions: ' + player.actions);
	// goes through each card in your hand and determines if it is an action card or not. used to turn Actionphase on/off
	for (var n in player.hand) {	

		if (action) {
			continue;
		}
		// runs if the card's type has the string 'Action' in it
		if (player.hand[n].type.indexOf('Action') != -1) {

			console.log('actionCheck( ' + player.hand[n].name + ' is an Action card, so action = true');

			// var action is a switch to 
			action = true;
		}
	}

	// if action is true and there are action cards in the player's hand, actionPhase() is initiated
	if (action) {

		console.log('actionCheck( there are action cards, so begin actionPhase()');
		console.log('player.actions: ' + player.actions);
		announce('action phase is initiated!');
		actionPhase(player);
	}
	else {

		buyPhase(player);
	}
	
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
	}
} 

var actionPhaze = false;

// initiates action phase for player
function actionPhase(player){

    announce('choose action card to play!');

    // set actionphaze to true, to signify that the actionphase is in effect
    actionPhaze = true;

	console.log('actionPhase( updating action events for all cards!');
	// for every card in the player's hand
	for (var each=0; each<player.hand.length; each ++) {
		// update the action event each card, by grabbing the playerCards div and updating the action event for each child element in playerCards

		updateActionEvent(player,document.getElementById(each+1));
		// set the card's object's element property to match the card's element on the page
		player.hand[each].element = document.getElementById(each+1);
	}
}

// a function to play a card, given the card's element and the player
function playCard(element, player, wait) {
	console.log('===============');
	console.log('PLAYING CARD: ' + player.hand[element.id-1].name);

	// creates cardOb, the element in the player's hand according to the newly found index
	var cardOb = player.hand[(element.id)-1];
	
	// grabs the inPlay element
	var inPlay = document.getElementById('inPlay');

	playCards.push(cardOb);

	console.log('playCard( add ' + cardOb.name + ' to inPlay element');	
	// adds the image of the played card to the inPlay element
	addImage('70px', '5px', cardOb.image, inPlay, 'inPlayCard', 'play'+playCard.length);

	// announce that the player played the card
	announce(player.Name + ' has played a ' + player.hand[element.id-1].name);

	

	console.log('playCard( splice ' + cardOb.name + ' from player.hand');
	// splice the card from the player's hand
	player.hand.splice(parseInt(element.id)-1, 1);

	updateHand(player);

	// subtract one from the player's actions	
	player.actions -= 1;

	console.log('playCard( -1 from player.actions: ' + player.actions);

	console.log('playCard( execute ' + cardOb.name + "'s .action function");
	// now that the correct object is found, execute the card's action
	cardOb.action(player, cardOb);
	console.log('==========cardEnd=====')

	statusUpdate(player);

	if (cardOb.actionWait) {
		console.log('playCard( this is part of an action card, wait and dont run actionCheck()')
	}

	else {
		console.log('playCard( this is not part of an action card, run actionCheck()');
		actionCheck(player);
	}
}

// an array for storing the cards in play- during cleanupphase, they move into discard pile
var playCards = [];


// a function for updating the click event on a card, based upon the element/card's class name
function updateActionEvent(player, element) {

	// if it's an Action card, give it an onclick event to playCard
	if (player.hand[parseInt(element.id)-1].type.indexOf('Action') != -1) {

		console.log('updateActionEvent( action card detected.. add onclick event to ' + player.hand[element.id-1].name + ' in hand');
		element.onclick = function() {

			if (player.hand[element.id-1].actionWait) {
				console.log(element.id);
				console.log(player.hand[element.id-1].name + ' onclick( actionWait detected: run playCard() with a wait');
				playCard(element, players[0], 'wait');
			}
			else {
				console.log(player.hand[element.id-1].name + ' onclick( runPlayCard()');
				playCard(element, players[0]);
			}
		};
		element.setAttribute('class', 'actionCard');

	}

	// if the classname is 'normal', take away the onclick event
	else if (element.className == 'normal') {
		console.log('updateActionEvent( className is normal, nullify onclick for '+ player.hand[element.id-1].name);
		element.onclick = null;
	}
}
function turnBuyEventOff(element) {
	  	element.onclick = function() {
 		 	cardInspect(element.src);
 		};

}
// a function to add an event in order to trigger buycard()
function updateBuyEvent(element, pay) {


	// if the classname is buyable at all, adds buycard() to the click event
 	if (element.className.indexOf('unbuyable') == -1 )  {
		if (pay) {
 			// console.log('updateBuyEvent( assign ' + element.id + "'s onclick function to buyCard()");
			element.onclick = function() {
				console.log(element.id + 'onclick(  run buyCard() with ' + element.id);
				buyCard(element.id, players[0]);
			}
		}
		else {
 			// console.log('updateBuyEvent( assign ' + element.id + "'s onclick function to gainCard()");
			element.onclick = function() {

				console.log(element.id + 'onclick( run gainCard() with' + element.id);
				gainCard(element.id, players[0]);

				console.log(element.id + 'onclick( run actionCheck()');
				actionCheck(players[0]);
			}
		}
	}

	// if the className is normal or its a normal kingdom card, the click event is set back to cardInspect
  else if (element.className == 'normal') {
  	// console.log('updateBuyEvent( assign ' + element.id + "'s onclick to cardInspect()");
  	element.onclick = function() {
 		 	cardInspect(element.src);
 		};
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
		// only runs while its the player's first buy
		while (firstBuy == true) {
	
			console.log('buyPhase( its the players first buy');
			// goes through each card in the player's hand to check if there are treasure cards

			for (i = 0;  i < player.hand.length; i += 1) {
				// if the card's type is treasure,
				if (player.hand[i].treasure) {
					console.log('buyPhase( processing ' + player.hand[i].name + '...' + ' add ' + player.hand[i].treasure + ' to player.money');
					// add the value of the treasure card to the player's usable money supply
					player.money += player.hand[i].treasure;
				}	
			}

			// since its run through and counted treasure cards in the player's hand, firstBuy is turned off, so that next time buyPhase is run, money is not counted again
			console.log('buyPhase( firstBuy done with');
			firstBuy = false;
		}
	statusUpdate(player);

	setGainable(player, player.money, true);
	}
}
function setGainable(player, cost, pay) {
	console.log('setGainable() with cost limit: ' + cost+ ', with paying');

	// goes through all the available cards in the kingdom to set them to buyable
	if (pay) {
	}
	else {
		console.log('setGainable( no pay')
	}
	console.log('setGainable( update buy events for all cards');
	for (var card in KingdomCards) {
		// if there are no more cards left in that pile, the class is set to unbuyable
		if (KingdomCards[card].quantity <= 0) {
			document.getElementById(KingdomCards[card].name).setAttribute('class', 'unbuyable');
			// console.log('setGainable( '+ KingdomCards[card].name + ' class set to unbuyable');
		}
		

		// if the cost of the card is less than or equal to how much money the player has, 	
		if (KingdomCards[card].cost <= cost) {
	
		// the card's dom object's class is switched to 'buyable'
		document.getElementById(KingdomCards[card].name).setAttribute('class', 'buyable');
		// console.log('setGainable( '+ KingdomCards[card].name + ' class set to buyable');
		}		

			
		// if the cost of the card is less than what the player has in money, it is set to unbuyable
		else {
			document.getElementById(KingdomCards[card].name).setAttribute('class', 'unbuyable');
			// console.log('setGainable( '+ KingdomCards[card].name + ' class set to unbuyable');
		}

		// if there is a pay option noted, the card must be paid for (as in BUYING)
		if (pay) {
			// a click event is added to the card, based on its buyability
			// true means that the card must be paid for
			// console.log('setGainable( run updateBuyEvent for ' + KingdomCards[card].name + ", with paying");
			updateBuyEvent(document.getElementById(KingdomCards[card].name), true);
		}
		// else means that the player doesn't need to use up their money or buys to gain the card
		else {
			// console.log('setGainable( run updateBuyEvent for ' + KingdomCards[card].name + ", without paying");
			updateBuyEvent(document.getElementById(KingdomCards[card].name), false);
		}
	}
	// goes through all the available Treasure cards to see if they're buyable or not		
	for (var card in Treasure) {
		// if the cost of the card is less than or equal to how much money the player has, 	
		if (Treasure[card].cost <= cost) {
	
		// the card's dom object's class is switched to 'buyable'
		document.getElementById(Treasure[card].name).setAttribute('class', 'buyableTreasure');
		// console.log('setGainable( '+Treasure[card].name+' class set to buyable');

		}
			
		// if its too expensive for how much money they have, it is set to unbuyable
		else {
			document.getElementById(Treasure[card].name).setAttribute('class', 'unbuyableTreasure');
			// console.log('setGainable( '+Treasure[card].name+' class set to unbuyable');

		}
			
		// if there is a pay option noted, the card must be paid for (as in BUYING)
		if (pay) {
			// a click event is added to the card, based on its buyability
			// true means that the card must be paid for
			// console.log('setGainable( run updateBuyEvent() for ' + Treasure[card].name + ", with paying");
			updateBuyEvent(document.getElementById(Treasure[card].name), true);

		}
		// else means that the player doesn't need to use up their money or buys to gain the card
		else {
			// console.log('setGainable( run updateBuyEvent() for ' + Treasure[card].name + ",without paying");
			updateBuyEvent(document.getElementById(Treasure[card].name), false);

		}
	}

	// goes through victory cards to see if they're buyable or not	
	for (var card in Victory) {
		
		if (Victory[card].cost <= cost) {
	
			// the card's dom object's class is switched to 'buyable'
			document.getElementById(Victory[card].name).setAttribute('class', 'buyableVictory');
			// console.log('setGainable( '+ Victory[card].name+' class set to buyable');
		}				
		// if its too expensive for how much money they have, it is set to unbuyable
		else {
			document.getElementById(Victory[card].name).setAttribute('class', 'unbuyableVictory');
			// console.log('setGainable( '+ Victory[card].name+' class set to unbuyable');
		}
			
		// if there is a pay option noted, the card must be paid for (as in BUYING)
		if (pay) {
			// a click event is added to the card, based on its buyability
			// true means that the card must be paid for
			// console.log('setGainable( run updateBuyEvent() for ' + Victory[card].name + ", with paying");
			updateBuyEvent(document.getElementById(Victory[card].name), true);

		}
		// else means that the player doesn't need to use up their money or buys to gain the card
		else {
			// console.log('setGainable( run updateBuyEvent() for ' + Victory[card].name + "', without paying");
			updateBuyEvent(document.getElementById(Victory[card].name), false);

		}
	}
}

// a function to buy a card, given a player and the name of a card
function buyCard(card, player) {
	console.log('buyCard( buying ' + card);
	
	// subract 1 buy from the player
	console.log('buyCard( minus buys');
	player.buys -= 1;

	// and player gains that card
	card = gainCard(card, player);

	console.log(card);
	console.log('buyCard( minus ' + card.cost + ' from player.money');
	// subtract the cost of the card from the player's money
	player.money -= card.cost;

	// if the player has no more buys,
	if (player.buys == 0) {

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




    return logger;
};





// a function to gain a card, given its name and the target player
function gainCard(card,player) {

	console.log('gainCard( going through all Kingdom Cards');
	// loops through KingdomCards in order to find the card object (because we're given just the name of the card)
	for (var each in KingdomCards) {
	
		// if the given card name is matched up with the card object,
		if (card == KingdomCards[each].name) {
			console.log('gainCard( gaining card identified: ' + KingdomCards[each].name);
			// set card equal to the card object and break from the loop
			card = KingdomCards[each];
			break;
		}
	}
	// does the same for Treasures	
	for (var each in Treasure) {
		if (card == Treasure[each].name) {

			console.log('gainCard( gaining card identified: ' + Treasure[each].name);
			card = Treasure[each];
			break;
		}
	}
	
	// and the same for Victories
	for (var each in Victory) {
		if (card == Victory[each].name) {

			console.log('gainCard( gaining card identified: ' + Victory[each].name);
			card = Victory[each];
			break;
		}
	}
	console.log('gainCard( gaining ' + card.name);

	console.log('gainCard( push ' + card.name + ' into player.discard');
	// push the card into the player's discard pile
	player.discard.push(card);


	// subtract 1 from the card's quantity
	card.quantity --;

	console.log('gainCard( minus 1 from ' + card.name + "'s quantity: " + card.quantity);

	announce(player.Name+ ' gained a '+card.name);

	// if the gained card is a victory card, add the victory points from the card to the player's victory points
	if (card.type == 'victory') {

		console.log('gainCard( ' + card.victory + ' victory points added to player.victory: ' + player.victory);
		player.victory += card.victory;
	}
	
	// if the card pile has run out (quantity = 0), 
	if (card.quantity <= 0) {
		console.log('gainCard( ' + card.name + ' has run out..');

		console.log('gainCard( ' + card.name + "'s opacity changed to 0.4");
		// set the card's opacity to 0.4
		document.getElementById(card.name).style.opacity = '0.4';

		console.log('gainCard( push ' + card.name + ' into gameConfig.exhausted');
		// push the card into the list of exhausted cards
		gameConfig.exhausted.push(card);	
	}

	return card;
} 

// a function to start a player's turn
function turn(player) {
	console.log('===============');
	console.log('BEGIN NEW TURN');
	// logs the player's hand
	console.log(		player.Name		+
									"'s hand: "		
	 														 );
	for (i =0; i<player.hand.length; i++) {
		console.log('| '+ player.hand[i].name);
	}
	
	// performs test to see if there are action cards in the player's hand
	actionCheck(player);
}

// a function to discard a given card from a given player's hand
function discardCard(player, cardIndex, element) {
	if (element) {
		// push given card into player's discard pile
		console.log('discardCard( push ' + player.hand[element.id-1].name + ' into player.discard');
		player.discard.push(player.hand[parseInt(element.id)-1]);

		console.log('discardCard( splice ' + player.hand[element.id-1].name + ' from player.hand');
		player.hand.splice(parseInt(element.id)-1, 1);
	}
	else {
		console.log('discardCard( pushed '+player.hand[cardIndex].name + ' into discard pile');
		player.discard.push(player.hand[cardIndex]);

		console.log('discardCard( spliced '+player.hand[cardIndex].name+' out of hand');
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
console.log('player.actions: ' + player.actions)
	// buys go back to 1
	player.buys = 1;

	// we have completed clean up, so we switch cleanedUp to true
	cleanedUp = true;
	
	// update player's status on the screen
	statusUpdate(player);

	console.log('cleanupPhase( re-enabled buy button');
	// enables the 'buy' button, in case it got turned off during the player's turn
	document.getElementById('buy').disabled = false;
	
	console.log('cleanupPhase( turnBuyEventOff on all cards');
	for (var i=0; i<KingdomCards.length; i += 1) {

		var element = document.getElementById(KingdomCards[i].name);
		turnBuyEventOff(element);
	}

	for (var each in Treasure) {
		var element = document.getElementById(Treasure[each].name);
		element.setAttribute('class', 'kingdomTreasure');

		turnBuyEventOff(element);
	}

	for (var each in Victory) {
		var element = document.getElementById(Victory[each].name);
		element.setAttribute('class', 'victory');

		turnBuyEventOff(element);
	}

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

	if (style == 'bold') {
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

    // sets statBox to DIV element 'stats'
    var statBox = document.getElementById("bigStats");

    // resets statBox to nothin
    statBox.innerHTML = "";

    // creates stats, a list of stats to later publish
    var stats = document.createElement("ul");

	// adds all specificed stats
	var stat = document.createTextNode(player.actions);
	stats.appendChild(stat);
	insertBR(stats);
	var stat = document.createTextNode(player.money);
	stats.appendChild(stat);
	insertBR(stats);
	var stat = document.createTextNode(player.buys);
	stats.appendChild(stat);


	insertBR(stats);
	stat = document.createTextNode(player.deck.length);
	stats.appendChild(stat);
	insertBR(stats);
	stat = document.createTextNode(player.discard.length);
	stats.appendChild(stat);

	// addStat("drawPile: "+player.deck.length);
	// addStat("discard: "+player.discard.length);			
	// addStat("VP: "+player.victory);			

    // once all stats are added to stats list, append the list to statBox
    statBox.appendChild(stats);
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
	if (destination == document.getElementById("playerCards")) {
	}

    // if there is a class specified, set image's class to match
    if (crass) {
        image.setAttribute('class', crass);

		// if the class of the image is kingdomcard, the image is going to have to be wrapped in a div wrapper, in order to display only part of the card
		if (crass == 'kingdomCard' || crass == 'kingdomCardBottom' || crass == 'kingdomTreasure' || crass == 'victoryAttr' || crass == 'victoryName') {
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

	// loops through each kingdom card
	for (var each in KingdomCards) {
		var newKingdom = document.createElement('div');
		kingdom.appendChild(newKingdom);
		newKingdom.setAttribute('id', KingdomCards[each].name);
		newKingdom.setAttribute('class', 'normal');
		
		// if the type of kingdom you're trying to populate has no type, simply add the images normally
		addImage('100px', '0px', KingdomCards[each].image, newKingdom, 'kingdomCard', KingdomCards[each].name);

		addImage('100px', '0px', KingdomCards[each].image, newKingdom, 'kingdomCardBottom')

		// with a line break in the middle
		if (each == KingdomCards.length/2-1) {
			insertBR(kingdom);
		}
	}
	
	var treasurebox = document.getElementById('treasures');
	
	for (var each in Treasure) {
		addImage('100px', '0px', Treasure[each].image, treasurebox, 'kingdomTreasure', Treasure[each].name);
		if (each == 1) {
			insertBR(treasurebox);
		}	
	}
	
	var victorybox = document.getElementById('victories');
	
	for (var each in Victory) {
		var vicCard = document.createElement('div');
		vicCard.setAttribute('id', Victory[each].name);
		vicCard.setAttribute('class', 'victory');
		addImage('164px', '0px', Victory[each].image, vicCard, 'victoryAttr');
		addImage('164px', '0px', Victory[each].image, vicCard, 'victoryName', Victory[each].name);
		insertBR(victorybox);	
		victorybox.appendChild(vicCard);
	}
}
    populateKingdom();
//THE START OF THE GAME
function startGame() {
console.log(kingdomCards);
    deal();

            cleanedUp = false;
            statusUpdate(players[0]);
            //assign phase buttons to current player

            document.getElementById("buy").onclick = function() {buyPhase(players[0])};
            document.getElementById("clean").onclick = function() {cleanupPhase(players[0])};

            turn(players[0]);

}

if (end) {
        endGame();
}

    //at the end of the game, we loop through each player
function endGame() {
    for (var player in players) {

//set the variable player equal to the player's object
        player = players[player];

//go through each card in player's hand and put them into player's deck
		for (i=0; i<player.hand.length; i++) {

			player.deck.push(player.hand.pop());
		}

//go through each card in player's discard pile and puts them into their deck
        for (var card in player.discard) {
            player.deck.push(player.discard.pop());
        }
//then loop through each players deck
        for (var card in player.deck) {

//set the variable card equal to the player's card in their deck
            var Card = player.deck[card];

//if the card is a victory card, add a victory point to the victor
            if (card.type == 'victory') {
                player.victory += card.value;
            }
        }
    console.log(        player.Name                  +
                                    ' has '                          +
                                    player.victory           +
                                    ' victory points!'  );
    var winner;
    for (var i = 0; i < players.length-1; i ++) {
        if (players[i].victory > players[i+1].victory) {
            winner = players[i];
        }
        else {
            winner = players[i+1];
        }
    }
    console.log(    players[i].Name         +
                                ': '                                +
                                players[i].victory  +
                                ' Victory Points ' );
    }
    alert(  winner.Name                                 +
                    ' has won the gamE with '   +
                    winner.victory                          +
                    ' Victory Points!'               );
}
