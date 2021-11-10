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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user_id: users[req.cookies["user_id"]],
    username: req.cookies["username"]}
  res.render("urls_new", templateVars)
})

app.get("/register", (req, res) => {
  res.render("urls_register")
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  users[id] = {
    id,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie("user_id", id)
  console.log(users)
  res.redirect("/urls")
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    user_id: users[req.cookies["user_id"]],
    username: req.cookies["username"], 
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    user_id: users[req.cookies["user_id"]],
    username: req.cookies["username"],
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL]
  }
  console.log(templateVars)
  res.render("urls_show", templateVars)
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL
  res.redirect(`urls/${shortURL}`)
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL]
  res.redirect("/urls")
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL
  res.redirect("/urls")
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username)
  res.redirect("/urls")
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
  res.clearCookie("username")
  res.redirect("/register")
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