// ******* GLOBAL VARIABLES *****************
// Declaring required constants
// Retrieving the index of the pathArray that corresponds to the list the user tapped and also the stored path distance calculation
let selectedPathIdx = JSON.parse(sessionStorage.getItem(SELECTED_PATH));
let pathDistance = JSON.parse(sessionStorage.getItem(PATH_DIST));
let lastLocation = pathArray[selectedPathIdx].locations.length - 1; // The final location index  is the length of the array - 1
const FINAL_TARGET = pathArray[selectedPathIdx].locations[lastLocation], // Calculating the FINAL_TARGET destination
    FIRST_TARGET = pathArray[selectedPathIdx].locations[0]
    , POSITION_OPTIONS = {
        enableHighAccuracy: true
        , timeout: 60000
        , maximumAge: 0
    }
    , DESIRED_ACC = 10;
let map = null
    , mapDivRef = document.getElementById('mymap')
    , nextActRef = document.getElementById('nextact')
    , distWPRef = document.getElementById('distwp')
    , distDestRef = document.getElementById('distdest')
    , etaRef = document.getElementById('eta')
    , directImageRef = document.getElementById('dirimgs');
// Variables to keep track of previous and current position and the current wp being navigated towards
let prevPosition, position, currentWP, waypointNum = 0;
let distanceToWP = Infinity
    , totalDistanceRem = Infinity;
