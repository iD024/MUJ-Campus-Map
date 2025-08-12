
    // Base map
    var map = L.map("map");

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(map);

    // Load MUJ campus boundaries
    fetch("campus.geojson")
      .then(res => res.json())
      .then(data => {
        const campusLayer = L.geoJSON(data).addTo(map);
        const bounds = campusLayer.getBounds();

        // Add padding so map doesn't clip the edges
        const paddedBounds = bounds.pad(0.1);
        map.fitBounds(bounds);
        map.setMaxBounds(paddedBounds);
      });

    // Live GPS tracking
    let userMarker = null;
    let accuracyCircle = null;

    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const accuracy = pos.coords.accuracy;

          if (userMarker) {
            userMarker.setLatLng([lat, lon]);
            accuracyCircle.setLatLng([lat, lon]).setRadius(accuracy);
          } else {
            userMarker = L.marker([lat, lon]).addTo(map).bindPopup("You are here");
            accuracyCircle = L.circle([lat, lon], { radius: accuracy }).addTo(map);
            map.setView([lat, lon], 18);
          }
        },
        (err) => console.error("GPS error:", err),
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation not supported on this device");
    }
