const crypto = require('crypto');
const fs = require('fs');
const request = require('request');
const debug = require('debug')('jswechat:jssdk');

function JSSDK(appId, appSecret){
    this.appId = appId;
    this.appSecret = appSecret;
}

JSSDK.prototype = {

    getSignPackage : function(url, done){
        const instance = this;
        instance.getJsApiTicket(function(error,jsapiTicket){
            if(error){
                return done(err);
            }

            const timestamp = Math.round(Date.now() / 100);
            const noncestr = instance.createNonceStr();

            const rowString = `jsapi_ticket=${jsapiTicket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${url}`;
            const hash = crypto.createHash('sha1');
            const signature = hash.update(rowString).digest('hex');

            done (null,{
                timestamp,
                url,
                signature,
                appId : instance.appId,
                nonceStr : noncestr,
                rawString : rowString
            });

        });
    },

    getJsApiTicket : function(done){
        const cachefile = '.jsapiticket.json';
        const instance = this;
        const data = instance.readCacheFile(cachefile);
        const time = Math.round(Date.now() / 1000);

        if(!data.expireTime ||data.expireTime < time){
            debug('getJsApiTicket from server.');
            instance.getAccessToken(function(error, accessToken){
                if(error){
                    debug('getJsApiTicket.getAccessToken.error:',error);
                    return done(error, null);
                }


                // 如果是企业号用以下 URL 获取 ticket
                // $url = "https://qyapi.weixin.qq.com/cgi-bin/get_jsapi_ticket?access_token=$accessToken";
                const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?type=jsapi&access_token=${accessToken}`;
                request.get(url, function(error,res, body){
                    if(error){
                        debug('getJsApiTicket.request.error:',error);
                        return done(error, null);
                    }

                    debug('getJsApiTicket.request.body:',body);

                    try{
                        const data = JSON.parse(body);

                        instance.writeCacheFile(cachefile,{
                            expireTime : Math.round(Date.now() / 1000) + 7200,
                            ticket: data.ticket
                        });

                        done(null,data.ticket);

                    }catch(e){
                        debur('getJsApiTicket.parse.error:',error,url);
                        return;
                    }
                });
            });
        }else{
            debug('getJsApiTicket from cache.');
            done(null,data.ticket);
        }
    },

    getAccessToken : function(done){
        const cachefile = '.accesstoke.json';
        const instance = this;
        const data = instance.readCacheFile(cachefile);
        const time = Math.round(Date.now() / 1000);

        if(!data.expireTime ||data.expireTime < time){
            debug('getAccessToken from server.');
            const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${instance.appId}&secret=${instance.appSecret}`;
            request.get(url, function(error,res, body){
                if(error){
                    debug('getAccessToken.request.error:',error);
                    return done(error, null);
                }

                debug('getAccessToken.request.body:',body);

                try{

                    const data = JSON.parse(body);

                    instance.writeCacheFile(cachefile,{
                        expireTime: Math.round(Date.now() / 1000),
                        accessToken: data.access_token,
                    });

                    done(null,data.access_token);

                }catch(e){
                    debug('getAccessToken.parse.error:',error,url);
                    return;
                }
            });
        }else{
            debug('getAccessToken from cache.');
            done(null,data.accessToken);
        }

    },

    createNonceStr : function(){

        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const length = chars.length;
        let str = "";

        for (var i = 0; i < length; i++) {
            str += chars.substr(Math.round(Math.random() * length), 1);
        }
        return str;

    },

    httpGet : function(){},

    readCacheFile : function(filename){
        try{
            return JSON.parse(fs.readFileSync(filename))
        }catch(e){
            debug('read file %s failed: %s', filename, e);
        }

        return {};
    },

    writeCacheFile : function(filename,data){
        return fs.writeFileSync(filename, JSON.stringify(data));
    }


}

const jssdk = new JSSDK('wx59a6cbb2a20d1069','c6547db5e64daa7fe859a6578652439a');
module.exports = jssdk;
/*
debug(jssdk.createNonceStr());

jssdk.getAccessToken(function(err, accessToken){
    console.log(arguments);
});

jssdk.getJsApiTicket(function(err, ticket){
    console.log(arguments);
});

jssdk.getSignPackage('http://119.23.238.246/api/wechat',function(err, signPackage){
    debug(arguments);
});
*/

