var gameConfig = {
	numPlayers:2,
	cards: { treasure : [], victory : [], action : [] },
	numPiles:10,
	piles:[],
	exhausted : [],
	exhaustLimit : 3
};
console.log(gameConfig);
var exhausted = 0;
var players = ['zane'];
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
// 	name	           cost, value,quantity
var treasureTemplate = [
	['copper', 	0, 1, 100, 'treasure'	],
	['silver', 		3, 2, 50, 'treasure'		],
	['gold',		6, 3, 25, 'treasure'		],
	['platinum', 	9, 5, 15, 'treasure'		],
	['potion', 	4, 0, 20, 'treasure'		]
]; 
//for now, i added 'treasure' to the end, until the constructor function is built


// 	name	           cost, value,quantity
var victoryTemplate = [
	['estate', 	2,    1,   50	],
	['duchy', 	5,    3,   30	],
	['province', 	8,    5,   20	],
	['colony', 	11, 10,  15	],
	['curse', 	0,   -1,   25	]
];
function cardConstructor (type, cards) {
	for (var card in cards) {
		var Card = cards[card];
		var newCard = {
			type: type,
			name: Card[0],
			cost: Card[1],
			value: Card[2],
			quantity: Card[3] 
		};
		gameConfig.piles.push(newCard);
	};
};
cardConstructor ('treasure', treasureTemplate);
cardConstructor ('victory', victoryTemplate);
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

function buyCard(player) {
	for (var card in player.hand) {
		if (player.hand[card].type == 'treasure') {
//BUY PHASE STARTS BY ADDING ALL TREASURE CARD VALUES TOGETHER
		player.money += player.hand[card].value;
		}
	}
	do {
		console.log(player.Name+" has "+player.money+" moneys!");
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
		var buy = prompt(player.Name+'! \n with your '+player.money+' money, \n what card do you want?\n' + buyableCards+'?');
//with the chosen card, go through each pile and check if it was the chosen one, if it is, gain() that card
		for (var pile in gameConfig.piles){
			if (gameConfig.piles[pile].name == buy) { 
				gainCard(gameConfig.piles[pile])
		player.money -= gameConfig.piles[pile].cost;
			}
		}
		player.buys --;
	}
	while (player.buys > 0 && player.money > 0);
	player.buys = 1;
	player.money = 0;
}
function gainCard(card) {
	players[player].discard.push(card);
console.log(players[player].Name+' gained a '+card.name+' and added it to their discard pile');
	card.quantity --;
console.log(card.name+' pile now has '+card.quantity+' cards left in it');
	console.log(players[player]);

} 
function turn(player) {
	console.log('player '+player.Name+"'s hand consists of");
	console.log(player.hand[0].name , player.hand[1].name, player.hand[2].name, player.hand[3].name, player.hand[4].name);
//	do {playCard(player)}
//		while (player.actions > 0);
	buyCard(player);
	endTurn(player);
}
function discardHand(player) {
	var discardCards = [];
	for (var each in player.hand){
		discardCards.push(player.hand[each]);
	}
	player.hand = [];
	for (var each in discardCards) {
		player.discard.push(discardCards[each]);
	}
}

function endTurn(player) {
	discardHand(player);
	drawHand(player);
	player.money = 0;
	player.actions = 1;
	player.buys = 1;
	console.log(player.discard);
}


//
//
//THE START OF THE GAME
deal();
for (var player in players) {
	turn(players[player]);
}
for (var player in players) {
	turn(players[player]);
}
for (var player in players) {
	turn(players[player]);
}
