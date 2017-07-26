const express = require('express');
const app = express();
const path = require ('path');
const config = require('./../config');
const Twit = require('twit');

console.log();

const T = new Twit(config);

app.use('/css', express.static(path.join(__dirname, './../css')));
app.use('/images', express.static(path.join(__dirname, './../images')));

console.log(path.join(__dirname, './../css'));

app.set('views', path.join(__dirname, './../views'));
app.set('view engine', 'pug');

app.get('/', (req, res)=>{
    res.render("index");
});

app.listen(3000, ()=>{
    console.log("Listening on port 3000");
});

//console.log(config);