import express from 'express';
import fs from 'fs';

const app = express();

// Basic routes that should be available without the server
// These routes will be available as static files in GitHub Pages
app.use('/static', express.static('static'));

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: '.' });
});

app.get('/database', (req, res) => {
    res.sendFile('database.json', { root: '.' });
});

// API routes for the server
app.get('/api/ping', (req, res) => {
    res.send('pong');
});

app.listen(80, () => {
    console.log('Server is running on port 80');
});