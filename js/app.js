// Set global map variable
var map;

// model data for testing, actual data will be retrieved from JSON file
var model = {
  currentLocation: ko.observable(null),
  data: lakes
}

// Viewmodel
function owtViewModel() {
  // The old `self=this` trick
  var self = this;

  // Get all locations into an array
  this.locationList = model.data.map(function(location){
    return new Location(location);
  });

  // Add click binding to location markers
  this.locationList.forEach(function(location){
    location.marker.addListener('click', function(){
      self.setCurrentLocation(location);
      self.bounceMarker(location);
      self.getWikiInfo(location);
      self.getWaterInfo(location);
    });
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

  // Observable for info window title
  this.infoTitle = ko.computed(function(){
    return self.hasCurrentLocation() ? self.getCurrentLocation().name : "Select a location"
  });

  // Observable for wikipedia infoText
  this.wikiText = ko.observable('');

  // Observable for water quality info
  this.waterInfo = ko.observable('');

  // Compile html for infoText window
  this.infoText = ko.computed(function(){
    return self.infoTitle() + self.waterInfo() + self.wikiText();
  });

  // // Hide all markers
  // this.toggleAllMarkers = function(){
  //   if (!self.searchResults().length) {
  //     self.locationList.forEach(function(location){
  //       location.marker.setVisible(!location.marker.getVisible());
  //     });
  //   }
  // }

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
    self.getWikiInfo(this);
    self.getWaterInfo(this);
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
      if ((searchString.length > 0)
          && locations[i].name.toLowerCase().includes(searchString)) {
        results.push(locations[i]);
        locations[i].marker.setVisible(true);
      }
      else if (searchString.length > 0){
        locations[i].marker.setVisible(false);
      }
      else {
        locations[i].marker.setVisible(true);
      }
    }
    self.searchResults(results);
    // self.showMarkers(results);
  }

  // Retrieve Wikipedia info
  this.getWikiInfo = function(location){
    // set TimeOut
    var wikiRequestTimeout = setTimeout(function(){
      self.wikiText = "Looks like the data was delivered by a sloth. The request timed out."
    }, 8000);
    var pageTitle = location.wpName;
    var wpurl = "https://de.wikipedia.org/w/api.php";
    wpurl = wpurl + '?' + $.param({
      'format': "json",
      'action': "query",
      'titles': pageTitle,
      'prop': "extracts",
      'exintro': 1
    });
    $.ajax({
      url: wpurl,
      dataType: 'jsonp'
    })
    .done(function(data){
      result = data.query.pages;
      var extract;
      $.each(result, function(i){
        // title = result[i]["title"];
        extract = result[i]["extract"];
      });
      self.wikiText(extract);
      clearTimeout(wikiRequestTimeout);
    })
    .fail(function(){
      self.wikiText("Something went wrong when trying to retrieve info from Wikipedia.")
    })
  }

  // Retrieve information about water quality and temperature from Berlin API
  this.getWaterInfo = function(location){
    var query = self.makeSafeURI(location.name);
    console.log(query);
    var url = 'http://www.berlin.de/lageso/gesundheit/gesundheitsschutz/badegewaesser/liste-der-badestellen/index.php/index.json';
    url = url + '?badname=' + query;
    console.log(url);
    // $.getJSON(url, function(data){
    //   console.log(data);
    //   var date = data['index']['dat'];
    //   var temp = data['index']['temp'];
    //   var visibility = data['index']['sicht'];
    // })
    // .fail(function(){
    //   self.waterInfo("Could not load water information");
    // });
    $.ajax({
      url: url,
      dataType: 'jsonp',
      // contentType: 'application/json',
      cache: true,
    })
    .done(function(data){
      console.log(data);
      var date = data['index']['dat'];
      var temp = data['index']['temp'];
      var visibility = data['index']['sicht'];
    })
    .fail(function(){
      self.waterInfo("Could not load water information")
    });
  }

  // // Callback function for jsonp call to Berlin API
  // this.jsonCallback = function(json){
  //   console.log("Callback called");
  //   console.log(json);
  // }

  this.makeSafeURI = function(string){
    string = string.replace(/ /g, "+");
    string = string.replace(/,/, "%2C");
    string = string.replace(/\(/, "%28");
    string = string.replace(/\)/, "%29");
    string = string.replace(/\//, "%2F");
    // var replaceChars = {
    //   " ": "%20",
    //   ",": "%2C",
    //   "\(": "%28",
    //   "\)": "%29",
    //   "\/": "%2F"
    // }
    // for (char in replaceChars){
    //   var re = new RegExp(char, 'g');
    //   string = string.replace(re, replaceChars[char]);
    // }
    return string
  }

}

// Location constructor
var Location = function(data) {
  var self = this;
  this.name = data.name;
  this.coords = new google.maps.LatLng(data.location[1], data.location[0]);
  this.wpName = data.wpName;
  this.marker = new google.maps.Marker({
    position: self.coords,
    title: self.name,
    map: map
  });
  // this.marker.addListener("click", function(){
  //   model.currentLocation(self);
  // });
}


// Initialise map, centered on Berlin, with markers
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 52.535, lng: 13.415},
    zoom: 10
  });

  // Start knockout
  var owt = new owtViewModel();
  ko.applyBindings(owt);

  // get markers
  var markers = owt.locationList.map(function(location){
    return location.marker;
  });
}
