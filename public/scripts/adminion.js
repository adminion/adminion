
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
	image:		"http://dominion.diehrstraits.com/scans/seaside/pearldiver.jpg",
	quantity: 10,
	action: function(player) {
	player.actions += 1;
	drawCard(player);
	alert('you played a Pearl Diver');
	}
	 },
	
	{name:		"Smugglers",	
	type:		"Action",	
	cost:		3,
	instructions:	"Gain a copy of a card costing up to $6 that the player to your right gained on his last turn.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/smugglers.jpg" ,
	quantity: 10 },
	
		{name:		"Bridge",
	type:		"Action",
	cost:		4,
	instructions:	"+1 Buy; +$1. All cards (including cards in players' hands) cost $1 less this turn, but not less than $0.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/bridge.jpg",
	quantity: 10 },
	
	{name:		"Mining Village",
	type:		"Action",
	cost:		4,
	instructions:	"+1 Card; +2 Actions. You may trash this card immediately. If you do, +$2.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/miningvillage.jpg",
	quantity: 10 },

	{name:		"Treasury",
	type:		"Action",
	cost:		5,
	instructions:	"+1 Card; +1 Action; +$1. When you discard this from play, if you didn't buy a Victory card this turn, you may put this on top of your deck.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/treasury.jpg",
	quantity: 10  },

	{name:		"Upgrade",
	type:		"Action",
	cost:		5,
	instructions:	"+1 Card; +1 Action. Trash a card from your hand. Gain a card costing exactly $1 more than it.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/upgrade.jpg",
	quantity: 10 },

		{name:		"Festival",
	type:		"Action",
	cost:		5,
	instructions:	"+2 Actions, +1 Buy; +$2.",
	image:		"http://dominion.diehrstraits.com/scans/base/festival.jpg",
	quantity: 10 },
	
	{name:		"Laboratory",
	type:		"Action",
	cost:		5,
	instructions:	"+2 Cards; +1 Action.",
	image:		"http://dominion.diehrstraits.com/scans/base/laboratory.jpg",
	quantity: 10 },
	
	{name:		"Torturer",
	type:		"Action-Attack",
	cost:		5,
	instructions:	"+3 Cards. Each other player chooses one: he discards 2 cards; or he gains a Curse card, putting it in his hand.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/torturer.jpg",
	quantity: 10 },
	
		{name:		"Harem",
	type:		"Treasure-Victory",
	cost:		6,
	instructions:	"Worth $2. 2 Victory Points.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/harem.jpg",
	quantity: 10 }
	
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
		//replaces what used to be just the player's name with the full player's profile(newPlayer)
		players.splice(player, 1, newPlayer);

//PUSHES 7 COPPER AND 3 ESTATES INTO NEW PLAYER'S DISCARD PILE (SHUFFLEDECK() WILL LATER MOVE DISCARD PILE INTO DECK
		players[player].discard.push(		gameConfig.piles[0], 
															gameConfig.piles[0], 
															gameConfig.piles[0], 
															gameConfig.piles[0], 
															gameConfig.piles[0],
 															gameConfig.piles[0], 
															gameConfig.piles[0],
															gameConfig.piles[5], 
															gameConfig.piles[5], 
															gameConfig.piles[5]);
		shuffleDeck(players[player]);
		drawHand(players[player]);
		players[player].victory = 3;


	};
};

//in beginning of game, this function populates the kingdom with kingdom cards which can be bought

function drawHand(player) {
	var playerHand = document.getElementById("playerCards");
	playerHand.innerHTML = "";
	for (n = 0; n<5; n++) {
		drawCard(player);
	}
	

	
	
}


