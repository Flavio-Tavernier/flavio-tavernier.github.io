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

            let map = L.map('map').setView([latitude, longitude], 13);
            initializeMap(L, map, longitude, latitude, precision);
            recupDepartement(L, map, 74);

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


function initializeMap(L, map, longitude, latitude, precision) {
    

    let niceCoords = [43.709424, 7.261916];
    let marseilleCoords =[43.302317, 5.369139];
    let triangleBermudesCoords = [
        [25.7617, -80.1918],  // Point A
        [18.4655, -66.1057],  // Point B
        [32.3078, -64.7505]  // Point C
    ];

    drawPositionMarker(L, map, latitude, longitude);
    drawPositionCircle(L, map, latitude, longitude, precision);
    drawNiceMarker(L, map, niceCoords);
    drawTriangleBermudes(L, map, triangleBermudesCoords);
    drawSegmentNiceMarseille(L, map, niceCoords, marseilleCoords);
    getRoadBetweenNiceMarseille(L, map, niceCoords, marseilleCoords);


    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 20
    }).addTo(map);
}

function drawPositionMarker(L, map, latitude, longitude) {
    let positionMarker = L.marker([latitude, longitude]).addTo(map);
}

function drawNiceMarker(L, map, niceCoords) {
    let niceMarker = L.marker(niceCoords).addTo(map);
}

function drawPositionCircle(L, map, latitude, longitude, precision) {
    let circle = L.circle([latitude, longitude], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: precision
    }).addTo(map);
}

function drawTriangleBermudes(L, map, triangleBermudesCoords) {
    let triangleBermudes = L.polygon(triangleBermudesCoords, {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: 500
    }).addTo(map);
}

function drawSegmentNiceMarseille(L, map, niceCoords, marseilleCoords) {
    let segmentNiceMarseille = L.polygon([niceCoords, marseilleCoords], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: 500
    }).addTo(map);

    let distanceNiceMarseille = 
    Math.round(
            L.latLng(niceCoords
        ).distanceTo(
            L.latLng(marseilleCoords)
        ) 
        / 1000
    ).toLocaleString('fr-FR') + " KM";
    
    segmentNiceMarseille.bindTooltip(distanceNiceMarseille, {
        permanent: false,
        direction: 'top',
        offset: [0, -10], 
        opacity: 0.9,
        sticky: true
    });
}

function recupDepartement(L, map, departementCode) {
    fetch(`https://geo.api.gouv.fr/departements/${departementCode}/communes?fields=mairie,population`)  // URL de l'API
        .then(response => {
            if (!response.ok) {
            throw new Error('Erreur réseau');
            }
            return response.json();  // Parse la réponse JSON
        })
        .then(data => {
            console.log(data);  // Utilise les données JSON ici
            drawCitiesByDepartementCode(L, map, data);
        })
        .catch(error => {
            console.error('Erreur:', error);
    });
}

function drawCitiesByDepartementCode(L, map, data) {
    const geoJsonData = {
        type: "FeatureCollection",
        features: data
            .filter(commune => commune.mairie)  // On garde celles qui ont une mairie
            .map(commune => ({
                type: "Feature",
                geometry: commune.mairie,
                properties: {
                    nom: commune.nom,
                    code: commune.code,
                    population: commune.population || "Inconnue"
                }
            }))
    };

    // Ajout des marqueurs sur la carte
    L.geoJSON(geoJsonData, {
        pointToLayer: function(feature, latlng) {
            return L.marker(latlng).bindPopup(
                `<strong>${feature.properties.nom}</strong><br>` +
                `Code INSEE : ${feature.properties.code}<br>` +
                `Population : ${feature.properties.population}`
            );
        }
    }).addTo(map);
}

function getRoadBetweenNiceMarseille(L, map, niceCoords, marseilleCoords) {
    niceCoords = [7.261916, 43.709424];
    marseilleCoords = [5.369139, 43.302317];
    const accessToken = `pk.eyJ1IjoiY3YwNiIsImEiOiJjajg2MmpzYjcwbWdnMzNsc2NzM2l4eW0yIn0.TfDJipR5II7orUZaC848YA`;

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${niceCoords[0]},${niceCoords[1]};${marseilleCoords[0]},${marseilleCoords[1]}?geometries=geojson&access_token=${accessToken}`;

    fetch(url)
    .then(res => res.json())
    .then(data => {
        const route = data.routes[0].geometry;
        
        // Affiche l'itinéraire sur la carte
        const geojson = {
        type: 'Feature',
        geometry: route
        };

        L.geoJSON(geojson, {
        style: {
            color: 'blue',
            weight: 4
        }
        }).addTo(map);

        
        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
            attribution: 'Map data © OpenStreetMap contributors, Imagery © Mapbox',
            maxZoom: 18,
            id: 'mapbox/streets-v11',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: accessToken
        }).addTo(map);

        L.marker([niceCoords[1], niceCoords[0]]).addTo(map).bindPopup('Départ').openPopup();
        L.marker([marseilleCoords[1], marseilleCoords[0]]).addTo(map).bindPopup('Arrivée');


    })
    .catch(err => console.error('Erreur Directions API:', err));
}
