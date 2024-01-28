const express = require('express');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();
app.use(bodyParser.json());
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');
const passport = require('passport');
const User = require('./models/user');
const Test = require('./models/test');
const Organisation = require('./models/organisation')
const Entries = require('./models/entries');
const Chat = require('./models/chat');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const clientSessions = require('client-sessions');
const path = require('path');
const fs = require('fs');
const port = 3000;
const urlencodedParser = bodyParser.urlencoded({ extended: false });
app.set('view engine', 'ejs');
app.use(session({
  secret: 'kartik_express',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
}));

app.use(
  clientSessions({
    cookieName: 'mySession', 
    secret: 'your-secret-key', 
    duration: 24 * 60 * 60 * 1000, 
    activeDuration: 1000 * 60 * 5, 
  })
);
app.use(express.static('static'));
let questions = [];
let answers = [];
let uanswers = [];
let responses = [];
let directories = [];
let p = [];
let i = 0;
let val = 0;
let fullName = "";
let uname = "";
let ouname = "";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on('error', (error) => console.error('MongoDB connection error:', error));
db.once('open', () => console.log('Connected to MongoDB'));



app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: '912159999278-3regu0rk0lh84vh1gurshcq6lrurtvs9.apps.googleusercontent.com',
      clientSecret: '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',
      callbackURL: 'http://localhost:3000/google/callback',
    },
    (accessToken, refreshToken, profile, done) => {
    
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});


passport.deserializeUser((user, done) => {
  done(null, user);
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/ulogin' }),
  (req, res) => {
    res.redirect('/persist');
  }
);


app.get('/persist', async (req, res) => {
  const user = await User.findOne({email: req.user.emails[0].value});
  if (!user) {
    try {
      const newUser = new User({
        name: req.user.displayName,
        email: req.user.emails[0].value,
      });
  
      const savedUser = await newUser.save();
      res.redirect('/code');
      console.log('User saved successfully:', savedUser);
    } catch (error) {
      res.sendFile(__dirname + '/ulogin.html');
      console.error('Error inserting user:', error);
    }
  }else{
    res.redirect('/code');
  }
  
});

function string_to_array(string) {
  let words = string.split(" ");
  return words
}
function calculateCommonPercentage(array1, array2, thresholdPercentage) {
  if (!Array.isArray(array1) || !Array.isArray(array2)) {
    throw new Error('Both arguments must be arrays.');
  }
  if (thresholdPercentage < 0 || thresholdPercentage > 100) {
    throw new Error('Threshold percentage must be between 0 and 100.');
  }
  const set1 = new Set(array1);
  const set2 = new Set(array2);
  const intersection = new Set([...set1].filter(element => set2.has(element)));

  const commonPercentage = (intersection.size / Math.min(set1.size, set2.size)) * 100;

  return commonPercentage >= thresholdPercentage;
}

function generateRandom8DigitNumber() {
  const min = 10000000; 
  const max = 99999999; 

  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

  return randomNumber;
}

app.post('/usign', urlencodedParser, async (req, res) => {
  req.session.rval = generateRandom8DigitNumber();
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'karthikpatnaiktest@gmail.com', 
        pass: 'fpfialtokgkxzbnj' 
    }
  });
  
  const mailOptions = {
    from: 'karthikpatnaiktest@gmail.com', 
    to: req.body['email'], 
    subject: 'Validation',
    text: 'Welcome To Automated Test Evalution Platform!, Your Validation Code:' + req.session.rval +' ',
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
  fullName = req.body['full-name'];
  uname = req.body['username'];
  req.session.gmail = req.body['email'];
  req.session.pass = req.body['password'];
  res.sendFile(__dirname + '/econf.html');
});
app.get('/usign', (req, res) => {
  res.sendFile(__dirname + '/usersign.html');
});

app.get('/ulogin', (req, res) => {
  if(!req.session.isLogin){
    res.sendFile(__dirname + '/ulogin.html');
  }
  else{
    res.sendFile(__dirname + '/code.html');
  }
});

