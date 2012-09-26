/*global dojo, dijit, esri*/
require(["dojo/on", "esri/dijit/Attribution", "esri/map", "wsdot/layers/CameraGraphicsLayer", "dojo/domReady!"], function(
	on, Attribution, Map, CameraGraphicsLayer) {
	"use strict";
	
	var map;
 

	
	// function createTable(graphic) {
		// var attributes = graphic.attributes, camera, i, l, table, row, cell, name, names = [], j, jl;
		// table = dojo.create("table");
		// // Create header
		// row = dojo.create("tr", null, table);
		// for (name in attributes.cameras[0]) {
			// cell = dojo.create("th", {
				// innerHTML: name
			// }, row);
			// names.push(name);
		// }
		// for (i = 0, l = attributes.cameras.length; i < l; i++) {
			// row = dojo.create("tr", null, table);
			// for (j = 0, jl = names.length; j < jl; j++) {
				// cell = dojo.create("td", {
					// innerHTML: attributes.cameras[i][names[j]]
				// }, row);
			// }
		// }
	// 	
		// return table;
	// }
	
	/**
	 * Creates an HTML unordered list from the attributes of a camera graphic.
	 * @param {esri.Graphic} graphic A graphic from the Camera Grahpics Layer.
	 * @return {DOMElement} An HTML unordered list (ul element).
	 */
	function createList(graphic) {
		var attributes = graphic.attributes, camera, i, l, list, item, a;
		
		list = dojo.create("ul");
		for (i = 0, l = attributes.cameras.length; i < l; i += 1) {
			camera = attributes.cameras[i];
			if (camera.ImageURL) {
				item = dojo.create("li", null, list);
				a = dojo.create("a", {
					href: camera.ImageURL,
					innerHTML: camera.Title,
					target: "_blank"
				}, item);
			} else {
				item = dojo.create("li", {
					innerHTML: camera.Title,
					"class": "no-url"
				}, list);
			}
		}
		
		return list;
	}
	
	var initExtent, basemap, symbol, infoTemplate, renderer, cameraLayer, refreshInterval;
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
		on(window, "resize", function() {
			map.resize();
		});
		map.resize();
	});
	
	// Create the symbol for the camera graphics.
	symbol = new esri.symbol.PictureMarkerSymbol("images/camera.png", 24, 12);
	// Create the info template for the balloon that appears when a camera graphic is clicked.
	infoTemplate = new esri.InfoTemplate("Cameras", createList);
	// Create the renderer for the layer using the symbol and info template.
	renderer = new esri.renderer.SimpleRenderer(symbol);
	cameraLayer = new CameraGraphicsLayer({
		id: "cameras",
		url: "http://www.wsdot.wa.gov/traffic/api/HighwayCameras/HighwayCamerasREST.svc/GetCamerasAsJson?AccessCode=" + apikey,
		renderer: renderer,
		toWebMercator: true,
		useJsonp: true,
		infoTemplate: infoTemplate
	});
	// Connect an event handler to send an error to the console if there is a problem refreshing the layer.
	dojo.connect(cameraLayer, "onRefereshEnd", function(error) {
		if (error) {
			console.error("An error occurred refreshing the camera graphics.", error);
		}
	})
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
	refresh = setInterval(refresh, 60000);

});
