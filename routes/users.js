var express = require('express');
const {User,RefreshToken} = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { token } = require('morgan');
const authenticateToken = require('../middleware/authMiddleware');
const allowRoles = require('../middleware/roleMiddleware');
var router = express.Router();
require('dotenv').config();


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/',(req,res)=>{
  console.log(req);
  res.send(req.body);
});



router.get('/hello',(req,res)=>{
  res.send("hello user");
})
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
router.get('/get-all', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching users');
  }
});




router.post('/login',async(req,res)=>{
  const {identifier, password} = req?.body;
  console.log(identifier);
  const isEmail = identifier.includes('@');
  const whereClause = isEmail? {email: identifier}:{username:identifier};

  const user = await User.findOne({where:whereClause});

  if(!user) return res.status(404).json({error:'user not found'});

  const validPassword = await bcrypt.compare(password,user.password);
  if(!validPassword) return res.status(401).json({error:'Invalid password'});

  const accessToken = jwt.sign(
    {
      id:user.id,
      email:user.email,
      role:user.role,
    },
    process.env.JWT_SECRET_ACCESS,
    {expiresIn:process.env.ACCESS_TOKEN_EXPIRES_IN}
  );

  const refreshtoken = jwt.sign(
    {
      id:user.id,
      email:user.email,
      role:user.role,
    },
    process.env.JWT_SECRET_REFRESH,
    {expiresIn:process.env.REFRESH_TOKEN_EXPIRES_IN}
  );

  await RefreshToken.create({
    token: refreshtoken,
    userId: user.id,
    expiresAt: new Date(Date.now()+7*24*60*60*1000),
  })

  res.cookie('refreshtoken',refreshtoken,{
    httpOnly:true,
    secure:false,
    sameSite:'strict',
    maxAge:7*24*60*60*1000,
  });


  res.json({accessToken});

});


router.post('/token',async (req,res)=>{
  const refreshtoken = req.cookies.refreshtoken;

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
