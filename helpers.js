const bcrypt = require('bcryptjs');

//function that loops through the database and checks if the email is present
const getUserByEmail = function(email, database) {
  for (let userID in database) {
    if (email === database[userID].email) {
      return database[userID];
    }
  }
  return false;
};

const authenticateUser = (email, password, users) => {
  const user = getUserByEmail(email, users);

  // console.log("FORM PASSWORD:", password, "DB PASSWORD:", user.password);

  // if we got a user back and the passwords match then return the userObj
  if (user && bcrypt.compareSync(password, user.password)) {
    // user is authenticated
    return user;
  } else {
    return false;
  }
};

const generateRandomString = () => {
  let newURL = Math.random().toString(36).substr(2,6);
  return newURL;
};

module.exports = { getUserByEmail, authenticateUser, generateRandomString };