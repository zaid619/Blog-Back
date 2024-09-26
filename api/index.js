
const express = require('express');
const cors = require('cors');
const { default: mongoose } = require('mongoose');
const User = require('./models/User')
const Post = require('./models/Post')
const app = express();
const cookieParser = require('cookie-parser')
const multer = require('multer')
const uploadMiddleware  = multer({dest : 'uploads/'})
const fs = require('fs')


const dotenv = require('dotenv');
dotenv.config();

app.use(cors({
  origin: ['https://zaid5775.github.io', 'https://zaid5775.github.io/Blog', 'http://localhost:3000'], // Array of allowed origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  credentials: true, // Allow cookies to be sent with requests
}));


app.use(express.json());
app.use('/uploads' , express.static(__dirname + '/uploads'))

const jwt = require('jsonwebtoken');
app.use(cookieParser());
mongoose.connect(process.env.MY);




//signup function 
app.post('/register', async (req, res) => {
    const { username, password } = req.body; 
    try{
        const userDoc =   await User.create({username, password})
        res.json(userDoc);
        res.status(200).json({ message: 'Registration successful' });
    }
    catch(e){
        res.status(400).json(e);
    }


    // console.log(username, password); // for testing purpose
    // res.status(200).json({ message: 'Registration successful' }); // for testing purpose
});


app.post('/login', async (req,res) => {
    const {username,password} = req.body;
    const userDoc = await User.findOne({username});
    
    if (password === userDoc.password) {
      // logged in
      jwt.sign({username,id:userDoc._id}, process.env.SECRET, {}, (err,token) => {
        if (err) throw err;
        res.cookie('token', token).json({
          id:userDoc._id,
          username,
        });
      });
    } else {
      res.status(400).json('wrong credentials');
    }
  });




  app.get('/profile', (req, res) =>{
    const {token} =  req.cookies;
    jwt.verify(token, process.env.SECRET, {}, (err, info) =>{
      if(err) throw err;
      res.json(info);
    })
    
  })    



// index.js (backend)
  app.post('/logout', (req,res) => {
    res.cookie('token', '').json('ok');
  });
  


  //create post
  app.post('/post', uploadMiddleware.single('file') , async(req, res ) =>{
  
      const {originalname, path} = req.file;
      const parts = originalname.split('.');
      const ext = parts[parts.length-1];
      const newPath = path + '.' + ext
      fs.renameSync(path, newPath);


      const {token} =  req.cookies;
      jwt.verify(token, process.env.SECRET, {}, async (err, info) =>{
        if(err) throw err;
        const{title, summary, content} = req.body;
        const postDoc = await Post.create({
            title,
            summary,
            content,
            cover: newPath,
            author: info.id
        })
  
        res.json(postDoc);


      })
      
     
  })



  app.get('/post', async (req, res) =>{
     res.json(await Post.find()
      
        .populate('author', ['username'])
        .sort({createdAt: -1})
        .limit(20)
          
      );
    
  })






  app.get('/post/:id', async (req, res) => {
    const {id} = req.params;
    const postDoc = await Post.findById(id).populate('author', ['username']);
    res.json(postDoc);
  })







app.listen(4000, () => {
    console.log('Server is running on port 4000');
   
});

