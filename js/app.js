//A few global constants
const app_settings = {
  tweet_count: 5,
  friends_count: 5,
  private_msg_count: 5
}

//Config file for Twit
const config = require('./../config');

//Data model which is used for template rendering
const model = {
    screen_name: config.twitter_screen_name,
    profile_banner: '',
    tweets: [],
    friends: {},
    messages: []
}

//NPM modules
const express = require('express');
const Twit = require('twit');
const moment = require('moment');
const bodyParser = require('body-parser');

//Instantiating the Express app and Twit
const app = express();
const T = new Twit(config);

//Configuring the app
const path = require('path');

//Static asset folders for the webpage
app.use('/css', express.static(path.join(__dirname, './../css')));
app.use('/images', express.static(path.join(__dirname, './../images')));
app.use('/js', express.static(path.join(__dirname, './../client_js')));

app.use(bodyParser.json());

app.set('views', path.join(__dirname, './../views'));
app.set('view engine', 'pug');
app.set('view options', { layout: true })

//Handle GET request on the main route
app.get('/', defaultRoute);

//Handle posting of a new tweet
app.post('/post-tweet', postNewTweetRoute);

//Handle error route
app.get('/error', errorRoute);

//Initiate a 404 if a route is not found
app.use((req, res, next)=>{
    let err = new Error("Page not found!")
    res.status = 404;
    next(err);
});

//Redirect all otherwise unhandled errors in the app to the friendly error route
app.use((err, req, res, next)=>{
    res.redirect("/error");
});

//Listen for requests
app.listen(3000, ()=>{
    console.log("Listening on port 3000");
});

//Error route handler
function errorRoute(req, res){
    res.render("error", {message : "Ooops, something went wrong"});
}

function defaultRoute(req, res){     

    //Once the data from all API endpoints arrives, populate the model
    Promise.all([
        getRecentTweets(),
        getRecentFriends(),
        getRecentMessages(),
        getProfileBackground()

    ]).then(data => {
        model.screen_name = config.twitter_screen_name;
        model.tweets = data[0];
        model.friends = data[1];
        model.messages = data[2];
        model.profile_banner = data[3];

        //Pass the data model to Pug to render the page
        res.render("index", model);
    }) 
    .catch(err=>{
        //Initiate an error
        console.log("Failed to collect data from all APIs");
        let error = new Error("Server error")
        res.status = 500;
        next(error);
    });
}

function postNewTweetRoute(req, res, next) {

    //Send the tweet text received from the AJAX POST request to the Twitter API
    T.post(
        'statuses/update', 
        { status: req.body.tweet }
    )
    .then(result=>{

        //If the response has errors an errors array, cause the promise to reject
        if(typeof result.data.errors !== "undefined"){
            throw 'Error posting a tweet';
        }

        //Once the API updates the list with a new Tweet..
        getRecentTweets().then((data)=>{
            model.tweets = data;

            //...render only the Tweets list partial and send the resulting HTML to the client
            app.render('partial/timeline', model, function(err, html) {     
               res.send(html);
            });

        }).catch(err=>{
            console.log(err);
        });               
    })
    .catch(err=>{

        //Render an error message instead of tweets
        res.send('<div style="padding:1em;">Ooops, something went wrong</div>');
    });    
}

function getProfileBackground(){ 

    //Get the profile background
    return T.get(
        'users/profile_banner',        
        {   
            screen_name: config.twitter_screen_name
        })
        .then(result=>{   

            //If the response has errors an errors array, cause the promise to reject
            if(typeof result.data.errors !== "undefined"){
                throw 'Error getting profile banner';
            }

            return result.data.sizes.web.url;              
        })
        .catch(err=>{
            console.log(err);            
        });   
}

function getRecentTweets(){ 
    
    //Get 5 most recent tweets
    return T.get(
        'statuses/user_timeline', 
        {   
            screen_name: config.twitter_screen_name,
            count: app_settings.tweet_count 
        })
        .then(result=>{

            //If the response has errors an errors array, cause the promise to reject
            if(typeof result.data.errors !== "undefined"){
                throw 'Error getting recent tweets';
            }

            //Collecting relevant data for the interface
            let tweets = result.data.map(tweet=>{
                return {
                    user_name: tweet.user.name,
                    screen_name: tweet.user.screen_name,
                    profile_image: tweet.user.profile_image_url,
                    text: tweet.text,
                    retweets: tweet.retweet_count,
                    favorites: tweet.favorite_count,
                    date: moment(new Date(tweet.created_at)).format('HH:mm a, DD/MM/YYYY')
                };
            });            

            return tweets;            
        })
        .catch(err=>{
            console.log(err);
        });   
}

function getRecentFriends(){ 
    
    //Get 5 most recent friends
    return T.get(
        'friends/list',  
        {   
            screen_name: config.twitter_screen_name,
            count: app_settings.friends_count 
        })
        .then(result=>{

            //If the response has errors an errors array, cause the promise to reject
            if(typeof result.data.errors !== "undefined"){
                throw 'Error getting recent friends';
            }

           //Collecting relevant data for the interface
            let friend_list = result.data.users.map(friend=>{
                return {
                    user_name: friend.name,
                    screen_name: friend.screen_name,
                    profile_image: friend.profile_image_url
                };
            });            

            let friends = {
                friend_count: result.data.users.length,
                friend_list
            }

            return friends;            
        })
        .catch(err=>{
            console.log(err);
        });   
}

function getRecentMessages(){   

    //Get 5 most recent SENT messages
    return T.get(
        'direct_messages/sent',      
        {   
            count: app_settings.private_msg_count 
        })
        .then(result=>{

            if(typeof result.data.errors !== "undefined"){
                throw 'Error getting recent messages';
            }          

           //Collecting relevant data for the interface
            let messages = result.data.map(message=>{
                return {
                    text: message.text,
                    date: moment(new Date(message.created_at)).format('h:MMa, DD/MM/YYYY')
                };
            });            

            return messages;              
        })
        .catch(err=>{
            console.log(err);
        });   
}