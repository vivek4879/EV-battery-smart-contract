var express = require('express');
var app = express();
app.use(express.static('src'));
app.use(express.static('../Ev-contract/build/contracts')); 
app.get('/', function (req, res) {
// src is the directory for public web artifacts.
   res.render('index.html');
});
// index.html is the landing page for the web app.
// Location of smart contract’s interface JSON file
    app.listen(3000, function () {
      console.log('Example app listening on port 3000!');
});
