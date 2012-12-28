/*global dojo, dijit, esri, wsdot, require*/
/*jslint white:true, browser:true */
require(["dojo/on", "esri/dijit/Attribution", "dojo/_base/Color", "esri/map", "wsdot/layers/TravelerInfoGraphicsLayer"], function(on, Attribution, Color) {
	"use strict";
	var map, gfxLayer;


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

	/**
	 * Set up the application 
	 */
	(function() {
		var initExtent, basemap, infoTemplate, renderer, infos;
		// Set up the map's initial extent and create the map.
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

		// Setup the event handler for resizing the map.
		dojo.connect(map, 'onLoad', function(theMap) {
			//resize the map when the browser resizes
			on(window, "resize", function() {
				map.resize();
			});
			map.resize();
		});

		// Create the renderer infos. 
		infos = createRendererInfos();
		// Create the renderer and assign a default symbol.
		renderer = new esri.renderer.UniqueValueRenderer(infos.unknown.symbol, "FlowReadingValue");
		
		// Loop through the "infos" and add renderer values for each..
		(function(){
			var name;
			for (name in infos) {
				if (infos.hasOwnProperty(name)) {
					renderer.addValue(infos[name]);
				}
			}
		}());
		
		// Create the info template for the popups. (This could be customized to look better.)
		infoTemplate = new esri.InfoTemplate("${Description}", "${*}");
		// Create the traffic flow graphics layer.
		gfxLayer = new wsdot.layers.TravelerInfoGraphicsLayer({
			id: "trafficFlow",
			url: "proxy.ashx?http://www.wsdot.wa.gov/traffic/api/TrafficFlow/TrafficFlowREST.svc/GetTrafficFlowsAsJson",
			renderer: renderer,
			toWebMercator: true,
			useJsonp: true,
			infoTemplate: infoTemplate
		});
		// Setup an event handler that will send an error message to the console if anything goes wrong during refresh.
		dojo.connect(gfxLayer, "onRefreshEnd", function(error) {
			if (error) {
				if (window.console) {
					window.console.error("An error occurred refreshing the camera graphics.", error);
				} else {
					window.alert(error);
				}
			}
		});
		// Add the layer to the map.
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
	}());
});