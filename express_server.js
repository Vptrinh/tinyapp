const express = require("express");
const app = express();
const PORT = 3000; // default port 8080
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const { getUserByEmail, authenticateUser, generateRandomString } = require('./helpers');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require("cookie-session");
app.use(cookieSession({
  name: 'session',
  keys: ['861a4ba3-7bfe-420a-9ce2-a49a25c61645', '4e32a74a-b55b-4a50-a8cc-6384ce6a5dfc'],
}));

app.set("view engine", "ejs");

const urlDatabase = {};
const usersDatabase = {};

// Renders the urls/new page
app.get("/urls/new", (req, res) => {
  const userID = req.session["user_id"];
  const user = usersDatabase[userID];
  const templateVars = {
    user,
  };
  if (!user) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//Reads the JSON file. 
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Renders urls_index to the /urls link. 
app.get("/urls", (req, res) => {
  const userID = req.session["user_id"];
  const user = usersDatabase[userID];
  const templateVars = { 
    urls: urlDatabase,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user,
  };
  res.render("urls_index", templateVars);
});

//The main page which shows the index of URLs that are created. When a URL is created, it is displayed here. 

app.post("/urls", (req, res) => {  
  const randomID = generateRandomString();
  const userID = req.session["user_id"];
  const user = usersDatabase[userID];
  urlDatabase[randomID] = {
    longURL: req.body.longURL,
    userID: user.id,
  };
  res.redirect(`/urls/${randomID}`);
});

//Renders urls_show which is the page that reveals the shortURL link with the option to edit it. 
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session["user_id"];
  const user = usersDatabase[userID];
  const templateVars = { 
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user,
  };
  if (!user) {
    return res.status(403).send("Please login or register.");
  } else if (urlDatabase[req.params.shortURL].userID === user.id) {
    res.render("urls_show", templateVars);
  } else {
    return res.status(403).send("Wrong credentials. Please login with the correct account.");
  }
});

//Deletes the webpage from the list of URLs. 
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session["user_id"];
  const user = usersDatabase[userID];
  if (!user) {
    return res.status(403).send("Cannot delete shortURL. Please login or register.");
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

//Redirects to the longURL if you click the shortURL on this page. 
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//When the longURL is changed in the input, it redirects to the new shortURL page. 
app.post("/urls/:shortURL/edit", (req, res) => {
  const userID = req.session["user_id"];
  const user = usersDatabase[userID];
  const shortURL = req.params.shortURL;
  if (!user) {
    return res.status(403).send("Cannot delete shortURL. Please login or register.");
  } else {
    res.redirect(`/urls/${shortURL}`);
  }
});


//Updates the database when the longURL is edited.
app.post("/urls/:shortURL/update", (req,res) => {
  const userID = req.session["user_id"];
  const user = usersDatabase[userID];
  const shortURL = req.params.shortURL;
  if (!user) {
    return res.status(403).send("Cannot edit shortURL. Please login or register.");
  } else {
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: user.id,
    };
    res.redirect("/urls");
  }
});

//Post authenticates if the login email and password matches --> uses the hash password.
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = authenticateUser(email, password, usersDatabase);

//If authenticated, set a cookie with its user id and redirect.
  if (user) {
    const user_id = user.id;
    req.session['user_id'] = user_id;
    res.redirect(`/urls`);
  } else {
    return res.status(403).send("Wrong credentials or account does not exist. Please register or try again.");
  }
});

//Logs the user out and deletes the session cookie.
app.post("/logout", (req, res) => {
  req.session['user_id'] = null;
  res.redirect(`/urls`);
});

//Logs the user in.
app.get("/login", (req, res) => {
  const userID = req.session["user_id"];
  const user = usersDatabase[userID];
  const templateVars = { 
    urls: urlDatabase,
    user,
  };
  res.render("urls_login", templateVars);
});

//REGISTRATION PAGE AND USER REGISTRATION POST
app.get("/register", (req, res) => {
  const userID = req.session["user_id"];
  const user = usersDatabase[userID];
  const templateVars = { 
    urls: urlDatabase,
    user,
  };
  res.render("urls_register", templateVars);
});

//Checks using getUserByEmail if the email is stored in the database and also checks if the email or password input is empty.
app.post("/register", (req, res) => {
  const userChecker = getUserByEmail(req.body.email, usersDatabase);
  const user_id = generateRandomString();
  if (!req.body.email || !req.body.password) {
    return res.status(400).send("Email and password cannot be blank.");
  } else if (userChecker) {
    return res.status(400).send("Email is already in use.");
  } else {
    usersDatabase[user_id] = {
      id: user_id,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, salt),
    };
    req.session['user_id'] = user_id;
    res.redirect(`/urls`);
  }
});


