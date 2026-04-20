import express from 'express';
import bodyParser from 'body-parser';
import { exec } from 'child_process';
import fs from 'fs';

const app = express();
const PORT = 8080;

app.use(bodyParser.json());

// Basic routes that should be available without the server
// These routes will be available as static files in GitHub Pages
app.use('/static', express.static('static'));

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: '.' });
});

app.get('/database.json', (req, res) => {
    res.sendFile('database.json', { root: '.' });
});

// API routes for the server
app.get('/api/ping', (req, res) => {
    console.log(`[----] Client connected: ${req.ip}`);
    res.send('pong');
});

app.get('/api/sync', (req, res) => {
    console.log(`[CRIT] Database sync requested`);
    exec('git pull && git add database.json && git commit -m "Sync database" && git push', (error, stdout, stderr) => {
        console.log(stdout || stderr);
        res.send(stdout || stderr);
    });
});

app.post('/api/add', (req, res) => {
    // get the request, rewrite to the file
    console.log(`[CRIT] Database updated`);
    fs.writeFileSync('database.json', JSON.stringify(req.body, null, 4));
    res.send('ok');
});

app.listen(PORT, () => {
    console.log(`[----] Server is running on port ${PORT}`);
});
