import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRoute from './routes/user.js';
import authRoute from './routes/auth.js';
import polygonRoute from './routes/polygon2.js';



const app = express();

dotenv.config();
//const stripeRoute=require('./routes/stripe');
import cors from 'cors';
app.use(cors());
try {
    mongoose.connect("mongodb+srv://Root:kgILypQu5AvRe3Ng@cluster0.acvn3t4.mongodb.net/SoilProfiling?retryWrites=true&w=majority&appName=Cluster0").then(()=>console.log("mongoDB general space connected"));
} catch (error) {
    console.log(error);
}

app.use(express.json());


app.use('/auth',authRoute);
app.use('/user',userRoute);
//app.use('/features',weatherRoute);
app.use('/polygon',polygonRoute);
//app.use('/api',newsRoute);
//app.use('/api/bills',stripeRoute);



app.listen(3000,()=>{console.log("Listening on port 3000")});