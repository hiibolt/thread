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
			x: undefined,
			y: undefined,
			w: undefined,
			h: undefined,
			msgs: [],
		},
		code: {
			x: undefined,
			y: undefined,
			w: undefined,
			h: undefined,
			tabs: ["Entities", "Code", "Item", "Test"],
			selectedTab: "Entities",
			selectedEntity: undefined,
			playing: false,
			unsavedCode: undefined,
			input: undefined,
		},
		viewport: {
			x: undefined,
			y: undefined,
			w: undefined,
			h: undefined,
			g: undefined,
			
			camera:{
				x: 100,
				y: 10,
				z: 0,
				x_r: 0,
				y_r: 0,
			}
		}
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
		this.initialCodeStack = JSON.parse(initialCode.replace(/~/g, ','));
		this.updateCodeStack = JSON.parse(updateCode.replace(/~/g, ','));
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
			case "setPos": return this.setPosition(CODE_INFO[1], CODE_INFO[2], CODE_INFO[3]);
			case "setRot": return this.setRotation(CODE_INFO[1], CODE_INFO[2], CODE_INFO[3]);

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
			this.internalVariables[name] = value;
			return 0;
		} catch (err) {
			nonFatalError("Variable " + name + " does not exist or could not be set");
			return 1;
		}
	}
	//Returns variable <name>
	getInternalVariable(name) {
		if (this.internalVariables[name]) {
			return this.internalVariables[name];
		} else {
			nonFatalError("Variable " + name + " does not exist or could not be fetched");
			return 1;
		}
	}
	//Sets position to (<setX>,<setY>,<setZ>)
	setPosition(setX, setY, setZ) {
		try {
			this.x = setX * 1;
			this.y = setY * 1;
			this.z = setZ * 1;
			return 0;
		} catch (err) {
			nonFatalError("Could not set position!\n" + err);
			return 1;
		}
	}
	//Sets rotation to (<setX>,<setY>,<setZ>)
	setRotation(setX, setY, setZ) {
		try {
			this.rX = setX * 1;
			this.rY = setY * 1;
			this.rZ = setZ * 1;
			return 0;
		} catch (err) {
			nonFatalError("Could not set Rotation!\n" + err);
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
			case "setPos":
				this.name = "Set Self Position";
				this.args = ["X", "Y", "Z"];
				this.color = color('BlueViolet');
				break;
			case "setRot":
				this.name = "Set Self Rotation";
				this.args = ["X", "Y", "Z"];
				this.color = color('BlueViolet');
				break;
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
				this.name = this.code[0] + "\nINVALID FUNCTION!";
				this.args = [];
				this.color = color('Red');
		}
	}
	render() {
		//Calculate the longest piece of text and stretch/squash block to fit
		let blockText = textWidth(this.name);
		for (let i = 0; i < this.args.length; i++) {
			if (textWidth(this.args[i] + ": " + this.code[i + 1]) > blockText) {
				blockText = textWidth(this.args[i] + ": " + this.code[i + 1]);
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
			text(this.args[i] + ": " + this.code[i + 1], this.x + 5, this.y + 23.5 + (i + 1) * 20);
		}
		return 30 + this.args.length * 20;
	}
}

