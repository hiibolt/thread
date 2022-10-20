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
			blockCanvas: undefined,
			blockScroll: 0,
		},
		viewport: {
			x: undefined,
			y: undefined,
			w: undefined,
			h: undefined,
			g: undefined,

			camera: {
				x: 0,
				y: 0,
				z: 0,
				rX: 0, //look up/down rotation
				rY: 0, //2d rotation
				rZ: 0,
			}
		}
	},
}
var MAIN = {
	_RESERVED_NAMES: ["tick"],
	keys: [],
	globalVariables: {
		tick: 0,
	},
	entitySpawnClickWait: 0,
	entityTitle: 0,
	entities: {},
};

/** Classes **/
//Host entity. Core framework of what the user utilizes.
class Entity {
	constructor(name, initialTransform, model, initialCode, updateCode) {
		//Initialize variables all entities share
		this.name = name;
		this.model = model;
		this.internalVariables = {
			x: initialTransform.x,
			y: initialTransform.y,
			z: initialTransform.z,
			rX: initialTransform.rX,
			rY: initialTransform.rY,
			rZ: initialTransform.rZ,
			scale: initialTransform.scale,
		};
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
		g.translate(this.internalVariables.x, this.internalVariables.y, this.internalVariables.z);
		g.rotateX(this.internalVariables.rX);
		g.rotateY(this.internalVariables.rY);
		g.rotateZ(this.internalVariables.rZ);
		switch (this.model) {
			case "box":
				g.fill(0);
				g.stroke(255);
				g.strokeWeight(2);
				g.box(5 * this.internalVariables.scale);
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
			if (Array.isArray(CODE_INFO[i]) && CODE_INFO[0] !== "if" && CODE_INFO[0] !== "onKey") {
				CODE_INFO[i] = this.EVALUATE_CODE(CODE_INFO[i]);
			}
		}

		switch (CODE_INFO[0]) {
			/** Variable manipulation and retrieval **/
			case "setIntVar": return this.setInternalVariable(CODE_INFO[1], CODE_INFO[2]);
			case "getIntVar": return this.getInternalVariable(CODE_INFO[1]);
			case "setGloVar": return this.setGlobalVariable(CODE_INFO[1], CODE_INFO[2]);
			case "getGloVar": return this.getGlobalVariable(CODE_INFO[1]);

			case "setPos": return this.setPosition(CODE_INFO[1], CODE_INFO[2], CODE_INFO[3]);
			case "setRot": return this.setRotation(CODE_INFO[1], CODE_INFO[2], CODE_INFO[3]);
			case "shiftAxis": return this.shiftAxis(CODE_INFO[1], CODE_INFO[2]);


			/** Operations **/
			case "concat": return CODE_INFO.slice(1).join('');

			case "add": return this.addAll(CODE_INFO.slice(1));
			case "sub": return CODE_INFO[1] * 1 - CODE_INFO[2] * 1;
			case "mult": return this.multiplyAll(CODE_INFO.slice(1));
			case "div": return (CODE_INFO[1] * 1) / (CODE_INFO[2] * 1);
			case "trig": return this.trig(CODE_INFO[1], CODE_INFO[2]);

			case "equals": return CODE_INFO[1] == CODE_INFO[2];
			case "notequals": return !(CODE_INFO[1] == CODE_INFO[2]);
			case "and": return this.and(CODE_INFO.slice(1));
			case "or": return this.or(CODE_INFO.slice(1));

			/** Input **/
			case "onKey": return this.onKey(CODE_INFO[1], CODE_INFO[2]);
			case "getKey": return this.getKey(CODE_INFO[1]);

			/** Logic **/
			case "if": return this.ifStatement(CODE_INFO[1], CODE_INFO[2], CODE_INFO[3]);

			/** System **/
			case "print": return printMsg(CODE_INFO.slice(1).join(''));
			case "setName": return this.setName(CODE_INFO[1]);
			case "log":
				console.log(this.rawInitialCode);
				console.log(this.rawUpdateCode);
				break;
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
		try {
			return this.internalVariables[name];
		} catch {
			nonFatalError("Variable " + name + " does not exist or could not be fetched");
			return undefined;
		}
	}
	//Sets variable <name> to <value>
	setGlobalVariable(name, value) {
		try {
			if (MAIN._RESERVED_NAMES.includes(name)) {
				throw "'" + name + "' is a restricted variable name! Try naming your variable something else."
			}
			MAIN.globalVariables[name] = value;
			return 0;
		} catch (err) {
			nonFatalError("Variable " + name + " does not exist or could not be set\n" + err);
			return 1;
		}
	}
	//Returns variable <name>
	getGlobalVariable(name) {
		try {
			return MAIN.globalVariables[name];
		} catch {
			nonFatalError("Variable " + name + " does not exist or could not be fetched");
			return undefined;
		}
	}
	//Sets position to (<setX>,<setY>,<setZ>)
	setPosition(setX, setY, setZ) {
		try {
			this.internalVariables.x = setX * 1;
			this.internalVariables.y = setY * 1;
			this.internalVariables.z = setZ * 1;
			return 0;
		} catch (err) {
			nonFatalError("Could not set position!\n" + err);
			return 1;
		}
	}
	//Sets rotation to (<setX>,<setY>,<setZ>)
	setRotation(setX, setY, setZ) {
		try {
			this.internalVariables.rX = (setX * 1) / 180 * PI;
			this.internalVariables.rY = (setY * 1) / 180 * PI;
			this.internalVariables.rZ = (setZ * 1) / 180 * PI;
			return 0;
		} catch (err) {
			nonFatalError("Could not set Rotation!\n" + err);
			return 1;
		}
	}
	//Increments <axis> by <value>
	shiftAxis(axis, value) {
		try {
			switch (axis) {
				case "x":
					this.internalVariables.x += value;
					break;
				case "y":
					this.internalVariables.y += value;
					break;
				case "z":
					this.internalVariables.z += value;
					break;
				case "rX":
					this.internalVariables.rX += value / 180 * PI;
					break;
				case "rY":
					this.internalVariables.rY += value / 180 * PI;
					break;
				case "rZ":
					this.internalVariables.rZ += value / 180 * PI;
					break;
			}
		} catch (err) {
			nonFatalError("Could not shift!\n" + err);
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
	//Trigonomic Functions
	trig(type, number) {
		switch (type) {
			case "cos": return Math.cos(number);
			case "sin": return Math.sin(number);
			case "tan": return Math.tan(number);
			case "acos": return Math.acos(number);
			case "asin": return Math.asin(number);
			case "atan": return Math.atan(number);
			default:
				nonFatalError(type + " is not a valid trig function.");
				break;
		}
	}

	//Returns true if all <args>[n] return true
	and(args) {
		return args.every((i) => i);
	}
	//Return true if any one <args>[n] returns true
	or(args) {
		return args.find((i) => i) != undefined;
	}

	//Input
	//Returns the state of key <code>
	getKey(code) {
		return !!MAIN.keys[code];
	}
	//When key <code> is pressed, execute <code>
	onKey(keycode, code) {
		if (MAIN.keys[keycode] === true) {
			try {
				this.EVALUATE_CODE(code);
			} catch (err) {
				nonFatalError("Could not execute code!\n" + err)
			}
		}
	}

	//Conditional
	ifStatement(condition, option1, option2) {
		try {
			if (this.EVALUATE_CODE(condition)) {
				return option1 != "pass" ? this.EVALUATE_CODE(option1) : 0;
			} else {
				return option2 != "pass" ? this.EVALUATE_CODE(option2) : 0;
			}
		} catch (err) {
			nonFatalError("Could not complete if statement!\n" + err);
			return 1;
		}
	}

	//System
	setName(name) {
		if (typeof name === 'string') {
			this.name = name;
			return 0;
		} else {
			return 1;
		}
	}
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
				var offset = -1;
				for (var i in e.internalVariables) {
					offset++;
					text("	- " + i + ": " + e.internalVariables[i], 20, 170 + offset * 15);
				}

				text("Global Variables", 150, 155);
				var offset = -1;
				for (var i in MAIN.globalVariables) {
					offset++;
					text("   - " + i + ": " + MAIN.globalVariables[i], 150, 170 + offset * 15);
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
						MAIN.globalVariables.tick = 0;
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
					var codeList;
					if (SYSTEM.window.code.codeType) {
						codeList = compile(SYSTEM.window.code.unsavedInitialCode);
					} else {
						codeList = compile(SYSTEM.window.code.unsavedUpdateCode);
					}
					//Represent all SAVED code as blocks.
					codeList.forEach((i) => {
						blockOffset += Block(i, 20, SYSTEM.window.code.blockScroll + blockOffset, SYSTEM.window.code.blockCanvas);
					});
				} catch (err) {
					fill(255);
					noStroke();
					textSize(20);
					textAlign(LEFT);
					text("SYNTAX ERROR!\n" + err, 20, 55, SYSTEM.window.code.w / 2 - 20);
				}
				image(SYSTEM.window.code.blockCanvas, 20, 50.5);
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

						var codeList = compile(SYSTEM.window.code.unsavedInitialCode);
						MAIN.entities[SYSTEM.window.code.selectedEntity].initialCodeStack = codeList;
						MAIN.entities[SYSTEM.window.code.selectedEntity].rawInitialCode = JSON.stringify(codeList);


						var codeList = compile(SYSTEM.window.code.unsavedUpdateCode);
						MAIN.entities[SYSTEM.window.code.selectedEntity].updateCodeStack = codeList;
						MAIN.entities[SYSTEM.window.code.selectedEntity].rawUpdateCode = JSON.stringify(codeList);

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
				text("Entity List", 20, 63.5);

				textSize(13);
				textAlign(LEFT);
				text("Entity Selected: " + (SYSTEM.window.code.selectedEntity == undefined ? "None" : SYSTEM.window.code.selectedEntity), 20, 82.5);
				//Add entity button
				if (MAIN.entitySpawnClickWait > 100) {
					Button({
						x: 110,
						y: 46.5,
						offsetX: SYSTEM.window.code.x,
						offsetY: SYSTEM.window.code.y,
						text: "Add",
						w: 40,
						h: 20,
						primaryColor: color(130)
					}, () => {
						MAIN.entities["entity" + str(MAIN.entityTitle).padStart(3, '0')] = new Entity("Unnamed", { x: 0, y: 0, z: 0, r_x: 0, r_y: 0, r_z: 0, scale: 3 }, "box", '[["setName","Unnamed"]]', '[]');
						MAIN.entityTitle++;
						MAIN.entitySpawnClickWait = 0;
					})
				} else {
					MAIN.entitySpawnClickWait++;
				}
				//Entity list
				let ind = -1;
				for (let key in MAIN.entities) {
					ind++;
					//Entity selection
					Button({
						x: 20,
						y: 93.5 + ind * 50,
						offsetX: SYSTEM.window.code.x,
						offsetY: SYSTEM.window.code.y,
						text: MAIN.entities[key].name,
						w: 100,
						h: 40,
						primaryColor: color(130)
					}, () => {
						SYSTEM.window.code.selectedEntity = key;
						SYSTEM.window.code.codeType = true;
						var TEMP = MAIN.entities[SYSTEM.window.code.selectedEntity].rawInitialCode;
						TEMP = TEMP.slice(1, -1);//Ignore edge brackets for readability
						SYSTEM.window.code.unsavedInitialCode = TEMP.replace(/~/g, '\n')//Split per line
						document.getElementById('codeWindow').value = SYSTEM.window.code.unsavedInitialCode;

						var TEMP = MAIN.entities[SYSTEM.window.code.selectedEntity].rawUpdateCode;
						TEMP = TEMP.slice(1, -1);//Ignore edge brackets for readability
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
function keyPressed() {
	MAIN.keys[keyCode] = true;
}
function keyReleased() {
	MAIN.keys[keyCode] = false;
}
function mouseWheel(event) {
	SYSTEM.window.code.blockScroll = min(SYSTEM.window.code.blockScroll + event.delta, 0);
}
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

	//Initialize code window
	SYSTEM.window.code.blockCanvas = createGraphics(SYSTEM.window.code.w / 2 - 20, SYSTEM.window.code.h - 150);

	//Create the main camera
	MAIN.entities["Camera"] = new Entity("Camera", { x: 90, y: 0, z: 50, rX: 0, rY: 0, rZ: 0, scale: 3 }, "box", '[["setName","Camera"]~["setPos",0,0,0]~["setRot",0,0,0]~["print","Camera Initialized"]~["log"]]', '[["onKey",81,["shiftAxis","rY",1]]~["onKey",69,["shiftAxis","rY",-1]]~["onKey",87,["shiftAxis","x",["trig","sin",["getIntVar","rY"]]]]~["onKey",87,["shiftAxis","z",["trig","cos",["getIntVar","rY"]]]]]');
}
function draw() {
	//Wipe all Canvases
	background(70);
	SYSTEM.window.code.blockCanvas.clear();
	SYSTEM.window.viewport.g.clear();
	MAIN.globalVariables.tick += 1;
	//Main loop in debugger
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
			if (SYSTEM.window.code.playing) {
				SYSTEM.window.viewport.camera.x = MAIN.entities["Camera"].internalVariables.x;
				SYSTEM.window.viewport.camera.y = MAIN.entities["Camera"].internalVariables.y;
				SYSTEM.window.viewport.camera.z = MAIN.entities["Camera"].internalVariables.z;
				SYSTEM.window.viewport.camera.rX = MAIN.entities["Camera"].internalVariables.rX
				SYSTEM.window.viewport.camera.rY = MAIN.entities["Camera"].internalVariables.rY
				SYSTEM.window.viewport.camera.rZ = MAIN.entities["Camera"].internalVariables.rZ
			}
			let vp = SYSTEM.window.viewport;
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
				vp.camera.rY -= movedX / 50;
				vp.camera.rX += movedY / 50;
			}
			vp.g.camera(vp.camera.x, vp.camera.y, vp.camera.z, vp.camera.x + sin(vp.camera.rY), vp.camera.y + vp.camera.rX, vp.camera.z + cos(vp.camera.rY));

			//Render viewport
			image(SYSTEM.window.viewport.g, 10, 15);
		})
	} catch (err) {
		background(120);
		fill(255);
		textAlign(CENTER);
		text("FATAL ERROR:\n" + err, windowWidth / 2, windowHeight / 2);
	}
}
//   John W