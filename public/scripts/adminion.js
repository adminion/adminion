
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

// 	 name	   cost   value  quantity
var treasureTemplate = [
	['copper',	 	0, 		1, 		10	],
	['silver', 		3, 		2, 		10 		],
	['gold',			6, 		3, 		10 		],
	['platinum',	9, 		5, 		10 		],
	['potion',		4, 		0,	 	10 		]
]; 

// 	name			cost value quantity
var victoryTemplate = [
	['estate',		2,		1,		10	],
	['duchy',			5,		3,		10	],
	['province',	8,		5,		10	],
	['colony',		11,		10,		10	],
	['curse',			0,		-1,		10	]
];
var actionTemplate = [
	{
		name:"village",
		cost:3,
		instructions:"+1 card, +2 actions",
		action: function(player){
			player.actions += 2;
			drawCard(player);
		},
		quantity: 10,
		image:		"http://dominion.diehrstraits.com/scans/base/village.jpg"
	},
	{
		name: 'council room',
		cost: 5,
		quantity: 10,
		instructions: "+4 cards, +1 buy\nevery other player gains a card too",
		action: function(player){
			player.buys ++;

//draw a card 4 times
			for (i=0;i<4;i++){
				drawCard(player);
			}
//loops through each player and draws a card if they aren't the current player
			for (var num in players) {
				if (players[num] != player) {
					drawCard(players[num]);
				}
			}
		}		
	},
/*	{
		name:"Cellar",
		cost:2,
		instructions:"+1 Action. Discard any number of cards. +1 Card per card discarded.",
		duration:0,
		effects:{
			actions: 1,
			cards: num_discarded
		},
		action: function (player) {

//prompt player to choose cards from hand to discard (var = discardCard), not written
			while (discardCard) {
				player.discard.push(discardCard);

//add the chosen card(s) to the discard pile and remove them from player's hand
				player.hand.splice(player.hand.indexOf(discardCard),1);
				var num_discarded ++;
				
//prompt again if they want to discard another card- if not though, set discardCard to false or null, to close the loop, not written yet
			}
		}	
	},
*/	

{
		name:"Chapel",
		cost:2,
		instructions:"Trash up to 4 cards from your hand.",
		duration:0,
		action: function() {

//have player pick a card to trash (var = trashedCard)
//remove trashed card from hand, put into trashlist, limit to 4 trashed, then add all to a global list of trashed cards
			var trashed =[];
			while (trashed.length <= 4) {
				var trashedCard = selectCard(player);
				if (trashedCard) {
					trashed.push(trashedCard);
				}
				else {
					for (var each in trashed) {
						trashCard(player, trashed[each]);

					}
				}
			}
		}
	},
	{
		name:"Laboratory",
		cost:5,
		instructions:"+2 cards, +1 action",
		duration:0,
		action: function(player) {
			drawCard(player);
			drawCard(player);
			player.action ++;
		}
	},
	{
		name:"Throne Room",
		cost:4,
		instructions:"2x",
		duration:0,
		effects:{
			actions: 0,
			buys: 0,
			money: 0,
			cards: 0
		}	
	},
	{
		name:"Festival",
		cost:5,
		instructions:"+2 actions, +2 money, +1 buy",
		duration:0,
		action: function(player) {
			player.actions += 2;
			player.money += 2;
			player.buy ++;
		}
	},
{
		name:"Market",
		cost:5,
		instructions:"+1 actions, +1 money, +1 buy, +1 card",
		action: function(player) {
			player.actions ++;
			player.money ++;
			player.buys ++;
			drawCard(player);
		}	
	},

	{
		name:"Woodcutter",
		cost:3,
		instructions:"+1 Buy. +$2.",
		action:function(player) {
			player.buys ++;
			player.money += 2;
		}
	},
	{
		name:"Workshop",
		cost:3,
		instructions:"Gain a card costing up to $4.",
		action: function (player){

		}
	},



	{
		name:"Feast",
		cost:4,
		instructions:"Trash this card. Gain a card costing up to $5.",
		action: function (player) {
			
		}
	}

];
//JUST AN EXAMPLE KINGDOM CARD SET- EVENTUALLY, THIS ARRAY WILL BE GENERATED VIA cardSelect.html

