import fetch from 'node-fetch'; 
import bodyParser from 'body-parser';
import { createClient } from 'redis';
import mongoose from 'mongoose';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from './schema/user.js';
import { randomBytes } from 'crypto'; // Import the randomBytes function from the crypto module

try {
  mongoose.connect("mongodb+srv://Root:kgILypQu5AvRe3Ng@cluster0.acvn3t4.mongodb.net/SoilProfiling?retryWrites=true&w=majority&appName=Cluster0").then(()=>console.log("mongoDB connected"));
} catch (error) {
  console.log(error);
}

const redisClient = createClient({
  password: 'iAO7so9FFv6n9jfkjejiNtyk8lKih6pf',
  socket: {
      host: 'redis-14161.c212.ap-south-1-1.ec2.redns.redis-cloud.com',
      port: 14161
  }
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

const router=express();
router.use(express.json());

const authkey = '410073AGplspgCU45M6650a047P1';
const template_id='658567f8d6fc0537e4466bd1';


router.post('/sendotp', async (req, res) => {
  try {
    const mobile = req.body.mobile;
    const url = 'https://control.msg91.com/api/v5/flow';
    await redisClient.connect(); //connect to redis
   
    const buffer = randomBytes(2); // Step 1: Generate 2 random bytes
    const number = buffer.readUInt16BE(0) % 10000; // Step 2: Convert these bytes to a 4-digit number
    const otp=number.toString().padStart(4, '0'); // Step 3: Ensure the OTP is always 4 digits long

    const otpKey = `otp:${mobile}`;
  
      try {
        await redisClient.setEx(otpKey, 300, otp); // Store OTP in Redis with 5 minutes expiry
  
        console.log(`OTP for ${mobile}: ${otp}`); // Replace with actual OTP sending logic
  
        //res.status(200).json({ message: 'OTP sent successfully' });
      } catch (err) {
        console.log('Error setting OTP in Redis:', err);
        res.status(500).json({ error: 'Error sending OTP' });
      }

    //console.log(otp);

    const response = await fetch(url, {
      method: 'POST', // Specify the method as POST
      headers: {
        'authkey': '410073AGplspgCU45M6650a047P1',
        'accept': 'application/json',
        'content-type': 'application/json' // Corrected 'application/JSON' to 'application/json'
      },
      body: JSON.stringify({
        template_id: '658567f8d6fc0537e4466bd1',
        short_url: '1',
        recipients: [
          {
            mobiles: mobile,
            "var1": "SustainEVO",
            "var2": otp
          }
        ]
      })
    });
    
    const Data = await response.json();
    res.json(Data);
  } catch (error) {
    console.log("Error fetching weather data:", error);
    res.status(500).json({ error: 'Error' });
  }
});

router.post('/verifyotp', async (req, res) => {
    const mobile=req.body.mobile;
    const otp=req.body.otp;

    const user= await User.findOne({username: req.body.username});


    if (!mobile || !otp) {
      return res.status(400).json({ error: 'Mobile number and OTP are required' });
    }

    const otpKey = `otp:${mobile}`;

    try {
      const storedOtp = await redisClient.get(otpKey);

      if (storedOtp === otp) 
        {await redisClient.del(otpKey); // Clear OTP after successful verification
         const accessToken = jwt.sign({
            id:user._id,//payloads 
            isAdmin:user.isAdmin,//payload
        },"uygferuiheio",{expiresIn:"3d"})

        res.cookie("login",accessToken,{
            expires:new Date(Date.now()+50000),
            httpOnly:true   })         
       

       res.status(200).json({message: 'OTP verified successfully', user, accessToken, });
        
      } else {
        return res.status(400).json({ error: 'Invalid OTP' });
      }
    } catch (err) {
      console.log('Error verifying OTP in Redis:', err);
      res.status(500).json({ error: 'Error verifying OTP' });
    }
  });
  
router.listen(process.env.PORT||5000,()=>{console.log("Listening on port 5000")});
