const Joi = require('joi');
const express = require('express');
const app = express();
const path = require('path');
const {Pool} = require('pg');
require('dotenv').config();
const PORT = 3000;

const pool = new Pool ({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
})
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client-side')));

app.get('/', (req, res) => { 
    res.sendFile(path.join(__dirname, 'client-side', 'index.html'));
});

app.post('/api/shorten', async (req, res) => {
  const schema= Joi.object({
    longUrl: Joi.string()
            .uri({scheme:['http','https']})
            .min(10)
            .required()
            .empty(''),
    shortUrl: Joi.string()
            .required()
  })

  const {error, value} = schema.validate(req.body)

  if (error) {
    return res.status(400).json({ error:error.details[0].message });
  }

  const { longUrl,shortUrl} = value;
  
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
