import { Router } from 'express';
import fetch from 'node-fetch'; 
import User from '../schema/user.js';
import cookieParser from 'cookie-parser';
import { createClient } from 'redis';
import CryptoJS from 'crypto-js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { randomBytes } from 'crypto'; // Import the randomBytes function from the crypto module
import { verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin } from "../routes/verifytoken.js";

const router = Router();
router.use(cookieParser());

const redisClient = createClient({
    password: 'iAO7so9FFv6n9jfkjejiNtyk8lKih6pf',
    socket: {
        host: 'redis-14161.c212.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 14161
    }
  });
  
  redisClient.on('error', (err) => console.log('Redis Client Error', err));
  
  const authkey = '410073AGplspgCU45M6650a047P1';
  const template_id='658567f8d6fc0537e4466bd1';
            

/*router.post('/signup',async(req,res)=>
    {
        try {

            const newUser= await User.create({
                username:req.body.username,
                email: req.body.email,
                phone: req.body.phone,
                Work_location: req.body.Work_location,
                state:req.body.state,
                password: CryptoJS.AES.encrypt(req.body.password,"hgiufhrwoijcjvj").toString(),

            });
           
            res.status(200).json(newUser)

        } catch (error) {
            console.log(error.message)
            res.status(500).json({message: error.message})
            
        }
        
    }
)*/

  
router.post('/signup/sendotp', async (req, res) => {
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
          'content-type': 'application/json' 
        },
        body: JSON.stringify({
          template_id: '658567f8d6fc0537e4466bd1',
          short_url: '1',
          recipients: [
            {
              mobiles: mobile,
              "var1": "Signup",
              "var2": otp
            }
          ]
        })
      });
      
      const Data = await response.json();
      res.json(Data);
    } catch (error) {
      console.log("Error fetching data:", error);
      res.status(500).json({ error: 'Error' });
    }
  });
  


  router.post('/signup/verifyotp', async (req, res) => {
      const mobile=req.body.mobile;
      const otp=req.body.otp;
  
      if (!mobile || !otp) {
        return res.status(400).json({ error: 'Mobile number and OTP are required' });
      }
  
      const otpKey = `otp:${mobile}`;
  
      try {
        const storedOtp = await redisClient.get(otpKey);
  
        if (storedOtp === otp) 
          {await redisClient.del(otpKey);
           //res.status(200).json({message: 'OTP verified successfully'});
           try {

            const newUser= await User.create({
                username:req.body.username,
                email: req.body.email,
                phone: req.body.mobile,
                Work_location: req.body.Work_location,
                state:req.body.state,
                password: CryptoJS.AES.encrypt(req.body.password,"hgiufhrwoijcjvj").toString(),

            });
           
            res.status(200).json({message:"OTP successfully verified",newUser})

        } catch (error) {
            console.log(error.message)
            res.status(500).json({message: error.message})
            
        }
          
        } else {
          return res.status(400).json({ error: 'Invalid OTP' });
        }
      } catch (err) {
        console.log('Error verifying OTP in Redis:', err);
        res.status(500).json({ error: 'Error verifying OTP' });
      }
    })

router.post('/login/password',async(req,res)=>
    {
        try {
            const user= await User.findOne({username: req.body.username});
            !user && res.status(401).json("Wrong credentials");

            const password1= req.body.password;
            
            
            const OriginalPassword = CryptoJS.AES.decrypt(user.password,"hgiufhrwoijcjvj").toString(CryptoJS.enc.Utf8);

            //console.log(password1+" / "+OriginalPassword);
            if(password1!== OriginalPassword)
             {res.status(401).json("Wrong credentials");}

            const accessToken = jwt.sign({
                id:user._id,//payloads 
                isAdmin:user.isAdmin,//payload
            },"uygferuiheio",{expiresIn:"3d"})

            let oldtokens= user.tokens||[];

            if(oldtokens.length)
              {
                 oldtokens=oldtokens.filter(t=>{
                      const timediff=(Date.now()-parseInt(t.signedAt))/1000;
                      if(timediff<259200)
                          {return t}
                  })
              }
  
            await User.findByIdAndUpdate(user._id,{tokens:[...oldtokens,{accessToken,signedAt:Date.now.toString()}]});
  
            res.cookie("login",accessToken,{
                expires:new Date(Date.now()+50000),
                httpOnly:true   })         
           

            res.status(200).json({user, accessToken, message:"Login Sucessful"});
        } catch (error) {
            res.status(500).json({message: error.message});
        }
    }
)
  
 router.post('/login/sendotp', async (req, res) => {
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
              "var1": "Login",
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
  


  router.post('/login/verifyotp', async (req, res) => {
      const mobile=req.body.mobile;
      const otp=req.body.otp;
  
      const user= await User.findOne({phone: req.body.mobile});
  
  
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

          let oldtokens= user.tokens||[];

          if(oldtokens.length)
            {
               oldtokens=oldtokens.filter(t=>{
                    const timediff=(Date.now()-parseInt(t.signedAt))/1000;
                    if(timediff<259200)
                        {return t}
                })
            }

          await User.findByIdAndUpdate(user._id,{tokens:[...oldtokens,{accessToken,signedAt:Date.now.toString()}]});

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
    })

router.post('/logout',verifyToken,async (req,res)=>
    {   
        res.cookie('login','',{maxAge:1});
        const authHeader=req.headers.token;
        const token = authHeader.split(" ")[1];

        const user= await User.findOne({username: req.body.username});

        // console.log(user);

        const tokens=user.tokens;

        //const newTokens= tokens.filter(t=>t.token !== token);
        await User.findByIdAndUpdate(user._id,{tokens:[]});

        res.status(200).json({message:"User logged out"});
    }
)

export default router;






