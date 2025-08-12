var map = L.map("map").setView([26.9124, 75.7873], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      fetch("campus.geojson")
        .then((res) => res.json())
        .then((data) => {
          const campusLayer = L.geoJSON(data).addTo(map);
          const bounds = campusLayer.getBounds();

          // Expand bounds by a factor (e.g., 10% padding)
          const paddingFactor = 0.1;

          const southWest = bounds.getSouthWest();
          const northEast = bounds.getNorthEast();

          const latPadding = (northEast.lat - southWest.lat) * paddingFactor;
          const lngPadding = (northEast.lng - southWest.lng) * paddingFactor;

          const paddedBounds = L.latLngBounds(
            [southWest.lat - latPadding, southWest.lng - lngPadding],
            [northEast.lat + latPadding, northEast.lng + lngPadding]
          );

          map.fitBounds(bounds);
          map.setMaxBounds(paddedBounds);
        });

if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(function(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        console.log("Your location:", lat, lon);

        // Add marker on map
        const gpsMarker = L.marker([lat, lon]).addTo(map);
        gpsMarker.bindPopup("You are here!").openPopup();

        // Move map to your location
        map.setView([lat, lon], 18);
    }, function(error) {
        console.error("Error getting location:", error);
    }, {
        enableHighAccuracy: true,  // Use GPS for highest accuracy
        timeout: 10000,
        maximumAge: 0
    });
} else {
    alert("Geolocation is not supported by your browser");
}

navigator.geolocation.getCurrentPosition(function(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const accuracy = position.coords.accuracy; // in meters

    L.marker([lat, lon]).addTo(map).bindPopup("You are here!").openPopup();
    L.circle([lat, lon], { radius: accuracy }).addTo(map);

    map.setView([lat, lon], 18);
}, ...);

navigator.geolocation.watchPosition(function(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    
    if (window.userMarker) {
        userMarker.setLatLng([lat, lon]);
    } else {
        window.userMarker = L.marker([lat, lon]).addTo(map).bindPopup("You are here!");
    }
    
    map.setView([lat, lon]);
}, function(err) {
    console.error(err);
}, { enableHighAccuracy: true });
