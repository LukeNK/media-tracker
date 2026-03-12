import express from 'express';

const app = express();

app.use('/static', express.static('static'));

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: '.' });
});

app.get('/api/ping', (req, res) => {
    res.json({ message: 'pong' });
});

app.listen(80, () => {
    console.log('Server is running on port 80');
});