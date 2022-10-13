p5.disableFriendlyErrors = true;
/**
	Casing rules:
	- NAMEOFITEM = Constant, temp variable, or head variables
	- NameOfItem = Class
	- nameOfItem = Function, argument, or variable
	- _~~~~~~~~~ = Hint to internal variable for user or dev
**/
/**
	Awesome array hack to create an 'infinite argument' function representation.
	- Array.from creates a clone of an array from an array-like/ish object
		IE Array.from("hi") == ["h","i"]
	- We can use the advanced form 
		IE Array.from("hi",(i) => i.toUpperCase()) == ["H","I"]
	- Combine both to get Array.form(Array(# of arguments provided + 1), (item,index) => ("Num " + (index + 1)))
		Which then outputs from 1,7,28 as inputs: Num 1: 1, Num 2: 7, Num 3: 28, Num 4: undefined

	This in turn lets the user see all arguments they've given, as well as alerts to the possibility of more.	
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
			tabs: ["Entities", "Code", "Item", "Test"], //Tab list
			selectedTab: "Entities", //Which tab is selected
			selectedEntity: undefined, //Which entity is selected
			playing: false, //Is the code executing
			codeType: true, //true = editing initial code, false = editing update code
			unsavedInitialCode: undefined, //String containing the UNSAVED initial code
			unsavedUpdateCode: undefined, //String containing the UNSAVED update code
			input: undefined, //Placeholder which has the <textarea> dom object stored in it
		},
		viewport: {
			x: undefined,
			y: undefined,
			w: undefined,
			h: undefined,
			g: undefined,

			camera: {
				x: 100,
				y: 10,
				z: 0,
				x_r: 0, //2d rotation
				y_r: 0, //look up/down rotation
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
	constructor(initialTransform, model, initialCode, updateCode) {
		//Initialize variables all entities share
		this.x = initialTransform.x;
		this.y = initialTransform.y;
		this.z = initialTransform.z;
		//this.rX = initialTransform.r_x;
		//this.rY = initialTransform.r_y;
		//this.rZ = initialTransform.r_z;
		this.scale = initialTransform.scale;;
		this.model = model;
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
		this._UPDATECODESTACK = JSON.parse(JSON.stringify(this.updateCodeStack));
		//Execute every code statement (ground level, the first blocks)
		this._UPDATECODESTACK.forEach((item) => { this.EVALUATE_CODE(item); });
	}
	render(g) {
		g.push();
		g.translate(this.x, this.y, this.z);
		//g.rotate(this.rX,this.rY,this.rZ);
		switch (this.model) {
			case "box":
				g.fill(0);
				g.stroke(255);
				g.strokeWeight(2);
				g.box(5 * this.scale);
				break;
			default:
				//insert custom model code right here lol
				break;
		}
		g.pop();
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
			if (Array.isArray(CODE_INFO[i]) && CODE_INFO[0] !== "if") {
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
			
			case "equals" : return CODE_INFO[1] == CODE_INFO[2];
			case "notequals" : return !(CODE_INFO[1] == CODE_INFO[2]);
			case "and" : return this.and(CODE_INFO.slice(1));
			case "or" : return this.or(CODE_INFO.slice(1));

			/** Logic **/
			case "if" : return this.ifStatement(CODE_INFO[1],CODE_INFO[2],CODE_INFO[3]);
			
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
		try{
			return this.internalVariables[name];
		} catch {
			nonFatalError("Variable " + name + " does not exist or could not be fetched");
			return undefined;
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
	
	//Returns true if all args return true
	and(args){
		return args.every((i) => i);
	}
	//Return true if any args return true
	or(args){
		return args.find((i) => i) != undefined;
	}
	
	//Conditional
	ifStatement(condition,option1,option2){
		try{
			if(this.EVALUATE_CODE(condition)){
				return this.EVALUATE_CODE(option1);
			}else{
				return this.EVALUATE_CODE(option2);
			}
		}catch(err){
			nonFatalError("Could not complete if statement!\n" + err);
			return 1;
		}
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
	stroke(lerpColor(args.primaryColor, color(255), 0.4));
	strokeWeight(3);
	rect(args.x, args.y, args.w, args.h, 3);

	fill(255);
	noStroke();
	textAlign(CENTER);
	textSize(12);
	text(args.text, args.x + (args.w / 2), args.y + (args.h / 2) + 4);
}
function Window(args, func) {
	push();
	translate(args.x, args.y);
	fill(55);
	stroke(255);
	strokeWeight(10);
	rect(5, 5, args.w - 10, args.h - 10, 5);
	if (mouseX > args.x && mouseX < args.x + args.w && mouseY > args.y && mouseY < args.y + 15) {
		if (mouseIsPressed) {
			args.mod.x = mouseX - 150;
			args.mod.y = mouseY - 7.5;
		}
		fill(110);
	} else {
		fill(90);
	}
	noStroke();
	rect(0, 0, args.w, 15, 1);
	func();
	pop();
}
function Block(code, x, y) {
	let name;
	let args;
	let colorF;
	//Given the code, determine what the user's displayed name and arguments are
	switch (code[0]) {
		case "setPos":
			name = "Set Self Position";
			args = ["X", "Y", "Z"];
			colorF = color('Magenta');
			break;
		case "setRot":
			name = "Set Self Rotation";
			args = ["X", "Y", "Z"];
			colorF = color('Magenta');
			break;
		case "setIntVar":
			name = "Set Internal Variable";
			args = ["Variable Name", "Value"];
			colorF = color('Beige');
			break;
		case "getIntVar":
			name = "Get Internal Variable";
			args = ["Variable Name"];
			colorF = color('Beige');
			break;
			
		case "print":
			name = "Print Message";
			args = ["Message"];
			colorF = color('DeepSkyBlue');
			break;
			
		case "concat":
			name = "Concatenate Strings"
			//See explanation at the top
			args = Array.from(Array(code.length), (i, ind) => "String " + (ind + 1) + (ind + 1 == code.length ? "*" : ""))
			colorF = color('LimeGreen');
			break;
		case "mult":
			name = "Multiply N1 * N2 * N..."
			//See explanation at the top
			args = Array.from(Array(code.length), (i, ind) => "#" + (ind + 1) + (ind + 1 == code.length ? "*" : ""))
			colorF = color('LimeGreen');
			break;
		case "div":
			name = "Divide N1 * N2"
			args = ["#1","N2"];
			colorF = color('LimeGreen');
			break;
		case "add":
			name = "Add N1 + N2 + N..."
			//See explanation at the top
			args = Array.from(Array(code.length), (i, ind) => "#" + (ind + 1) + (ind + 1 == code.length ? "*" : ""))
			colorF = color('LimeGreen');
			break;
		case "sub":
			name = "Subtract N1 - N2"
			args = ["#1","N2"];
			colorF = color('LimeGreen');
			break;
			
		case "equals":
			name = "Assert Item 1 equals Item 2"
			args = ["Item 1","Item 2"];
			colorF = color('PaleTurquoise');
			break;
		case "notequals":
			name = "Assert Item 1 does not equal Item 2"
			args = ["Item 1","Item 2"];
			colorF = color('PaleTurquoise');
			break;
		case "and":
			name = "Asesrt A1 and A2 and A..."
			//See explanation at the top
			args = Array.from(Array(code.length), (i, ind) => "Argument " + (ind + 1) + (ind + 1 == code.length ? "*" : ""))
			colorF = color('PaleTurquoise');
			break;
		case "or":
			name = "Asesrt any A1 or A2 or A..."
			//See explanation at the top
			args = Array.from(Array(code.length), (i, ind) => "Argument " + (ind + 1) + (ind + 1 == code.length ? "*" : ""))
			colorF = color('PaleTurquoise');
			break;

		case "if":
			name = "If Condition then Option 1 otherwise Option 2"
			args = ["Condition","Option 1","Option 2"]
			colorF = color('Khaki');
			break;
		default:
			name = code[0] + "\nINVALID FUNCTION!";
			args = [];
			colorF = color('Red');
	}
	//Calculate the longest piece of text and stretch/squash block to fit
	let blockText = textWidth(name) + 25;
	for (let i = 0; i < args.length; i++) {
		if (Array.isArray(code[i + 1])) {
			let testWidth = textWidth(args[i] + ": " + JSON.stringify(code[i + 1]));
			if (testWidth + 25 > blockText) {
				blockText = testWidth + 25;
			}
		} else {
			if (textWidth(args[i] + ": " + code[i + 1]) > blockText) {
				blockText = textWidth(args[i] + ": " + code[i + 1]) + 25;
			}
		}
	}
	fill(colorF);
	stroke(lerpColor(colorF, color(0), 0.4));
	strokeWeight(3);
	rect(x, y, blockText, 17)

	textAlign(LEFT);
	textSize(12);
	fill(0, 0, 0);
	noStroke();
	text(name, x + 5, y + 13.5);

	let totalHeight = 0;
	for (let i = 0; i < args.length; i++) {
		//If it's another code block, recursive that b!tch, otherwise, show the arg with the proper background fill
		if (Array.isArray(code[i + 1])) {
			noStroke();
			fill(255,255,255);
			text(args[i] + ": ", x + 4, y + totalHeight + 30);
			fill(0, 0, 0);
			text(args[i] + ": ", x + 5, y + totalHeight + 30);
			totalHeight += Block(code[i + 1], x + textWidth(args[i] + ": ") + 5, y + totalHeight + 20) + 15;
		} else {
			fill(colorF);
			noStroke();
			rect(x, y + totalHeight + 15, blockText, 50);
			fill(0, 0, 0);
			text(args[i] + ": " + code[i + 1], x + 5, y + totalHeight + 30);
			totalHeight += 30;
		}
	}
	//The block's edge lines, helps a little bit with readability
	if (args.length > 0) {
		stroke(lerpColor(colorF, color(0), 0.4));
		line(x, y, x, y + totalHeight + 30);
		//line(x + blockText,y,x + blockText,y + totalHeight + 30);
	}
	return totalHeight + 20;

}

/** Code chunking for readability in draw loop **/
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
	text(SYSTEM.window.debug.msgs.slice(-9).join('\n'), 15, 20, SYSTEM.window.debug.w - 30);
	pop();
}
function codeTabView() {
	Window({
		x: SYSTEM.window.code.x,
		y: SYSTEM.window.code.y,
		w: SYSTEM.window.code.w,
		h: SYSTEM.window.code.h,
		mod: SYSTEM.window.code
	}, () => {
		//Display all tabs
		SYSTEM.window.code.tabs.forEach((item, ind) => {
			if (!SYSTEM.window.code.selectedEntity && (item == "Item" || item == "Code")) {
				return;
			} else {
				Button({
					x: 15 + ind * 50,
					y: 19,
					offsetX: SYSTEM.window.code.x,
					offsetY: SYSTEM.window.code.y,
					text: item,
					w: 50,
					h: 20,
					primaryColor: color(120),
				}, () => {
					SYSTEM.window.code.selectedTab = item;
					document.getElementById('codeWindow').style.display = "none";
				})
			}
		});
		//'Aesthetic' rectangle below code
		fill(110);
		rect(5, 36, SYSTEM.window.code.w - 10, SYSTEM.window.code.h - 41, 5)

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
				if (!SYSTEM.window.code.playing) {
					Button({
						x: 20,
						y: 50,
						offsetX: SYSTEM.window.code.x,
						offsetY: SYSTEM.window.code.y,
						text: "Start",
						w: 35,
						h: 25,
						primaryColor: color(0, 120, 0)
					}, () => {
						//Start update process for all entities
						SYSTEM.window.code.playing = true;
						//Clear console
						SYSTEM.window.debug.msgs = [];
						//If the green play button is pressed, initialize all entities in the world list 
						for (let entity in MAIN.entities) {
							MAIN.entities[entity].initialize();
						}
					})
				} else {
					Button({
						x: 60,
						y: 50,
						offsetX: SYSTEM.window.code.x,
						offsetY: SYSTEM.window.code.y,
						text: "Stop",
						w: 35,
						h: 25,
						primaryColor: color(120, 0, 0)
					}, () => {
						SYSTEM.window.code.playing = false;
					})
				}
				break;
			case "Code":
				SYSTEM.window.code.input.position(SYSTEM.window.code.x + (SYSTEM.window.code.w / 2), SYSTEM.window.code.y + 50.5);
				document.getElementById('codeWindow').style.display = "block";
				if (SYSTEM.window.code.codeType) {
					SYSTEM.window.code.unsavedInitialCode = document.getElementById('codeWindow').value;
				} else {
					SYSTEM.window.code.unsavedUpdateCode = document.getElementById('codeWindow').value;

				}

				//Add on this height to offset the next block
				var blockOffset = 0;
				try {
					var TEMP;
					if (SYSTEM.window.code.codeType) {
						TEMP = SYSTEM.window.code.unsavedInitialCode.split('\n').filter((a) => a).join('~');
					} else {
						TEMP = SYSTEM.window.code.unsavedUpdateCode.split('\n').filter((a) => a).join('~');
					}
					TEMP = TEMP.replace(/i_(\w+)/g, '["getIntVar","$1"]');
					TEMP = '[' + TEMP + ']';
					let codeList = JSON.parse(TEMP.replace(/~/g, ','));

					//Represent all SAVED code as blocks.
					codeList.forEach((i) => {
						blockOffset += Block(i, 20, 50.5 + blockOffset);
					});
				} catch (err) {
					fill(255);
					noStroke();
					textSize(20);
					textAlign(LEFT);
					text("SYNTAX ERROR!\n" + err, 20, 55, SYSTEM.window.code.w / 2 - 20);
				}

				//Swap between initial and update code
				Button({
					x: (SYSTEM.window.code.w / 2) - 185,
					y: SYSTEM.window.code.h - 50,
					offsetX: SYSTEM.window.code.x,
					offsetY: SYSTEM.window.code.y,
					text: "On Initializaion",
					w: 90,
					h: 25,
					primaryColor: color(120),
				}, () => {
					SYSTEM.window.code.codeType = true;
					document.getElementById('codeWindow').value = SYSTEM.window.code.unsavedInitialCode;
				});
				Button({
					x: (SYSTEM.window.code.w / 2) - 85,
					y: SYSTEM.window.code.h - 50,
					offsetX: SYSTEM.window.code.x,
					offsetY: SYSTEM.window.code.y,
					text: "On Update",
					w: 70,
					h: 25,
					primaryColor: color(120),
				}, () => {
					SYSTEM.window.code.codeType = false;
					document.getElementById('codeWindow').value = SYSTEM.window.code.unsavedUpdateCode;
				});

				//Represent and save button.
				Button({
					x: (SYSTEM.window.code.w / 2) + 15,
					y: SYSTEM.window.code.h - 50,
					offsetX: SYSTEM.window.code.x,
					offsetY: SYSTEM.window.code.y,
					text: "Save",
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

						var TEMP = SYSTEM.window.code.unsavedInitialCode.split('\n').filter((a) => a).join('~');
						TEMP = TEMP.replace(/i_(\w+)/g, '["getIntVar","$1"]');
						TEMP = '[' + TEMP + ']';
						MAIN.entities[SYSTEM.window.code.selectedEntity].initialCodeStack = JSON.parse(TEMP.replace(/~/g, ','));
						MAIN.entities[SYSTEM.window.code.selectedEntity].rawInitialCode = TEMP;

						var TEMP = SYSTEM.window.code.unsavedUpdateCode.split('\n').filter((a) => a).join('~');
						TEMP = TEMP.replace(/i_(\w+)/g, '["getIntVar","$1"]');
						TEMP = '[' + TEMP + ']';
						MAIN.entities[SYSTEM.window.code.selectedEntity].updateCodeStack = JSON.parse(TEMP.replace(/~/g, ','));
						MAIN.entities[SYSTEM.window.code.selectedEntity].rawUpdateCode = TEMP;

					} catch (err) {
						//Spam the error (cry about it)
						syntaxError("COULD NOT COMPILE! " + err)
					}
				});
				break;
			case "Entities":
				fill(255);
				noStroke();
				textSize(18);
				textAlign(LEFT);
				text("Entity List:", 20, 63.5);

				//Entity list
				let ind = -1;
				for (let key in MAIN.entities) {
					ind++;
					//Entity selection
					Button({
						x: 20,
						y: 73.5 + ind * 50,
						offsetX: SYSTEM.window.code.x,
						offsetY: SYSTEM.window.code.y,
						text: key,
						w: 100,
						h: 40,
						primaryColor: color(130)
					}, () => {
						SYSTEM.window.code.selectedEntity = key;

						var TEMP = MAIN.entities[SYSTEM.window.code.selectedEntity].rawInitialCode;
						TEMP = TEMP.slice(1, -1);//Ignore edge brackets for readability
						TEMP = TEMP.replace(/\["getIntVar","(\w+)"\]/g, "i_$1");//Eliminate unnessecary var functions
						SYSTEM.window.code.unsavedInitialCode = TEMP.replace(/~/g, '\n')//Split per line
						document.getElementById('codeWindow').innerHTML = SYSTEM.window.code.unsavedInitialCode;

						var TEMP = MAIN.entities[SYSTEM.window.code.selectedEntity].rawUpdateCode;
						TEMP = TEMP.slice(1, -1);//Ignore edge brackets for readability
						TEMP = TEMP.replace(/\["getIntVar","(\w+)"\]/g, "i_$1");//Eliminate unnessecary var functions
						SYSTEM.window.code.unsavedUpdateCode = TEMP.replace(/~/g, '\n')//Split per line
					});
				}
				break;
		}
	})
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
function setup() {
	//Initialize sketch
	createCanvas(max(windowWidth, 400), max(400, windowHeight));
	background(255, 0, 0);

	//Initialize window sizes and graphics
	SYSTEM.window.debug.x = 0;
	SYSTEM.window.debug.y = 0;
	SYSTEM.window.debug.w = windowWidth / 4;
	SYSTEM.window.debug.h = (windowHeight / 5) * 2;

	SYSTEM.window.code.x = 0;
	SYSTEM.window.code.y = (windowHeight / 5) * 2;
	SYSTEM.window.code.w = windowWidth;
	SYSTEM.window.code.h = (windowHeight / 5) * 3;

	SYSTEM.window.viewport.x = windowWidth / 4;
	SYSTEM.window.viewport.y = 0;
	SYSTEM.window.viewport.w = (windowWidth / 4) * 3;
	SYSTEM.window.viewport.h = (windowHeight / 5) * 2;
	SYSTEM.window.viewport.g = createGraphics(SYSTEM.window.viewport.w - 20, SYSTEM.window.viewport.h - 25, WEBGL);

	//Initialize textbox
	SYSTEM.window.code.input = createDiv('<style>.example { width: ' + (SYSTEM.window.code.w / 2 - 20) + 'px; height:' + (SYSTEM.window.code.h - 150) + 'px}</style> <textarea id="codeWindow" class="example" rows="5000" cols="500000" placeholder="Code" spellcheck="false"></textarea>');
	SYSTEM.window.code.input.style('font-size', '16px');

	//TEMP: add entity
	MAIN.entities["MainEntity"] = new Entity({ x: 90, y: 0, z: 50, r_x: 0, r_y: 0, r_z: 0, scale: 3 }, "box", '[["setIntVar","Health","100"]~["print",["concat","You have ",["getIntVar","Health"]," health"]]~["setIntVar","Health",["mult",["getIntVar","Health"],1,23]]~["print",["concat","You have ",["getIntVar","Health"]," health"]]~["print",["mult",3,2,-2]]~["nonexistantfunctionshouldthrowwarning","pretendarg1","pretendarg2"]]', '[["setPos",0,0,0]]');
}
function draw() {
	background(70);
	try {
		//Console
		debugView();

		//Codebox
		codeTabView();

		//Viewport
		Window({
			x: SYSTEM.window.viewport.x,
			y: SYSTEM.window.viewport.y,
			w: SYSTEM.window.viewport.w,
			h: SYSTEM.window.viewport.h,
			mod: SYSTEM.window.viewport
		}, () => {
			/**
					 vp = Shorthand for viewport variables
					 g = Graphical canvas
					 camera = Variable set for camera
					 x/y/z = X, y, and z coordinates
					 r = Rotation
					**/
			let vp = SYSTEM.window.viewport;
			vp.g.clear();
			vp.g.background(135, 206, 235);

			//Floor [TEMP]
			vp.g.push();
			vp.g.translate(0, 50, 0)
			vp.g.fill(0);
			vp.g.box(500, 5, 500);
			vp.g.pop();

			//Update and render all entities
			if (SYSTEM.window.code.playing) {
				for (let entity in MAIN.entities) {
					MAIN.entities[entity].update();
				}
			}
			for (let entity in MAIN.entities) {
				MAIN.entities[entity].render(SYSTEM.window.viewport.g);
			}
			//Update and set viewport camera
			if (mouseIsPressed && mouseX > SYSTEM.window.viewport.x + 10 && mouseX < SYSTEM.window.viewport.x + SYSTEM.window.viewport.w - 10 && mouseY > SYSTEM.window.viewport.y + 15 && mouseY < SYSTEM.window.viewport.y + SYSTEM.window.viewport.h - 10) {
				vp.camera.x_r += movedX / 50;
				vp.camera.y_r += movedY / 50;
			}
			vp.g.camera(vp.camera.x, vp.camera.y, vp.camera.z, vp.camera.x + cos(vp.camera.x_r), vp.camera.y + vp.camera.y_r, vp.camera.z + sin(vp.camera.x_r));

			//Render viewport
			image(SYSTEM.window.viewport.g, 10, 15);
		})

		//Update all entities
	} catch (err) {
		background(120);
		fill(255);
		textAlign(CENTER);
		text("FATAL ERROR:\n" + err, windowWidth / 2, windowHeight / 2);
	}
}
//   John W