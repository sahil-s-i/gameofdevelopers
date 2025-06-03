var express = require('express');
const {User,RefreshToken,formatUser} = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { token } = require('morgan');
const authenticateToken = require('../middleware/authMiddleware');
const allowRoles = require('../middleware/roleMiddleware');
var router = express.Router();
require('dotenv').config();


/* GET users listing. */

//simple hello responce
router.get('/hello',(req,res)=>{
  res.send("hello user");
})


//regestring user with this end
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
  console
  .log(req.user);
  console.log(userId);
  const userInfo = await User.findByPk(userId);
  console.log(userInfo);
  res.status(200).json({message:"i am accessed",data:formatUser(userInfo)});
});




//login end point either we can login with email or username
router.post('/login',async(req,res)=>{
  const {identifier, password} = req?.body;
  const isEmail = identifier.includes('@');
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

  try{
    const decoded = jwt.verify(refreshtoken,process.env.JWT_SECRET_REFRESH);

    const accessToken = jwt.sign(
      {
      id:decoded.id,
      email:decoded.email,
      role:decoded.role,
    },
    process.env.JWT_SECRET_ACCESS,
    {expiresIn:process.env.ACCESS_TOKEN_EXPIRES_IN}
    );

    res.json({accessToken});
  }catch(err){
    res.status(403).json({error:'Invalid refresh token'});
  }
})


router.get('/logout',async (req,res)=>{
  const token = req.cookies.refreshtoken;
  if(token){
    await RefreshToken.destroy({where:{token}});
    res.clearCookie('refreshtoken');
  }
  res.json({message:'Logged out successfully'});
});

router.get('/me',authenticateToken,allowRoles(['user']),(req,res)=>{
  console.log("I am accessed");
  res.json({message:'hello hacker'});
});


module.exports = router;
