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

//function that loops through the database and checks if the email is present
const getUserByEmail = function(email, database){
  for (let userID in database) {
    if (email === database[userID].email) {
      return database[userID];
    }
  }
  return undefined;
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
  const userID = req.cookies["user"]
  const user = users[userID]
  const templateVars = {
    user,
  }
  res.render("urls_new", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//HOME PAGE
app.get("/urls", (req, res) => {
  const userID = req.cookies["user"]
  const user = users[userID]
  const templateVars = { urls: urlDatabase, user };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  res.redirect(`/urls/${randomID}`);
  urlDatabase[randomID] = req.body.longURL;
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.cookies["user"]
  const user = users[userID]
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user };
  res.render("urls_show", templateVars);
});

//DELETE WEBPAGE
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

//REDIRECT TO LONG URL AFTER CREATING THE SHORTURL
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

//LOGIN AND LOGOUT COOKIE STORAGE
app.post("/login", (req, res) => {
  const userChecker = getUserByEmail(req.body.email, users);
  if (userChecker) {
    for (let userID in users) {
      if (req.body.password === users[userID].password) {
        const user_id = users[userID].id;
        res.cookie('user', user_id);
        res.redirect(`/urls`);
        console.log(users[user_id]);
      }
    }
  } else {
    return res.status(403).send("Email does not exist. Please register.")
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user');
  res.redirect(`/urls`);
});

//LOGIN PAGE
app.get("/login", (req, res) => {
  const userID = req.cookies["user"]
  const user = users[userID]
  const templateVars = { urls: urlDatabase, user};
  res.render("urls_login", templateVars);
});

//REGISTRATION PAGE AND USER REGISTRATION POST
app.get("/register", (req, res) => {
  const userID = req.cookies["user"]
  const user = users[userID]
  const templateVars = { urls: urlDatabase, user };
  res.render("urls_register", templateVars);
});

//Checks using getUserByEmail if the email is stored in the database and also checks if the email or password input is empty.
app.post("/register", (req, res) => {
  const userChecker = getUserByEmail(req.body.email, users);
  if (!req.body.email || !req.body.password) {
    return res.status(400).send("Email and password cannot be blank.")
  } else if (userChecker) {
    return res.status(400).send("Email is already in use.");
  }
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


