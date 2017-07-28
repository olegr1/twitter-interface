const testData = require('./../testUserData');
const testMsgData = require('./../testMessageData');

const config = require('./../config');
const path = require ('path');

//Data model to be populated by the API which is used for template rendering
const model = {
    screen_name: config.app_settings.screen_name,
    tweets: [],
    friends: {},
    messages: []
}

//NPM modules
const express = require('express');
const Twit = require('twit');
const moment = require('moment');
const bodyParser = require('body-parser');

const app = express();
const T = new Twit(config.twit_config);

//Configuring the app
app.use(bodyParser.json());
app.use('/css', express.static(path.join(__dirname, './../css')));
app.use('/images', express.static(path.join(__dirname, './../images')));
app.use('/js', express.static(path.join(__dirname, './../client_js')));

app.set('views', path.join(__dirname, './../views'));
app.set('view engine', 'pug');
app.set('view options', { layout: true })

//Handle Get request on the main route
app.get('/', handleDefaultRoute);

//Handle posting of a new tweet
app.post('/post-tweet', handleTweetPosting);

//Listen for requests
app.listen(3000, ()=>{
    console.log("Listening on port 3000");
});


function handleDefaultRoute(req, res){ 

    //Once all the data from all 3 API endpoints arrives, populate the model
    Promise.all([
        getRecentTweets(),
        getRecentFriends(),
        getRecentMessages()
    ]).then(data => {
        model.tweets = data[0];
        model.friends = data[1];
        model.messages = data[2];

        //Pass the data model to PUG to render
        res.render("index", model);
    }) 
    .catch(err=>{
        //Handle error
        return res.status("500").send(err.message);
    });
}

function handleTweetPosting(req, res) {

    //Send the tweet text received from the AJAX POST request to the Twitter API
    T.post(
        'statuses/update', 
        { status: req.body.tweet }
    )
    .then(result=>{
        //Once the API updates the list with a new Tweet..
        getRecentTweets().then((data)=>{
            model.tweets = data;

            let tweets = "<div>Error rendering tweets</div>";

            //Render only the Tweets list partial and send the HTML to the client
            app.render('partial/timeline', model,function(err,html) {                    
                tweets = html;
            });
            return res.send(tweets);
        });               
    })
    .catch(err=>{
        //Handle error
        return res.status("500").send(err.message);
    });    
}

function getRecentTweets(){ 
    
    //Get 5 most recent tweets
    return T.get(
        'statuses/user_timeline', 
        {   
            screen_name: config.app_settings.twitter_screen_name,
            count: config.app_settings.tweet_count 
        })
        .then(result=>{

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
        //Handle error
        return res.status("500").send(err.message);
    });   
}

function getRecentFriends(){ 
    
    //Get 5 most recent friends
    return T.get(
        //'friends/list', 
        'statuses/oembed', 
        {   
            screen_name: config.app_settings.twitter_screen_name,
            count: config.app_settings.friends_count 
        })
        .then(result=>{

            //TEST value
           result.data.users = testData;

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
            //Handle error
            return res.status("500").send(err.message);
        });   
}

function getRecentMessages(){   

    //Get 5 most recent SENT messages
    return T.get(
        //'direct_messages/sent', 
        'statuses/oembed',        
        {   
            count: config.app_settings.private_msg_count 
        })
        .then(result=>{

            //TEST value
           result.data = testMsgData;            

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
            return res.status("500").send(err.message);
        });   
}
