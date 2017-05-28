/** 文件名称: utils.js
 *
 * 创 建 人: fishYu
 * 创建日期: 2016/6/12 11:18
 * 描    述: 辅助工具
 */
module.exports = {
    /**
     * 判断浏览器平台
     * @returns {string}
     */
    judgePlatform : function () {
        var platform = "pc";
        //来源判断
        if (navigator.userAgent.match(/Android/i)) {
            platform = "android";
        } else if (navigator.userAgent.match(/iPhone/i)) {
            platform = "iphone";
        } else if (navigator.userAgent.match(/iPad/i)) {
            platform = "ipad";
        } else if (navigator.userAgent.match(/Windows Phone/i)) {
            platform = "wphone";
        } else {
            platform = "pc";
        }
        return platform;
    },
    /**
     * 判断是否在微信内部
     * @returns {boolean}
     */
    isWeiXinPlatform : function () {
        var userAgent = navigator.userAgent.toLowerCase();
        var res = false;
        //来源判断
        if (userAgent.indexOf("micromessenger") > -1) {
            res = true;
        }
        return res;
    },
    /**
     * 判断是否webkit内核
     * @returns {boolean}
     */
    isNotWebkitKernel : function(){
        var userAgent = navigator.userAgent.toLowerCase();
        var res = false;
        //来源判断
        if (userAgent.indexOf("firefox") >= 0 || userAgent.indexOf("msie") >= 0) {
            res = true;
        }
        return res;
    },
    /**
     * 根据链接获取对应的参数
     * @param url
     * @param param
     * @returns {string}
     */
    getParameter : function(url, param){
        var iLen = param.length;
        var iStart = url.indexOf(param);
        if (iStart == -1) {
            return "";
        }
        iStart += iLen + 1;
        var iEnd = url.indexOf("&", iStart);
        if (iEnd == -1) {
            return url.substring(iStart);
        }
        return url.substring(iStart, iEnd);
    },
    /**
     * 微信登录
     * @param url 确认完之后返回的连接  已弃用
     */
    wxLogin : function(url) {
        location.href = "/views/api/index.php?act=get_weixin_user&routeUrl=" + url;
    },
    /**
     * 获取search参数
     * @returns {Object}
     * */
    _GetRequest : function () {
        var url = location.search,theRequest = {}; //获取url中"?"符后的字串
        if (url.indexOf("?") != -1) {  //从"?"开始获取字符串不等于-1
            var str = url.substr(1);    //获取"?"号从1的位置开始后面的字符串赋值给str
            var arr = str.split("&");  //把获取到的字符串进行数组分割每一个"&"之后都成为一个数组赋值给arr
            for (var i = 0; i < arr.length; i++) {     //循环数组长度
                theRequest[arr[i].split("=")[0]] = unescape(arr[i].split("=")[1]);    //解码字符串arr[i]从中分割“=”的第一个数组赋值给theRequest变量
            }
        }
        return theRequest;//getData
    },
    /**
     * 微信登录新方案
     * @param url 确认完之后返回的连接
     * @returns {Object} 微信用户对象
     * */
    _wxLogin : function (url) {
        var _scope = 'snsapi_login',_appId = 'wxaa846f77ece37b87',wxUser={},wxData={},_state='wx';
        var code = this._GetRequest()["code"];
        var self = this;
        if (!code){
            window.location.href = "http://www.agoodme.com/api/get-weixin-code.html?appid="+_appId+
                "&scope="+_scope+"&state="+_state+
                "&redirect="+url;
            return false;
        }
        $.post("http://www.agoodme.com/api/index.php?act=weixin_login", {
            code: code
        }, function (obj) {
            debugger;
            wxUser["unionid"] = obj.unionid;
            wxUser["nickname"] = obj.nickname;
            wxUser["headimgurl"] = obj.headimgurl;
            wxUser["sex"] = parseInt(obj.sex);

            wxData["access_token"] = obj.access_token;
            wxData["expires_in"] = obj.expires_in;

            self._fmacloudLogin(wxUser, wxData, callback);
            document.getElementById("contentDiv").innerHTML ="微信用户信息："+JSON.stringify(obj);
        }, "json");
    },
    /**
     * 获取用户随机头像
     * @returns {string} 用户随机头像
     * tempHeaders : 初始化用户头像数据
     * */
    _getRandomHeader : function () {
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
        var index = Math.floor(Math.random() * tempHeaders.length);
        return tempHeaders[index].avatar_url;
    },
    /**
     * fmacloud 验证用户登录信息
     * @returns {string} 用户随机头像
     * */
    _fmacloudLogin : function (wxUser, wxData, callback) {
        var User = fmacloud.Object.extend("User");
        var query = new fmacloud.Query(User);
        var self = this;
        query.equalTo("username", wxUser.unionid);
        query.find({
            success: function (user) {
                if (user.length > 0) {
                    //用户存在则登陆绑定
                    // alert(user);
                    fmacloud.User.logIn(wxUser.unionid, "6a063e705a16e625", {
                        success: function (user) {  //老用户没头像
                            if(!user.get("user_pic")){
                                user.set("user_pic",self._getRandomHeader());   //获取随机头像
                                user.save();
                            }
                            user._linkWith("weixin", {
                                "authData": {
                                    "uid": user.id,
                                    "access_token": wxData.access_token,
                                    "expiration_in": wxData.expires_in
                                },
                                success: function (user) {
                                    // alert(user);
                                    location.reload();
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
                        user.set("user_pic", self._getRandomHeader());
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
                                            location.reload();
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
    },
    /**
     * 打开评论
     * @param comment
     */
    openComment : function (comment, switchCommentTxt) {
        if (comment && window.commentSwitch) {      //增加一个初始开关
            comment.openBarrage();
            window.commentStatus = true;
            switchCommentTxt.html("弹");
            switchCommentTxt.css({
                "transform":"translate3d(0,1px,0)",
                "-webkit-transform":"translate3d(0,1px,0)",
                "-webkit-transition": "all .5s ease",
                "transition": "all .5s ease "
            });
        }
    },
    /**
     *关闭评论
     * @param comment
     */
    closeComment : function (comment, switchCommentTxt) {
        if (comment) {
            comment.closeBarrage();
            window.commentStatus = false;
            switchCommentTxt.html("关");
            switchCommentTxt.css({
                "transform":"translate3d(0,30px,0)",
                "-webkit-transform":"translate3d(0,30px,0)",
                "-webkit-transition": "all .5s ease",
                "transition": "all .5s ease "
            });
        }
    },
    /*
    * 删除在分享页面地址跳转 add by Mrxu 2017/5/11
    * */
    redirect_href : {
        deleteUrl : '/views1/error/index.html',
        shareUrl : 'http://www.agoodme.com/views1/share/index.html?id='
    }
}