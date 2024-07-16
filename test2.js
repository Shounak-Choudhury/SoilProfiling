import bodyParser from 'body-parser';
import multer from 'multer';
import mongoose from 'mongoose';
import Model from './schema/modelschema.js' // Import your Mongoose model
import express from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';
//const {verifyToken,verifyTokenAndAuthorization, verifyTokenAndAdmin} =require("../routes/verifytoken");




const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null,file.originalname);
    }
  })
const app=express()
const upload = multer({ storage: storage})


app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended:true }));


import { spawn } from 'child_process';

//const app = express();




// Define a POST route
app.post('/upload', upload.single('file'), (req, res) => {
    function runPythonAndSaveToDB() {
        const pythonProcess = spawn('python3', ['/Users/shounakchoudhury/Desktop/Soil Profiling/model.py']);

        let responseData = ''; // Store the received data from Python process

        pythonProcess.stdout.on('data', (data) => {
            responseData += data.toString(); // Append the received data

            // Check if the entire response has been received
            if (responseData.endsWith('\n')) {
                // Parse the output data (assuming it's in JSON format)
                const outputData = JSON.parse(responseData);

                // Create a new document based on your Mongoose model
                const newData = new Model({
                    photograph: outputData.photograph,
                    gravel: outputData.gravel,
                    sand: outputData.sand,
                    silt: outputData.silt,
                });

                // Save the document to MongoDB
                newData.save()
                    .then(() => {
                        console.log('Data saved to MongoDB successfully.');
                        res.status(200).send('Data saved to MongoDB successfully.');
                    })
                    .catch((err) => {
                        console.error('Error saving data to MongoDB:', err);
                        res.status(500).send('Error saving data to MongoDB.');
                    });
            }
        });

        // Handle errors
        pythonProcess.stderr.on('data', (data) => {
            console.error('Error executing Python script:', data.toString());
            
        });
    }

    mongoose.connect('mongodb+srv://Root:kgILypQu5AvRe3Ng@cluster0.acvn3t4.mongodb.net/')
        .then(() => {
            console.log('Connected to MongoDB.');
            // Call the function to run Python code and save to MongoDB
            runPythonAndSaveToDB();
        })
        .catch((err) => {
            console.error('Error connecting to MongoDB:', err);
            res.status(500).send('Error connecting to MongoDB.');
        });
});

// URL of the deployed machine learning model

// POST route to handle incoming requests
app.post('/getmodeloutput', upload.single('file'), (req, res) => {
    const modelUrl = `https://aws-onerender.com/SoilProfiling/model.py./uploads/${req.file.filename}`;

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const postData = JSON.stringify(req.body); // Assuming any additional data is in the request body

    const request = https.request(modelUrl, options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
            console.log('Received chunk:', chunk.toString());
        });

        response.on('end', () => {
            console.log('Response ended:', data);
            res.send(data);

            // Delete the temporary file after sending the response
            fs.unlink(req.file.path, (err) => {
                if (err) {
                    console.error('Error deleting the temporary file:', err);
                }
            });
        });
    });

    request.on('error', (error) => {
        console.error('Error:', error);
        res.status(500).send('Error fetching model output');

        // Ensure temporary file is deleted on error
        fs.unlink(req.file.path, (err) => {
            if (err) {
                console.error('Error deleting the temporary file:', err);
            }
        });
    });

    // Write data to request body
    request.write(postData);
    request.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});