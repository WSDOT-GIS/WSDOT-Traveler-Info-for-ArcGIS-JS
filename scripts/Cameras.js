/*global dojo, dijit, esri*/
require(["dojo/on", "esri/dijit/Attribution", "dojox/image/Lightbox", "esri/map", "wsdot/layers/CameraGraphicsLayer"], function(
	on, Attribution, Lightbox, Map, CameraGraphicsLayer) {
	"use strict";
	
	var map, lightboxDialog, initExtent, basemap, symbol, infoTemplate, renderer, cameraLayer, refreshInterval;
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
	// // Create the info template for the balloon that appears when a camera graphic is clicked.
	// infoTemplate = new esri.InfoTemplate("Cameras", createList);



	// Create the renderer for the layer using the symbol and info template.
	renderer = new esri.renderer.SimpleRenderer(symbol);
	cameraLayer = new CameraGraphicsLayer({
		id: "cameras",
		url: "proxy.ashx?http://www.wsdot.wa.gov/traffic/api/HighwayCameras/HighwayCamerasREST.svc/GetCamerasAsJson",
		renderer: renderer,
		toWebMercator: true,
		useJsonp: false
	});
	// Connect an event handler to send an error to the console if there is a problem refreshing the layer.
	dojo.connect(cameraLayer, "onRefereshEnd", function(error) {
		if (error) {
			console.error("An error occurred refreshing the camera graphics.", error);
		}
	});
	
	// Connect the click event.
	dojo.connect(cameraLayer, "onClick", function(event) {
		var cameras, groupName = "cameras", i, l, camera;
		
		function createTitle(camera) {
			var output;
			if (camera.CameraOwner) {
				if (camera.OwnerURL) {
					output = [camera.Title, " (<a href='", camera.OwnerURL, "' target='_blank'>", camera.CameraOwner, "</a>)"].join("");
				} else {
					output = [camera.Title, " (", camera.CameraOwner, ")"].join("");
				}
			} else {
				output = camera.Title;
			}
			return output;
		}
		
		if (!lightboxDialog) {
			// Create the lightbox.
			lightboxDialog = new dojox.image.LightboxDialog({});
			lightboxDialog.startup();
		} else {
			// Remove existing graphics from the lightbox.
			lightboxDialog.removeGroup(groupName);
		}
		
		// Get the list of cameras.
		cameras = event.graphic.attributes.cameras;
		
		if (cameras.length === 1) {
			camera = cameras[0];
			lightboxDialog.show({
				title: createTitle(camera),
				href: camera.ImageURL
			});
		} else {
			for (i = 1, l = cameras.length; i < l; i += 1) {
				camera = cameras[i];
				lightboxDialog.addImage({
					title: createTitle(camera),
					href: camera.ImageURL
				}, groupName);
			}
			camera = cameras[0];
			lightboxDialog.show({
				group: groupName, 
				title: createTitle(camera),
				href: camera.ImageURL
			});
		}
	});
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
