/*global dojo, dijit, esri*/
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("esri.map");

var map;
 
function init() {
	"use strict";
	
	function createTable(graphic) {
		var attributes = graphic.attributes, camera, i, l, table, row, cell, name, names = [], j, jl;
		table = dojo.create("table");
		// Create header
		row = dojo.create("tr", null, table);
		for (name in attributes.cameras[0]) {
			cell = dojo.create("th", {
				innerHTML: name
			}, row);
			names.push(name);
		}
		for (i = 0, l = attributes.cameras.length; i < l; i++) {
			row = dojo.create("tr", null, table);
			for (j = 0, jl = names.length; j < jl; j++) {
				cell = dojo.create("td", {
					innerHTML: attributes.cameras[i][names[j]]
				}, row);
			}
		}
		
		return table;
	}
	
	var initExtent, basemap, symbol, infoTemplate, renderer, cameraLayer;
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
	
	symbol = new esri.symbol.SimpleMarkerSymbol();
	symbol.setColor(new dojo.Color("red"));
	infoTemplate = new esri.InfoTemplate("Cameras", createTable);
	renderer = new esri.renderer.SimpleRenderer(symbol);
	cameraLayer = new wsdot.layers.CameraGraphicsLayer({
		id: "cameras",
		url: "http://webpub3qa.wsdot.wa.gov/traffic/api/HighwayCameras/HighwayCamerasREST.svc/GetCamerasAsJson?AccessCode=" + apikey,
		renderer: renderer,
		toWebMercator: true,
		useJsonp: true,
		infoTemplate: infoTemplate
	});
	dojo.connect(cameraLayer, "onRefereshEnd", function(error) {
		if (error) {
			console.error("An error occurred refreshing the camera graphics.", error);
		}
	})
	map.addLayer(cameraLayer);
}
dojo.addOnLoad(init);
