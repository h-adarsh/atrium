# Deploying Atrium on Oracle Cloud Infrastructure (OCI) Always Free Tier

This step-by-step production runbook covers deploying **Atrium** on your Oracle Cloud Infrastructure (OCI) Always Free virtual machine with complete security controls, automated SSL, isolated database networking, and firewall configurations.

---

## 1. OCI Instance Recommendation

In your OCI Console, launch an Always Free Compute instance:
* **Image:** **Ubuntu 24.04 LTS** or **Ubuntu 22.04 Minimal**
* **Shape:** **VM.Standard.A1.Flex** (Ampere ARM, up to 4 OCPUs, 24 GB RAM — 100% Always Free) or **VM.Standard.E2.1.Micro** (AMD, 1 OCPU, 1 GB RAM)
* **Networking:** Assign a Public IPv4 Address.
* **SSH Keys:** Save your private SSH key to your local machine.

---

## 2. OCI Network Security: Open Ports in VCN Security Lists

By default, OCI blocks all incoming web traffic at the cloud network layer.

1. In the OCI Console, go to **Networking** → **Virtual Cloud Networks**.
2. Click your VCN → click **Security Lists** → select the **Default Security List**.
3. Under **Ingress Rules**, click **Add Ingress Rules**:
   * **Source CIDR:** `0.0.0.0/0`
   * **IP Protocol:** `TCP`
   * **Destination Port Range:** `80, 443`
   * **Description:** `HTTP and HTTPS for Atrium portal`
4. Click **Add Ingress Rules**.

---

## 3. SSH into Your OCI Instance & Fix the Host Firewall Trap

> [!WARNING]
> **The OCI Ubuntu Firewall Trap:**  
> OCI Ubuntu images include restrictive `iptables` rules that drop incoming traffic on ports 80 and 443 **even after you open them in the OCI Console**. You must unblock them in the OS firewall.

Connect to your instance:
```bash
ssh -i /path/to/your-private-key ubuntu@<YOUR_OCI_PUBLIC_IP>
```

Run these commands to unblock ports 80 & 443 on Ubuntu:
```bash
# Accept HTTP and HTTPS in iptables
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT

# Persist the firewall rules across reboots
sudo netfilter-persistent save || (sudo apt-get install -y iptables-persistent && sudo netfilter-persistent save)
```

*(If using Oracle Linux instead of Ubuntu)*:
```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 4. Install Docker & Docker Compose

Update system and install Docker:
```bash
# Update repositories
sudo apt-get update && sudo apt-get install -y ca-certificates curl gnupg lsb-release git nginx certbot python3-certbot-nginx

# Add Docker's official GPG key & repository
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Allow ubuntu user to run docker without sudo
sudo usermod -aG docker $USER
newgrp docker
```

---

## 5. Clone the Repository & Configure Secrets

Clone your `Atrium` repository onto the VM:
```bash
cd ~
git clone https://github.com/your-username/myGate.git atrium
cd atrium
```

Create your production environment file from the template:
```bash
cp .env.production.example .env
```

Generate secure random secrets:
```bash
# Generate 32-character random secrets for DB and JWT
DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
JWT_SEC=$(openssl rand -base64 36 | tr -dc 'a-zA-Z0-9' | head -c 36)

# Inject into .env
sed -i "s/replace_with_strong_database_password_here/$DB_PASS/" .env
sed -i "s/replace_with_cryptographically_strong_random_secret_at_least_32_characters/$JWT_SEC/" .env
```

Edit `.env` to verify your domain or public IP:
```bash
nano .env
```
*(Ensure `CLIENT_URL` contains your public domain or public IP, e.g. `http://<YOUR_OCI_IP>` or `https://atrium.yourdomain.com`)*.

---

## 6. Build and Start the Application Containers

Launch the multi-stage build:
```bash
docker compose up -d --build
```

Check the startup logs:
```bash
docker compose logs -f app
```
You should see:
```text
🔒 Atrium Container Starting...
📦 Applying database schema migrations...
🌱 SEED_ON_STARTUP=true detected. Seeding initial apartment data...
🚀 Atrium API Server running at http://localhost:5001
```

Verify containers are running:
```bash
docker compose ps
```

---

## 7. Configure Nginx Reverse Proxy & Free SSL (Let's Encrypt)

Copy the provided Nginx configuration:
```bash
sudo cp nginx/atrium.conf /etc/nginx/sites-available/atrium

# If you have a domain name, replace server_name with it:
# sudo sed -i "s/server_name _;/server_name atrium.yourdomain.com;/" /etc/nginx/sites-available/atrium

# Enable the site and remove default
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/atrium /etc/nginx/sites-enabled/atrium

# Test and reload Nginx
sudo nginx -t
sudo systemctl restart nginx
```

### Enable HTTPS with Certbot (If you have a domain pointing to your OCI IP):
```bash
sudo certbot --nginx -d atrium.yourdomain.com
```
Certbot will automatically obtain an SSL certificate, configure Nginx for HTTPS, and schedule automatic certificate renewal!

---

## 8. Summary of Active Security Controls on OCI

| Layer | Control Implemented | Protection Benefit |
| :--- | :--- | :--- |
| **Network (OCI VCN)** | Closed ingress ports; only 80, 443 & 22 open | Blocks unauthorized external access to private services. |
| **Database (PostgreSQL)** | Port 5432 **NOT published** to host (`expose: 5432`) | Immune to internet-wide database port scans & brute-force bots. |
| **Container Runtime** | Runs as unprivileged `USER node` (Alpine) | Prevents root breakout from container to host. |
| **Web Gateway (Nginx)** | Reverse proxy with 15MB upload clamp & IP headers | Hides backend topology, prevents buffer overflow attacks. |
| **API Rate Limiting** | Tiered rate limiters (600 req/15m global, 20/15m login) | Prevents brute-force credential stuffing and DDoS attacks. |
| **Storage & Uploads** | Direct static access to `/uploads/receipts` **forbidden**; `/uploads` authenticated | Sensitive resident receipts and bank UPI screenshots cannot be scraped. |
| **Multi-Tenancy** | Strict tenant scoping on every DB read/write query | Prevents Cross-Society IDOR attacks. |
| **Secrets Hygiene** | Server refuses to start if `JWT_SECRET` is insecure in production | Guarantees cryptographic session integrity. |

---

## 9. Automated Database Backups (Cron)

Set up a daily automated backup of your PostgreSQL database to protect resident data:

```bash
# Create backup directory
mkdir -p ~/backups

# Add daily backup cron job at 3:00 AM
(crontab -l 2>/dev/null; echo "0 3 * * * docker exec atrium-postgres pg_dump -U atrium_admin atrium | gzip > ~/backups/atrium_\$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz && find ~/backups -type f -mtime +14 -delete") | crontab -
```
This automatically backs up the database daily, compresses it, and keeps a rolling 14-day history.

