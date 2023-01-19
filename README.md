# Unofficial language, compiler, and engine!
## A personal labor of love project of mine, entailing...
- Extreme optimization cases
- RegEX (A lot)
- HTML and DOM manipulation
- Language-instruction translation
- User-frontend interaction
- Game design
- Pain.
### Why?
Throughout my coding career, I've seen a lot of issues with various game engines, coding languages, and block-based 'logic' coding, all of which I aim to fix with this language. I've always enjoyed being able to see a visual representation of what I'm doing, especially in block form, since it's a lot easier than tracing down end suffixes or whitespace. On the flip side, with those coding based languages, you have so incredibly little you can do with them, it becomes painful to use, and almost every implementation that'd normally be a single line ends up being 20 blocks. Uselessly complicated. 

So I had my own idea. Why not make a high level langauge, with friendly typing and simply declaration, with the custom syntax and abilities of a hard-line coding language, sprinkle in multithreading, memory management, and polymorphic coding capabilities, and make it all represented in blocks?

It gives someone with no coding knowledge the ability to read code they would not have been able to, while still giving the developer the ability to, well, develop like an actual developer with the training wheels of blocks taken off, and the capabilities of a low-level language.

## Documentation:
For now, simply because I want to keep my code readable during development, code is written in the following notation:
>["<block name\>",<block arg 1>, <block arg 2>, <block arg ...>]

<br>

Code can be nested as follows:
>["<block name\>", ["<block name\>", ...], ...]


<br>

Whitespace is ignored:
>["<block name\>", <block arg 1>] == ["<block name\>",<block arg 1>]

<br>

New code blocks can be inferred with line breaks:
>L1: [...]
>
>L2: [...]


<br>
<br>
<br>

## Blocks:
### Variables:
- Set Internal Variable: [ "setIntVar", "<name\>", value ]
	- Sets an internal variable locked specifically to the entity. 
  - The name MUST be a string.
- Get Internal Variable: [ "getIntVar", "<name\>" ]
	- Returns an internal variable locked specifically to the entity.
  - The name MUST be a string.
  - Shorthand: i_?"<name\>" (IE: i_?"x")
### Entity Modification:
- Set Entity Position: [ "setPos", x value, y value, z value ]
- Set Entity Rotation: [ "setRot", x value, y value, z value ]
### Math:
- Concatenate Strings: [ "concat", string 1, string 2 ]
- Numerical Addition: [ "add", number 1, number 2, number... ]
	- Infinite arguments.
- Numerical Subtraction: [ "sub", number 1, number 2 ]
- Numerical Multiplication: [ "multiply", number 1, number 2, number... ]
	- Infinite arguments.
- Numerical Division: [ "div", number 1, number 2 ]
### Logic Operations
- Assert Equals: [ "equals", item 1, item 2 ]
- Assert Not Equal: [ "notequals", item 1, item 2 ]
- Assert All True: [ "and", condition 1, condition 2, condition... ]
	- Infinite condititon arguments.
- Assert Any: [ "or", condition 1, condition 2, condition... ]
	- Infinite condition arguments.
### Logic Statements
- If Statement: [ "if", condition, on condition true, on condition false]
	- All three arguments must be code blocks.
### Advanced
- Debug to console: [ "print", message 1, message 2, message 3...]
	- Infinite message arguments.

<!--![Console](info/Console.png)
