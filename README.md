 # Rwanda Ticket Hub

Rwanda Ticket Hub is a mobile-friendly web app for booking bus and mini-bus trips anywhere in Rwanda. Customers can sign up, create on-demand bookings, choose an online payment method, and preview traffic-aware fares and ETAs. Drivers can sign in, accept or reject bookings, update GPS location, and see passenger counts and pickup details.

## Features

- Customer sign-up and login
- Driver sign-up and login
- Bus and mini-bus ticket booking
- Online payment-ready booking flow
- Live GPS updates for drivers
- Accept/reject booking workflow for drivers
- Traffic-aware ETA and route adjustment
- Rwanda place search with geocoding fallback for custom areas
- Responsive web layout that works on mobile and desktop

## Storage

Bookings, users, sessions, drivers, and traffic reports are stored in `data/state.json` on the server.

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root if you want GraphHopper routing support:

   ```env
   PORT=3000
   API_KEY=your_graphhopper_api_key_here
   ```

3. Start the app:

   ```bash
   npm start
   ```

4. Open `http://localhost:3000` in your browser.

## Demo Driver Account

- Email: `driver1@demo.rw`
- Password: `driver123`

## API Overview

- `POST /api/auth/signup` - create a customer or driver account
- `POST /api/auth/login` - authenticate an account
- `POST /api/bookings` - create a booking
- `GET /api/bookings` - list customer or driver bookings
- `PATCH /api/bookings/:id/respond` - driver accept/reject booking
- `POST /api/drivers/:id/location` - update driver GPS location
- `GET /api/traffic` - preview traffic-aware routing

## Notes

- The app uses GraphHopper when `API_KEY` is present.
- If no routing key is configured, the server falls back to a Rwanda-aware geocoding and distance estimate.
- The payment flow is structured for online methods and can be wired to a real gateway later.