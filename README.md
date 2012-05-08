WSDOT Traveler Info for ArcGIS JavaScript API
=============================================

Provides information from the [WSDOT Traveler Information API](http://www.wsdot.wa.gov/Traffic/api/) to the [ArcGIS JavaScript API](http://links.esri.com/javascript).

## Layer Types ##

### wsdot.layers.TravelerInfoGraphicsLayer ###

Displays data from one of the [WSDOT Traveler Information API REST endpoints](http://webpub3qa.wsdot.wa.gov/traffic/api/) as graphics.

### wsdot.layers.CameraGraphicsLayer ###

Displays [traffic camera data from the Traveler Info. API REST endpoint](http://webpub3qa.wsdot.wa.gov/traffic/api/HighwayCameras/HighwayCamerasREST.svc/Help).  Each graphic in this layer contains a single `cameras` attribute, which is an array containing one or more objects corresponding to a traffic camera.

## TODO ##

* `Cameras.html`: Display camera images in a lightbox type control instead of displaying camera info in a table.
* Some of the REST endpoints reutrn data with a start and end location.

## Notes ##

This project uses the REST endpoints of the WSDOT Traveler Information API.  The REST endpoints are a new feature which is currently only available in the [QA version of the API](http://webpub3qa.wsdot.wa.gov/traffic/api/).

## Licensing ##

Licensed under the [MIT license](http://www.opensource.org/licenses/MIT).

## TODO ##
* Complete documentation for layer classes.