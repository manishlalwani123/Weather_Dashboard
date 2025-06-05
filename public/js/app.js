// ============ THEME SWITCHER ============ //
const themes = [
  { background: "#1A1A2E", color: "#FFFFFF", primaryColor: "#0F3460" },
  { background: "#461220", color: "#FFFFFF", primaryColor: "#E94560" },
  { background: "#192A51", color: "#FFFFFF", primaryColor: "#967AA1" },
  { background: "#F7B267", color: "#000000", primaryColor: "#F4845F" },
  { background: "#F25F5C", color: "#000000", primaryColor: "#642B36" },
  { background: "#231F20", color: "#FFF", primaryColor: "#BB4430" }
];

const setTheme = (theme) => {
  const root = document.querySelector(":root");
  root.style.setProperty("--background", theme.background);
  root.style.setProperty("--color", theme.color);
  root.style.setProperty("--primary-color", theme.primaryColor);
};

const displayThemeButtons = () => {
  const btnContainer = document.querySelector(".theme-btn-container");
  if (!btnContainer) return;
  themes.forEach((theme) => {
    const div = document.createElement("div");
    div.className = "theme-btn";
    div.style.cssText = `background: ${theme.background}; width: 25px; height: 25px; cursor: pointer; margin: 5px; border-radius: 50%; display: inline-block;`;
    btnContainer.appendChild(div);
    div.addEventListener("click", () => setTheme(theme));
  });
};

displayThemeButtons();

// ============ LOGIN ============ //
async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.success) {
    window.location.href = 'dashboard.html';
  } else {
    document.getElementById('loginError').innerText = data.message;
  }
}

// ============ REGISTER ============ //
async function register() {
  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const errorElement = document.getElementById('regError');

  if (!username || !email || !password) {
    errorElement.textContent = "Please fill in all fields.";
    errorElement.style.color = "red";
    return;
  }

  const res = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  const data = await res.json();
  if (data.success) {
    alert('Registration successful! Please log in.');
    window.location.href = 'login.html';
  } else {
    errorElement.textContent = data.message;
    errorElement.style.color = "red";
  }
}

// ============ WEATHER + AI PREDICTION ============ //
const url = 'https://api.openweathermap.org/data/2.5/weather';
const apiKey = 'f00c38e0279b7bc85480c3fe775d518c';

$(document).ready(function () {
  weatherFn('Pune');
});

async function weatherFn(city) {
  if (!city) {
    alert('Please enter a city name.');
    return;
  }

  const weatherUrl = `${url}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
  try {
    const res = await fetch(weatherUrl);
    if (!res.ok) {
      alert('City not found. Please try again.');
      return;
    }
    const data = await res.json();
    weatherShowFn(data);

    // AI Prediction
    const aiRes = await fetch('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city })
    });
    const aiData = await aiRes.json();
    if (aiRes.ok && aiData.success) {
      let predictionText = `3-Day Rain Prediction for ${aiData.data.city}:\n`;
      aiData.data["3_day_rain_forecast"].forEach(entry => {
        predictionText += `\n${entry.datetime}: ${entry.description}, Rain Expected: ${entry.rain_expected ? "Yes" : "No"}, Temp: ${entry.temperature}°C`;
      });
      $('#aiPrediction').text(predictionText);
    } else {
      $('#aiPrediction').text('AI prediction error.');
    }
  } catch (error) {
    console.error('Error fetching weather data:', error);
    alert('Error fetching weather data.');
  }
}

function weatherShowFn(data) {
  $('#city-name').text(data.name);
  $('#date').text(moment().format('MMMM Do YYYY, h:mm:ss a'));
  $('#temperature').html(`${data.main.temp}°C`);
  $('#description').text(data.weather[0].description);
  $('#wind-speed').html(`Wind Speed: ${data.wind.speed} m/s`);
  $('#weather-icon').attr('src', `http://openweathermap.org/img/wn/${data.weather[0].icon}.png`);
  $('#weather-info').fadeIn();
}

// ============ FUTURE 7-DAY PREDICTION ============ //
async function futurePrediction(city) {
  if (!city) {
    alert('Please enter a city name for prediction.');
    return;
  }

  try {
    const response = await fetch('/future-prediction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city })
    });

    const data = await response.json();

    if (data.success) {
      let predictionText = `7-Day Weather Prediction for ${data.city}:\n`;
      data.forecast.forEach(day => {
        predictionText += `${day.date}: ${day.description}, Temp: ${day.temperature}°C\n`;
      });
      document.getElementById('futurePredictionOutput').textContent = predictionText;
    } else {
      document.getElementById('futurePredictionOutput').textContent = 'Prediction error: ' + data.message;
    }
  } catch (err) {
    console.error(err);
    document.getElementById('futurePredictionOutput').textContent = 'Server error while predicting future weather.';
  }
}

// ============ FUTURE 7-DAY PREDICTION BUTTON ============ //
document.getElementById('futurePredictionBtn').addEventListener('click', () => {
  const city = prompt('Enter city name for 7-day forecast:');
  if (city) {
    futurePrediction(city.trim());
  }
});

// ============ FORM SUBMISSION HANDLER FOR LOGIN PAGE ============ //
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const messageDiv = document.getElementById('message');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();

      try {
        const response = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
          window.location.href = 'dashboard.html';
        } else {
          if (messageDiv) {
            messageDiv.textContent = data.message || 'Invalid credentials';
            messageDiv.style.color = 'red';
          } else {
            alert(data.message || 'Invalid credentials');
          }
        }
      } catch (error) {
        console.error(error);
        if (messageDiv) {
          messageDiv.textContent = 'Server error, please try again.';
          messageDiv.style.color = 'red';
        } else {
          alert('Server error, please try again.');
        }
      }
    });
  }
});
