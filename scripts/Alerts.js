/*global dojo, dijit, esri, wsdot, require*/
/*jslint white:true, browser:true */
require([
	"wsdot/renderer/AlertRendererFactory", 
	"dojo/on", 
	"esri/dijit/Attribution", 
	"esri/map", 
	"wsdot/layers/TravelerInfoGraphicsLayer"
	], function(AlertRendererFactory, on, Attribution) {
	"use strict";
	var map, gfxLayer;

	// Setup the proxy URL.
	esri.config.defaults.io.proxyUrl = "Proxy.ashx";

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

		renderer = AlertRendererFactory.createRenderer("images/alert");
		
		// Create the info template for the popups. (This could be customized to look better.)
		infoTemplate = new esri.InfoTemplate("${EventCategory}", function (graphic) {
			var output;
			if (graphic.attributes.ExtendedDescription) {
				output = graphic.attributes.ExtendedDescription;
			} else {
				output = graphic.attributes.HeadlineDescription;
			}
			return output;
		}); //"${*}");
		// Create the traffic flow graphics layer.
		gfxLayer = new wsdot.layers.TravelerInfoGraphicsLayer({
			id: "alerts",
			url: "http://www.wsdot.wa.gov/Traffic/api/HighwayAlerts/HighwayAlertsREST.svc/GetAlertsAsJson",
			renderer: renderer,
			toWebMercator: true,
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