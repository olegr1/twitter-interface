const config = require('./../config');
const path = require ('path');
//Express
const express = require('express');
const app = express();
//Twit module
const Twit = require('twit');
const T = new Twit(config.twitConfig);

app.use('/css', express.static(path.join(__dirname, './../css')));
app.use('/images', express.static(path.join(__dirname, './../images')));

app.set('views', path.join(__dirname, './../views'));
app.set('view engine', 'pug');

//Handle Get request on the main route
app.get('/', handleDefaultRoute);

//Listen for requests
app.listen(3000, ()=>{
    console.log("Listening on port 3000");
});

function handleDefaultRoute(req, res, tweetCount = 5){
    
    let getRecentTweets = T.get(
        'statuses/user_timeline', 
        {   
            screen_name: config.appSettings.screen_name,
            count: config.appSettings.tweetCount 
        })
        .then(result=>{
            let tweets = result.data.map(tweet=>{
                return {
                    user_name: tweet.user.name,
                    screen_name: tweet.user.screen_name,
                    profile_image: tweet.user.profile_image_url,
                    text: tweet.text
                };
            });

            return tweets;            
        })
        .catch(err=>{
            return res.status("500").send(err.message);
        });   
        
            
    Promise.all([getRecentTweets]).then(accountData => { 
        res.render("index", {tweets: accountData[0]});
    });

}