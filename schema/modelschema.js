import mongoose from 'mongoose';
import CryptoJS from 'crypto-js';

const ModelSchema= new mongoose.Schema(
    {
        photograph: {type: String, unique:true},
        gravel:{type: String, required:true},
        sand:{type:String,required:true},
        silt:{type: String, required:true},
        Particle_size:{type: String},
        username:{type: String, unique:true},
        Sodiumn_content:{type: String},
        Phosphorus_content:{type: String},
        Nitrogen_content:{type: String},
        Pottasium_content:{type: String},
        Carbon_content:{type: String},
        pH_level:{type:String},
        location:{type:String},
        CEC:{type:String}
        

    },{timestamps: true}
);

const Model=mongoose.model("model",ModelSchema);
export default Model;