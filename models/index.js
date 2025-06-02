const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();
const bcrypt = require('bcrypt');
const { token } = require('morgan');

// Initialize Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: process.env.DB_PORT,
  }
);

// Test the connection
sequelize.authenticate()
  .then(() => console.log('✅ PostgreSQL connected via Sequelize'))
  .catch(err => console.error('❌ Connection error:', err));

// Example User model
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  username:{
    type:DataTypes.STRING,
    allowNull: false,
    unique:true,
  },
  email:{
    type: DataTypes.STRING,
    allowNull:false,
    unique:true,
    validate:{
        isEmail:true,
    },
  },
  password:{
    type: DataTypes.STRING,
    allowNull:false,
  },
  role:{
    type:DataTypes.STRING,
    allowNull:false,
    defaultValue:'user',
  }

});

User.beforeCreate(async (user,option)=>{
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password,salt);
})


const RefreshToken = sequelize.define('ReffreshToken',{
    token:{
        type: DataTypes.TEXT,
        allowNull:false,
    },
    userId:{
        type:DataTypes.INTEGER,
        allowNull:false,
    },
    expiresAt:{
        type:DataTypes.DATE,
        allowNull:false,
    },
});




// Sync models with the database
sequelize.sync();

module.exports = { sequelize, User , RefreshToken};
