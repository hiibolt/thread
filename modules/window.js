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