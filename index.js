/**
  * This file keeps the game code
  *
  */

var cards = []
var treasureTemplate = [
	{
		type:'treasure',
		name:'copper',
		cost:0,
		value:1,
		quantity:100
	},
	{	
		type:'treasure',
		name:'silver',
		cost:3,
		value:2,
		quantity:50
	},
	{
		type:'treasure',
		name:'gold',
		cost:6,
		value:3,
		quantity:25
	},
	{
		type:'treasure',
		name:'platinum',
		cost:9,
		value:5,
		quantity:15
	},
	{
		type:'treasure',
		name:'potion',
		cost:4,
		value:0,
		quantity:20	
	},
]
var victoryTemplate = [
	{
		type:'victory',
		name:'estate',
		cost:2,
		value:1,
		quantity:50	
	}, 
	{
		type:'victory',
		name:'duchy',
		cost:5,
		value:3,
		quantity:30	
	}, 		
	{
		type:'victory',
		name:'province',
		cost:8,
		value:5,
		quantity:20	
	}, 
	{
		type:'victory',
		name:'colony',
		cost:11,
		value:10,
		quantity:15	
	}, 
	{
		type:'victory',
		name:'curse',
		cost:0,
		value:-1,
		quantity:25	
	}
]

var actionTemplates = [
	{
		type:"action",
		name:"Council Room",
		cost:5,
		instructions:"+4 cards, +1 buy",
		duration:0,
		effects:{
			actions: 0,
			buys: 1,
			money: 0,
			cards: 4
		}		
	},
	{
		type:"action",
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
		type:"action",
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
		type:"action",
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
	}
];

function generatePlayer() {
	return {
		id : 0,
		name,
		deck: [],
		actions:1,
		buys:1,
		money:0,
		cards:5,
		victory:0,
		hand: [],
		discard:[]
	};
}

function deal() {
	for (var player in players) {
		player = generatePlayer();
		player.deck.push((victoryTemplate[0]*3),(treasureTemplate[0]*7));
		
	}
}

function turn(player) {
	do {
		playCard(player);		
	}
	while (player.actions > 0);
	do {
		buyCard(player);
	}
	while (player.buys > 0);
}

function playCard(player) {
//player chooses a card to play, if any
	if (chosenCard) {
//if choseenCard has an action that it does, call that action
		chosenCard.action();
//add the actions, buys, money, and +cards to the player's attributes
		player.actions += chosenCard.effects.actions;
		player.buys += chosenCard.effects.buys;
		player.money += chosenCard.effects.money;
//if the card gives +cards, the player will call the function drawCard, add 1 to the #of cards in players hand, and take 1 off of the card's effects, for cases of +cards > 1
		while (chosenCard.effects.cards > 0) {
			drawCard(player);
			player.cards ++;
			chosenCard.effects.cards --;
		}
//since chosenCard is played, -1 cards from #of cards in player's hand, 
		player.cards --;
//discard chosenCard
		player.discard.push(chosenCard);
//remove chosenCard from hand
		player.hand.splice(player.hand.indexOf(chosenCard), 1);
//-1 actions, cuz it done got used up
		player.actions --;
	}
}
//a function to draw a card - add a new card from the top of the deck to the player's hand, +1 to #ofcardsinhand, remove the new card from the top of the deck
function drawCard(player){
	var newCard = player.deck[0];
	player.hand.push(newCard);
	player.cards ++;
	player.deck.splice(player.deck[0], 1);
//if the splice leaves the deck with no cards in it, shuffle the deck!
	if (player.deck.length == 0) {
		shuffleDeck(player)
	}
}
//draw five cards
function drawHand(player) {
	for (n = 0; n<5; n++) {
		drawCard(player)	
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
	console.log(player+" has "+player.money+" moneys!")
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

var gameConfig = {
	numPlayers,
	piles: [],
	numPiles:10,
	exhausted : [],
	exhaustLimit : 3,
	}


function	pickPiles() {
	for (var i = 0; i<=gameConfig.numPiles; i++) {
		var Random = Math.floor(Math.random() * actionTemplates.length);
		gameConfig.piles.push(actionTemplates[Random]);
	}
}

var exhausted = 0;
var players = [];
//the start of the game
for (var num in players) {
	drawHand(players[num]);
}
//each player takes a turn, as long as end condition isn't met
while (gameConfig.exhausted.length < gameConfig.exhaustLimit) {
	for (var num in players) {
		turn(num);
}
//the end of the game- if end condition is met or exceeded, add up all teh victory points for each player
if (gameConfig.exhausted.length >= gameConfig.exhaustLimit || victoryTemplate[2].quantity <= 0) {
//the original rules say that once provinces are depleted, the game ends too, thus the victoryTemplate[2]
	for (var player in players) {
		for (var cards in player.deck)
			if (cards.type == 'Victory') {
				player.victory += cards.value;
			}
		console.log(player+" has "+player.victory+" victory points!";
	}
	
}


