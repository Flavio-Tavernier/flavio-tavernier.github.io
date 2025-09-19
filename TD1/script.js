addEventListener("DOMContentLoaded", (event) => { 
    getGeolocation();
    getOrientationRotation();
})



function getGeolocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
            let longitude = position.coords.longitude
            let latitude = position.coords.latitude
            let precision = position.coords.accuracy
            let vitesse = position.coords.speed
            let timestamp = Date. now()

            initializeMap(longitude, latitude)

            document.getElementById("latitude").innerHTML = latitude
            document.getElementById("longitude").innerHTML = longitude
            document.getElementById("precision").innerHTML = precision
            vitesse ? document.getElementById("vitesse").innerHTML = vitesse : 
                        document.getElementById("vitesse").innerHTML = 'null'        
            document.getElementById("timestamp").innerHTML = timestamp
        });


        navigator.geolocation.watchPosition((position) => {
            let longitude = position.coords.longitude
            let latitude = position.coords.latitude
            let precision = position.coords.accuracy
            let vitesse = position.coords.speed
            let timestamp = Date. now()

            document.getElementById("watchPosition-latitude").innerHTML = latitude
            document.getElementById("watchPosition-longitude").innerHTML = longitude
            document.getElementById("watchPosition-precision").innerHTML = precision
            vitesse ? document.getElementById("watchPosition-vitesse").innerHTML = vitesse : 
                        document.getElementById("watchPosition-vitesse").innerHTML = 'null'        
            document.getElementById("watchPosition-timestamp").innerHTML = timestamp
        });
       
    } else {
        console.log("geolocalisation indisponible");
        
    }
}

function getOrientationRotation() {
    window.addEventListener("deviceorientation", handleOrientation);
}

function handleOrientation(event) {
    const absolute = event.absolute;
    const alpha = event.alpha;
    const beta = event.beta;
    const gamma = event.gamma;

    alpha ? document.getElementById("orientation-alpha").innerHTML = alpha :
            document.getElementById("orientation-alpha").innerHTML = "null"


}


function initializeMap(longitude, latitude) {
    console.log(longitude);
    
    var map = L.map('map').setView([latitude, longitude], 13);

    var positionMarker = L.marker([latitude, longitude]).addTo(map);
    var niceMarker = L.marker([43.709424, 7.261916]).addTo(map);

     var triangleBermudesCoords = [
        [25.7617, -80.1918],  // Point A
        [18.4655, -66.1057],  // Point B
        [32.3078, -64.7505]  // Point C
    ];

    var triangleBermudes = L.polygon(triangleBermudesCoords, {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: 500
    }).addTo(map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
}