// Create the 'basemap' tile layer that will be the background of our map.
let satelliteLayer = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 20,
  attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
});


// OPTIONAL: Step 2
// Create the 'street' tile layer as a second background of the map
let streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data © OpenStreetMap contributors',
  maxZoom: 18
});

// Create the map object with center and zoom options.
let map = L.map("map", {
  center: [25, 0],
  zoom: 3
});

// Then add the 'basemap' tile layer to the map.
satelliteLayer.addTo(map);

// OPTIONAL: Step 2
// Create the layer groups, base maps, and overlays for our two sets of data, earthquakes and tectonic_plates.

// Layer groups
let earthquakes = new L.LayerGroup();
let tectonicPlates = new L.LayerGroup();

// Base maps
let baseMaps = {
  "Satellite": satelliteLayer,
  "Streets": streetLayer
};

// Overlays
let overlays = {
  "Earthquakes": earthquakes,
  "Tectonic Plates": tectonicPlates
};

// Add a control to the map that will allow the user to change which layers are visible.
L.control.layers(baseMaps, overlays).addTo(map);

// Make a request that retrieves the earthquake geoJSON data.
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(function (data) {

  // This function returns the style data for each of the earthquakes we plot on
  // the map. Pass the magnitude and depth of the earthquake into two separate functions
  // to calculate the color and radius.
  function styleInfo(feature) {
    return {
      // border
      opacity: 1,
      weight: 0.5,
      color: "black",
      // filling
      fillOpacity: 0.9,
      fillColor: getColor(feature.geometry.coordinates[2]),
      // radius
      radius: getRadius(feature.properties.mag)
    };
  }

  // This function determines the color of the marker based on the depth of the earthquake.
  function getColor(depth) {
    if (depth > 90) {
      return "red";
    } else if (depth > 70) {
      return "orangered";
    } else if (depth > 50) {
      return "darkorange";
    } else if (depth > 30) {
      return "gold";
    } else if (depth > 10) {
      return "yellowgreen";
    } else {
      return "lime";
    }
  }

  // This function determines the radius of the earthquake marker based on its magnitude.
  function getRadius(magnitude) {
    if (magnitude !== 0) {
      return magnitude * 4;
    }
    else {
      return 1;
    }
  }

  // Add a GeoJSON layer to the map once the file is loaded.
  L.geoJson(data, {
    // Turn each feature into a circleMarker on the map.
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng);
    },
    // Set the style for each circleMarker using our styleInfo function.
    style: styleInfo,
    // Create a popup for each marker to display the magnitude and location of the earthquake after the marker has been created and styled
    onEachFeature: function (feature, layer) {
      layer.bindPopup(
        `<h3>Location: ${feature.properties.place}</h3>
        <hr><p>Magnitude: ${feature.properties.mag}</p>
        <p>Depth: ${feature.geometry.coordinates[2]} km</p>`
      )
    }
    // OPTIONAL: Step 2
    // Add the data to the earthquake layer instead of directly to the map.
  }).addTo(earthquakes);
  earthquakes.addTo(map);

  // Create a legend control object.
  let legend = L.control({
    position: "bottomright"
  });

  // Then add all the details for the legend
  legend.onAdd = function () {
    let div = L.DomUtil.create("div", "info legend");

    div.innerHTML = "<h3>Depth (km)</h3>";
    // Initialize depth intervals and colors for the legend
    const depths = [-10, 10, 30, 50, 70, 90];
    const colors = [
      "lime",
      "yellowgreen",
      "gold",
      "darkorange",
      "orangered",
      "red"
    ]

    // Loop through our depth intervals to generate a label with a colored square for each interval.
    for (let i = 0; i < depths.length; i++) {

      // Creating label
      let label = `${depths[i]}`;
      if (depths[i + 1]) {
        label += ` - ${depths[i + 1]}`
      }
      else {
        label += `+`
      }

      // Generating colored square and adding a label
      div.innerHTML += `<i style="background:${colors[i]}; border: 1px solid #000;
      width: 18px; height: 18px; display: inline-block;"></i>
      ${label}<br>`;
    }

    // Styling the legend box
    div.style.padding = "10px";
    div.style.border = "2px solid black";
    div.style.borderRadius = "5px";
    div.style.backgroundColor = "white";
    return div;
  };

  // Finally, add the legend to the map.
  legend.addTo(map);

  // Add event listeners to handle layer visibility
  map.on("overlayadd", function (event) {
    if (event.name === "Earthquakes") {
      map.addControl(legend); // Show the legend when the "Earthquakes" layer is added
    }
  });

  map.on("overlayremove", function (event) {
    if (event.name === "Earthquakes") {
      map.removeControl(legend); // Hide the legend when the "Earthquakes" layer is removed
    }
  });

  // OPTIONAL: Step 2
  // Make a request to get our Tectonic Plate geoJSON data.
  d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(function (plate_data) {
    // Save the geoJSON data, along with style information, to the tectonic_plates layer.
    L.geoJson(plate_data, {
      style: {
        color: "orange",
        weight: 2
      }
    }).addTo(tectonicPlates);

    // Then add the tectonic_plates layer to the map.
    tectonicPlates.addTo(map);
  });
});