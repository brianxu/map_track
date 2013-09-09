var markers = [];
// Create an array of styles.
  var styles = [
    {
      stylers: [
        { hue: "#00ffe6" },
        { saturation: -20 }
      ]
    },{
      featureType: "road",
      elementType: "geometry",
      stylers: [
        { lightness: 100 },
        { visibility: "simplified" }
      ]
    },{
      featureType: "road",
      elementType: "labels",
      stylers: [
        { visibility: "off" }
      ]
    }
  ];

// Add a marker to the map and push to the array.
function addMarker(location) {
    var marker = new google.maps.Marker({
                                            position: location,
                                            map: map
                                        });
    markers.push(marker);
}

// Sets the map on all markers in the array.
function setAllMap(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

// Removes the overlays from the map, but keeps them in the array.
function clearOverlays() {
    setAllMap(null);
}

// Shows any overlays currently in the array.
function showOverlays() {
    setAllMap(map);
}

// Deletes all markers in the array by removing references to them.
function deleteOverlays() {
    clearOverlays();
    markers = [];
}


var poly;
var map;

var allPoints = new Array();

var TILE_SIZE = 256;
var chicago = new google.maps.LatLng(41.850033,-87.6500523);

function bound(value, opt_min, opt_max) {
    if (opt_min != null) value = Math.max(value, opt_min);
    if (opt_max != null) value = Math.min(value, opt_max);
    return value;
}

function degreesToRadians(deg) {
    return deg * (Math.PI / 180);
}

function radiansToDegrees(rad) {
    return rad / (Math.PI / 180);
}
/** @constructor */
function MercatorProjection() {
    this.pixelOrigin_ = new google.maps.Point(TILE_SIZE / 2,
                                              TILE_SIZE / 2);
    this.pixelsPerLonDegree_ = TILE_SIZE / 360;
    this.pixelsPerLonRadian_ = TILE_SIZE / (2 * Math.PI);
}

MercatorProjection.prototype.fromLatLngToPoint = function(latLng,
                                                          opt_point) {
            var me = this;
            var point = opt_point || new google.maps.Point(0, 0);
            var origin = me.pixelOrigin_;

            point.x = origin.x + latLng.lng() * me.pixelsPerLonDegree_;

            // Truncating to 0.9999 effectively limits latitude to 89.189. This is
            // about a third of a tile past the edge of the world tile.
            var siny = bound(Math.sin(degreesToRadians(latLng.lat())), -0.9999,
                             0.9999);
            point.y = origin.y + 0.5 * Math.log((1 + siny) / (1 - siny)) *
                    -me.pixelsPerLonRadian_;
            return point;
        };

MercatorProjection.prototype.fromPointToLatLng = function(point) {
            var me = this;
            var origin = me.pixelOrigin_;
            var lng = (point.x - origin.x) / me.pixelsPerLonDegree_;
            var latRadians = (point.y - origin.y) / -me.pixelsPerLonRadian_;
            var lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) -
                                       Math.PI / 2);
            return new google.maps.LatLng(lat, lng);
        };

function initialize() {
    var chicago = new google.maps.LatLng(41.879535, -87.624333);
    var mapOptions = {
        zoom: 7,
        center: chicago,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    styledMap = new google.maps.StyledMapType(styles,
                                              {name: "Styled Map"});

    //Associate the styled map with the MapTypeId and set it to display.
      map.mapTypes.set('map_style', styledMap);
      map.setMapTypeId('map_style');

    var polyOptions = {
        strokeColor: '#CC0099',
        strokeOpacity: 1.0,
        strokeWeight: 3
    }
    poly = new google.maps.Polyline(polyOptions);
    poly.setMap(map);
    // Add a listener for the click event
    google.maps.event.addListener(map, 'click', addLatLng);

    // Search box
    var input = /** @type {HTMLInputElement} */(document.getElementById('target'));
    var searchBox = new google.maps.places.SearchBox(input);
    var markers_search = [];

    google.maps.event.addListener(searchBox, 'places_changed', function() {
      var places = searchBox.getPlaces();

      for (var i = 0, marker; marker = markers_search[i]; i++) {
        marker.setMap(null);
      }

      markers_search = [];
      var bounds = new google.maps.LatLngBounds();
      for (var i = 0, place; place = places[i]; i++) {
        var image = {
          url: place.icon,
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(17, 34),
          scaledSize: new google.maps.Size(25, 25)
        };

        var marker = new google.maps.Marker({
          map: map,
          icon: image,
          title: place.name,
          position: place.geometry.location
        });

        markers_search.push(marker);

        bounds.extend(place.geometry.location);
      }

      map.fitBounds(bounds);
      map.setZoom(14);
    });

    google.maps.event.addListener(map, 'bounds_changed', function() {
      var bounds = map.getBounds();
      searchBox.setBounds(bounds);
    });
}

/**
 * Handles click events on a map, and adds a new point to the Polyline.
 * @param {google.maps.MouseEvent} event
 */
function addLatLng(event) {

    var path = poly.getPath();
    path.clear();
    // Because path is an MVCArray, we can simply append a new coordinate
    // and it will automatically appear
    //path.push(event.latLng);

    var projection = new MercatorProjection();
    var worldCoordinate = projection.fromLatLngToPoint(event.latLng);
    //console.log("worldCoordinate["+worldCoordinate.x+"," +worldCoordinate.y+"]");
    allPoints.push(worldCoordinate);
    //---
    var bpoints = new Array();
    bpoints = getBezierPoints(allPoints, false);
    var polypoints = new Array();
    polypoints = getPolylines(bpoints,40);
    for(var i = 0; i < polypoints.length; ++i)
    {
        var latlng = projection.fromPointToLatLng(polypoints[i]);
        //console.log(polypoints.length);
        //console.log(i +":"+polypoints[i].x+","+polypoints[i].y+"---"+latlng.lat() +","+latlng.lng());
        path.push(latlng);
    }
    //

    // Add a new marker at the new plotted point on the polyline.
    var marker = new google.maps.Marker({
                                            position: event.latLng,
                                            title: '#' + path.getLength(),
                                            map: map
                                        });
    markers.push(marker);
}

google.maps.event.addDomListener(window, 'load', initialize);