// a function for a player to draw a card from their deck
function drawCard(player){

	// if the player's deck is down to 0, shuffle the deck!
	if (player.deck.length == 0) {
		shuffleDeck(player);
	}

	// create a newCard variable that is equal to the first card in the player's deck. shift() returns and removes the first item from an array
	var newCard = player.deck.shift();

	// set playerHand equal to the DOM div playerCards
	var playerHand = document.getElementById("playerCards");

	// push the newCard into the player's hand
	player.hand.push(newCard);

	// add the image of the newCard into the playerCards div:
	
	// 				width	|margin	| img src		|div destination|  class  |	id
	addImage('80px', '3px', newCard.image, playerHand, newCard.type, newCard.name);
	
	
	// if this is during the player's actionphase, update the actionevent on the newcard so that it can be bought
	if (actionPhaze) {
	console.log(actionPhaze);
	console.log(document.getElementById(newCard.name).getElementByClassName('Action'));
	
	
		updateActionEvent(document.getElementById(newCard.name));
	}

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


	var actionCards = "";

function actionCheck(player) {

	// starts by switching action variable to false. the action variable is used to determine if there are action cards in the player's hand or not
	var action = false;

	// goes through each card in your hand and determines if it is an action card or not. used to turn Actionphase on/off
	for (var n in player.hand) {	

		// runs if the card's type has the string 'Action' in it
		if (player.hand[n].type.indexOf('Action') != -1) {

			// var action is a switch to turn playcard phase on or off
			action = true;
		}
	}

	// if action is true and there are action cards in the player's hand, the action button is turned on
	if (action) {
		document.getElementById("action").disabled=false;
	}

	// if not, turn the button off
	else {
		document.getElementById("action").disabled=true;
	}
	console.log('actioncheck: ' + action);
}


var actionPhaze = false;

// initiates action phase for player
function actionPhase(player){

	// set actionphaze to true, to signify that the actionphase is in effect
	actionPhaze = true;

	// disable the action button
	document.getElementById('action').disabled = true;

	// for every card in the player's hand
	for (var each in player.hand) {

		// update the action event each card, by grabbing the playerCards div and updating the action event for each child element in playerCards
		updateActionEvent(document.getElementById('playerCards').children[each]);

		// set the card's object's element property to match the card's element on the page
		player.hand[each].element = document.getElementById('playerCards').children[each];

		// log the element
		console.log(document.getElementById('playerCards').children[each]);
	}

	// if the player still has actions, but they don't have any action cards let them know their situation
	if (player.actions > 0 && action == false) {
		console.log(			
									player.Name																	+	
									', you have'																+ 
									player.actions	 														+
									' actions left, but no action cards to action them with!'	);
	}

}

function getElementIndex(element) {

	var child = element;
	var parent = child.parentNode;
	var children = parent.children;
	var count = children.length;
	var child_index;
	for (var i = 0; i < count; i++) {
	  if (child == children[i]) {
	    child_index = i;
	    return child_index;
	    break;
	  }
	}

}

// a function to play a card, given the card's element and the player
function playCard(element, player) {

	var child = element;
	var parent = child.parentNode;
	var children = parent.children;
	var count = children.length;
	var child_index;
	for (var i = 0; i < count; i++) {
	  if (child == children[i]) {
	    child_index = i;
	    break;
	  }
	}
	console.log(child_index);
	var cardOb = player.hand[child_index];
	cardOb.action(player);
	discardCard(player, cardOb);

	player.actions -= 1;
		statusUpdate(player);
		console.log('actions: ' + player.actions);
	if (player.actions == 0) {
		alert('you dun w/ACTIOnS!');
		actionphaze = false;
	}
	
}

function updateActionEvent(element) {

	if (element.className == 'Action') {
		element.onclick = function() {
			playCard(element, players[0]);
		};
	}
	else if (element.className == 'normal') {
		element.onclick = null;
	}

}

// a function to add an event in order to trigger buycard()
function updateBuyEvent(element) {

  if (element.className == 'buyable') {
	element.onclick = function() {
	buyCard(element.id, players[0]);
		};
   	console.log('event added?!!?!');

  }
  else if (element.className == 'normal') {
  	element.onclick = null;
  }

}

//the buy phase of a player's turn
function buyPhase(player) {

	// disable the buy button
	document.getElementById('buy').disabled = true;

	// if player has buys left:
	if (player.buys > 0) {

	// goes through each card in the player's hand to check if there are treasure cards
	for (var card in player.hand) {

// if the card's type is treasure,
		if (player.hand[card].type == 'treasure') {

// add the value of the treasure card to the player's usable money supply
		player.money += player.hand[card].value;
		}
	}
	statusUpdate(player);
// console.logs the player, how many buys and money they have to spend, and a list of cards that they're able to buy this turn

		console.log(	player.Name	 											+ 
								" has " 			 											+ 
									player.buys	 											+
								' buys and ' 	 											+ 
									player.money 											+
								' moneys!'												 );

		// goes through all the available cards in the kingdom to set them to buyable
		for (var card in KingdomCards) {
		
			// if the cost of the card is less than or equal to how much money the player has, 	
			if (KingdomCards[card].cost <= player.money) {
	
				// the card's dom object's class is switched to 'buyable'
				document.getElementById(KingdomCards[card].name).setAttribute('class', 'buyable');


			}
			else {
			document.getElementById(KingdomCards[card].name).setAttribute('class', 'unbuyable');
			}
			
				// a click event is added to the card, based on its buyability
				updateBuyEvent(document.getElementById(KingdomCards[card].name), "click");

		}
	}
}

// a function to buy a card, given a player and the name of a card
function buyCard(card, player) {

	// loops through KingdomCards in order to find the card object (because we're given just the name of the card)
	for (var each in KingdomCards) {
		
		// if the given card name is matched up with the card object,
		if (card == KingdomCards[each].name) {

			// set card equal to the card object
			card = KingdomCards[each];
			
			// subract 1 buy from the player
			player.buys -= 1;
		
			// and player gains that card
			gainCard(card, player);
		}
	}

	console.log(player.money - card.cost);

	// subtract the cost of the card from the player's money
	player.money -= card.cost;
	console.log(player.money);


	// if the player has no more buys,
	if (player.buys == 0) {

		// engage cleanup Phase
		cleanupPhase(player);
	}
	//update the player's status!
	statusUpdate(player);
}


// a function to gain a card, given its name and the target player
function gainCard(card,player) {

	// alert that the player has gained the card
	
	if (player.buys == 0) {
	alert(player.Name+ ' gained a '+card.name+' \n you have no more buys.. END OF TURN!');	
	}
	else {	
		alert(player.Name+ ' gained a '+card.name);
	}

	console.log(	player.Name		 +
								' gained a '	 +
								card.name			 )

	// push the card into the player's discard pile
	player.discard.push(card);

	// subtract 1 from the card's quantity
	card.quantity --;
	
	// if the gained card is a victory card, add the victory points from the card to the player's victory points
	if (card.type == 'victory') {
		player.victory += card.value;
	}
	
	// if the card pile has run out (quantity = 0), 
	if (card.quantity <= 0) {

		// push the card into the list of exhausted cards
		gameConfig.exhausted.push(card);
		
		// log the new developments
		console.log(	card.name								 																 +
							 ' 	pile has been EXHAUSTED															  \n'+
							 
							 // and how many more piles exhaustion until the end of the game
							 (	gameConfig.exhaustLimit - gameConfig.exhausted.length		)+
							 '	piles left til the end of the game!		'									);
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

	var hand = document.getElementById('playerCards');
//	console.log(player.hand.indexOf(card));
//	console.log(hand.childNodes.length);



hand.removeChild(hand.childNodes[player.hand.indexOf(card)]);

	


			// push given card into player's discard pile
	player.discard.push(player.hand[player.hand.indexOf(card)]);


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
	
	for (var i=0; i<KingdomCards.length; i += 1) {
		var element = document.getElementById(KingdomCards[i].name);
		element.setAttribute('class', 'normal');

				// a click event is added to the card, based on its buyability
				updateBuyEvent(element);

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
	var statBox = document.getElementById("stats");

	// resets statBox to nothin
	statBox.innerHTML = "";

	// creates stats, a list of stats to later publish
	var stats = document.createElement("ul");

	// adds all specificed stats

	addStat("actions: "+player.actions, 'bold');
	addStat("money: "+player.money, 'bold');
	addStat("buys: "+player.buys, 'bold');
	addStat("drawPile: "+player.deck.length);
	addStat("discard: "+player.discard.length);			
	addStat("VP: "+player.victory);			

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

	// log the creation of the image
	console.log('img created: \n');
	console.log(image);

if (destination == document.getElementById("playerCards")) {
		console.log('handlegnth...'+players[0].hand.length);

		playerhands.push(image);
		console.log(playerhands);
		playerhands[0].setAttribute('id', 'balls');

	}

	// if there is a class specified, set image's class to match
	if (crass) {
		image.setAttribute('class', crass);

		// if the class of the image is kingdomcard, the image is going to have to be wrapped in a div wrapper, in order to display only part of the card
		if (crass == 'kingdomCard' || crass == 'kingdomCardBottom' || crass == 'kingdomTreasure') {

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
	
		// if the type of kingdom you're trying to populate has no type, simply add the images normally
		addImage('100px', '0px', KingdomCards[each].image, kingdom, 'kingdomCard', KingdomCards[each].name);

		addImage('100px', '0px', KingdomCards[each].image, kingdom, 'kingdomCardBottom')

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
