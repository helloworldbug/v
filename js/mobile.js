/*
 name:手机
 author:tony
 time:2015/6/16
 */

var Render = require("./lib/render.js"),                                //显示模块
    snsApi = require("./lib/mesns_api.js"),                             //社交API
    env = require("./config/env.js"),                                     //微信分享API路径
    EndPage = require("./components/end_page.js"),                      //尾页相关操作
    model = require("./model/model.js"),                                   //数据处理
    utils = require("./tools/utils.js"),                                    //辅助的插件
    FloatingLayer = require("./components/floatingLayer.js"),                //浮层
    LogUtils = require("./tools/log.js");                                      //收集log相关的操作

var userId = "";
var userLevel = 0;
window.commentStatus = false;
window.praiseStatus = false;   //默认点赞状态
window.commentSwitch = false; //评论开关，通过字段控制
window.PostUrl = "http://api.test.agoodme.com/v1/logger";       //目前只是测试   
if (fmawr == "999") {
    window.PostUrl = "http://api.agoodme.com/v1/logger";
}
(function ($) {
    var music = $("#music"),
        audio = $("audio"),
        box = $("#box"),
        isPlay,
        wrapper = $(".swiper-wrapper"),
        musicWrapper = $("#music-wrapper"),
        notes = musicWrapper.find("div"),
        progress = $("#progress"),
        shareData = {
            "img_width": "100",
            "img_height": "100",
            "link": location.href
        },
        swiper, tpl;
    //实例化一些评论相关的对象
    var comment = null; //评论组件
    var floatingLayer = null; //浮层组件

    var params_tid = utils.getParameter(window.location.href, "tid").split("#")[0];   //去掉微信公众号里面黏贴链接多出的#rd=符号
    var dataFrom = utils.getParameter(window.location.href, "dataFrom").split("#")[0];
    var pid = utils.getParameter(window.location.href, "pid").split("#")[0];   //单页的ID
    var viewPorts = $("#magazine-view-ports");          //杂志视图
    //实例化一些评论相关的对象
    var switchComment = $("#magazine-switch-comment");
    var switchCommentTxt = $("#switch-comment-txt");
    var currentUser = null;
    var md = null;
    var objArr = null;

    var tplClass = 0;
    var tplSign = 0;
    var listType = 0;
    var endPage = null; //尾页实例
    var log = null;        //logo对象
    //不是webkit内核的时候给个提示
    if (utils.isNotWebkitKernel()) {
        alert("为了获得更好的体验，建议使用谷歌浏览器、\n360极速浏览器进行浏览创作");
        return;
    }
    /*数据处理*/
    if (dataFrom === "mobile" || dataFrom === "pc2-0") {
        model.loadData(params_tid, callback);
    }
    //隐藏弹幕开关
    // switchComment.hide();
    /**
     * 全局点击出现或者隐藏按钮控件的方法
     */
    function containerTapHandle() {
        floatingLayer && floatingLayer.showFloatingLayer();
    }
    /**
     * 显示为完成的作品显示的时间条
     */
    function showOpusLife() {
        $("#opus-life-hint").text("此作品为未发布状态，仅用于作品预览，" + window.expireTime + "分钟内有效").show().addClass("opus-life-show");
    }
    function callback(data) {
        tpl = data;
        //TODO 如果是未完成的作品，就提示10分钟内链接有效。
        if (tpl && tpl.tpl_state == 1) {
            //显示导航条
            showOpusLife();
        }
        //预防注入， modify by tony 2016-12-27
        tpl.name = tpl.name.replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
        listType = tpl.list_type;
        tplSign = tpl.tpl_sign;
        userId = tpl.author;    //用户iD
        userLevel = tpl.author_vip_level;   //用户等级
        //修改微信里面长按保存图片的时候标题不能设置的BUG  2016-1-28 18:19
        if (utils.isWeiXinPlatform()) {
            if (!checkWechatVersion()) {
                var iframe = document.createElement('iframe');
                iframe.src = "./favicon.ico";
                iframe.style.display = "none";
                iframe.addEventListener("load", function () {
                    setTimeout(function () {
                        iframe.removeEventListener('load');
                        document.body.removeChild(iframe);
                    }.bind(this), 0)
                }, false);
                document.body.appendChild(iframe);
            }
        }
        $("title").html(tpl.name);
        //初始化设置一个二维数组来存储是否发送收集日志的
        var isHasPostedArr = initPostedArr(tpl);
        //动态设置默认的说明  2016-1-27 15:15
        /**
         标题：会取当前页面title里面的内容。
         图片：会取当前页面body内第一张符合条件的图片。
         图片要求：尺寸必须大于： 300px × 300px
         */
        var descTemp = tpl.brief || "我刚刚用ME制作了一份创意H5作品，完爆99.9%的创意，快来围观吧！";
        $("#metaDes").attr("content", descTemp);
        currentUser = sns_data.getCurrentUser();    //当前登录的用户
        var showIndex = 0;  //初始显示的页码
        if (tplSign != 2) {      //非ME期刊的情况
            objArr = tpl.page_value;
            if (pid) {
                for (var i = 0; i < objArr.length; i++) {
                    if (objArr[i].objectId == pid) {
                        showIndex = i;
                        break;
                    }
                }
            }
        }
        //标题
        shareData["title"] = tpl["name"]; //分享标题
        tplClass = tpl.tpl_class;	//用于区分个人还是企业。企业为1，个人为:0(pc)，或者undefined(app)
        //modify by tony 2016-7-5 14:13 新增的判断是否需要添加尾页
        var lastStatus = tpl.last_status || 0;
        //modify by tony 各种开关设置 2016-9-10 13:00
        var commentOff = tpl.comment_off;   //modify by tony 2016-10-12 由于comment_off, true 表示关闭， false 表示打开， 跟之前设置的只不符
        if (commentOff !== undefined) {
            commentOff = !commentOff;
        }
        window.commentSwitch = commentOff;      //1、动态开关,根据字段控制 comment_off, true 表示关闭， false 表示打开
        window.commentStatus = window.commentSwitch;  //默认评论状态
        //todo 需要通过字段来配置
        if (lastStatus == 1) {
            dms.NO_BOTTOM_LOGO = true;   //去掉底标的开关，默认是关闭，打开就设置ture,可能和去掉尾页为同一个字段last_status == 1
        } else {
            dms.NO_BOTTOM_LOGO = false;
        }
        dms.IS_LOOP_PLAY = tpl.tpl_loop;    //控制循环播放开关，默认是不循环，打开就设置true  tpl_loop
        //渲染
        md = new dms.MagazineDisplay2(".swiper-container", tpl.tpl_width, tpl.tpl_height);
        md.showMagazine(tpl, showIndex);
        LoadingWave && LoadingWave.end();
        log = new LogUtils();
        var platformInfo = log.getPlatformInfo();         //获取平台信息
        //初始化log 收集对象
        if (currentUser) {
            platformInfo.userId = currentUser.id;
        } else {
            platformInfo.userId = "";
        }
        log.initLogData(platformInfo);
        //补充浏览作品的LOG收集,2016-8-15 9:18
        log.resetLogTargetAndEvent(params_tid, "works");
        log.postLogData(PostUrl);
        //设置初始的进度条
        progress.css("width", showIndex / (md.pageLength - 1) * 100 + "%");
        dms.dispatcher.on(dms.OTHER_AUDIO_PLAY, pauseMainAudio);
        dms.dispatcher.on(dms.VIDEO_PLAY, pauseMainAudio);
        dms.dispatcher.on(dms.OTHER_AUDIO_END, replayMainAudio);
        //在显示模块获取音乐播发器
        md.installMusicPlayer();
        //播放器对象
        if (tplSign != 2) {
            md.isLoop = true;
        }
        if (lastStatus != 1) {       //1 表示不添加尾页， 0 或者undefined 表示 有尾页
            if ((userLevel || userLevel == 0) && tplClass != 1) {  //ME期刊不添加尾页
                //实例化尾页相关操作
                endPage = new EndPage(tpl);
                //添加尾页
                var node = endPage.createMobileEndNode();
                if (node) {
                    md.appendSlide(node);
                    endPage.mobileEnd();
                }
            }
        }
        //TODO 目录点击事件
        viewPorts.on("tap", function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (md) {
                md.showViewPorts();
            }
        });
        md.$swiperContainer.on("tap", function (e) {
            //add by tony 2016-4-11 阻止点击界面元素的时候，操作按钮出现
            if (window.isHammerTap) {
                window.isHammerTap = false;
                return;
            }
            //            setTimeout(function() {
            if (e.target.nodeName != "INPUT" && e.target.nodeName != "LABEL" && e.target.nodeName != "A") {
                e.stopPropagation();
                e.preventDefault();
                if (tplSign == 2) {
                    containerTapHandle();
                } else {
                    if (md.currentPage != (md.pageLength - 1)) {  //TODO ME期刊的时候 有些只有一页
                        containerTapHandle();
                    }
                }
            }
            //            }, 100);
        });
        //创建评论
        //只是个人作品才会有评论
        if (tplClass != 1) {
            //初始化评论结构
            var effectImg = (md.getPageDataObjects(0).page_effect_img || tpl.tpl_share_img); //每页的效果图
            commentOperation(params_tid, tpl.name, "", userId, effectImg, $("#globle-comment")[0]);
            switchComment.on("tap", _switchCommentHandle);
            // if (true) { //测试用
                if (utils.isWeiXinPlatform()) { //微信里面
                //如果弹幕开关比的情况下，更改开光状态
                dms.dispatcher.on("comment:open:handle", openComment);
                dms.dispatcher.on("comment:close:handle", closeComment);
            } else {  //其他浏览器里面只能看评论
                //如果弹幕开关比的情况下，更改开光状态
                dms.dispatcher.removeAllEventListeners("comment:open:handle");
                dms.dispatcher.removeAllEventListeners("comment:close:handle");
            }
        }
        md.swiper.on("after", function () {
        });
        //设置请求LOG
        if (isHasPostedArr && !isHasPostedArr[0][0]) {
            isHasPostedArr[0][0] = true;
            //id  页id
            var id = md.getPageDataObjects(0).objectId
            log.resetLogTargetAndEvent(id, "browse");
            log.postLogData(PostUrl);
        }
        //设置滚动条的样式和尾页一些操作
        md.onSwipeTouchEnd = function () {
            //滑动条
            progress.css("width", md.currentPage / (md.pageLength - 1) * 100 + "%");
            //最后一组
            if (md.bookIndex == md.tplsLength - 1) {
                if (md.pageIndex === (md.pageLength - 1)) { //尾页的时候
                    if (tplClass == 1 && userLevel < 1) { //行业作品的时候，最后一个尾页显示
                        $("#pc-ME").removeClass("hide").addClass("show");
                        //点击下载
                        if (endPage && endPage.noMobileEnd) {
                            endPage.noMobileEnd();
                        }

                    } else {
                        if (comment) {
                            comment.closeBarrage();
                        }
                        //modify by tony 2016-4-28 10:03修改由于现在每页都从dom中删除所以事件重新添加
                        if (endPage && endPage.mobileEnd) {
                            endPage.mobileEnd();
                        }
                    }
                    //尾页的时候停止自动播放, 包含循环没打开的情况
                    if (md.magazinePlaying && !dms.IS_LOOP_PLAY) {
                        floatingLayer.pauseMagazine();
                    }
                } else if (md.pageIndex == 0) {
                    if (tplClass == 1 && userLevel < 1) {
                        $("#pc-ME").removeClass("show").addClass("hide");
                    } else {
                    }
                }
            }
            //统计多次PV调用多次百度统计接口
            // baiDuStatistics();
            //设置请求,LOG
            //设置请求LOG
            if (isHasPostedArr && !isHasPostedArr[md.bookIndex][md.pageIndex]) {
                isHasPostedArr[md.bookIndex][md.pageIndex] = true;
                //id  页id
                var id = md.getPageDataObjects(md.pageIndex).objectId
                log.resetLogTargetAndEvent(id, "browse");
                log.postLogData(PostUrl);
            }
        };
        if (md) {
            initScreenInfo();
        }

        //简介
        var brief = "";
        if (tpl.brief || tpl.label) {
            brief = tpl.brief.substr(0, 16);
        }

        //分享信息
        var shareImg = tpl["tpl_share_img"];
        if (shareImg.substr(0, 3) == "AV:") {
            shareImg = shareImg.slice(3);
        }
        shareData["img_url"] = shareImg; //分享图片
        shareData["desc"] = tpl["brief"]; //描述内容

        /* 新的php分享接口
         *  author : Mr xu
         *  time : 2017/4/17
         * */
        //TODO 此处会增加分享后跳转路径,有后台给location

        if (/micromessenger\/([0-9\.]+)/i.test(navigator.userAgent)) {
            if (checkWeChatVer(RegExp.$1)) {
                //微信分享新api
                //由于是跨域访问,多域名网站分享通过云代码去agoodme.com php api获取微信分享的签名数据,
                // fmacloud.Cloud.run('getPhpSignature', { to_url: location.href }, {//参数为当前url
                //     success: function (data) {
                $.post("http://www.agoodme.com/api/index.php?act=get_weixin_signature", {
                    to_url: location.href
                }, function (data) {
                        var obj = JSON.parse(data);
                        try {
                            wx.config({
                                debug: false,//开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                                appId: obj.data.appid, // 必填，公众号的唯一标识
                                timestamp: obj.data.timestamp, // 必填，生成签名的时间戳
                                nonceStr: obj.data.noncestr, // 必填，生成签名的随机串
                                signature: obj.data.signature, // 必填，签名，见附录1
                                jsApiList: ["checkJsApi", "onMenuShareTimeline", "onMenuShareAppMessage", "onMenuShareQQ", "hideMenuItems"] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
                            });

                            wx.error(function (err) {
                                alert(JSON.stringify(err));
                                var other_shareData = {
                                    title: shareData.title, // 分享标题
                                    desc: shareData.desc, // 分享描述
                                    link: shareData.link, // 分享链接
                                    imgUrl: shareData["img_url"]  // 分享图标
                                };
                                wx.onMenuShareAppMessage(other_shareData);
                                wx.onMenuShareTimeline(other_shareData);
                                oldShareApi();
                            });

                            wx.ready(function () {
                                //朋友圈
                                wx.onMenuShareTimeline({
                                    title: shareData.title, // 分享标题
                                    link: shareData.link,//location.href, // 分享链接
                                    imgUrl: shareData["img_url"], // 分享图标
                                    success: function () {
                                        // 用户确认分享后执行的回调函数, 分享数+1
                                        sns_data.tplFieldAddNum(tpl.tpl_id, "share_int", function (data) {
                                            // alert("朋友圈分享成功");
                                            // window.location.href = redirect_href;
                                            getAfterShareTplIdFromAPi(function (tpl_id) {
                                                if(!!tpl_id){
                                                    window.location.href =share_redirect_url(tpl_id);
                                                }
                                            });
                                        }, function (err) {
                                            console.log(err);
                                        });
                                        //重置log数据
                                        log.resetLogTargetAndEvent(params_tid, "share");
                                        //发送logo请求
                                        log.postLogData(PostUrl);
                                    },
                                    cancel: function () {
                                        alert('取消分享到朋友圈')
                                    }
                                });

                                //朋友
                                wx.onMenuShareAppMessage({
                                    title: shareData.title, // 分享标题
                                    desc:  shareData.desc, // 分享描述
                                    link: shareData.link, // 分享链接
                                    imgUrl: shareData["img_url"],  // 分享图标
                                    type: 'link', // 分享类型,music、video或link，不填默认为link
                                    dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
                                    success: function () {
                                        // 用户确认分享后执行的回调函数, 分享数+1
                                        sns_data.tplFieldAddNum(tpl.tpl_id, "share_int", function (data) {
                                            // alert("朋友分享成功");
                                            // window.location.href = redirect_href;
                                            getAfterShareTplIdFromAPi(function (tpl_id) {
                                                if(!!tpl_id){
                                                    window.location.href =share_redirect_url(tpl_id);
                                                }
                                            });
                                        }, function (err) {
                                            console.log(err);
                                        });
                                        //重置log数据
                                        log.resetLogTargetAndEvent(params_tid, "share");
                                        //发送log请求
                                        log.postLogData(PostUrl);
                                    },
                                    cancel: function () {
                                        alert('取消发送给朋友')
                                    }
                                });
                                //QQ
                                wx.onMenuShareQQ({
                                    title: shareData.title, // 分享标题
                                    desc: shareData.desc, // 分享描述
                                    link: shareData.link, // 分享链接
                                    imgUrl: shareData["img_url"],  // 分享图标
                                    success: function () {
                                        // 用户确认分享后执行的回调函数, 分享数+1
                                        sns_data.tplFieldAddNum(tpl.tpl_id, "share_int", function (data) {
                                            // alert("QQ分享成功");
                                            getAfterShareTplIdFromAPi(function (tpl_id) {
                                                if(!!tpl_id){
                                                    window.location.href =share_redirect_url(tpl_id);
                                                }
                                            });
                                             // = redirect_href;
                                        }, function (err) {
                                            console.log(err);
                                        });
                                        //重置log数据
                                        log.resetLogTargetAndEvent(params_tid, "share");
                                        //发送log请求
                                        log.postLogData(PostUrl);
                                    },
                                    cancel: function () {
                                        alert("取消分享到qq")
                                    }
                                });

                                //隐藏举报菜单
                                wx.hideMenuItems({
                                    menuList: ["menuItem:exposeArticle"] // 要隐藏的菜单项，只能隐藏“传播类”和“保护类”按钮，所有menu项见附录3
                                });
                            });
                            // wx.error(function (error) {
                            //     alert(obj.data.signature + "wx error:" + JSON.stringify(error));
                            // });

                        } catch (e) {
                            alert(e.message);
                        }
                    });
            }else {
                oldShareApi();
            }
        }  else {  //别的地方分享到微信
            var other_shareData = {
                title: shareData.title,
                desc: shareData.desc,
                link: shareData.link,
                imgUrl: shareData["img_url"]
            };
            wx.onMenuShareAppMessage(other_shareData);
            wx.onMenuShareTimeline(other_shareData);
        }

        //原来的微信配置
        /*if (/micromessenger\/([0-9\.]+)/i.test(navigator.userAgent)) {
            if (checkWeChatVer(RegExp.$1)) {
                //微信分享新api
                $.post(env.api + "?act=get_weixin_signature", {
                    to_url: location.href
                }, function (data) {
                    //fmacloud.Cloud.run('getOauthDataWXShare', {url:"http://www.agoodme.com/"}, {
                    // success: function (data) {
                    //alert(JSON.stringify(data));
                    //微信配置
                    wx.config({
                        debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                        appId: data.data.appid, // 必填，公众号的唯一标识
                        timestamp: data.data.timestamp, // 必填，生成签名的时间戳
                        nonceStr: data.data.noncestr, // 必填，生成签名的随机串
                        signature: data.data.signature, // 必填，签名，见附录1
                        jsApiList: ["onMenuShareTimeline", "onMenuShareAppMessage", "onMenuShareQQ", "hideMenuItems"] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
                    });

                    wx.error(function (err) {
                        alert(JSON.stringify(err));
                        var other_shareData = {
                            title: shareData.title,
                            desc: shareData.desc,
                            link: shareData.link,
                            imgUrl: shareData["img_url"]
                        };
                        wx.onMenuShareAppMessage(other_shareData);
                        wx.onMenuShareTimeline(other_shareData);
                        oldShareApi();
                    })

                    wx.ready(function () {
                        //朋友圈
                        wx.onMenuShareTimeline({
                            title: shareData.title, // 分享标题
                            link: shareData.link, // 分享链接
                            imgUrl: shareData["img_url"], // 分享图标
                            success: function () {
                                // 用户确认分享后执行的回调函数, 分享数+1
                                sns_data.tplFieldAddNum(tpl.tpl_id, "share_int", function (data) {
                                }, function (err) {
                                    console.log(err);
                                });
                                //重置log数据
                                log.resetLogTargetAndEvent(params_tid, "share");
                                //发送logo请求
                                log.postLogData(PostUrl);
                            },
                            cancel: function () {
                                // 用户取消分享后执行的回调函数
                                //alert("取消分享朋友圈");
                                //alert(shareData.title);
                            }
                        });

                        //朋友
                        wx.onMenuShareAppMessage({
                            title: shareData.title, // 分享标题
                            desc: shareData.desc, // 分享描述
                            link: shareData.link, // 分享链接
                            imgUrl: shareData["img_url"], // 分享图标
                            type: 'link', // 分享类型,music、video或link，不填默认为link
                            dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
                            success: function () {
                                // 用户确认分享后执行的回调函数, 分享数+1
                                sns_data.tplFieldAddNum(tpl.tpl_id, "share_int", function (data) {
                                }, function (err) {
                                    console.log(err);
                                });
                                //重置log数据
                                log.resetLogTargetAndEvent(params_tid, "share");
                                //发送log请求
                                log.postLogData(PostUrl);
                            },
                            cancel: function () {
                                // 用户取消分享后执行的回调函数
                                //alert('取消WX分享朋友')
                            }
                        });

                        //QQ
                        wx.onMenuShareQQ({
                            title: shareData.title, // 分享标题
                            desc: shareData.desc, // 分享描述
                            link: shareData.link, // 分享链接
                            imgUrl: shareData["img_url"], // 分享图标
                            success: function () {
                                // 用户确认分享后执行的回调函数, 分享数+1
                                sns_data.tplFieldAddNum(tpl.tpl_id, "share_int", function (data) {
                                }, function (err) {
                                    console.log(err);
                                });
                                //重置log数据
                                log.resetLogTargetAndEvent(params_tid, "share");
                                //发送log请求
                                log.postLogData(PostUrl);
                            },
                            cancel: function () {
                                //										alert("取消分享到qq")
                            }
                        });

                        //隐藏举报菜单
                        wx.hideMenuItems({
                            menuList: ["menuItem:exposeArticle"] // 要隐藏的菜单项，只能隐藏“传播类”和“保护类”按钮，所有menu项见附录3
                        });
                    })
                    //        },
                    //error: function (err) {
                    //执行云代码报错
                    //  alert(err.message);
                    //  console.log(err.message);
                    // }
                    // }); 
                }, "json")
            } else {
                oldShareApi();
            }
        } else {  //别的地方分享到微信
            var other_shareData = {
                title: shareData.title,
                desc: shareData.desc,
                link: shareData.link,
                imgUrl: shareData["img_url"]
            };
            wx.onMenuShareAppMessage(other_shareData);
            wx.onMenuShareTimeline(other_shareData);
        }*/
        //TODO 设置TPLPV
        setTplPV("tplid", params_tid, md.getAllPagesLength());
        //创建浮层页组件
        floatingLayer = new FloatingLayer(data, currentUser, comment, md, log);
    }

    //滑动处理结束
    //音乐按钮
    var musicBtn = musicWrapper.find("section");
    wrapper.on("touchend", function (e) {
        //        e.stopPropagation();
        //        e.preventDefault()
        if (!isPlay) {
            //            _loadMusic();
            replayMainAudio();
        }
    })
    //created by tony 2016-1-14  musicBtn 更换 musicWrapper  扩大音乐按钮的区域
    musicWrapper.on("touchend", function (e) {
        e.stopPropagation();
        e.preventDefault();
        if (music.hasClass("spin")) {
            pauseMainAudio();
        } else {
            replayMainAudio();
            if (window.dms) {
                //派发事件
                var event = dms.createEvent(dms.MANI_AUDIO_PLAY, "");
                dms.dispatcher.dispatchEvent(event);
            }
        }
    })

    //音乐标签处理
    var musicLabel = $("#music-wrapper>span"),
        t;

    switchMusicLabel("关闭音乐");

    function switchMusicLabel(text) {
        musicLabel.html(text).removeClass("fadeOut").addClass("fadeOut");
        clearTimeout(t);
        t = setTimeout(function () {
            musicLabel.removeClass("fadeOut");
        }, 1000);
    }

    function pauseMainAudio(data) {
        //是点击播放iframe的时候,隐藏其他操作按钮
        if ((data && data.target) && data.target == "iframe") {
            musicWrapper.hide();
        }
        if (!md.musicPlayer.isPaused()) {
            //            audio[0].pause();
            md.musicPlayer.pause()
            music.removeClass("spin");
            notes.removeClass("note");
            isPlay = "off";
            switchMusicLabel("关闭音乐");
        }
    };
    function replayMainAudio(data) {
        //关闭播放iframe的时候,显示其他操作按钮
        if ((data && data.target) && data.target == "iframe") {
            if (tpl.tpl_music && tpl.tpl_music !== "") {
                musicWrapper.show();
            }
        }
        if (md.musicPlayer.isPaused()) {
            //            audio[0].play();
            md.musicPlayer.play()
            music.addClass("spin");
            notes.addClass("note");
            isPlay = "on";
            switchMusicLabel("开启音乐");
        }
    };
    //微信版本判断
    function checkWeChatVer(str) {
        var arr = str.split(".");
        if (arr[0] === "6" && (parseInt(arr[1]) >= 0 || parseInt(arr[3]) >= 2)) {
            return true;
        } else {
            return false;
        }
    }

    //微信老api
    function oldShareApi() {
        document.addEventListener('WeixinJSBridgeReady', function onBridgeReady() {
            // 发送给好友
            WeixinJSBridge.on('menu:share:appmessage', function (argv) {
                WeixinJSBridge.invoke('sendAppMessage', shareData, function (res) {
                })
            });
            // 分享到朋友圈
            WeixinJSBridge.on('menu:share:timeline', function (argv) {
                WeixinJSBridge.invoke('shareTimeline', shareData, function (res) {
                })
            });
        }, false);
    }






    /**
     * 评论的一些操作
     * @param tplId     作品ID
     * @param tplName   作品标题
     * @param pageId    页数据ID
     * @param userId    页创建者
     * @param pageThumb 页的缩略图
     * @param parentDom 添加评论的父容器 dom对象
     */
    function commentOperation(tplId, tplName, pageId, userId, pageThumb, parentDom) {
        comment = cm.Comment.create({
            tplId: tplId,
            tplName: tplName,
            pageTplId: tplId,
            tplType: 0,
            dateSite: 0,
            tplUserId: userId,
            tplShareImage: pageThumb
        });
        comment.appendTo(parentDom);
        if (window.commentStatus) {
            openComment();

        } else {
            closeComment();
        }
        comment.on("reply:success", function () {
            //评论完成之后的处理
            console.log("评论完成之后的处理");
        });

        comment.on("reply:error", function () {
            //评论完成之后的处理
            console.log("取消评论的处理");
        });
    }

    function _switchCommentHandle(e) {
        debugger
        e.preventDefault();
        e.stopPropagation();
        if (window.commentStatus) {
            closeComment();
        } else {
            openComment();
        }
    }

    function openComment() {
        utils.openComment(comment, switchCommentTxt);

    }

    function closeComment() {
        utils.closeComment(comment, switchCommentTxt);
    }
    /**
     * 百度统计
     */
    function baiDuStatistics() {
      /**  try {
            //测试
            //            var pageURL = "/mobile/views/mobile.html?tid="+params_tid+"&dataFrom="+dataFrom;
            //正式
            //            var pageURL = "/views/mobile.html?tid="+params_tid+"&dataFrom="+dataFrom;
            var pageURL = "/" + params_tid + "/shareme.html?tid=" + params_tid + "&dataFrom=" + dataFrom;
            _hmt.push(['_trackPageview', pageURL]);

        } catch (e) {
            console.log(e.name + ": " + e.message);
        }**/
    };
    /**
     * TODO 设置浏览的PV
     * @param param_type 参数类型,tplobj（tplobj对象），tplid（tplid反查）
     * @param param_val 对象值
     * @param page_int 页数
     */
    function setTplPV(param_type, param_val, page_int) {
        sns_data.setTplPv(param_type, param_val, page_int, function (ok) { }, function (err) { });
    };
    /**
     * 显示初始化界面信息--修改出现的顺序
     * 自动播放
     * 社交按钮，音乐
     */
    function initScreenInfo() {
        $(".newest-end-report").show();
        if (window.commentStatus) {
            $("#magazine-switch-comment").show();
        }

        //音乐
        if (md && tpl["tpl_music"] && tpl["tpl_music"] !== "" && md.musicPlayer) {
            musicWrapper.show();
            //            _loadMusic();
            md.musicPlayer.play();
            music.addClass("spin");
            notes.addClass("note");
            switchMusicLabel("开启音乐");
            //add by tony 2016-12-27 测试在微信里面不能直接播放
            if (utils.isWeiXinPlatform()) {   //在微信里面的时候
                wx && wx.ready(function () {
                    _loadMusic();
                    md.musicPlayer.play();
                    //add by xushuai 测试iframe加载问题。
                    var iframe = document.createElement('iframe');
                    iframe.src = "./favicon.ico";
                    iframe.style.display = "none";
                    iframe.addEventListener("load", function () {
                        setTimeout(function () {
                            iframe.removeEventListener('load');
                            document.body.removeChild(iframe);
                        }.bind(this), 0)
                    }, false);
                    document.body.appendChild(iframe);
                    $("title").html(tpl.name);  //重新设置标题
                });
            }
        }
    };
    /**
     * ios 第一播放要load
     * @private
     */
    function _loadMusic() {
        if (!md || !md.musicPlayer) return;
        md.musicPlayer.load();
    };
    /**
     * 获取微信版本 如 6.3.22 -- 6322
     */
    function getWechatVersion() {
        var version = [];
        var userAgent = navigator.userAgent.toLowerCase();
        var versionTemp = userAgent.match(/micromessenger\/([\d\.]+)/i)[1]; //为6.3.22格式
        version = versionTemp.split('.');
        return version;
    };
    /**
     * 比较----当前版本大于等于微信6.3.22为true,反之false
     * @returns {boolean}
     */
    function checkWechatVersion() {
        var checkVersion = [6, 3, 22];
        var currentVersion = getWechatVersion();
        var len = Math.max(checkVersion.length, currentVersion.length);
        var res = true;
        for (var i = 0; i < len; i++) {
            var cV = parseInt(currentVersion[i]) || 0;
            var checkV = checkVersion[i] || 0;
            if (cV > checkV) {
                res = true;
                break;
            } else if (cV < checkV) {
                res = false;
                break;
            }
        }
        return res;
    }

    /**
     * 初始化二维数组 [[false], [false], [false],.....]
     * @param tpl
     */
    function initPostedArr(tpl) {
        var groups = tpl.groups;
        if (!groups) {
            return null;
        }
        var temp = [];
        for (var i = 0; i < groups.length; i++) {
            var pages = groups[i].pages;
            var len = pages.length;
            var itemArr = [];
            for (var j = 0; j < len; j++) {
                itemArr.push(false);
            }
            temp.push(itemArr);
        }
        return temp;
    }
    /*
    *  add by Mr xu 2017/5/2 判断分享成功后,服务里得到跳转路径
    * */
    function getAfterShareTplIdFromAPi(callback){
        fmacloud.Cloud.run('getRecommendTplid', {}, {
            success: function (data) {
                callback(data.tpl_id);
            },
            error: function (error) {
                // debugger;
                console.error("查询失败,"+error);
            }
        });
    }
    function share_redirect_url(tpl_id) {
        return window.location.origin+'/'+tpl_id+'/shareme.html?tid='+tpl_id+'&dataFrom=pc2-0';
    }
}(window.jQuery))
