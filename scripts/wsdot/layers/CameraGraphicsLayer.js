﻿/*global esri, dojo, dojox, jQuery, define */
/*jslint white: true, nomen: true, plusplus: true */

/**
 * @author Jeff Jacobson 
 */

define(["require", "dojo/_base/declare", "esri/layers/graphics"], function(require, declare) {
	"use strict";
	
	var output, travelerApiSR = new esri.SpatialReference({wkid: 4326});
	
	
	function getCameraAttributes(cameraData) {
		var attributes, name, cameraLocation, clName, toOmit = /(Display)?((?:Longitude)|(?:Latitude))/;
		attributes = {};
		// Copy the properties from the camera data into "attributes" (excluding "CameraLocation").
		/*jslint forin:true */
		for (name in cameraData) {
			if (!toOmit.test(name) && cameraData.hasOwnProperty(name) && name !== "CameraLocation") {
				attributes[name] = cameraData[name];
			}
		}
		
		// Copy the properties of the CameraLocation property into "attributes".
		cameraLocation = cameraData.CameraLocation;
		for (clName in cameraLocation) {
			if (!toOmit.test(clName) && cameraLocation.hasOwnProperty(clName)) {
				// Check to see if the property already exists in attributes.  If it does, prefix name with "CameraLocation" so the existing value is not overwritten.
				if (attributes.hasOwnProperty(clName)) {
					attributes["CameraLocation" + clName] = cameraLocation[clName];
				} else {
					attributes[clName] = cameraLocation[clName];
				}
			}
		}
		/*jslint forin:false */
		
		return attributes;
	}
	
	function getCameraPoint(cameraData, toWebMercator) {
		var point = new esri.geometry.Point(cameraData.CameraLocation.Longitude, cameraData.CameraLocation.Latitude, travelerApiSR);
		
		// Convert the point from geo. to WebMercator if that option was specified.
		if (toWebMercator) {
			point = esri.geometry.geographicToWebMercator(point);
		}
		
		return point;
	}
	
	/**
	 * Converts camera data into a graphic.
	 * @param {Object} cameraData One of the camera data elements from the GetCamerasAsJson operation.
	 * @param {Boolean} toWebMercator Set to true if you want the graphic to be converted to web mercator, false to leave at WGS 84.
	 */
	function cameraToGraphic(cameraData, toWebMercator) {
		var point, attributes, graphic;
		
		attributes = getCameraAttributes(cameraData);
		point = getCameraPoint(cameraData, toWebMercator);
		
		// Initialize the graphic attributes.
		graphic = new esri.Graphic();
		graphic.setAttributes({
			cameras: [attributes]
		}).setGeometry(point);
		
		return graphic;
	}
	
	output = declare("wsdot.layers.CameraGraphicsLayer", esri.layers.GraphicsLayer, {
		onRefreshStart: function () {
		},
		onRefreshEnd: function (error) {
		},
		/**
		 * Creates a new instance of CameraGraphicsLayer
		 * @param {Object} options The options for initializing this layer.  See the esri.layers.GraphicsLayer documentation for details.
		 * @param {String} [options.url] Use this to override the default URL.
		 */
		constructor: function (options) {
			this.url = options.url || "http://www.wsdot.wa.gov/traffic/api/HighwayCameras/HighwayCamerasREST.svc/GetCamerasAsJson";
			this._options = options;
			this.refresh();
		},

		/**
		 * Searches all of the graphics in the layer until a graphic in the same location as "point" is found.
		 * @param {esri.geometry.Point} point 
		 * @return {esri.Graphic | null} Returns the first graphic found in the same location as "point", or null if no match is found.
		 */
		getGraphicAtLocation: function (point) {
			var i, l, graphic, otherGraphic = null;

			// Note that "this" refers to the CameraGraphicsLayer object.
			for (i = 0, l = this.graphics.length; i < l; i++) {
				graphic = this.graphics[i];
				if (graphic.geometry.x === point.x && graphic.geometry.y === point.y) {
					otherGraphic = graphic;
					break;
				}
			}

			return otherGraphic;

		},

		/**
		 * Adds camera data to the layer as a graphic. 
		 * @param {Object} cameraData One of the objects from the array returned from the GetCameraDataAsJson array. 
		 */
		addCamera: function (cameraData) {
			var attributes, point, existingGraphic, newGraphic;
			point = getCameraPoint(cameraData, this._options.toWebMercator);
			// See if there are already any graphics where this camera is to be located...
			existingGraphic = this.getGraphicAtLocation(point);
			if (existingGraphic) {
				// Add attributes for the new camera to the exisitng graphic.
				attributes = getCameraAttributes(cameraData);
				existingGraphic.attributes.cameras.push(attributes);
			} else {
				// Create a new graphic
				newGraphic = cameraToGraphic(cameraData, this._options.toWebMercator);
				this.add(newGraphic);
			}

			return this;
		},

		/**
		 * Refreshes the layer's graphics.  Calls the Traveler API to get the camera data and recreates the graphics. 
		 */
		refresh: function () {
			var layer = this;

			/**
			 * Converts an array of camera data to graphics and adds the graphics to the layer.
			 * @param {Object} data An array of camera data (returned from the GetCamerasAsJson operation).
			 */
			function addCameraDataAsGraphics(data) {
				var i, l;
				try {
					for (i = 0, l = data.length; i < l; i += 1) {
						// layer.add(cameraToGraphic(data[i], layer._options.toWebMercator));
						layer.addCamera(data[i]);
					}

					layer.onRefreshEnd(); // Trigger event.
				} catch (e) {
					layer.onRefreshEnd(e); // Trigger event.
				}
			}

			this.clear(); // Clear all of the existing graphics from the layer.
			this.onRefreshStart(); // Trigger event.

			// If a renderer was specified in the options, set the layer's renderer to match.
			if (this._options.renderer) {
				layer.setRenderer(this._options.renderer);
			}

			esri.request({
				url: layer.url,
				handleAs: "json"
			}).then(addCameraDataAsGraphics, function (error) {
				layer.onRefreshEnd(error); // Trigger event.
			});
		},
		/**
		* Sets up the layer's onClick event to show a Lightbox with the associated image(s).
		* @returns {Object} A handle that can be used to disconnect an event handler.
		*/
		setupLightboxOnClickEvent: function () {
			var deferred, cameraLayer = this;
			require(["dojox/image/Lightbox"], function () {
				var lightboxDialog;

				// Connect the click event.
				deferred = dojo.connect(cameraLayer, "onClick", function (event) {
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
			});

			return deferred;
		}
	});

	return output;
	
});