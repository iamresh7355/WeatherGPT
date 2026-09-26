/* =========================================================
   WEATHERGPT - CYBERSMITH
   ========================================================= */


/* =========================
   GLOBAL VARIABLES
========================= */

let currentWeather = null;
let currentLocation = {
  name: "Lucknow",
  country: "India",
  latitude: 26.8467,
  longitude: 80.9462
};

let map;
let marker;


/* =========================
   WEATHER CODE
========================= */

function getWeatherInfo(code) {

  const weather = {
    0: ["☀️", "Clear Sky"],
    1: ["🌤️", "Mainly Clear"],
    2: ["⛅", "Partly Cloudy"],
    3: ["☁️", "Overcast"],

    45: ["🌫️", "Fog"],
    48: ["🌫️", "Rime Fog"],

    51: ["🌦️", "Light Drizzle"],
    53: ["🌦️", "Drizzle"],
    55: ["🌧️", "Heavy Drizzle"],

    61: ["🌦️", "Light Rain"],
    63: ["🌧️", "Moderate Rain"],
    65: ["🌧️", "Heavy Rain"],

    71: ["🌨️", "Light Snow"],
    73: ["❄️", "Snow"],
    75: ["❄️", "Heavy Snow"],

    80: ["🌦️", "Rain Showers"],
    81: ["🌧️", "Rain Showers"],
    82: ["⛈️", "Heavy Rain Showers"],

    95: ["⛈️", "Thunderstorm"],
    96: ["⛈️", "Thunderstorm + Hail"],
    99: ["⛈️", "Severe Thunderstorm"]
  };

  return weather[code] || ["🌤️", "Unknown"];
}


/* =========================
   DOM ELEMENTS
========================= */

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const micBtn = document.getElementById("micBtn");
const locationBtn = document.getElementById("locationBtn");

const statusBox = document.getElementById("status");
const suggestions = document.getElementById("suggestions");
const voiceStatus = document.getElementById("voiceStatus");

const cityName = document.getElementById("cityName");
const countryName = document.getElementById("countryName");

const temperature = document.getElementById("temperature");
const condition = document.getElementById("condition");
const weatherIcon = document.getElementById("weatherIcon");

const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const rainChance = document.getElementById("rainChance");

const feelsLike = document.getElementById("feelsLike");

const sunrise = document.getElementById("sunrise");
const sunset = document.getElementById("sunset");

const forecastGrid = document.getElementById("forecastGrid");

const questionInput = document.getElementById("questionInput");
const askBtn = document.getElementById("askBtn");
const aiAnswer = document.getElementById("aiAnswer");

const aqi = document.getElementById("aqi");
const pm25 = document.getElementById("pm25");
const pm10 = document.getElementById("pm10");
const no2 = document.getElementById("no2");
const o3 = document.getElementById("o3");

const farmTitle = document.getElementById("farmTitle");
const farmAdvice = document.getElementById("farmAdvice");

const alertsBox = document.getElementById("alertsBox");


/* =========================
   INITIALIZE MAP
========================= */

function initializeMap() {

  map = L.map("map").setView(
    [
      currentLocation.latitude,
      currentLocation.longitude
    ],
    10
  );

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: "&copy; OpenStreetMap contributors"
    }
  ).addTo(map);

  marker = L.marker([
    currentLocation.latitude,
    currentLocation.longitude
  ]).addTo(map);

  marker.bindPopup(
    `<b>${currentLocation.name}</b><br>Weather location`
  );
}


/* =========================
   UPDATE MAP
========================= */

function updateMap(lat, lon, name) {

  if (!map) {
    return;
  }

  map.setView([lat, lon], 10);

  marker.setLatLng([lat, lon]);

  marker
    .bindPopup(
      `<b>${name}</b><br>Selected weather location`
    )
    .openPopup();
}


/* =========================
   SEARCH LOCATION
========================= */

async function searchLocation(query) {

  if (!query || query.trim().length < 2) {
    return;
  }

  statusBox.textContent = "Searching location...";

  try {

    const url =
      `https://geocoding-api.open-meteo.com/v1/search?` +
      `name=${encodeURIComponent(query)}` +
      `&count=5&language=en&format=json`;

    const response = await fetch(url);

    const data = await response.json();

    if (!data.results || data.results.length === 0) {

      statusBox.textContent =
        "Location not found. Try another city.";

      return;
    }

    showSuggestions(data.results);

  } catch (error) {

    console.error(error);

    statusBox.textContent =
      "Unable to search location.";
  }
}


