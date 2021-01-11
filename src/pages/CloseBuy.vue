<template>
  <div class="ui grid" style="height: 100%;">
    <div class="six wide column red">
      <form class="ui segment large form">
        <div class="ui message red" v-show="error">{{ error }}</div>
        <div class="ui segment">
          <div class="field">
            <div class="ui right icon input large" :class="{ loading:spinner }">
              <input type="text" placeholder="Enter your address" v-model="address" id="autcomplete">
              <i class="dot circle link icon" @click="locatorButtonPressed"></i>
            </div>
          </div>
          <div class="field">
            <div class="two fields">
              <div class="field">
                <select name="" id="" v-model="type">
                  <option value="restaurant">Restaurant</option>
                </select>
              </div>
              <div class="field">
                <select name="" id="" v-model="radius">
                  <option value="5">5km</option>
                  <option value="10">10km</option>
                  <option value="15">15km</option>
                  <option value="20">20km</option>
                </select>
              </div>
            </div>
          </div>
          <button type="button" class="ui button" @click="findCloseBuyButtonPressed()">Find Close Buy Places</button>
        </div>
      </form>
      <div class="ui segment" style="max-height:300px;overflow:auto;">
        <div class="ui divided items">
          <div class="item" v-for="(place, index) in places" :key="place.place_id" @click="showinfoWindow(index)" :class="{'active': activeIndex === index}" style="padding:10px;">
            <div class="content">
              <div class="header" v-text="place.name"></div>
              <div class="meta" v-text="place.vicinity"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="ten wide column" ref="map"></div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  data(){
    return {
      key: '',
      error: '',
      address: '',
      spinner: false,
      lat: 0,
      lng: 0,
      type: '',
      radius: '',
      places: [],
      markers: [],
      activeIndex: -1
    };
  },
  mounted() {
    let autocomplete = new google.maps.places.Autocomplete(
      document.getElementById('autcomplete'),
      {
        bounds: new google.maps.LatLngBounds(
          new google.maps.LatLng(21.0181, -101.258)
        )
      }
    );
    autocomplete.addListener("place_changed", () => {
      let place = autocomplete.getPlace();
      this.lat = place.geometry.location.lat();
      this.lng = place.geometry.location.lng();
      this.showUserLocationOnTheMap(this.lat, this.lng);
    });
  },
  methods: {
    locatorButtonPressed() {
      this.spinner = true;
      if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(position => {
          this.lat = position.coords.latitude;
          this.lng = position.coords.longitude;
          this.getAddressFrom(this.lat, this.lng);
          this.showUserLocationOnTheMap(this.lat, this.lng);
        }, error => {
          this.error = "Locator is unable to find your address. Please type your address manually.";
          this.spinner = false;
        });
      }else{
        this.error = error.message;
        this.spinner = false;
      }
    },
    getAddressFrom(lat, long){
      axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${this.key}`).then(response => {
        if(response.data.error_message){
          this.error = response.data.error_message;
        }else{
          this.address = response.data.results[0].formatted_address;
        }
      }).catch(error => {
        this.error = error.message;
      });
    },
    showUserLocationOnTheMap(latitude, longitude){
      let map = new google.maps.Map(this.$refs["map"],{
        zoom: 15,
        center: new google.maps.LatLng(latitude, longitude),
        mapTypeId: google.maps.MapTypeId.ROADMAP
      });
      new google.maps.Marker({
        position: new google.maps.LatLng(latitude, longitude),
        map: map
      });
    },
    findCloseBuyButtonPressed() {
      const URL = `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${this.lat},${this.lng}&radius=${this.radius*1000}&types=${this.type}&key=${this.key}`;
      axios.get(URL).then(response => {
        this.places = response.data.results;
        console.log(this.places);
        this.showPlacesOnMap();
      }).catch(error => {
        console.log(error)
        this.error = error.message;
      });
    },
    showPlacesOnMap(){
      const map = new google.maps.Map(this.$refs["map"],{
        zoom: 15,
        center: new google.maps.LatLng(this.lat, this.lng),
        mapTypeId: google.maps.MapTypeId.ROADMAP
      });

      const infoWindow = new google.maps.InfoWindow();

      for (let i =0;i<this.places.length;i++){
        const lat = this.places[i].geometry.location.lat;
        const lng = this.places[i].geometry.location.lng;
        const placeId = this.places[i].place_id;
        const marker = new google.maps.Marker({
          position: new google.maps.LatLng(lat, lng),
          map: map,
        });
        this.markers.push(marker);
        google.maps.event.addListener(marker, "click", () => {
          const URL = `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/details/json?key=${this.key}&place_id=${placeId}`;
          axios.get(URL).then(response => {
            console.log(response);
            if(response.data.error_message) {
              this.error = response.data.error_message;
            } else {
              const place = response.data.result;
              infoWindow.setContent(`<div class="ui header">${place.name}</div>
                                    <div v-if="${place.formatted_address!==undefined}">${place.formatted_address}</div>
                                    <div v-if="${place.formatted_phone_number!==undefined}">${place.formatted_phone_number}</div>
                                    <a href="${place.website}" target="_blank">${place.website}</a>`);
              infoWindow.open(map, marker);
            }
          }).catch(error => {
            this.error = error.message;
          });
        });
      }
    },
    showinfoWindow(index) {
      this.activeIndex = index;
      new google.maps.event.trigger(this.markers[index], 'click');
    }
  }
}
</script>
<style>
.ui.button,
.circle.icon{
  background-color: #ff5a5f;
  color: #fff;
}
.pac-icon{
  display: none;
}
.pac-item{
  padding: 10px;
  font-size: 16px;
  cursor: pointer;
}
.pac-item:hover{
  background-color: #ececec;
}
#map{
  height: 100vh;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: teal;
}
.active {
  background:#ff5a5f!important;
}
</style>
