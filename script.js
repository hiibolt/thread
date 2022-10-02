p5.disableFriendlyErrors = true;
//[temp]
var ENTITY1;
//let debug = createGraphics(200,200);
var SYSTEM = {
	window: {
		debug: {
			x: 0,
			y: 0,
			msgs: [],
		},
		code: {
			x: 400,
			y: 400,
		},
	},
}
//var debug
var MAIN = {
	globalVariables: {},
	entities: {},
};
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
		this._INITIALCODESTACK = JSON.parse(initialCode);
		this._UPDATECODESTACK  = JSON.parse(updateCode);

		//Execute every code statement (ground level, the first blocks)
		this._INITIALCODESTACK.forEach((item) => {this.EVALUATE_CODE(item);});
	}
	update(){
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
			case "setIntVar":   return this.setInternalVariable(CODE_INFO[1], CODE_INFO[2]);
			case "getIntVar": 	return this.getInternalVariable(CODE_INFO[1]);

			/** Operations **/
			case "concat": return CODE_INFO.slice(1).join('');
				
			case "add":    return this.addAll(CODE_INFO.slice(1));
			case "sub":    return CODE_INFO[1] * 1 - CODE_INFO[2] * 1;
			case "mult":   return this.multiplyAll(CODE_INFO.slice(1));
			case "div":    return (CODE_INFO[1] * 1) / (CODE_INFO[2] * 1);

			/** Debug **/
			case "print": return printMsg(CODE_INFO.slice(1).join(''));
			default: nonFatalError("Function " + CODE_INFO[0] + " does not exist.");
		}
	}

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

function printMsg(msg) {
	SYSTEM.window.debug.msgs.push("Message: " + msg);
}
function nonFatalError(msg) {
	SYSTEM.window.debug.msgs.push("Warning: " + msg);
}
function setup() {
	//Initialize sketch
	createCanvas(windowWidth, windowHeight);
	background(255,0,0);

	ENTITY1 = new Entity({}, {}, '[["setIntVar","Health","100"],["print",["concat","You have ",["getIntVar","Health"]," health"]],["setIntVar","Health",["mult",["getIntVar","Health"],1,23]],["print",["concat","You have ",["getIntVar","Health"]," health"]],["print",["mult",3,2,-2]],["nonexistantfunctionshouldthrowwarning","pretendarg1","pretendarg2"]]', "[]");
}
function draw() {
	background(70);

	push();
		translate(SYSTEM.window.debug.x, SYSTEM.window.debug.y);
		scale(1);

		fill(55);
		stroke(255);
		strokeWeight(10);
		rect(5,5,290,150,5);

		if(mouseX > SYSTEM.window.debug.x && mouseX < SYSTEM.window.debug.x + 300 && mouseY > SYSTEM.window.debug.y && mouseY < SYSTEM.window.debug.y + 15){
			if(mouseIsPressed){
				SYSTEM.window.debug.x = mouseX - 150;
				SYSTEM.window.debug.y = mouseY - 7.5;
			}
			fill(110);
		}else{
			fill(90);
		}
		noStroke();
		rect(0,0,300,15,1);
	
		fill(255);
		noStroke();
		text(SYSTEM.window.debug.msgs.join('\n'), 15, 20,270);
	pop();
	
	try {
	} catch (err) {
		background(120);
		fill(255);
		textAlign(CENTER);
		text("FATAL ERROR:\n" + err, windowWidth / 2, windowHeight / 2);
	}
}
//   John W