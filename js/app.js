// Set map variable
var map;

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

// Location
var Location = function(data) {
  var self = this;
  this.name = ko.observable(data.name);
  this.address = ko.observable(data.address);
  this.postcode = ko.observable(data.postcode);
  this.city = ko.observable(data.city);
  this.lat = ko.observable(data.lat);
  this.lng = ko.observable(data.lng);
  this.website = ko.observable(data.website);
  this.info = ko.observable(data.info);
  this.category = ko.computed(function(){
    return categories[data.category];
  });
  this.displayName = ko.computed(function(){
    return self.name() + " (" + self.category() + ")"
  });
  this.marker = new google.maps.Marker({
    position: {lat: self.lat(), lng: self.lng()},
    title: self.name(),
    map: map
  });
  this.marker.addListener("click", function(){
    self.marker.setAnimation(google.maps.Animation.DROP);
  });
}

// Categories
var categories = [
  "Project space",
  "Art Gallery",
  "Art Museum"
];

// Hardcoded model data for testing
var locationData = [
  {
    name: "Projektraum Drifters",
    address: "Kögelstr. 3",
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
    address: "Invalidenstraße 50-51",
    postcode: "10557",
    city: "Berlin",
    lat: 52.5284401,
    lng: 13.3721163,
    website: "http://www.smb.museum/museen-und-einrichtungen/hamburger-bahnhof/home.html",
    info: "Der Hamburger Bahnhof – Museum für Gegenwart – Berlin beherbergt reiche Sammlungen zeitgenössischer Kunst, die in einer Vielzahl von Ausstellungen gezeigt werden. Er ist das größte Haus der Nationalgalerie, deren umfassende Bestände außerdem in der Alten Nationalgalerie, der Neuen Nationalgalerie, der Friedrichswerderschen Kirche, dem Museum Berggruen und der Sammlung Scharf-Gerstenberg zu finden sind.",
    category: 2
  }
];



// Viewmodel
function owtViewModel() {
  // The old `self=this` trick
  var self = this;

  // Not sure about this part, maybe not necessary
  this.title = ko.observable("Oh, what's there?");

  // Get all locations into an array
  this.locationList = locationData.map(function(location){
    return new Location(location);
  });

  // Put all locations into an observableArray TODO: still needed?
  this.locations = ko.observableArray(this.locationList);

  // TODO: do we still need this?
  this.toggleMarker = function(){
    this.marker.setVisible(!this.marker.getVisible());
  }

  // Hide all markers
  this.toggleAllMarkers = function(){
    console.log(self.searchResults().length==true);
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
  this.bounceMarker = function(){
    this.marker.setAnimation(google.maps.Animation.DROP);
  }

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
          && locations[i].displayName().toLowerCase().includes(searchString)) {
        results.push(locations[i]);
      }
    }
    self.searchResults(results);
    self.showMarkers(results);
  }

}
