const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const connectDB = require('./config/db')
const router = require('./routes')

const app = express()
const allowedOrigins = [
    'https://codeonwork.in',
    'https://www.codeonwork.in', 
    process.env.FORNTEND_URL, // आपके .env से
    'http://localhost:3000' // लोकल डेवलपमेंट के लिए
  ];
  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"]
  }));

  app.options('*', (req, res) => {
    res.status(200).end();
  });
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.use("/api", router)

const PORT = process.env.PORT || 8080;


connectDB().then(()=>{
    app.listen(PORT,()=>{
        console.log("connnect to DB")
        console.log("Server is running "+PORT)
    })
})