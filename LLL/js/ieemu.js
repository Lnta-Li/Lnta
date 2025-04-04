/**
 * 
 * @version        $Id: ieemu.js 1 22:28 2010年7月20日 $
 * @package        DedeCMS.Administrator
 * @founder        IT柏拉图, https://weibo.com/itprato
 * @author         DedeCMS团队
 * @copyright      Copyright (c) 2004 - 2024, 上海卓卓网络科技有限公司 (DesDev, Inc.)
 * @license        http://help.dedecms.com/usersguide/license.html
 * @link           http://www.dedecms.com
 */

var ie = document.all != null;
var moz = !ie && document.getElementById != null && document.layers == null;

/*
 * Extends the event object with srcElement, cancelBubble, returnValue,
 * fromElement and toElement
 */
function extendEventObject() {
    Event.prototype.__defineSetter__("returnValue", function (b) {
		if (!b) this.preventDefault();
	});
	
	Event.prototype.__defineSetter__("cancelBubble", function (b) {
		if (b) this.stopPropagation();
	});
	
	Event.prototype.__defineGetter__("srcElement", function () {
		var node = this.target;
		while (node.nodeType != 1) node = node.parentNode;
		return node;
	});

	Event.prototype.__defineGetter__("fromElement", function () {
		var node;
		if (this.type == "mouseover")
			node = this.relatedTarget;
		else if (this.type == "mouseout")
			node = this.target;
		if (!node) return;
		while (node.nodeType != 1) node = node.parentNode;
		return node;
	});

	Event.prototype.__defineGetter__("toElement", function () {
		var node;
		if (this.type == "mouseout")
			node = this.relatedTarget;
		else if (this.type == "mouseover")
			node = this.target;
		if (!node) return;
		while (node.nodeType != 1) node = node.parentNode;
		return node;
	});
	
	Event.prototype.__defineGetter__("offsetX", function () {
		return this.layerX;
	});
	Event.prototype.__defineGetter__("offsetY", function () {
		return this.layerY;
	});
}

/*
 * Emulates element.attachEvent as well as detachEvent
 */
function emulateAttachEvent() {
	HTMLDocument.prototype.attachEvent = 
	HTMLElement.prototype.attachEvent = function (sType, fHandler) {
		var shortTypeName = sType.replace(/on/, "");
		fHandler._ieEmuEventHandler = function (e) {
			window.event = e;
			return fHandler();
		};
		this.addEventListener(shortTypeName, fHandler._ieEmuEventHandler, false);
	};

	HTMLDocument.prototype.detachEvent = 
	HTMLElement.prototype.detachEvent = function (sType, fHandler) {
		var shortTypeName = sType.replace(/on/, "");
		if (typeof fHandler._ieEmuEventHandler == "function")
			this.removeEventListener(shortTypeName, fHandler._ieEmuEventHandler, false);
		else
			this.removeEventListener(shortTypeName, fHandler, true);
	};
}

/*
 * This function binds the event object passed along in an
 * event to window.event
 */
function emulateEventHandlers(eventNames) {
	for (var i = 0; i < eventNames.length; i++) {	
		document.addEventListener(eventNames[i], function (e) {
			window.event = e;
		}, true);	// using capture
	}
}

/*
 * Simple emulation of document.all
 * this one is far from complete. Be cautious
 */
 
function emulateAllModel() {
	var allGetter = function () {
		var a = this.getElementsByTagName("*");
		var node = this;
		a.tags = function (sTagName) {
			return node.getElementsByTagName(sTagName);
		};
		return a;
	};
	HTMLDocument.prototype.__defineGetter__("all", allGetter);
	HTMLElement.prototype.__defineGetter__("all", allGetter);
}

function extendElementModel() {
	HTMLElement.prototype.__defineGetter__("parentElement", function () {
		if (this.parentNode == this.ownerDocument) return null;
		return this.parentNode;
	});
	
	HTMLElement.prototype.__defineGetter__("children", function () {
		var tmp = [];
		var j = 0;
		var n;
		for (var i = 0; i < this.childNodes.length; i++) {
			n = this.childNodes[i];
			if (n.nodeType == 1) {
				tmp[j++] = n;
				if (n.name) {	// named children
					if (!tmp[n.name])
						tmp[n.name] = [];
					tmp[n.name][tmp[n.name].length] = n;
				}
				if (n.id)		// child with id
					tmp[n.id] = n
			}
		}
		return tmp;
	});
	
	HTMLElement.prototype.contains = function (oEl) {
		if (oEl == this) return true;
		if (oEl == null) return false;
		return this.contains(oEl.parentNode);		
	};
}

