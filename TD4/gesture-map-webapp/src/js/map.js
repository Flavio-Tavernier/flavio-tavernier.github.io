// This file handles the logic for displaying and interacting with the interactive map.
// It may include functions to load the map, set markers, and respond to user interactions.

const mapContainer = document.getElementById('map');
let map;

function initMap() {
    map = new google.maps.Map(mapContainer, {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 8,
    });
}

function setMarker(location) {
    new google.maps.Marker({
        position: location,
        map: map,
    });
}

function addClickListener() {
    map.addListener('click', (event) => {
        setMarker(event.latLng);
    });
}

window.onload = () => {
    initMap();
    addClickListener();
};