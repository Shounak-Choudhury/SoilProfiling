//const express=require('express');
import { Router } from 'express';
import fs from 'fs';
import { createReadStream } from "fs";
import path from 'path';
import { fileFromSync } from "fetch-blob/from.js";
import bodyParser from 'body-parser';
import CryptoJS from 'crypto-js';
import multer from 'multer';
import FormData from 'form-data';
import User from '../schema/user.js';
import { verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin } from "../routes/verifytoken.js";
import { spawn } from 'child_process';

const router = Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null,file.originalname);
    }
  })
  
const upload = multer({ storage: storage})
//router.use(express.json());
router.use(bodyParser.json());
//router.use(express.urlencoded({ extended:true }));

router.post('/upload',verifyToken,upload.single('file'), async (req, res) => {
 

    const pythonScript = 'model.py';
    const filePath = "./uploads/"+req.file.filename; // Replace with the path to your file
    
    const pythonProcess = spawn('python3', [pythonScript, filePath]);
    
    let mlOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      mlOutput += data.toString();
      console.log(`stdout: ${data}`)
    });
  
    pythonProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
  
    pythonProcess.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      // Send the machine learning output as the response to the POST request
      res.send(mlOutput);
    });
  })

  router.post('/uploadpic',verifyToken,upload.single('file'), async (req, res) => {
        try {
       
        const file=req.file;
        if(!file)
        {console.log("File  not uploaded");}
        else
        {console.log("File uploaded");}
        const filePath = "./uploads/"+req.file.filename;
       // console.log(req.file.mimetype+" "+req.file.originalname);
        // Create FormData object
        
        
        
       /* const formData = new FormData();
        const abc=formData.append('file', fs.createReadStream(filePath));*/

      const file1 = fileFromSync(filePath); // this will only stat the file for getting the file size
	  
	  const formData = new FormData();
	  formData.append("file", fs.createReadStream(filePath));
	  //formData.append("modelId", this.modelId);
        
        

        //console.log( fs.createReadStream(filePath));
        //console.log("form data created is.."+abc);

        // Send POST request to the API
        const response = await fetch('http://68.183.85.81/api/predict', {
            method: 'POST',
            body:formData,
        });

        // Handle API response
        

        const result = await response.json();
        console.log('Prediction result:', result);

        // Send the prediction result back to the client
        res.json(result);
    } catch (error) {
        console.error('Error uploading file:', error.message);
        res.status(500).send('Error uploading file');
    }
})
    

router.put("/:id",verifyTokenAndAuthorization, async (req,res)=>
    { if(req.body.password)
        {req.body.password=CryptoJS.AES.encrypt(req.body.password,"hgiufhrwoijcjvj").toString()
    }
        try {
            const id= req.params.id;
            console.log(id);
            console.log(req.body);
            const updatedUser= await User.findByIdAndUpdate(req.params.id,{$set:req.body},{new:true});
            res.status(200).json(updatedUser);
        } catch (error) {
            res.status(500).json({message: error.message});
            
        }
    }
    )

    router.delete("/:id",verifyTokenAndAuthorization, async (req,res)=>
    { 
        try {
            
            await User.findByIdAndDelete(req.params.id);
            res.status(200).json({message:"User has been deleted"});
        } catch (error) {
            res.status(500).json({message: error.message});
            
        }
    }
    )

    router.get("/:id",verifyTokenAndAdmin, async (req,res)=>
    { 
        try {
            
            const user=await User.findById(req.params.id);
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({message: error.message});
            
        }
    }
    )

    router.get("/",verifyTokenAndAdmin, async (req,res)=>
    {   const query= req.query.new 
        try {
            //query? await User.find().sort({_id:-1}).limit(1):
            const users= query? await User.find().sort({_id:-1}).limit(5): await User.find() ;
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({message: error.message});
            
        }
    }
    )


    


  export default router;



  