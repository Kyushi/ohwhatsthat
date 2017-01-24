# Oh, what's there? #

A knockout.js map project. Proof of concept demo.
View live version here: http://ohwhatsthere.franziskusnakajima.net/ (May not always be latest version)

___

### Description: ###

Map of lakes in Berlin, making use of Berlin city's own api endpoints (due to lack of CORS support, http://cors-anywhere.herokuapp.com/ is used), together with information retrieved via the Wikipedia api, as well as images loaded via tumblr api by tag.

### Requirements ###

* Web browser capable of running javascript

### Technologies used ###

* HTML
* CSS
* Javascript
* SASS
* Knockout.js
* jQuery

### APIs used ###

* Google Maps Javascript API (https://developers.google.com/maps/documentation/javascript/)
* Wikipedia API (https://www.mediawiki.org/wiki/API:Main_page)
* ~~Tumblr API (https://www.tumblr.com/docs/en/api/v2)~~
* Berlin Open Data API (https://daten.berlin.de/datensaetze/liste-der-badestellen)
* http://cors-anywhere.herokuapp.com/ for retrieving non-CORS Berlin Open Data (Massive thanks!)

### TODO: ###

* Responsive styling for larger screens
* Get images from wikipedia (?)
