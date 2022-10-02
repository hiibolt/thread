p5.disableFriendlyErrors = true;
//[temp]
var ENTITY1;
var SYSTEM = {
	window: {
		debug: {
			x: 0,
			y: 0,
			msgs: [],
		},
		code: {
			x: 0,
			y: 300,
			tabs: ["Entities", "Code", "Item"],
			selectedTab: "Entities",
			selectedEntity: undefined,
		},
	},
}
var MAIN = {
	globalVariables: {},
	entities: {},
};

/** Classes **/
class Entity {
	constructor(initialPos, initialRot, initialCode, updateCode) {
		//Initialize variables all entities share
		this.x = initialPos.x;
		this.y = initialPos.y;
		this.z = initialPos.z;
		this.rX = initialRot.x;
		this.rY = initialRot.y;
		this.rZ = initialRot.z;
		this.internalVariables = {};

		//Allowing JSONotation to do the heavy lifting of the nested shenanigans
		this.initialCodeStack = JSON.parse(initialCode);
		this.updateCodeStack = JSON.parse(updateCode);
		//De-referencing for to get a mutable version without modifying code permanently
		this._INITIALCODESTACK = JSON.parse(JSON.stringify(this.initialCodeStack));
		this._UPDATECODESTACK = JSON.parse(JSON.stringify(this.updateCodeStack));

		//Execute every code statement (ground level, the first blocks)
		this._INITIALCODESTACK.forEach((item) => { this.EVALUATE_CODE(item); });
	}
	update() {
		/** Don't implement this until you're there **/
		//Execute every code statement (ground level, the first blocks)
		//this._UPDATECODESTACK.forEach((item) => {this.EVALUATE_CODE(item);});
	}

	/** INTERNAL FUNCTIONS **/
	//The execution of the string-based code provide by the user.
	EVALUATE_CODE(CODE_INFO) {
		for (let i = 0; i < CODE_INFO.length; i++) {
			if (Array.isArray(CODE_INFO[i])) {
				CODE_INFO[i] = this.EVALUATE_CODE(CODE_INFO[i]);
			}
		}
		switch (CODE_INFO[0]) {
			/** Variable manipulation and retrieval **/
			case "setIntVar": return this.setInternalVariable(CODE_INFO[1], CODE_INFO[2]);
			case "getIntVar": return this.getInternalVariable(CODE_INFO[1]);

			/** Operations **/
			case "concat": return CODE_INFO.slice(1).join('');

			case "add": return this.addAll(CODE_INFO.slice(1));
			case "sub": return CODE_INFO[1] * 1 - CODE_INFO[2] * 1;
			case "mult": return this.multiplyAll(CODE_INFO.slice(1));
			case "div": return (CODE_INFO[1] * 1) / (CODE_INFO[2] * 1);

			/** Debug **/
			case "print": return printMsg(CODE_INFO.slice(1).join(''));
			default: nonFatalError("Function " + CODE_INFO[0] + " does not exist.");
		}
	}
	//Returns initial code stack for visualization

	/** USER FUNCTIONS **/
	//Sets variable <name> to <value>
	setInternalVariable(name, value) {
		try {
			this.internalVariables.name = value;
			return 0;
		} catch (err) {
			nonFatalError("Variable " + name + " does not exist or could not be set");
			return 1;
		}
	}
	//Returns variable <name>
	getInternalVariable(name) {
		if (this.internalVariables.name) {
			return this.internalVariables.name;
		} else {
			nonFatalError("Variable " + name + " does not exist or could not be fetched");
			return 1;
		}
	}

	//Adds all given <numbers> together
	addAll(numbers) {
		let ret = 0;
		numbers.forEach((i) => { ret += i * 1 });
		return ret;
	}
	//Multiplies all given <numbers> together
	multiplyAll(numbers) {
		let ret = 1;
		numbers.forEach((i) => { ret *= i * 1 });
		return ret;
	}
}

/** Graphical Functions **/
function debugView() {
	push();
	translate(SYSTEM.window.debug.x, SYSTEM.window.debug.y);
	scale(1);

	fill(55);
	stroke(255);
	strokeWeight(10);
	rect(5, 5, 290, 150, 5);

	if (mouseX > SYSTEM.window.debug.x && mouseX < SYSTEM.window.debug.x + 300 && mouseY > SYSTEM.window.debug.y && mouseY < SYSTEM.window.debug.y + 15) {
		if (mouseIsPressed) {
			SYSTEM.window.debug.x = mouseX - 150;
			SYSTEM.window.debug.y = mouseY - 7.5;
		}
		fill(110);
	} else {
		fill(90);
	}
	noStroke();
	rect(0, 0, 300, 15, 1);

	fill(255);
	noStroke();
	text(SYSTEM.window.debug.msgs.join('\n'), 15, 20, 270);
	pop();
}

