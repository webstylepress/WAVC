const form = document.getElementById('weatherForm');
const cityInput = document.getElementById('cityInput');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const results = document.getElementById('results');
const errorMessage = document.getElementById('errorMessage');
const loadingSpinner = document.getElementById('loadingSpinner');

const cityName = document.getElementById('cityName');
const country = document.getElementById('country');
const weatherIcon = document.getElementById('weatherIcon');
const temperature = document.getElementById('temperature');
const condition = document.getElementById('condition');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');

const WMO_CODES = {
  0:  { description: 'Clear sky',             icon: '\u2600\uFE0F' },
  1:  { description: 'Mainly clear',          icon: '\uD83C\uDF24\uFE0F' },
  2:  { description: 'Partly cloudy',         icon: '\u26C5' },
  3:  { description: 'Overcast',              icon: '\u2601\uFE0F' },
  45: { description: 'Foggy',                 icon: '\uD83C\uDF2B\uFE0F' },
  48: { description: 'Depositing rime fog',   icon: '\uD83C\uDF2B\uFE0F' },
  51: { description: 'Light drizzle',         icon: '\uD83C\uDF26\uFE0F' },
  53: { description: 'Moderate drizzle',      icon: '\uD83C\uDF26\uFE0F' },
  55: { description: 'Dense drizzle',         icon: '\uD83C\uDF26\uFE0F' },
  56: { description: 'Light freezing drizzle',icon: '\uD83C\uDF27\uFE0F' },
  57: { description: 'Dense freezing drizzle', icon: '\uD83C\uDF27\uFE0F' },
  61: { description: 'Slight rain',           icon: '\uD83C\uDF27\uFE0F' },
  63: { description: 'Moderate rain',         icon: '\uD83C\uDF27\uFE0F' },
  65: { description: 'Heavy rain',            icon: '\uD83C\uDF27\uFE0F' },
  66: { description: 'Light freezing rain',   icon: '\uD83C\uDF27\uFE0F' },
  67: { description: 'Heavy freezing rain',   icon: '\uD83C\uDF27\uFE0F' },
  71: { description: 'Slight snow',           icon: '\uD83C\uDF28\uFE0F' },
  73: { description: 'Moderate snow',         icon: '\uD83C\uDF28\uFE0F' },
  75: { description: 'Heavy snow',            icon: '\uD83C\uDF28\uFE0F' },
  77: { description: 'Snow grains',           icon: '\u2744\uFE0F' },
  80: { description: 'Slight rain showers',   icon: '\uD83C\uDF26\uFE0F' },
  81: { description: 'Moderate rain showers', icon: '\uD83C\uDF26\uFE0F' },
  82: { description: 'Violent rain showers',  icon: '\uD83C\uDF26\uFE0F' },
  85: { description: 'Slight snow showers',   icon: '\uD83C\uDF28\uFE0F' },
  86: { description: 'Heavy snow showers',    icon: '\uD83C\uDF28\uFE0F' },
  95: { description: 'Thunderstorm',          icon: '\u26C8\uFE0F' },
  96: { description: 'Thunderstorm with hail', icon: '\u26C8\uFE0F' },
  99: { description: 'Thunderstorm with hail', icon: '\u26C8\uFE0F' },
};

function getWeatherInfo(code) {
  return WMO_CODES[code] || { description: 'Unknown', icon: '\u2753' };
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.classList.remove('hidden');
  results.classList.add('hidden');
  loadingSpinner.classList.add('hidden');
}

function hideError() {
  errorMessage.classList.add('hidden');
}

function setLoading(loading) {
  if (loading) {
    loadingSpinner.classList.remove('hidden');
    submitBtn.disabled = true;
    results.classList.add('hidden');
    hideError();
  } else {
    loadingSpinner.classList.add('hidden');
    submitBtn.disabled = false;
  }
}

async function fetchWeather(city) {
  if (!city.trim()) {
    showError('Please enter a city name.');
    return;
  }

  setLoading(true);
  hideError();

  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      showError(`City "${city}" not found. Please check the spelling and try again.`);
      setLoading(false);
      return;
    }

    const { latitude, longitude, name, country: c, admin1 } = geoData.results[0];

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
    );
    const weatherData = await weatherRes.json();

    if (!weatherData.current) {
      showError('Unable to retrieve weather data. Please try again.');
      setLoading(false);
      return;
    }

    displayWeather({
      city: name,
      region: admin1 || '',
      country: c || '',
      temp: weatherData.current.temperature_2m,
      feelsLike: weatherData.current.apparent_temperature,
      humidity: weatherData.current.relative_humidity_2m,
      windSpeed: weatherData.current.wind_speed_10m,
      weatherCode: weatherData.current.weather_code,
    });
  } catch (err) {
    showError('Network error. Please check your internet connection and try again.');
    console.error('Weather fetch error:', err);
  } finally {
    setLoading(false);
  }
}

function displayWeather(data) {
  const info = getWeatherInfo(data.weatherCode);

  cityName.textContent = data.city;
  country.textContent = [data.region, data.country].filter(Boolean).join(', ') || data.country;
  weatherIcon.textContent = info.icon;
  temperature.textContent = `${Math.round(data.temp)}\u00B0C`;
  condition.textContent = info.description;
  feelsLike.textContent = `${Math.round(data.feelsLike)}\u00B0C`;
  humidity.textContent = `${data.humidity}%`;
  windSpeed.textContent = `${data.windSpeed} km/h`;

  results.classList.remove('hidden');
}

function resetForm() {
  cityInput.value = '';
  results.classList.add('hidden');
  hideError();
  setLoading(false);
  cityInput.focus();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  fetchWeather(cityInput.value);
});

resetBtn.addEventListener('click', resetForm);
