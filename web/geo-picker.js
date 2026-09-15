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
  // to purepak.zaindroid.me and *.purepak.com.pk — same purepak-6472b
  // Google Cloud project as Google Sign-In. Public API keys like this are
  // meant to ship in client code; the referrer restriction (not secrecy)
  // is what protects it.
  var KEY = 'AIzaSyC7Pufybzoh8WsFKvV5raCwbJZ2bqtrNFg';
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

    // google.maps.places.Autocomplete (the old attach-to-an-<input> widget)
    // was cut off from new API customers on 2025-03-01, so this uses the
    // current Autocomplete Data API instead: fetch suggestions ourselves and
    // render our own dropdown, rather than a Google-owned widget replacing
    // the input.
    var sessionToken = null;
    var dropdown = null, activeIndex = -1, currentSuggestions = [];

    function closeDropdown() {
      if (dropdown) { dropdown.remove(); dropdown = null; }
      activeIndex = -1; currentSuggestions = [];
    }
    function setActive(items) {
      items.forEach(function (it, i) { it.classList.toggle('active', i === activeIndex); });
    }
    function renderDropdown(suggestions) {
      closeDropdown();
      var preds = suggestions.filter(function (s) { return s.placePrediction; });
      if (!preds.length) return;
      currentSuggestions = preds;
      dropdown = document.createElement('div');
      dropdown.className = 'geo-suggest';
      preds.forEach(function (s, i) {
        var item = document.createElement('div');
        item.className = 'geo-suggest-item';
        item.textContent = s.placePrediction.text.text;
        // mousedown (not click) fires before the input's blur, so the
        // dropdown doesn't close itself out from under the click
        item.addEventListener('mousedown', function (e) { e.preventDefault(); selectSuggestion(s); });
        dropdown.appendChild(item);
      });
      addressInput.insertAdjacentElement('afterend', dropdown);
    }
    async function selectSuggestion(s) {
      closeDropdown();
      try {
        var place = s.placePrediction.toPlace();
        await place.fetchFields({ fields: ['formattedAddress', 'location'] });
        if (place.formattedAddress) addressInput.value = place.formattedAddress;
        if (place.location) setPin({ lat: place.location.lat(), lng: place.location.lng() }, 17);
      } catch (e) {
        // fetchFields failed — the address text the user picked is still
        // sitting in the input either way, so manual submission still works
      }
      sessionToken = null; // a picked place ends the billing session; next keystroke starts a fresh one
    }
    var debounceTimer = null;
    addressInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      var text = addressInput.value.trim();
      if (text.length < 3) { closeDropdown(); return; }
      debounceTimer = setTimeout(async function () {
        try {
          if (!sessionToken) sessionToken = new google.maps.places.AutocompleteSessionToken();
          var res = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: text, sessionToken: sessionToken, includedRegionCodes: ['pk'],
          });
          renderDropdown((res && res.suggestions) || []);
        } catch (e) { closeDropdown(); } // API hiccup — typed text is still a perfectly valid manual address
      }, 300);
    });
    addressInput.addEventListener('blur', function () { setTimeout(closeDropdown, 150); });
    addressInput.addEventListener('keydown', function (e) {
      if (!dropdown) return;
      var items = dropdown.querySelectorAll('.geo-suggest-item');
      if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, items.length - 1); setActive(items); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); setActive(items); }
      else if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); selectSuggestion(currentSuggestions[activeIndex]); }
      else if (e.key === 'Escape') { closeDropdown(); }
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
