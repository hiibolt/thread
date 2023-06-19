function compile(inputCode) {
	//De-parse
	var TEMP = inputCode.split('\n').filter((a) => a).join('~');

	//Substitute shorthands
	TEMP = TEMP.replace(/\\i?"(\w+)"/g, '["getIntVar","$1"]');
	TEMP = TEMP.replace(/\\g?"(\w+)"/g, '["getGloVar","$1"]');
	TEMP = TEMP.replace(/\\i=/g, ',"\\i=",');
	TEMP = TEMP.replace(/\\g=/g, ',"\\i=",');
	TEMP = TEMP.replace(/\._&&/g, ',"._&&",');
	TEMP = TEMP.replace(/\._\+/g, ',"._+",');
	TEMP = TEMP.replace(/\._\-/g, ',"._-",');
	TEMP = TEMP.replace(/\._\|\|/g, ',"._||",');

	//Fix end brackets
	TEMP = '[' + TEMP + ']';

	//Re-parse
	TEMP = JSON.parse(TEMP.replace(/~/g, ','));
	
	//Apply shorthands
	function scan(code) {
		for (let i = 0; i < code.length; i++) {
			if (Array.isArray(code[i])) {
				scan(code[i]);
			}
			switch (code[i]) {
				case "\\i=":
					var replaceWith = ["setIntVar", code[i - 1], code[i + 1]];
					code.splice(i - 1, 3, replaceWith);
					i = 0;
					break;
				case "\\g=":
					var replaceWith = ["setGloVar", code[i - 1], code[i + 1]];
					code.splice(i - 1, 3, replaceWith);
					i = 0;
					break;
				case "._&&":
					var replaceWith = ["and", code[i - 1], code[i + 1]];
					code.splice(i - 1, 3, replaceWith);
					i = 0;
					break;
				case "._+":
					var replaceWith = ["add", code[i - 1], code[i + 1]];
					code.splice(i - 1, 3, replaceWith);
					i = 0;
					break;
				case "._-":
					var replaceWith = ["sub", code[i - 1], code[i + 1]];
					code.splice(i - 1, 3, replaceWith);
					i = 0;
					break;
				case "._||":
					var replaceWith = ["or", code[i - 1], code[i + 1]];
					code.splice(i - 1, 3, replaceWith);
					i = 0;
					break;
				default:
			}
		}
	}
	scan(TEMP);
	return TEMP;
}
