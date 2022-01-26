const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const path = require("path");

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

function generateRandomString() {
  let newURL = Math.random().toString(36).substr(2,6);
  return newURL;
};

const randomID = generateRandomString();

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

// Renders the urls/new page
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user_id: req.cookies["user"],
  }
  res.render("urls_new", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Loads the home page.
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user_id: req.cookies["user"] };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  res.redirect(`/urls/${randomID}`);
  urlDatabase[randomID] = req.body.longURL;
});

app.get("/register", (req, res) => {
  const templateVars = { urls: urlDatabase, user_id: req.cookies["user"] };
  res.render("urls_register", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user_id: req.cookies["user"] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/update", (req,res) => {
  const newURL = req.body.longURL;
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = newURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const username = req.body.username
  res.cookie('username', username);
  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => {
  res.clearCookie('user');
  res.redirect(`/urls`);
});

app.post("/register", (req, res) => {
  const user_id = generateRandomString()
  users[user_id] = {
    id: user_id,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie('user', user_id);
  res.redirect(`/urls`);
  console.log(users[user_id]);
});
