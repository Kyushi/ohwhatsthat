// TODO: Make info retrieved by api part of location object and check whether
// the reference already exists before doing another JSON request -> API and
// mobile-data friendly

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
      self.setCurrentLocation(location);
      self.bounceMarker();
      model.currentLocation(location);
      self.toggleVisible();
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
    return self.getCurrentLocation() === null ? true : false;
  });

  // React to click in search result list
  this.loadCurrentLocation = function(){
    self.setCurrentLocation(this);
    self.infoTitle(this.name);
    self.bounceMarker(this);
    self.centerMap();
    self.getWikiInfo();
    self.getWaterInfo();
    self.toggleVisible();
  }

  this.clearCurrentLocation = function(){
    model.currentLocation(null);
    self.toggleVisible();
    self.clearInfoWindow();
    self.resetMapCenter();
  }

  // Load text from external source for easy localisation
  this.close = ko.observable(textContent.helpers.close);
  this.title = ko.observable(textContent.header.title);
  this.searchLabel = ko.observable(textContent.search.inputLabel);
  this.footerText = ko.observable(textContent.footer.footerText);
  this.impressumLink = ko.observable(textContent.footer.impressum);
  this.credits = ko.observable(textContent.footer.credits);

  // Observables for info window
  this.infoTitle = ko.observable('');
  this.waterInfoError = ko.observable('');
  this.sampleDate = ko.observable('Loading ...');
  this.waterQuality = ko.observable('Loading ...');
  this.waterVisibility = ko.observable('Loading ...');
  this.waterTemperature = ko.observable('Loading ...');
  this.wikiError = ko.observable('');
  this.wikiText = ko.observable('Loading ...');
  this.wikiLink = ko.observable('Loading ...');
  this.hasWikiLink = ko.computed(function(){
    return self.wikiLink().length > 0;
  })

  // Observables for page info
  this.piTitle = ko.observable(textContent.pageInfo.title);
  this.piClose = ko.observable(textContent.pageInfo.close);
  this.piResp = ko.observable(textContent.pageInfo.responsibility);
  this.piContact = ko.observable(textContent.pageInfo.contact);
  this.piEmail = ko.observable(textContent.pageInfo.email);
  this.piGithub = ko.observable(textContent.pageInfo.github);
  this.piWikiAPI = ko.observable(textContent.pageInfo.wikiAPI);
  this.piCorsanywhere = ko.observable(textContent.pageInfo.corsanywhere);
  this.piBerlinAPI = ko.observable(textContent.pageInfo.berlinAPI);

  this.clearInfoWindow = function(){
    this.infoTitle('');
    this.waterInfoError('');
    this.sampleDate('Loading ...');
    this.waterQuality('Loading ...');
    this.waterVisibility('Loading ...');
    this.waterTemperature('Loading ...');
    this.wikiError('');
    this.wikiText('Loading ...');
    this.wikiLink('Loading ...');
  }

  // Obserrvable for info window
  this.visibleInfo = ko.observable(false);

  // Function to toggle visibility of info window
  this.toggleVisible = function(){
    self.visibleInfo(!self.visibleInfo());
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

  // Function to enlarge footer to show page info-title
  this.showPageInfo = ko.observable(false);

  this.togglePageInfo = function(){
    self.showPageInfo(!self.showPageInfo());
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
  }

  // Load wiki info from location data or get from API
  this.getWikiInfo = function(){
    var loc = self.getCurrentLocation();
    if (loc.wikiInfo === undefined) {
      self.getWikiData(loc);
    }
    else {
      self.loadWikiInfo(loc);
    }
  }

  // Load wiki info into Observables
  this.loadWikiInfo = function(loc){
    if (loc.wikiInfo.timeout !== undefined) {
      self.wikiText(loc.wikiInfo.timeout);
    }
    else if (loc.wikiInfo.err !== undefined) {
      self.wikiError(loc.wikiInfo.err);
    }
    else {
      self.wikiText(loc.wikiInfo.wikiText);
      self.wikiLink(loc.wikiInfo.wikiLink);
    }
  }

  // Retrieve Wikipedia info
  this.getWikiData = function(loc){
    // set TimeOut
    var wikiRequestTimeout = setTimeout(function(){
      loc.wikiInfo.wikiText = "Looks like the data was delivered by a" +
                                   " sloth. The request timed out."
    }, 8000);
    var pageTitle = loc.wpName;
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
      console.log(data);
      clearTimeout(wikiRequestTimeout);
      loc.wikiInfo = {};
      if (-1 in data.query.pages) {
        loc.wikiInfo.err = "Oops, looks like there is nothing written" +
                                " about this on Wikipedia"
      }
      else {
        var article_url = "http://de.wikipedia.org/wiki/" + pageTitle;
        var result = data.query.pages;
        var extract;
        $.each(result, function(i){
          extract = result[i]["extract"];
        });
        loc.wikiInfo.wikiText = extract;
        loc.wikiInfo.wikiLink = article_url;
      }
    })
    .fail(function(){
      loc.wikiInfo = {};
      loc.wikiInfo.err = "Something went wrong when trying to" +
                                   "retrieve info from Wikipedia."
    })
    .always(function(){
      self.loadWikiInfo(loc);

    });
  }


  // Get information about the water quality, temperature etc.
  this.getWaterInfo = function(){
    var loc = self.getCurrentLocation();
    if (loc.waterInfo === undefined) {
      self.getWaterData(loc);
    }
    else {
      loadWaterInfo();
    }
  }

  // Laod water info into observables
  this.loadWaterInfo = function(loc){
    if (loc.waterInfo.err !== undefined){
      self.waterInfoError(loc.waterInfo.err);
    }
    else {
      self.sampleDate(loc.waterInfo.dat);
      self.waterQuality(loc.waterInfo.wasserqualitaet);
      self.waterTemperature(loc.waterInfo.temp);
      self.waterVisibility(loc.waterInfo.sicht);
    }
  }

  // Retrieve information about water quality and temperature from Berlin API
  this.getWaterData = function(loc){
    // var loc = self.getCurrentLocation();
    var query = self.makeSafeURI(loc.name);
    var url = 'https://cors-anywhere.herokuapp.com/www.berlin.de/lageso/gesundheit/gesundheitsschutz/badegewaesser/liste-der-badestellen/index.php/index.json';
    url = url + '?badname=' + query;
    $.getJSON(url, function(data){
      if (data.index.length > 0){
        loc.waterInfo = data.index[0];
      }
      else {
        loc.waterInfo = {};
        loc.waterInfo.err = "Looks like there was no info for this";
      }
    })
    .fail(function(){
      loc.waterInfo = {};
      loc.waterInfo.err = "Could not load water information";
    })
    .always(function(){
      self.loadWaterInfo(loc);
    });
  }

  // Remove name add-ons like "(Fluss)" and "Berlin-" from wikipedia name
  this.makeTumblrTag = function(name){
    name = name.replace("Berlin-", "");
    name = name.replace(/ *\([^)]*\) */g, "");
    name = name.replace(/_/g, " ");
    return name;
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
