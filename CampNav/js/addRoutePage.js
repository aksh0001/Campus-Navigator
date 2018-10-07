// Global variable to hold map reference, so we can use it
// in other functions.
let map = null;
// Map Initialisation callback.  Will be called when Maps API loads.
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
}
//***********************************************************************************