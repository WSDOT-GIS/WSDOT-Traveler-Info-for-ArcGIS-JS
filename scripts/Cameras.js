/*global dojo, dijit, esri, dojox, require*/
/*jslint browser:true*/
require(["require", "dojo/on", "esri/dijit/Attribution", "esri/map", "wsdot/layers/CameraGraphicsLayer"], function(
	require, on, Attribution, Map, CameraGraphicsLayer) {
	"use strict";
	
	var map, initExtent, basemap, symbol, renderer, cameraLayer, refreshIntervalId;

	esri.config.defaults.io.proxyUrl = "Proxy.ashx";

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
 
	//Add the world topo. map layer to the map. View the ArcGIS Online site for services http://arcgisonline/home/search.html?t=content&f=typekeywords:service	
	basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer");
	map.addLayer(basemap);  


	dojo.connect(map, 'onLoad', function() {
		//resize the map when the browser resizes
		on(window, "resize", function() {
			map.resize();
		});
		map.resize();
	});
	
	// Create the symbol for the camera graphics.
	symbol = new esri.symbol.PictureMarkerSymbol("images/camera.png", 24, 12);

	// Create the renderer for the layer using the symbol and info template.
	renderer = new esri.renderer.SimpleRenderer(symbol);

	// Create the camera graphics layer.
	cameraLayer = new CameraGraphicsLayer({
		id: "cameras",
		renderer: renderer,
		toWebMercator: true
	});
	// Connect an event handler to send an error to the console if there is a problem refreshing the layer.
	dojo.connect(cameraLayer, "onRefereshEnd", function(error) {
		if (error) {
			if (window.console) {
				window.console.error("An error occurred refreshing the camera graphics.", error);
			}
		}
	});
	
	cameraLayer.setupLightboxOnClickEvent();

	// Add the camera layer to the map.
	map.addLayer(cameraLayer);
	
	/**
	 * Refreshes the layers. 
	 */
	function refresh() {
		// Refresh the layers
		cameraLayer.refresh();
	}
	
	// Set the layers to refresh every minute.
	refreshIntervalId = setInterval(refresh, 60000);

});