var KingdomCards = [
	{name:		"Pearl Diver",	
	type:		"Action",	
	cost:		2,
	instructions:	"+1 Card; +1 Action. Look at the bottom card of your deck. You may put it on top.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/pearldiver.jpg"  },
	
	{name:		"Smugglers",	
	type:		"Action",	
	cost:		3,
	instructions:	"Gain a copy of a card costing up to $6 that the player to your right gained on his last turn.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/smugglers.jpg"  },
	
		{name:		"Bridge",
	type:		"Action",
	cost:		4,
	instructions:	"+1 Buy; +$1. All cards (including cards in players' hands) cost $1 less this turn, but not less than $0.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/bridge.jpg" },
	
	{name:		"Mining Village",
	type:		"Action",
	cost:		4,
	instructions:	"+1 Card; +2 Actions. You may trash this card immediately. If you do, +$2.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/miningvillage.jpg" },

	{name:		"Treasury",
	type:		"Action",
	cost:		5,
	instructions:	"+1 Card; +1 Action; +$1. When you discard this from play, if you didn't buy a Victory card this turn, you may put this on top of your deck.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/treasury.jpg"  },

	{name:		"Upgrade",
	type:		"Action",
	cost:		5,
	instructions:	"+1 Card; +1 Action. Trash a card from your hand. Gain a card costing exactly $1 more than it.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/upgrade.jpg" },

		{name:		"Festival",
	type:		"Action",
	cost:		5,
	instructions:	"+2 Actions, +1 Buy; +$2.",
	image:		"http://dominion.diehrstraits.com/scans/base/festival.jpg" },
	
	{name:		"Laboratory",
	type:		"Action",
	cost:		5,
	instructions:	"+2 Cards; +1 Action.",
	image:		"http://dominion.diehrstraits.com/scans/base/laboratory.jpg" },
	
	{name:		"Torturer",
	type:		"Action-Attack",
	cost:		5,
	instructions:	"+3 Cards. Each other player chooses one: he discards 2 cards; or he gains a Curse card, putting it in his hand.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/torturer.jpg" },
	
		{name:		"Harem",
	type:		"Treasure-Victory",
	cost:		6,
	instructions:	"Worth $2. 2 Victory Points.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/harem.jpg" }
	
];

function cardConstructor (type, cards) {
	for (var card in cards) {
		var Card = cards[card];
		Card.type = type;
		gameConfig.piles.push(Card);
	};
};

cardConstructor (		'treasure', 	Treasure		);
cardConstructor (		'victory', 		Victory			);
cardConstructor (		'action', 		actionTemplate			);

//when trashing a card, the trashed card is put in trash and taken out of player's hand
function trashCard(player, card) {
	trash.push(card);
	player.hand.splice(player.hand.indexOf(card),1);
}

//DEAL IS ONLY DONE ONCE IN THE START OF THE GAME
function deal() {
	for (var player in players) {
//CREATES A NEW PLAYER PROFILE AND INSERTS IT INTO THE ARRAY OF PLAYERS
		var newPlayer = generatePlayer(players[player]);


//PUSHES 7 COPPER AND 3 ESTATES INTO NEW PLAYER'S DISCARD PILE (SHUFFLEDECK() WILL LATER MOVE DISCARD PILE INTO DECK
		newPlayer.discard.push(		gameConfig.piles[0], 
															gameConfig.piles[0], 
															gameConfig.piles[0], 
															gameConfig.piles[0], 
															gameConfig.piles[0],
 															gameConfig.piles[0], 
															gameConfig.piles[0],
															gameConfig.piles[5], 
															gameConfig.piles[5], 
															gameConfig.piles[5]);
		shuffleDeck(newPlayer);
		drawHand(newPlayer);
		newPlayer.victory = 3;

		//replaces what used to be just the player's name with the full player's profile(newPlayer)
		players.splice(player, 1, newPlayer);
	};
};

//in beginning of game, this function populates the kingdom with kingdom cards which can be bought

