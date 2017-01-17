// Set global map variable
var map;

// model data for testing, actual data will be retrieved from JSON file
var model = {
  currentLocation: ko.observable(null),
  data: [
    {
        "location": [
            "13.1423644",
            "52.4349108"
        ],
        "name": "Alter Hof / Unterhavel",
        "wpName": "Havel"
    },
    {
        "location": [
            "13.6237",
            "52.4093"
        ],
        "name": "Bammelecke",
        "wpName": "Bammelecke"
    },
    {
        "location": [
            "13.180702",
            "52.4648988"
        ],
        "name": "Breitehorn / Unterhavel",
        "wpName": "Havel"
    },
    {
        "location": [
            "13.2136153",
            "52.5866148"
        ],
        "name": "B\u00fcrgerablage / Oberhavel",
        "wpName": "Havel"
    },
    {
        "location": [
            "13.7313346",
            "52.4256948"
        ],
        "name": "D\u00e4meritzsee",
        "wpName": "D\u00e4meritzsee"
    },
    {
        "location": [
            "13.2856306",
            "52.5700818"
        ],
        "name": "Flughafensee",
        "wpName": "Flughafensee"
    }
  ]
}



// Viewmodel
function owtViewModel() {
  // The old `self=this` trick
  var self = this;

  // Get all locations into an array
  this.locationList = model.data.map(function(location){
    return new Location(location);
  });

  // Load text from external source for easy localisation
  this.title = ko.observable(textContent.header.title);
  this.searchLabel = ko.observable(textContent.search.inputLabel);

  // Set and get current location
  this.setCurrentLocation = function(location) {
    model.currentLocation(location);
  }

  this.getCurrentLocation = function() {
    return model.currentLocation();
  };

  // check if currentLocation is set and return boolean
  this.hasCurrentLocation = ko.computed(function(){
    return self.getCurrentLocation() ? true : false;
  });

  // TODO: compute info text for displaying in info window. Use API
  this.infoText = ko.computed(function(){
    var loc = self.getCurrentLocation();
    return loc ? loc.info : "Select a location on the map";
  });


  // Hide all markers
  this.toggleAllMarkers = function(){
    if (!self.searchResults().length) {
      self.locationList.forEach(function(location){
        location.marker.setVisible(!location.marker.getVisible());
      });
    }
  }

  // Show markers of search results
  this.showMarkers = function(results){
    var loc = self.locationList;
    for (var i=0; i<self.locationList.length; i++) {
      var visible = results.includes(loc[i]);
      self.locationList[i].marker.setVisible(visible);
    }
  }

  // Bounce marker 3 times when clicking on search result
  this.bounceMarker = function(location){
    location.marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function(){
      location.marker.setAnimation(null);
    }, 2100)
  }

  // React to click in search result list
  this.loadCurrentLocation = function(){
    self.setCurrentLocation(this);
    self.bounceMarker(this);
  }

  // Everything relating to search below this

  // show or hide search bar
  this.toggleSearch = function(){
    $(".popout").toggle();
  }

  // searchString for testing
  this.searchString = ko.observable('');

  // Empty array that should get updated when the liveSearch works
  this.searchResults = ko.observableArray([]);

  // Search function
  this.liveSearch = function(){
    var searchString = self.searchString().toLowerCase();
    var locations = self.locationList;
    var results = [];
    for (i=0; i<self.locationList.length; i++) {
      if (searchString.length
          && locations[i].name.toLowerCase().includes(searchString)) {
        results.push(locations[i]);
      }
    }
    self.searchResults(results);
    self.showMarkers(results);
  }
}

// Location constructor
var Location = function(data) {
  var self = this;
  this.name = data.name;
  this.coords = new google.maps.LatLng(data.location[0], data.location[1]);
  console.log(this.coords.toJSON());
  this.wpName = data.wpName;
  this.marker = new google.maps.Marker({
    position: self.coords,
    title: self.name,
    map: map
  });
  console.log(this.marker.title,
              this.marker.getPosition(),
              this.marker.position.lat(),
              this.marker.position.lng(),
              typeof(this.marker.position.lat()), 
              typeof(this.marker.position.lng()));
  this.marker.addListener("click", function(){
    model.currentLocation(self);
  });
}


// Initialise map, centered on Berlin, with markers
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 52.535, lng: 13.415},
    zoom: 12
  });

  // Start knockout
  var owt = new owtViewModel();
  ko.applyBindings(owt);

  // get markers
  var markers = owt.locationList.map(function(location){
    return location.marker;
  });
}
