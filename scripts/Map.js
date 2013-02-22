require(["wsdot/layers/CameraGraphicsLayer", "esri/dijit/Attribution", "esri/map"], function (CameraGraphicsLayer) {
	"use strict";
	var map;

	// Setup proxy.
	esri.config.defaults.io.proxyUrl = "proxy.ashx";

	// Create the map.
	map = new esri.Map("map", {
		basemap: "streets",
		center: [-120.80566406246835, 47.41322033015946],
		zoom: 7
	});

	// Add camera layer.
	(function () {
		var cameraSymbol, cameraRenderer, cameraLayer;
		// Create the symbol for the camera graphics.
		cameraSymbol = new esri.symbol.PictureMarkerSymbol("images/camera.png", 24, 12);

		// Create the renderer for the layer using the symbol and info template.
		cameraRenderer = new esri.renderer.SimpleRenderer(cameraSymbol);

		// Create the camera graphics layer.
		cameraLayer = new CameraGraphicsLayer({
			id: "cameras",
			renderer: cameraRenderer,
			toWebMercator: true
		});

		// Set up the on click event for the layer so that a lightbox will show camera images.
		cameraLayer.setupLightboxOnClickEvent();

		map.addLayer(cameraLayer);
	}());
});