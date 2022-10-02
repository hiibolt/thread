p5.disableFriendlyErrors = true;
var MSGROLL = 0;
class Entity {
	constructor(initialPos,initialRot,initialCode,updateCode) {
		//Initialize entity position and rotation at time of 
		this.x = initialPos.x;
		this.y = initialPos.y;
		this.z = initialPos.z;
		this.rX = initialRot.x;
		this.rY = initialRot.y;
		this.rZ = initialRot.z;
		this.internalVariables = {};
		this.INITIAL_CODE_STACK = initialCode.split('~~~');
		for(let i = 0;i < this.INITIAL_CODE_STACK.length;i++){
			this.EVALUATE_CODE(this.INITIAL_CODE_STACK[i]);
		}
	}
	/** INTERNAL FUNCTIONS **/
	//The execution of the string-based code provide by the user.
	EVALUATE_CODE(code){
		let CODE_INFO = code.split('|||');
		for(let i = 0;i < CODE_INFO.length;i++){
			if(CODE_INFO[i][0] === '~'){
				CODE_INFO[i] = EVALUATE_CODE(CODE_INFO[i].substring(1));
			}
		}
		switch(CODE_INFO[0]){
			case "setVar": return this.setInternalVariable(CODE_INFO[1],CODE_INFO[2]);
			case "getVarStr": return this.getInternalVariableAsString(CODE_INFO[1]);
			case "getVarNum": return this.getInternalVariableAsNum(CODE_INFO[0]);
			case "print": return printMsg(CODE_INFO[1]);
			default: throw("Function " + CODE_INFO[0] + " does not exist.\nInfo: " + CODE_INFO);
		}
	}

	/** USER FUNCTIONS **/
	//Sets variable <name> to <value>
	setInternalVariable(name,value){
		try{
			this.internalVariables.name = value;
			return 0;
		}catch(err){
			nonFatalError("Variable " + name + " does not exist or could not be set");
			return 1;
		}
	}
	//Returns variable <name> as STRING
	getInternalVariableAsString(name){
		if(this.internalVariables.name){
			return this.internalVariables.name;
		}else{
			nonFatalError("Variable " + name + " does not exist or could not be fetched");
			return 1;
		}
	}
	//Returns variable <name> as NUM
	getInternalVariableAsNum(name){
		if(this.internalVariables.name){
			return this.internalVariables.name * 1;
		}else{
			nonFatalError("Variable " + name + " does not exist or could not be fetched");
			return 1;
		}
	}
}
var main = {
	globalVariables:{},
	entities:{},
};

function printMsg(msg){
	MSGROLL ++;
	
	fill(0);
	noStroke();
	textAlign(LEFT);
	text("Message: " + msg,windowWidth/20,windowHeight/2 + MSGROLL * 10);
}
function nonFatalError(msg){
	fill(0);
	noStroke();
	textAlign(CENTER);
	text("Warning: "+msg,windowWidth/2,windowHeight/2);
}
function setup(){
	createCanvas(windowWidth,windowHeight);
	background(0,255,0);
}
var entity1;
function draw(){
	try{
		if(!entity1){
			entity1 = new Entity({},{},"setVar|||health|||100~~~print|||~getVarStr","");
		}
	}catch(err){
		background(120);
		fill(255);
		textAlign(CENTER);
		text("FATAL ERROR:\n" + err,windowWidth/2,windowHeight/2);
	}
}
//   John W