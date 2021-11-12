// All app requirements
const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const morgan = require('morgan')
const bcrypt = require("bcryptjs")
const { getUserByEmail, urlsForUser, generateRandomString } = require('./helpers')

// All middleware 
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(morgan("dev"))

// Users DB 
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  }
};
// urlDatabase example shortURL and longURL provided to start off
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

// Get route to display /urls/new page renders urls_new.ejs
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user_id: users[req.session.user_id]
  }
  if (!templateVars.user_id) {
    return res.redirect("/login")
  }
  res.render("urls_new", templateVars)
})

// Get route for /register page renders urls_register.ejs
app.get("/register", (req, res) => {
  const templateVars = { 
    user_id: users[req.session.user_id],
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL]
  }
  res.render("urls_register", templateVars)
});

// Post route for register page checks if email already exists in DB sends appropriate responses, hashs password and encrypt cookie redirect to /urls page
app.post("/register", (req, res) => {
  const {email, password} = req.body
  const hashedPassword = bcrypt.hashSync(password, 10)
  if (!email) {
    return res.status(400).send('Bad Request Please Enter An Email')
  }
  const user = getUserByEmail(email, users);
  if (user) {
    return res.status(400).send('Bad Request Email Already Exists')
  }
  const id = generateRandomString();
  req.session.user_id = id
  users[id] = {
    id: id,
    email: req.body.email,
    password: hashedPassword
  };
  res.redirect("/urls")
});

// Get route for /urls page renders urls_index.ejs page
app.get("/urls", (req, res) => {
  const id = users[req.session.user_id]
  if (!id) {
    return res.send("Please Login or Register to view URLs")
  }
  const templateVars = { 
    user_id: id, 
    urls: urlsForUser(id.id, urlDatabase) 
  };
  res.render("urls_index", templateVars);
});

// Get route for /urls/:shortURL, if not logged in sends appropriate response, renders urls_show.ejs
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

// Post route for new urls
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
  res.redirect(`urls/${shortURL}`)
});

// Get route for short url, redirects you to longURL page
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL
  if (!urlDatabase[shortURL]) {
    res.status(404).send("Page Not Found")
  }
  const longURL = urlDatabase[shortURL].longURL
  res.redirect(longURL)
});

// Post route to delete short URL from page
app.post("/urls/:shortURL/delete", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    res.send("Only the Owner/Creater of URLs can delete")
  }
  delete urlDatabase[req.params.shortURL]
  res.redirect("/urls")
});

// Post route to edit longURl associated with shortURL already generated
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL
  res.redirect("/urls")
});

// Get route for login page renders urls_index.ejs
app.get("/login", (req, res) => {
  const templateVars = { 
    user_id: users[req.session.user_id],
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL]
  }
  res.render("urls_login", templateVars)
});

// Post route for login page, check if email field is blank or incorrect, check hashed password for match, sets encrypted cookie and redirect to /urls page
app.post("/login", (req, res) => {
  const {email, password} = req.body
  if (!email) {
    return res.status(403).send('Forbidden Please Enter An Email')
  }
  const user = getUserByEmail(email, users);
  if (user) {
    if (bcrypt.compareSync(password, user.password)) {
      req.session.user_id = user.id
      return res.redirect("/urls")
    }
  }
  return res.status(403).send('Forbidden Incorrect Password')
});

// Post route for logout button clears session cookies and redirct to login page
app.post("/logout", (req, res) => {
  req.session = null
  res.redirect("/login")
});

// Server set to listen on port listed at const PORT variable
app.listen(PORT, () => {
});