app.post('/econf', urlencodedParser, async (req, res) => {
  let x = parseInt(req.body['code']);
  if(x===req.session.rval){
    try {
      const newUser = new User({
        name: fullName,
        username: uname,
        email: req.session.gmail,
        password: req.session.pass,
      });
  
      const savedUser = await newUser.save();
      res.sendFile(__dirname + '/ulogin.html');
      console.log('User saved successfully:', savedUser);
    } catch (error) {
      res.sendFile(__dirname + '/ulogin.html');
      console.error('Error inserting user:', error);
    }
  }else{
    res.send("Invalid Code");
  }
});

app.post('/ulogin', urlencodedParser, async (req, res) => {
  uname = req.body['username'];
  const pass = req.body['password'];
  console.log(uname);

  try {
    const user = await User.findOne({ username: uname });
    if (!user) {
      console.log('User not found');
      return res.status(401).send('User not found');
    }

    const isMatch = await user.comparePassword(pass);

    if (isMatch) {
      req.session.isLogin = true;
      res.sendFile(__dirname + '/code.html');
      console.log('User authenticated');
    } else {
      console.log('Incorrect password');
      res.status(401).send('Incorrect password');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

app.post('/proceed', urlencodedParser, async (req, res) => {
  if (req.session.isLogin || req.isAuthenticated()) {
    val = parseInt(req.body['test-code']);

    try {
      const document = await Test.findOne({ testid: val }, 'questions answers percentage');

      if (document) {
        questions = document.questions;
        answers = document.answers;
        p = document.percentage;

        res.sendFile(__dirname + '/ins.html');
        console.log('Document found:', document);
      } else {
        console.log('Document not found');
      }
    } catch (err) {
      console.error(err);
    }
  } else {
    res.redirect('/ulogin');
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/main.html');
});

app.get('/code', (req, res) => {
  res.sendFile(__dirname + '/code.html');
});

const upload = multer({ storage: storage });

app.post('/upload1', upload.single('video'), (req, res) => {
  if (req.session.isLogin || req.isAuthenticated()) {
    console.log(req.body.ans);
    uanswers.push(req.body.ans);
    if (questions.length < uanswers.length) {
      uanswers = uanswers.slice(0, questions.length);
    }
    const videoBuffer = req.file.buffer;
    res.send('Video uploaded successfully.');
  } else {
    res.redirect('/ulogin');
  }
});

async function apireq(inp) {
  const formData = new FormData();
  const videoFilePath = path.join(__dirname, 'uploads', inp);
  const fileData = fs.readFileSync(videoFilePath);
  formData.append('video', fileData, inp);

  const apiUrl = 'http://127.0.0.1:5000/head_pose';

  try {
    const response = await axios.post(apiUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    fs.unlink(videoFilePath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
      } else {
        console.log('File deleted successfully');
      }
    });

    return response.message;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

async function getdir() {
  try {
    const files = await fs.promises.readdir('uploads');
    console.log('Files in the directory:', files);
    return files;
  } catch (err) {
    console.error('Error reading directory:', err);
    throw err;
  }
}

app.get('/sendVideo', async (req, res) => {
  if (req.session.isLogin || req.isAuthenticated()) {
    try {
      directories = await getdir();
      for (let i = 0; i < directories.length; i++) {
        const respons = await apireq(directories[i]);
        responses.push(respons);
        console.log(`Response ${i + 1}: ${respons}`);
      }

      console.log('All requests completed');
      console.log(responses);

      res.redirect('/eval');
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal server error');
    }
  } else {
    res.redirect('/ulogin');
  }
});

app.get('/q1', async (req, res) => {
  if (req.session.isLogin || req.isAuthenticated()) {
    console.log(questions.length);
    console.log(answers.length);
    if (i < questions.length) {
      i = i + 1;
      console.log(questions);
      console.log(i);
      const tmt = uanswers.some(word => word.includes("Cheated"));
      if(!tmt){
      res.render('q1', { bal: questions[i - 1] });
      }else{
        res.render('q1', { bal: "Sorry You are Disqualified You Cannot Continue the Test" });
      }
    } else {
      console.log('hi');
      i = 0;
      res.redirect('/sendVideo');
    }
  } else {
    res.redirect('/ulogin');
  }

});

app.get('/eval', async (req, res) => {
  if (req.session.isLogin || req.isAuthenticated()) {
    let marks = 0;
    for (let i = 0; i < answers.length; i++) {
      let tarr = string_to_array(uanswers[i]);
      let carr = string_to_array(answers[i]);
      console.log("TARR",tarr);
      console.log("CARR",carr);
      console.log(uanswers);
      const statusm = !uanswers.includes("Cheated");
      let bval = calculateCommonPercentage(carr, tarr, p[i]);
      console.log(bval);
      if (bval && responses[i]=== 0 && statusm ) {
        marks = marks + 1;
      }
    }
    
      if(!req.isAuthenticated()){
        try {
        const document = await User.findOne({ username: uname }, 'name email');

      const newEntry = new Entries({
        name: document.name,
        testid: val,
        marks: marks,
        email: document.email,
      });
      const savedEntry = await newEntry.save();
      res.sendFile(__dirname + '/last.html');
      console.log('User saved successfully:', savedEntry);
    } catch (error) {
      res.sendFile(__dirname + '/last.html');
      console.error('Error inserting user:', error);
    }
      }else{
        try{
        const newEntry = new Entries({
          name: req.user.displayName,
          testid: val,
          marks: marks,
          email: req.user.emails[0].value,
        });
        const savedEntry = await newEntry.save();
        res.sendFile(__dirname + '/last.html');
        console.log('User saved successfully:', savedEntry);
      } catch (error) {
        res.sendFile(__dirname + '/last.html');
        console.error('Error inserting user:', error);
      }

      }
  } else {
    res.redirect('/ulogin');
  }
});
app.get('/forget', async (req, res) => {
  res.sendFile(__dirname + '/forget.html');
});

app.post('/forget', urlencodedParser, async (req, res) => {
    const user = await User.findOne({ email: req.body['email'] });
    if(!user){
      res.send("User not found with this email");
    }
    else{
      req.session.forget = generateRandom8DigitNumber();
      req.session.gmail = req.body['email'];
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'karthikpatnaiktest@gmail.com', 
            pass: 'fpfialtokgkxzbnj' 
        }
      });
      
      const mailOptions = {
        from: 'karthikpatnaiktest@gmail.com', 
        to: req.session.gmail, 
        subject: 'Create New Passowrd',
        text: 'Your Confirmation Code:'+ req.session.forget +' ',
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
        } else {
          console.log('Email sent:', info.response);
        }
      });
      res.sendFile(__dirname + '/finput.html');
    }
});

app.post('/conf', urlencodedParser, async (req, res) => {
 let x = parseInt(req.body['code']);
 if(x===req.session.forget){
  res.sendFile(__dirname + '/pass.html');
 }else{
  res.send("Confirmation Code Not Matched");
 }
});

app.post('/passs', urlencodedParser, async (req, res) => {
  const userEmailToUpdate = req.session.gmail; 
  const newPassword = req.body.password; 
  
  User.findOneAndUpdate(
    { email: userEmailToUpdate }, 
    { $set: { password: newPassword } }, 
    { new: true } 
  )
  .then(updatedUser => {
    if (updatedUser) {
      console.log('Updated user:', updatedUser);
      res.redirect('/ulogin');
    } else {
      console.log('User not found');
      res.redirect('/ulogin');
    }
  })
  .catch(err => {
    console.error('Error updating user:', err);
    res.redirect('/ulogin');
  });
});


app.get('/logout', async (req, res) => {
  req.session.isLogin = false;
  res.redirect('/ulogin');
});

app.get('/ologin', async (req, res) => {
  if(!req.session.isoLogin){
    res.sendFile(__dirname + '/ologin.html');
  }
  else{
    res.redirect('/dashboard');
  }
});

app.get('/osign', async (req, res) => {
  res.sendFile(__dirname + '/adminsign.html');
});

app.post('/ologin', urlencodedParser, async (req, res) => {
  uname = req.body['username'];
  const pass = req.body['password'];
  console.log(uname);

  try {
    const user = await Organisation.findOne({ username: uname });
    req.session.orguname = user.username;
    req.session.orgname = user.orgname;
    if (!user) {
      console.log('User not found');
      return res.status(401).send('User not found');
    }

    const isMatch = await user.comparePassword(pass);

    if (isMatch) {
      req.session.isoLogin = true;
      req.session.ouname = uname;
     
      console.log('User authenticated');
      res.redirect('/dashboard');
    } else {
      console.log('Incorrect password');
      res.status(401).send('Incorrect password');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

app.post('/osign', urlencodedParser, async (req, res) => {
  req.session.rval = generateRandom8DigitNumber();
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'karthikpatnaiktest@gmail.com', 
        pass: 'fpfialtokgkxzbnj' 
    }
  });
  
  const mailOptions = {
    from: 'karthikpatnaiktest@gmail.com', 
    to: req.body['email'], 
    subject: 'Validation',
    text: 'Welcome To Automated Test Evalution Platform!, Your Validation Code:' + req.session.rval +' ',
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
  fullName = req.body['full-name'];
  ouname = req.body['username'];
  req.session.gmail = req.body['email'];
  req.session.pass = req.body['password'];
  res.sendFile(__dirname + '/oeconf.html');
});

app.post('/oeconf', urlencodedParser, async (req, res) => {
  let x = req.body['code'];
  if(req.session.rval===parseInt(x)){
    try {
      const newOrg = new Organisation({
        orgname: fullName,
        username: ouname,
        email: req.session.gmail,
        password: req.session.pass,
      });
  
      const savedOrg = await newOrg.save();
      res.sendFile(__dirname + '/ologin.html');
      console.log('User saved successfully:', savedOrg);
    } catch (error) {
      res.sendFile(__dirname + '/ologin.html');
      console.error('Error inserting user:', error);
    }
  }else{
    res.send("Invalid Code");
  }
});

app.post('/ques', urlencodedParser, async (req, res) => {
  if (req.session.isoLogin) {
    const formDataArray = req.body;
    req.session.questions = formDataArray.map(item => item.question);
    req.session.answers = formDataArray.map(item => item.answer);
    req.session.percentages = formDataArray.map(item => parseInt(item.percentage));
    console.log('Questions:', req.session.questions);
    req.session.testid1 = generateRandom8DigitNumber();
    const qu = req.session.questions;
    const ans = req.session.answers;
    const per = req.session.percentages;
    console.log(req.session.testid1);
    const newT = new Test({
      orgname: uname,
      testname: req.session.tname,
      desc: req.session.tdes,
      testid: req.session.testid1,
      percentage: per,
      questions: qu,
      answers: ans,
    });

    const savedT = await newT.save();

    console.log('User saved successfully:', savedT);
    res.json({ message: 'Data processed successfully' });
  } else {
    res.redirect('/ologin');
  }

});

app.get('/dashboard', async (req, res) => {
  if (req.session.isoLogin) {
    let combinedArray = [];
    let testnameArray = [];
    let descArray = [];
    let testidArray = [];
    try {
      const document = await Test.find({ orgname: req.session.ouname }, 'testname desc testid');
      if (document) {
        document.forEach(item => {
          testnameArray.push(item.testname);
          descArray.push(item.desc);
          testidArray.push(item.testid);
        });
        console.log('Document found:', document);
      } else {
        console.log('Document not found');
      }
    }catch (err) {
      console.error(err);
    }
    for (let i = 0; i < testnameArray.length; i++) {
      const testObject = {
        name: testnameArray[i],
        description: descArray[i],
        testid: testidArray[i],
      };
      combinedArray.push(testObject);
    }
    console.log(combinedArray);

    res.render('q3', { testData: combinedArray });
  } else {
    res.redirect('/ologin');
  }
});

app.get('/start', (req, res) => {
  if (req.session.isoLogin) {
    res.sendFile(__dirname + '/code1.html');
  } else {
    res.redirect('/ologin');
  }

});

app.post('/proceed1', urlencodedParser, async (req, res) => {
  if (req.session.isoLogin) {
    req.session.tname = req.body['test-code'];
    req.session.tdes = req.body['test-code1'];
    console.log(req.session.tname);
    console.log(req.session.tdes);
    req.session.md = false;
    res.redirect('/details');
  } else {
    res.redirect('/ologin');
  }
});
app.get('/details', (req, res) => {
  if (req.session.isoLogin) {
    if (!req.session.md) {
      req.session.md = true;
      res.sendFile(__dirname + '/index.html');
    } else {
      res.render('q2', { bal: req.session.testid1 });
    }
  } else {
    res.redirect('/ologin');
  }

});

app.get('/get/:id', async (req, res) => {
  if (req.session.isoLogin) {
    const userId = req.params.id;
    let combinedArray1 = [];
    let cname = [];
    let cmarks = [];
    let cmail = []; 
    const document = await Entries.find({ testid: userId }, 'name marks email');
    if (document) {
      document.forEach(item => {
        cname.push(item.name);
        cmarks.push(item.marks);
        cmail.push(item.email);
      });
      console.log('Document found:', document);
    } else {
      console.log('Document not found');
    }
    for (let i = 0; i < cname.length; i++) {
      const testObject = {
        name: cname[i],
        marks: cmarks[i],
        email: cmail[i],
      };
      combinedArray1.push(testObject);
    }
    res.render('q4', { bal: userId, testData: combinedArray1 , orgName : req.session.orguname});
  } else {
    res.redirect('/ologin');
  }
});

app.get('/chat/:email/:orgname', async (req, res) => {
  if(req.session.isoLogin){
    req.session.sw = true;
  const email = req.params.email;
  req.session.orguser = req.params.orgname;
  const org = await Organisation.findOne({ username: req.params.orgname });
  req.session.orgname = org.username;
  const user = await User.findOne({ email: email });
  req.session.uk = user.username === " " ? user.email : user.username;
  req.session.unome = user.name;
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'karthikpatnaiktest@gmail.com', 
        pass: 'fpfialtokgkxzbnj' 
    }
  });
  
  const mailOptions = {
    from: 'karthikpatnaiktest@gmail.com', 
    to: email, 
    subject: 'Organisation Chat',
    text: 'Hello, Lets discuss in Chat Join here:',
    html: '<p>Hello! You got a message from ' + org.orgname + ' Click <a href="http://localhost:3000/chat2/'+email+'/'+req.params.orgname+'">here</a> to begin chat.</p>',
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
  res.render('chat', { bal: user.name});
  }else{
    res.redirect('/ologin');
  }
});

app.get('/chat2/:email/:orgname', async (req, res) => {
  req.session.sw = false;
  const email = req.params.email;
  const orgname = req.params.orgname;
  const orguser = req.session.orguname;
  const user = await User.findOne({ email: email });
  req.session.uk = user.username === " " ? user.email : user.username;
  const org = await Organisation.findOne({ username: orgname });
  req.session.jwt = org.orgname;
  req.session.oname = org.username;
  console.log("Hellllllooooooo"+org.email);
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'karthikpatnaiktest@gmail.com', 
        pass: 'fpfialtokgkxzbnj' 
    }
  });
  
  const mailOptions = {
    from: 'karthikpatnaiktest@gmail.com', 
    to: org.email, 
    subject: 'User Chat',
    text: 'Hello, Lets discuss in Chat Join here:',
    html: '<p>Hello, You Recieved a Reply from '+user.name+', Join here: Click <a href="http://localhost:3000/chat/'+email+'/'+req.params.orgname+'">here</a> to begin chat.</p>',
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
 });
 res.render('chat2', { bal: req.session.jwt});

});

