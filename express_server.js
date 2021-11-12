const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const morgan = require('morgan')
const bcrypt = require("bcryptjs")

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(morgan("dev"))

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  }
};

let urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userRandomID"
  }
};

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  console.log("req.session.id", req.session.user_id)
  const templateVars = {
    user_id: users[req.session.user_id]
  }
  if (!templateVars.user_id) {
    return res.redirect("/login")
  }
  res.render("urls_new", templateVars)
})

app.get("/register", (req, res) => {
  const templateVars = { 
    user_id: users[req.session.user_id],
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL]
  }
  res.render("urls_register", templateVars)
});

app.post("/register", (req, res) => {
  const {email, password} = req.body
  const hashedPassword = bcrypt.hashSync(password, 10)
  if (!email) {
    return res.status(400).send('Bad Request Please Enter An Email')
  }
  for (user in users) {
    if (users[user].email === email) {
      return res.status(400).send('Bad Request Email Already Exists')
    }
  }
  const id = generateRandomString();
  req.session.user_id = id
  console.log("req.session post register>>>", req.session.user_id)
  users[id] = {
    id: id,
    email: req.body.email,
    password: hashedPassword
  };
  res.redirect("/urls")
});

app.get("/urls", (req, res) => {
  const id = users[req.session.user_id]
  const templateVars = { 
    user_id: id, 
    urls: urlsForUser(id.id) 
  };
  //console.log("id ->", id)
  //console.log(templateVars)
  if (!templateVars.user_id) {
    return res.send("Please Login or Register to view URLs")
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const templateVars = { 
    user_id: users[req.session.user_id],
    shortURL: shortURL, 
    longURL: urlDatabase[shortURL].longURL
  }
  if (!templateVars.user_id) {
    return res.status(403).send("Forbidden Please Login")
  }
  res.render("urls_show", templateVars)
});

app.post("/urls", (req, res) => {
  const templateVars = {
    user_id: users[req.session.user_id]
  }
  if (!templateVars.user_id) {
    return res.status(403).send("Forbidden Please Login to post")
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  }
  console.log(urlDatabase)
  res.redirect(`urls/${shortURL}`)
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL
  if (!urlDatabase[shortURL]) {
    res.status(404).send("Page Not Found")
  }
  const longURL = urlDatabase[shortURL].longURL
  res.redirect(longURL)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    res.send("Only the Owner/Creater of URLs can delete")
  }
  delete urlDatabase[req.params.shortURL]
  res.redirect("/urls")
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL
  console.log("urldata", urlDatabase)
  res.redirect("/urls")
});

app.get("/login", (req, res) => {
  const templateVars = { 
    user_id: users[req.session.user_id],
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL]
  }
  res.render("urls_login", templateVars)
});

app.post("/login", (req, res) => {
  const {email, password} = req.body
  if (!email) {
    return res.status(403).send('Forbidden Please Enter An Email')
  }
  for (user in users) {
    if (users[user].email === email) {
      if (bcrypt.compareSync(password, users[user].password)) {
        req.session.user_id = users[user].id
        console.log("login cookie >>", req.session.user_id)
        
        return res.redirect("/urls")
      }
    } 
  }
  return res.status(403).send('Forbidden Incorrect Password')
});

app.post("/logout", (req, res) => {
  req.session = null
  res.redirect("/login")
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  let alphaNumeric = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let randomString = ""
  for (let i = 0; i < 6; i++) {
    randomString += alphaNumeric[Math.floor(Math.random() * alphaNumeric.length)]
  }
  return randomString
}

function urlsForUser(id) {
  let urlsForUserDB = {}
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      urlsForUserDB[key] = urlDatabase[key]
    }
  }
  return urlsForUserDB
}

