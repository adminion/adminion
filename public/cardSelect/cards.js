var Dominion = [ 
	{name: 		"Cellar",
	type:		"Action",
	cost:		2,
 
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

	instructions: 	"Gain a card costing up to $4.",
	image:		"/home/zane/git/adminion/public/cardImages/workshop.jpg",
		action: function(player) {
			setGainable(player, 4, false, false, 'discard');

		},
	actionWait: true
	},

	{name: 		"Bureaucrat",
	type:		"Action-Attack",
	cost:		4,

	instructions: 	"Gain a silver card; put it on top of your deck. Each other player reveals a Victory card from his hand and puts it on his deck (or reveals a hand with no Victory cards).",
	image:		"/home/zane/git/adminion/public/cardImages/bureaucrat.jpg",
		action: function(player) {
		
		}
	},

	{name: 		"Feast",
	type:		"Action",
	cost:		4,

	instructions: 	"Trash this card. Gain a card costing up to $5.",
	image:		"/home/zane/git/adminion/public/cardImages/feast.jpg",
		action: function(player) {
			trashCard(player, this, 'play');
			setGainable(player, 5, false, false, 'discard');
		},
	actionWait: true
	},

	{name: 		"Gardens",
	type:		"Victory",
	cost:		4,

	instructions: 	"Worth 1 Victory for every 10 cards in your deck (rounded down).",
	image:		"/home/zane/git/adminion/public/cardImages/gardens.jpg",
		action: function(player) {
		
		}
	},

	{name: 		"Militia",
	type:		"Action-Attack",
	cost:		4,

	instructions: 	"+$2; Each other player discards down to 3 cards in his hand.",
	image:		"/home/zane/git/adminion/public/cardImages/militia.jpg",
		action: function(player) {
			player.money += 2;
		}
	},

	{name: 		"Moneylender",
	type:		"Action",
	cost:		4,

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

	instructions: 	"Trash a card from your hand. Gain a card costing up to $2 more than the trashed card.",
	image:		"/home/zane/git/adminion/public/cardImages/remodel.jpg",
		action: function(player) {
			choose(player, 'trash', 1, ['gain', 2, 'none', 'discard'], 'none', false);
		},
	actionWait: true
	},

	{name: 		"Smithy",
	type:		"Action",
	cost:		4,

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

	instructions: 	"Each other player reveals the top 2 cards of his deck. If they revealed any Treasure cards, they trash one of them that you choose. You may gain any or all of these trashed cards. They discard the other revealed cards.",
	image:		"/home/zane/git/adminion/public/cardImages/thief.jpg",
		action: function(player) {
		
		}
	},

	{name: 		"Throne Room",
	type:		"Action",
	cost:		4,

	instructions:	"Choose an Action card in your hand. Play it twice.",
	image:		"/home/zane/git/adminion/public/cardImages/throneroom.jpg",
		action: function(player) {
			choose(player, 'play2', 1, 'none', 'action', false);


		
		},
	actionWait: true
	},
	
	{name:		"Council Room",
	type:		"Action",
	cost:		5,

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

	instructions:	"Trash a Treasure card from your hand. Gain a Treasure card costing up to $3 more; put it into your hand.",
	image:		"/home/zane/git/adminion/public/cardImages/mine.jpg",
		action: function(player) {
			choose(player, 'trash', 1, ['gain', 3, 'treasure', 'hand'], 'treasure', false);
		
		},
	actionWait: true
	},

	{name:		"Witch",
	type:		"Action-Attack",
	cost:		5,

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

	instructions:	"Reveal cards from your deck until you reveal 2 Treasure cards. Put those Treasure cards in your hand and discard the other revealed cards.",
	image:		"/home/zane/git/adminion/public/cardImages/adventurer.jpg",
		action: function(player) {
			drawUntil(player, 'Treasure', 2);
		}
	}
]