app.post('/test', async (req, res) => {
  const documentsArray = [];
  try {
    const documents = await Chat.find({});    
    documentsArray.push(documents);
  } catch (err) {
    console.error(err);
  }
  const extractedValues = documentsArray[0]
  .filter((item) => (item.to === req.session.orgname && item.sender === req.session.uk) || (item.to === req.session.uk && item.sender === req.session.orgname))
  .map(({ sender, text }) => ({ sender: sender === req.session.orgname ? sender + ' left' : sender + ' right', text }));
  res.send(extractedValues);
});

app.post('/test1', async (req, res) => {
  const documentsArray = [];
  try {
    const documents = await Chat.find({});
    
    documentsArray.push(documents);
  } catch (err) {
    console.error(err);
  }

  const extractedValues = documentsArray[0]
  .filter((item) => (item.to === req.session.oname && item.sender === req.session.uk) || (item.to === req.session.uk && item.sender === req.session.oname))
  .map(({ sender, text }) => ({ sender: sender === req.session.uk ? sender + ' left' : sender + ' right', text }));
  console.log(extractedValues);
  res.send(extractedValues);
});

app.post('/sendMessage', urlencodedParser, async (req, res) => {
  const {text} = req.body;
  let sender = req.session.orguser;
  try {
    const message = new Chat({
      sender: sender,
      to: req.session.uk,
      text: text,
    });

    const savedChat = await message.save();
    console.log('Chat saved successfully:', savedChat);
    res.render('chat', { bal: req.session.unome});
  } catch (error) {
    res.sendFile(__dirname + '/ologin.html');
    console.error('Error inserting user:', error);
  }
});

