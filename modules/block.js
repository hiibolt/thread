function Block(code, x, y, g) {
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
			
		case "setGloVar":
			name = "Set Global Variable";
			args = ["Variable Name", "Value"];
			colorF = color('Beige');
			break;
		case "getGloVar":
			name = "Get Global Variable";
			args = ["Variable Name"];
			colorF = color('Beige');
			break;

		case "getKey":
			name = "Is Key Pressed"
			args = ["Javascript Keycode"]
			colorF = color('HotPink');
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
		case "trig":
			name = "Trigonomic Function";
			args = ["Function","Number"];
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
			
		case "print":
			name = "Print Message";
			args = ["Message"];
			colorF = color('DeepSkyBlue');
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
	g.fill(colorF);
	g.stroke(lerpColor(colorF, color(0), 0.4));
	g.strokeWeight(3);
	g.rect(x, y, blockText, 17)

	g.textAlign(LEFT);
	g.textSize(12);
	g.fill(0, 0, 0);
	g.noStroke();
	g.text(name, x + 5, y + 13.5);

	let totalHeight = 0;
	for (let i = 0; i < args.length; i++) {
		//If it's another code block, recursive that b!tch, otherwise, show the arg with the proper background fill
		if (Array.isArray(code[i + 1])) {
			g.noStroke();
			g.fill(255,255,255);
			g.text(args[i] + ": ", x + 4, y + totalHeight + 30);
			g.fill(0, 0, 0);
			g.text(args[i] + ": ", x + 5, y + totalHeight + 30);
			totalHeight += Block(code[i + 1], x + textWidth(args[i] + ": ") + 5, y + totalHeight + 20, g) + 15;
		} else {
			g.fill(colorF);
			g.noStroke();
			g.rect(x, y + totalHeight + 15, blockText, 50);
			g.fill(0, 0, 0);
			g.text(args[i] + ": " + code[i + 1], x + 5, y + totalHeight + 30);
			totalHeight += 30;
		}
	}
	//The block's edge lines, helps a little bit with readability
	if (args.length > 0) {
		g.stroke(lerpColor(colorF, color(0), 0.4));
		g.line(x, y, x, y + totalHeight + 30);
		//line(x + blockText,y,x + blockText,y + totalHeight + 30);
	}
	return totalHeight + 20;

}