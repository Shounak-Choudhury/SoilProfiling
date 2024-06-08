import mongoose from 'mongoose';
import CryptoJS from 'crypto-js';

const UserSchema= new mongoose.Schema(
    {
        username: {type: String, required:true, unique:true},
        email:{type: String, required:true, unique:true},
        phone:{type:String,required:true, unique:true},
        password:{type: String, required:true},
        state:{type: String},
        Work_location:{type: String},
        tokens:[{type:Object}],
        isAdmin:{type: Boolean, default:false}
    },{timestamps: true}
);

const User=mongoose.model("user",UserSchema);
export default User;