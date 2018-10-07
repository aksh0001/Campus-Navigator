// Global variables
//***********************************************************************************
const STORAGE_KEY = "ROUTESKEY"; // Declaring it here allows code in other classes to use it
const SELECTED_PATH = "CENTERKEY";
const PATH_DIST = "DISTKEY";
let pathPDO = [];
let pathArray = [];
let monashPaths = document.getElementById('path-infomation');
let listHTML = "";
//***********************************************************************************
//
// class sets up what is needed for path; will calculate distance, number of turns, and summarise the attributes of the path PDO as an object and string
//***********************************************************************************
class Path {
    constructor() {
            this._title = "";
            this._locations = [];
        }
        // Accessors
    get title() {
        return this._title;
    }
    get locations() {
            return this._locations;
        }
        // Methods for calculating the total distance and number of turns for each path
    distance() {
        let retVal = 0;
        let latVal1, lngVal1, latVal2, lngVal2;
        // iterate through the locations array and calculate the distance between every 2 sets of points
        for (let i = 1; i < this._locations.length; i++) {
            latVal1 = this._locations[i - 1].lat;
            lngVal1 = this._locations[i - 1].lng;
            latVal2 = this._locations[i].lat;
            lngVal2 = this._locations[i].lng;
            // Once we have the 2 sets of lat and lng values, we can calculate the distance between them
            let pt1 = new google.maps.LatLng(latVal1, lngVal1);
            let pt2 = new google.maps.LatLng(latVal2, lngVal2);
            retVal += google.maps.geometry.spherical.computeDistanceBetween(pt1, pt2);
        }
        return retVal;
    }
    numTurns() {
            return this._locations.length - 2;
        }
        // A method that taken in a Path PDO (eg from storage) and uses its attributes to intialise the attributes of a 'fresh' Path instance 
    initialiseFromPathPDO(pathPDO) {
            this._title = pathPDO.title;
            this._locations = pathPDO.locations;
        }
        // toString() method to display the state of the object (a summary)
    toString() {
        let retVal = "";
        retVal += "title: " + this._title;
        retVal += "locations: " + this._locations;
        return retVal;
    }
}
//***********************************************************************************
//
// Whenever the pages of the app loads, we want to create an array of Path instances from the data retreived from the NAV web service
// First check if local storage is available
if (typeof (Storage) !== "undefined") {
    console.log("localStorage is available.");
    pathPDO = JSON.parse(localStorage.getItem(STORAGE_KEY));
}
else {
    console.log("localStorage is not supported by current browser.");
}
//***********************************************************************************
//
// Now we iterate through the pathPDO array and re-initialise their attributes to be attributes of 'fresh' Path instances that are in an array
for (let i = 0; i < pathPDO.length; i++) {
    let tempPath = new Path();
    tempPath.initialiseFromPathPDO(pathPDO[i]);
    // Now push this tempPath into an array
    pathArray.push(tempPath);
}
class PathList {
    constructor(title, paths) {
        this._title = title;
        this._paths = paths;
    }
}
//***********************************************************************************
//
// The callback function when the user taps on a specific row (each row corresponds to an equivalent index of the pathArray)
//***********************************************************************************
function selectedPath(routeIndexNum) {
    sessionStorage.setItem(SELECTED_PATH, JSON.stringify(routeIndexNum));
    sessionStorage.setItem(PATH_DIST, JSON.stringify(pathArray[routeIndexNum].distance()))
    window.open("navigate.html", "_self");
}
//***********************************************************************************
//
// function used by buttons to load the index page, without opening another tab
//***********************************************************************************
function ToMain() {
    window.open("index.html", "_self");
}
//***********************************************************************************
//
// function that is called when the add button on the mainpage is clicked.
//***********************************************************************************
function toAddRoute() {
    window.open("addRoute.html", "_self");
}
//***********************************************************************************