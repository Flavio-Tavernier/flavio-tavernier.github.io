// Attendre que le DOM soit chargé
// document.addEventListener("DOMContentLoaded", () => { 
//     getGeolocation();
// });

function getGeolocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const longitude = position.coords.longitude;
                const latitude = position.coords.latitude;
                const precision = position.coords.accuracy;

                initializeMap(longitude, latitude);
                addMarkerToEarth(latitude, longitude);
            },
            (error) => {
                console.warn("Erreur de géolocalisation :", error.message);
            }
        );
    } else {
        console.log("Géolocalisation indisponible");
    }
}


function initializeMap(longitude, latitude) 
{
    var map = L.map('map').setView([latitude, longitude], 13);

    drawPositionMarker(L, map, latitude, longitude)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
}

function drawPositionMarker(L, map, latitude, longitude) {
    let positionMarker = L.marker([latitude, longitude]).addTo(map);
}