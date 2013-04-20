var gameConfig = {
	numPlayers:2,
	cards: { treasure : [], victory : [], action : [] },
	numPiles:10,
	piles:[],
	exhausted : [],
	exhaustLimit : 1
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
cardConstructor ('treasure', treasureTemplate);
cardConstructor ('victory', victoryTemplate);
cardConstructor ('action', actionTemplate);
console.log(gameConfig.piles)

//DEAL IS ONLY DONE ONCE IN THE START OF THE GAME
function deal() {
	for (var player in players) {
//CREATES A NEW PLAYER PROFILE AND INSERTS IT INTO THE ARRAY OF PLAYERS
		var newPlayer = generatePlayer(players[player]);

	console.log("player: ");
	console.log(newPlayer);
//PUSHES 7 COPPER AND 3 ESTATES INTO NEW PLAYER'S DISCARD PILE (SHUFFLEDECK() WILL LATER MOVE DISCARD PILE INTO DECK
		newPlayer.discard.push(gameConfig.piles[0], gameConfig.piles[0], gameConfig.piles[0], gameConfig.piles[0], gameConfig.piles[0], gameConfig.piles[0], gameConfig.piles[0],gameConfig.piles[5], gameConfig.piles[5], gameConfig.piles[5]);
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
	player.hand.push(player.deck[0]);
console.log(player);
console.log(player.deck[0]);
	alert(player.Name+' drew a '+player.deck[0].name+' card');
	player.deck.splice(0, 1);

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
				console.log(actionCards, player.hand[n]);
			}
		}

//if there is one or more action cards in your hand, the following runs and asks if player wants to play a card. need to figure out a way to redo the prompt if the users input isn't in their hand or is misspelled
		if (action) {
				var playCard = prompt(player.Name+', you have action card(s) in your hand\n'+actionCards+'\nwhich, if any do you want to play?\nleave blank if you choose not to play anything');
				console.log(actionCards.indexOf(playCard));
		


//if they do choose a card, continue
			if (playCard) {
			
//goes through each card in the players hand to see if what the player entered matches a card. if it does indeed match a card, var playCard is set equal to the card that exists in players hand, and the placeholder of the card is saved for later removal of the card from the hand
				var placeHolder;
				for (var each in player.hand) {
					if (player.hand[each].name == playCard) {
						playCard = player.hand[each];
						placeHolder = each;
					}
				}
//discard played card. might not work in instances where multiple of the same card exist in players hand.

				discardCard(player, player.hand[placeHolder]);

//once thats all settled, run the action function of the played card, and remove one action from the player's attributes. 
		console.log(player.hand.length);
		console.log(player.actions);
				alert('you played a '+playCard.name+' card\n'+playCard.instructions);
				playCard.action(player);
console.log(player.hand.length);
console.log(player.actions);
			}
		}
		else if (player.actions > 0) {
			alert('you have '+player.actions+' actions left, but no action cards to action them with!');
			break;
		}
		else {
			alert(player.Name+", you don't have any actions cards to play!");
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
		console.log(player.Name+" has "+player.buys+' buys and '+player.money+" moneys!");
		console.log("and can buy the following cards:");
		var buyableCards = [];

// goes through all the available cards in piles and gathers a list of buyable cards
		for (var card in gameConfig.piles) {
			if (gameConfig.piles[card].cost <= player.money) {
				buyableCards += gameConfig.piles[card].name + ", ";
			}
		}
		console.log(buyableCards);
//asks player which of the buyable cards they would like to buy
		var buy = prompt(player.Name+'! \n with your '+player.money+' money and '+player.buys+' buys,\n what card do you want?\n' + buyableCards+'?');

//with the chosen card, go through each pile and check if it was the chosen one, if it is, gain() that card
		for (var pile in gameConfig.piles){
			if (gameConfig.piles[pile].name == buy) { 

//i made a gainCard function because later on, some action cards will call for gaining a card instead of buying it. 
				gainCard(gameConfig.piles[pile])
		player.money -= gameConfig.piles[pile].cost;
			}
		}
		player.buys --;
	}
// we want the buying to continue while player has buys 
	while (player.buys > 0);
}

function gainCard(card) {
	players[player].discard.push(card);
	card.quantity --;
	alert(players[player].Name+' gained a '+card.name+' and added it to their discard pile\n'+card.name+' pile now has '+card.quantity+' cards left in it');

	if (card.quantity <= 0) {
		exhausted ++;
		gameConfig.exhausted.push(card);
		
		gameConfig.piles.splice(gameConfig.piles.indexOf(card), 1);
		alert(card.name+' pile has been EXHAUSTED\n'+(gameConfig.exhaustLimit - exhausted)+' piles left til the end of the game!');
	}

	console.log(players[player]);
} 

function turn(player) {
	alert(player.Name+'! \n your hand consists of: \n'+player.hand[0].name +'\n'+player.hand[1].name+'\n'+ player.hand[2].name+'\n'+ player.hand[3].name+'\n'+ player.hand[4].name);

	actionPhase(player);
	buyPhase(player);
	endTurn(player);
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
function endTurn(player) {
		discardHand(player);
	if (exhausted < gameConfig.exhaustLimit) {
		drawHand(player);
		player.money = 0;
		player.actions = 1;
		player.buys = 1;
		console.log(player.discard);
	}
}


//
//
//THE START OF THE GAME
// for testing purposes, i have just made it do x amount of turns. eventually, a turn will happen in a while loop
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
		for (var card in player.hand) {
			player.deck.push(player.hand[card]);
		}
		player.hand.splice(0,player.hand.length);

//go through each card in player's discard pile and puts them into their deck
		for (var card in player.discard) {
			player.deck.push(player.discard[card]);
		}
		player.discard.splice(0,player.discard.length);
//then loop through each players deck
		for (var card in player.deck) {

//set the variable card equal to the player's card in their deck
			card = player.deck[card];

//if the card is a victory card, add a victory point to the victor
			if (card.type == 'victory') {
				player.victory += card.value;
			}
		}
	alert(player.Name+' has '+player.victory+' victory points!');
	}
}

alert('end of game');

endGame();
console.log(player);
