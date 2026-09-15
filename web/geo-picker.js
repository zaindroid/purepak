// Reusable address picker: Google Places Autocomplete on a text input, plus
// an optional small map with a draggable pin for manually setting or
// nudging the exact delivery location. Fully optional at every step —
// manual free-text address entry always works with or without this; when
// no pin is ever set, the server's own best-effort geocoding (full address,
// then area, then a sector pulled from the address text) fills in an
// approximate location later. This file only adds an exact-location
// shortcut on top of that, it never replaces the manual text field.
//
// Usage: GeoPicker.attach({ addressInput, mapContainer, pinBtn, onChange })
// onChange(lat, lng) fires whenever a location is picked or the pin moves;
// pass lat=null,lng=null is never sent — GeoPicker simply never calls
// onChange until there's a real location.
(function () {
  'use strict';
  // Maps JavaScript API + Places API (New) key, restricted by HTTP referrer
  // to purepak.zaindroid.me — same purepak-6472b Google Cloud project as
  // Google Sign-In. Public API keys like this are meant to ship in client
  // code; the referrer restriction (not secrecy) is what protects it.
  var KEY = '';
  var DEFAULT_CENTER = { lat: 33.6844, lng: 73.0479 }; // Islamabad — sensible default, user can pan/drag anywhere
  var loadPromise = null;

  function loadGoogleMaps() {
    if (!KEY) return Promise.reject(new Error('no key configured'));
    if (loadPromise) return loadPromise;
    loadPromise = new Promise(function (resolve, reject) {
      if (window.google && window.google.maps && window.google.maps.places) return resolve();
      var cbName = '__geoPickerCb' + Date.now();
      window[cbName] = function () { delete window[cbName]; resolve(); };
      var s = document.createElement('script');
      s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(KEY) +
        '&libraries=places&callback=' + cbName + '&loading=async';
      s.async = true;
      s.onerror = function () { reject(new Error('Google Maps failed to load')); };
      document.head.appendChild(s);
    });
    return loadPromise;
  }

  // opts: { addressInput, mapContainer, pinBtn, onChange(lat,lng), initial?: {lat,lng} }
  function attach(opts) {
    if (!KEY || !opts || !opts.addressInput) return; // silently no-op — plain manual entry keeps working
    loadGoogleMaps().then(function () { setup(opts); }).catch(function () {
      // key missing/invalid/network blocked — the address field is a normal
      // text input either way, so there's nothing to roll back
    });
  }

  function setup(opts) {
    var addressInput = opts.addressInput;
    var mapEl = opts.mapContainer;
    var pinBtn = opts.pinBtn;
    var picked = opts.initial && Number.isFinite(opts.initial.lat) ? { lat: opts.initial.lat, lng: opts.initial.lng } : null;
    var map = null, marker = null;

    function fireChange() {
      if (picked && typeof opts.onChange === 'function') opts.onChange(picked.lat, picked.lng);
    }

    function ensureMap(center) {
      if (map) return;
      mapEl.hidden = false;
      map = new google.maps.Map(mapEl, {
        center: center || picked || DEFAULT_CENTER,
        zoom: picked ? 16 : 12,
        streetViewControl: false, mapTypeControl: false, fullscreenControl: false,
      });
      marker = new google.maps.Marker({
        position: picked || center || DEFAULT_CENTER,
        map: map, draggable: true,
      });
      marker.addListener('dragend', function () {
        var p = marker.getPosition();
        picked = { lat: p.lat(), lng: p.lng() };
        fireChange();
      });
      map.addListener('click', function (e) {
        picked = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        marker.setPosition(picked);
        fireChange();
      });
    }

    function setPin(loc, zoom) {
      picked = loc;
      ensureMap(loc);
      map.panTo(loc);
      if (zoom) map.setZoom(zoom);
      marker.setPosition(loc);
      fireChange();
    }

    var autocomplete = new google.maps.places.Autocomplete(addressInput, {
      componentRestrictions: { country: 'pk' },
      fields: ['formatted_address', 'geometry', 'name'],
    });
    autocomplete.addListener('place_changed', function () {
      var place = autocomplete.getPlace();
      if (!place || !place.geometry || !place.geometry.location) return; // user typed & hit enter without picking — stays manual
      var loc = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
      if (place.formatted_address) addressInput.value = place.formatted_address;
      setPin(loc, 17);
    });

    if (pinBtn) {
      pinBtn.hidden = false;
      pinBtn.addEventListener('click', function () {
        if (mapEl.hidden === false) { mapEl.hidden = true; return; }
        if (navigator.geolocation) {
          pinBtn.disabled = true;
          navigator.geolocation.getCurrentPosition(function (pos) {
            pinBtn.disabled = false;
            setPin({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 16);
          }, function () {
            pinBtn.disabled = false;
            ensureMap(picked || DEFAULT_CENTER); // no location permission — just open the map to drop a pin by hand
          }, { timeout: 6000 });
        } else {
          ensureMap(picked || DEFAULT_CENTER);
        }
      });
    }

    if (picked) ensureMap(picked);
  }

  window.GeoPicker = { attach: attach };
})();