/*

document.defaultView.getComputedStyle(el1,<BR>null).getPropertyValue('top');

*/
function emulateCurrentStyle(properties) {
	HTMLElement.prototype.__defineGetter__("currentStyle", function () {
		var cs = {};
		var el = this;
		for (var i = 0; i < properties.length; i++) {
			//cs.__defineGetter__(properties[i], function () {
			//	window.status = "i: " + i	;
			//	return document.defaultView.getComputedStyle(el, null).getPropertyValue(properties[i]);
			//});
			cs.__defineGetter__(properties[i], encapsulateObjects(el, properties[i]));
		}
		return cs;
	});
}
// used internally for emualteCurrentStyle
function encapsulateObjects(el, sProperty) {
	return function () {
		return document.defaultView.getComputedStyle(el, null).getPropertyValue(sProperty);
	};
}

function emulateHTMLModel() {

	// This function is used to generate a html string for the text properties/methods
	// It replaces '\n' with "<BR"> as well as fixes consecutive white spaces
	// It also repalaces some special characters	
	function convertTextToHTML(s) {
		s = s.replace(/\&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<BR>");
		while (/\s\s/.test(s))
			s = s.replace(/\s\s/, "&nbsp; ");
		return s.replace(/\s/g, " ");
	}

	HTMLElement.prototype.insertAdjacentHTML = function (sWhere, sHTML) {
		var df;	// : DocumentFragment
		var r = this.ownerDocument.createRange();
		
		switch (String(sWhere).toLowerCase()) {
			case "beforebegin":
				r.setStartBefore(this);
				df = r.createContextualFragment(sHTML);
				this.parentNode.insertBefore(df, this);
				break;
				
			case "afterbegin":
				r.selectNodeContents(this);
				r.collapse(true);
				df = r.createContextualFragment(sHTML);
				this.insertBefore(df, this.firstChild);
				break;
				
			case "beforeend":
				r.selectNodeContents(this);
				r.collapse(false);
				df = r.createContextualFragment(sHTML);
				this.appendChild(df);
				break;
				
			case "afterend":
				r.setStartAfter(this);
				df = r.createContextualFragment(sHTML);
				this.parentNode.insertBefore(df, this.nextSibling);
				break;
		}	
	};

	HTMLElement.prototype.__defineSetter__("outerHTML", function (sHTML) {
	   var r = this.ownerDocument.createRange();
	   r.setStartBefore(this);
	   var df = r.createContextualFragment(sHTML);
	   this.parentNode.replaceChild(df, this);
	   
	   return sHTML;
	});

	HTMLElement.prototype.__defineGetter__("canHaveChildren", function () {
		switch (this.tagName) {
			case "AREA":
			case "BASE":
			case "BASEFONT":
			case "COL":
			case "FRAME":
			case "HR":
			case "IMG":
			case "BR":
			case "INPUT":
			case "ISINDEX":
			case "LINK":
			case "META":
			case "PARAM":
				return false;
		}
		return true;
	});

	HTMLElement.prototype.__defineGetter__("outerHTML", function () {
		var attr, attrs = this.attributes;
		var str = "<" + this.tagName;
		for (var i = 0; i < attrs.length; i++) {
			attr = attrs[i];
			if (attr.specified)
				str += " " + attr.name + '="' + attr.value + '"';
		}
		if (!this.canHaveChildren)
			return str + ">";
		
		return str + ">" + this.innerHTML + "</" + this.tagName + ">";
	});


	HTMLElement.prototype.__defineSetter__("innerText", function (sText) {
		this.innerHTML = convertTextToHTML(sText);
		return sText;		
	});

	var tmpGet;
	HTMLElement.prototype.__defineGetter__("innerText", tmpGet = function () {
		var r = this.ownerDocument.createRange();
		r.selectNodeContents(this);
		return r.toString();
	});

	HTMLElement.prototype.__defineSetter__("outerText", function (sText) {
		this.outerHTML = convertTextToHTML(sText);
		return sText;
	});
	HTMLElement.prototype.__defineGetter__("outerText", tmpGet);

	HTMLElement.prototype.insertAdjacentText = function (sWhere, sText) {
		this.insertAdjacentHTML(sWhere, convertTextToHTML(sText));
	};

}