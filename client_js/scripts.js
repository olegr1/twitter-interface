{
    const maxTweetCharacterCount = 140;

    //Caching the UI elements
    let $tweetForm;  
    let $tweetFormField;  
    let $tweetButton;
    let $tweetCharCountElement;
    let $tweetList;

    $(document).ready(function(event) {           

        $tweetForm = $(".app--tweet form");  
        $tweetFormField = $tweetForm.find("#tweet-textarea");  
        $tweetButton = $tweetForm.find("button");
        $tweetCharCountElement = $tweetForm.find(".app--tweet--char");
        $tweetList = $(".app--tweet--list")
        
        $tweetFormField.value = "";       

        $tweetForm.on("submit", (event)=>{
            event.preventDefault();

            //Make sure the tweet is valid
            validate();
            
            //and post it to the dedicated route
            $.ajax({
                type: 'POST',
                data: JSON.stringify({tweet: $tweetFormField.val()}),
                contentType: 'application/json',
                url: '/post-tweet'
            })
            .done(function(data) {

                //If the posting was successful, 
                //clear the field and replace the tweet list with the one received from teh server
                $tweetFormField.val("");
                $tweetList.html(data);
            })
            .fail(function(data) {
                console.log("ERROR", data);
            });

        });

        //Validate the tweet while the user is typing
        $tweetFormField.on("keyup keydown", validate);
        validate();
    });

    function validate(){
        //Truncate the tweet past 140 characters
        if($tweetFormField.val().length >= maxTweetCharacterCount){    
            $tweetFormField.val($tweetFormField.val().slice(0, maxTweetCharacterCount));                       
        }

        //Disable the button if the field is empty
        if($tweetFormField.val().length === 0){
            $tweetButton.attr("disabled", true).css({"opacity": .5});
        }else{
            $tweetButton.removeAttr("disabled").removeAttr("style");
        }

        //Update the remaining characters counter
        $tweetCharCountElement.text(maxTweetCharacterCount - $tweetFormField.val().length);        
    }
}