/* =========================
   SUGGESTIONS
========================= */

function showSuggestions(results) {

  suggestions.innerHTML = "";

  results.forEach(place => {

    const item = document.createElement("div");

    item.className = "suggestion";

    item.innerHTML = `
      <strong>${place.name}</strong>
      <br>
      <small>
        ${place.admin1 || ""}
        ${place.country ? ", " + place.country : ""}
      </small>
    `;

    item.addEventListener("click", () => {

      currentLocation = {
        name: place.name,
        country: place.country || "",
        latitude: place.latitude,
        longitude: place.longitude
      };

      searchInput.value = place.name;

      suggestions.style.display = "none";

      loadWeather();
    });

    suggestions.appendChild(item);
  });

  suggestions.style.display = "block";

  statusBox.textContent =
    "Select a location from the suggestions.";
}


/* =========================
   LOAD WEATHER
========================= */

async function loadWeather() {

  const {
    latitude,
    longitude
  } = currentLocation;

  statusBox.textContent =
    `Loading weather for ${currentLocation.name}...`;

  try {

    const url =
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${latitude}` +
      `&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&hourly=precipitation_probability` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max` +
      `&timezone=auto` +
      `&forecast_days=7`;

    const response = await fetch(url);

    const data = await response.json();

    currentWeather = data;

    updateCurrentWeather(data);

    updateForecast(data);

    updateFarming(data);

    updateAlerts(data);

    loadAirQuality();

    updateMap(
      latitude,
      longitude,
      currentLocation.name
    );

    statusBox.textContent =
      `Weather updated for ${currentLocation.name}`;

  } catch (error) {

    console.error(error);

    statusBox.textContent =
      "Unable to load weather data.";
  }
}


/* =========================
   CURRENT WEATHER
========================= */

function updateCurrentWeather(data) {

  const current = data.current;

  const info = getWeatherInfo(
    current.weather_code
  );

  weatherIcon.textContent = info[0];

  condition.textContent = info[1];

  temperature.textContent =
    `${Math.round(current.temperature_2m)}°C`;

  feelsLike.textContent =
    `${Math.round(current.apparent_temperature)}°C`;

  humidity.textContent =
    `${current.relative_humidity_2m}%`;

  wind.textContent =
    `${Math.round(current.wind_speed_10m)} km/h`;

  const rain =
    data.daily.precipitation_probability_max[0];

  rainChance.textContent =
    `${rain ?? 0}%`;

  cityName.textContent =
    currentLocation.name;

  countryName.textContent =
    currentLocation.country;

  sunrise.textContent =
    formatTime(data.daily.sunrise[0]);

  sunset.textContent =
    formatTime(data.daily.sunset[0]);
}


/* =========================
   TIME FORMAT
========================= */

function formatTime(value) {

  if (!value) {
    return "--";
  }

  const date = new Date(value);

  return date.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}


/* =========================
   FORECAST
========================= */

function updateForecast(data) {

  forecastGrid.innerHTML = "";

  for (let i = 0; i < 7; i++) {

    const info = getWeatherInfo(
      data.daily.weather_code[i]
    );

    const date =
      new Date(
        data.daily.time[i]
      );

    const day =
      date.toLocaleDateString(
        "en-IN",
        {
          weekday: "short"
        }
      );

    const max =
      Math.round(
        data.daily.temperature_2m_max[i]
      );

    const min =
      Math.round(
        data.daily.temperature_2m_min[i]
      );

    const rain =
      data.daily.precipitation_probability_max[i] || 0;

    const card =
      document.createElement("div");

    card.className =
      "forecast-card";

    card.innerHTML = `
      <div class="forecast-day">
        ${i === 0 ? "Today" : day}
      </div>

      <div class="forecast-icon">
        ${info[0]}
      </div>

      <div>
        ${info[1]}
      </div>

      <div class="forecast-temp">
        ${max}° / ${min}°
      </div>

      <div class="forecast-rain">
        💧 ${rain}% rain
      </div>
    `;

    forecastGrid.appendChild(card);
  }
}


/* =========================
   AIR QUALITY
========================= */

