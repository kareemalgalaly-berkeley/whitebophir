/**
 *						  WHITEBOPHIR
 *********************************************************
 * @licstart  The following is the entire license notice for the 
 *	JavaScript code in this page.
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

(function hand() { //Code isolation
	var selected = null;
	var last_sent = 0;
    var ALLOW_SEARCH = true; // search for selected element when none is selected.
    var PATH_STEP_SIZE = 50;

    // Helper functions
    function pointInBBox(x, y, bbox) {
        return ((x > bbox.x) && (y > bbox.y) && (y > bbox.y + bbox.height) && (x > bbox.x + bbox.width));
    }
    function distanceFromCursor(evt, element) {
        // Coordinates relative to window
        var bbox = element.getBoundingClientRect(); 
        x = evt.clientX; 
        y = evt.clientY;

        if (!pointInBBox(x, y, bbox)) return Number.MAX_VALUE;

        if (element.tagName == 'text' || element.className.baseVal == 'MathElement') return 0;

        var d, dist=Number.MAX_VALUE;
        for (d=0; d < element.getTotalLength(); d+=PATH_STEP_SIZE) {
            var pt = element.getPointAtLength(d);
            dist = Math.min(dist, Math.abs(pt.x - x) + Math.abs(pt.y - y));
        }
        return dist;
    }

    // Main Code

	function startMovingElement(x, y, evt) {
		//Prevent the press from being interpreted by the browser
		evt.preventDefault();
        var target = null;
        if (!evt.target || !Tools.drawingArea.contains(evt.target)) { 
            if (!ALLOW_SEARCH || (evt.target != canvas)) return; 

            var draw_area = document.getElementById("drawingArea")
            var i, min_dist = Number.MAX_VALUE;
            var min_child = null;

            for (i=0; i < draw_area.childElementCount; i++) {
                var child = draw_area.children[i];
                var dist  = distanceFromCursor(evt, child);
                if (dist < min_dist) {
                    min_child = child;
                    min_dist  = dist;
                }
            }
            if (!min_child) return; 
            target = min_child;
        } else {
            // directly selected target. 
            target = evt.target;
            // Check for parent that is MathElement
		    var a = target;
		    var els = [];
		    while (a) {
		    	els.unshift(a);
		    	a = a.parentElement;
		    }
		    var parentMathematics = els.find(el => el.getAttribute("class") === "MathElement");
		    if ((parentMathematics) && parentMathematics.tagName === "g") {
		    	target = parentMathematics;
		    }
        }
		// search for a parent that is a MathElement. If one is found then act on that instead.
		var tmatrix = get_translate_matrix(target);
		selected = { x: x - tmatrix.e, y: y - tmatrix.f, elem: target };
	}

	function moveElement(x, y) {
		if (!selected) return;
		var deltax = x - selected.x;
		var deltay = y - selected.y;
		var msg = { type: "update", id: selected.elem.id, deltax: deltax, deltay: deltay };;
		var now = performance.now();
		if (now - last_sent > 70) {
			last_sent = now;
			Tools.drawAndSend(msg); // doesn't seem to work for math
		} else {
			draw(msg);
		}
	}

	function get_translate_matrix(elem) {
		// Returns the first translate or transform matrix or makes one
		var translate = null;
		for (var i = 0; i < elem.transform.baseVal.numberOfItems; ++i) {
			var baseVal = elem.transform.baseVal[i];
			// quick tests showed that even if one changes only the fields e and f or uses createSVGTransformFromMatrix
			// the brower may add a SVG_TRANSFORM_MATRIX instead of a SVG_TRANSFORM_TRANSLATE
			if (baseVal.type === SVGTransform.SVG_TRANSFORM_TRANSLATE || baseVal.type === SVGTransform.SVG_TRANSFORM_MATRIX) {
				translate = baseVal;
				break;
			}
		}
		if (translate == null) {
			translate = elem.transform.baseVal.createSVGTransformFromMatrix(Tools.svg.createSVGMatrix());
			elem.transform.baseVal.appendItem(translate);
		}
		return translate.matrix;
	}

	function draw(data) {
		switch (data.type) {
			case "update":
				var elem = Tools.svg.getElementById(data.id);
				if (!elem) throw new Error("Mover: Tried to move an element that does not exist.");
                var tmatrix = get_translate_matrix(elem);
                tmatrix.e = data.deltax || 0;
                tmatrix.f = data.deltay || 0;
				break;

			default:
				console.error("Mover: 'move' instruction with unknown type. ", data);
		}
	}

	function startHand(x, y, evt, isTouchEvent) {
		if (!isTouchEvent) {
			selected = {
				x: document.documentElement.scrollLeft + evt.clientX,
				y: document.documentElement.scrollTop + evt.clientY,
			}
		}
	}
	function moveHand(x, y, evt, isTouchEvent) {
		if (selected && !isTouchEvent) { //Let the browser handle touch to scroll
			window.scrollTo(selected.x - evt.clientX, selected.y - evt.clientY);
		}
	}

	function press(x, y, evt, isTouchEvent) {
		if (!handTool.secondary.active) startHand(x, y, evt, isTouchEvent);
		else startMovingElement(x, y, evt, isTouchEvent);
	}


	function move(x, y, evt, isTouchEvent) {
		if (!handTool.secondary.active) moveHand(x, y, evt, isTouchEvent);
		else moveElement(x, y, evt, isTouchEvent);
	}

	function release(x, y, evt, isTouchEvent) {
		move(x, y, evt, isTouchEvent);
		selected = null;
	}

	function switchTool() {
		selected = null;
	}

	var handTool = { //The new tool
		"name": "Hand",
		"shortcut": "h",
		"listeners": {
			"press": press,
			"move": move,
			"release": release,
		},
		"secondary": {
			"name": "Mover",
			"icon": "tools/hand/move.svg",
			"active": false,
			"switch": switchTool,
		},
		"draw": draw,
		"icon": "tools/hand/pan.svg",
		"mouseCursor": "move",
		"showMarker": true,
	};
	Tools.add(handTool);
	Tools.change("Hand"); // Use the hand tool by default
})(); //End of code isolation
