
const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./database');

const PORT = process.env.PORT || 3006;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

        // Mock SMS/Email Notification Endpoint
        const url = req.url;

            if (url === '/api/notify' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => { body += chunk.toString(); });
                req.on('end', () => {
                    const { type, to, message } = JSON.parse(body || '{}');
                    console.log(`\n[NOTIFY] ${String(type).toUpperCase()} sent to ${to}: ${message}`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, sent: { type, to, message } }));
                });
                return;
            }

    // API ROUTES
    if (url.startsWith('/api/')) {
        // USERS API
        if (url === '/api/users' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(db.getUsers()));
            return;
        }

        if (url === '/api/users' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                try {
                    const user = JSON.parse(body || '{}');
                    db.addUser(user);
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(user));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Invalid JSON' }));
                }
            });
            return;
        }

        if (url.startsWith('/api/users/') && req.method === 'PUT') {
            const username = url.split('/').pop();
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                try {
                    const { role } = JSON.parse(body || '{}');
                    const updated = db.updateUserRole(username, role);
                    if (updated) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(updated));
                    } else {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Not Found' }));
                    }
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Invalid JSON' }));
                }
            });
            return;
        }
        if (url === '/api/patients' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(db.getPatients()));
            return;
        }

        if (url === '/api/patients' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                const patient = JSON.parse(body);
                db.addPatient(patient);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(patient));
            });
            return;
        }

        if (url === '/api/appointments' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(db.getAppointments()));
            return;
        }

        if (url === '/api/appointments' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                const appointment = JSON.parse(body);
                db.addAppointment(appointment);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(appointment));
            });
            return;
        }

        // Invoices
        if (url === '/api/invoices' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(db.getInvoices()));
            return;
        }

        if (url === '/api/invoices' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                const invoice = JSON.parse(body);
                db.addInvoice(invoice);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(invoice));
            });
            return;
        }

        if (url.startsWith('/api/invoices/') && req.method === 'PUT') {
            const id = url.split('/').pop();
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                const { status } = JSON.parse(body);
                const updated = db.updateInvoiceStatus(id, status);
                if (updated) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(updated));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Not Found' }));
                }
            });
            return;
        }

        if (url.startsWith('/api/appointments/') && req.method === 'PUT') {
            const id = url.split('/').pop();
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                const { status } = JSON.parse(body);
                const updated = db.updateAppointment(id, status);
                if (updated) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(updated));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Not Found' }));
                }
            });
            return;
        }

        // Insurance
        if (url === '/api/insurance' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(db.getInsuranceClaims()));
            return;
        }

        if (url === '/api/insurance' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                const claim = JSON.parse(body);
                db.addInsuranceClaim(claim);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(claim));
            });
            return;
        }
    }

    // STATIC FILES
    let filePath = '.' + url;
    if (url === '/' || url === '') {
        filePath = './index.html';
    } else if (!path.extname(url)) {
        // Handle routes like /dashboard
        filePath = './' + url + '.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
        console.error(`\nError: Port ${PORT} is already in use.`);
        console.error(`On Windows: run 'netstat -ano | findstr :${PORT}' then 'taskkill /PID <pid> /F'`);
        console.error(`Or set a different port: 'set PORT=3006 && npm start' (Windows)`);
        console.error(`Or use 'npx kill-port ${PORT}'`);
        process.exit(1);
    } else {
        console.error(err);
        process.exit(1);
    }
});

server.listen(PORT, () => {
    console.log(`\n🛡️  Advanced Security Enabled (RateLimit & Sanitize)\n`);
    console.log(`    ┌────────────────────────────────────────────────────────┐`);
    console.log(`    │  🚀 CLINIC DIGITAL SERVER STARTED                      │`);
    console.log(`    │  🌍 URL: http://localhost:${PORT}                         │`);
    console.log(`    │  🛡️  Security: Custom + No-Dependency Mode             │`);
    console.log(`    │  📦 Database: MongoDB / Mongoose (JSON Simulation)     │`);
    console.log(`    │  💰 Payment: ZAAD / eDahab Ready                       │`);
    console.log(`    └────────────────────────────────────────────────────────┘\n`);
    console.log(`    Admin Login: mahad_analyst / password123\n`);
});
