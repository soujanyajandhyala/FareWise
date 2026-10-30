# FareWise – Smart Travel Fare Finder

FareWise is an individually developed web application that helps users find the cheapest day to travel between Indian cities by flight, train or bus using estimated fares.

## Features

- User signup, login and logout.
- Search fares by source, destination, date range and transport mode.
- Highlight the cheapest travel day.
- Visualise fare variations using bar charts.
- Set price drop alerts.
- Maintain search history.
- Optional AI integration using Groq API.

## Tech Stack

- HTML5
- CSS3
- JavaScript (ES6)
- Chart.js
- Browser localStorage
- Groq API (optional)

## Project Structure

```text
FareWise/
├── index.html
├── dashboard.html
├── trends.html
├── app.js
├── start-server.bat
└── README.md
```

## How to Run

1. Open the project folder in VS Code.
2. Start the application using Live Server or run:

```bash
python -m http.server 8000
```

3. Open `http://localhost:8000` in your browser.
4. Create an account and start searching for fares.

## Fare Estimation

FareWise uses a built-in demo pricing engine based on route distance, transport mode and day-of-week multipliers.

**Note:** Displayed fares are simulated estimates for demonstration purposes, not real-time travel prices. User accounts and search data are stored locally using browser localStorage.

## Future Enhancements

- Real-time travel fare API integration.
- Secure backend and database.
- Email and push notifications.
- Online deployment.
