/*global dojo, dijit, esri, wsdot, apikey*/
/*jslint white:true, browser:true */
(function () {
	"use strict";
	dojo.require("dijit.layout.BorderContainer");
	dojo.require("dijit.layout.ContentPane");
	dojo.require("esri.map");

	var map;

	function createRendererInfos() {
		var output, colors, values, symbol, name;

		colors = {
			unknown: new dojo.Color("white"),
			wideOpen: new dojo.Color("green"),
			moderate: new dojo.Color("yellow"),
			heavy: new dojo.Color("red"),
			stopAndGo: new dojo.Color("black"),
			noData: new dojo.Color("gray")
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

	function init() {
		var initExtent, basemap, infoTemplate, renderer, refreshInterval, infos, gfxLayer;
		initExtent = new esri.geometry.Extent({
			xmax: -12915620.315713434,
			xmin: -14001637.613589166,
			ymax: 6284361.994355721,
			ymin: 5733403.894476198,
			spatialReference:{
				"wkid":102100
			}
		});
		map = new esri.Map("map",{extent:initExtent});

		//Add the world street map layer to the map. View the ArcGIS Online site for services http://arcgisonline/home/search.html?t=content&f=typekeywords:service	
		basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer");
		map.addLayer(basemap);  

		dojo.connect(map, 'onLoad', function(theMap) {
			//resize the map when the browser resizes
			dojo.connect(dijit.byId('map'), 'resize', map,map.resize);
		});

		infos = createRendererInfos();
		renderer = new esri.renderer.UniqueValueRenderer(infos.unknown.symbol, "FlowReadingValue");
		// Add the renderer values.
		(function(){
			var name;
			for (name in infos) {
				if (infos.hasOwnProperty(name)) {
					renderer.addValue(infos[name]);
				}
			}
		}());
		infoTemplate = new esri.InfoTemplate("${Description}", "${*}");
		gfxLayer = new wsdot.layers.TravelerInfoGraphicsLayer({
			id: "trafficFlow",
			url: "http://webpub3qa.wsdot.wa.gov/traffic/api/TrafficFlow/TrafficFlowREST.svc/GetTrafficFlowsAsJson?AccessCode=" + apikey,
			renderer: renderer,
			toWebMercator: true,
			useJsonp: true,
			infoTemplate: infoTemplate
		});
		dojo.connect(gfxLayer, "onRefereshEnd", function(error) {
			if (error) {
				console.error("An error occurred refreshing the camera graphics.", error);
			}
		});
		map.addLayer(gfxLayer);

		/**
		 * Refreshes the layers. 
		 */
		function refresh() {
			// Refresh the layers
			gfxLayer.refresh();
		}

		// Set the layers to refresh every minute.
		refresh = setInterval(refresh, 60000);
	}
	dojo.addOnLoad(init);
}());