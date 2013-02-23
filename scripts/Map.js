require(["dojo/_base/Color", "wsdot/layers/CameraGraphicsLayer",
	"wsdot/renderer/AlertRendererFactory",
	"wsdot/renderer/TrafficFlowRendererFactory",
	"wsdot/layers/TravelerInfoGraphicsLayer",
	"wsdot/utils",
	"esri/dijit/Attribution", "esri/map"], function (Color, CameraGraphicsLayer, AlertRendererFactory, TrafficFlowRendererFactory, TravelerInfoGraphicsLayer, utils) {
		"use strict";
		var map, cameraLayer, alertsLayer, travelerInfoLayer;

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
			var cameraSymbol, cameraRenderer;
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

		// Setup the alerts layer
		(function () {
			var renderer, infoTemplate;
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
			alertsLayer = new wsdot.layers.TravelerInfoGraphicsLayer({
				id: "alerts",
				url: "http://www.wsdot.wa.gov/Traffic/api/HighwayAlerts/HighwayAlertsREST.svc/GetAlertsAsJson",
				renderer: renderer,
				toWebMercator: true,
				infoTemplate: infoTemplate
			});

			map.addLayer(alertsLayer);
		}());

		(function () {
			var infoTemplate;

			// Create the info template for the popups. (This could be customized to look better.)
			infoTemplate = new esri.InfoTemplate("${Description}", function (graphic) {
				return utils.graphicToTable(graphic, /(Longitude)|(Latitude)|(FlowData)/);
			});
			// Create the traffic flow graphics layer.
			travelerInfoLayer = new wsdot.layers.TravelerInfoGraphicsLayer({
				id: "trafficFlow",
				url: "http://www.wsdot.wa.gov/traffic/api/TrafficFlow/TrafficFlowREST.svc/GetTrafficFlowsAsJson",
				renderer: TrafficFlowRendererFactory.createRenderer(),
				toWebMercator: true,
				infoTemplate: infoTemplate
			});

			map.addLayer(travelerInfoLayer);
		}());
	});