function printMsg(msg) {
	SYSTEM.window.debug.msgs.push("Message: " + msg);
}
function nonFatalError(msg) {
	SYSTEM.window.debug.msgs.push("Warning: " + msg);
}
function setup() {
	//Initialize sketch
	createCanvas(windowWidth, windowHeight);
	background(255, 0, 0);

	MAIN.entities["Main"] = new Entity({}, {}, '[["setIntVar","Health","100"],["print",["concat","You have ",["getIntVar","Health"]," health"]],["setIntVar","Health",["mult",["getIntVar","Health"],1,23]],["print",["concat","You have ",["getIntVar","Health"]," health"]],["print",["mult",3,2,-2]],["nonexistantfunctionshouldthrowwarning","pretendarg1","pretendarg2"]]', "[]");
	//MAIN.entities["tempentry"] = "bruh";
}
function codeViewTEMP() {
	fill(55);
	stroke(255);
	strokeWeight(10);
	rect(5, 5, 590, 400, 5);

	if (mouseX > SYSTEM.window.code.x && mouseX < SYSTEM.window.code.x + 600 && mouseY > SYSTEM.window.code.y && mouseY < SYSTEM.window.code.y + 15) {
		if (mouseIsPressed) {
			SYSTEM.window.code.x = mouseX - 150;
			SYSTEM.window.code.y = mouseY - 7.5;
		}
		fill(110);
	} else {
		fill(90);
	}
	noStroke();
	rect(0, 0, 600, 15, 1);

	SYSTEM.window.code.tabs.forEach((item, ind) => {
		if((item == "Item" && !SYSTEM.window.code.selectedEntity) || (item == "Code" && !SYSTEM.window.code.selectedEntity)){
			return;
		}
		if (mouseX > SYSTEM.window.code.x + 15 + ind * 50 && mouseX < SYSTEM.window.code.x + 50 + 15 + ind * 50 && mouseY > SYSTEM.window.code.y + 19 && mouseY < SYSTEM.window.code.y + 39) {
			if (mouseIsPressed) {
				SYSTEM.window.code.selectedTab = item;
			}
			fill(110);
		} else {
			fill(90);
		}
		strokeWeight(3);
		stroke(255);
		rect(15 + ind * 50, 19, 50, 20, 5);

		fill(255);
		noStroke();
		textAlign(CENTER);
		text(item, 40 + ind * 50, 32.5);
	});
	fill(90);
	rect(5,36,590,369,5)
}
function draw() {
	background(70);
	try {
		debugView();
		
		push();
			translate(SYSTEM.window.code.x, SYSTEM.window.code.y);
			scale(1);
			codeViewTEMP();
			switch(SYSTEM.window.code.selectedTab){
				case "Code":MAIN.entities[SYSTEM.window.code.selectedEntity].initialCodeStack.forEach((i,ind)=>{
						fill(255);
						noStroke();
						textSize(12);
						textAlign(LEFT);
						text(i[0] + "("+i.slice(1)+")", 20, 63.5 + ind * 15);
					});
					break;
				case "Entities":
					let ind = -1;
					fill(255);
					noStroke();
					textSize(18);
					textAlign(LEFT);
					text("Entity List:", 20, 63.5);
					
					for(let key in MAIN.entities){		
						ind ++;
						if (mouseX > SYSTEM.window.code.x + 20 && mouseX < SYSTEM.window.code.x + 120 && mouseY > SYSTEM.window.code.y + 73.5 + ind * 50 && mouseY < SYSTEM.window.code.y + 40 + 73.5 + ind * 50) {
							if (mouseIsPressed) {
								SYSTEM.window.code.selectedEntity = key;
							}
							fill(140);
						} else {
							fill(120);
						}
						rect(20,73.5 + ind * 50,100,40,4);
						
						fill(255);
						noStroke();
						textSize(12);
						textAlign(CENTER);
						text(key, 70, 97.5 + ind * 50);
					}
					break;
			}
		pop();
	} catch (err) {
		background(120);
		fill(255);
		textAlign(CENTER);
		text("FATAL ERROR:\n" + err, windowWidth / 2, windowHeight / 2);
	}
}
//   John W