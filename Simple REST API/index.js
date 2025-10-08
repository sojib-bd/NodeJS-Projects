const express = require('express');
const app = express();
const {Pool} = require('pg');
const cors = require('cors');
const path = require('path');
const PORT = 8081;

app.use(express.json());
app.use(cors());

const pool = new Pool ({
    user: 'postgres',
    host: 'localhost',
    database: 'MyDatabase',
    password: 'admin123',
    port: 5432,
})

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/customers',async (req,res)=>{
    try{
        const result = await pool.query('select * from customers');
        res.json(result.rows);
    }catch(error){
        console.error(error)
        res.status(500).json({error:"server error"})
    }

});

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

app.get('/profile',(req,res)=>{
    res.sendFile(path.join(__dirname, 'public', 'user-profile.html'));
})

app.post('/customers',async (req,res)=>{
   const {email,password} = req.body;
    try{

        const result = await pool.query('select * from customers where email = $1 and password = $2',[email,password]);
        
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

app.put('/todos/:id',(req,res)=>{
    let todo = todos.find(t=> t.id === parseInt(req.params.id));
    if(!todo) return res.status(404).json({error:'Todo not found'});
    const {task,done} = req.body;
    if(task !== undefined) todo.task = task;
    if(done !== undefined) todo.done = done;
    res.json(todo)
})

app.delete('/todos/:id',(req,res)=>{
    let index = todos.findIndex(t => t.id === parseInt(req.params.id));
    if(index == -1) return res.status(404).json({error: 'Todo not found'});

    todos.splice(index,1);
    res.status(204).send();
})

app.listen(PORT,()=>{
    console.log("server is listening to port 8081..");
})