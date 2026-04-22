# RiskShield Self-Hosted Deployment Guide

This guide covers deploying RiskShield on your own infrastructure using Docker.

## System Requirements

- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 1GB disk space
- 64-bit processor

### Supported Platforms
- Linux (Ubuntu 20.04+, CentOS 8+)
- macOS (Intel & Apple Silicon)
- Windows 10+ (with Docker Desktop)

## Quick Start (5 minutes)

### 1. Install Docker

**Linux:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

**macOS:**
Download [Docker Desktop](https://www.docker.com/products/docker-desktop)

**Windows:**
Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

### 2. Clone/Download Files

```bash
git clone https://github.com/riskshield/riskshield-self-hosted.git
cd riskshield-self-hosted
```

Or download the ZIP file and extract it.

### 3. Configure Environment

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
# Application
BASE44_APP_ID=your-app-id-here
VITE_API_URL=http://localhost:3000

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Database (if using external DB)
DATABASE_URL=postgresql://user:password@host:5432/riskshield
```

### 4. Start the Application

```bash
docker-compose up -d
```

The app will be available at `http://localhost:3000`

### 5. Initial Setup

Open your browser and go to `http://localhost:3000`:
1. Create the admin account
2. Set up your organization profile
3. Import your existing risk data (if any)

## Production Deployment

### Enable HTTPS

1. Obtain SSL certificates (Let's Encrypt recommended)
2. Place certificates in `./certs/` directory
3. Uncomment the HTTPS section in `nginx.conf`
4. Update server_name with your domain
5. Restart services:

```bash
docker-compose restart nginx
```

### Database Persistence

Data is stored in the `./data` volume. To back up:

```bash
docker-compose exec riskshield tar -czf /app/data/backup.tar.gz /app/data
docker cp riskshield:/app/data/backup.tar.gz ./backup-$(date +%Y%m%d).tar.gz
```

### Resource Limits

Edit `docker-compose.yml` to add resource constraints:

```yaml
services:
  riskshield:
    # ... other config
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Automatic Backups

Create a cron job (Linux/macOS) or Task Scheduler (Windows) to backup data:

```bash
#!/bin/bash
BACKUP_DIR="/path/to/backups"
docker-compose -f /path/to/docker-compose.yml exec -T riskshield tar -czf - /app/data | gzip > $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz
# Keep only last 7 days
find $BACKUP_DIR -name "backup-*.tar.gz" -mtime +7 -delete
```

## Troubleshooting

### Port Already in Use
Change the port in `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Access via http://localhost:8080
```

### Container Won't Start
Check logs:
```bash
docker-compose logs riskshield
docker-compose logs nginx
```

### Out of Memory
Increase Docker's memory limit in Docker Desktop settings or increase `memory` limit in `docker-compose.yml`.

### Slow Performance
- Increase allocated CPU and memory
- Ensure sufficient disk space
- Check network connectivity
- Monitor with: `docker stats`

## Updating to Latest Version

1. Pull the latest code:
```bash
git pull origin main
```

2. Rebuild and restart:
```bash
docker-compose down
docker-compose up -d --build
```

3. Backup data before updating

## Support & Documentation

- **GitHub Issues**: https://github.com/riskshield/issues
- **Documentation**: https://docs.riskshield.io
- **Community Forum**: https://community.riskshield.io
- **Email Support**: support@riskshield.io

## License

See LICENSE.md for licensing information.