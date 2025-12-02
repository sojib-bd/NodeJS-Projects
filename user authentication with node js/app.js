const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const app = express();
const { Client } = require('pg');
const session = require('express-session');
const PORT = 8080;
require('dotenv').config();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// session config
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60,
    httpOnly: true
  }
}))



const client = new Client({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE
});

app.use(express.static('staticFiles'));
const filepath = path.join(__dirname,'./staticFiles/HomePage.html');

app.get('/', async(req,res)=>{
    const fileHandler = await fs.open(filepath,'r');
    const readStream = fileHandler.createReadStream();
     res.setHeader("Content-Type","text/html");
     readStream.pipe(res);
     readStream.on('error',(err)=>{
       res.status(500).send('Error reading Files');
     })

    //  const result = await client.query('select * from customers');
    //  console.log(result.rows);
})

app.get('/allUsers',async(req,res)=>{
  try{
        const result = await client.query('select * from customers');
        res.json(result.rows);
    }catch(error){
        console.error(error)
        res.status(500).json({error:"server error"})
    }
})

app.post('/newUser',async(req,res)=>{
  try{
        const {fullName,email,password} = req.body;
        const result = await client.query('select * from customers where username = $1',[fullName]);
        if(result.rows.length > 0){
            res.status(409).json({error: 'user already Exists'})
        }
        // const passwordEncrypt = crypto.createHash('md5').update(password).digest('hex');
        const newUser = await client.query(
        'INSERT INTO customers (email, password,username) VALUES ($1, $2, $3) RETURNING *',
        [email,password,fullName]
      );

      res.status(201).json({ message: 'signup has been completed'});
    }catch(error){
      console.error('Error saving to DB:', error);
      res.status(500).json({ error: 'Database error' });
    }
})

app.post('/login',async (req,res)=>{
   const {email,password} = req.body;
  //  const passwordEncrypt = crypto.createHash('md5').update(password).digest('hex');
    try{
        const result = await client.query('select * from customers where email = $1 and password = $2',[email,password]);
        if(result.rows.length > 0){
            const user = result.rows[0];
           //saving the session in memory and send to the browser
            req.session.user = {
              id: user._id,
              email: user.email
            }
            res.status(200).json({success: true,message:'login successful',username: user.username})
        }else{
            res.status(401).json({success: false,message:'login fail'})
        }

    }catch(error){
        console.error("error:",error)
    }


})

//check the used logged In or not
app.get('/auth/check',(req,res)=>{
  if(req.session.user){
    res.json({loggedIn: true,user: req.session.user})
  }else{
    res.json({loggedIn:false})
  }
})


client.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Connection error', err));

app.listen(PORT,()=>{
    console.log(`Server is listening to port ${PORT}`);
})