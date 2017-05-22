const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const wechat = require('wechat');
const jssdk = require('../libs/jssdk');

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

    console.log(message);

    res.reply('Hello');

});

router.get('/conversation',handleWechatRequest);
router.post('/conversation',handleWechatRequest);