async function loadAirQuality() {

  try {

    const {
      latitude,
      longitude
    } = currentLocation;

    const url =
      `https://air-quality-api.open-meteo.com/v1/air-quality?` +
      `latitude=${latitude}` +
      `&longitude=${longitude}` +
      `&current=pm10,pm2_5,nitrogen_dioxide,ozone,european_aqi` +
      `&timezone=auto`;

    const response =
      await fetch(url);

    const data =
      await response.json();

    if (!data.current) {
      return;
    }

    aqi.textContent =
      Math.round(
        data.current.european_aqi ?? 0
      );

    pm25.textContent =
      `${Math.round(data.current.pm2_5 ?? 0)} µg/m³`;

    pm10.textContent =
      `${Math.round(data.current.pm10 ?? 0)} µg/m³`;

    no2.textContent =
      `${Math.round(data.current.nitrogen_dioxide ?? 0)} µg/m³`;

    o3.textContent =
      `${Math.round(data.current.ozone ?? 0)} µg/m³`;

  } catch (error) {

    console.error(
      "Air quality error:",
      error
    );
  }
}


/* =========================
   FARMING ASSISTANT
========================= */

function updateFarming(data) {

  const temp =
    data.current.temperature_2m;

  const rain =
    data.daily.precipitation_probability_max[0] || 0;

  if (rain >= 70) {

    farmTitle.textContent =
      "Rain Expected";

    farmAdvice.textContent =
      "Heavy rainfall may be expected. Avoid unnecessary irrigation and consider protecting harvested crops from rain.";

  } else if (temp >= 35) {

    farmTitle.textContent =
      "High Temperature";

    farmAdvice.textContent =
      "High temperature detected. Irrigate crops during cooler hours, preferably early morning or evening.";

  } else if (temp <= 10) {

    farmTitle.textContent =
      "Cold Conditions";

    farmAdvice.textContent =
      "Low temperature detected. Sensitive crops may need protection from cold conditions.";

  } else {

    farmTitle.textContent =
      "Suitable Weather";

    farmAdvice.textContent =
      "Current weather conditions appear generally suitable for normal agricultural activities. Continue monitoring rainfall and temperature.";
  }
}


/* =========================
   WEATHER ALERTS
========================= */

function updateAlerts(data) {

  const current =
    data.current;

  const temp =
    current.temperature_2m;

  const windSpeed =
    current.wind_speed_10m;

  const code =
    current.weather_code;

  const rain =
    data.daily.precipitation_probability_max[0] || 0;

  let alerts = [];

  if (windSpeed >= 50) {

    alerts.push(`
      <div class="danger-alert">
        🌪️ <strong>Strong Wind Alert:</strong>
        Wind speed is around ${Math.round(windSpeed)} km/h.
        Stay cautious in exposed areas.
      </div>
    `);
  }

  if (rain >= 80) {

    alerts.push(`
      <div class="warning-alert">
        🌧️ <strong>Heavy Rain Possibility:</strong>
        Rain probability is around ${rain}%.
        Carry rain protection and monitor local advisories.
      </div>
    `);
  }

  if ([95, 96, 99].includes(code)) {

    alerts.push(`
      <div class="danger-alert">
        ⛈️ <strong>Thunderstorm Alert:</strong>
        Thunderstorm conditions are currently detected.
        Stay indoors and avoid exposed areas.
      </div>
    `);
  }

  if (temp >= 40) {

    alerts.push(`
      <div class="danger-alert">
        🔥 <strong>High Temperature:</strong>
        Temperature is around ${Math.round(temp)}°C.
        Stay hydrated and avoid prolonged outdoor exposure.
      </div>
    `);
  }

  if (temp <= 5) {

    alerts.push(`
      <div class="warning-alert">
        ❄️ <strong>Cold Weather:</strong>
        Temperature is around ${Math.round(temp)}°C.
      </div>
    `);
  }

  if (alerts.length === 0) {

    alertsBox.innerHTML = `
      <div class="safe-alert">
        ✅ <strong>No major weather alert detected.</strong>
        Continue monitoring local weather conditions.
      </div>
    `;

  } else {

    alertsBox.innerHTML =
      alerts.join("");
  }
}


/* =========================
   ASK WEATHERGPT
========================= */

