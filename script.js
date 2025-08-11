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