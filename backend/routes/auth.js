const express = require('express');
const router = express.Router();


router.post('/signup', (req, res) => {

  res.send('User signed up');
});


router.post('/login', (req, res) => {

  res.send('User logged in');
});

module.exports = router;