function drawHand(player) {
	for (n = 0; n<5; n++) {
		drawCard(player);
	}
	
	var playerHand = document.getElementById("playerCards");
	playerHand.innerHTML = "";
	
	for (i = 0; i<player.hand.length; i++) {
		addImage('80px', '3px', player.hand[i].image, playerHand);
	}
}

function drawCard(player){
	if (player.deck.length == 0) {
		shuffleDeck(player);
	};

	console.log(	player.Name							 +
								' drew a '							 +
								player.deck[0].name			 +
								' card'									);
	player.hand.push(player.deck.shift()	);


}

//move the discarded cards back into the deck, empty the discard pile. this function essentially swaps each card in the deck (from place 0 to end of deck) with a random other card in the deck. i found this method of shuffling online somewhere- if it isn't random enough, maybe it would work better running through the for loop multiple times?
function shuffleDeck(player) {

	for (var n = 0; n < player.discard.length - 1; n++) {
		var k = n + Math.floor(Math.random() * (player.discard.length - n));
		var temp = player.discard[k];
		player.discard[k] = player.discard[n];
		player.discard[n] = temp;
	}
	player.deck = player.discard;
	player.discard = [];
}

function findCard(myArray, property, searchTerm) {
console.log('searchterm: '+searchTerm);
console.log('myArray = ' +myArray);
console.log('property = '+property);
	var finding = true;
	while (finding == true) {
		for(var i = 0; i < myArray.length; i++) {
			if (myArray[i][property] == searchTerm) {
console.log(myArray[i][property]);
				finding = false;
				return myArray[i];
    	}
    }
	}
}
	var actionCards = "";

function actionCheck(player) {
	//starts by switching action variable to false. the action variable is used to determine if there are action cards in the player's hand or not
	var action = false;

	//creates a variable for storing the names of the available action cards. used later simply for giving player a list of options for playing
	actionCards = "";

	//goes through each card in your hand and determines if it has a valid action function (treasure and victory cards don't have an action function, so if your hand is full of non-action cards, the program won't even bother with going through the playcard phase.
	for (var n in player.hand) {	
		if (player.hand[n].action) {
			//var action is a switch to turn playcard phase on or off
			action = true;
			console.log('action: ' + action);
			//adds the name of the action card to the list of available action cards.
			actionCards += player.hand[n].name+', ';
		}
	}
	if (action) {
		document.getElementById("action").disabled=false;
	}
	else {
		document.getElementById("action").disabled=true;
	}
	console.log('actioncheck: ' + action);
}

function actionPhase(player){

	do {
	
		//if there is one or more action cards in your hand, the following runs and asks if player wants to play a card. 
		var playCard = prompt(	player.Name 																			 +
														', 	you have action card(s) in your hand	 					\n'+ 

																/*list of*/		
																actionCards													 					+'\n'+

																'Which, if any do you want to play?     				\n'+
																'(leave blank if you choose not to play anything)');
		
		//if they do choose a card, continue
		if (playCard) {
				
			//discards the card in players hand with the name matching playCard
			var playedCard = findCard(player.hand, 'name', playCard);
			discardCard(playedCard);

			//once thats all settled, run the action function of the played card
			console.log(	player.Name								 +
								 		' played a '							 +
										playedCard.name						 +
								 		' card									\n'+

										playedCard.instructions		 );
		}
		

		else if (player.actions > 0) {
			console.log(			
										player.Name																	+	
										', you have'																+ 
										player.actions	 														+
										' actions left, but no action cards to action them with!'	);
			break;
		}

		player.actions --;

	}

	while (player.actions > 0);
}
		var buyableCards = [];
