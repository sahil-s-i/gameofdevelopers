var express = require('express');
const {User,RefreshToken,formatUser} = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const svgCaptcha = require('svg-captcha')

const authenticateToken = require('../middleware/authMiddleware');
const allowRoles = require('../middleware/roleMiddleware');
const validateCaptcha = require('../middleware/validateCaptchMiddleware');

var router = express.Router();
require('dotenv').config();



//simple hello responce
router.get('/hello',(req,res)=>{
  res.send("hello user");
})


//regestring user with this end-point
router.post('/regester', async (req, res) => {
  try {
    const bodyReq = req.body;
    const user = await User.create({ name: bodyReq.name, username: bodyReq.username, email:bodyReq.email, password: bodyReq.password });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating user');
  }
});



// Get all users
router.get('/get-all',authenticateToken,allowRoles(['admin']), async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching users');
  }
});


//Get urrent user information
router.get('/info',authenticateToken,async (req,res)=>{
  const userId = req.user?.id;
  const userInfo = await User.findByPk(userId);
  res.status(200).json({message:"i am accessed",data:formatUser(userInfo)});
});

router.get('/login',async (req,res)=>{
  const text = svgCaptcha.create();
  const captchaJWT = jwt.sign(
    {
      captcha:text.text
    },
    process.env.JWT_SECRET_ACCESS,
    {expiresIn: "3m"}
  );

  res.cookie('captcha_token',captchaJWT,{
    httpOnly:true,
    sameSite:'strict',
    maxAge:3*60*100
  });
  res.type('svg').status(200).send(text.data);
});


//login end point either we can login with email or username
router.post('/login',validateCaptcha,async(req,res)=>{
  const {identifier, password} = req?.body;
  const isEmail = identifier.includes('@');
  if(isEmail){
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(!emailRegex.test(identifier)){
      return res.status(400).json({message:"Invalid Email"});
    }
  }else{
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if(!usernameRegex.test(identifier) || identifier.length<3 || identifier.length>15){
      return res.status(400).json({message:"Invalid Username"});
    }
  }
  const whereClause = isEmail? {email: identifier}:{username:identifier};

  const user = await User.findOne({where:whereClause});

  if(!user) return res.status(404).json({error:'user not found'});

  const validPassword = await bcrypt.compare(password,user.password);
  if(!validPassword) return res.status(401).json({error:'Invalid password'});

  //creating accessToken with help of jwt 
  const accessToken = jwt.sign(
    {
      id:user.id,
      email:user.email,
      role:user.role,
    },
    process.env.JWT_SECRET_ACCESS,
    {expiresIn:process.env.ACCESS_TOKEN_EXPIRES_IN}
  );

  //creating refreshToken with the help of jwt
  const refreshtoken = jwt.sign(
    {
      id:user.id,
      email:user.email,
      role:user.role,
    },
    process.env.JWT_SECRET_REFRESH,
    {expiresIn:process.env.REFRESH_TOKEN_EXPIRES_IN}
  );

  //adding Refreshtoken to db
  await RefreshToken.create({
    token: refreshtoken,
    userId: user.id,
    expiresAt: new Date(Date.now()+7*24*60*60*1000),
  })

  
  //automatically setting refresh token in the user cookie
  res.cookie('refreshtoken',refreshtoken,{
    httpOnly:true,
    secure:false,
    sameSite:'strict',
    maxAge:7*24*60*60*1000,
  });


  //sending accessToken to the user in response as json data
  res.json({accessToken});

});


//this end-point helps user to get new access token if current one gets expired just need to hit this end-point nothing to worry about
router.get('/token',async (req,res)=>{
  const refreshtoken = req.cookies.refreshtoken;

  //if there is no refresh-token it will send responce with 401 status code
  if(!refreshtoken ) return res.status(401).json({error:'Refresh token missing'});


  //try to decode the response token if it is valid or not if valid it will create a access token and send it back to the front end
  try{
    const decoded = jwt.verify(refreshtoken,process.env.JWT_SECRET_REFRESH);

    //creating a new response token 
    const accessToken = jwt.sign(
      {
      id:decoded.id,
      email:decoded.email,
      role:decoded.role,
    },
    process.env.JWT_SECRET_ACCESS,
    {expiresIn:process.env.ACCESS_TOKEN_EXPIRES_IN}
    );

    //sending back response token
    res.json({accessToken});
  }catch(err){
    //if refresh token is invalid it will send back a response with 403 status code
    res.status(403).json({error:'Invalid refresh token'});
  }
})


//logout end-point will remove refreshToken from the db and also from the user cookie
router.get('/logout',async (req,res)=>{
  const token = req.cookies.refreshtoken;
  if(token){
    await RefreshToken.destroy({where:{token}});
    res.clearCookie('refreshtoken');
  }
  res.json({message:'Logged out successfully'});
});


//just a sample end point which will is only accessable from the uthenticated user 
router.get('/me',authenticateToken,allowRoles(['user']),(req,res)=>{
  console.log("I am accessed");
  res.json({message:'hello hacker'});
});


module.exports = router;
