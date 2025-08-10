const jwt = require('jsonwebtoken');
require('dotenv').config();
function validateCaptcha(req,res,next){

    const userCaptch = req.body.captch;
    if(userCaptch.length != 4){
        return res.status(400).json({message:"Invalid Captch length"});
    }
    const jwtCaptch = req.cookies.captcha_token;

    if(!userCaptch) return res.status(404).json({message:"captch is missing"});
    if(!jwtCaptch) return res.status(404).json({message: "Captch error"});
    try{
        const decoded = jwt.verify(jwtCaptch,process.env.JWT_SECRET_ACCESS);
        if(decoded.captcha == userCaptch){
            next();
        }else{
            res.status(400).json({message:"invalid captcha"});
        }

    }catch(err){
        console.log(err)
        res.status(400).json({message:"invalid captcha"});
    }

}

module.exports = validateCaptcha;