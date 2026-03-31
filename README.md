# Rwanda Public Transport Route Optimizer

A web application that helps users find and compare the best routes between major Rwandan cities. It supports car, bicycle, and walking, shows an interactive map with the routes, and provides distance, duration, and cost estimates. Users can seamlessly sort the results by any metric to find the optimal path.

[Live (via load balancer): http://[LB01_IP]]

## Features

- **City-to-City Routing**: Support for 12 major cities across Rwanda.
- **Multimodal Comparison**: Simultaneously compares Car, Bicycle, and Walking modes.
- **Interactive Map**: Displays the routes using Leaflet with OpenStreetMap.
- **Visual Route Highlighting**: Automatically emphasizes the "best" route with a glowing outline and dims alternative modes.
- **Dynamic Sorting**: Swap sorting criteria between distance, duration, or cost without reloading.
- **Cost Estimation**: Approximates total transport cost in RWF (Rwandan Francs).
- **Graceful Error Handling**: Manages API timeouts, rate limits, and invalid inputs smoothly.

## APIs & Map Technologies

| Service / Tool | Purpose | Status / Access |
| --- | --- | --- |
| **GraphHopper API** | Route calculation and geometry paths | [Sign up for free tier](https://graphhopper.com/dashboard/#/register) |
| **Leaflet.js** | Interactive mapping library | Free/Open Source |
| **OpenStreetMap** | Map tile provider | Free/ODbL License |

## Local Setup

### Prerequisites

- Node.js v18 or later
- npm
- A free **GraphHopper API key**

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Web-infrastructure_summative_Eden.git
   cd Web-infrastructure_summative_Eden
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the environment**
   Create an `.env` file in the root directory and add your GraphHopper API key:
   ```env
   API_KEY=your_graphhopper_api_key_here
   PORT=3000
   ```
   *(Note: Never commit your `.env` file — it is listed in `.gitignore`.)*

4. **Start the server**
   ```bash
   node server.js
   ```
   Open `http://localhost:3000` in your browser.

## Deployment Architecture

The application is designed to be highly available, utilizing an HAProxy load balancer across two active Node.js servers.

```text
Internet ──▶ HAProxy (Lb01:80) ──┬──▶ Nginx (Web01:80) ──▶ Node.js (:3000)
                                 └──▶ Nginx (Web02:80) ──▶ Node.js (:3000)
```

### Server Setup (Web01 & Web02)

1. SSH into the server and install prerequisites (`nodejs`, `nginx`).
2. Clone the repository into `/var/www/route-optimizer` and run `npm install --production`.
3. Create the `.env` file with your `API_KEY`.
4. Install the provided systemd service (`route-optimizer.service`) to keep the Node.js application running securely.
5. Setup the provided Nginx reverse proxy block (`nginx.conf`), pointing to `localhost:3000`.

### Load Balancer Setup (Lb01)

1. SSH into Lb01 and install `haproxy`.
2. Configure `/etc/haproxy/haproxy.cfg` using the provided template to load balance Web01 and Web02 using round-robin.
3. Restart `haproxy`. To verify load balancing, check the HAProxy stats panel or observe that requests alternate between Web01 and Web02 by tailing the systemd logs.

## Challenges & Solutions

- **Routing API Transition**: Changed routing logic from OpenRouteService to GraphHopper for better integration and visual rendering capabilities without complex array manipulation.
- **Client-Side Processing**: By fetching all three transport profiles in a single parallel burst (`Promise.allSettled`) on form submission, we can sort, filter, and compare data on the client. This deeply enhances UX and drastically reduces redundant server/API calls.
- **Route Highlighting Layer Ordering**: To securely emphasize the optimal path, the UI script dynamically applies glowing SVG styles and changes layer z-indices and insert orders to visually distinguish the primary path from dimmed, dashed alternative paths on the interactive map.

## Credits

- **Routing API**: GraphHopper
- **Map Library**: Leaflet
- **Map Data**: © OpenStreetMap contributors
- **Author**: Eden Oliver
- **License**: MIT