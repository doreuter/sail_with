// necessary variables
var map;
var infoWindow;
var markerCluster;

// markersData variable stores the information necessary to each marker
var markersData = [
    {
        lat: 40.6386333,
        lng: -8.745,
        name: "Bohemian",
        address1:"485 Clawson St, Staten Island, NY 10306",
        address2: "Praia da Barra",
        postalCode: "3830-772 Gafanha da Nazaré" // don't insert comma in the last item of each marker
    }
];


function initialize() {
    var mapOptions = {
        center: new google.maps.LatLng(40.601203,-8.668173),
        zoom: 9,
        mapTypeId: 'roadmap',
        scrollwheel: false,
        styles: [{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#e0e0e0"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#46bcec"},{"visibility":"on"}]}]
    };

    var mapClass = $('.google-map-contact');
    map = new google.maps.Map(mapClass[0], mapOptions);

    // a new Info Window is created
    infoWindow = new google.maps.InfoWindow({
        padding: 0,
        borderRadius: 5
    });

    // Event that closes the Info Window with a click on the map
    google.maps.event.addListener(map, 'click', function() {
        infoWindow.close();
    });

    // Finally displayMarkers() function is called to begin the markers creation
    displayMarkers();

}
google.maps.event.addDomListener(window, 'load', initialize);


// This function will iterate over markersData array
// creating markers with createMarker function
function displayMarkers(){

    // this variable sets the map bounds according to markers position
    var bounds = new google.maps.LatLngBounds();

    // for loop traverses markersData array calling createMarker function for each marker
    for (var i = 0; i < markersData.length; i++){

        var latlng = new google.maps.LatLng(markersData[i].lat, markersData[i].lng);
        var name = markersData[i].name;
        var address1 = markersData[i].address1;
        var address2 = markersData[i].address2;
        var postalCode = markersData[i].postalCode;

        createMarker(latlng, name, address1, address2, postalCode);

        // marker position is added to bounds variable
        bounds.extend(latlng);
    }

    // Finally the bounds variable is used to set the map bounds
    // with fitBounds() function
    map.fitBounds(bounds);
}

// This function creates each marker and it sets their Info Window content
function createMarker(latlng, name, address1, address2, postalCode){

    var marker = new google.maps.Marker({
        map: map,
        position: latlng,
        title: name,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#ffffff',
            fillOpacity: 1,
            strokeColor: '#ff5b61',
            strokeWeight: 7
        }

    });

    // This event expects a click on a marker
    // When this event is fired the Info Window content is created
    // and the Info Window is opened.

    google.maps.event.addListener(marker, 'click', function() {

        // Creating the content to be inserted in the infowindow
        var iwContent = '<div class="thumbnail listing-item" style="width: 250px;">' +
          '<div class="caption">' +
          '<h5 class="text-regular clearfix m-b-n m-t-n">' +
          '<a href="listing-item.html" class="text-dark">' + name + '</a>' +
          '</h5>' +
          '<p class="small open-sans-font text-regular"> '+ address1 +'</p>' +
            '</div>';

        // including content to the Info Window.
        infoWindow.setContent(iwContent);

        // opening the Info Window in the current map and at the current marker location.
        infoWindow.open(map, marker);

    });
}