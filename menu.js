const request = require('request');
const schedule = require('node-schedule');
const jssdk = require('./app/libs/jssdk');

request.debug = true;

const menuItems = {
    "button":[
        {
            "type" : "click",
            "name" : "问答历史",
            "key" :  "conversation-history",
        },
        {
            "type" : "click",
            "name" : "随机问答",
            "key" :  "conversation-random",
        },
    ]
};

schedule.scheduleJob({second: 0, minute: 0}, function(){
    doMenuSync();
});

setInterval(function(){
    console.log(new Date());
}, 2000);

function doMenuSync(){

    jssdk.getAccessToken(function(err, token){

        if(err || !token){
            return console.error('ERROR: get access token faild.');
        }

        console.log({token});
        const deleteMenuUrl = `https://api.weixin.qq.com/cgi-bin/menu/delete?access_token=${token}`;

        request.get(deleteMenuUrl, function(e, response, body){
            if(e){
                return console.error('ERROR: delete menu failed.');
            }

            console.log('deleting menu success.');

            const createMenuUrl = `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${token}`;
            request.post({url:createMenuUrl, json:menuItems}, function(_e, _res, body){

                if(_e){
                    return console.error('ERROR: creating menu failed.', _e);
                }

                console.log('creating menu success.', body)

            });

        });
    });

};