var Intrigue = [
	{name: 		"Cellar",
	type:		"Action",
	cost:		2,
 
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

	instructions:	"+3 Cards. Put a card from your hand on top of your deck.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/courtyard.jpg",
		action: 	function(player) {
			for (var courtyard = 0; courtyard < 3; courtyard += 1) {
				drawCard(player, true);
			};
			choose(player, 'move', 1, 'deck0',  'none', false);
		},
	actionWait: true
	},

	{name:		"Pawn",
	type:		"Action",
	cost:		2,

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

	instructions:	"Discard any number of cards. +$1 per card discarded. When another player plays an Attack card, you may reveal this from your hand. If you do, +2 cards, then put 2 cards from your hand on top of your deck.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/secretchamber.jpg",
	actionWait: true,
		action: function(player) {

			choose(player, 'discard', 0, 'money1', 'none', true) 		
		}
	},

	{name:		"Great-Hall",
	type:		"Action Victory",
	cost:		3,

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

	instructions:	"+2 Actions. Reveal your hand. If you have no Action cards in hand, +2 Cards.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/shantytown.jpg",
		action: 	function(player) {
			player.actions += 2;
		}, 
	},
	
	{name:		"Steward",
	type:		"Action",
	cost:		3,

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

	instructions:	"+$2. Each other player trashes the top card of his deck and gains a card with the same cost that you choose.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/swindler.jpg",
		action: 	function(player) {
			player.money += 2;
		}, 
	},

	{name: 		"Wishing-Well",
	type:		"Action",
	cost:		3,

	instructions:	"+1 Card; +1 Action. Name a card, then reveal the top card of your deck. If it is the named card, put it in your hand.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/wishingwell.jpg",
		action: 	function(player) {
			drawCard(player, true);
			player.actions += 1;
		}, 
	},
	
		
	{name:		"Baron",
	type:		"Action",
	cost:		4,
	
	instructions:	"+1 Buy. You may discard an Estate card. If you do, +$4. Otherwise, gain an Estate card.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/baron.jpg",
		action: 	function(player) {
			player.buys += 1;
			choose(player, 'discard', 1, 'money4', ['Estate', 'gain'], false);
		},
	actionWait: true 
	},

	{name:		"Bridge",
	type:		"Action",
	cost:		4,
	instructions:	"+1 Buy; +$1. All cards (including cards in players' hands) cost $1 less this turn, but not less than $0.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/bridge.jpg",
		action: 	function(player) {
			player.money += 1;
			player.buys += 1;
			alterCost('none', -1);
		}, 
	},
	
	{name:		"Conspirator",
	type:		"Action",
	cost:		4,

	instructions:	"+$2. If you've played 3 or more Actions this turn (counting this): +1 Card; +1 Action.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/conspirator.jpg",
		action: 	function(player) {
			player.money += 2;
		}, 
	},

	{name:		"Coppersmith",
	type:		"Action",
	cost:		4,
	instructions:	"Copper produces an extra $1 this turn.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/coppersmith.jpg",
		action: 	function(player) {
		}, 
	},

	{name:		"Ironworks",
	type:		"Action",
	cost:		4,

	instructions:	"Gain a card costing up to $4. If it is an Action card, +1 Action. Treasure card, +$1. Victory card, +1 Card.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/ironworks.jpg",
		action: 	function(player) {
			setGainable(player, 4, false, false, 'discard')
		}, 
	},

	{name:		"Mining Village",
	type:		"Action",
	cost:		4,
	instructions:	"+1 Card; +2 Actions. You may trash this card immediately. If you do, +$2.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/miningvillage.jpg",
	quantity: 10,
	action: 
		function(player) {
			player.actions += 2;
			drawCard(player);
			var confr = confirm('trash this?');
			if (confr) {
				player.money += 2;
				console.log(this);				
				trashCard(player, this.element);
			}
		}
	},

	{name:		"Scout",
	type:		"Action",
	cost:		4,

	instructions:	"+1 Action. Reveal the top 4 cards of your deck. Put the revealed Victory cards into your hand. Put the other cards on top of your deck in any order.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/scout.jpg",
		action: 	function(player) {
			player.actions += 1;
		}, 
	},

	{name:		"Duke",
	type:		"Victory",
	cost:		5,

	instructions:	"Worth 1 Victory Point per Duchy you have.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/duke.jpg",
		action: 	function(player) {
		}, 
	},

	{name:		"Minion",
	type:		"Action-Attack",
	cost:		5,

	instructions:	"+1 Action. Choose one: +$2; or discard your hand, +4 Cards; and each other player with at least 5 cards in hand discards his hand and draws 4 cards.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/minion.jpg",
		action: 	function(player) {
			player.actions += 1;

			player.money += 2;
			// ORRRR
			discardHand(player);
			drawCard(player);
			drawCard(player);
			drawCard(player);
			drawCard(player);
		}, 
	},



	{name:		"Saboteur",
	type:		"Action-Attack",
	cost:		5,
	instructions:	"Each other player reveals cards from the top of his deck until revealing one costing $3 or more. He trashes that card and may gain a card costing at most $2 less than it. He discards the other revealed cards.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/saboteur.jpg",
		action: 	function(player) {
		}, 
	},

	{name:		"Torturer",
	type:		"Action-Attack",
	cost:		5,
	instructions:	"+3 Cards. Each other player chooses one: he discards 2 cards; or he gains a Curse card, putting it in his hand.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/torturer.jpg",
		action: 	function(player) {
		}, 
	},

	{name:		"Trading Post",
	type:		"Action",
	cost:		5,
	instructions:	"Trash 2 cards from your hand. If you do, gain a silver card; put it into your hand.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/tradingpost.jpg",
		action: 	function(player) {
		}, 
	},

	{name:		"Tribute",
	type:		"Action",
	cost:		5,
	instructions:	"The player to your left reveals then discards the top 2 cards of his deck. For each differently named card revealed, if it is an Action Card; +2 Actions; Treasure Card; +$2; Victory Card; +2 Cards.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/tribute.jpg",
		action: 	function(player) {
		}, 
	},

	{name:		"Upgrade",
	type:		"Action",
	cost:		5,
	instructions:	"+1 Card; +1 Action. Trash a card from your hand. Gain a card costing exactly $1 more than it.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/upgrade.jpg",
		action: 	function(player) {
			drawCard(player);
			player.actions += 1;
			choose(player, 'trash', 1, ['gain', 1, 'none', 'discard'], 'none', false);
		}, 
	quantity: 10	
	},

	{name:		"Harem",
	type:		"Treasure-Victory",
	cost:		6,
	treasure: 	2,
	victory:	2,
	instructions:	"Worth $2. 2 Victory Points.",
	image:		"http://dominion.diehrstraits.com/scans/intrigue/harem.jpg",
	quantity: 10
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
]	


var Seaside = [

	{name:		"Embargo",	
	type:		"Action",	
	cost:		2,
	instructions:	"+$2. Trash this card. Put an Embargo token on top of a Supply pile. When a player buys a card, he gains a Curse card per Embargo token on that pile.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/embargo.jpg" },

	{name:		"Haven",
	type:		"Action-Duration",
	cost:		2,
	instructions:	"+1 Card; +1 Action. Set aside a card from your hand face down. At the start of your next turn, put it into your hand.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/haven.jpg"  },

	{name:		"Lighthouse",
	type:		"Action-Duration",	
	cost:		2,
	instructions:	"+1 Action. Now and at the start of your next turn: +$1. While this is in play, when another player plays an Attack card, it doesn't affect you.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/lighthouse.jpg"  },

	{name:		"Native Village",	
	type:		"Action",	
	cost:		2,
	instructions:	"+2 Actions. Choose one: Set aside the top card of your deck face down on your Native Village mat; or put all the cards from your mat into your hand. You may look at the cards on your mat at any time; return them to your deck at the end of the game.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/nativevillage.jpg"  },

	{name:		"Pearl Diver",	
	type:		"Action",	
	cost:		2,
	instructions:	"+1 Card; +1 Action. Look at the bottom card of your deck. You may put it on top.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/pearldiver.jpg",
	quantity: 10,
	action: 
		function(player) {
			player.actions += 1;
			drawCard(player);
		}
	}, 

	{name:		"Ambassador",	
	type:		"Action-Attack",
	cost:		3,
	instructions:	"Reveal a card from your hand. Return up to 2 copies of it from your hand to the Supply. Then each other player gains a copy of it.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/ambassador.jpg"  },

	{name:		"Fishing Village",
	type:		"Action-Duration",	
	cost:		3,
	instructions:	"+2 Actions, +$1. At the start of your next turn: +1 Action; +$1.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/fishingvillage.jpg"  },

	{name:		"Lookout",	
	type:		"Action",	
	cost:		3,
	instructions:	"+1 Action. Look at the top 3 cards of your deck. Trash one of them. Discard one of them. Put the other one on top of your deck.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/lookout.jpg"  },

	{name:		"Smugglers",	
	type:		"Action",	
	cost:		3,
	instructions:	"Gain a copy of a card costing up to $6 that the player to your right gained on his last turn.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/smugglers.jpg"  },

	{name:		"Warehouse",
	type:		"Action",
	cost:		3,
	instructions:	"+3 Cards; +1 Action. Discard 3 cards.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/warehouse.jpg"  },

	{name:		"Caravan",
	type:		"Action-Duration",
	cost:		4,
	instructions:	"+1 Card; +1 Action. At the start of your next turn, +1 Card.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/caravan.jpg"  },

	{name:		"Cutpurse",	
	type:		"Action-Attack",	
	cost:		4,
	instructions:	"+$2. Each other player discards a Copper card (or reveals a hand with no Copper).",
	image:		"http://dominion.diehrstraits.com/scans/seaside/cutpurse.jpg"  },

	{name:		"Island",
	type:		"Action-Victory",
	cost:		4,
	victory:	2,
	instructions:	"Set aside this and another card from your hand. Return them to your deck at the end of the game. Worth 2 Victory Points.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/island.jpg"  },

	{name:		"Navigator",
	type:		"Action",
	cost:		4,
	instructions:	"+$2. Look at the top 5 cards of your deck. Either discard all of them, or put them back on top of your deck in any order.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/navigator.jpg"  },

	{name:		"Pirate Ship",
	type:		"Action-Attack",	
	cost:		4,
	instructions:	"Choose one: Each other player reveals the top 2 cards of his deck, trashes a revealed Treasure that you choose, discards the rest, and if anyone trashed a Treasure you take a Coin token; or, +$1 per Coin token you've taken with Pirate Ships this game.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/pirateship.jpg"  },

	{name:		"Salvager",
	type:		"Action",
	cost:		4,
	instructions:	"+1 Buy. Trash a card from your hand. +$ equal to its cost.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/salvager.jpg"  },

	{name:		"Sea Hag",
	type:		"Action-Attack",
	cost:		4,
	instructions:	"Each other player discards the top card of his deck, then gains a Curse card, putting it on top of his deck.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/seahag.jpg"  },

	{name:		"Treasure Map",
	type:		"Action",
	cost:		4,
	instructions:	"Trash this and another copy of Treasure Map from your hand. If you do trash two Treasure Maps, gain 4 Gold cards, putting them on top of your deck.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/treasuremap.jpg"  },

	{name:		"Bazaar",
	type:		"Action",
	cost:		5,
	instructions:	"+1 Card; +2 Actions, +$1.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/bazaar.jpg"  },

	{name:		"Explorer",
	type:		"Action",	
	cost:		5,
	instructions:	"You may reveal a Province card from your hand. If you do, gain a Gold card, putting it into your hand. Otherwise, gain a Silver card, putting it into your hand.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/explorer.jpg"  },

	{name:		"Ghost Ship",
	type:		"Action-Attack",
	cost:		5,
	instructions:	"+2 Cards. Each other player with 4 or more cards in hand puts cards from his hand on top of his deck until he has 3 cards in his hand.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/ghostship.jpg"  },

	{name:		"Merchant Ship",
	type:		"Action-Duration",
	cost:		5,
	instructions:	"Now and at the start of your next turn: +$2.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/merchantship.jpg"  },

	{name:		"Outpost",
	type:		"Action-Duration",
	cost:		5,
	instructions:	"You only draw 3 cards (instead of 5) in this turn's Clean-up phase. Take an extra turn after this one. This can't cause you to take more than two consecutive turns.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/outpost.jpg"  },

	{name:		"Tactician",
	type:		"Action-Duration",
	cost:		5,
	instructions:	"Discard your hand. If you discarded any cards this way, then at the start of your next turn, +5 Cards; +1 Buy; and +1 Action.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/tactician.jpg"  },

	{name:		"Treasury",
	type:		"Action",
	cost:		5,
	instructions:	"+1 Card; +1 Action; +$1. When you discard this from play, if you didn't buy a Victory card this turn, you may put this on top of your deck.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/treasury.jpg",
	quantity: 10,
	action:
		function(player) {
			player.actions += 1;
			player.money += 1;
			drawCard(player);
			this.returnToDeck = true;
			console.log(this);
		}, 
	returnToDeck: false
	},

	{name:		"Wharf",
	type:		"Action-Duration",
	cost:		5,
	instructions:	"Now and at the start of your next turn: +2 Cards; +1 Buy.",
	image:		"http://dominion.diehrstraits.com/scans/seaside/wharf.jpg"  }
]

var Alchemy = [
	{name:		"Potion",
	type:		"Treasure",	
	cost:		4,
	treasure:	'?',
	instructions:	"Worth 1?.",
	image:		"http://dominion.diehrstraits.com/scans/alchemy/potion.jpg"   },
	
	{name:		"Herbalist",
	type:		"Action",
	cost:		2,
	instructions:	"+1 Buy; +$1. When you discard this from play, you may put one of your Treasures from play on top of your deck.",
	image:		"http://dominion.diehrstraits.com/scans/alchemy/herbalist.jpg"  },

	{name:		"Apprentice",
	type:		"Action",
	cost:		5,	
	instructions:	"+1 Action. Trash a card from your hand. +1 Card per Coin it costs. +2 Cards if it has ? in its cost.",
	image:		"http://dominion.diehrstraits.com/scans/alchemy/apprentice.jpg" },

	{name:		"Transmute",
	type:		"Action",
	cost:		"0?",
	instructions:	"Trash a card from your hand. If it is an Action card, gain a Duchy; Treasure card, gain a Transmute; Victory card, gain a Gold.",
	image:		"http://dominion.diehrstraits.com/scans/alchemy/transmute.jpg" },

	{name:		"Vineyard",
	type:		"Victory",
	cost:		"0?",
	instructions:	"Worth 1 Victory Point for every 3 Action cards in your deck (rounded down).",
	image:		"http://dominion.diehrstraits.com/scans/alchemy/vineyard.jpg"  },

	{name:		"Apothecary",
	type:		"Action",
	cost:		"2?",
	instructions:	"+1 Card; +1 Action. Reveal the top 4 cards of your deck. Put the revealed Coppers and Potions into your hand. Put the other cards back on top in any order.",
	image:		"http://dominion.diehrstraits.com/scans/alchemy/apothecary.jpg"  },

	{name:		"Scrying Pool",
	type:		"Action-Attack",
	cost:		"2?",	
	instructions:	"+1 Action. Each player (including you) reveals the top card of his deck and either discards it or puts it back, your choice. Then reveal cards from the top of your deck until revealing one that isn't an Action. Put all of your revealed cards into your hand.",
	image:		"http://dominion.diehrstraits.com/scans/alchemy/scryingpool.jpg"  },

	{name:		"University",
	type:		"Action",
	cost:		"2?",
	instructions:	"+2 Actions. You may gain an Action card costing up to $5.",
	image:		"http://dominion.diehrstraits.com/scans/alchemy/university.jpg"  },

	{name:		"Alchemist",
	type:		"Action",
	cost:		"3?",
	instructions:	"+2 Cards; +1 Action. When you discard this from play, you may put this on top of your deck if you have a Potion in play.",
	image:		"http://dominion.diehrstraits.com/scans/alchemy/alchemist.jpg"  },

	{name:		"Familiar",
	type:		"Action-Attack",
	cost:		"3?",
	instructions:	"+1 Card; +1 Action. Each other player gains a curse.",
	image:		"http://dominion.diehrstraits.com/scans/alchemy/familiar.jpg"  },

	{name:		"Philosopher's Stone",
	type:		"Treasure",
	cost:		"3?",
	instructions:	"When you play this, count your deck and discard pile. Worth $1 per 5 cards total between them (rounded down).",
	image:		"http://dominion.diehrstraits.com/scans/alchemy/philosophersstone.jpg"  },

	{name:		"Golem",
	type:		"Action",
	cost:		"4?",	
	instructions:	"Reveal cards from your deck until you reveal 2 Action cards other than Golem Cards. Discard the other cards, then play the Action cards in either order.",
	image:		"http://dominion.diehrstraits.com/scans/alchemy/golem.jpg"  },

	{name:		"Possession",
	type:		"Action",
	cost:		"6?",	
	instructions:	"The player to your left takes an extra turn after this one, in which you can see all cards he can and make all decisions for him. Any cards he would gain on that turn, you gain instead; any cards of his that are trashed are set aside and returned to his discard pile at end of turn.",
	image:		"http://dominion.diehrstraits.com/scans/alchemy/possession.jpg"  },
]

var Prosperity = [

	{name:		"Loan",
	type:		"Treasure",
	cost:		3,
	treasure:	1,
	instructions:	"Worth $1. When you play this, reveal cards from your deck until you reveal a Treasure. Discard it or trash it. Discard the other cards.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/loan.jpg"  },

	{name:		"Trade Route",
	type:		"Action",
	cost:		3,
	instructions:	"+1 Buy; +$1 per token on the Trade Route mat. Trash a card from your hand.Setup: Put a token on each Victory card Supply pile. When a card is gained from that pile, move the token to the Trade Route mat.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/traderoute.jpg" },

	{name:		"Watchtower",
	type:		"Action-Reaction",
	cost:		3,
	instructions:	"Draw until you have 6 cards in hand. When you gain a card, you may reveal this from your hand. If you do, either trash that card, or put it on top of your deck.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/watchtower.jpg" },

	{name:		"Bishop",
	type:		"Action",
	cost:		4,
	instructions:	"+$1; +1 VP token. Trash a card from your hand. +VP tokens equal to half its cost in coins, rounded down. Each other player may trash a card from his hand.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/bishop.jpg" },

	{name:		"Monument",
	type:		"Action",
	cost:		4,
	instructions:	"+$2; +1 VP token.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/monument.jpg",
		action: function(player) {
			player.money += 2;
			console.log('player.money is ' + player.money)
		}
	},

	{name:		"Quarry",
	type:		"Treasure",
	cost:		4,
	treasure:	1,
	instructions:	"Worth $1. While this is in play, Action cards cost $2 less, but not less than $0.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/quarry.jpg" },

	{name:		"Talisman",
	type:		"Treasure",
	cost:		4,
	treasure:	1,
	instructions:	"Worth $1. While this is in play, when you buy a card costing $4 or less that is not a Victory card, gain a copy of it.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/talisman.jpg" },

	{name:		"Worker's Village",
	type:		"Action",
	cost:		4,
	instructions:	"+1 Card; +2 Actions, +1 Buy.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/workersvillage.jpg" },

	{name:		"City",
	type:		"Action",
	cost:		5,
	instructions:	"+1 Card; +2 Actions. If there are one or more empty Supply piles, +1 Card. If there are two or more, +$1 and +1 Buy.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/city.jpg" },

	{name:		"Contraband",
	type:		"Treasure",
	cost:		5,
	treasure:	3,
	instructions:	"Worth $3. +1 Buy. When you play this, the player to your left names a card. You can't buy that card this turn.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/contraband.jpg" },

	{name:		"Counting House",
	type:		"Action",
	cost:		5,
	instructions:	"Look through your discard pile, reveal any number of Copper cards from it, and put them into your hand.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/countinghouse.jpg" },

	{name:		"Mint",
	type:		"Action",
	cost:		5,
	instructions:	"You may reveal a Treasure card from your hand. Gain a copy of it. When you buy this, trash all Treasures you have in play.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/mint.jpg" },

	{name:		"Mountebank",
	type:		"Action-Attack",
	cost:		5,
	instructions:	"+$2. Each other player may discard a Curse. If he doesn't, he gains a Curse and a Copper.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/mountebank.jpg" },

	{name:		"Rabble",
	type:		"Action-Attack",
	cost:		5,
	instructions:	"+3 Cards. Each other player reveals the top 3 cards of his deck, discards the revealed Actions and Treasures, and puts the rest back on top in any order he chooses.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/rabble.jpg" },

	{name:		"Royal Seal",
	type:		"Treasure",
	cost:		5,
	treasure:	2,
	instructions:	"Worth $2. While this is in play, when you gain a card, you may put that card on top of your deck.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/royalseal.jpg" },

	{name:		"Vault",
	type:		"Action",
	cost:		5,
	instructions:	"+2 Cards. Discard any number of cards. +$1 per card discarded. Each other player may discard 2 cards. If he does, he draws a card.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/vault.jpg" },

	{name:		"Venture",
	type:		"Treasure",
	cost:		5,
	treasure:	1,
	instructions:	"Worth $1. When you play this, reveal cards from your deck until you reveal a Treasure. Discard the other cards. Play that Treasure.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/venture.jpg" },

	{name:		"Goons",
	type:		"Action-Attack",
	cost:		6,
	instructions:	"+1 Buy; +$2. Each other player discards down to 3 cards in hand. While this is in play, when you buy a card, +1 VP token.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/goons.jpg" },

	{name:		"Grand Market",
	type:		"Action",
	cost:		6,
	instructions:	"+1 Card; +1 Action; +1 Buy; +$2. You can't buy this if you have any Copper in play.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/grandmarket.jpg" },

	{name:		"Hoard",
	type:		"Treasure",
	cost:		6,
	treasure:	2,
	instructions:	"Worth $2. While this is in play, when you buy a Victory card, gain a Gold.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/hoard.jpg" },

	{name:		"Bank",
	type:		"Treasure",
	cost:		7,
	instructions:	"Worth $?. When you play this, it's worth $1 per Treasure card you have in play (counting this).",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/bank.jpg" },

	{name:		"Expand",
	type:		"Action",
	cost:		7,
	instructions:	"Trash a card from your hand. Gain a card costing up to $3 more than the trashed card.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/expand.jpg" },

	{name:		"Forge",
	type:		"Action",
	cost:		7,
	instructions:	"Trash any number of cards from your hand. Gain a card with cost exactly equal to the total cost in coins of the trashed cards.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/forge.jpg" },

	{name:		"King's Court",
	type:		"Action",
	cost:		7,
	instructions:	"You may choose an Action card in your hand. Play it three times.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/kingscourt.jpg" },

	{name:		"Peddler",
	type:		"Action",
	cost:		8,
	instructions:	"+1 Card; +1 Action; +$1. During your Buy phase, this costs $2 less per Action card you have in play, but not less than $0.",
	image:		"http://dominion.diehrstraits.com/scans/prosperity/peddler.jpg" }



]
var Treasure = [
	{name:		"Copper",
	type:		"Treasure",
	cost:		0,
	treasure:	1,
	image:		"/home/zane/git/adminion/public/cardImages/copper.jpg",
	quantity: 20 },
	{name:		"Silver",
	type:		"Treasure",
	cost:		3,
	treasure:	2,
	image:		"/home/zane/git/adminion/public/cardImages/silver.jpg",
	quantity: 20 },
	{name:		"Gold",
	type:		"Treasure",
	cost:		6,
	treasure:	3,
	image:		"/home/zane/git/adminion/public/cardImages/gold.jpg",
	quantity: 20 },
	{name:		"Platinum",
	type:		"Treasure",
	cost:		9,
	treasure:	5,
	image:		"/home/zane/git/adminion/public/cardImages/platinum.jpg",
	quantity: 20 }
]

var Cornucopia = [

	{name:		"Hamlet",
	type:		"Action",
	cost:		2,
	instructions:	"+1 Card; +1 Action. You may discard a card; if you do, +1 Action. You may discard a card; if you do, +1 Buy.",
	image:		"http://dominion.diehrstraits.com/scans/cornucopia/hamlet.jpg" },

	{name:		"Fortune Teller",
	type:		"Action-Attack",
	cost:		3,
	instructions:	"+$2. Each other player reveals cards from the top of his deck until he reveals a Victory or Curse card. He puts it on top and discards the other revealed cards.",
	image:		"http://dominion.diehrstraits.com/scans/cornucopia/fortuneteller.jpg"  },

	{name:		"Menagerie",
	type:		"Action",
	cost:		3,
	instructions:	"+1 Action. Reveal your hand. If there are no duplicate cards in it, +3 Cards. Otherwise, +1 Card.",
	image:		"http://dominion.diehrstraits.com/scans/cornucopia/menagerie.jpg"  },

	{name:		"Farming Village",
	type:		"Action",
	cost:		4,
	instructions:	"+2 Actions. Reveal cards from the top of your deck until you reveal an Action or Treasure card. Put that card into your hand and discard the other cards.",
	image:		"http://dominion.diehrstraits.com/scans/cornucopia/farmingvillage.jpg"  },

	{name:		"Horse Traders",
	type:		"Action-Reaction",
	cost:		4,
	instructions:	"+1 Buy; +$3; Discard 2 cards. When another player plays an Attack card, you may set this aside from your hand. If you do, then at the start of your next turn, +1 Card and return this to your hand.",
	image:		"http://dominion.diehrstraits.com/scans/cornucopia/horsetraders.jpg"  },

	{name:		"Remake",
	type:		"Action",
	cost:		4,
	instructions:	"Do this twice: Trash a card from your hand; gain a card costing exactly $1 more than the trashed card.",
	image:		"http://dominion.diehrstraits.com/scans/cornucopia/remake.jpg"  },

	{name:		"Tournament",
	type:		"Action",
	cost:		4,
	instructions:	"+1 Action. Each player may reveal a Province from his hand. If you do, discard it and gain a Prize (from the Prize pile) or a Duchy, putting it on top of your deck. If no-one else does, +1 Card, +$1.",
	image:		"http://dominion.diehrstraits.com/scans/cornucopia/tournament.jpg"  },

	{name:		"Young Witch",
	type:		"Action-Attack",
	cost:		4,
	instructions:	"+2 Cards. Discard 2 cards. Each other player may reveal a Bane card from his hand. If he doesn't, he gains a Curse.Setup: Add an extra Kingdom card pile costing $2 or $3 to the Supply. Cards from that pile are Bane cards.",
	image:		"http://dominion.diehrstraits.com/scans/cornucopia/youngwitch.jpg"  },

	{name:		"Harvest",
	type:		"Action",
	cost:		5,
	instructions:	"Reveal the top 4 cards of your deck, then discard them. +$1 per differently named card revealed.",
	image:		"http://dominion.diehrstraits.com/scans/cornucopia/harvest.jpg"  },


	{name:		"Horn of Plenty",
	type:		"Treasure",
	cost:		5,
	instructions:	"Worth $0. When you play this, gain a card costing up to $1 per differently named card you have in play, counting this. If it's a Victory card, trash this.",
	image:		"http://dominion.diehrstraits.com/scans/cornucopia/hornofplenty.jpg"  },

	{name:		"Hunting Party",
	type:		"Action",
	cost:		5,
	instructions:	"+1 Card; +1 Action. Reveal your hand. Reveal cards from your deck until you reveal a card that isn't a duplicate of one in your hand. Put it into your hand and discard the rest.",
	image:		"http://dominion.diehrstraits.com/scans/cornucopia/huntingparty.jpg"  },

	{name:		"Jester",
	type:		"Action-Attack",
	cost:		5,
	instructions:	"+$2. Each other player discards the top card of his deck. If it's a Victory card he gains a Curse. Otherwise either he gains a copy of the discarded card or you do, your choice.",
	image:		"http://dominion.diehrstraits.com/scans/cornucopia/jester.jpg"  },

	{name:		"Fairgrounds",
	type:		"Victory",
	cost:		6,
	instructions:	"Worth 2VP for every 5 differently named cards in your deck (round down).",
	image:		"http://dominion.diehrstraits.com/scans/cornucopia/fairgrounds.jpg"  }

]

var prizes = [
//(these are not in the Supply, and only used with Tournament)

	{name:		"Bag of Gold",
	type:		"Action-Prize",
	cost:		"0*",
	instructions:	"+1 Action. Gain a Gold, putting it on top of your deck.",
	image:		"http://dominion.diehrstraits.com/scans/cornucopia/bagofgold.jpg"  },

	{name:		"Diadem",
	type:		"Treasure-Prize",
	cost:		"0*",
	treasure:	2,
	instructions:	"Worth $2. When you play this, +$1 per unused Action you have ('Action', not Action card).",
	image:		"http://dominion.diehrstraits.com/scans/cornucopia/diadem.jpg"  },

	{name:		"Followers",
	type:		"Action-Attack-Prize",
	cost:		"0*",
	instructions:	"+2 Cards. Gain an Estate. Each other player gains a Curse and discards down to 3 cards in hand.",
	image:		"http://dominion.diehrstraits.com/scans/cornucopia/followers.jpg"  },

	{name:		"Princess",
	type:		"Action-Prize",
	cost:		"0*",
	instructions:	"+1 Buy. While this is in play, cards cost $2 less, but not less than $0.",
	image:		"http://dominion.diehrstraits.com/scans/cornucopia/princess.jpg"  },

	{name:		"Trusty Steed",
	type:		"Action-Prize",
	cost:		"0*",
	instructions:	"Choose two: +2 Cards; or +2 Actions; or +$2; or gain 4 Silvers and put your deck into your discard pile.",
	image:		"http://dominion.diehrstraits.com/scans/cornucopia/trustysteed.jpg"  }
]

var Hinterlands = [

	{name:		"Crossroads",
	type:		"Action",
	cost:		2,
	instructions:	"Reveal your hand. +1 Card per Victory card revealed. If this is the first time you played a Crossroads this turn, +3 Actions.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/crossroads.jpg"  },

	{name:		"Duchess",
	type:		"Action",
	cost:		2,
	instructions:	"+$2. Each player (including you) looks at the top card of his deck, and discards it or puts it back. In games using this, when you gain a Duchy, you may gain a Duchess.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/duchess.jpg"  },

	{name:		"Fool's Gold",
	type:		"Treasure-Reaction",
	cost:		2,
	instructions:	"If this is the first time you played a Fool's Gold this turn, this is worth $1, otherwise it's worth $4. When another player gains a Province, you may trash this from your hand. If you do, gain a Gold, putting it on your deck.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/foolsgold.jpg"  },

	{name:		"Develop",
	type:		"Action",
	cost:		3,
	instructions:	"Trash a card from your hand. Gain a card costing exactly $1 more than it and a card costing exactly $1 less than it, in either order, putting them on top of your deck.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/develop.jpg"  },

	{name:		"Oasis",
	type:		"Action",
	cost:		3,
	instructions:	"+1 Card; +1 Action; +$1. Discard a card.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/oasis.jpg"  },

	{name:		"Oracle",
	type:		"Action-Attack",
	cost:		3,
	instructions:	"Each player (including you) reveals the top 2 cards of his deck, and you choose one: either he discards them, or he puts them back on top in an order he chooses. +2 Cards",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/oracle.jpg"  },

	{name:		"Scheme",
	type:		"Action",
	cost:		3,
	instructions:	"+1 Card; +1 Action. At the start of Clean-up this turn, you may choose an Action card you have in play. If you discard it from play this turn, put it on your deck.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/scheme.jpg"  },

	{name:		"Tunnel",
	type:		"Victory-Reaction",
	cost:		3,
	victory:	2,	
	instructions:	"2 Victory Points  When you discard this other than during a Clean-up phase, you may reveal it. If you do, gain a Gold.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/tunnel.jpg"  },

	{name:		"Jack of All Trades",
	type:		"Action",
	cost:		4,
	instructions:	"Gain a Silver. Look at the top card of your deck; discard it or put it back. Draw until you have 5 cards in hand. You may trash a card from your hand that is not a Treasure.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/jackofalltrades.jpg"  },

	{name:		"Noble Brigand",
	type:		"Action-Attack",
	cost:		4,
	instructions:	"+$1. When you buy this or play it, each other player reveals the top 2 cards of his deck, trashes a revealed Silver or Gold you choose, and discards the rest. If he didn't reveal a Treasure, he gains a Copper. You gain the trashed cards.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/noblebrigand.jpg"  },

	{name:		"Nomad Camp",
	type:		"Action",
	cost:		4,
	instructions:	"+1 Buy; +$2. When you gain this, put it on top of your deck.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/nomadcamp.jpg"  },

	{name:		"Silk Road",
	type:		"Victory",
	cost:		4,
	instructions:	"Worth 1 Victory Point for every 4 Victory cards in your deck (round down).",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/silkroad.jpg"  },

	{name:		"Spice Merchant",
	type:		"Action",
	cost:		4,
	instructions:	"You may trash a Treasure from your hand. If you do, choose one: +2 Cards and +1 Action; or +$2 and +1 Buy.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/spicemerchant.jpg"  },

	{name:		"Trader",
	type:		"Action-Reaction",
	cost:		4,
	instructions:	"Trash a card from your hand. Gain a number of Silvers equal to its cost in coins. When you would gain a card, you may reveal this from your hand. If you do, instead, gain a silver.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/trader.jpg"  },

	{name:		"Cache",
	type:		"Treasure",
	cost:		5,
	treasure:	3,
	instructions:	"Worth $3. When you gain this, gain two Coppers.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/cache.jpg"  },

	{name:		"Cartographer",
	type:		"Action",
	cost:		5,
	instructions:	"+1 Card; +1 Action. Look at the top 4 cards of your deck. Discard any number of them. Put the rest back on top in any order.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/cartographer.jpg"  },

	{name:		"Embassy",
	type:		"Action",
	cost:		5,
	instructions:	"+5 Cards. Discard 3 cards. When you gain this, each other player gains a Silver.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/embassy.jpg"  },

	{name:		"Haggler",
	type:		"Action",
	cost:		5,
	instructions:	"+$2. While this is in play, when you buy a card, gain a card costing less than it that is not a Victory card.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/haggler.jpg"  },

	{name:		"Highway",
	type:		"Action",
	cost:		5,
	instructions:	"+1 Card; +1 Action  While this is in play, cards cost $1 less, but not less than $0.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/highway.jpg"  },

	{name:		"Ill-Gotten Gains",
	type:		"Treasure",
	cost:		5,
	treasure:	1,
	instructions:	"Worth $1. When you play this, you may gain a Copper, putting it into your hand. When you gain this, each other player gains a Curse.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/illgottengains.jpg"  },

	{name:		"Inn",
	type:		"Action",
	cost:		5,
	instructions:	"+2 Cards; +2 Actions. Discard 2 cards.  When you gain this, look through your discard pile (including this), reveal any number of Action cards from it, and shuffle them into your deck.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/inn.jpg"  },

	{name:		"Mandarin",
	type:		"Action",
	cost:		5,
	instructions:	"+$3. Put a card from your hand on top of your deck. When you gain this, put all Treasures you have in play on top of your deck in any order.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/mandarin.jpg"  },

	{name:		"Margrave",
	type:		"Action-Attack",
	cost:		5,
	instructions:	"+3 Cards; +1 Buy. Each other player draws a card, then discards down to 3 cards in hand.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/margrave.jpg"  },

	{name:		"Stables",
	type:		"Action",
	cost:		5,
	instructions:	"You may discard a Treasure. If you do, +3 Cards and +1 Action.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/stables.jpg"  },

	{name:		"Border Village",
	type:		"Action",
	cost:		6,
	instructions:	"+1 Card; +2 Actions. When you gain this, gain a card costing less than this.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/bordervillage.jpg"  },

	{name:		"Farmland",
	type:		"Victory",
	cost:		6,
	victory:	2,
	instructions:	"2 VP. When you buy this, trash a card from your hand. Gain a card costing exactly $2 more than the trashed card.",
	image:		"http://dominion.diehrstraits.com/scans/hinterlands/farmland.jpg"  }
]

var darkAges = [

	{name:		"Madman",
	type:		"Action",
	cost:		"0*",
	instructions:	"+2 Actions. Return this to the Madman pile. If you do, +1 Card per card in your hand. (This is not in the Supply.)",
	image:		"http://dominion.diehrstraits.com/scans/darkages/madman.jpg"  },

	{name:		"Mercenary",
	type:		"Action-Attack",
	cost:		"0*",
	instructions:	"You may trash 2 cards from your hand. If you do, +2 Cards, + $2, and each other player discards down to 3 cards in hand. (This is not in the Supply.)",
	image:		"http://dominion.diehrstraits.com/scans/darkages/mercenary.jpg" },

	{name:		"Spoils",
	type:		"Treasure",
	cost:		"0*",
	treasure:	3,
	instructions:	"Worth $3. When you play this, return it to the pile.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/spoils.jpg" },

	{name:		"Poor House",
	type:		"Action",
	cost:		1,
	instructions:	"+$4. Reveal your hand. -$1 per Treasure card in your hand, to a minimum of $0.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/poorhouse.jpg" },

	{name:		"Beggar",
	type:		"Action-Reaction",
	cost:		2,
	instructions:	"Gain 3 Coppers, putting them into your hand. When another player plays an Attack card, you may discard this. If you do, gain two Silvers, putting one on top of your deck.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/beggar.jpg"  },

	{name:		"Squire",
	type:		"Action",
	cost:		2,
	instructions:	"+$1. Choose one: +2 Actions; or +2 Buys; or gain a Silver. When you trash this, gain an Attack card.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/squire.jpg"  },

	{name:		"Vagrant",
	type:		"Action",	
	cost:		2,
	instructions:	"+1 Card; +1 Action. Reveal the top card of your deck. If it's a Victory card, Curse, Ruins, or Shelter, put it into your hand." ,
	image:		"http://dominion.diehrstraits.com/scans/darkages/vagrant.jpg" },

	{name:		"Forager",
	type:		"Action",
	cost:		3,
	instructions:	"+1 Action; +1 Buy. Trash a card from your hand. +$1 per differently named Treasure in the trash.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/forager.jpg"  },

	{name:		"Hermit",
	type:		"Action",
	cost:		3,
	instructions:	"Look through your discard pile. You may trash a card that is not a Treasure, from your discard pile or your hand. Gain a card costing up to $3. When you discard this from play, if you didn't buy any cards this turn, trash this and gain a Madman (from the Madman pile).",
	image:		"http://dominion.diehrstraits.com/scans/darkages/hermit.jpg" },

	{name:		"Market Square",
	type:		"Action-Reaction",
	cost:		3,
	instructions:	"+1 Card; +1 Action; +1 Buy. When one of your cards is trashed, you may discard this from your hand. If you do, gain a Gold.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/marketsquare.jpg" },

	{name:		"Sage",
	type:		"Action",
	cost:		3,
	instructions:	"+1 Action. Reveal cards from the top of your deck until you reveal one costing $3 or more. Put that card into your hand and discard the rest.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/sage.jpg" },

	{name:		"Storeroom",
	type:		"Action",
	cost:		3,
	instructions:	"+1 Buy. Discard any number of cards. +1 Card per card discarded. Discard any number of cards. +$1 per card discarded the second time." ,
	image:		"http://dominion.diehrstraits.com/scans/darkages/storeroom.jpg"},

	{name:		"Urchin",
	type:		"Action-Attack",
	cost:		3,
	instructions:	"+1 Card; +1 Action. Each other player discards down to 4 cards in hand. When you play another Attack card with this in play, you may trash this. If you do, gain a Mercenary from the Mercenary pile.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/urchin.jpg" },

	{name:		"Armory",
	type:		"Action",
	cost:		4,
	instructions:	"Gain a card costing up to $4. Put it on top of your deck." ,
	image:		"http://dominion.diehrstraits.com/scans/darkages/armory.jpg"},

	{name:		"Death Cart",
	type:		"Action-Looter",
	cost:		4,
	instructions:	"+$5. You may trash an Action card from your hand. If you don't, trash this. When you gain this, gain two Ruins.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/deathcart.jpg" },

	{name:		"Feodum",
	type:		"Victory",
	cost:		4,
	instructions:	"Worth 1 VP for every 3 Silvers in your deck. When you trash this, gain 3 Silvers.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/feodum.jpg" },

	{name:		"Fortress",
	type:		"Action",
	cost:		4,
	instructions:	"+1 Card; +2 Actions___When you trash this, put it into your hand.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/fortress.jpg" },

	{name:		"Ironmonger",
	type:		"Action",
	cost:		4,
	instructions:	"+1 Card; +1 Action. Reveal the top card of your deck; you may discard it. If it is an Action card, +1 Action; a Treasure card, +$1; a Victory card, +1 Card.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/ironmonger.jpg" },

	{name:		"Marauder",
	type:		"Action-Attack-Looter",
	cost:		4,
	instructions:	"Gain a Spoils. Each other player gains a Ruins.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/marauder.jpg" },

	{name:		"Procession",
	type:		"Action",
	cost:		4,
	instructions:	"You may play an Action card from your hand twice. Trash it. Gain an Action card costing exactly $1 more than it.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/procession.jpg" },

	{name:		"Rats",
	type:		"Action",
	cost:		4,
	instructions:	"+1 Card; +1 Action. Gain a Rats. Trash a card from your hand other than a Rats (or reveal a hand of all Rats). When this is trashed, +1 Card.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/rats.jpg" },

	{name:		"Scavenger",
	type:		"Action",
	cost:		4,
	instructions:	"+$2. You may put your deck into your discard pile. Look through your discard pile and put one card from it on top of your deck.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/scavenger.jpg" },

	{name:		"Wandering Minstrel",
	type:		"Action",
	cost:		4	,
	instructions:	"+1 Card; +2 Actions. Reveal the top 3 cards of your deck. Put the Actions back on top in any order and discard the rest.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/wanderingminstrel.jpg" },

	{name:		"Band of Misfits",
	type:		"Action",
	cost:		5,
	instructions:	"Play this as if it were an Action card in the Supply costing less than it that you choose. This is that card until it leaves play.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/bandofmisfits.jpg" },

	{name:		"Bandit Camp",
	type:		"Action",
	cost:		5,
	instructions:	"+1 Card; +2 Actions. Gain a Spoils." ,
	image:		"http://dominion.diehrstraits.com/scans/darkages/banditcamp.jpg"},

	{name:		"Catacombs",
	type:		"Action",
	cost:		5,
	instructions:	"Look at the top 3 cards of your deck. Choose one: Put them into your hand; or discard them and +3 Cards. When you trash this, gain a cheaper card.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/catacombs.jpg" },

	{name:		"Count",
	type:		"Action",
	cost:		5,
	instructions:	"Choose one: Discard 2 cards; put a card from your hand on top of your deck; or gain a Copper. Choose one: +$3; trash your hand; or gain a Duchy.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/count.jpg" },

	{name:		"Counterfeit",
	type:		"Treasure",
	cost:		5,	
	instructions:	"+$1; +1 Buy. When you play this, you may play a treasure from your hand twice. If you do, trash that treasure.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/counterfeit.jpg" },

	{name:		"Cultist",
	type:		"Action-Attack-Looter",
	cost:		5,
	instructions:	"+2 Cards. Each other player gains a Ruins. You may play a Cultist from your hand. When you trash this, +3 Cards." ,
	image:		"http://dominion.diehrstraits.com/scans/darkages/cultist.jpg"},

	{name:		"Graverobber",
	type:		"Action",
	cost:		5,
	instructions:	"Choose one: Gain a card from the trash costing from $3 to $6, putting it on top of your deck; or trash an Action card from your hand and gain a card costing up to $3 more than it." ,
	image:		"http://dominion.diehrstraits.com/scans/darkages/graverobber.jpg"},

	{name:		"Junk Dealer",
	type:		"Action",
	cost:		5,
	instructions:	"1 Card; +1 Action; +$1. Trash a card from your hand.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/junkdealer.jpg" },

	{name:		"Mystic",
	type:		"Action",
	cost:		5,
	instructions:	"+1 Action. +$2. Name a card. Reveal the top card of your deck. If it's the named card, put it into your hand." ,
	image:		"http://dominion.diehrstraits.com/scans/darkages/mystic.jpg"},

	{name:		"Pillage",
	type:		"Action-Attack",
	cost:		5,
	instructions:	"Trash this. Each other player with 5 or more cards in hand reveals his hand and discards a card that you choose. Gain 2 Spoils.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/pillage.jpg" },

	{name:		"Rebuild",
	type:		"Action",
	cost:		5,
	instructions:	"+1 Action. Name a card. Reveal cards from the top of your deck until you reveal a Victory card that is not the named card. Discard the other cards. Trash the Victory card and gain a Victory card costing up to $3 more than it.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/rebuild.jpg" },

	{name:		"Rogue",
	type:		"Action-Attack",
	cost:		5,
	instructions:	"+$2. If there are any cards in the trash costing from $3 to $6, gain one of them. Otherwise, each other player reveals the top 2 cards of his deck, trashes one of them costing from $3 to $6, and discards the rest.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/rogue.jpg" },

	{name:		"Altar",
	type:		"Action",
	cost:		6,
	instructions:	"Trash a card from your hand. Gain a card costing up to $5.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/altar.jpg" },

	{name:		"Hunting Grounds",
	type:		"Action",
	cost:		6,
	instructions:	"+4 Cards. When this is trashed, gain a Duchy or 3 Estates.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/huntinggrounds.jpg" }

	]

var ruins = [			
//50 total, 10 of each type, shuffled into a pile of ten per opponent, like Curses


	{name:		"Abandoned Mine",
	type:		"Action-Ruins",
	cost:		0,
	instructions:	"+$1." ,
	image:		"http://dominion.diehrstraits.com/scans/darkages/abandonedmine.jpg"},

	{name:		"Ruined Library",
	type:		"Action-Ruins",
	cost:		0,
	instructions:	"+1 Card." ,
	image:		"http://dominion.diehrstraits.com/scans/darkages/ruinedlibrary.jpg"},

	{name:		"Ruined Market",
	type:		"Action-Ruins",
	cost:		0,
	instructions:	"+1 Buy.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/ruinedmarket.jpg" }, 

	{name:		"Ruined Village",
	type:		"Action-Ruins",
	cost:		0,
	instructions:	"+1 Action.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/ruinedvillage.jpg"},

	{name:		"Survivors",
	type:		"Action-Ruins",
	cost:		0,
	instructions:	"Look at the top 2 cards of your deck. Discard them or put them back in any order.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/survivor.jpg" }

	]

knights	= [
//One of each, all shuffled into one Kingdom pile

	{name:		"Dame Anna",
	type:		"Action-Attack-Knight",
	cost:		5,
	instructions:	"You may trash up to 2 cards from your hand. Each other player reveals the top 2 cards of his deck, trashes one of them costing from $3 to $6, and discards the rest. If a Knight is trashed by this, trash this card.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/dameanna.jpg" },

	{name:		"Dame Josephine",
	type:		"Action-Attack-Victory-Knight",
	cost:		5,
	victory:	2,
	instructions:	"Worth 2 VP. Each other player reveals the top 2 cards of his deck, trashes one of them costing from $3 to $6, and discards the rest. If a Knight is trashed by this, trash this card." ,
	image:		"http://dominion.diehrstraits.com/scans/darkages/damejosephine.jpg"},

	{name:		"Dame Molly",
	type:		"Action-Attack-Knight",
	cost:		5,
	instructions:	"+2 Actions. Each other player discards the top 2 cards of his deck, and trashes one of them costing from $3 to $6. If a Knight is trashed by this, trash this card.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/damemolly.jpg" },

	{name:		"Dame Natalie",
	type:		"Action-Attack-Knight",
	cost:		5,
	instructions:	"You may gain a card costing up to $3. Each other player reveals the top 2 cards of his deck, trashes one of them costing from $3 to $6, and discards the rest. If a Knight is trashed by this, trash this card.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/damenatalie.jpg" },

	{name:		"Dame Sylvia",
	type:		"Action-Attack-Knight",
	cost:		5,
	instructions:	"+$2. Each other player reveals the top 2 cards of his deck, trashes one of them costing from $3 to $6, and discards the rest. If a Knight is trashed by this, trash this card.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/damesylvia.jpg" },

	{name:		"Sir Bailey",
	type:		"Action-Attack-Knight",
	cost:		5,
	instructions:	"+1 Card; +1 Action. Each other player reveals the top 2 cards of his deck, trashes one of them costing from $3 to $6, and discards the rest. If a Knight is trashed by this, trash this card." ,
	image:		"http://dominion.diehrstraits.com/scans/darkages/sirbailey.jpg"},

	{name:		"Sir Destry",
	type:		"Action-Attack-Knight",
	cost:		5,
	instructions:	"+2 Cards. Each other player reveals the top 2 cards of his deck, trashes one of them costing from $3 to $6, and discards the rest. If a Knight is trashed by this, trash this card." ,
	image:		"http://dominion.diehrstraits.com/scans/darkages/sirdestry.jpg"},

	{name:		"Sir Martin",
	type:		"Action-Attack-Knight",
	cost:		4,	
	instructions:	"+2 Buys. Each other player reveals the top 2 cards of his deck, trashes one of them costing from $3 to $6, and discards the rest. If a Knight is trashed by this, trash this card.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/sirmartin.jpg" },

	{name:		"Sir Michael",
	type:		"Action-Attack-Knight",
	cost:		5,	
	instructions:	"Each other player discards down to 3 cards in hand. Each other player reveals the top 2 cards of his deck, trashes one of them costing from $3 to $6, and discards the rest. If a Knight is trashed by this, trash this card." ,
	image:		"http://dominion.diehrstraits.com/scans/darkages/sirmichael.jpg"},

	{name:		"Sir Vander",
	type:		"Action-Attack-Knight",
	cost:		5,
	instructions:	"Each other player reveals the top 2 cards of his deck, trashes one of them costing from $3 to $6, and discards the rest. If a Knight is trashed by this, trash this card. When this is trashed, gain a Gold.",
	image:		"http://dominion.diehrstraits.com/scans/darkages/sirvander.jpg" }
]


var shelters = [
//Replaces starting Estates

	{name:		"Hovel",
	type:		"Reaction-Shelter",
	cost:		1,
	instructions:	"When you buy a Victory card, you may trash this from your hand." ,
	image:		"http://dominion.diehrstraits.com/scans/darkages/hovel.jpg"},

	{name:		"Necropolis",
	type:		"Action-Shelter",
	cost:		1,
	instructions:	"+2 Actions." ,
	image:		"http://dominion.diehrstraits.com/scans/darkages/necropolis.jpg"},

	{name:		"Overgrown Estate",
	type:		"Victory-Shelter",
	cost:		1,
	instructions:	"0 VP. When you trash this, +1 Card." ,
	image:		"http://dominion.diehrstraits.com/scans/darkages/overgrownestate.jpg"}
]


var Victory = 	[	
	{name:		"Estate",
	type:		"Victory",
	cost:		2,
	victory:	1,
	image:		"/home/zane/git/adminion/public/cardImages/estate.jpg" },
	{name:		"Duchy",
	type:		"Victory",
	cost:		5,
	victory:	3,
	image:		"/home/zane/git/adminion/public/cardImages/duchy.jpg" },
	{name:		"Province",
	type:		"Victory",
	cost:		8,
	victory:	6,
	image:		"/home/zane/git/adminion/public/cardImages/province.jpg" },
	{name:		"Colony",
	type:		"Victory",
	cost:		11,
	victory:	10,
	image:		"/home/zane/git/adminion/public/cardImages/colony.jpg" },

]
var promoCards = [

	{name:		"Black Market",
	type:		"Action",
	cost:		3,
	instructions:	"+$2. Reveal the top 3 cards of the Black Market deck. You may buy one of them immediately. Put the unbought cards on the bottom of the Black Market deck in any order.Before the game, make a Black Market deck out of one copy of each Kingdom card not in the supply.",
	image:		"http://dominion.diehrstraits.com/scans/promo/blackmarket.jpg" },

	{name:		"Envoy",
	type:		"Action",
	cost:		4,
	instructions:	"Reveal the top 5 cards of your deck. The player to your left chooses one for you to discard. Draw the rest.",
	image:		"http://dominion.diehrstraits.com/scans/promo/envoy.jpg" },

	{name:		"Walled Village",
	type:		"Action",	
	cost:		4,
	instructions:	"+1 Card; +2 Actions. At the start of Clean-up, if you have this and no more than one other Action card in play, you may put this on top of your deck.",
	image:		"http://dominion.diehrstraits.com/scans/promo/walledvillage.jpg" },

	{name:		"Governor",
	type:		"Action",
	cost:		5,
	instructions:	"+1 Action. Choose one; you get the version in parentheses: +1 (+3) Cards; or each player gains a Silver (Gold); or each player may trash a card from his hand and gain a card costing exactly $1 ($2) more." ,
	image:		"http://dominion.diehrstraits.com/scans/promo/governor.jpg"},

	{name:		"Stash",
	type:		"Treasure",
	cost:		5,
	treasure:	2,
	instructions:	"Worth $2. When you shuffle, you may put this anywhere in your deck.",
	image:		"http://dominion.diehrstraits.com/scans/promo/stash.jpg" } 

]

var ALLEXPANSIONS = [	Dominion,
						Intrigue,
						Seaside,
						Prosperity,
						Hinterlands,
						darkAges,
						promoCards,
						Victory,
						Treasure,
						Cornucopia
]