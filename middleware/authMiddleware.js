const jwt = require('jsonwebtoken');
const { json } = require('sequelize');
require('dotenv').config();

//it is middleware which is used to check whether the user is logged in and have valid access token
function authenticateToken(req,res,next){
    const authHeader = req.headers['authorization'];
    const token =authHeader?.split(' ')[1];
    if(!token) return res.sendStatus(401);

    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET_ACCESS);
        req.user = decoded;
        next();
    }catch(err){
        return res.status(403).json({error:'Access token invalid or expired'});
    }
}

module.exports = authenticateToken;