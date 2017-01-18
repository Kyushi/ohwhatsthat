// Set global map variable
var map;

// Model
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
      self.loadCurrentLocation();
    });
  });

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

  this.clearCurrentLocation = function(){
    model.currentLocation(null);
    self.resetMapCenter();
  }

  // Load text from external source for easy localisation
  this.close = ko.observable(textContent.helpers.close);
  this.title = ko.observable(textContent.header.title);
  this.searchLabel = ko.observable(textContent.search.inputLabel);
  this.footerText = ko.observable(textContent.footer.footerText);
  // Observable for wikipedia infoText
  this.wikiText = ko.observable('');
  // Observable for water quality info
  this.waterInfo = ko.observable('');
  // Compile html for infoText window TODO: Add more info to infotext
  this.infoText = ko.computed(function(){
    return self.wikiText();
  });
  // Observable for info window title
  this.infoTitle = ko.computed(function(){
    return self.hasCurrentLocation() ? self.getCurrentLocation().name : null;
  });

  // Show markers of search results
  this.showMarkers = function(results){
    var loc = self.locationList;
    for (var i=0; i<self.locationList.length; i++) {
      var visible = results.includes(loc[i]);
      self.locationList[i].marker.setVisible(visible);
    }
  }

  // Bounce marker 3 times when clicking on search result
  this.bounceMarker = function(){
    var location = self.getCurrentLocation();
    location.marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function(){
      location.marker.setAnimation(null);
    }, 2100)
  }

  // Center map on current marker's position
  this.centerMap = function(){
    var position = self.getCurrentLocation().marker.position;
    map.setCenter(position);
    map.setZoom(13);
  }

  this.resetMapCenter = function(){
    map.setCenter({lat: 52.515, lng: 13.415});
    map.setZoom(10);
  }

  // React to click in search result list
  this.loadCurrentLocation = function(){
    self.setCurrentLocation(this);
    self.bounceMarker(this);
    self.getWikiInfo(this);
    self.centerMap();
    // self.getWaterInfo(this);
  }

  // Everything relating to search below this

  // show or hide search bar
  this.toggleSearch = function(){
    $(".popout").toggle();
  }

  // searchString for testing
  this.searchString = ko.observable('');

  // Empty array that should get updated when the liveSearch works
  this.searchResults = ko.observableArray(this.locationList);

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
        results.push(locations[i]);
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


  this.makeSafeURI = function(string){
    string = string.replace(/ /g, "+");
    string = string.replace(/,/, "%2C");
    string = string.replace(/\(/, "%28");
    string = string.replace(/\)/, "%29");
    string = string.replace(/\//, "%2F");
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
}


// Initialise map, centered on Berlin, with markers
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 52.515, lng: 13.415},
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
