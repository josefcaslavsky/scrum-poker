# Web Deployment Guide

This guide explains how to deploy the Scrum Poker web app to a self-hosted server.

## Prerequisites

- Ubuntu/Debian server with sudo access
- Nginx installed
- Node.js 18+ installed
- Laravel backend running on the same server (localhost:8000)
- WebSocket server running (localhost:8081)

## Deployment Steps

### 1. Build the Web App

On your local machine or CI/CD pipeline:

```bash
npm run build:web
```

This creates a `dist-web` directory with the production build.

### 2. Upload Files to Server

Upload the `dist-web` contents to your server:

```bash
# Using rsync
rsync -avz dist-web/ user@yourserver.com:/var/www/scrum-poker/

# Or using scp
scp -r dist-web/* user@yourserver.com:/var/www/scrum-poker/
```

### 3. Configure Nginx

Copy the Nginx configuration:

```bash
sudo cp web/nginx.conf /etc/nginx/sites-available/scrum-poker
```

Edit the configuration to match your setup:

```bash
sudo nano /etc/nginx/sites-available/scrum-poker
```

Update these values:
- `server_name` - your domain name
- `root` - path where you uploaded the files
- API/WebSocket ports if different

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/scrum-poker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Set Permissions

Ensure Nginx can read the files:

```bash
sudo chown -R www-data:www-data /var/www/scrum-poker
sudo chmod -R 755 /var/www/scrum-poker
```

### 5. Configure Firewall

Allow HTTP/HTTPS traffic:

```bash
sudo ufw allow 'Nginx Full'
```

### 6. Optional: Setup SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d scrumpoker.example.com
```

Certbot will automatically configure SSL in your Nginx config.

## Environment-Specific Configuration

If your API/WebSocket URLs are different in production, update them in:

- `src/services/api.js` - API base URL
- `src/services/broadcasting.js` - WebSocket configuration

You can use environment variables:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
```

Then build with:

```bash
VITE_API_URL=https://api.yourserver.com/api npm run build:web
```

## Monitoring

### Check Nginx Logs

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Test the PWA

1. Open the site in a browser
2. Check browser console for service worker registration
3. Try installing the app (should see an "Install" prompt)
4. Test offline functionality

## Updating the App

When you need to deploy updates:

```bash
# 1. Build new version
npm run build:web

# 2. Upload to server
rsync -avz dist-web/ user@yourserver.com:/var/www/scrum-poker/

# 3. Clear Nginx cache (if enabled)
sudo rm -rf /var/cache/nginx/*
sudo systemctl reload nginx
```

The service worker will automatically update when users revisit the app.

## Troubleshooting

### PWA Not Installing
- Check manifest.webmanifest is accessible
- Verify all icon paths are correct
- Check browser console for errors

### WebSocket Not Connecting
- Verify WebSocket server is running on port 8081
- Check Nginx proxy configuration for WebSocket upgrade headers
- Ensure firewall allows WebSocket connections

### API Requests Failing
- Verify Laravel backend is running
- Check CORS headers are properly set
- Review Nginx proxy_pass configuration

### Service Worker Errors
- Clear browser cache and hard reload
- Check sw.js is being served with correct headers
- Verify workbox configuration in vite.config.js

## Docker Deployment (Alternative)

If you prefer Docker, create a `Dockerfile` in the `web/` directory:

```dockerfile
FROM nginx:alpine

# Copy built files
COPY ../dist-web /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
npm run build:web
docker build -t scrum-poker-web -f web/Dockerfile .
docker run -d -p 80:80 scrum-poker-web
```

## Production Checklist

- [ ] Build completed successfully
- [ ] Files uploaded to server
- [ ] Nginx configured and reloaded
- [ ] SSL certificate installed (if using HTTPS)
- [ ] API backend is accessible
- [ ] WebSocket server is running
- [ ] PWA installs correctly
- [ ] Offline mode works
- [ ] All features tested in production
- [ ] Monitoring/logging configured
