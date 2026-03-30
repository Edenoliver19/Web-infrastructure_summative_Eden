Rwanda Public Transport Route Optimizer
A web application that helps users find and compare the best routes between major Rwandan cities. It supports car, bicycle, and walking modes, shows distance, duration, and cost estimates, and lets users sort results by any of those metrics.
Live (via load balancer): http://[LB01_IP]

Features

Route calculation between 12 Rwandan cities
Three transport modes: Car, Bicycle, Walking
Side-by-side comparison of all three modes
Sort results by distance, duration, or cost
Estimated transport cost in RWF (Rwandan Francs)
Responsive design — works on mobile and desktop
Graceful error handling for API timeouts, rate limits, and invalid routes


APIs Used
APIPurposeDocumentationOpenRouteServiceRoute calculation (distance, duration, directions)https://openrouteservice.org/dev/#/api-docs
OpenRouteService is free up to 2,000 requests/day. No credit card required.

Local Setup
Prerequisites

Node.js v18 or later
npm
A free OpenRouteService API key (sign up at https://openrouteservice.org/dev/#/signup)

Steps
 # 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/Web-infrastructure_summative_Eden.git


# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# Edit .env and i add my API key:
#   API_KEY=your_openrouteservice_key_here

# 4. Start the server
node server.js
Open http://localhost:3000 in your browser.

Deployment
The app runs on two web servers (Web01, Web02) behind an HAProxy load balancer (Lb01).
Internet ──▶ HAProxy (Lb01:80) ──▶ Nginx (Web01:80) ──▶ Node.js (:3000)
                              └──▶ Nginx (Web02:80) ──▶ Node.js (:3000)
Deploy to Web01 and Web02 (repeat on both)
# 1. SSH in
ssh ubuntu@WEB0X_IP

# 2. Install Node.js and Nginx
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

# 3. Copy app files
sudo mkdir -p /var/www/route-optimizer
sudo chown ubuntu:ubuntu /var/www/route-optimizer
git clone https://github.com/YOUR_USERNAME/Web-infrastructure_summative_Eden.git /var/www/route-optimizer
cd /var/www/route-optimizer
npm install --production

# 4. Create .env with your API key
echo "API_KEY=my_key_here" > .env
echo "PORT=3000"             >> .env

# 5. Install systemd service (keeps app running after reboot)
sudo cp deployment/route-optimizer.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable route-optimizer
sudo systemctl start  route-optimizer
sudo systemctl status route-optimizer   # should show "active (running)"

# 6. Configure Nginx reverse proxy
sudo cp deployment/nginx.conf /etc/nginx/sites-available/route-optimizer
sudo ln -s /etc/nginx/sites-available/route-optimizer /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t                          # must say "syntax is ok"
sudo systemctl reload nginx

# 7. Verify
curl http://WEB0X_IP/health
# Expected: {"status":"ok","service":"route-optimizer"}
Configure Load Balancer (Lb01)
bash# 1. SSH into Lb01
ssh ubuntu@LB01_IP

# 2. Install HAProxy
sudo apt-get update && sudo apt-get install -y haproxy

# 3. Edit haproxy.cfg — replace WEB01_IP and WEB02_IP with real private IPs
nano deployment/haproxy.cfg

# 4. Deploy
sudo cp deployment/haproxy.cfg /etc/haproxy/haproxy.cfg
sudo haproxy -c -f /etc/haproxy/haproxy.cfg   # validate
sudo systemctl enable haproxy
sudo systemctl restart haproxy

# 5. Test load balancing — watch logs on BOTH servers while running this
curl http://LB01_IP/health   # run several times
# HAProxy stats: http://LB01_IP:8404/haproxy?stats
To confirm round-robin is working, tail the Node.js logs on each server:
bashsudo journalctl -fu route-optimizer   # on Web01 and Web02 simultaneously
Requests from http://LB01_IP should alternate between the two servers.

Environment Variables
VariableDescriptionAPI_KEYYour OpenRouteService API keyPORTPort for the Node.js server (default: 3000)
Never commit your .env file — it is listed in .gitignore.

Challenges & Solutions
Coordinate order mismatch — OpenRouteService expects [longitude, latitude] but most geographic libraries use [latitude, longitude]. This caused routes to appear in the wrong location. Fixed by explicitly ordering coordinates as [lon, lat] before sending to the API.
Comparing transport modes — The assignment required sorting and filtering data. Implemented by fetching all three transport profiles in parallel (Promise.allSettled) and storing results client-side, so sorting never requires another API call.
Load balancer health checks — HAProxy needs a /health endpoint that returns a known string to confirm a backend is alive. Added a dedicated GET /health route to the Express server returning {"status":"ok"}.

Credits

Routing API: OpenRouteService by HeiGIT (Heidelberg Institute for Geoinformation Technology) — free tier, ODbL license
Framework: Express.js — MIT License
HTTP client: Axios — MIT License
Map data: © OpenStreetMap contributors