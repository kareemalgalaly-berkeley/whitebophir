/**
 *                        WHITEBOPHIR
 *********************************************************
 * @licstart  The following is the entire license notice for the 
 *  JavaScript code in this page.
 *
 * Copyright (C) 2013  Ophir LOJKINE
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend
 */

(function () { //Code isolation
	var board = Tools.board;

    var autofillButtons = [
        ["Integral", "\\int_{a}^{b}"], 
        ["Sum"     , "\\sum_{a}^{b}"],
        ["Matrix"  , "\\begin{bmatrix}a&b\\\\c&d\\end{bmatrix}"], 
        ["Vector"  , "\\vec{x}"],
        ["Fraction", "\\frac{a}{b}"],
    ];
    var inputContainer = createInputBlock();
    var input = inputContainer.children[0];
    console.log(input);

	var curText = {
		"x": 0,
		"y": 0,
		"size": 36,
		"rawSize": 16,
		"oldSize": 0,
		"opacity": 1,
		"color": "#000",
		"id": 0,
		"sentText": "",
		"lastSending": 0
	};

	var active = false;

    function createInputBlock() {
        var container = document.createElement("div");
        container.setAttribute("id", "MathInputContainer");

        var input = document.createElement("textarea");
        input.id = "MathInput";
	    input.setAttribute("autocomplete", "false");
        container.appendChild(input);

        var buttons = document.createElement("div");
        buttons.setAttribute("class", "MathButtonContainer");
        container.appendChild(buttons);

        autofillButtons.forEach(function(data, index){
            var btn = document.createElement("div");
            btn.setAttribute("class", "MathButton");
            btn.setAttribute("id", "MathButton" + data[0]);
            btn.innerHTML = "$$" + data[1] + "$$";
            buttons.appendChild(btn);
        });

        board.append(container);

        return container;
    }

    function onBtnClick(evt) {
        console.log(evt);
        var i, str = input.value;
        for (i=0; i<autofillButtons.length; i++) {
            if (evt.target.id.endsWith(autofillButtons[i][0])) {
                //input.value += autofillButtons[i][1];
                input.value = str.slice(0,input.selectionStart) 
                              + autofillButtons[i][1] 
                              + str.slice(input.selectionEnd, str.length);
                break;
            }
        }
        textChangeHandler(evt);
    }

	function onStart() {
		curText.oldSize = Tools.getSize();
		Tools.setSize(curText.rawSize);
	}

	function onQuit() {
		stopEdit();
		Tools.setSize(curText.oldSize);
	}

	function clickHandler(x, y, evt, isTouchEvent) {
		//if(document.querySelector("#menu").offsetWidth>Tools.menu_width+3) return;
		// Assemble a list of parents of the evt.target and search it to see if any has class "MathElement"
        if (evt.target === input) return;
        if (evt.target.className === "MathButton") return onBtnClick(evt);
        console.log("starting with", evt.target);
        if (evt.target != board && evt.target != board.children[0]) {
            var target = evt.target;
            while ((target.tagName.toLowerCase() != "div") && target.parentElement) {
                target = target.parentElement;
                console.log(target.tagName, target);
            } 
            if (target && target.tagName.toLowerCase() === "div" && target.className === "MathButton") 
                return onBtnClick({target: target, which:evt.which});
        } 

		var a = evt.target;
		var els = [];
		while (a) {
			els.unshift(a);
			a = a.parentElement;
		}
		var parentMathematics = els.find(el => el.getAttribute("class") === "MathElement");
		if ((parentMathematics) && parentMathematics.tagName === "g") {
			editOldMathematics(parentMathematics);
			evt.preventDefault();
			return;
		}
		curText.rawSize = Tools.getSize();
		curText.size = parseInt(curText.rawSize * 1.5 + 12);
		curText.opacity = Tools.getOpacity();
		curText.color = Tools.getColor();
		curText.x = x;
		curText.y = y + curText.size / 2;

		stopEdit();
		startEdit(parentMathematics);
		evt.preventDefault();
	}

	function editOldMathematics(group) {
		curText.id = group.id;
		var r = group.getBoundingClientRect();
		var x = (r.left + document.documentElement.scrollLeft) / Tools.scale;
		var y = (r.top + r.height + document.documentElement.scrollTop) / Tools.scale;

        elem = group.children[0];
		curText.x = x;
		curText.y = y;
		curText.sentText = elem.getAttribute("aria-label");
		curText.size = parseInt(elem.getAttribute("font-size"));
		curText.opacity = parseFloat(elem.getAttribute("opacity"));
		curText.color = elem.getAttribute("fill");
		startEdit(group);
		input.value = elem.getAttribute("aria-label");
	}

	function startEdit(mathematicsGroup) {
		active = true;
        //if (!inputContainer.parentNode) board.appendChild(inputContainer);
		input.value = "";
		var clientW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		var clientH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
		var x = curText.x * Tools.scale - document.documentElement.scrollLeft;
		var y = curText.y * Tools.scale - document.documentElement.scrollTop;

        // Horizontal Placement Style
		//if (x < 360) {
		//	x = Math.max(60, clientW - 320);
		//} else {
		//	x = 60;
		//}
        //x = curText.x;
        //y = curText.y + 50;

        // Vertical Placement Style
        if (y > clientH/2) {
            console.log("above", inputContainer.style, inputContainer.offsetHeight);
            y = y - inputContainer.offsetHeight - 100; 
        } else {
            console.log("below");
            y = y + 100;
        }

		input.style.opacity = '0.5';
        //inputContainer.style.left = x + 'px';
        console.log(y, clientH);
		inputContainer.style.top  = y + 'px';
		input.focus();
		input.addEventListener("keyup", textChangeHandler);
		input.addEventListener("blur", textChangeHandler);
		input.addEventListener("blur", blur);
	}

	function stopEdit() {
		try { input.blur(); } catch (e) { /* Internet Explorer */ }
		active = false;
		blur();
		curText.id = 0;
		curText.sentText = "";
		input.value = "";
		input.removeEventListener("keyup", textChangeHandler);
	}

	function blur() {
		if (active) return;
		inputContainer.style.top = '-1000px';
	}

	function textChangeHandler(evt) {
		input.value = removeDoubleQuotes(input.value); // remove all double quotes; they are unnecessary in (La)TeX and difficult to escape
        if (evt.which === 27) { // escape
			stopEdit();
		}
		if (performance.now() - curText.lastSending > 1000) {
			if (curText.sentText !== input.value) {
				//If the user clicked where there was no text, then create a new text field
				if (curText.id === 0) {
					curText.id = Tools.generateUID("m"); //"m" for math
					Tools.drawAndSend({
						'type': 'new',
						'id': curText.id,
						'color': curText.color,
						'size': curText.size,
						'opacity': curText.opacity,
						'x': curText.x,
						'y': curText.y
					})
				}
                let mathematicsSVG = getSVGFromMathJax(input.value);
				Tools.drawAndSend({
					'type': "update",
					'id': curText.id,
					'txt': input.value,
                    'mWidth': mathematicsSVG.getAttribute('width'),
                    'mHeight': mathematicsSVG.getAttribute('height'),
                    'mViewBox': mathematicsSVG.getAttribute('viewBox'),
                    'mInnerHTML': mathematicsSVG.innerHTML,
				});
				curText.sentText = input.value;
				curText.lastSending = performance.now();
			}
		} else {
			clearTimeout(curText.timeout);
			curText.timeout = setTimeout(textChangeHandler, 500, evt);
		}
	}
	function removeDoubleQuotes(inStr) {
		return inStr.split('"').join('');
	}
    
	function getSVGFromMathJax(rawTeX) {
		let userColor = Tools.getColor();
        let svgFromMathJax = MathJax.tex2svg("\\color{" + userColor + "}\\begin{align}" + rawTeX + '\\end{align}', {display: true});
		let svgOnly = svgFromMathJax.children[0];
		// Split the viewBox into separate strings
		var strArrViewBox = svgOnly.getAttribute("viewBox").split(" ");
		var clickableRect = Tools.createSVGElement("rect");
		clickableRect.setAttribute("class", "ClickHelper");
		clickableRect.setAttribute("x", strArrViewBox[0]);
		clickableRect.setAttribute("y", strArrViewBox[1]);
		clickableRect.setAttribute("width", strArrViewBox[2]);
		clickableRect.setAttribute("height", strArrViewBox[3]);
		clickableRect.setAttribute("opacity", 0);
		clickableRect.setAttribute("stroke-opacity", 0);
		clickableRect.setAttribute("stroke", userColor);
		svgOnly.appendChild(clickableRect);
		return svgOnly;
	}

	function draw(data, isLocal) {
		Tools.drawingEvent = true;
		switch (data.type) {
			case "new":
				createMathematicsField(data);
				break;
			case "update":
				var mathematicsField = document.getElementById(data.id);
				if (mathematicsField === null) {
					console.error("Mathematics: Hmmm... I received text that belongs to an unknown text field");
					return false;
				}
				updateMathematics(mathematicsField, data.txt, data.mWidth, data.mHeight, data.mViewBox, data.mInnerHTML);
				break;
			//case "translate":
            //    console.log("translating");
			//	var mathematicsField = document.getElementById(data.id);
			//	if (mathematicsField === null) {
			//		console.error("Mathematics: Hmmm... I received text that belongs to an unknown text field");
			//		return false;
			//	}
            //    var x = Number(mathematicsField.getAttribute('x'));
            //    var y = Number(mathematicsField.getAttribute('y'));
            //    console.log("x,y", x, y, x+data.deltax/3, y+data.deltay/3);
            //    mathematicsField.setAttribute('x', x + data.deltax);
            //    mathematicsField.setAttribute('y', y + data.deltay);
			//	break;
			default:
				console.error("Mathematics: Draw instruction with unknown type. ", data);
				break;
		}
	}

	function updateMathematics(mathematicsGroup, rawTeX, mWidth, mHeight, mViewBox, mInnerHTML) {
		mathematicsGroup.setAttribute('width', mWidth);
		mathematicsGroup.setAttribute('height', mHeight);
        mathematicsField = mathematicsGroup.children[0];
		mathematicsField.setAttribute('aria-label', rawTeX);
		mathematicsField.setAttribute('width', mWidth);
		mathematicsField.setAttribute('height', mHeight);
		mathematicsField.setAttribute('viewBox', mViewBox);
		mathematicsField.innerHTML = mInnerHTML;
	}

	function createMathematicsField(fieldData) {
        // svg as top doesn't support transformations in chrome
        // haven't tested in other browsers, so I am simply putting all of this inside a group
        var elem = Tools.createSVGElement("svg"); 
        var group = Tools.createSVGElement("g");  
		group.setAttribute("class", "MathElement");
		group.id = fieldData.id;
		elem.id = fieldData.id + "elem";
		elem.setAttribute("class", "MathElement");
		elem.setAttribute("x", fieldData.x);
		elem.setAttribute("y", fieldData.y);
        group.appendChild(elem);
		if (fieldData.txt) elem.setAttribute("aria-label", fieldData.txt);
		if ((fieldData.mWidth && fieldData.mHeight) && (fieldData.mViewBox && fieldData.mInnerHTML)) {
			updateMathematics(group, fieldData.txt, fieldData.mWidth, fieldData.mHeight, fieldData.mViewBox, fieldData.mInnerHTML);
		}
		Tools.drawingArea.appendChild(group);
		return elem;
	}

	Tools.add({ //The new tool
		"name": "Mathematics",
		"shortcut": "m",
		"listeners": {
			"press": clickHandler,
		},
		"onstart": onStart,
		"onquit": onQuit,
		"draw": draw,
		"stylesheet": "tools/mathematics/mathematics.css",
		"icon": "tools/mathematics/icon.svg",
		"mouseCursor": "mathematics"
	});

})(); //End of code isolation
