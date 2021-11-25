const getUserByEmail = function(email, database) {
  for (const key in database) {
    if (database[key].email === email) {
      return database[key];
    }
  }
  return null;
};

const urlsForUser = function(id, database) {
  let urlsForUserDB = {};
  for (const key in database) {
    if (database[key].userID === id) {
      urlsForUserDB[key] = database[key];
    }
  }
  return urlsForUserDB;
};

const generateRandomString = function() {
  let alphaNumeric = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    randomString += alphaNumeric[Math.floor(Math.random() * alphaNumeric.length)];
  }
  return randomString;
};
module.exports = { getUserByEmail, urlsForUser, generateRandomString};