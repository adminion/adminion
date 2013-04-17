adminion
========

administrate your deck
var cards = []
cardTemplate = {
  treasure:{
		type:'treasure',
		name:'copper',
		cost:0,
		value:1,
		quantity:100
	}, 
	treasure:{
		type:'treasure',
		name:'silver',
		cost:3,
		value:2,
		quantity:50
	},
	treasure:{
		type:'treasure',
		name:'gold',
		cost:6,
		value:3,
		quantity:25
	},
	treasure:{
		type:'treasure',
		name:'platinum',
		cost:9,
		value:5,
		quantity:15
	},
	treasure:{
		type:'treasure',
		name:'potion',
		cost:4,
		value:0,
		quantity:20	
	},
	victory:{
		type:'victory',
		name:'estate',
		cost:2,
		value:1,
		quantity:50	
	}, 
	victory:{
		type:'victory',
		name:'duchy',
		cost:5,
		value:3,
		quantity:30	
	}, 		
	victory:{
		type:'victory',
		name:'province',
		cost:8,
		value:5,
		quantity:20	
	}, 
	victory:{
		type:'victory',
		name:'colony',
		cost:11,
		value:10,
		quantity:15	
	}, 
	victory:{
		type:'victory',
		name:'curse',
		cost:0,
		value:-1,
		quantity:25	
	}
}

function generatePlayer() {
	return {
		id : 0,
		name,
		deck: []
	};
}

function deal() {
	for (var player in players) {
		player = generatePlayer();
		player.deck.push((victory[0]*3),(treasure[0]*7));
	}
}
function turn() {

}

var gameConfig = {
	numPlayers,
	piles: [],
	numPiles:10,
	exhausted : [],
	exhaustLimit : 3,
	}
}

function	pickPiles() {
		for (var i = 0; i<=gameConfig.numPiles; i++) {
			var Random = Math.floor(Math.random() * actionTemplates.length);
			gameConfig.piles.push(actionTemplates[Random]);
		}
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
	}
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
		},	
	}
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
		},	
	}
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
		},	
	}

];


var exhausted = 0;
var players = [];
while (gameConfig.exhausted.length < 3) {
	for (var num in players) {
	turn(num)
}
