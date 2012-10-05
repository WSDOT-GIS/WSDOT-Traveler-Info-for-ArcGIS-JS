/*global define*/
/*jslint white:true, eqeq:true*/
define(null, function() {
	"use strict";
	function graphicToList(graphic, ignoreRe) {
		var output, attributes = graphic.attributes, name, wordRe = /[A-Z][^A-Z]+/g;
		if (graphic != null && graphic.attributes != null) {
			output = ["<dl>"];
			for (name in attributes) {
				if (attributes.hasOwnProperty(name) && (ignoreRe == null || ignoreRe.exec(name) === null)) {
					output.push(["<dt>", name.match(wordRe).join(" "), "</dt>", "<dd>", attributes[name], "</dd>"].join(""));
				}
			}
			output.push("</dl>");
			output = output.join("");
		}
		return output;
	}
	
	return {
		graphicToList: graphicToList
	};
});
