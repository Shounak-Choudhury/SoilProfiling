import jwt from 'jsonwebtoken';
import User from '../schema/user.js';
import mongoose from 'mongoose';

const verifyToken=async (req,res,next)=>
    {
        const authHeader=req.headers.token;
        if(authHeader)
        {   const token = authHeader.split(" ")[1];
            const user= await User.findOne({'tokens.accessToken': token})
            //console.log(user);
            if(!user)
             {res.status(401).json({message:"You are not logged in or you are not authenticated"})}
            else
            {jwt.verify(token,"uygferuiheio",(err,decodeduser)=>
            {
                if(err)
                {res.status(403).json("token is not valid");}
                
                req.user = decodeduser;
                next();
            }
            );}
        }
        else
        {return res.status(401).json("You are not authenticated");}
    }

    const verifyTokenAndAuthorization=(req,res,next)=>
        {
            verifyToken(req,res,()=>
            {if(req.user.id === req.params.id || req.user.isAdmin)
                {console.log(req.user.id);
                next();}
             else
             {  console.log(req.user.id);
                console.log(req.params.id);
                res.status(403).json("You are not allowed to do that");}
            }
            )
        }
        const verifyTokenAndAdmin=(req,res,next)=>
        {
            verifyToken(req,res,()=>
            {if( req.user.isAdmin)
                {next();}
             else
             {res.status(403).json("You are not allowed to do that");}
            }
            )
        }

    export{verifyToken,verifyTokenAndAuthorization,verifyTokenAndAdmin};