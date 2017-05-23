const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const wechat = require('wechat');
const jssdk = require('../libs/jssdk');
const User = mongoose.model('User');

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

        newUser.sve(function(err, user){
            //do business
        });
    }

    res.reply('Hello');

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
router.post('/conversation',handleUserRequest);
