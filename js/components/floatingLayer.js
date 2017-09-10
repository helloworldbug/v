/** 文件名称: floatingLayer.js
 *
 * 创 建 人: tony
 * 创建日期: 2016/6/15 14:21
 * 描    述: 作品浮层相关功能
 */

var utils = require("../tools/utils.js");            //尾页静态html片段配置
var snsApi = require("../lib/mesns_api.js");                            //社交API
var SHARE_URL = utils.redirect_href.shareUrl;  //分享页面跳转

var FloatingLayer = function (tpl, currentUser, comment, md, log) {
    var floatDom = $("#floating-layer");
    this.autorName = floatDom.find("#authorName");      //作者名称
    this.autorImg = floatDom.find("#authorImg");        //作者头像
    this.releaseDate = floatDom.find("#releaseDate");   //发布日期
    this.lookAndShare = floatDom.find("#lookAndShare"); //阅读数分享数
    this.tapLike = floatDom.find("#tapLike");           //点赞按钮
    this.commentDom = floatDom.find("#comment");           //评论按钮
    this.toDo = floatDom.find("#toDo");                 //我也要做按钮
    this.autoPlay = floatDom.find("#autoPlay");         //自动播放按钮
    this.magazineViewPorts = floatDom.find("#magazine-view-ports"); //目录按钮

    this.personFloat = floatDom.find("#personFloat");           //个人头像浮层
    this.personImg = floatDom.find("#personImg");               //个人头像
    this.personName = floatDom.find("#personName");             //个人名称
    this.personClose = floatDom.find("#personClose");           //个人浮层关闭按钮
    this.personAttention = floatDom.find("#personAttention");   //关注按钮
    this.personAddMain = floatDom.find("#personAddMain");       //添加到主屏按钮
    this.personCenterPage = floatDom.find("#personCenterPage"); //Ta的主页按钮

    this.musicWrapper = $("#music-wrapper");                    //音乐按钮
    this.magazineSwitchComment = $("#magazine-switch-comment"); //弹幕按钮

    this.reportBtn = $(".newest-end-report");        //举报按钮

    var self = this;
    this.commentStatusTemp = false;     //记录评论状态
    this.praiseStatus = false;          //点赞状态
    this.device = utils.judgePlatform();


    var releaseTime = new Date(parseInt(tpl.reupdate_date) * 1000);
    this.autorName.html(tpl.author_name);
    this.autorImg.css({ "background-image": "url(" + tpl.author_img + ")" });
    //隐藏发布日期 浏览次数  分享次数 自动播放按钮
    this.releaseDate.hide();
    // this.lookAndShare.hide();    //modify by tony 2016-9-9 14:45打开浏览量
    // this.autoPlay.hide();
    this.releaseDate.html("发布日期: " + releaseTime.getFullYear() + "/" + (releaseTime.getMonth() + 1) + "/" + releaseTime.getDate());
    // this.lookAndShare.html(tpl.read_pv + "次浏览·" + tpl.share_int + "次分享");
    this.lookAndShare.html(tpl.read_pv + "次浏览"); //modify by tony 2016-9-9 14:45打开浏览量

    this.personImg.css({ "background-image": "url(" + tpl.author_img + ")" });
    this.personName.html(tpl.author_name);
    
    /** 修改点赞/评论按钮显示方式 -- 临时新方案(若当前域名不是www.agood.com 就不显示此按钮)
     * @author : Mrxu
     * @time : 2017/4/19
     * */
    // if (utils.isWeiXinPlatform() && tpl.tpl_class != 1 && window.location.host =='www.agoodme.com') {
    if (utils.isWeiXinPlatform() && tpl.tpl_class != 1) {
        this.tapLike.show();
        //window.commentSwitch  true表示关闭  false表示打开 -- 奇怪的设置方案
        if (window.commentSwitch) {
            this.commentDom.show();
        } else {
            this.commentDom.hide();
        }
    } else {
        this.tapLike.hide();
        this.commentDom.hide();
    }

    this.showFloatingLayer = function () {
        self.commentStatusTemp = window.commentStatus;
        // utils.closeComment(comment, $("#switch-comment-txt"));
        utils.openComment(comment, $("#switch-comment-txt"));
        floatDom.show();
        self.musicWrapper.hide();
        self.magazineSwitchComment.hide();
        if (tpl.list_style) {
            self.magazineViewPorts.show();
        }
        if (md && md.getAllPagesLength() > 2) {
            //超过一页的时候显示按钮 作品中设置了自动播放的状态，这里需要修改自动播放按钮的状态
            //modify by tony 2016-9-9 18:20 优化自动播放
            self.autoPlay.show();
            if (md.magazinePlaying) {
                self.autoPlay[0].className = "switch-play pause-magazine";
            } else {
                self.autoPlay[0].className = "switch-play play-magazine";
            }
        }
        if (currentUser) {    //已经登录过的情况下
            comment.getPraiseStatus(function (bool) {
                self.changePraiseStatus(bool, self.tapLike, 0);
                self.praiseStatus = bool;
            });
        }

    };
    this.hideFloatingLayer = function () {
        floatDom.hide();
        debugger;
        if (md && tpl["tpl_music"] && tpl["tpl_music"] !== "" && md.musicPlayer) {
            self.musicWrapper.show();
        }
        //modify by tony 2016-9-10用于判断是否打开评论，开关设置打开的时候，才显示
        window.commentStatus = !self.commentStatusTemp;
        if (window.commentStatus) {
            utils.openComment(comment, $("#switch-comment-txt"));
        } else {
            utils.closeComment(comment, $("#switch-comment-txt"));
        }
        utils.closeComment(comment, $("#switch-comment-txt"));

        if (window.commentSwitch) {
            self.magazineSwitchComment.show();
        }

        if (self.commentStatusTemp || window.commentStatus) {
            //window.commentStatus = self.commentStatusTemp;
            utils.openComment(comment, $("#switch-comment-txt"));
        }
    };

    floatDom.on("tap", function (e) {              //点击浮层
        e.preventDefault();
        e.stopPropagation();
        self.hideFloatingLayer();
    });

    this.autorImg.on("tap", function (e) {         //点击头像
        e.preventDefault();
        e.stopPropagation();
        //console.log("点击了头像");
        self.personFloat.show();
    });

    this.tapLike.on("tap", function (e) {         //点击点赞
        e.preventDefault();
        e.stopPropagation();
        //console.log("点击了点赞");
        if (!currentUser) {   //没有登录的情况去登录。
            // todo 获取当前页的ID objectID
            /** 废弃原来的php登录接口
            var __objectId = "";
            if (md.getPageDataObjects(md.currentPage)) {
                __objectId = md.getPageDataObjects(md.currentPage).objectId;
            }
             var params_tid = utils.getParameter(window.location.href, "tid").split("#")[0];   //去掉微信公众号里面黏贴链接多出的#rd=符号
             utils.wxLogin(encodeURIComponent(params_tid + "/shareme.html?tid=" + params_tid + "&pid=" + __objectId + "&dataFrom=mobile"));
            */
            utils._wxLogin(encodeURIComponent(window.location.href));
            // utils._wxLogin('http://h5.agoodme.com/15acad2d98a921a7/shareme.html?tid=15acad2d98a921a7&dataFrom=pc2-0');
            return;
        }
        if (comment) {
            if (self.praiseStatus) {
                self.praiseStatus = false;
            } else {
                self.praiseStatus = true;
            }
            self.changePraiseStatus(self.praiseStatus, self.tapLike, 1);
            //console.log("slkdjfa;lj");
            comment.praise(function (bool) {
                //                changePraiseStatus(bool, praise);
                //                console.log(bool, 63244);
                //评论重置LOG
                log.resetLogTargetAndEvent(params_tid, "praise");
                //发送请求
                log.postLogData(window.PostUrl);
            });
        }
    });

    /**
     * 修改点赞状态
     * @param isPraise boolean 是否点赞过
     * @param obj 点赞对象jquery
     * @param type 1动画 0非动画
     */
    this.changePraiseStatus = function (isPraise, obj, type) {
        if (isPraise) {
            if (type) {
                obj.get(0).className = "footer-praise screen-button-active footer-praise_show";
            } else {
                obj.get(0).className = "footer-praise screen-button-active footer-praise_ck";
            }
        } else {
            if (type) {
                obj.get(0).className = "footer-praise screen-button-active footer-praise_hide";
            } else {
                obj.get(0).className = "footer-praise screen-button-active footer-praise_nck";
            }
        }
    };


    this.commentDom.on("tap", function (e) {         //点击评论
        e.preventDefault();
        e.stopPropagation();
        //console.log("点击了评论");
        if (!currentUser) {   //没有登录的情况去登录。
            // todo 获取当前页的ID objectID
            /** 废弃原来的php登录接口
            var __objectId = "";
            if (md.getPageDataObjects(md.currentPage)) {
                __objectId = md.getPageDataObjects(md.currentPage).objectId;
            }
            var params_tid = utils.getParameter(window.location.href, "tid").split("#")[0];   //去掉微信公众号里面黏贴链接多出的#rd=符号
            utils.wxLogin(encodeURIComponent(params_tid + "/shareme.html?tid=" + params_tid + "&pid=" + __objectId + "&dataFrom=mobile"));
            */
            utils._wxLogin(encodeURIComponent(window.location.href));
            return;
        }
        if (currentUser.get("blacklist") == 1) {
            alert("你已经被禁言了，请联系ME小助手");
            return;
        }
        self.commentHandle();
    });
    /**
     * 评论按钮点击实际处理事件
     */
    this.commentHandle = function () {
        if (comment) {
            if (md) { //评论的时候停止自动播放
                if (md.magazinePlaying) {
                    self.pauseMagazine();
                }
            }
            comment.showReply();
            //评论重置LOG
            var params_tid = utils.getParameter(window.location.href, "tid").split("#")[0];   //去掉微信公众号里面黏贴链接多出的#rd=符号
            log.resetLogTargetAndEvent(params_tid, "comment");
            //发送请求
            log.postLogData(window.PostUrl);
        }
    };
    this.toDo.on("tap", function (e) {            //点击我也要做
        e.preventDefault();
        e.stopPropagation();
        //        console.log("点击了我也要做");
        var _url = "";
        if (self.device == "android") {	//android设备
            _url = "http://a.app.qq.com/o/simple.jsp?pkgname=com.gli.cn.me";
        } else if (self.device == "ipad" || self.device == "iphone") {	//ios设备
            _url = "https://itunes.apple.com/cn/app/mobigage-ndi/id917062901";
            //在微信里面打开的情况
            if (utils.isWeiXinPlatform()) {
                _url = "http://a.app.qq.com/o/simple.jsp?pkgname=com.gli.cn.me";
            }
        }
        location.href = _url;
    });
    this.autoPlay.on("tap", function (e) {        //点击自动播放
        e.preventDefault();
        e.stopPropagation();
        //console.log("点击了自动播放");
        if (md) {
            if (md.magazinePlaying) {
                self.pauseMagazine();
            } else {
                //倒数第二页的时候不直接跳到下一页
                if (md.currentPage < md.pageLength - 2) {
                    md.pageTo(md.currentPage + 1);
                }
                self.playMagazine();
            }
        }
        self.hideFloatingLayer();
    });

    /**
     * 暂停自动播放
     */
    this.pauseMagazine = function () {
        if (md) {
            self.autoPlay[0].className = "switch-play play-magazine";
            md.pauseMagazine();
        }
    };
    /**
     * 开始自动播放
     */
    this.playMagazine = function () {
        if (md) {
            self.autoPlay[0].className = "switch-play pause-magazine";
            md.playMagazine();
        }
    };

    this.personFloat.on("tap", function (e) {
        e.preventDefault();
        e.stopPropagation();
    });
    this.personClose.on("tap", function (e) {     //点击个人浮层关闭按钮
        e.preventDefault();
        e.stopPropagation();
        self.personFloat.hide();
    });
    this.personAttention.on("tap", function (e) { //点击关注
        e.preventDefault();
        e.stopPropagation();
        //console.log("点击了关注");
        //var target = e.target;
        var guanzhuId = tpl.author;
        if (guanzhuId) {    //可以关注
            var url = "http://me.agoodme.com/index.html?userId=" + guanzhuId;
            //                window.open(url, "_blank");
            location.href = url;
        }
    });
    this.personAddMain.on("tap", function (e) {   //点击点击到主屏
        e.preventDefault();
        e.stopPropagation();
        //console.log("点击了添加到主屏");
        var authorId = tpl.author;
        if (authorId) {
            location.href = SHARE_URL + authorId;
        }
    });
    this.personCenterPage.on("tap", function (e) {//点击Ta的个人主页
        e.preventDefault();
        e.stopPropagation();
        //console.log("点击了Ta的个人主页",tpl);
        var authorId = tpl.author;
        if (authorId) {
            // location.href = "http://www.agoodme.com/views/share/index.html?id=" + authorId;
            location.href = SHARE_URL + authorId;
        }
    });

    //举报点击事件
    this.reportBtn.on("tap", function (e) {         //举报点击事件
        e.preventDefault();
        e.stopPropagation();
        //        console.log("举报点击事件");
        self.showReportLayer();
    });
    /**
     * 显示评论浮动层
     */
    this.showReportLayer = function () {
        var floatDom = $("#floating-layer");
        floatDom.show();
        var reportContent = $("#report-content");
        reportContent.show();
        var reportLayer = $(".report-layer");
        reportLayer.show();
        reportLayer.removeClass("slideOutToBottom").addClass("slideInFromBottom");
        reportLayer.on("webkitAnimationEnd", function () {
            reportLayer.removeClass("slideInFromBottom");
            reportLayer.off("webkitAnimationEnd");
        });
        var reportItemList = $("#report-item-list");
        var reportMask = $("#report-mask");
        var reportCancel = $("#report-cancel");
        reportItemList.on("tap", function (e) {
            e.preventDefault();
            e.stopPropagation();

            var $target = $(e.target);
            //TODO 获取用户信息
            var currentUser = sns_data.getCurrentUser();
            var name = "";
            if (currentUser) {
                name = currentUser.get("user_nick");
                if (name == "" || name == null) {
                    name = currentUser.get("username");
                }
            }
            var context = $target.text();
            var content = name + "的用户,举报了ID为：" + tpl.tpl_id + ",的模版; 举报内容为:" + context;
            if (content) {
                self.saveReportToCloud(content);
            }
        });
        reportMask.tap(function (e) {
            e.preventDefault();
            e.stopPropagation();
            self.hideReportLayer();
        });
        reportCancel.tap(function (e) {
            e.preventDefault();
            e.stopPropagation();
            self.hideReportLayer();
        });
    }

    this.hideReportLayer = function () {
        var reportContent = $("#report-content");
        var reportLayer = $(".report-layer");
        var reportItemList = $("#report-item-list");
        var reportMask = $("#report-mask");
        var reportCancel = $("#report-cancel");
        reportLayer.removeClass("slideInFromBottom").addClass("slideOutToBottom");
        reportLayer.on("webkitAnimationEnd", function () {
            reportLayer.removeClass("slideOutToBottom");
            reportLayer.off("webkitAnimationEnd");
            reportLayer.hide();
            reportContent.hide();
            var floatDom = $("#floating-layer");
            floatDom.hide();
        });
        reportItemList.off("tap");
        reportMask.off("tap");
        reportCancel.off("tap");

    }

    this.saveReportToCloud = function (content) {
        var fbType = tpl.data_site == "1" ? 3 : 1;      //pc端为3， app端为1
        var options = {
            "fb_type": fbType,
            "context": content
        };
        sns_data.addFeedback(options, function (data) {
            self.hideReportLayer();
            //        alert("举报成功");
            console.log(data);
        }, function () { });
    }
};

if (typeof define === "function" && define.amd) {
    define(function () {
        return FloatingLayer;
    });
} else if (typeof module != "undefined" && typeof module.exports != "undefined") {
    module.exports = FloatingLayer;
} else {
    window.FloatingLayer = FloatingLayer;
}