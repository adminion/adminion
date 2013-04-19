
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

requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: 'scripts/lib',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
//        app: '../app'
    }
});

// we'll use temporary gameConfig here, because we don't have the 'game configurator' built yet
var gameConfig = {
	numPlayers:2,
	cards: { treasure : [], victory : [], action : [] },
	numPiles:10,
	exhausted : [],
	exhaustLimit : 3
};

function startGame(config) {
	// load the adminion module
	var Game = new require(['adminion']);
		
	return Game(config);
	
};



var Adminion = function (_config) {
	console.log(_config);
	
	var Game = {	
		exhausted: 0,
		players: ['zane', 'jeff'],
		trash: []
	};
	
};

function generatePlayer() {
	return {
		id : 0,
		name: "",
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
	['copper', 	0, 1, 100	],
	['silver', 		3, 2, 50		],
	['gold',		6, 3, 25		],
	['platinum', 	9, 5, 15		],
	['potion', 	4, 0, 20		]
]; 

// 	name	           cost, value,quantity
var victoryTemplate = [
	['estate', 	2,    1,   50	],
	['duchy', 	5,    3,   30	],
	['province', 	8,    5,   20	],
	['colony', 	11, 10,  15	],
	['curse', 	0,   -1,   25	]
];

function cardConstructor (type, cards) {
	
};



function turn(player) {
	do {playCard(player)}
		while (player.actions > 0);
	do {buyCard(player)}
		while (player.buys > 0);
	drawHand(player);
}

function playCard(player) {

var chosenCard = prompt('choose a card from your hand to play'+'available: '+player.hand);

	if (chosenCard) {

//if choseenCard has an action that it does, call that action
		chosenCard.action();

//add the actions, buys, money, and +cards to the player's attributes
		player.actions += chosenCard.effects.actions;
		player.buys += chosenCard.effects.buys;
		player.money += chosenCard.effects.money;

//if the card gives +cards, the player will call the function 
//drawCard, and take 1 off of the card's effects, for cases of +cards > 1
		while (chosenCard.effects.cards > 0) {
			drawCard(player);
			chosenCard.effects.cards --;

//discard chosenCard
			player.discard.push(chosenCard);
//remove chosenCard from hand
			player.hand.splice(player.hand.indexOf(chosenCard), 1);
//-1 actions, cuz it done got used up
			player.actions --;
		}
	}
}



//move the discarded cards back into the deck, empty the discard pile. this function essentially swaps each card in the deck (from place 0 to end of deck) with a random other card in the deck. i found this method of shuffling online somewhere- if it isn't random enough, maybe it would work better running through the for loop multiple times?
function shuffleDeck(player) {
	player.deck = player.discarded;
	player.discarded = [];
	for (var n = 0; n < player.deck.length - 1; n++) {
		var k = n + Math.floor(Math.random() * (player.deck.length - n));
		var temp = player.deck[k];
		player.deck[k] = player.deck[n];
		player.deck[n] = temp;
	}
}

//as player enters buy phase, add up the treasure cards and add them to the player's money attribute
function buyCard(player) {
	for (var card in player.hand) {
		if (card.type == 'treasure') {
			player.money += card.value;
		}
	}
	console.log(player+" has "+player.money+" moneys!");

//player chooses card to buy (var = chosenCard). i'm not sure how we want to do that interaction
//if the player can afford the card, add it to their discard pile, use their buy, take the money for the card out of the player's money, and take off 1 from the chosenCard pile
	if (player.money >= chosenCard.cost) {
		player.discard.push(chosenCard);
		player.buys --;
		player.money -= chosenCard.cost;
		chosenCard.quantity --;
		if (chosenCard.quantity <= 0){
			exhausted.push(chosenCard);
			console.log(chosenCard+" has been exHAUSted..");
		}
		console.log(player+" gains "+chosenCard);
	}
}

function pickPiles() {
	var cardsToChooseFrom = [];
// make sure to add all constructed action cards and specialty victory/treasure cards
	for (var i = 0; i<=gameConfig.numPiles; i++) {
		var Random = Math.floor(Math.random() * cardsToChooseFrom.length);
		gameConfig.piles.push(cardsToChooseFrom[Random]);
		cardsToChooseFrom.splice(Random, 1);
// since we don't want to select the same action card again, we remove the chosen card from the actionTemplate
	}
}
function deal() {
	for (var player in players) {
		player = generatePlayer();
	console.log("player: ");
	console.log(player);
		player.deck.push((victoryTemplate[0]),(victoryTemplate[0]),(victoryTemplate[0]),(treasureTemplate[0]),(treasureTemplate[0]),(treasureTemplate[0]),(treasureTemplate[0]),(treasureTemplate[0]),(treasureTemplate[0]),(treasureTemplate[0]));
	}
	console.log('players deck consists of ');
	console.log(player.deck); 
	console.log(player.deck[0]);
	drawHand(player);
};
//the start of the game
deal();


//a function to draw a card - add a new card from the top of the deck to the player's hand, remove the new card from the top of the deck
function drawCard(player){
	player.hand.push(player.deck[0]);
	player.deck.splice(player.deck[0], 1);

//if the splice leaves the deck with no cards in it, shuffle the deck!
	if (player.deck.length == 0) {
		shuffleDeck(player)
	}
}

//draw five cards
function drawHand(player) {
	for (n = 0; n<5; n++) {
		drawCard(player);
	}
	console.log(player.hand);
}

//each player takes a turn, as long as end condition isn't met
//while (gameConfig.exhausted.length < gameConfig.exhaustLimit) {
	for (var num in players) {
		turn(num);
	}
// }







//the end of the game- if end condition is met or exceeded, add up all teh victory points for each player
if (gameConfig.exhausted.length >= gameConfig.exhaustLimit || victoryTemplate[2].quantity <= 0) {
//the original rules say that once provinces are depleted, the game ends too, thus the victoryTemplate[2]
	for (var player in players) {
		for (var cards in player.deck) {
			if (cards.type == 'Victory') {
				player.victory += cards.value;
			}
			console.log(player+" has "+player.victory+" victory points!");
		}
	}
}


