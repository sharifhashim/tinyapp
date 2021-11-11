const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
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
  const templateVars = {
    user_id: users[req.cookies["user_id"]]
  }
  if (!templateVars.user_id) {
    return res.redirect("/login")
  }
  res.render("urls_new", templateVars)
})

app.get("/register", (req, res) => {
  const templateVars = { 
    user_id: users[req.cookies["user_id"]],
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL]
  }
  res.render("urls_register", templateVars)
});

app.post("/register", (req, res) => {
  const {email, password} = req.body
  if (!email) {
    return res.status(400).send('Bad Request Please Enter An Email')
  }
  for (user in users) {
    if (users[user].email === email) {
      return res.status(400).send('Bad Request Email Already Exists')
    }
  }
  const id = generateRandomString();
  users[id] = {
    id,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie("user_id", id)
  res.redirect("/urls")
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    user_id: users[req.cookies["user_id"]], 
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const templateVars = { 
    user_id: users[req.cookies["user_id"]],
    shortURL: shortURL, 
    longURL: urlDatabase[shortURL].longURL
  }
  res.render("urls_show", templateVars)
});

app.post("/urls", (req, res) => {
  const templateVars = {
    user_id: users[req.cookies["user_id"]]
  }
  if (!templateVars.user_id) {
    return res.status(403).send("Forbidden Please Login to post")
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"]
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
    user_id: users[req.cookies["user_id"]],
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
    } if (users[user].password === password) {
        res.cookie("user_id", users[user].id) 
      return res.redirect("/urls")
    }
  }
  return res.status(403).send('Forbidden')
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
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