app.post('/sendMessage1', urlencodedParser, async (req, res) => {
  const {text} = req.body;
  let sender = req.session.uk;
  try {
    const message = new Chat({
      sender: sender,
      to: req.session.oname,
      text: text,
    });

    const savedChat = await message.save();
    console.log('Chat saved successfully:', savedChat);
    res.render('chat2', { bal: req.session.jwt});
  } catch (error) {
    res.sendFile(__dirname + '/ologin.html');
    console.error('Error inserting user:', error);
  }
});

app.get('/oforget', async (req, res) => {
  res.sendFile(__dirname + '/oforget.html');
});

app.post('/oforget', urlencodedParser, async (req, res) => {
    const user = await Organisation.findOne({ email: req.body['email'] });
    if(!user){
      res.send("User not found with this email");
    }
    else{
      req.session.forget = generateRandom8DigitNumber();
      req.session.gmail = req.body['email'];
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'karthikpatnaiktest@gmail.com', 
            pass: 'fpfialtokgkxzbnj' 
        }
      });
      
      const mailOptions = {
        from: 'karthikpatnaiktest@gmail.com', 
        to: req.session.gmail, 
        subject: 'Create New Passowrd',
        text: 'Your Confirmation Code:'+ req.session.forget +' ',
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
        } else {
          console.log('Email sent:', info.response);
        }
      });
      res.sendFile(__dirname + '/ofinput.html');
    }
});

app.post('/oconf', urlencodedParser, async (req, res) => {
 let x = parseInt(req.body['code']);
 if(x===req.session.forget){
  res.sendFile(__dirname + '/opass.html');
 }else{
  res.send("Confirmation Code Not Matched");
 }
});

app.post('/opasss', urlencodedParser, async (req, res) => {
  const userEmailToUpdate = req.session.gmail; 
  const newPassword = req.body.password; 
  
  Organisation.findOneAndUpdate(
    { email: userEmailToUpdate }, 
    { $set: { password: newPassword } }, 
    { new: true } 
  )
  .then(updatedUser => {
    if (updatedUser) {
      console.log('Updated user:', updatedUser);
      res.redirect('/ologin');
    } else {
      console.log('User not found');
      res.redirect('/ologin');
    }
  })
  .catch(err => {
    console.error('Error updating user:', err);
    res.redirect('/ologin');
  });
});

app.get('/alogout', (req, res) => {
  req.session.isoLogin = false;
  res.redirect('/ologin');
});

app.listen(port, () => {
  console.log(`Server is running on port hi ${port}`);
});