function answerQuestion(question) {

  if (!currentWeather) {

    return "Please wait while weather data is loading.";
  }

  const q =
    question.toLowerCase().trim();

  const current =
    currentWeather.current;

  const temp =
    Math.round(current.temperature_2m);

  const humidityValue =
    current.relative_humidity_2m;

  const windValue =
    Math.round(current.wind_speed_10m);

  const rain =
    currentWeather.daily
      .precipitation_probability_max[0] || 0;

  const code =
    current.weather_code;

  const info =
    getWeatherInfo(code);

  if (
    q.includes("rain") ||
    q.includes("barish") ||
    q.includes("बारिश")
  ) {

    if (rain >= 60) {

      return `
        🌧️ There is a higher chance of rain today in
        <strong>${currentLocation.name}</strong>.
        Rain probability is around <strong>${rain}%</strong>.
      `;
    }

    return `
      ☀️ The chance of rain today in
      <strong>${currentLocation.name}</strong>
      is around <strong>${rain}%</strong>.
    `;
  }


  if (
    q.includes("temperature") ||
    q.includes("temp") ||
    q.includes("garmi") ||
    q.includes("degree")
  ) {

    return `
      🌡️ The current temperature in
      <strong>${currentLocation.name}</strong>
      is <strong>${temp}°C</strong>.
      It feels like approximately
      <strong>${Math.round(current.apparent_temperature)}°C</strong>.
    `;
  }


  if (
    q.includes("wind") ||
    q.includes("hawa")
  ) {

    return `
      💨 Wind speed in
      <strong>${currentLocation.name}</strong>
      is approximately <strong>${windValue} km/h</strong>.
    `;
  }


  if (
    q.includes("humidity") ||
    q.includes("moisture") ||
    q.includes("nami")
  ) {

    return `
      💧 Current humidity in
      <strong>${currentLocation.name}</strong>
      is <strong>${humidityValue}%</strong>.
    `;
  }


  if (
    q.includes("farming") ||
    q.includes("farm") ||
    q.includes("crop") ||
    q.includes("kheti")
  ) {

    return `
      🌾 Based on the current weather in
      <strong>${currentLocation.name}</strong>,
      farmers should monitor temperature, rainfall
      and wind conditions before irrigation,
      spraying or harvesting.
    `;
  }


  if (
    q.includes("alert") ||
    q.includes("warning") ||
    q.includes("danger")
  ) {

    if (
      windValue >= 50 ||
      rain >= 80 ||
      [95,96,99].includes(code) ||
      temp >= 40
    ) {

      return `
        🚨 Weather conditions may require caution in
        <strong>${currentLocation.name}</strong>.
        Please check the Weather Alerts section above.
      `;
    }

    return `
      ✅ No major weather warning is currently detected
      for <strong>${currentLocation.name}</strong>.
    `;
  }


  if (
    q.includes("weather") ||
    q.includes("mausam") ||
    q.includes("condition")
  ) {

    return `
      🌤️ Current weather in
      <strong>${currentLocation.name}</strong>:
      <strong>${info[1]}</strong>,
      temperature <strong>${temp}°C</strong>,
      humidity <strong>${humidityValue}%</strong>,
      wind <strong>${windValue} km/h</strong>.
    `;
  }


  if (
    q.includes("tomorrow") ||
    q.includes("kal")
  ) {

    const tomorrowInfo =
      getWeatherInfo(
        currentWeather.daily.weather_code[1]
      );

    const tomorrowMax =
      Math.round(
        currentWeather.daily.temperature_2m_max[1]
      );

    const tomorrowMin =
      Math.round(
        currentWeather.daily.temperature_2m_min[1]
      );

    return `
      📅 Tomorrow in
      <strong>${currentLocation.name}</strong>:
      ${tomorrowInfo[0]}
      ${tomorrowInfo[1]},
      temperature around
      <strong>${tomorrowMax}°C / ${tomorrowMin}°C</strong>.
    `;
  }


  return `
    🤖 I can help with questions about
    <strong>${currentLocation.name}</strong> such as:
    rain, temperature, wind, humidity,
    farming, alerts and tomorrow's weather.
  `;
}


/* =========================
   ASK BUTTON
========================= */

function askWeather() {

  const question =
    questionInput.value.trim();

  if (!question) {

    aiAnswer.textContent =
      "Please type a weather question.";

    return;
  }

  aiAnswer.innerHTML =
    answerQuestion(question);
}

askBtn.addEventListener(
  "click",
  askWeather
);

questionInput.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {
      askWeather();
    }

  }
);


