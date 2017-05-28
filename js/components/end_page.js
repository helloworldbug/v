/** 文件名称: end_page.js
 *
 * 创 建 人: fishYu
 * 创建日期: 2016/6/12 16:45
 * 描    述: 作品尾页相关的操作
 */

var DisplayNode = require("../config/display_node_config.js");           //尾页静态html片段配置
var utils = require("../tools/utils.js");            //尾页静态html片段配置
var SHARE_URL = utils.redirect_href.shareUrl;  //分享页面跳转

var EndPage = function(tpl){
    this.device = utils.judgePlatform();
    this.tpl = tpl;
    this.userLevel = tpl.author_vip_level;
    /**
     * 创建尾页节点
     * @returns {string}
     */
    this.createMobileEndNode = function(){
        var self = this;
        var node = "";
        switch (self.userLevel) {
            case 0:	//普通用户
                node = DisplayNode.EndNode.replace("author_img", self.tpl.author_img)
                    .replace("guanzhu_id", self.tpl.author)
                    .replace("author_id", self.tpl.author)
                    .replace("author_name", self.tpl.author_name)
                    .replace("data_type", "1")
                    .replace("button_background", "end-node-btn-background1");
                break;
            case 1:	//VIP1用户
                var dataType = "2";
                var buttonBackground = "end-node-btn-background2";
                if (!self.tpl.wechat_id || self.tpl.wechat_id == "") {
                    dataType = "1";
                    buttonBackground = "end-node-btn-background1";
                }
                node = DisplayNode.EndNode.replace("author_img", self.tpl.author_img)
                    .replace("guanzhu_id", self.tpl.author)
                    .replace("author_id", self.tpl.author)
                    .replace("author_name", self.tpl.author_name)
                    .replace("data_type", dataType)
                    .replace("button_background", buttonBackground);
                break;
            default:	//VIP1用户
                var dataType = "2";
                var buttonBackground = "end-node-btn-background2";
                if (!self.tpl.wechat_id || self.tpl.wechat_id == "") {
                    dataType = "1";
                    buttonBackground = "end-node-btn-background1";
                }
                node = DisplayNode.EndNode.replace("author_img", self.tpl.author_img)
                    .replace("guanzhu_id", self.tpl.author)
                    .replace("author_id", self.tpl.author)
                    .replace("author_name", self.tpl.author_name)
                    .replace("data_type", dataType)
                    .replace("button_background", buttonBackground);
                break;
        }
        return node;
    };
    /**
     * 尾页点击事件
     */
    this.mobileEnd = function(){
        var self = this;
        //DIY 我的微杂志
        var endNodeBtn = $("#end-node-btn");
        endNodeBtn.on("tap",function (e) {
            e.preventDefault();
            e.stopPropagation();
            var target = e.target;
            var dataType = target.getAttribute("data-type");
            if (dataType == "1") {    //下载
                self.clickDownload();
            } else {  //跳转公众号
                if (self.tpl.wechat_id && self.tpl.wechat_id !== "") {
                    location.href = self.tpl.wechat_id;
                }
            }
        });
        //关注
        var guanzhuBtn = $("#end-node-guanzhu");
        //pc端的时候隐藏
        if(this.device != "pc") {	//不是PC设备的时候
            guanzhuBtn.show();
            guanzhuBtn.on("tap",function (e) {
                e.preventDefault();
                e.stopPropagation();
                var target = e.target;
                var guanzhuId = target.getAttribute("data-guanzhu");
                if (guanzhuId) {    //可以关注
                    var url = "http://me.agoodme.com/index.html?userId="+ guanzhuId;
//                window.open(url, "_blank");
                    location.href = url;
                }
            });
        }
        //头像点击
        var endNodeFace = $("#end-node-face");
        endNodeFace.tap(function (e) {
            e.preventDefault();
            e.stopPropagation();
            var target = e.target;
            var authorId = target.getAttribute("data-author-id");
            if (authorId) {    //可以关注
                // location.href = "http://www.agoodme.com/views/share/index.html?id=" + authorId;
                location.href = SHARE_URL + authorId;
            }
        });
    };
    /**
     * 无尾页点击操作
     */
    this.noMobileEnd = function () {
        var self = this;
        var pcME = $("#pc-ME");
        pcME.on("tap",function (e) {
            e.preventDefault();
            e.stopPropagation();
            self.clickDownload();
        });
    }
    /**
     * 点击下载
     */
    this.clickDownload = function(){
        var _url = "";
        if (this.device == "android") {	//android设备
            //modify by fishYu 2016-3-8 17:13  在app里面在微博打开后，点击作品尾页的dir我的微杂志，无法跳转到下载页面，或是进入me
//            _url = "http://me.agoodme.com/dl/me.apk";
            _url = "http://a.app.qq.com/o/simple.jsp?pkgname=com.gli.cn.me";
            //在微信里面打开的情况
            if (utils.isWeiXinPlatform()) {
                _url = "http://a.app.qq.com/o/simple.jsp?pkgname=com.gli.cn.me";
            }
        } else if (this.device == "ipad" || this.device == "iphone") {	//ios设备
            _url = "https://itunes.apple.com/cn/app/mobigage-ndi/id917062901";
            //在微信里面打开的情况
            if (utils.isWeiXinPlatform()) {
                _url = "http://a.app.qq.com/o/simple.jsp?pkgname=com.gli.cn.me";
            }
        }
        location.href = _url;
    };
};

if (typeof define === "function" && define.amd) {
    define(function () {
        return EndPage;
    });
} else if (typeof module != "undefined" && typeof module.exports != "undefined") {
    module.exports = EndPage;
} else {
    window.EndPage = EndPage;
}