# Public Transport Route Optimizer

A Node.js web application that helps users find the optimal public transport route between Rwandan cities using the OpenRouteService API.

## Purpose
This app allows users to select a start and end city (Kigali, Huye, Gitarama) and get the distance, estimated travel duration, and a cost estimate for the route. It demonstrates practical use of an external API and provides a real-world utility for route planning.

---

## Features
- User-friendly web interface (HTML/CSS/JS)
- Uses OpenRouteService API for real route data
- Calculates distance, duration, and cost
- Robust error handling and user feedback
- Secure API key management with `.env`
- Ready for deployment on two servers with HAProxy load balancing

---

## How to Run Locally
1. **Clone the repository:**
   ```
   git clone https://github.com/yourusername/public-transport-route-optimizer.git
   cd public-transport-route-optimizer
   ```
2. **Install dependencies:**
   ```
   npm install
   ```
3. **Set your API key:**
   - Get a free API key from [OpenRouteService](https://openrouteservice.org/sign-up/)
   - Create a `.env` file in the project root:
     ```
     API_KEY=your_real_openrouteservice_api_key_here
     ```
4. **Start the server:**
   ```
   node server.js
   ```
5. **Open your browser:**
   - Go to [http://localhost:3000](http://localhost:3000)

---

## Deployment Instructions
### Deploy on Web01 and Web02
1. **Copy all project files to both servers.**
2. **On each server:**
   - Install Node.js and npm if not already installed.
   - Run `npm install`.
   - Add your `.env` file with the API key (do NOT share this file).
   - Start the app: `node server.js` (or use pm2 for production).
   - Ensure the app is running on port 3000.

### HAProxy Load Balancer Example
On your load balancer server (Lb01), use this config:
```
frontend http_front
    bind *:80
    default_backend http_back

backend http_back
    balance roundrobin
    server web01 54.147.35.15:3000 check
    server web02 44.204.91.237:3000 check
```
- Restart HAProxy after editing the config.
- Access your app via the load balancer's public IP.

---

## API Documentation & Credit
- **API Used:** [OpenRouteService Directions API](https://openrouteservice.org/dev/#/api-docs/v2/directions/{profile}/post)
- **Credit:** OpenRouteService for route data

---

## Security
- API keys are stored in `.env` and never committed to GitHub.
- `.gitignore` ensures sensitive files are not tracked.

---

## User Interaction
- Users select start and end cities from dropdowns.
- Click "Get Route" to fetch and display distance, duration, and cost.
- Errors (e.g., invalid input, API issues) are shown clearly.

---

## Error Handling
- Invalid input (e.g., same city) is caught on both frontend and backend.
- API/network errors are shown to the user with friendly messages.

---

## Demo Video
- [Add your demo video link here]

---

## Challenges
- Handling API errors and user input validation.
- Ensuring secure API key management.

---

## Attribution
- [OpenRouteService](https://openrouteservice.org/)
- [Express.js](https://expressjs.com/)
- [Axios](https://axios-http.com/)
- [dotenv](https://github.com/motdotla/dotenv)

---

## Comments
- Paste your API key in `.env` on each server.
- Do NOT share your API key publicly.
- For any issues, check the API key and server logs.

---

**This project is for educational purposes.**
