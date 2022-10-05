p5.disableFriendlyErrors = true;
/**
	Casing rules:
 	- NAMEOFITEM = Constant, temp variable, or head variables
	- NameOfItem = Class
  - nameOfItem = Function, argument, or variable
	- _~~~~~~~~~ = Hint to internal variable for user or dev
**/

// Host Variables
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
			tabs: ["Entities", "Code", "Item", "Test"],
			selectedTab: "Entities",
			selectedEntity: undefined,
			playing: false,
			textCodeGraphics: undefined,
			textCodeOffset: 0,
			unsavedCode: undefined,
			cursor:{
				line: 0,
				x: 0
			}
		},
	},
}
var MAIN = {
	globalVariables: {},
	entities: {},
};

/** Classes **/
//Host entity. Core framework of what the user utilizes.
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
		this.rawInitialCode = initialCode;
		this.rawUpdateCode = updateCode;
		
		//Allowing JSONotation to do the heavy lifting of the nested shenanigans
		this.initialCodeStack = JSON.parse(initialCode.replace(/~/g,','));
		this.updateCodeStack  = JSON.parse(updateCode.replace(/~/g,','));
	}
	initialize() {
		//De-referencing to get a mutable version without modifying code permanently
		this._INITIALCODESTACK = JSON.parse(JSON.stringify(this.initialCodeStack));
		
		//Execute every code statement (ground level, the first blocks)
		this._INITIALCODESTACK.forEach((item) => { this.EVALUATE_CODE(item); });
	}
	update() {
		/** Don't implement this until you're there **/
		//De-referencing for to get a mutable version without modifying code permanently
		//this._UPDATECODESTACK = JSON.parse(JSON.stringify(this.updateCodeStack));
		//Execute every code statement (ground level, the first blocks)
		//this._UPDATECODESTACK.forEach((item) => {this.EVALUATE_CODE(item);});
	}
	
	/** INTERNAL FUNCTIONS **/
	//The execution of the string-based code provide by the user.
	EVALUATE_CODE(CODE_INFO) {
		/**
			Structure of CODE_INFO:
	 			CODE_INFO[0]     = What function is being employed
		 		CODE_INFO[n > 0] = Arguments for said function
		**/
		
		//Check for nested functions, evaluate any matches
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
//Block representation of code. Allows the user to better read their code.
class Block {
	constructor(code, x, y) {
		this.x = x;
		this.y = y;
		this.code = code;

		//Given the code, determine what the user's displayed name and arguments are
		switch (this.code[0]) {
			case "setIntVar":
				this.name = "Set Internal Variable";
				this.args = ["Variable Name", "Value"];
				this.color = color('Beige');
				break;
			case "getIntVar":
				this.name = "Get Internal Variable";
				this.args = ["Variable Name"];
				this.color = color('Beige');
				break;
			case "print":
				this.name = "Print Message";
				this.args = ["Message"];
				this.color = color('DeepSkyBlue');
				break;
			default:
				this.name = this.code[0];
				this.args = [];
				this.color = color('Red');
		}
	}
	render() {
		//Calculate the longest piece of text and stretch/squash block to fit
		let blockText = textWidth(this.name);
		for (let i = 0; i < this.args.length; i++) {
			if (textWidth(this.code[i + 1] != '' ? this.code[i + 1] : this.args[i]) > blockText) {
				blockText = textWidth(this.code[i + 1] != '' ? this.code[i + 1] : this.args[i]);
			}
		}
		fill(this.color);
		stroke(lerpColor(this.color, color(10), 0.2));
		strokeWeight(3);
		rect(this.x, this.y, blockText + 10, 30 + this.args.length * 20, 5);

		fill(0, 0, 0);
		textAlign(LEFT);
		textSize(12);
		noStroke();
		text(this.name, this.x + 5, this.y + 13.5);
		for (let i = 0; i < this.args.length; i++) {
			//If the argument is filled out, display that-otherwise, display what it should be
			text(this.code[i + 1] != '' ? this.code[i + 1] : this.args[i], this.x + 5, this.y + 23.5 + (i + 1) * 20);
		}
		return 30 + this.args.length * 20;
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
	text(SYSTEM.window.debug.msgs.slice(-5).join('\n'), 15, 20, 270);
	pop();
}
function codeViewTEMP() {
	fill(55);
	stroke(255);
	strokeWeight(10);
	rect(5, 5, 590, 450, 5);

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

	//Display all tabs
	SYSTEM.window.code.tabs.forEach((item, ind) => {
		if ((item == "Item" && !SYSTEM.window.code.selectedEntity) || (item == "Code" && !SYSTEM.window.code.selectedEntity)) {
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
	rect(5, 36, 590, 419, 5)
}

/** Debug Functions **/
function printMsg(msg) {
	SYSTEM.window.debug.msgs.push("Message: " + msg);
}
function nonFatalError(msg) {
	SYSTEM.window.debug.msgs.push("Warning: " + msg);
}
function syntaxError(msg){
	SYSTEM.window.debug.msgs.push("Syntax error: " + msg);
}

//String splice function. Identical to Array.splice
String.prototype.splice = function(ind, str, rem) {
    return this.slice(0, ind) + str + this.slice(ind + rem);
};
function keyPressed() {
  if (keyCode === LEFT_ARROW) {
		//Shift cursor left
		if(SYSTEM.window.code.selectedTab == "Code"){
			SYSTEM.window.code.cursor.x = abs(SYSTEM.window.code.cursor.x - 1);
		}
  }
	if(keyCode === RIGHT_ARROW) {
		//Shift cursor right
		if(SYSTEM.window.code.selectedTab == "Code"){
			SYSTEM.window.code.cursor.x += 1;
		}
  }
	if(keyCode === 8){
		if(SYSTEM.window.code.selectedTab == "Code" && SYSTEM.window.code.cursor.x != 0){
			SYSTEM.window.code.unsavedCode[SYSTEM.window.code.cursor.line] = SYSTEM.window.code.unsavedCode[SYSTEM.window.code.cursor.line].splice(SYSTEM.window.code.cursor.x - 1,"",1)
			//Maintain cursor position
			SYSTEM.window.code.cursor.x -= 1;
		}
	}
}
function keyTyped(){
	if(SYSTEM.window.code.selectedTab == "Code"){
		//Insert <key> at <cursor x> on line <cursor line>
		SYSTEM.window.code.unsavedCode[SYSTEM.window.code.cursor.line] = SYSTEM.window.code.unsavedCode[SYSTEM.window.code.cursor.line].splice(SYSTEM.window.code.cursor.x,key,0);
		//Maintain cursor position
		SYSTEM.window.code.cursor.x += 1;
	}
}
function mouseWheel(event){
	//Mousewheel scrolling for the rightmost (text)
	if(SYSTEM.window.code.selectedTab == "Code" && mouseX > SYSTEM.window.code.x + 300 && mouseX < SYSTEM.window.code.x + 600 && mouseY > SYSTEM.window.code.y + 15 && mouseY < SYSTEM.window.code.y + 400){
		SYSTEM.window.code.textCodeOffset -= event.delta / 2;
	}
}
function setup() {
	//Initialize sketch
	createCanvas(windowWidth, windowHeight);
	background(255, 0, 0);

	SYSTEM.window.code.textCodeGraphics  = createGraphics(290,400);
	
	MAIN.entities["MainEntity"] = new Entity({}, {}, '[["setIntVar","Health","100"]~["print",["concat","You have ",["getIntVar","Health"]," health"]]~["setIntVar","Health",["mult",["getIntVar","Health"],1,23]]~["print",["concat","You have ",["getIntVar","Health"]," health"]]~["print",["mult",3,2,-2]],["nonexistantfunctionshouldthrowwarning","pretendarg1","pretendarg2"]]', "[]");
}
function draw() {
	background(70);
	try {
		debugView();
		
		push();
		translate(SYSTEM.window.code.x, SYSTEM.window.code.y);
		scale(1);
		codeViewTEMP();
		switch (SYSTEM.window.code.selectedTab) {
			case "Test":
				//Start button
				if (!SYSTEM.window.code.playing) {
					if (mouseX > SYSTEM.window.code.x + 20 && mouseX < SYSTEM.window.code.x + 45 && mouseY > SYSTEM.window.code.y + 50 && mouseY < SYSTEM.window.code.y + 75 && mouseIsPressed) {
						//Start update process for all entities
						SYSTEM.window.code.playing = true;5
						//If the green play button is pressed, initialize all entities in the world list 
						for (let entity in MAIN.entities) {
							MAIN.entities[entity].initialize();
						}
					}
					fill(0, 200, 0);
					stroke(0, 170, 0);
				} else {
					fill(200);
					stroke(170);
				}
				triangle(20, 50, 45, 62.5, 20, 75);
				
				//Stop button
				if (SYSTEM.window.code.playing) {
					if (mouseX > SYSTEM.window.code.x + 60 && mouseX < SYSTEM.window.code.x + 85 && mouseY > SYSTEM.window.code.y + 50 && mouseY < SYSTEM.window.code.y + 75 && mouseIsPressed) {
						SYSTEM.window.code.playing = false;
					}
					fill(200, 0, 0);
					stroke(170, 0, 0);
				} else {
					fill(200);
					stroke(170);
				}
				rect(60, 50, 25, 25, 2);
				break;
			case "Code":
				//Translation from instructions to more readable code, leading to nicer readability and syntax.
				if(!SYSTEM.window.code.unsavedCode){
					let TEMP = MAIN.entities[SYSTEM.window.code.selectedEntity].rawInitialCode;
					TEMP = TEMP.slice(1,-1);//Ignore edge brackets for readability
					TEMP = TEMP.replace(/\["getIntVar","(\w+)"\]/g,"i_$1");//Eliminate unnessecary var functions
					SYSTEM.window.code.unsavedCode = TEMP.split('~');//Split per line
				}
				
				//Line selection
				if(mouseIsPressed && mouseX > SYSTEM.window.code.x + 300 && mouseX < SYSTEM.window.code.x + 600 && mouseY > SYSTEM.window.code.y + 15 && mouseY < SYSTEM.window.code.y + 450){
					//Math for choosing the line (mouseY offset by location of text rounded by a factor of text height)
					SYSTEM.window.code.cursor.line = constrain(Math.floor((mouseY - SYSTEM.window.code.y - 50)/20),0,SYSTEM.window.code.unsavedCode.length);
					//If the line doesn't exist yet, make it
					if(SYSTEM.window.code.cursor.line == SYSTEM.window.code.unsavedCode.length){
						SYSTEM.window.code.unsavedCode.push("");
					}
				}
				
				/** 
					This is how I prevented text rollover while maintaining smooth movement.
					I'm aware this is super expensive, but I can't find a workaround that maintains smooth scrolling.
		 			Accomplished by opening another canvas and writing graphics onto it so rollover is solved via edges.
				**/
				SYSTEM.window.code.textCodeGraphics.background(90);
				SYSTEM.window.code.textCodeGraphics.push();
				SYSTEM.window.code.textCodeGraphics.translate(SYSTEM.window.code.textCodeOffset,0);
				for(let i = 0;i < SYSTEM.window.code.unsavedCode.length;i++){
					let addon = SYSTEM.window.code.cursor.line == i ? (frameCount % 50 > 25 ? "|" : " ") : "";//If the line's selected, framecount interpolation creates a blinking effect
					SYSTEM.window.code.textCodeGraphics.textSize(12);
					SYSTEM.window.code.textCodeGraphics.textAlign(LEFT);
					SYSTEM.window.code.textCodeGraphics.fill(180);
					SYSTEM.window.code.textCodeGraphics.noStroke();
					SYSTEM.window.code.textCodeGraphics.text((i + 1) + " | ", 0, 10 + i * 20);
					SYSTEM.window.code.textCodeGraphics.fill(0); 
					SYSTEM.window.code.textCodeGraphics.text(SYSTEM.window.code.unsavedCode[i].splice(SYSTEM.window.code.cursor.x, addon, 0), textWidth(i + " | ") + 0, 10 + i * 20);
				}
				SYSTEM.window.code.textCodeGraphics.pop();
				image(SYSTEM.window.code.textCodeGraphics,290,50);
				
				//Add on this height to offset the next block
				let blockOffset = 0;
				let initialCodeList = MAIN.entities[SYSTEM.window.code.selectedEntity].initialCodeStack;
				//Represent all SAVED code as blocks.
				initialCodeList.forEach((i) => {
					let block = new Block(i, 20, 50.5 + blockOffset);
					blockOffset += block.render();
				});

				//Represent and save button.
				if(mouseX > SYSTEM.window.code.x + 275 && mouseX < SYSTEM.window.code.x + 325 && mouseY > SYSTEM.window.code.y + 410 && mouseY < SYSTEM.window.code.y + 435){
					fill(200,0,0);
					if(mouseIsPressed){
						try{
							let TEMP = SYSTEM.window.code.unsavedCode.filter((a)=>a).join('~');//Remove sparse entries and compile array
							TEMP = TEMP.replace(/i_(\w+)/g,'["getIntVar","$1"]');//Change variables back to readable instructions
							TEMP = '[' + TEMP + ']';//Make said instructions JSON friendly
							MAIN.entities[SYSTEM.window.code.selectedEntity].initialCodeStack = JSON.parse(TEMP.replace(/~/g,','));//Attempt to parse code into array form and update the entity's instructions
							MAIN.entities[SYSTEM.window.code.selectedEntity].rawInitialCode = TEMP;//Update the entity's raw code
						}catch(err){
							//Spam the error (cry about it)
							syntaxError("COULD NOT COMPILE! "+err)
						}
					}
				}else{
					fill(255,0,0);
				}
				noStroke();
				rect(275,410,50,25,3);
				break;
			case "Entities":
				let ind = -1;
				fill(255);
				noStroke();
				textSize(18);
				textAlign(LEFT);
				text("Entity List:", 20, 63.5);

				//Entity list
				for (let key in MAIN.entities) {
					ind++;
					//Entity selection
					if (mouseX > SYSTEM.window.code.x + 20 && mouseX < SYSTEM.window.code.x + 120 && mouseY > SYSTEM.window.code.y + 73.5 + ind * 50 && mouseY < SYSTEM.window.code.y + 40 + 73.5 + ind * 50) {
						if (mouseIsPressed) {
							SYSTEM.window.code.selectedEntity = key;
						}
						fill(140);
					} else {
						fill(120);
					}
					rect(20, 73.5 + ind * 50, 100, 40, 4);

					fill(255);
					noStroke();
					textSize(12);
					textAlign(CENTER);
					text(key, 70, 97.5 + ind * 50);
				}
				break;
		}
		pop();

		//Update all entities
		if (SYSTEM.window.code.playing) {
			for (let entity in MAIN.entities) {
				MAIN.entities[entity].update();
			}
		}
	} catch (err) {
		background(120);
		fill(255);
		textAlign(CENTER);
		text("FATAL ERROR:\n" + err, windowWidth / 2, windowHeight / 2);
	}
}
//   John W