let watchId, target, accuracy;
let movementHistory = []; // An empty array to hold the user's movement history
let numTimesPosChanged = 0;
//***********************************************************************************
//
// Setting title of the nav Page
document.getElementById('navtitle').innerHTML = " " + pathArray[selectedPathIdx].title;
// First checking if GeoLocation API is supported
if (navigator.geolocation) {
    watchId = navigator.geolocation.watchPosition(successWP, error, POSITION_OPTIONS);
}
//***********************************************************************************
//
// initMap function initalises the callback, focuses onto the users location, displays
// the error circle and calls the showPath function to display the chosen path. 
//
//***********************************************************************************
function initMap() {
    displayMessage("inside init map");
    map = new google.maps.Map(mapDivRef);
    map.setZoom(19);
    // Creating the headerArrow
    headingArrow = new google.maps.Marker({
        map: map
        , optimized: true //false
    });
    // Creating an Icon object
    let myIcon = {
        anchor: new google.maps.Point(7.5, 7.5)
        , url: "https://i.stack.imgur.com/rRITT.png"
        , scaledSize: new google.maps.Size(15, 15)
    };
    headingArrow.setIcon(myIcon);
    // Creating the 'error Circle'
    errorCircle = new google.maps.Circle({
            strokeOpacity: 0.8
            , strokeWeight: 2
            , fillOpacity: 0.35
            , map: map
        })
        // Call showPath() which displays the path to be taken
    showPath();
}
//***********************************************************************************
//
let currentGeoTS = 0;
// if aysnchronous getCurrentPosition() is successful, run the success function which is passed a coordinates object
//***********************************************************************************
function successWP(positionObj) {
    // ******* Variable Declarations *****************
    let prevAndCurrentDistance, userHeading;
    // ***********************************************
    if (positionObj.timestamp != currentGeoTS) {
        currentGeoTS = positionObj.timestamp; // Update global ts
        accuracy = positionObj.coords.accuracy; // Calculate accuracy of current reading, then store the lat and lng in positions object
        position = {
            lat: positionObj.coords.latitude
            , lng: positionObj.coords.longitude
        };
        currentWP = pathArray[selectedPathIdx].locations[waypointNum];
        // Update the map properties as the GPS coordinates are changed
        updateMapProperties(position, accuracy);
        // When we get a first valid location, calculate total distance by summing the path distance and the distance to the first waypoint
        if (numTimesPosChanged === 1) {
            distanceToWP = calcDistance(position, FIRST_TARGET);
        }
        // Calculate total distance remaining
        totalDistanceRem = calcRemainingtotalDistance(position, waypointNum);
        // Output calculations onto the page
        displayProgress();
        // Function call to keep checking if we have reached a waypoint
        pointReached(position, waypointNum, accuracy);
        // If we have at least two locations, calculate the distance between them
        if (numTimesPosChanged >= 2 && accuracy < DESIRED_ACC) {
            prevAndCurrentDistance = calcDistance(prevPosition, position)
                // If this distance is at least 1.5m, compute the heading
            if (prevAndCurrentDistance >= 1.0) {
                userHeading = getUserHeading(prevPosition, position);
                etaRef.innerHTML = "Heading: " + Math.round(getUserHeading(position, currentWP));
            }
        }
        // If accuracy is within desired acc, colour the circle green and push the position object into the user's movement history array
        if (accuracy < DESIRED_ACC) {
            errorCircle.setOptions({
                strokeColor: '#00ff00'
                , fillColor: '#00ff00'
            });
            numTimesPosChanged++; // Increment only if we have our desired accuracy
            movementHistory.push(position);
            prevPosition = position; /* A variable used to track the previous position by storing the current position for the next location change */
            //displayMessage("movement array: " + movementHistory.toString())
        }
        // if the error circle is too large, colour it red
        else {
            errorCircle.setOptions({
                strokeColor: '#FF0000'
                , fillColor: '#FF0000'
            });
        }
    }
}
//***********************************************************************************
//
// Showpath function creates a polyline when given an array of [lat,long] cooridinates
//***********************************************************************************
function showPath() {
    // The Polyline constructor requires an options property path that is an array of LatLng objects.
    buildingPath = new google.maps.Polyline({
        path: pathArray[selectedPathIdx].locations, // The array of path coordinates
        geodesic: false
        , strokeColor: '#FF0000'
        , strokeOpacity: 1.0
        , strokeWeight: 2
    });
    buildingPath.setMap(map);
}
//***********************************************************************************
//
// Function that utilises the Spherical Namespace's utility functions to calculate the heading
//***********************************************************************************
function getUserHeading(positionObjFrom, positionObjTo) {
    let retVal;
    let from = new google.maps.LatLng(positionObjFrom.lat, positionObjFrom.lng);
    let to = new google.maps.LatLng(positionObjTo.lat, positionObjTo.lng)
    retVal = google.maps.geometry.spherical.computeHeading(from, to);
    return retVal;
}
//***********************************************************************************
//
// function calculates the distance from one point (given be lat, long coords) to another point using google API
//***********************************************************************************
function calcDistance(positionObjFrom, positionObjTo) {
    let retVal = 0;
    let pt1 = new google.maps.LatLng(positionObjFrom.lat, positionObjFrom.lng);
    let pt2 = new google.maps.LatLng(positionObjTo.lat, positionObjTo.lng);
    retVal = google.maps.geometry.spherical.computeDistanceBetween(pt1, pt2);
    return retVal;
}
//***********************************************************************************
//
// function outputs distance to way point, total distance remaining and next direction to navigate page
//***********************************************************************************
function displayProgress() {
    // Displaying the route progress
    distWPRef.innerHTML = distanceToWP.toFixed(1) + " m";
    distDestRef.innerHTML = totalDistanceRem.toFixed(1) + " m";
    nextActRef.innerHTML = displayDirectionToNextWP(position, currentWP);
}
//***********************************************************************************
//
// function constantly updates the centering of the map and the error circle while the app is in use
//***********************************************************************************
function updateMapProperties(positionObj, accuracy) {
    if (map !== undefined) {
        // Update necessary map properties
        map.setCenter(positionObj);
        headingArrow.setPosition(positionObj);
        errorCircle.setCenter(positionObj);
        errorCircle.setRadius(accuracy);
    }
    else {
        mapDivRef.innerHTML = "Error: Map may not have been initialised/created"
    }
}
//***********************************************************************************
//
// called when the user presses the home button to return to the main page
//***********************************************************************************
function returnToMain() {
    // Once back button is pressed, also clear the watchId to stop receiving GPS coordinates
    navigator.geolocation.clearWatch(watchId);
    window.open("index.html", "_self");
}
//***********************************************************************************
//
// function notifies the user when the current waypoint has been reached, then resets to the next waypoint
//***********************************************************************************
function pointReached(currentPos, routeWaypointNum, accuracy) {
    // The waypoint is reached if the distance between user location and WP drops below the accuracy
    let retVal = false;
    let dist = calcDistance(currentPos, pathArray[selectedPathIdx].locations[routeWaypointNum]);
    distanceToWP = dist;
    if (dist < accuracy) {
        //display log message
        if (routeWaypointNum === pathArray[selectedPathIdx].locations.length - 1) {
            displayMessage("You have reached your destination"); // If we are on the second to last WP, then we reached destination
        }
        else {
            displayMessage("Waypoint reached");
        }
        waypointNum++; // once we have reached a wp, increment the waypoint number to start sensing the next path
        retVal = true;
    }
    else {
        retVal = false;
    }
    return retVal;
}
//***********************************************************************************
//
// function outputs the remaining the distance the user must travel to their desired destination
//***********************************************************************************
function calcRemainingtotalDistance(currentPos, routeWaypointNum) {
    let retVal = 0;
    // We neeed to caulcate the total distance between the untraversed paths
    let i = routeWaypointNum + 1;
    for (i; i < pathArray[selectedPathIdx].locations.length; i++) {
        let pt1 = pathArray[selectedPathIdx].locations[i - 1];
        let pt2 = pathArray[selectedPathIdx].locations[i];
        retVal += calcDistance(pt1, pt2);
    }
    // Add the total distance between the untraversed paths with the distance between the current path and the user's location
    retVal += calcDistance(currentPos, pathArray[selectedPathIdx].locations[routeWaypointNum]);
    return retVal;
}
//***********************************************************************************
//
// function tells the user both via an arrow and word which direction they need to travel to next waypoint
//***********************************************************************************
function displayDirectionToNextWP(currentPos, currentWP) {
    let heading = getUserHeading(currentPos, currentWP);
    // Run through ranges of the heading that correspond to an equivalent direction
    let directionWord = "";
    if ((heading >= 0 && heading <= 20) || (heading >= -20 && heading <= 0)) {
        directionWord = "straight";
        directImageRef.src = "images/straight.svg";
    }
    else if ((heading >= 100 && heading <= 180) || (heading >= -100 && heading <= -180)) {
        directionWord = "UTurn";
        directImageRef.src = "images/uturn.svg";
    }
    else if (heading < -20 && heading >= -70) {
        directionWord = "slight left";
        directImageRef.src = "images/slight_left.svg";
    }
    else if (heading < -70 && heading >= -100) {
        directionWord = "left";
        directImageRef.src = "images/left.svg";
    }
    else if (heading > 20 && heading <= 70) {
        directionWord = "slight right";
        directImageRef.src = "images/slight_right.svg";
    }
    else if (heading > 75 && heading <= 100) {
        directionWord = "right";
        directImageRef.src = "images/right.svg";
    }
    return directionWord
}
//***********************************************************************************
//
// 
//***********************************************************************************
function getDuration(originsObj) {
    let service = new google.maps.DistanceMatrixService();
    let userLat = originsObj.lat;
    let userLng = originsObj.lng;
    let destLat = FINAL_TARGET.lat;
    let destLng = FINAL_TARGET.lng
    let userPos = new google.maps.LatLng(userLat, userLng);
    let destPos = new google.maps.LatLng(destLat, destLng);
    service.getDistanceMatrix({
        origins: [userPos]
        , destinations: [destPos]
        , travelMode: 'WALKING'
    , }, distMatrixCallback);
}
//***********************************************************************************
//
// Defining the distance matrix api's callback
//***********************************************************************************
function distMatrixCallback(response, status) {
    // Check if status is ok first
    if (status === 'OK') {
        let origins = response.originAddresses;
        let destinations = response.destinationAddresses;
        for (let i = 0; i < origins.length; i++) {
            let results = response.rows[i].elements;
            for (let j = 0; j < results.length; j++) {
                let element = results[j];
                let duration = element.duration.text;
                let from = origins[i];
                let to = destinations[j];
            }
        }
    }
    // return duration - > it is used in an array (also consult the documentation)
}
//***********************************************************************************
//
// Error handling
//***********************************************************************************
function error(positionError) {
    mapDivRef.innerHTML = "Error code: " + positionError.code + " Message: " + positionError.message;
}
//***********************************************************************************
