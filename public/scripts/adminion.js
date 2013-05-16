
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
		quantity: 10	
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
		effects:{
			actions: 1,
			buys: 0,
			money: 0,
			cards: 2
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
		effects:{
			actions: 2,
			buys: 1,
			money: 2,
			cards: 0
		}	
	},
{
		name:"Market",
		cost:5,
		instructions:"+1 actions, +1 money, +1 buy, +1 card",
		effects:{
			actions: 1,
			buys: 1,
			money: 1,
			cards: 1
		}	
	},

	{
		name:"Woodcutter",
		cost:3,
		instructions:"+1 Buy. +$2.",
		effects:{
			buys: 1,
			money: 2,
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

]

function cardConstructor (type, cards) {
	for (var card in cards) {
		var Card = cards[card];

		if (Card.length == 4){
			var newCard = {
				type: type,
				name: Card[0],
				cost: Card[1],
				value: Card[2],
				quantity: Card[3] 
			};
		}
// since action cards are currently in object format, there is an else loop for action card constructing. i bet theres an easier way to transfer all the properties from one object to another, but figured it'd be quicker to do it this way and move on for now
		else {
			var newCard = {
				type: type,
				name: Card.name,
				cost: Card.cost,
				instructions: Card.instructions,
				action: Card.action,
				quantity: Card.quantity 				
			}
		}
		gameConfig.piles.push(newCard);
	};
};

cardConstructor (		'treasure', 	treasureTemplate		);
cardConstructor (		'victory', 		victoryTemplate			);
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
	var estate = gameConfig.piles[5];
	estate.quantity -= 3;
	var copper = gameConfig.piles[0];
	copper.quantity -= 7;
	shuffleDeck(newPlayer);
	drawHand(newPlayer);
	players.splice(player, 1, newPlayer);
	};
};

function drawHand(player) {
	for (n = 0; n<5; n++) {
		drawCard(player);
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
	var finding = true;
	while (finding) {
		for(var i = 0; i < myArray.length; i++) {
			if (myArray[i][property] === searchTerm) 
				finding = false;
				return myArray[i];
    	}
    alert(		'could not find requested card \n' +
							searchTerm
																								);
	}
}




function actionPhase(player){

	do {
		var action = false;

//creates a variable for storing the names of the available action cards. used later simply for giving player a list of options for playing
		var actionCards = "";

//goes through each card in your hand and determines if it has a valid action function (treasure and victory cards don't have an action function, so if your hand is full of non-action cards, the program won't even bother with going through the playcard phase.
		for (var n in player.hand) {	
			if (player.hand[n].action) {

//var action is a switch to turn playcard phase on or off
				action = true;
//adds the name of the action card to the list of available action cards.
				actionCards += player.hand[n].name+', ';

			}
		}

//if there is one or more action cards in your hand, the following runs and asks if player wants to play a card. 


		if (action) {
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
											playedCard.name							 +
									 		' card									\n'+

											playedCard.instructions			);

			}
		}

		else if (player.actions > 0) {
			console.log(		player.Name																								+
											', you have '																							+ 
											player.actions	 																					+
											' actions left, but no action cards to action them with!'	);
			break;
		}

		else {
			alert	(		player.Name 																	 +
								", you don't have any actions cards to play!"	);
		}

		player.actions --;

	}

	while (player.actions > 0);
}

function buyPhase(player) {
	for (var card in player.hand) {
		if (player.hand[card].type == 'treasure') {
//BUY PHASE STARTS BY ADDING ALL TREASURE CARD VALUES TOGETHER
		player.money += player.hand[card].value;
		}
	}
	do {
		console.log(	player.Name	 											+ 
								" has " 			 											+ 
									player.buys	 											+
								' buys and ' 	 											+ 
									player.money 											+
								' moneys!'													+
								'	and can buy the following cards:');
		var buyableCards = [];

// goes through all the available cards in piles and gathers a list of buyable cards
		for (var card in gameConfig.piles) {
			if (gameConfig.piles[card].cost <= player.money) {
				buyableCards += gameConfig.piles[card].name + ", ";
			}
		}
		console.log(buyableCards);
//asks player which of the buyable cards they would like to buy
		var buy = prompt(		player.Name 									+ 
												'! 												 \n'+

												'with your ' 									+
												player.money									+
												' money and ' 								+
												player.buys 									+
												' buys,'+ 

												'what card do you want? 	 \n'+ 
												/*list of */
												buyableCards 							  	+
												'?													');

//finds the index of the card in gameConfig.piles whose name matches var buy, and player gains that card

		gainCard(buy, player);	
		var boughtCard = findCard(gameConfig.piles, 'name', buy)
		player.money -= boughtCard.cost;
		player.buys --;
	}
// we want the buying to continue while player has buys 
	while (player.buys > 0);
}

function gainCard(card,player) {
	var gainingCard = findCard(gameConfig.piles, 'name', card);
	player.discard.push(gainingCard);
	gainingCard.quantity --;
	console.log(		player.Name															 +
			 						' gained a '														 +
									gainingCard.name																 +
						 			' and added it to their discard pile	\n'+

									gainingCard.name																 +
						 			' pile now has '												 +
									gainingCard.quantity														 +
						 			' cards left in it'											);

	if (gainingCard.quantity <= 0) {

		gameConfig.exhausted.push(gainingCard);
		
		gameConfig.piles.splice(gameConfig.piles.indexOf(gainingCard), 1);
		console.log(	gainingCard.name								 								+
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

	actionPhase(player);
	buyPhase(player);
	cleanupPhase(player);

}

function discardCard(player, card) {
	player.discard.push(card);
	player.hand.splice(player.hand.indexOf(card),1);
}

function discardHand(player) {
	while (player.hand.length > 0) {
		discardCard(player, player.hand[0]);
	}
}

//to prepare for the players next turn, all player attributes get reset to default values, hand is discarded and a new one drawn
function cleanupPhase(player) {
		discardHand(player);
		drawHand(player);
		player.money = 0;
		player.actions = 1;
		player.buys = 1;
}


//
//
//THE START OF THE GAME

deal();
while (exhausted < gameConfig.exhaustLimit) {
	for (var player in players) {
		turn(players[player]);
	}
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



endGame();

