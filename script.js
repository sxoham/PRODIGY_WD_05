let lastSource = null;
let lastCity = "";
let lastCoords = null;
let currentUnit = localStorage.getItem("unit") || "metric";
let unitSymbol = currentUnit === "imperial" ? "°F" : "°C";

let weather = {
    apikey: "8fb08a070e3ed6682790f2af037f9f89",

    fetchWeather: function (city) {
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${currentUnit}&appid=${this.apikey}`)
            .then(res => {
                if (!res.ok) throw new Error("City not found");
                return res.json();
            })
            .then(data => {
                this.displayCurrentWeather(data);
                this.fetchForecast(data.coord.lat, data.coord.lon, data.name);
                this.fetchAQI(data.coord.lat, data.coord.lon);
                lastSource = "city";
                lastCity = city;
            })
            .catch(err => {
                alert(err.message);
                this.clearUI();
            });
    },

    fetchForecast: function (lat, lon, cityName) {
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${this.apikey}`)
            .then(res => {
                if (!res.ok) throw new Error("Forecast fetch failed");
                return res.json();
            })
            .then(data => this.displayForecast(data))
            .catch(() => alert("Forecast data fetch failed."));
    },

    fetchWeatherByCoords: function (lat, lon) {
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${this.apikey}`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch by location");
                return res.json();
            })
            .then(data => {
                this.displayCurrentWeather(data);
                this.fetchForecast(lat, lon, data.name);
                this.fetchAQI(lat, lon);
                lastSource = "coords";
                lastCoords = { lat, lon };
            })
            .catch(err => {
                console.error("Location-based fetch failed:", err.message);
            });
    },

    fetchAQI: function (lat, lon) {
        fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${this.apikey}`)
            .then(res => {
                if (!res.ok) throw new Error("AQI fetch failed");
                return res.json();
            })
            .then(data => this.displayAQI(data))
            .catch(err => console.error("AQI fetch failed:", err));
    },

    displayCurrentWeather: function (data) {
        const { name } = data;
        const { icon, description, main } = data.weather[0];
        const { temp, humidity } = data.main;
        const { speed } = data.wind;
        const { sunrise, sunset } = data.sys;

        document.querySelector(".city").innerText = "Weather in " + name;
        document.querySelector(".icon").src = `https://openweathermap.org/img/wn/${icon}.png`;
        document.querySelector(".description").innerText = description.charAt(0).toUpperCase() + description.slice(1);
        document.querySelector(".temp").innerText = `${Math.round(temp)}${unitSymbol}`;
        document.querySelector(".humidity").innerText = `Humidity: ${humidity}%`;
        const windUnit = currentUnit === "imperial" ? "mph" : "km/h";

        const degToCompass = (deg) => {
            const dirs = [
                { dir: "N", arrow: "⬆️" },
                { dir: "NE", arrow: "↗️" },
                { dir: "E", arrow: "➡️" },
                { dir: "SE", arrow: "↘️" },
                { dir: "S", arrow: "⬇️" },
                { dir: "SW", arrow: "↙️" },
                { dir: "W", arrow: "⬅️" },
                { dir: "NW", arrow: "↖️" },
            ];
            const ix = Math.round(deg / 45) % 8;
            return dirs[ix];
        };

        const { dir, arrow } = degToCompass(data.wind.deg);
        document.querySelector(".wind").innerText = `Wind: ${speed.toFixed(1)} ${windUnit} ${dir} ${arrow}`;

        document.querySelector(".weather").classList.remove("loading");

        const formatTime = (timestamp) => {
            const date = new Date(timestamp * 1000);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        document.querySelector(".sunrise").innerText = `🌅 Sunrise: ${formatTime(sunrise)}`;
        document.querySelector(".sunset").innerText = `🌇 Sunset: ${formatTime(sunset)}`;

        const weatherKeywordMap = {
            Clear: "sunny",
            Clouds: "cloudy",
            Rain: "rain",
            Snow: "snow",
            Drizzle: "drizzle",
            Thunderstorm: "thunderstorm",
            Mist: "mist",
            Haze: "haze",
            Fog: "fog",
            Smoke: "smoke"
        };

        const pexelsApiKey = "9ewKbMvj22ULhhM6rhQkrYtApn4OkvFfLqFSpVRUb2TcoNRSOzikivQV";
        const keyword = `${weatherKeywordMap[main] || "weather"} sky`;

        fetch(`https://api.pexels.com/v1/search?query=${keyword}&per_page=10`, {
            headers: { Authorization: pexelsApiKey }
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.photos && data.photos.length > 0) {
                    const randomIndex = Math.floor(Math.random() * data.photos.length);
                    const imageUrl = data.photos[randomIndex].src.landscape;
                    document.body.style.backgroundImage = `url('${imageUrl}')`;
                } else {
                    console.warn("No Pexels image found.");
                }
            })
            .catch((err) => console.error("Pexels image fetch failed:", err));
    },

    displayForecast: function (data) {
        const hourlyContainer = document.querySelector(".hourly-container");
        hourlyContainer.innerHTML = "";

        data.list.slice(0, 12).forEach(hour => {
            const date = new Date(hour.dt * 1000);
            const time = `${date.getHours().toString().padStart(2, "0")}:00`;
            const temp = Math.round(hour.main.temp);
            const icon = hour.weather[0].icon;

            hourlyContainer.innerHTML += `
                <div class="hour-block">
                    <div>${time}</div>
                    <img src="https://openweathermap.org/img/wn/${icon}.png" />
                    <div>${temp}${unitSymbol}</div>
                </div>`;
        });
    },

    displayAQI: function (data) {
        const aqi = data.list[0].main.aqi;
        const components = data.list[0].components;

        const aqiText = ["❌ Unknown", "🟢 Good", "🟡 Fair", "🟠 Moderate", "🔴 Poor", "🟣 Very Poor"];
        const aqiDisplay = document.querySelector(".aqi");

        aqiDisplay.innerHTML = `
            <strong>Air Quality:</strong> ${aqiText[aqi]} <br />
            PM2.5: ${components.pm2_5} µg/m³ | PM10: ${components.pm10} µg/m³
        `;
    },

    clearUI: function () {
        document.querySelector(".city").innerText = "City not found";
        document.querySelector(".temp").innerText = "";
        document.querySelector(".description").innerText = "";
        document.querySelector(".humidity").innerText = "";
        document.querySelector(".wind").innerText = "";
        document.querySelector(".icon").src = "";
        document.querySelector(".hourly-container").innerHTML = "";
        document.querySelector(".daily-container").innerHTML = "";
        document.querySelector(".sunrise").innerText = "";
        document.querySelector(".sunset").innerText = "";
        document.querySelector(".aqi").innerHTML = "";
        document.querySelector(".weather").classList.add("loading");
        document.body.style.backgroundImage = "";
    },

    search: function () {
        const city = document.querySelector(".searchbar").value.trim();
        if (city) this.fetchWeather(city);
    }
};

