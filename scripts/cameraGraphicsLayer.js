/*global esri, dojo, jQuery */
/*jslint white: true, undef: true, nomen: true, regexp: true, plusplus: true, bitwise: true, newcap: true, maxerr: 50, indent: 4 */

/**
 * @author Jeff Jacobson 
 */

/// <reference path="dojo.js.uncompressed.js" />


(function () {
	"use strict";
	
	dojo.require("esri.layers.graphics");
	
	var travelerApiSR;
	
	travelerApiSR = new esri.SpatialReference({wkid: 4326});
	
	/**
	 * Converts camera data into a graphic.
 	* @param {Object} cameraData One of the camera data elements from the GetCamerasAsJson operation.
 	* @param {Boolean} toWebMercator Set to true if you want the graphic to be converted to web mercator, false to leave at WGS 84.
	 */
	function cameraToGraphic(cameraData, toWebMercator) {
		var point, attributes, name, cameraLocation, clName;
		point = new esri.geometry.Point(cameraData.Latitude, cameraData.Longitude, travelerApiSR);
		
		// Convert the point from geo. to WebMercator if that option was specified.
		if (toWebMercator) {
			point = esri.geometry.geographicToWebMercator(point);
		}
		
		// Initialize the graphic attributes.
		attributes = {};
		// Copy the properties from the camera data into "attributes" (excluding "CameraLocation").
		for (name in cameraData) {
			if (cameraData.hasOwnProperty(name) && name !== "CameraLocation") {
				attributes[name] = cameraData[name];
			}
		}
		
		// Copy the properties of the CameraLocation property into "attributes".
		cameraLocation = cameraData.CameraLocation;
		for (clName in cameraLocation) {
			if (cameraLocation.hasOwnProperty(clName)) {
				// Check to see if the property already exists in attributes.  If it does, prefix name with "CameraLocation" so the existing value is not overwritten.
				if (attributes.hasOwnProperty(clName)) {
					attributes["CameraLocation" + clName] = cameraLocation[clName];
				} else {
					attributes[clName] = cameraLocation[clName];
				}
			}
		}
		
		return new esri.Graphic({
			geometry: point,
			attributes: attributes
		});
	}
	
	
	dojo.declare("wsdot.layers.CameraGraphicsLayer", esri.layers.GraphicsLayer, {
		onRefreshStart: function () {
		},
		onRefreshEnd: function (error) {
		},
		/**
		 * Creates a new instance of CameraGraphicsLayer
 		 * @param {Object} options The options for initializing this layer.  See the esri.layers.GraphicsLayer documentation for details.
		 */
		constructor: function (options) {
			this.url = options.url;
			this._options = options;
			this.refresh();
		},
		/**
		 * Calls the Traveler API to get the camera data and recreates the graphics. 
		 */
		refresh: function () {
			this.clear();
			this.onRefreshStart();
	
			var layer = this;
			if (this._options.renderer) {
				layer.setRenderer(this._options.renderer);
			}
	
			return dojo.xhrGet({
				url: layer.url,
				handleAs: "json",
				load: function (data) {
					var i, l, graphic;
					try {
						for (i = 0, l = data.length; i < l; i += 1) {
							layer.add(cameraToGraphic(data[i], layer._options.toWebMercator));
						}
	
						layer.onRefreshEnd();
					} catch (e) {
						layer.onRefreshEnd(e);
					}
				},
				error: function (error) {
					layer.onRefreshEnd(error);
				}
			}, { useProxy: false });
		}
	});
}());