const express = require("express");
const app = express();
const PORT = 3000; // default port 8080
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require("cookie-session");
app.use(cookieSession({
  name: 'session',
  keys: ['861a4ba3-7bfe-420a-9ce2-a49a25c61645', '4e32a74a-b55b-4a50-a8cc-6384ce6a5dfc'],
}));

function generateRandomString() {
  let newURL = Math.random().toString(36).substr(2,6);
  console.log("Generate random string: ", newURL);
  return newURL;
};

//function that loops through the database and checks if the email is present
const getUserByEmail = function(email, database){
  for (let userID in database) {
    if (email === database[userID].email) {
      return database[userID];
    }
  }
  return false;
};

const authenticateUser = (email, password) => {
  const user = getUserByEmail(email, users);

  console.log("FORM PASSWORD:", password, "DB PASSWORD:", user.password);

  // if we got a user back and the passwords match then return the userObj
  if (user && bcrypt.compareSync(password, user.password)) {
    // user is authenticated
    return user;
  } else {
    return false;
  }
};

const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "aJ48lW"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "aJ48lW"
  }
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
  const userID = req.session["user_id"]
  const user = users[userID]
  const templateVars = {
    user,
  }
  if (!user) {
    res.redirect("/login");
  } else {
  res.render("urls_new", templateVars);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//HOME PAGE
app.get("/urls", (req, res) => {
  const userID = req.session["user_id"];
  const user = users[userID];
  const templateVars = { urls: urlDatabase, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user };
  res.render("urls_index", templateVars);
  console.log(user)
  console.log(urlDatabase)
});

app.post("/urls", (req, res) => {  // Log the POST request body to the console
  const randomID = generateRandomString();
  const userID = req.session["user_id"];
  const user = users[userID];
  urlDatabase[randomID] = {
    longURL: req.body.longURL,
    userID: user.id,
  }
  console.log(urlDatabase);
  res.redirect(`/urls/${randomID}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session["user_id"]
  const user = users[userID]
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user};
  res.render("urls_show", templateVars);
});

//DELETE WEBPAGE
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session["user_id"]
  const user = users[userID]
  const templateVars = {
    user,
  }
  if (!user) {
    return res.status(403).send("Cannot delete shortURL. Please login or register.")
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

//REDIRECT TO LONG URL AFTER CREATING THE SHORTURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session["user_id"]
  const user = users[userID]
  if (!user) {
    return res.status(403).send("Cannot delete shortURL. Please login or register.")
  } else {
    res.redirect(`/urls/${shortURL}`);
  }
});


//Updated to new URLDatabase format
app.post("/urls/:shortURL/update", (req,res) => {
  const userID = req.session["user_id"];
  const user = users[userID];
  const shortURL = req.params.shortURL;
  if (!user) {
    return res.status(403).send("Cannot delete shortURL. Please login or register.")
  } else {
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: user.id,
    }
    res.redirect("/urls");
  }
});

//LOGIN RESTORES EXISTING COOKIE IN DATABASE AND LOGOUT CLEARS THE COOKIE STORAGE
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = authenticateUser(email,password);

  //If authenticated, set a cookie with its user id and redirect.
  if (user) {
    const user_id = user.id
      req.session['user_id'] = user_id;
      res.redirect(`/urls`);
    } else {
      return res.status(403).send("Wrong credentials!");
    }
});

app.post("/logout", (req, res) => {
  req.session['user_id'] = null;
  res.redirect(`/urls`);
});

//LOGIN PAGE
app.get("/login", (req, res) => {
  const userID = req.session["user_id"]
  const user = users[userID]
  const templateVars = { urls: urlDatabase, user};
  res.render("urls_login", templateVars);
});

//REGISTRATION PAGE AND USER REGISTRATION POST
app.get("/register", (req, res) => {
  const userID = req.session["user_id"]
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
    password: bcrypt.hashSync(req.body.password, salt),
  };
  req.session['user_id'] = user_id;
  res.redirect(`/urls`);
});


