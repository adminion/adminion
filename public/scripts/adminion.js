
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



//  name            cost value quantity
var victoryTemplate = [
    ['estate',      2,      1,      10  ],
    ['duchy',           5,      3,      10  ],
    ['province',    8,      5,      10  ],
    ['colony',      11,     10,     10  ],
    ['curse',           0,      -1,     10  ]
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
        image:      "http://dominion.diehrstraits.com/scans/base/village.jpg"
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
/*  {
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
    }

];

// cardLog will keep track of all the cards that were gained throughout the game. this will be useful with cards like Treasury, Smugglers, etc. STILL NEEDS WORK!
var cardLog = [];


// function to reveal a card, to every player in the game
function reveal(player, card) {

}

// function to look at a card, to just a select player
function cardLook(player, placement) {


    // grab the yet to be made element, lookBox, to later add the image of the card revealed
    var lookbox = document.getElementById('lookBox');

    // depending om which card is to be looked at (top card of deck, bottom card of deck, etc) the var card is set
    var card = placement;

    addImage('100px', '5px', card.image, lookbox, 'card', id) 
    

}


//JUST AN EXAMPLE KINGDOM CARD SET- EVENTUALLY, THIS ARRAY WILL BE GENERATED VIA cardSelect.html

var KingdomCards = [
    {name:      "Pearl Diver",  
    type:       "Action",   
    cost:       2,
    instructions:   "+1 Card; +1 Action. Look at the bottom card of your deck. You may put it on top.",
    image:      "http://dominion.diehrstraits.com/scans/seaside/pearldiver.jpg",
    quantity: 10,
    action: 
        function(player) {
            player.actions += 1;
            drawCard(player);
        }
    },
    
    {name:      "Smugglers",    
    type:       "Action",   
    cost:       3,
    instructions:   "Gain a copy of a card costing up to $6 that the player to your right gained on his last turn.",
    image:      "http://dominion.diehrstraits.com/scans/seaside/smugglers.jpg" ,
    quantity: 10 },
    
        {name:      "Bridge",
    type:       "Action",
    cost:       4,
    instructions:   "+1 Buy; +$1. All cards (including cards in players' hands) cost $1 less this turn, but not less than $0.",
    image:      "http://dominion.diehrstraits.com/scans/intrigue/bridge.jpg",
    quantity: 10 },
    
    {name:      "Mining Village",
    type:       "Action",
    cost:       4,
    instructions:   "+1 Card; +2 Actions. You may trash this card immediately. If you do, +$2.",
    image:      "http://dominion.diehrstraits.com/scans/intrigue/miningvillage.jpg",
    quantity: 10,
    action: 
        function(player) {
            player.actions += 2;
            drawCard(player);
            var confr = confirm('trash this?');
            if (confr == true) {
                player.money += 2
                trashCard(player, this);
            }
        }
    },

    {name:      "Treasury",
    type:       "Action",
    cost:       5,
    instructions:   "+1 Card; +1 Action; +$1. When you discard this from play, if you didn't buy a Victory card this turn, you may put this on top of your deck.",
    image:      "http://dominion.diehrstraits.com/scans/seaside/treasury.jpg",
    quantity: 10  },

    {name:      "Upgrade",
    type:       "Action",
    cost:       5,
    instructions:   "+1 Card; +1 Action. Trash a card from your hand. Gain a card costing exactly $1 more than it.",
    image:      "http://dominion.diehrstraits.com/scans/intrigue/upgrade.jpg",
    quantity: 10 },

        {name:      "Festival",
    type:       "Action",
    cost:       5,
    instructions:   "+2 Actions, +1 Buy; +$2.",
    image:      "http://dominion.diehrstraits.com/scans/base/festival.jpg",
    quantity: 10,
        action: function(player) {
            player.actions += 2;
            player.buys += 1;
            player.money += 2;

        } 
    },
    
    {name:      "Laboratory",
    type:       "Action",
    cost:       5,
    instructions:   "+2 Cards; +1 Action.",
    image:      "http://dominion.diehrstraits.com/scans/base/laboratory.jpg",
    quantity: 10,
        action: function(player) {
            player.actions += 1;
            drawCard(player);
            drawCard(player);

        }  
    },
    
    {name:      "Torturer",
    type:       "Action-Attack",
    cost:       5,
    instructions:   "+3 Cards. Each other player chooses one: he discards 2 cards; or he gains a Curse card, putting it in his hand.",
    image:      "http://dominion.diehrstraits.com/scans/intrigue/torturer.jpg",
    quantity: 10 },
    
        {name:      "Harem",
    type:       "Treasure-Victory",
    cost:       6,
    treasure: 2,
    victory:    2,
    instructions:   "Worth $2. 2 Victory Points.",
    image:      "http://dominion.diehrstraits.com/scans/intrigue/harem.jpg",
    quantity: 10 }
    
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
function trashCard(player, card) {

    
    var hand = document.getElementById('playerCards');
hand.removeChild(hand.childNodes[player.hand.indexOf(card)]);

    trash.push(card);

    console.log(player.Name + ' trashed a ' +card.name);
    // splices the card from the player's hand
    player.hand.splice(player.hand.indexOf(card),1);
    
}

function cardInspect(card) {
    window.open(card, 'name', 'location=no, height=480px, width=300px, menubar=no,status=no, titlebar=no, toolbar=no');
}


function calculateProbability(card) {
    var quantity = 0;
    if (players[0].deck.length == 0) {
        shuffleDeck(players[0]);
    }
    for (var each in players[0].deck) {
        if (players[0].deck[each].name == card) {
            quantity += 1;
        }
    }
    console.log(quantity);
    var percentage = quantity/players[0].deck.length;
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

//PUSHES 7 COPPER AND 3 ESTATES INTO NEW PLAYER'S DISCARD PILE (SHUFFLEDECK() WILL LATER MOVE DISCARD PILE INTO DECK
        players[player].discard.push(       gameConfig.piles[0], 
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
    
    //              width   |margin | img src       |div destination|  class  | id
    addImage('80px', '3px', newCard.image, playerHand, newCard.type, newCard.name);
    
    
    // if this is during the player's actionphase, update the actionevent on the newcard so that it can be bought
    if (actionPhaze) {
    console.log('actioning still?: ' +actionPhaze);
    updateActionEvent(playerHand.lastChild);
    
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

    // if action is true and there are action cards in the player's hand, actionPhase() is initiated
    if (action) {
        announce('action phase is initiated!');
        actionPhase(player);
    
    }
    
    else {
        announce('buy phase initiate!');
        buyPhase(player);
    }
}


var actionPhaze = false;

// initiates action phase for player
function actionPhase(player){

    announce('choose action card to play!');

    // set actionphaze to true, to signify that the actionphase is in effect
    actionPhaze = true;

    // for every card in the player's hand
    for (var each in player.hand) {

        // update the action event each card, by grabbing the playerCards div and updating the action event for each child element in playerCards
        updateActionEvent(document.getElementById('playerCards').children[each]);

        // set the card's object's element property to match the card's element on the page
        player.hand[each].element = document.getElementById('playerCards').children[each];

        // log the element
        console.log(document.getElementById('playerCards').children[each]);
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

    // in order to figure out the index of the element in the hand, we separate the elements into children and parent
    // the element is the child, because we want to figure out the nth childness of the element
    var child = element;

    // the child's parent Node become parent
    var parent = child.parentNode;

    // all the children of the parent becomes children
    var children = parent.children;

    // the amount of children is the count
    var count = children.length;

    // we create the child_index variable to later place the value of the child's index
    var child_index;

    // does this loop for however many children there are
    for (var i = 0; i < count; i++) {

        // if the child in question is the same as the i-th child in children, the index of the child becomes i
      if (child == children[i]) {
        child_index = i;
            // once the index is found, break the loop
        break;
      }
    }
    // log the child's index
    console.log(child_index);

    // creates cardOb, the element in the player's hand according to the newly found index
    var cardOb = player.hand[child_index];
    
    // now that the correct object is found, execute the card's action
    cardOb.action(player, cardOb);
    


    // grabs the inPlay element
    var inPlay = document.getElementById('inPlay');
    
    // adds the image of the played card to the inPlay element
    addImage('70px', '5px', cardOb.image, inPlay, 'inPlay');
    
    // announce that the player played the card
    announce(player.Name + ' has played a ' + element.id);

    // grab the playerCards element
    var hand = document.getElementById('playerCards');

    // removes the element from player's hand
    hand.removeChild(hand.childNodes[child_index]); 

    // pushes the played card into the playCards array (so played cards don't get cycled back into discard/deck while the play is going on)
    playCards.push(player.hand[child_index]);

    // splice the card from the player's hand
    player.hand.splice(child_index, 1);

    // subtract one from the player's actions   
    player.actions -= 1;

    statusUpdate(player);

    // if there are no more actions for the player, it is announced and actionphaze is turned off to signify the end of the player's action phase
    if (player.actions == 0) {
        announce('you dun w/ACTIOnS! BUYPHASE INITIATE!!');
        buyPhase(player);
        actionphaze = false;
    }
    else {
        actionCheck(player);
    }
    
}

// an array for storing the cards in play- during cleanupphase, they move into discard pile
var playCards = [];


// a function for updating the click event on a card, based upon the element/card's class name
function updateActionEvent(element) {

    // if it's an Action card, give it an onclick event to playCard
    if (element.className == 'Action') {
        element.onclick = function() {
            playCard(element, players[0]);
            console.log(element.id+' action event set');        
        };
    }

    // if the classname is 'normal', take away the onclick event
    else if (element.className == 'normal') {
        element.onclick = null;
    }

}

// a function to add an event in order to trigger buycard()
function updateBuyEvent(element) {

    // if the classname is buyable at all, adds buycard() to the click event
  if (element.className == 'buyable' || element.className == 'buyableKingdomTreasure')  {
        element.onclick = function() {
            buyCard(element.id, players[0]);
        };
    console.log(element.id+' buy event set');
  }

    // if the className is normal or its a normal kingdom card, the click event is set back to cardInspect
  else if (element.className == 'normal' || element.className == 'kingdomTreasure' || element.className == 'kingdomVictory') {
    element.onclick = function() {
            cardInspect(element.src);
        };
  }

}
// a variable to signify that its the player's first buy in the turn, so that treasure cards aren't counted more than once
var firstBuy = true;

//the buy phase of a player's turn
function buyPhase(player) {
    announce('choose card to buy!');
    // disable the buy button
    document.getElementById('buy').disabled = true;

    // if player has buys left:
    if (player.buys > 0) {

        // only runs while its the player's first buy
        while (firstBuy == true) {

            // goes through each card in the player's hand to check if there are treasure cards
            for (var card in player.hand) {

                // if the card's type is treasure,
                if (player.hand[card].type.indexOf('reasure') != -1 ) {

                    // add the value of the treasure card to the player's usable money supply
                    player.money += player.hand[card].treasure;
                }   
            }

            // since its run through and counted treasure cards in the player's hand, firstBuy is turned off, so that next time buyPhase is run, money is not counted again
            firstBuy = false;
        }
    
    statusUpdate(player);

        // goes through all the available cards in the kingdom to set them to buyable
        for (var card in KingdomCards) {
        
            // if the cost of the card is less than or equal to how much money the player has,  
            if (KingdomCards[card].cost <= player.money) {
    
                // the card's dom object's class is switched to 'buyable'
                document.getElementById(KingdomCards[card].name).setAttribute('class', 'buyable');
                
                // if there are no more cards left in that pile, the class is set to unbuyable
                if (KingdomCards[card].quantity <= 0) {
                    document.getElementById(KingdomCards[card].name).setAttribute('class', 'unbuyable');
                }
            }
            
            // if the cost of the card is less than what the player has in money, it is set to unbuyable
            else {
            document.getElementById(KingdomCards[card].name).setAttribute('class', 'unbuyable');
            }
            
            // a click event is added to the card, based on its buyability
            updateBuyEvent(document.getElementById(KingdomCards[card].name), "click");
        }

        // goes through all the available Treasure cards to see if they're buyable or not       
        for (var card in Treasure) {
        
            // if the cost of the card is less than or equal to how much money the player has,  
            if (Treasure[card].cost <= player.money) {
    
                // the card's dom object's class is switched to 'buyable'
                document.getElementById(Treasure[card].name).setAttribute('class', 'buyableKingdomTreasure');
            }
            
            // if its too expensive for how much money they have, it is set to unbuyable
            else {
            document.getElementById(Treasure[card].name).setAttribute('class', 'unbuyableKingdomTreasure');
            }
            
            // a click event is added to the card, based on its buyability
            updateBuyEvent(document.getElementById(Treasure[card].name), "click");
        }

        // goes through victory cards to see if they're buyable or not  
        for (var card in Victory) {
        
            // if the cost of the card is less than or equal to how much money the player has,  
            if (Victory[card].cost <= player.money) {
    
                // the card's dom object's class is switched to 'buyable'
                document.getElementById(Victory[card].name).setAttribute('class', 'buyable');
            }
            
            // if they can't afford the victory card it is set to unbuyable
            else {
            document.getElementById(Victory[card].name).setAttribute('class', 'unbuyable');
            }
            
                // a click event is added to the card, based on its buyability
                updateBuyEvent(document.getElementById(Victory[card].name), "click");
        }
    }
}

// a function to buy a card, given a player and the name of a card
function buyCard(card, player) {

    // loops through KingdomCards in order to find the card object (because we're given just the name of the card)
    for (var each in KingdomCards) {
        
        // if the given card name is matched up with the card object,
        if (card == KingdomCards[each].name) {

            // set card equal to the card object and break from the loop
            card = KingdomCards[each];
            break;
        }
    }
    // does the same for Treasures  
    for (var each in Treasure) {
        if (card == Treasure[each].name) {
            card = Treasure[each];
            console.log(card);
            break;
        }
    }
    
    // and the same for Victories
    for (var each in Victory) {
        if (card == Victory[each].name) {
            card = Victory[each];
            break;
        }
    }
    
    // subract 1 buy from the player
    player.buys -= 1;
        
    // and player gains that card
    gainCard(card, player);

    // subtract the cost of the card from the player's money
    player.money -= card.cost;

    // if the player has no more buys,
    if (player.buys == 0) {

        // engage cleanup Phase
        cleanupPhase(player);
    }

    // if they still have more buys, engage buyphase() again!
    else {
        buyPhase(player);
    }

    statusUpdate(player);
}

function logger () {

    var logger = Object.create(null);

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
    };




    return logger;
};

var instance1 = logger();
var instance2 = logger();

instance1.announce('asdf');


// a function to gain a card, given its name and the target player
function gainCard(card,player) {

    announce(player.Name+ ' gained a '+card.name);

    // push the card into the player's discard pile
    player.discard.push(card);

    // subtract 1 from the card's quantity
    card.quantity --;
    
    // if the gained card is a victory card, add the victory points from the card to the player's victory points
    if (card.type == 'victory') {
        player.victory += card.victory;
    }
    
    // if the card pile has run out (quantity = 0), 
    if (card.quantity <= 0) {

        // set the card's opacity to 0.4
        document.getElementById(card.name).style.opacity = '0.4';
            
        // push the card into the list of exhausted cards
        gameConfig.exhausted.push(card);    
    }
    
    // if the player has no more buys, it is announced  
    if (player.buys == 0) {
        announce('you have no more buys.. NEXT TURN!'); 
    }
} 

// a function to start a player's turn
function turn(player) {

    // logs the player's hand
    console.log(        player.Name     +
                                    "'s hand: "     
                                                             );

    for (i =0; i<player.hand.length; i++) {
        console.log('| '+ player.hand[i].name);
    }
    
    // performs test to see if there are action cards in the player's hand
    actionCheck(player);
}

// a function to discard a given card from a given player's hand
function discardCard(player, card) {

    var hand = document.getElementById('playerCards');
//  console.log(player.hand.indexOf(card));
//  console.log(hand.childNodes.length);

console.log('discarded '+ card.name);

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

    firstBuy = true;
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
    for (var each in Treasure) {
        var element = document.getElementById(Treasure[each].name);
        element.setAttribute('class', 'kingdomTreasure');

                // a click event is added to the card, based on its buyability
                updateBuyEvent(element);

    }
    for (var each in Victory) {
        var element = document.getElementById(Victory[each].name);
        element.setAttribute('class', 'kingdomVictory');

                // a click event is added to the card, based on its buyability
                updateBuyEvent(element);

    }
    for (var each in playCards) {
        player.discard.push(playCards[each]);
    }
    playCards = [];
    var inPlay = document.getElementById('inPlay');
    inPlay.innerHTML = '';
    

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


//  addStat("drawPile: "+player.deck.length);
    //addStat("discard: "+player.discard.length);           
//  addStat("VP: "+player.victory);         

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
    
    var victorybox = document.getElementById('victories');
    
    for (var each in Victory) {
            addImage('100px', '0px', Victory[each].image, victorybox, 'kingdomVictory', Victory[each].name);
        if (each == 1) {
            insertBR(victorybox);
        }   
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
