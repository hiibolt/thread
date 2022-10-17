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