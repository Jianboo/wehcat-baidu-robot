const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const wechat = require('wechat');
const cheerio = require('cheerio');
const request = require('request');


const jssdk = require('../libs/jssdk');
const User = mongoose.model('User');
const Conversation = mongoose.model('Conversation');

module.exports = function (app) {
  app.use('/wechat', router);
};

router.get('/hello', function (req, res, next) {
   const path = 'http://119.23.238.246';
    jssdk.getSignPackage(`${path}${req.url}`, function(err, signPackage){

        if(err){
            return next(err);
        }

        // Jade Template
        res.render('index',{
            title : 'Hello Wechat from Aliyun ECS --> Express',
            signPackage: signPackage,
            jretty : true
        });

    });
});

const config = {
    token: 'WKyAqZGSnjLEym3w0gqz',
    appid: 'wx59a6cbb2a20d1069',
};


const handleWechatRequest = wechat(config, function(req,res,next){
    const message = req.weixin;
    console.log(message, req.query);

    if(message.MsgType == 'event' && message.Content == 'subcribe'){
        const newUser = new User({
            openid: req.query.openid,
            createAt: new Date(),
            conversationCount: 0,
        });

        newUser.save(function(err, user){
            //do business
        });
    }


    if(message.MsgType !== 'text'){
        return res.reply('Invalid Message Type.');
    }

    if(!message.Content){
        return res.reply('Give me a Key Word.');
    }

    const keyword = encodeURIComponent(message.Content);

    request.get({
        url :  `https://www.baidu.com/s?wd=${keyword}`,
        headers : {
            'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36',
        },
    }, function(err, response, body){

        if(err){
            console.next(err);
            return res.reply('Error, serching answer.');
        }

        const $ = cheerio.load(body);
        const results = $('.result.c-container');

        console.log(results.length);

        if(results.length == 0){
            return res.reply('No answer.');
        }

        const result = $(results.get(0));
        const answer = result.find('.c-abstract').text();

        console.log(answer);

        if(answer){
            res.reply(answer);
            const conversation = new Conversation({
                user: req.user,
                question: message.Content,
                answer,
                createAt:new Date(),
            });


            conversation.save(function(e, conversion){
                if(e){
                    return console.error('conversion save error: ' , e);
                }

                req.user.conversationCount = req.user.conversationCount +  1;
                req.user.save(function(_e, u){
                    if(_e){
                        return console.error('update user conversation count error:', e);
                    }

                    req.user = u;
                });

            });
        }else{
            res.reply('No answer.');
        }

});

});

const handleUserRequest = function(req, res, next){

    const openid = req.query.openid;

    if(!openid){
        return next();
    }

    User.findOne({openid}).exec(function(err,user){
        if(err){
            return next(err);
        }

        if(user){
            console.log('use existing user:', user)
            req.user = user;
            return next();

        }

        console.log(`create new user ${openid}`);
        const newUser = new User({
            openid,
            createAt: new Date(),
            conversationCount: 0,
        });

        newUser.save(function(e, u){
            if(e){
                return next();
            }

            req.user = u;
            next();
        });
    });

}



router.get('/conversation',handleWechatRequest);
router.post('/conversation',handleUserRequest, handleWechatRequest);
