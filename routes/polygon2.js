import { Router } from 'express';
import bodyParser from 'body-parser';
import { verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin } from "../routes/verifytoken.js";
import fetch from 'node-fetch'; // Ensure you have node-fetch installed

const router= Router();

//router.use(express.json()); // To parse JSON bodies

router.post('/createpolygon',verifyToken, async (req, res) => {
    const apiKey ="e7938c71ef75ba1c0c570e7bd0a09a3f";
    const coordinates1  = req.body.coordinates;
    console.log(coordinates1);
    const polygonData = {
        name: "Polygon Sample",
        geo_json: {
            type: "Feature",
            properties: {},
            "geometry":{
                "type":"Polygon",
                "coordinates":coordinates1
                   
                
                
            }
        }
    };

    const weatherURL = `http://api.agromonitoring.com/agro/1.0/polygons?appid=${apiKey}&duplicates=true`;
    try {
        const response = await fetch(weatherURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(polygonData)
        });
        const weatherData = await response.json();
        res.json(weatherData);
    } catch (error) {
        console.log("Error fetching weather data:", error);
        res.status(500).json({ error: 'Error fetching weather data' });
    }
});

router.post('/soildata',verifyToken,async (req, res) => {
    const apiKey ="e7938c71ef75ba1c0c570e7bd0a09a3f";
    const polyid =req.body.polyid;
    const weatherURL = `http://api.agromonitoring.com/agro/1.0/soil?polyid=${polyid}&appid=${apiKey}`;
    try {
        const response = await fetch(weatherURL);
        const weatherData = await response.json();
        res.json(weatherData);
    } catch (error) {
        console.log("Error fetching weather data:", error);
        res.status(500).json({ error: 'Error fetching weather data' });

}
}
)

export default router;

/*"geometry":{
    "type":"Polygon",
    "coordinates":[
       [
          [-71.1958,29.6683],
          [-71.2500,29.6687],
          [-71.3673,29.9092],
          [-71.7889,29.9992],
          [-71.1958,29.6683]
       ]
    ]
    
}*/