//the buy phase of a player's turn
function buyPhase(player) {
	if (player.buys > 0) {


//goes through each card in the player's hand to check if there are treasure cards
	for (var card in player.hand) {

//if the card's type is treasure,
		if (player.hand[card].type == 'treasure') {

//add the value of the treasure card to the player's usable money supply
		player.money += player.hand[card].value;
		}
	}
	statusUpdate(player);
//console.logs the player, how many buys and money they have to spend, and a list of cards that they're able to buy this turn

		console.log(	player.Name	 											+ 
								" has " 			 											+ 
									player.buys	 											+
								' buys and ' 	 											+ 
									player.money 											+
								' moneys!'													+
								'	and can buy the following cards:');

		//creates buyableCards array, to later display the cards that the player is able to buy
		buyableCards = [];

		// goes through all the available cards in piles and gathers a list of buyable cards
		for (var card in KingdomCards) {
		
			//if the cost of the card is less than or equal to how much money the player has, the name of the card gets added to the array of buyableCards		

			if (KingdomCards[card].cost <= player.money) {

				buyableCards.push(KingdomCards[card].name);
			}
		}
		console.log(buyableCards);
		populateKingdom('buyable');

		//asks player which of the buyable cards they would like to buy
/*		var buy = prompt(		player.Name 									+ 
												'! 												 \n'+

												'with your ' 									+
												player.money									+
												' money and ' 								+
												player.buys 									+
												' buys,'+ 

												'what card do you want? 	 \n'+ 
*/												/*list of */
//												buyableCards 							  	+
//												'?													');


//finds the index of the card in gameConfig.piles whose name matches var buy, and player gains that card

//		gainCard(buy, player);	
//		var boughtCard = findCard(gameConfig.piles, 'name', buy)
//		player.money -= boughtCard.cost;
		player.buys --;
		statusUpdate(player);
		if (player.buys <= 0) {
			document.getElementById('buy').disabled = true;
		}
	}
	else {

		alert('no more buys, F000!');
	}
}

function gainCard(card,player) {
	var gainingCard = findCard(gameConfig.piles, 'name', card);
	player.discard.push(gainingCard);
	gainingCard.quantity --;
	console.log(		player.Name															 +
			 						' gained a '														 +
									gainingCard.name												 +
						 			' and added it to their discard pile	\n'+

									gainingCard.name												 +
						 			' pile now has '												 +
									gainingCard.quantity										 +
						 			' cards left in it'											);
	if (gainingCard.type == 'victory') {
		player.victory += gainingCard.value;
	}
	
	if (gainingCard.quantity <= 0) {

		gameConfig.exhausted.push(gainingCard);
		
		gameConfig.piles.splice(gameConfig.piles.indexOf(gainingCard), 1);
		console.log(	gainingCard.name								 				+
							 ' 	pile has been EXHAUSTED							 \n'+

							 (	gameConfig.exhaustLimit - exhausted)	  +
							 '	piles left til the end of the game!		');
	}
} 

function turn(player) {

	console.log(		player.Name		+
									"'s hand: "		
	 														 );

	for (i =0; i<player.hand.length; i++) {
		console.log('| '+ player.hand[i].name);
	}
	actionCheck(player);
//	actionPhase(player);
//	buyPhase(player);
//	cleanupPhase(player);

}

// a function to discard a given card from a given player's hand
function discardCard(player, card) {
	
	// push given card into player's discard pile
	player.discard.push(card);

	// splices the card from the player's hand
	player.hand.splice(player.hand.indexOf(card),1);
}

// a function to discard a given player's hand
function discardHand(player) {

	// while a player's hand has cards in it:
	// this loop will keep discarding cards from the player's hand until there are no cards to discard
	while (player.hand.length > 0) {

		// discard the first card in the player's hand
		discardCard(player, player.hand[0]);
	}
}

// a variable to tell if a player's turn has been ended/cleanedUp
// starts as false because it opens on player's turn, before clean up
var cleanedUp = false

