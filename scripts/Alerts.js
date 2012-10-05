/*global dojo, dijit, esri, wsdot, require*/
/*jslint white:true, browser:true */
require(["apikey", "wsdot/utils", "dojo/on", "esri/dijit/Attribution", "dojo/_base/Color", "esri/map", "wsdot/layers/TravelerInfoGraphicsLayer"], function(apikey, utils, on, Attribution, Color) {
	"use strict";
	var map, gfxLayer;


	/**
	 * Creates a collection of information used for creating the renderer for the Traffic Flow layer. 
	 * @return {object[]}
	 */
	function createRendererInfos() {
		var output, colors, values, symbol, name;

		colors = {
			unknown: new Color("purple"),
			Lowest: new Color("white"),
			Low: new Color("#ffffcc"),
			Medium: new Color("yellow"),
			High: new Color("#f7921e"),
			Highest: new Color("red")
		};

		output = {};

		for (name in colors) {
			if (colors.hasOwnProperty(name)) {
				symbol = new esri.symbol.SimpleMarkerSymbol();
				symbol.setColor(colors[name]).setStyle(esri.symbol.SimpleMarkerSymbol.STYLE_DIAMOND);
				output[name] = {
					symbol: symbol,
					value: name
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
		renderer = new esri.renderer.UniqueValueRenderer(infos.unknown.symbol, "Priority");
		
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
		infoTemplate = new esri.InfoTemplate("${EventCategory}", function (graphic) {
			return utils.graphicToList(graphic, /(?:(?:Longitude)|(?:latitude)|(?:AlertID))/i);
		}); //"${*}");
		// Create the traffic flow graphics layer.
		gfxLayer = new wsdot.layers.TravelerInfoGraphicsLayer({
			id: "alerts",
			url: "http://www.wsdot.wa.gov/Traffic/api/HighwayAlerts/HighwayAlertsREST.svc/GetAlertsAsJson?AccessCode=" + apikey,
			renderer: renderer,
			toWebMercator: true,
			useJsonp: true,
			infoTemplate: infoTemplate
		});
		// Setup an event handler that will send an error message to the console if anything goes wrong during refresh.
		dojo.connect(gfxLayer, "onRefreshEnd", function(error) {
			if (error) {
				if (typeof(window.console) !== "undefined") {
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