// Set global map variable
var map;

// *** Model ***
var model = {
  currentLocation: ko.observable(null),
  data: lakes
};

// *** Viewmodel ***
function owtViewModel() {
  // The old `self=this` trick
  var self = this;

  // Load textcontent
  var text = textContent_en;

  // Get all locations into an array
  this.locationList = model.data.map(function(location){
    return new Location(location);
  });

  // Add click binding to location markers
  this.locationList.forEach(function(location){
    location.marker.addListener('click', function(){
      self.clearInfoWindow();
      self.setCurrentLocation(location);
      self.infoTitle(location.name);
      self.bounceMarker(location);
      self.centerMap();
      self.getWikiInfo();
      self.getWaterInfo();
      self.getPlacePhoto();
      self.visibleInfo(true);
    });
  });

  // Set and get current location
  this.setCurrentLocation = function(location) {
    model.currentLocation(location);
  };

  this.getCurrentLocation = function() {
    return model.currentLocation();
  };

  // check if currentLocation is set and return boolean
  this.hasCurrentLocation = ko.computed(function(){
    return self.getCurrentLocation() === null ? true : false;
  });

  // React to click in search result list
  this.loadCurrentLocation = function(){
    self.clearInfoWindow();
    self.setCurrentLocation(this);
    self.infoTitle(this.name);
    self.bounceMarker(this);
    self.centerMap();
    self.getWikiInfo();
    self.getWaterInfo();
    self.getPlacePhoto();
    self.visibleInfo(true);
  };

  this.clearCurrentLocation = function(){
    model.currentLocation(null);
    self.visibleInfo(false);
    self.clearInfoWindow();
    self.resetMapCenter();
  };

  // Load text from external source for easy localisation
  this.close = ko.observable(text.helpers.close);
  this.title = ko.observable(text.header.title);
  this.searchLabel = ko.observable(text.search.inputLabel);
  this.footerText = ko.observable(text.footer.footerText);
  this.impressumLink = ko.observable(text.footer.impressum);
  this.credits = ko.observable(text.footer.credits);

  // Observables for info window
  this.infoTitle = ko.observable('');
  this.hasPhoto = ko.observable(false);
  this.placePhotoError = ko.observable('');
  this.placePhotoURI = ko.observable('');
  this.placePhotoCredits = ko.observable('');
  this.waterInfoHeader = ko.observable(text.infoWindow.waterInfoHeader);
  this.waterInfoError = ko.observable('');
  this.sampleDateLabel = ko.observable(text.infoWindow.sampleDateLabel);
  this.sampleDate = ko.observable('Loading ...');
  this.waterQualityLabel = ko.observable(text.infoWindow.waterQualityLabel)
  this.waterQuality = ko.observable('Loading ...');
  this.waterVisLabel = ko.observable(text.infoWindow.visibilityLabel);
  this.waterVisibility = ko.observable('Loading ...');
  this.waterTempLabel = ko.observable(text.infoWindow.temperatureLabel);
  this.waterTemperature = ko.observable('Loading ...');
  this.wikiHeader = ko.observable(text.infoWindow.wikiHeader);
  this.wikiError = ko.observable('');
  this.wikiText = ko.observable('Loading ...');
  this.wikiReadMore = ko.observable(text.infoWindow.wikiReadMore);
  this.wikiLink = ko.observable('Loading ...');
  this.hasWikiLink = ko.computed(function(){
    return self.wikiLink().length > 0;
  });

  this.clearInfoWindow = function(){
    self.infoTitle('');
    self.hasPhoto(false);
    self.placePhotoError('');
    self.placePhotoURI('');
    self.placePhotoCredits('');
    self.waterInfoError('');
    self.sampleDate('Loading ...');
    self.waterQuality('Loading ...');
    self.waterVisibility('Loading ...');
    self.waterTemperature('Loading ...');
    self.wikiError('');
    self.wikiText('Loading ...');
    self.wikiLink('Loading ...');
  };

  // Observable for info window visibility
  this.visibleInfo = ko.observable(false);

  // Observables for page info
  this.piTitle = ko.observable(text.pageInfo.title);
  this.piClose = ko.observable(text.pageInfo.close);
  this.piResp = ko.observable(text.pageInfo.responsibility);
  this.piAuthor = ko.observable(text.pageInfo.author);
  this.piContact = ko.observable(text.pageInfo.contact);
  this.piEmail = ko.observable(text.pageInfo.email);
  this.piApiCredits = ko.observable(text.pageInfo.APIcredits);
  this.piGoogleApiName = ko.observable(text.pageInfo.googleApiName);
  this.piGoogleAPI = ko.observable(text.pageInfo.googleAPI);
  this.piGoogleCredits = ko.observable(text.pageInfo.googleCredits);
  this.piGithub = ko.observable(text.pageInfo.github);
  this.piGithubText = ko.observable(text.pageInfo.githubText);
  this.piWikiApiName = ko.observable(text.pageInfo.wikiApiName);
  this.piWikiAPI = ko.observable(text.pageInfo.wikiAPI);
  this.piCawName = ko.observable(text.pageInfo.cawName);
  this.piCorsanywhere = ko.observable(text.pageInfo.corsanywhere);
  this.piBerlinApiName = ko.observable(text.pageInfo.berlinApiName);
  this.piBerlinAPI = ko.observable(text.pageInfo.berlinAPI);

  // Show markers of search results
  this.showMarkers = function(results){
    var loc = self.locationList;
    for (var i=0; i<self.locationList.length; i++) {
      var visible = results.includes(loc[i]);
      self.locationList[i].marker.setVisible(visible);
    }
  };

  // Bounce marker 3 times when clicking on search result
  this.bounceMarker = function(){
    var location = self.getCurrentLocation();
    location.marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function(){
      location.marker.setAnimation(null);
    }, 2100);
  };

  // Center map on current marker's position
  this.centerMap = function(){
    var position = self.getCurrentLocation().marker.position;
    map.setCenter(position);
    map.setZoom(13);
  };

  this.resetMapCenter = function(){
    map.setCenter({lat: 52.520, lng: 13.409});
    map.setZoom(10);
  };

  // Function to enlarge footer to show page info-title
  this.showPageInfo = ko.observable(false);

  this.togglePageInfo = function(){
    self.showPageInfo(!self.showPageInfo());
  };

  // Everything relating to search below this

  // show or hide search bar
  this.toggleSearch = function(){
    $(".popout").toggle();
  };

  // searchString for testing
  this.searchString = ko.observable('');

  // Empty array that should get updated when the liveSearch works
  this.searchResults = ko.observableArray(this.locationList);

  // Search function
  this.liveSearch = function(){
    var searchString = self.searchString().toLowerCase();
    var locations = self.locationList;
    var results = [];
    for (var i=0; i<self.locationList.length; i++) {
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
  };

  // Load wiki info from location data or get from API
  this.getWikiInfo = function(){
    var loc = self.getCurrentLocation();
    if (loc.wikiInfo === undefined) {
      self.getWikiData(loc);
    }
    else {
      self.loadWikiInfo(loc);
    }
  };

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
  };

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
  };


  // Get information about the water quality, temperature etc.
  this.getWaterInfo = function(){
    var loc = self.getCurrentLocation();
    if (loc.waterInfo === undefined) {
      self.getWaterData(loc);
    }
    else {
      self.loadWaterInfo(loc);
    }
  };

  // Laod water info into observables
  this.loadWaterInfo = function(loc){
    if (loc.waterInfo.err !== undefined){
      self.waterInfoError(loc.waterInfo.err);
    }
    else {
      self.waterInfoError('');
      self.sampleDate(loc.waterInfo.dat);
      self.waterQuality(loc.waterInfo.wasserqualitaet);
      self.waterTemperature(loc.waterInfo.temp + ' ˚C');
      self.waterVisibility(loc.waterInfo.sicht + ' cm');
    }
  };

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
  };

  // Get place photo, load from location if previously retrieved, else get from
  // Google Places
  this.getPlacePhoto = function(){
    var loc = self.getCurrentLocation();
    if (loc.placePhoto === undefined) {
      self.getPlacePhotoData(loc);
    }
    else {
      self.loadPlacePhoto(loc);
    }
  }

  // Load photo data from location
  this.loadPlacePhoto = function(loc){
    // `hasPhoto` is false by default, so we only need to change things if there
    // is a photo link stored
    if (loc.placePhoto.hasPhoto){
      self.hasPhoto(true);
      self.placePhotoURI(loc.placePhoto.photoUrl);
      self.placePhotoCredits(text.infoWindow.photoCreditsLabel +
                             loc.placePhoto.credits);
    }
  }

  // Get place photo using the Google Places API library
  this.getPlacePhotoData = function(loc){
    loc.placePhoto = {};
    var request = {
      location: loc.coords,
      radius: '600',
      type: "natural_feature"
    }
    var service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, function(results, status){
      if (status == "OK") {
        var photoLink;
        var html_attribution;
        for (var i = results.length-1; i>=0; i--){
          if (results[i].photos !== undefined){
            photoLink = results[i].photos[0].getUrl({
              'maxWidth': 500,
              'maxHeight': 500
            });
            html_attribution = results[i].photos[0].html_attributions[0];
          }
        }
        if (photoLink !== undefined) {
          loc.placePhoto.hasPhoto = true;
          loc.placePhoto.photoUrl = photoLink;
          loc.placePhoto.credits = html_attribution;
        }
        else {
          loc.placePhoto.hasPhoto = false;
        }
      };
      self.loadPlacePhoto(loc);
    });
  };



  this.makeSafeURI = function(string){
    string = string.replace(/ /g, "+");
    string = string.replace(/,/, "%2C");
    string = string.replace(/\(/, "%28");
    string = string.replace(/\)/, "%29");
    string = string.replace(/\//, "%2F");
    return string
  };

// End ViewModel
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
};


// *** Initialise map, centered on Berlin, with markers ***
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
};
