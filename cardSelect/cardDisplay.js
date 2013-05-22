function printCards(cardSet) {

	for (var each in cardSet) {
		return	"Name: "		+
				cardSet[each].name 	+
				"\nCost: "		+
				cardSet[each].cost	+
				"\nInstructions: "	+
				cardSet[each].instructions+
				"\n \n"
	}
}

printCards(Dominion);
/*function showCards(set) {
	var cardbox = document.getElementById("cardDisplay");
	for (var each in set) {
		var card = document.createElement("div");
		card.setAttribute('id', "card");
		var text = document.createTextNode(set[each].name);
		card.appendChild(text);
		cardbox.appendChild(card);
	}
}
*/
function showCards(set) {
	var ni = document.getElementById('cardDisplay');
	for (var each in set) {
		var newdiv = document.createElement('div');
		var divIdName = set[each].name;
		newdiv.setAttribute('id',divIdName);
		newdiv.setAttribute('class','card');
		newdiv.innerHTML =  '<form action=""><input type="checkbox" name="card" value="'+divIdName+'">' +set[each].name+ '</form>'
		ni.appendChild(newdiv);
		console.log(newdiv);
	}
}
var selectedCards = [];
function chooseCards() {
	var selectedSets = [];
	var sets = document.selectedSets.set;
	for (i=0;i<sets.length;i++) {
	  if (sets[i].checked) {
    	selectedSets.push(sets[i].value);
			var setName = eval(sets[i].value);
			for (var each in setName) {
				setName[each].origin = sets[i].value;
				selectedCards.push(setName[each]);
			}
    }
  }
	separatePrice(selectedCards);
	var cardNum = document.cardNum.number.value;
	if (document.choose.type[0].checked == true) {
		for (i = 0; i < cardNum; i++) {
			var random = Math.floor(Math.random()*selectedCards.length);
			CHOSEN.push(selectedCards[random]);
			selectedCards.splice(random, 1);
		}
		var cardbox = document.getElementById("chosenCards");
	}	
	sortByCost();
	for (var each in CHOSEN) {
		var card = document.createElement("div");
		card.setAttribute('id', "card");
var img = document.createElement("img");
img.src = CHOSEN[each].image;
img.setAttribute('width', '150px');
img.setAttribute('margin', '3px');
console.log(CHOSEN[each].name);
		cardbox.appendChild(img);
	}	
}
var CHOSEN = [];

function sortByCost() {

	separatePrice(CHOSEN);
	var newarray = [];
	for(i=0;i<7;i++) {
		var cost = eval("cost"+i);
		for (var each in cost) {
			newarray.push(cost[each]);
		}

	}
	CHOSEN = newarray;

}

var cost0 = [];
var cost1 = [];
var cost2 = [];
var cost3 = [];
var cost4 = [];
var cost5 = [];
var cost6 = [];
var costPosh = [];

//SEPARATES ALL CARDS INTO COST-BASED ARRAYS
function separatePrice(array) {
	cost0 = [];
	cost1 = [];
	cost2 = [];
	cost3 = [];
	cost4 = [];
	cost5 = [];
	cost6 = [];
	costPosh = [];
	for (var each in array) {
		if (array[each].cost == 0) {
			cost0.push(array[each]);
		}
		else if (array[each].cost == 1) {
			cost1.push(array[each]);
		}
		else if (array[each].cost == 2) {
			cost2.push(array[each]);
		}
		else if (array[each].cost == 3) {
			cost3.push(array[each]);
		}
		else if (array[each].cost == 4) {
			cost4.push(array[each]);
		}
		else if (array[each].cost == 5) {
			cost5.push(array[each]);
		}
		else if (array[each].cost == 6) {
			cost6.push(array[each]);
		}
		else if (array[each].cost.indexOf("?") != -1) {
			costPosh.push(array[each]);
		}
	}
}



