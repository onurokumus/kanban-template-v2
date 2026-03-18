# Nginx Configuration for Kanban

To host this application under the `/k11c0_kezban` subpath on Nginx, you will need to serve the built frontend static files and proxy the API requests to the Python Flask backend.

## 1. Build the Frontend
Inside the `frontend` folder, run the build command to generate the production bundle. Because we updated `vite.config.ts`, Vite already knows to bundle the assets using the `/k11c0_kezban/` base path.

```bash
npm run build
```

The build will output inside `frontend/dist`. Copy all contents from this `dist` folder to your web server's document directory.
For example: `C:\nginx\html\k11c0_kezban\` or `/var/www/html/k11c0_kezban/`.

## 2. Nginx Server Block
Add the following `location` blocks to your active `nginx.conf` (or your site configuration file). 

```nginx
server {
    # ... your existing server configuration (listen 80, server_name heliweb1, etc) ...
    
    # 1. Serve Frontend React Web App
    location /k11c0_kezban/ {
        # Update this alias to where you placed the frontend 'dist' folder
        alias /var/www/html/k11c0_kezban/;
        
        # Enables React Router to handle client-side routing
        try_files $uri $uri/ /k11c0_kezban/index.html;
    }

    # 2. Proxy API Requests to Backend (Flask)
    # The frontend is programmed to hit /k11c0_kezban/api/ during production.
    location /k11c0_kezban/api/ {
        # We proxy pass directly to the Flask port and path.
        proxy_pass http://127.0.0.1:5104/api/;
        
        # Forward required headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 3. Reload Nginx
Test the Nginx config, and if successful, reload the service so changes take effect immediately:

```bash
# On Windows
nginx -s reload

# On standard Linux
sudo nginx -t
sudo systemctl reload nginx
```