/** Graphical Functions **/
function Button(args, func) {
	if (mouseX > args.x + args.offsetX && mouseX < args.x + args.w + args.offsetX && mouseY > args.y + args.offsetY && mouseY < args.y + args.h + args.offsetY) {
		fill(args.primaryColor + color(20));
		if (mouseIsPressed) {
			func();
		}
	} else {
		fill(args.primaryColor);
	}
	rect(args.x, args.y, args.w, args.h, 3);
}
function debugView() {
	push();
	translate(SYSTEM.window.debug.x, SYSTEM.window.debug.y);
	scale(1);

	fill(55);
	stroke(255);
	strokeWeight(10);
	rect(5, 5, SYSTEM.window.debug.w - 10, SYSTEM.window.debug.h - 10, 5);

	if (mouseX > SYSTEM.window.debug.x && mouseX < SYSTEM.window.debug.x + SYSTEM.window.debug.w && mouseY > SYSTEM.window.debug.y && mouseY < SYSTEM.window.debug.y + 15) {
		if (mouseIsPressed) {
			SYSTEM.window.debug.x = mouseX - 150;
			SYSTEM.window.debug.y = mouseY - 7.5;
		}
		fill(110);
	} else {
		fill(90);
	}
	noStroke();
	rect(0, 0, SYSTEM.window.debug.w, 15, 1);

	fill(255);
	noStroke();
	text(SYSTEM.window.debug.msgs.slice(-5).join('\n'), 15, 20, SYSTEM.window.debug.w - 30);
	pop();
}
function codeViewTEMP() {
	fill(55);
	stroke(255);
	strokeWeight(10);
	rect(5, 5, SYSTEM.window.code.w - 10,SYSTEM.window.code.h - 10, 5);

	if (mouseX > SYSTEM.window.code.x && mouseX < SYSTEM.window.code.x + SYSTEM.window.code.w && mouseY > SYSTEM.window.code.y && mouseY < SYSTEM.window.code.y + 15) {
		if (mouseIsPressed) {
			SYSTEM.window.code.x = mouseX - 150;
			SYSTEM.window.code.y = mouseY - 7.5;
		}
		fill(110);
	} else {
		fill(90);
	}
	noStroke();
	rect(0, 0, SYSTEM.window.code.w, 15, 1);

	//Display all tabs
	SYSTEM.window.code.tabs.forEach((item, ind) => {
		if ((item == "Item" && !SYSTEM.window.code.selectedEntity) || (item == "Code" && !SYSTEM.window.code.selectedEntity)) {
			return;
		}
		if (mouseX > SYSTEM.window.code.x + 15 + ind * 50 && mouseX < SYSTEM.window.code.x + 50 + 15 + ind * 50 && mouseY > SYSTEM.window.code.y + 19 && mouseY < SYSTEM.window.code.y + 39) {
			if (mouseIsPressed) {
				SYSTEM.window.code.selectedTab = item;
				document.getElementById('codeWindow').style.display = "none";
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
	rect(5, 36, SYSTEM.window.code.w - 10, SYSTEM.window.code.h - 41, 5)
}

/** Debug Functions **/
function printMsg(msg) {
	SYSTEM.window.debug.msgs.push("Message: " + msg);
}
function nonFatalError(msg) {
	SYSTEM.window.debug.msgs.push("Warning: " + msg);
}
function syntaxError(msg) {
	SYSTEM.window.debug.msgs.push("Syntax error: " + msg);
}

//String splice function. Identical to Array.splice
String.prototype.splice = function(ind, str, rem) {
	return this.slice(0, ind) + str + this.slice(ind + rem);
};
function keyPressed() {
}
function mouseWheel(event) {
}
function setup() {
	//Initialize sketch
	createCanvas(max(windowWidth,400), max(400,windowHeight));
	background(255, 0, 0);

	//Initialize window sizes and graphics
	SYSTEM.window.debug.x = 0;
	SYSTEM.window.debug.y = 0;
	SYSTEM.window.debug.w = windowWidth / 4;
	SYSTEM.window.debug.h = (windowHeight / 5) * 2;
	
	SYSTEM.window.code.x = 0;
	SYSTEM.window.code.y = (windowHeight / 5) * 2;
	SYSTEM.window.code.w = windowWidth;
	SYSTEM.window.code.h = (windowHeight / 5 ) * 3;

	SYSTEM.window.viewport.x = windowWidth/4;
	SYSTEM.window.viewport.y = 0;
	SYSTEM.window.viewport.w = (windowWidth / 4) * 3;
	SYSTEM.window.viewport.h = (windowHeight / 5) * 2;
	SYSTEM.window.viewport.g = createGraphics(SYSTEM.window.viewport.w - 20, SYSTEM.window.viewport.h  - 25, WEBGL);
	
	//Initialize textbox
	SYSTEM.window.code.input = createDiv('<style>.example { width: ' + (SYSTEM.window.code.w / 2 - 20) + 'px; height:' + (SYSTEM.window.code.h - 150) + 'px}</style> <textarea id="codeWindow" class="example" rows="5000" cols="500000" placeholder="Code" spellcheck="false"></textarea>');
	SYSTEM.window.code.input.style('font-size', '16px');

	//TEMP: add entity
	MAIN.entities["MainEntity"] = new Entity({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, '[["setIntVar","Health","100"]~["print",["concat","You have ",["getIntVar","Health"]," health"]]~["setIntVar","Health",["mult",["getIntVar","Health"],1,23]]~["print",["concat","You have ",["getIntVar","Health"]," health"]]~["print",["mult",3,2,-2]],["nonexistantfunctionshouldthrowwarning","pretendarg1","pretendarg2"]]', "[]");
}
function draw() {
	background(70);
	try {
		//Console
		debugView();

		//Codebox
		push();
		translate(SYSTEM.window.code.x, SYSTEM.window.code.y);
		scale(1);
		codeViewTEMP();
		switch (SYSTEM.window.code.selectedTab) {
			case "Item":
				let e = MAIN.entities[SYSTEM.window.code.selectedEntity];
				fill(255);
				noStroke();
				textAlign(LEFT);
				textSize(15);
				text(SYSTEM.window.code.selectedEntity, 20, 70);
				textSize(12);
				text("Position: (x:" + e.x + " | y: " + e.y + " | z: " + e.z + ")", 20, 95);
				text("Rotation: (x:" + e.rX + " | y: " + e.rY + " | z: " + e.rZ + ")", 20, 115);
				text("Internal Variables", 20, 155);
				let offset = -1;
				for (let i in e.internalVariables) {
					offset++;
					text("	" + i + ": " + e.internalVariables[i], 20, 170 + offset * 15);
				}
				break;
			case "Test":
				//Start button
				if (!SYSTEM.window.code.playing) {
					if (mouseX > SYSTEM.window.code.x + 20 && mouseX < SYSTEM.window.code.x + 45 && mouseY > SYSTEM.window.code.y + 50 && mouseY < SYSTEM.window.code.y + 75 && mouseIsPressed) {
						//Start update process for all entities
						SYSTEM.window.code.playing = true;
						//Clear console
						SYSTEM.window.debug.msgs = [];
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
				if (!SYSTEM.window.code.unsavedCode) {
					let TEMP = MAIN.entities[SYSTEM.window.code.selectedEntity].rawInitialCode;
					TEMP = TEMP.slice(1, -1);//Ignore edge brackets for readability
					TEMP = TEMP.replace(/\["getIntVar","(\w+)"\]/g, "i_$1");//Eliminate unnessecary var functions
					SYSTEM.window.code.unsavedCode = TEMP.replace(/~/g, '\n')//Split per line
					document.getElementById('codeWindow').innerHTML = SYSTEM.window.code.unsavedCode;
				}
				SYSTEM.window.code.input.position(SYSTEM.window.code.x + (SYSTEM.window.code.w / 2), SYSTEM.window.code.y + 50.5);
				SYSTEM.window.code.unsavedCode = document.getElementById('codeWindow').value;
				document.getElementById('codeWindow').style.display = "block";

				//Add on this height to offset the next block
				let blockOffset = 0;
				try {
					let TEMP = SYSTEM.window.code.unsavedCode.split('\n').filter((a) => a).join('~');
					TEMP = TEMP.replace(/i_(\w+)/g, '["getIntVar","$1"]');
					TEMP = '[' + TEMP + ']';
					let initialCodeList = JSON.parse(TEMP.replace(/~/g, ','));

					//Represent all SAVED code as blocks.
					initialCodeList.forEach((i) => {
						try {
							let block = new Block(i, 20, 50.5 + blockOffset);
							blockOffset += block.render();
						} catch {

						}
					});
				} catch (err) {

				}
				//Represent and save button.
				Button({
					x: (SYSTEM.window.code.w / 2) - 25,
					y: SYSTEM.window.code.h - 50,
					offsetX: SYSTEM.window.code.x,
					offsetY: SYSTEM.window.code.y,
					w: 50,
					h: 25,
					primaryColor: color(120),
				}, () => {
					try {
						/**
							Line 1: Swap breaks for seperator
							Line 2: Change variables back to machine-readable instructions
							Line 3: Make said instructions JSON friendly
							Line 4: Attempt to parse code into array form and update the entity's instructions
							Line 5: Update the entity's raw code
						**/
						let TEMP = SYSTEM.window.code.unsavedCode.split('\n').filter((a) => a).join('~');
						TEMP = TEMP.replace(/i_(\w+)/g, '["getIntVar","$1"]');
						TEMP = '[' + TEMP + ']';
						MAIN.entities[SYSTEM.window.code.selectedEntity].initialCodeStack = JSON.parse(TEMP.replace(/~/g, ','));
						MAIN.entities[SYSTEM.window.code.selectedEntity].rawInitialCode = TEMP;
					} catch (err) {
						//Spam the error (cry about it)
						syntaxError("COULD NOT COMPILE! " + err)
					}
				})
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
		
		//Viewport
		push();
		translate(SYSTEM.window.viewport.x, SYSTEM.window.viewport.y);
		fill(55);
		stroke(255);
		strokeWeight(10);
		rect(5, 5, SYSTEM.window.viewport.w - 10, SYSTEM.window.viewport.h - 10, 5);
		if (mouseX > SYSTEM.window.viewport.x && mouseX < SYSTEM.window.viewport.x + SYSTEM.window.viewport.w && mouseY > SYSTEM.window.viewport.y && mouseY < SYSTEM.window.viewport.y + 15) {
		if (mouseIsPressed) {
			SYSTEM.window.viewport.x = mouseX - 150;
			SYSTEM.window.viewport.y = mouseY - 7.5;
		}
		fill(110);
	} else {
		fill(90);
	}
	noStroke();
	rect(0, 0, SYSTEM.window.viewport.w, 15, 1);
	pop();
	
	/**
   vp = Shorthand for viewport variables
   g = Graphical canvas
	 camera = Variable set for camera
	 x/y/z = X, y, and z coordinates
	 r = Rotation
	**/
	let vp = SYSTEM.window.viewport;
	vp.g.clear();
	vp.g.background(135,206,235);
		
	vp.g.push();
	vp.g.fill(0);
	vp.g.box(5);
	vp.g.pop();

	vp.g.push();
	vp.g.translate(0,50,0)
	vp.g.fill(0);
	vp.g.box(500,5,500);
	vp.g.pop();
		
	vp.g.camera(vp.camera.x,vp.camera.y,vp.camera.z,vp.camera.x + cos(vp.camera.x_r),vp.camera.y + vp.camera.y_r,vp.camera.z + sin(vp.camera.x_r));
	if(mouseIsPressed && mouseX > SYSTEM.window.viewport.x + 10 && mouseX < SYSTEM.window.viewport.x + SYSTEM.window.viewport.w - 10 && mouseY > SYSTEM.window.viewport.y + 15 && mouseY < SYSTEM.window.viewport.y + SYSTEM.window.viewport.h - 10){
		vp.camera.x_r += movedX / 50;
		vp.camera.y_r += movedY / 50;
	}
	image(SYSTEM.window.viewport.g,SYSTEM.window.viewport.x + 10,SYSTEM.window.viewport.y + 15);
		
		//Update all entities
		if (SYSTEM.window.code.playing) {
			for (let entity in MAIN.entities) {
				MAIN.entities[entity].update(SYSTEM.window.viewport.g);
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