// Client the clientId for authentication and scopes
let clientId = 'YOURCLIENTID';
let scope = 'https://www.googleapis.com/auth/bigquery';

// BigQuery settings. Replace these with your project, dataset and table names.
let gcpProjectId = 'location-geodb';
let bigQueryProjectId = 'bigquery-public-data';
let datasetId = 'openaq';
let tableName = 'global_air_quality';

let map;
let heatmap;
let drawingManager;
let jobCheckTimer;
let recordLimit = 1000;

let config = {
    'client_id': clientId,
    'scope': scope
};

// Start of onClientLoad
function onClientLoad() {
  function loadBigQuery() {
    gapi.client.load('bigquery', 'v2');
    setTimeout(function() {
      if (!gapi.client.bigquery) {
        console.log('Big Query API is not loaded')
        loadBigQuery();
      } else {
        console.log('Big Query API is loaded')
        initMap();
      }
    }, 1000);
  }

  function loadApi() {
    setTimeout(function() {
      if (!gapi.client.bigquery) {
        console.log('Attempting to load Big Query API.')
        loadBigQuery();
      } else {
        console.log('Already loaded Big Query API')
      }
    }, 1000);
  }
  loadApi();

  // Update stats
  function updateStatus(response){
    if(response.statistics){
      let durationMs = response.statistics.endTime - response.statistics.startTime;
      let durationS = durationMs/1000;
      let suffix = (durationS ==1) ? '':'s';
      let durationTd = document.getElementById("duration");
      durationTd.innerHTML = durationS + ' second' + suffix;
    }
    if(response.totalRows){
      let rowsTd = document.getElementById("rowCount");
      rowsTd.innerHTML = response.totalRows;
    }
    if(response.totalBytesProcessed){
      let bytesTd = document.getElementById("bytes");
      bytesTd.innerHTML = (response.totalBytesProcessed/1073741824) + ' GB';
    }
  }

  // Send a query to API
  function sendQuery(queryString){
    console.log('Sending query with:')
    console.log(gcpProjectId)
    console.log(datasetId)

    var request = gapi.client.bigquery.jobs.query({
      'query': queryString,
      'timeoutMs': 1000,
      'datasetId': datasetId,
      'projectId': gcpProjectId,
      'useLegacySql':false
    });
    request.execute(response => checkJobStatus(response.jobReference.jobId));
  }
  // Check job status
  function checkJobStatus(jobId){
    let request = gapi.client.bigquery.jobs.get({
      'projectId': gcpProjectId,
      'jobId': jobId
    });
    request.execute(response => {
      // Show progress to the user
      updateStatus(response);
      if (response.status.errorResult){
        // Handle any errors
        console.log(response.status.error);
        return;
      }
      if (response.status.state == 'DONE'){
        // Get the results
        clearTimeout(jobCheckTimer);
        getQueryResults(jobId);
        return;
      }
      // Not finished, check again in a moment
      jobCheckTimer = setTimeout(checkJobStatus, 500, [jobId]);
    });
  }

  // When a BigQuery job has completed, fetch the results.
  function getQueryResults(jobId){
    let request = gapi.client.bigquery.jobs.getQueryResults({
      'projectId': gcpProjectId,
      'jobId': jobId
    });
    console.log(jobId);
    request.execute(response => doHeatMap(response.result.rows))
    // update status
    updateStatus(response);
  }
  // Init map
  function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 48.864716, lng: 2.349014}, // Paris
      zoom: 12,
      styles:
        [
          {
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#f5f5f5"
              }
            ]
          },
          {
            "elementType": "labels.icon",
            "stylers": [
              {
                "visibility": "on"
              }
            ]
          },
          {
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#616161"
              }
            ]
          },
          {
            "elementType": "labels.text.stroke",
            "stylers": [
              {
                "color": "#f5f5f5"
              }
            ]
          },
          {
            "featureType": "administrative.land_parcel",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#bdbdbd"
              }
            ]
          },
          {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#eeeeee"
              }
            ]
          },
          {
            "featureType": "poi",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#757575"
              }
            ]
          },
          {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#e5e5e5"
              }
            ]
          },
          {
            "featureType": "poi.park",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#9e9e9e"
              }
            ]
          },
          {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#ffffff"
              }
            ]
          },
          {
            "featureType": "road.arterial",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#757575"
              }
            ]
          },
          {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#dadada"
              }
            ]
          },
          {
            "featureType": "road.highway",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#616161"
              }
            ]
          },
          {
            "featureType": "road.local",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#9e9e9e"
              }
            ]
          },
          {
            "featureType": "transit.line",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#e5e5e5"
              }
            ]
          },
          {
            "featureType": "transit.station",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#eeeeee"
              }
            ]
          },
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#c9c9c9"
              }
            ]
          },
          {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#9e9e9e"
              }
            ]
          }
        ]
    });
    setUpDrawingTools();
  }


  // Add the DrawingManager and set up drawing event handlers.
  function setUpDrawingTools(){
    // Initialize drawing manager.
    drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.CIRCLE,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_LEFT,
        drawingModes: [
          google.maps.drawing.OverlayType.CIRCLE,
          google.maps.drawing.OverlayType.POLYGON,
          google.maps.drawing.OverlayType.RECTANGLE
        ]
      },
      circleOptions: {
        fillOpacity: 0
      },
      polygonOptions: {
        fillOpacity: 0
      },
      rectangleOptions: {
        fillOpacity: 0
      }
    });
    drawingManager.setMap(map);

    // Handle the drawing events.
    drawingManager.addListener('rectanglecomplete', rectangle => {
      gapi.auth.authorize(config, function() {
        rectangleQuery(rectangle.getBounds());
      });
    });
    drawingManager.addListener('circlecomplete', circle => {
      gapi.auth.authorize(config, function() {
        circleQuery(circle);
      });
    });
    drawingManager.addListener('polygoncomplete', function (polygon) {
      let path = polygon.getPaths().getAt(0).getArray();
      let queryPolygon = path.map(function(element) {
        return [element.lng(), element.lat()];
      });
      gapi.auth.authorize(config, function() {
        polygonQuery(queryPolygon);
        });
    });
  }

  // Query related functions:
  // 1. RECTANGLE
  function rectangleQuery(latLngBounds){
    let queryString = rectangleSQL(latLngBounds.getNorthEast(), latLngBounds.getSouthWest());
    sendQuery(queryString);
  }
  function rectangleSQL(ne, sw){
    let queryString = 'SELECT latitude, longitude '
    queryString +=  'FROM `' + bigQueryProjectId +'.' + datasetId + '.' + tableName + '`'
    queryString += ' WHERE latitude > ' + sw.lat();
    queryString += ' AND latitude < ' + ne.lat();
    queryString += ' AND longitude > ' + sw.lng();
    queryString += ' AND longitude < ' + ne.lng();
    queryString += ' LIMIT ' + recordLimit;
    return queryString;
  }
  // 2. RADIUS is CIRCLE
  function circleQuery(circle){
    let queryString = haversineSQL(circle.getCenter(), circle.radius);
    sendQuery(queryString);
  }

  // Calculate a circular area on the surface of a sphere based on a center and radius.
  function haversineSQL(center, radius){
    let queryString;
    let centerLat = center.lat();
    let centerLng = center.lng();
    let kmPerDegree = 111.045;

    queryString = 'CREATE TEMPORARY FUNCTION Degrees(radians FLOAT64) RETURNS FLOAT64 LANGUAGE js AS ';
    queryString += '""" ';
    queryString += 'return (radians*180)/(22/7);';
    queryString += '"""; ';

    queryString += 'CREATE TEMPORARY FUNCTION Radians(degrees FLOAT64) RETURNS FLOAT64 LANGUAGE js AS';
    queryString += '""" ';
    queryString += 'return (degrees*(22/7))/180;';
    queryString += '"""; ';

    queryString += 'SELECT latitude, longitude '
    queryString += 'FROM `' + bigQueryProjectId +'.' + datasetId + '.' + tableName + '` ';
    queryString += 'WHERE '
    queryString += '(' + kmPerDegree + ' * DEGREES( ACOS( COS( RADIANS('
    queryString += centerLat;
    queryString += ') ) * COS( RADIANS( latitude ) ) * COS( RADIANS( ' + centerLng + ' ) - RADIANS('
    queryString += ' longitude ';
    queryString += ') ) + SIN( RADIANS('
    queryString += centerLat;
    queryString += ') ) * SIN( RADIANS( latitude ) ) ) ) ) ';

    queryString += ' < ' + radius/1000;
    queryString += ' LIMIT ' + recordLimit;
    return queryString;
  }

  // 3. POLYGON
  function polygonQuery(polygon) {
    let request = gapi.client.bigquery.jobs.insert({
      'projectId' : gcpProjectId,
      'resource' : {
        'configuration':
        {
          'query':
          {
            'query': polygonSQL(polygon),
            'useLegacySql': false
          }
        }
      }
    });
    request.execute(response => checkJobStatus(response.jobReference.jobId));
  }

  //Build a BigQuery User Defined Function based SQL Query
  //This uses Standard SQL
  function polygonSQL(poly){
    let queryString = 'CREATE TEMPORARY FUNCTION pointInPolygon(latitude FLOAT64, longitude FLOAT64) ';
    queryString += 'RETURNS BOOL LANGUAGE js AS """ ';
    queryString += 'var polygon=' + JSON.stringify(poly) + ';';
    queryString += 'var vertx = [];';
    queryString += 'var verty = [];';
    queryString += 'var nvert = 0;';
    queryString += 'var testx = longitude;';
    queryString += 'var testy = latitude;';
    queryString += 'for(coord in polygon){';
    queryString += '  vertx[nvert] = polygon[coord][0];';
    queryString += '  verty[nvert] = polygon[coord][1];';
    queryString += '  nvert ++;';
    queryString += '}';
    queryString += 'var i, j, c = 0;';
    queryString += 'for (i = 0, j = nvert-1; i < nvert; j = i++) {';
    queryString += '  if ( ((verty[i]>testy) != (verty[j]>testy)) &&(testx < (vertx[j]-vertx[i]) * (testy-verty[i]) / (verty[j]-verty[i]) + vertx[i]) ){';
    queryString += '    c = !c;';
    queryString += '  }';
    queryString += '}';
    queryString += 'return c;';
    queryString += '"""; ';
    queryString += 'SELECT latitude, longitude, timestamp ';
    queryString += 'FROM `' + bigQueryProjectId + '.' + datasetId + '.' + tableName + '` ';
    queryString += 'WHERE pointInPolygon(latitude, longitude) = TRUE ';
    queryString += 'LIMIT ' + recordLimit;
    return queryString;
  }

  function toggleHeatmap() {
    heatmap.setMap(heatmap.getMap() ? null : map);
  }

  // Helper: shows query results as a Heatmap.
  function doHeatMap(rows){
    let latCol = 0;
    let lngCol = 1;
    let heatMapData = [];

    if (rows!=null){
      for (let i = 0; i < rows.length; i++) {
        let f = rows[i].f;
        console.log(f)
        let coords = { lat: parseFloat(f[latCol].v), lng: parseFloat(f[lngCol].v) };
        console.log('Initializing the point with coords:')
        console.log(coords)
        heatMapData.push(new google.maps.LatLng(coords));
      }
      // Initialize with heatMapData
      heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatMapData,
        maxIntensity: 20
      });
      console.log('Looking at heatmap data:')
      console.log(heatmap)
      toggleHeatmap();
    }
    else{
      console.log('No object heatMapData available')
    }
  }
} // End of onClientLoad
