import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  const latitude = 26.8467;
  const longitude = 80.9462;

  useEffect(() => {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
      `&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
      `&timezone=auto&forecast_days=7`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setWeather(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getWeatherCondition = (code) => {
    if (code === 0) return "Clear Sky";
    if ([1, 2, 3].includes(code)) return "Partly Cloudy";
    if ([45, 48].includes(code)) return "Foggy";
    if ([51, 53, 55].includes(code)) return "Drizzle";
    if ([61, 63, 65].includes(code)) return "Rain";
    if ([71, 73, 75].includes(code)) return "Snow";
    if ([80, 81, 82].includes(code)) return "Rain Showers";
    if ([95, 96, 99].includes(code)) return "Thunderstorm";
    return "Unknown";
  };

  const getWeatherIcon = (code) => {
    if (code === 0) return "☀️";
    if ([1, 2, 3].includes(code)) return "⛅";
    if ([45, 48].includes(code)) return "🌫️";
    if ([51, 53, 55].includes(code)) return "🌦️";
    if ([61, 63, 65].includes(code)) return "🌧️";
    if ([71, 73, 75].includes(code)) return "❄️";
    if ([80, 81, 82].includes(code)) return "🌦️";
    if ([95, 96, 99].includes(code)) return "⛈️";
    return "🌤️";
  };

  const formatDay = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const askWeather = () => {
    if (!question.trim()) return;

    if (!weather) {
      setAnswer("Weather data is still loading. Please try again.");
      return;
    }

    const q = question.toLowerCase();
    const current = weather.current;

    if (
      q.includes("temperature") ||
      q.includes("temp") ||
      q.includes("garmi")
    ) {
      setAnswer(
        `The current temperature in Lucknow is ${current.temperature_2m}°C.`
      );
    } else if (
      q.includes("humidity") ||
      q.includes("humid") ||
      q.includes("nami")
    ) {
      setAnswer(
        `The current humidity in Lucknow is ${current.relative_humidity_2m}%.`
      );
    } else if (
      q.includes("wind") ||
      q.includes("hawa")
    ) {
      setAnswer(
        `The current wind speed in Lucknow is ${current.wind_speed_10m} km/h.`
      );
    } else if (
      q.includes("rain") ||
      q.includes("barish")
    ) {
      const rainChance =
        weather.daily.precipitation_probability_max[0];

      setAnswer(
        `Today's maximum rain probability is ${rainChance}%. Current condition is ${getWeatherCondition(
          current.weather_code
        )}.`
      );
    } else if (
      q.includes("weather") ||
      q.includes("mausam")
    ) {
      setAnswer(
        `Lucknow is currently ${getWeatherCondition(
          current.weather_code
        )} with ${current.temperature_2m}°C temperature, ${current.relative_humidity_2m}% humidity and wind speed of ${current.wind_speed_10m} km/h.`
      );
    } else {
      setAnswer(
        `WeatherGPT: Current Lucknow weather is ${getWeatherCondition(
          current.weather_code
        )}, ${current.temperature_2m}°C, humidity ${current.relative_humidity_2m}% and wind ${current.wind_speed_10m} km/h.`
      );
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div>
          <div className="loading-icon">🌦️</div>
          <h1>WeatherGPT</h1>
          <p>Loading live weather intelligence...</p>
        </div>
      </div>
    );
  }

  const current = weather?.current;
  const daily = weather?.daily;

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <div className="logo">🌦️ WeatherGPT</div>
        <div className="tagline">Ask. Understand. Act.</div>
        <div className="powered">
          AI-POWERED WEATHER INTELLIGENCE
        </div>
      </header>

      <main>

        {/* HERO */}
        <section className="hero-card">

          <div className="hero-title">
            <h1>Ask WeatherGPT</h1>

            <p>
              Get simple, location-based weather forecasts,
              alerts and climate information.
            </p>
          </div>

          <div className="location">
            📍 <strong>Lucknow, India</strong>
          </div>

          <div className="main-temperature">
            {Math.round(current.temperature_2m)}°C
          </div>

          <div className="main-condition">
            {getWeatherIcon(current.weather_code)}
            <strong>
              {getWeatherCondition(current.weather_code)}
            </strong>
          </div>

          <div className="weather-stats">

            <div className="stat">
              <span>💧</span>
              <strong>{current.relative_humidity_2m}%</strong>
              <small>Humidity</small>
            </div>

            <div className="stat">
              <span>💨</span>
              <strong>{current.wind_speed_10m}</strong>
              <small>Wind km/h</small>
            </div>

            <div className="stat">
              <span>🌧️</span>
              <strong>
                {daily.precipitation_probability_max[0]}%
              </strong>
              <small>Rain Chance</small>
            </div>

          </div>

          <div className="live-data">
            🟢 Live Weather Data
          </div>

          {/* ASK */}
          <div className="ask-section">

            <h2>🤖 Ask your weather question</h2>

            <div className="question-box">

              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") askWeather();
                }}
                placeholder="e.g. Will it rain today?"
              />

              <button onClick={askWeather}>
                Ask
              </button>

            </div>

            {answer && (
              <div className="answer-box">
                <h3>🤖 WeatherGPT</h3>
                <p>{answer}</p>
              </div>
            )}

          </div>

        </section>

        {/* 7 DAY FORECAST */}
        <section className="section">

          <div className="section-heading">
            <span>📅</span>
            <h2>7-Day Weather Forecast</h2>
          </div>

          <div className="forecast-grid">

            {daily.time.map((date, index) => (
              <div className="forecast-card" key={date}>

                <h3>
                  {index === 0 ? "Today" : formatDay(date)}
                </h3>

                <div className="forecast-icon">
                  {getWeatherIcon(daily.weather_code[index])}
                </div>

                <strong className="forecast-condition">
                  {getWeatherCondition(
                    daily.weather_code[index]
                  )}
                </strong>

                <div className="forecast-temp">
                  <span>
                    {Math.round(daily.temperature_2m_max[index])}°
                  </span>
                  /
                  <span className="low">
                    {Math.round(daily.temperature_2m_min[index])}°
                  </span>
                </div>

                <div className="rain">
                  🌧️ {daily.precipitation_probability_max[index]}%
                </div>

              </div>
            ))}

          </div>

        </section>

        {/* SMART ALERTS */}
        <section className="section">

          <div className="section-heading">
            <span>🚨</span>
            <h2>Smart Alerts</h2>
          </div>

          <div className="alert-card">

            {daily.precipitation_probability_max[0] >= 60 ? (
              <>
                <div className="alert-icon">🌧️</div>
                <div>
                  <h3>Rain Alert</h3>
                  <p>
                    High probability of rain today.
                    Carry an umbrella before going outside.
                  </p>
                </div>
              </>
            ) : current.weather_code >= 95 ? (
              <>
                <div className="alert-icon">⛈️</div>
                <div>
                  <h3>Thunderstorm Alert</h3>
                  <p>
                    Thunderstorm conditions are currently detected.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="alert-icon">✅</div>
                <div>
                  <h3>No Major Weather Alert</h3>
                  <p>
                    No major weather condition detected right now.
                  </p>
                </div>
              </>
            )}

          </div>

        </section>

        {/* WEATHER MAP */}
        <section className="feature-section">

          <div className="feature-card">

            <div className="feature-large-icon">
              🗺️
            </div>

            <h2>Weather Map</h2>

            <p>
              Visualize weather conditions and understand
              regional weather patterns.
            </p>

            <button className="feature-button">
              Explore Map
            </button>

          </div>

          <div className="feature-card">

            <div className="feature-large-icon">
              🌍
            </div>

            <h2>Climate Info</h2>

            <p>
              Understand temperature, rainfall and climate
              patterns in an easy way.
            </p>

            <button className="feature-button">
              View Climate
            </button>

          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer>
        <strong>WeatherGPT</strong>
        <span>•</span>
        <span>CyberSmith</span>
        <span>•</span>
        <span>SIH 2026</span>
      </footer>

    </div>
  );
}

export default App;