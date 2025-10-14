const express= require('express');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config();

app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = process.env.SECRET_KEY;
const tickets = new Map();

app.post('/generate-ticket',async (req,res)=>{
    const {name,email} = req.body;
    if(!name || !email) {
        res.status(400).json({error:'name and email required'})
    }
    const payload = {
        name,
        email,
        ticketId : Date.now(),
    }
    const token = jwt.sign(payload,JWT_SECRET,{
        expiresIn: '1d'
    })
    tickets.set(payload.ticketId,token);
    const qrCodeDataUrl = await QRCode.toDataURL(token);
    res.json({
        token,
        qrCodeDataUrl
    });
});


app.post('/verify-ticket',async(req,res)=>{
    const {token} = req.body;
    if(!token){
        res.status(400).json({error:'token is Required'})
    }

    try{
        const decoded = jwt.verify(token,JWT_SECRET);
        res.json({
            valid: true,
            data: decoded
        })
    }catch(error){
        res.status(401).json({
            valid: false,
            error: 'Invalid or Expire token'
        })
    }
})


app.listen(port,()=>{
    console.log(`Server is listening to port ${port}`);
})