//to prepare for the players next turn, all player attributes get reset to default values, hand is discarded and a new one drawn
function cleanupPhase(player) {
	console.log(player);

	// discard the player's hand
	discardHand(player);

	// player draws a new hand
	drawHand(player);

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

	// report to log that you cleaned up!
	console.log('cleaned up!');

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
function addStat(text) {

	// creates a text node called stat with the given text
	var stat = document.createTextNode(text);

	// appends the text node to the stats list
	stats.appendChild(stat);
	
	// instert a line break
	insertBR(stats);
}

// updates player's stats
function statusUpdate (player) {

	// sets statBox to DIV element 'stats'
	var statBox = document.getElementById("stats");

	// resets statBox to nothin
	statBox.innerHTML = "";

	// creates stats, a list of stats to later publish
	var stats = document.createElement("ul");

	// adds all specificed stats
	addStat("player: "+player.Name);
	addStat("actions: "+player.actions);
	addStat("money: "+player.money);
	addStat("buys: "+player.buys);
	addStat("drawPile: "+player.deck.length);
	addStat("discard: "+player.discard.length);			
	addStat("VP: "+player.victory);			

	// once all stats are added to stats list, append the list to statBox
	statBox.appendChild(stats);
}	

// a function to add an image to a dom object
// you call it with a width, margin, where you're getting the img.src, the dom object you're trying to add it to, and if applicable, a style that you want to add to the image (buyable, unbuyable, etc)
function addImage(width, margin, source, destination, style) {

	// create a new img element and name it image
	var image = document.createElement("img");

	// set the src of the new img to source
	image.src = source;

	// sets width and margin to requested width
	image.setAttribute('width', width);
	image.setAttribute('margin', margin);

	// if the style you choose is 'unbuyable',
	if (style == 'unbuyable') {
		
		// set the image's id to 'unbuyable'
		image.setAttribute('id', 'unbuyable');
	}
	
	// if the style you choose is 'buyable',
	else if (style == 'buyable') {

		// set the image's id to 'buyable'
		image.setAttribute('id', 'buyable');
	}

	// append the image to the destination DOM object (typically chosen before calling this function
	destination.appendChild(image);
}

function populateKingdom(type) {

	// sets the kingdom variable equal to the div in the document by the same name
	var kingdom = document.getElementById("kingdom");

	// clears what was on there before
	kingdom.innerHTML = '';

	// loops through each kingdom card
	for (var each in KingdomCards) {

		// if the type of kingdom that you're going to populate is a 'buyable kingdom' (a representation of what can and cannot be bought), you execute the following code:
		if (type	 == 'buyable') {

		// sets the switch back to false at the beginning of the function. it will later be used to tell if the card which we're cycling through is buyable or not
		buyableSwitch = false;

			// loops through the list of buyable cards
			for (var every in buyableCards) {

				// if the name of the kingdom card is equal to the buyable name, and thus the kingdom card is buyable,
				if (KingdomCards[each].name == buyableCards[every]) {
					
					// sets the switch to true, to let us know that the kingdom card we're looping through is buyable or not
					buyableSwitch = true;	
				}
			}

			// now that we've determinined if the card is buyable or not, we add the image to the kingdom div with the corresponding styles (unbuyable, buyable) which have corresponding css styles
			if (buyableSwitch == false) {
				addImage('100px', '3px', KingdomCards[each].image, kingdom, 'unbuyable');
			}
			
			else if (buyableSwitch == true) {
				addImage('100px', '3px', KingdomCards[each].image, kingdom, 'buyable');
			}
			
				//adds a line break once it gets to half the cards (that way, there are even numbers of piles on two rows
				if (each == KingdomCards.length/2-1) {
				insertBR(kingdom);
			}
			
		}
		
		// if the type of kingdom you're trying to populate has no type, simply add the images normally
		else {
			addImage('100px', '3px', KingdomCards[each].image, kingdom);

			// with a line break in the middle
			if (each == KingdomCards.length/2-1) {
				insertBR(kingdom);
			}
		}
	}
}

//THE START OF THE GAME
function startGame() {
console.log(kingdomCards);
	deal();
	populateKingdom();
			cleanedUp = false;
			statusUpdate(players[0]);
			//assign phase buttons to current player
			document.getElementById("action").onclick = function() {actionPhase(players[0])};
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
	console.log(	 	player.Name					 +
									' has '							 +
									player.victory			 +
									' victory points!'	);
	var winner;
	for (var i = 0; i < players.length-1; i ++) {
		if (players[i].victory > players[i+1].victory) {
			winner = players[i];
		}
		else {
			winner = players[i+1];
		}
	}
	console.log(	players[i].Name			+
								': '								+
								players[i].victory	+
								' Victory Points ' );
	}
	alert(	winner.Name 								+
					' has won the gamE with ' 	+
					winner.victory 							+
					' Victory Points!'				 );
}
