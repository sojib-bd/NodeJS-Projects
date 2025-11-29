const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const app = express();
const PORT = 8080;

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
})

app.listen(PORT,()=>{
    console.log(`Server is listening to port ${PORT}`);
})