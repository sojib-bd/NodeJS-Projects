//dependency
const express = require('express');
const app = express();
const {Pool} = require('pg');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const PORT = 8081;

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

//Database configuration
const pool = new Pool ({
    user: 'postgres',
    host: 'localhost',
    database: 'MyDatabase',
    password: 'admin123',
    port: 5432,
})

//render the html page for login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

//showing user profile by rendering the user-profile html
app.get('/profile',(req,res)=>{
    res.sendFile(path.join(__dirname, 'public', 'user-profile.html'));
})


//user signup endpoint
app.post('/signup',async(req,res)=>{
    
    try{
        const {username,email,password} = req.body;
        const result = await pool.query('select * from customers where username = $1',[username]);
        if(result.rows.length > 0){
            res.status(409).json({error: 'user already Exists'})
        }
        const passwordEncrypt = crypto.createHash('md5').update(password).digest('hex');
        const newUser = await pool.query(
        'INSERT INTO customers (email, password,username) VALUES ($1, $2, $3) RETURNING *',
        [email,passwordEncrypt,username]
      );

      res.status(201).json({ message: 'signup has been completed'});
    }catch(error){
      console.error('Error saving to DB:', error);
      res.status(500).json({ error: 'Database error' });
    }
})

//user login endpoint
app.post('/login',async (req,res)=>{
   const {email,password} = req.body;
   const passwordEncrypt = crypto.createHash('md5').update(password).digest('hex');
    try{
        const result = await pool.query('select * from customers where email = $1 and password = $2',[email,passwordEncrypt]);
        if(result.rows.length > 0){
            const user = result.rows[0]
            res.status(200).json({success: true,message:'login successful',username: user.username})
        }else{
            res.status(401).json({success: false,message:'login fail'})
        }

    }catch(error){
        console.error("error:",error)
    }


})

// showing all the users
app.get('/customers',async (req,res)=>{
    try{
        const result = await pool.query('select * from customers');
        res.json(result.rows);
    }catch(error){
        console.error(error)
        res.status(500).json({error:"server error"})
    }

});

// showing users with specific id
app.get('/customers/:id',async (req,res)=>{
    const id = parseInt(req.params.id);
    try{
        const result = await pool.query('select * from customers where id = $1',[id]);
        if(result.rows.length === 0){
            res.status(404).json({error: 'user not found'})
        }
        res.json(result.rows[0])
    }catch(error){
        console.error(error);
        res.status(500).json({error: 'Server error'})
    }
})


app.listen(PORT,()=>{
    console.log("server is listening to port 8081..");
})