p5.disableFriendlyErrors = true;
//[temp]
var MSGROLL = 0;
var ENTITY1;
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
		this.INITIAL_CODE_STACK = JSON.parse(initialCode);

		//Execute every code statement (ground level, the first blocks)
		this.INITIAL_CODE_STACK.forEach((item) => {this.EVALUATE_CODE(item);});
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
			case "setIntVar":    return this.setInternalVariable(CODE_INFO[1], CODE_INFO[2]);
			case "getIntVar": return this.getInternalVariable(CODE_INFO[1]);

			/** Operations **/
			case "concat": return CODE_INFO.slice(1).join('');
				
			case "add":    return this.addAll(CODE_INFO.slice(1));
			case "sub":    return CODE_INFO[1] * 1 - CODE_INFO[2] * 1;
			case "mult":   return this.multiplyAll(CODE_INFO.slice(1));
			case "div":    return (CODE_INFO[1] * 1) / (CODE_INFO[2] * 1);

			/** Debug **/
			case "print": return printMsg(CODE_INFO.slice(1).join(''));
			default: nonFatalError("Function " + CODE_INFO[0] + " does not exist.\nInfo: " + CODE_INFO);
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
	MSGROLL++;

	fill(0);
	noStroke();
	textAlign(LEFT);
	text("Message: " + msg, windowWidth / 20, windowHeight / 2 + MSGROLL * 10);
}
function nonFatalError(msg) {
	MSGROLL++;
	
	fill(255,0,0);
	noStroke();
	textAlign(LEFT);
	text("Warning: " + msg, windowWidth / 19, windowHeight / 2 + MSGROLL * 10);
}
function setup() {
	createCanvas(windowWidth, windowHeight);
	background(0, 255, 0);
}
function draw() {
	try {
		if (!ENTITY1) {
			ENTITY1 = new Entity({}, {}, '[["setIntVar","Health","100"],["print",["concat","You have ",["getIntVar","Health"]," health"]],["setIntVar","Health",["mult",["getIntVar","Health"],1,23]],["print",["concat","You have ",["getIntVar","Health"]," health"]],["print",["mult",3,2,-2]],["nonexistantfunctionshouldthrowwarning","pretendarg1","pretendarg2"]]', "");
			//printMsg(JSON.parse('[["setVar","Health","100"],["print","hello world"]]')[0]);
		}
	} catch (err) {
		background(120);
		fill(255);
		textAlign(CENTER);
		text("FATAL ERROR:\n" + err, windowWidth / 2, windowHeight / 2);
	}
}
//   John W
