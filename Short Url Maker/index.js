const express = require('express');
const app = express();
const path = require('path');
const {Pool} = require('pg');
const PORT = 3000;

const pool = new Pool ({
    user: 'postgres',
    host: 'localhost',
    database: 'MyDatabase',
    password: 'admin123',
    port: 5432,
})
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client-side')));

app.get('/', (req, res) => { 
    res.sendFile(path.join(__dirname, 'client-side', 'index.html'));
});

app.post('/api/shorten', async (req, res) => {
  const { longUrl, shortUrl } = req.body;

  if (!longUrl || !shortUrl) {
    return res.status(400).json({ error: 'Missing longUrl or shortUrl' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO url_mappings (long_url, short_url) VALUES ($1, $2) RETURNING *',
      [longUrl, shortUrl]
    );

    res.status(201).json({ message: 'URL shortened', shortUrl: result.rows[0].short_url });
  } catch (error) {
    console.error('Error saving to DB:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/visit/:shortUrlAlias', async (req, res) => {
  const shortUrlAlias = req.params.shortUrlAlias;
  const shortUrl = `short.ly/${shortUrlAlias}`; // Construct the full short URL

  try {
    const result = await pool.query(
      'SELECT long_url FROM url_mappings WHERE short_url = $1',
      [shortUrl]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Short URL not found');
    }

    const longUrl = result.rows[0].long_url;
    res.redirect(longUrl);
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).send('Server error during redirect');
  }
});



app.listen(PORT,()=>{
    console.log(`Server is listening on port ${PORT}`);
})
