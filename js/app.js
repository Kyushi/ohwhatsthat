// Set global map variable
var map;

var model = {
  categories: [
    "Project space",
    "Art Gallery",
    "Art Museum",
    "Art Initiative"
  ],
  currentLocation: ko.observable(null),
  data: [
    {
      name: "Projektraum Drifters",
      street: "Kögelstr. 3",
      postcode: "13403",
      city: "Berlin",
      lat: 52.567565,
      lng: 13.330198,
      website: "http://www.projektraum-drifters.de",
      info: "Artist run project space in Berlin, home of the performance series 'Masses & Impersonation'",
      category:0,
    },
    {
      name: "Hamburger Bahnhof",
      street: "Invalidenstraße 50-51",
      postcode: "10557",
      city: "Berlin",
      lat: 52.5284401,
      lng: 13.3721163,
      website: "http://www.smb.museum/museen-und-einrichtungen/hamburger-bahnhof/home.html",
      info: "Der Hamburger Bahnhof – Museum für Gegenwart – Berlin beherbergt reiche Sammlungen zeitgenössischer Kunst, die in einer Vielzahl von Ausstellungen gezeigt werden. Er ist das größte Haus der Nationalgalerie, deren umfassende Bestände außerdem in der Alten Nationalgalerie, der Neuen Nationalgalerie, der Friedrichswerderschen Kirche, dem Museum Berggruen und der Sammlung Scharf-Gerstenberg zu finden sind.",
      category: 2
    },
    {
      name: "Savvy Contemporary",
      street: "Plantagenstraße 31",
      postcode: "13347",
      city: "Berlin",
      lat: 52.5464748,
      lng: 13.3642996,
      website: "http://www.savvy-contemporary.com/",
      info: "SAVVY Contemporary – The laboratory of form-ideas is a lab of " +
            "conceptual, intellectual, artistic and cultural development and " +
            "exchange; an atelier in which ideas are transformed to forms and " +
            "forms to ideas, or gain cognition in their status quo. This is " +
            "achieved with respect to conception, implementation and " +
            "contestation of ideas with/in time and space.",
      category: 3
    }
  ]
}



// Viewmodel
function owtViewModel() {
  // The old `self=this` trick
  var self = this;

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

  this.hasCurrentLocation = ko.computed(function(){
    return self.getCurrentLocation() ? true : false;
  });

  this.infoText = ko.computed(function(){
    var loc = self.getCurrentLocation();
    return loc ? loc.info : "Select a location on the map";
  });

  // Get all locations into an array
  this.locationList = model.data.map(function(location){
    return new Location(location);
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

  // Drop marker when clicking on search result
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
          && locations[i].displayName.toLowerCase().includes(searchString)) {
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
  this.street = data.street;
  this.postcode = data.postcode;
  this.city = data.city;
  this.lat = data.lat;
  this.lng = data.lng;
  this.website = data.website;
  this.info = data.info;
  this.category = model.categories[data.category];
  this.displayName = self.name + " (" + self.category + ")";
  this.marker = new google.maps.Marker({
    position: {lat: self.lat, lng: self.lng},
    title: self.name,
    map: map
  });
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
