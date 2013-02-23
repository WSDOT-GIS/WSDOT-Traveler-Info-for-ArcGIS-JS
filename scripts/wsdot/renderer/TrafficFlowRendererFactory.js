/*global define, esri */
/*jslint white:true*/
define(["dojo/_base/Color", "esri/renderer", "esri/symbol"], function (Color) {
	"use strict";

	/**
	 * Creates a collection of information used for creating the renderer for the Traffic Flow layer. 
	 * @return {object[]}
	 */
	function createRendererInfos() {
		var output, colors, values, symbol, name;

		colors = {
			unknown: new Color("white"),
			wideOpen: new Color("green"),
			moderate: new Color("yellow"),
			heavy: new Color("red"),
			stopAndGo: new Color("black"),
			noData: new Color("gray")
		};

		values = {
			unknown: 0,
			wideOpen: 1,
			moderate: 2,
			heavy: 3,
			stopAndGo: 4,
			noData: 5
		};

		output = {};

		for (name in colors) {
			if (colors.hasOwnProperty(name)) {
				symbol = new esri.symbol.SimpleMarkerSymbol();
				symbol.setColor(colors[name]);
				output[name] = {
					symbol: symbol,
					value: values[name]
				};
			}
		}

		return output;
	}
	
	return {
		createRenderer: function () {
			var infos, renderer, infoTemplate;

			// Create the renderer infos. 
			infos = createRendererInfos();
			// Create the renderer and assign a default symbol.
			renderer = new esri.renderer.UniqueValueRenderer(infos.unknown.symbol, "FlowReadingValue");

			// Loop through the "infos" and add renderer values for each..
			(function () {
				var name;
				for (name in infos) {
					if (infos.hasOwnProperty(name)) {
						renderer.addValue(infos[name]);
					}
				}
			}());

			return renderer;
		}
	};
});
