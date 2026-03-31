# Rwanda Public Transport Route Optimizer

A web application that helps users find and compare the best routes between major Rwandan cities. It supports car, bicycle, and walking, shows an interactive map with the routes, and provides distance, duration, and cost estimates. Users can seamlessly sort the results by any metric to find the optimal path.

**Live (via load balancer): http://54.211.234.76**

**Demo Video: https://youtu.be/nb5jjCNqQ5Q**

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
   *(Note: Never commit your `.env` file — it is listed in `.gitingore`.)*

4. **Start the server**
   ```bash
   node server.js
   ```
   Open `http://localhost:3000` in your browser.

## Deployment Architecture

The application runs on two Node.js servers managed by PM2, with HAProxy distributing traffic between them via round-robin.

```text
Internet ──▶ HAProxy (LB01:80) ──┬──▶ Node.js (Web01:3000)
                                  └──▶ Node.js (Web02:3000)
```

**Servers:**
- Web01: `54.147.35.15`
- Web02: `44.204.91.237`
- LB01:  `54.211.234.76`

### Server Setup (Web01 & Web02)

1. SSH into the server:
   ```bash
   ssh ubuntu@54.147.35.15  # repeat for Web02: ubuntu@44.204.91.237
   ```

2. Install Node.js 20 and PM2:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

3. Clone the repository:
   ```bash
   git clone https://github.com/Edenoliver19/Web-infrastructure_summative_Eden.git ~/app
   cd ~/app
   npm ci --only=production
   ```

4. Create the `.env` file:
   ```bash
   nano ~/app/.env
   ```
   Add:
   ```env
   PORT=3000
   API_KEY=your_graphhopper_api_key_here
   ```

5. Start the app with PM2:
   ```bash
   pm2 start server.js --name route-optimizer
   pm2 save
   env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
   pm2 save
   ```

6. Open port 3000 on the firewall:
   ```bash
   sudo ufw allow 3000
   ```

7. Verify the app is running:
   ```bash
   curl http://localhost:3000/health
   ```

### Load Balancer Setup (LB01)

1. SSH into LB01:
   ```bash
   ssh ubuntu@54.211.234.76
   ```

2. Install HAProxy:
   ```bash
   sudo apt-get update
   sudo apt-get install -y haproxy
   ```

3. Apply the config from the repo:
   ```bash
   sudo cp haproxy/haproxy.cfg /etc/haproxy/haproxy.cfg
   sudo haproxy -c -f /etc/haproxy/haproxy.cfg
   sudo systemctl restart haproxy
   sudo systemctl enable haproxy
   ```

4. Verify traffic is being distributed:
   ```bash
   curl http://localhost/health
   ```

5. View the HAProxy stats panel: `http://54.211.234.76:8404/stats`

## Live Links

| Server | URL |
| --- | --- |
| 🌐 App via Load Balancer (LB01) | [http://54.211.234.76](http://54.211.234.76) |
| 🖥️ Web01 (direct) | [http://54.147.35.15:3000](http://54.147.35.15:3000) |
| 🖥️ Web02 (direct) | [http://44.204.91.237:3000](http://44.204.91.237:3000) |
| 📊 HAProxy Stats | [http://54.211.234.76:8404/stats](http://54.211.234.76:8404/stats) |

## Testing the Deployment

### Verify each server directly:
```bash
curl http://54.147.35.15:3000/health
curl http://44.204.91.237:3000/health
```
Both should return: `{"status":"ok","service":"route-optimizer"}`

### Verify the load balancer:
```bash
curl http://54.211.234.76/health
```
Should return: `{"status":"ok","service":"route-optimizer"}`

### Verify load balancing (run multiple times):
```bash
curl http://54.211.234.76/health
curl http://54.211.234.76/health
curl http://54.211.234.76/health
```
Check the HAProxy stats panel at [http://54.211.234.76:8404/stats](http://54.211.234.76:8404/stats) — you will see requests being distributed between Web01 and Web02 in real time.

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