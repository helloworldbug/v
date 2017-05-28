
var wxPhpLogin = function(wxUser, wxData, callback){
    var User = fmacloud.Object.extend("User");
    var query = new fmacloud.Query(User);
    query.equalTo("username", wxUser.unionid);
    query.find({
        success: function (user) {
            if (user.length > 0) {
                //用户存在则登陆绑定
                fmacloud.User.logIn(wxUser.unionid, "6a063e705a16e625", {
                    success: function (user) {  //老用户没头像
                        if(!user.get("user_pic")){
                            user.set("user_pic",getRandomHeader());   //获取随机头像
                            user.save();
                        }
                        user._linkWith("weixin", {
                            "authData": {
                                "uid": user.id,
                                "access_token": wxData.access_token,
                                "expiration_in": wxData.expires_in
                            },
                            success: function (user) {
                                callback();
                            },
                            error: function (err) {
                                console.log(err.message);
                            }
                        })
                    },
                    error: function (user, error) {
                        console.log(error.message);
                    }
                })
            } else {
                //用户不存在则注册
                var user = new fmacloud.User();
                user.set("username", wxUser.unionid);
                user.set("password", "6a063e705a16e625"); //me第三方登录
                user.set('user_nick', wxUser.nickname);
                if(!wxUser.headimgurl){ //获取随机头像
                    user.set("user_pic", getRandomHeader());
                }else{
                    user.set("user_pic", wxUser.headimgurl);
                }
                user.set("regist_source", 0);   //用于区分手机或者PC端注册
                user.set("sex", wxUser.sex);
                user.signUp(null, {
                    success: function (user) {
                        //注册成功则登陆
                        fmacloud.User.logIn(wxUser.unionid, "6a063e705a16e625", {
                            success: function (user) {
                                user._linkWith("weixin", {
                                    "authData": {
                                        "uid": user.id,
                                        "access_token": wxData.access_token,
                                        "expiration_in": wxData.expires_in
                                    },
                                    success: function (user) {
                                        callback();
                                    },
                                    error: function (err) {
                                        console.log(err.message);
                                    }
                                })
                            },
                            error: function (user, error) {
                                console.log(error.message);
                            }
                        })

                    },
                    error: function (user, error) {
                        console.log(error.message);
                    }
                })
            }
        },
        err: function (error) {
            console.log(error.message);
        }
    })
};

var tempHeaders = [{"avatar_url":"http://ac-hf3jpeco.clouddn.com/4494f3b81bed10e35b39"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/17f70e4a66645ae60eff"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/98bf089b3ea0ab1ecc1e"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/078c97f54b59e00ca1e2"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/abeadb11f699080240b4"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/4b21557757cddf9901e5"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/1af1bd60a6a906b71a7c"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/6377818c0d8550caf684"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/7d3845039bbdac32d454"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/4b680573de29ad1d8d94"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/f17367c470a5a172a9f9"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/2e7ff3d3837476ecc592"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/bb126c87bf7979d9e5eb"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/d83025fdbc3007136ff0"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/bb03412408eb28e67948"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/c700ad29d45ddd99482a"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/e6723750e3c6124b9ce4"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/771a656409bcb2ad1703"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/09bb6c942245b5856693"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/c6c014b30d986d026699"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/4fa713426846f760a7ef"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/c35280b647f0ac89aca8"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/7062239a87175fad8f80"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/d80aacf85dff4d28310c"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/80c6b21ee051b9ce683a"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/36e26bbe4ebda0dacf55"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/60d361fc1cebc9ef26a6"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/d6556ddddded480f4d80"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/1cc1574c52913852b5f3"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/8c665e1f11f2fbe1c59d"},
    {"avatar_url":"http://ac-hf3jpeco.clouddn.com/ca8442b0ff5793ba9c2b"}];
function getRandomHeader(){
    var index = Math.floor(Math.random() * tempHeaders.length);
    return tempHeaders[index].avatar_url;
}