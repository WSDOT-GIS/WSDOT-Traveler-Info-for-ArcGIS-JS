WSDOT Traveler Info for ArcGIS JavaScript API
=============================================

Provides information from the [WSDOT Traveler Information API] to the [ArcGIS JavaScript API].

## Layer Types ##

### wsdot.layers.TravelerInfoGraphicsLayer ###

Displays data from one of the [WSDOT Traveler Information API REST endpoints] as graphics.

### wsdot.layers.CameraGraphicsLayer ###

Displays [traffic camera data from the Traveler Info. API REST endpoint].  Each graphic in this layer contains a single `cameras` attribute, which is an array containing one or more objects corresponding to a traffic camera.

## Sample Pages ##

The sample pages are provided a Traveler Information API Access Code from the `apikey.js` file, which is not included in this repository.
In order to create this file...

1. Copy the `sample_apikey.js` and name the copy `apikey.js`.
2. If you do not already have a Traveler Information API access code, aquire one from the [Traveler Information API page].
3. Open `apikey.js` and replace the value of the `apikey` variable with your access code.

### Cameras.html

This page demonstrates the wsdot.layers.CameraGraphicsLayer.

### TrafficFlow.html  

This page demonstrates displaying the Traffic Flow data via the wsdot.layers.TravelerInfoGraphicsLayer.

## TODO ##
* Some of the REST endpoints return data with a start and end location.  Figure out how to handle them (show just start or end point?)
* Complete documentation for layer classes.

[WSDOT Traveler Information API]: http://www.wsdot.wa.gov/Traffic/api/
[ArcGIS JavaScript API]: http://links.esri.com/javascript
[WSDOT Traveler Information API REST endpoints]: http://www.wsdot.wa.gov/traffic/api/
[traffic camera data from the Traveler Info. API REST endpoint]:http://www.wsdot.wa.gov/traffic/api/HighwayCameras/HighwayCamerasREST.svc/Help
[Traveler Information API page]: http://www.wsdot.wa.gov/Traffic/api/
