const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const wechat = require('wechat');
const cheerio = require('cheerio');
const request = require('request');


const jssdk = require('../libs/jssdk');
const User = mongoose.model('User');
const Conversation = mongoose.model('Conversation');
const path = 'http://119.23.226.144/wechat';

module.exports = function (app) {
  app.use('/wechat', router);
};

//历史问答路由
router.get('/history/:userid',function(req, res, next){

  if(!req.params.userid){
	return next(new Error('非法请求，缺少userid参数'));
  }


  User.findOne({_id: req.params.userid}).exec(function(err,user){
        if(err || !user){
            return next(new Error('没有找到用户'));
        }
	
	console.log(`find user:${user}`);
	Conversation.find({user}).exec(function(e, conversations){
		if(e){
			return next(new Error('查找问答历史出错'));
		}

		res.render('history',{
            		user, conversations,
            		title : '问答历史',
            		pretty : true,
        	});

		//res.jsonp({user, conversations});
	});

  });

});

//测试网页jssdk的使用
router.get('/hello', function (req, res, next) {
    jssdk.getSignPackage(`${path}${req.url}`, function(err, signPackage){
	//获取签名失败，跳转错误页面
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

//处理文本消息类型
const handleWechatTextMessage = function(req, res, next){
    const message = req.weixin;

    if(message.MsgType !== 'text'){
        return res.reply('无法处理的消息类型.');
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
};

//处理事件消息类型
const handleWechatEventMessage = function(req, res, next){
  const message = req.weixin;
  const event = message.Event;
  const eventKey= message.EventKey;

  console.log(`---------------------------------------->>>>>>>>>>>>>>.${eventKey}`);

  //订阅公共号事件
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

  if('CLICK' === event){
     if('conversation-history' === eventKey){
	res.reply(`${path}/history/${req.user._id.toString()}`);
     }else{
	res.reply('无法处理的单击事件');
     }
  }
};

const handleWechatRequest = wechat(config, function(req,res,next){
    const message = req.weixin;
    console.log(message, req.query);

    if(message.MsgType === 'text'){
	handleWechatTextMessage(req, res, next);
    }else if(message.MsgType === 'event'){
	handleWechatEventMessage(req, res, next);
    }else{
	res.reply('无法处理的消息类型');
    }
});

//保存用户信息
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