// Theme toggle
const themeToggleBtn = document.getElementById("toggleTheme");
if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
    themeToggleBtn.textContent = "🌙";
} else {
    themeToggleBtn.textContent = "🌞";
}
themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
    const isLight = document.body.classList.contains("light");
    themeToggleBtn.textContent = isLight ? "🌙" : "🌞";
    localStorage.setItem("theme", isLight ? "light" : "dark");
});

// Unit toggle
const unitToggleBtn = document.getElementById("toggleUnit");
unitToggleBtn.textContent = unitSymbol;
unitToggleBtn.addEventListener("click", () => {
    currentUnit = currentUnit === "metric" ? "imperial" : "metric";
    unitSymbol = currentUnit === "imperial" ? "°F" : "°C";
    localStorage.setItem("unit", currentUnit);
    unitToggleBtn.textContent = unitSymbol;

    if (lastSource === "city" && lastCity) {
        weather.fetchWeather(lastCity);
    } else if (lastSource === "coords" && lastCoords) {
        weather.fetchWeatherByCoords(lastCoords.lat, lastCoords.lon);
    } else {
        getUserLocation();
    }
});

// Geolocation
function getUserLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                weather.fetchWeatherByCoords(lat, lon);
            },
            (error) => {
                console.log("Geolocation denied or failed.", error.message);
            }
        );
    } else {
        console.log("Geolocation not supported by browser.");
    }
}

// Event listeners
document.querySelector(".search button").addEventListener("click", () => weather.search());
document.querySelector(".searchbar").addEventListener("keyup", e => {
    if (e.key === "Enter") weather.search();
});
document.getElementById("refreshBtn").addEventListener("click", () => {
    if (lastSource === "city" && lastCity) {
        weather.fetchWeather(lastCity);
    } else if (lastSource === "coords" && lastCoords) {
        weather.fetchWeatherByCoords(lastCoords.lat, lastCoords.lon);
    } else {
        getUserLocation();
    }
});

getUserLocation();