/* =========================
   QUICK QUESTIONS
========================= */

document
  .querySelectorAll(".quick-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        questionInput.value =
          button.dataset.question;

        askWeather();
      }
    );

  });


/* =========================
   SEARCH BUTTON
========================= */

searchBtn.addEventListener(
  "click",
  () => {

    const query =
      searchInput.value.trim();

    if (query) {
      searchLocation(query);
    }

  }
);


/* =========================
   SEARCH ENTER
========================= */

searchInput.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {

      const query =
        searchInput.value.trim();

      if (query) {
        searchLocation(query);
      }
    }

  }
);


/* =========================
   LIVE SUGGESTIONS
========================= */

let searchTimer;

searchInput.addEventListener(
  "input",
  () => {

    clearTimeout(searchTimer);

    const query =
      searchInput.value.trim();

    if (query.length < 3) {

      suggestions.style.display =
        "none";

      return;
    }

    searchTimer =
      setTimeout(
        () => searchLocation(query),
        500
      );
  }
);


/* =========================
   MY LOCATION
========================= */

locationBtn.addEventListener(
  "click",
  () => {

    if (!navigator.geolocation) {

      alert(
        "Geolocation is not supported by your browser."
      );

      return;
    }

    statusBox.textContent =
      "Detecting your location...";

    navigator.geolocation.getCurrentPosition(

      async position => {

        const lat =
          position.coords.latitude;

        const lon =
          position.coords.longitude;

        currentLocation.latitude =
          lat;

        currentLocation.longitude =
          lon;

        try {

          const response =
            await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
            );

          const data =
            await response.json();

          currentLocation.name =
            data.city ||
            data.locality ||
            data.principalSubdivision ||
            "Current Location";

          currentLocation.country =
            data.countryName || "";

        } catch {

          currentLocation.name =
            "Current Location";

          currentLocation.country =
            "";
        }

        searchInput.value =
          currentLocation.name;

        loadWeather();
      },

      error => {

        console.error(error);

        statusBox.textContent =
          "Location permission denied or unavailable.";

        alert(
          "Please allow location permission in your browser."
        );
      }
    );
  }
);


/* =========================
   MICROPHONE
========================= */

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

if (SpeechRecognition) {

  const recognition =
    new SpeechRecognition();

  recognition.lang =
    "en-IN";

  recognition.continuous =
    false;

  recognition.interimResults =
    false;


  micBtn.addEventListener(
    "click",
    () => {

      try {

        recognition.start();

        micBtn.classList.add(
          "listening"
        );

        voiceStatus.textContent =
          "🎙️ Listening... Speak a city name.";

      } catch (error) {

        console.log(error);
      }
    }
  );


  recognition.onresult =
    event => {

      const transcript =
        event.results[0][0].transcript;

      voiceStatus.textContent =
        `You said: "${transcript}"`;

      const cleaned =
        transcript
          .replace(
            /weather in/gi,
            ""
          )
          .replace(
            /weather of/gi,
            ""
          )
          .replace(
            /temperature in/gi,
            ""
          )
          .trim();

      searchInput.value =
        cleaned;

      if (cleaned) {
        searchLocation(cleaned);
      }
    };


  recognition.onend =
    () => {

      micBtn.classList.remove(
        "listening"
      );
    };


  recognition.onerror =
    event => {

      console.error(
        "Speech recognition error:",
        event.error
      );

      micBtn.classList.remove(
        "listening"
      );

      voiceStatus.textContent =
        "🎙️ Microphone stopped. Please try again.";
    };

} else {

  micBtn.addEventListener(
    "click",
    () => {

      alert(
        "Voice search is not supported in this browser. Please use Google Chrome or Microsoft Edge."
      );

    }
  );
}


/* =========================
   NAVIGATION
========================= */

document
  .querySelectorAll(".nav-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const target =
          document.getElementById(
            button.dataset.target
          );

        if (target) {

          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }

      }
    );

  });


/* =========================
   CLOSE SUGGESTIONS
========================= */

document.addEventListener(
  "click",
  event => {

    if (
      !event.target.closest(".search-box") &&
      !event.target.closest(".suggestions")
    ) {

      suggestions.style.display =
        "none";
    }

  }
);


/* =========================
   START WEBSITE
========================= */

window.addEventListener(
  "load",
  () => {

    initializeMap();

    loadWeather();

  }
);