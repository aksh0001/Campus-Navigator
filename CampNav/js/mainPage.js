let routesJson = [];
displayMessage("in main");
let data = {
    campus: "clayton"
    , callback: "routesResponse"
};
jsonpRequest("https://eng1003.monash/api/campusnav/", data);
// function to build the url and the query string and append to the HTML document 
//
//***********************************************************************************
function jsonpRequest(url, data) {
    // Build URL parameters from data object.
    let params = "";
    // For each key in data object...
    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            if (params.length == 0) {
                // First parameter starts with '?'
                params += "?";
            }
            else {
                // Subsequent parameter separated by '&'
                params += "&";
            }
            let encodedKey = encodeURIComponent(key);
            let encodedValue = encodeURIComponent(data[key]);
            params += encodedKey + "=" + encodedValue;
        }
    }
    // creates final url that will collect the correct data
    let script = document.createElement('script');
    script.src = url + params;
    document.body.appendChild(script);
}
//***********************************************************************************
//
// Function checks whether local storage is available and then subsequently stores the
// information from routesArray into local storage
//***********************************************************************************
function routesResponse(routesArray) {
    if (typeof (Storage) !== "undefined") {
        console.log("localStorage is available.");
        routesJson = JSON.stringify(routesArray);
        // this gives you a key to access the routes JSON in the local storage
        localStorage.setItem(STORAGE_KEY, routesJson);
    }
    else {
        console.log("localStorage is not supported by current browser.");
    }
}
//***********************************************************************************
//
// Dynamically allocate an  MDL table for each path in the array into the main page
// Also Note: the callback, selectedPath() taken in a parameter that corresponds to 
// the (ordered) numbered path i.e. the first path will correspond to an index of 1 
// and this is passed into the selectedPath()
for (let i = 0; i < pathPDO.length; i++) {
    listHTML += "<tr onclick=\"selectedPath(" + i + ")\"><td class=\"mdl-data-table__cell--non-numeric\">" + pathArray[i].title;
    listHTML += "<div class=\"subtitle\">" + pathArray[i].distance().toFixed(1) + " meters, " + pathArray[i].numTurns() + " turns" + "</td> </tr>";
}
monashPaths.innerHTML = listHTML;