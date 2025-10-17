let map;

function initMap() {
    // Initialiser la carte Leaflet
    map = L.map('map').setView([48.8566, 2.3522], 13);
    
    // Ajouter la couche OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

// Initialiser la carte au chargement
document.addEventListener('DOMContentLoaded', initMap);