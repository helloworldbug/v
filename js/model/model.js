/** 文件名称: model.js
 *
 * 创 建 人: fishYu
 * 创建日期: 2016/6/12 13:28
 * 描    述: 数据查询接口
 */
var DELETE_URL = require('../tools/utils').redirect_href.deleteUrl;

module.exports = {
    /**
     * 根据作品id去查询所有所作品的数据
     * @param tid           //作品ID
     * @param callback      //成功的回调
     */
    loadData: function (tid, callback) {
        var self = this;
        var fileUrlConf = "http://ac-syrskc2g.clouddn.com/";    //测试服的jsonurl域名
        var apiServe = "http://api.test.agoodme.com"; //http://api.test.agoodme.com  http://192.168.6.212:8888
        if (fmawr === "999") {
            fileUrlConf = "http://ac-hf3jpeco.clouddn.com/";    //正式服的jsonurl域名
            apiServe = "http://api.agoodme.com";
        }
        var tpl = null;
        //TODO 这里更换查询接口，走自己的服务器查询是否失效。以及作品信息
        // dms.model.getTplObjById(tid, function(obj){
        var new_random = Math.round(Math.random()*(30000)+1000);
        $.get(apiServe + "/v1/verify/expire?tid=" + tid+'&entry_domain='+window.location.host+'&rnd='+new_random, function (result, status) {
            // $.get("http://192.168.6.212:8888/v1/verify/expire?tid=" + tid, function (result, status) {

            // if (result.backup_domain_name) {
            //     var domain = result.backup_domain_name;
            //     if (domain !== location.host) {
            //         location.host = domain;
            //         return;
            //     }
            // }
            /* 替换后台传回的域名
             *  author : Mr xu
             *  time : 2017/4/18
             *  
            if(result.backup_domain_name){
                debugger;
                var domain=result.backup_domain_name;
                if(domain!==window.location.host){
                    // location.port == 80;
                    window.location.host=domain;
                    return;
                }
            }*/
            if (result.code === "10000") {
                var tplObj = null;
                try {
                    tplObj = JSON.parse(result.tpl_obj);
                } catch (e) {
                    console.log("转换json失败：" + e);
                }
                if (!tplObj) return;
                window.expireTime = result.expire_time || 10;     //失效时间
                var obj = tplObj.results[0];
                obj.adData = result.ad_data;
                var tplSign = obj.tpl_sign;
                var tplDelete = obj.tpl_delete;
                var reviewStatus = obj.review_status;   //作品状态，1 待审核，2警告， 3，人工审核成功, 4,初审拒绝， 5申诉， 6，复审拒绝, 7,告警关闭
                if (tplDelete) {
                    // alert("该作品已删除");
                    LoadingWave.end();
                    var appealInfo = {};
                    appealInfo.level = 1;       //出错等级 1 表示失效
                    appealInfo.detail = "ME提醒你：作品已被删除";
                    //TODO 存储本地localstorage
                    window.localStorage.tpl_appeal_info = JSON.stringify(appealInfo);
                    //跳转到删除页面
                    window.location.href = DELETE_URL;
                    return false;
                }
                //失效不执行下面操作
                if (result.expire) {
                    LoadingWave.end();
                    var appealInfo = {};
                    appealInfo.level = 1;       //出错等级 1 表示失效
                    //TODO 存储本地localstorage
                    window.localStorage.tpl_appeal_info = JSON.stringify(appealInfo);
                    //跳转到删除页面
                    window.location.href = DELETE_URL;
                    return false;
                }
                //异常的作品
                if (reviewStatus > 3 && reviewStatus != 7) {
                    LoadingWave.end();
                    var appealInfo = {};
                    //添加正式还是测试服
                    appealInfo.fmawr = fmawr || "0";
                    appealInfo.tid = tid || "";   //作品ID 
                    appealInfo.level = 2;       //出错等级 2 表示删除
                    appealInfo.title = obj.name;       //出错等级 2 表示删除
                    //TODO 存储本地localstorage
                    window.localStorage.tpl_appeal_info = JSON.stringify(appealInfo);
                    //跳转到删除页面
                    window.location.href = DELETE_URL;
                    return false;
                }
                //如果贺卡失效了，不能观看
                if (obj && obj.tpl_invalid == 1) {
                    // alert("该问题已经答错三次,\n很抱歉你看不到贺卡啦");
                    LoadingWave.end();
                    var appealInfo = {};
                    appealInfo.level = 1;       //出错等级 1 表示失效
                    appealInfo.detail = "该问题已经答错三次,很抱歉你看不到贺卡啦";
                    //TODO 存储本地localstorage
                    window.localStorage.tpl_appeal_info = JSON.stringify(appealInfo);
                    //跳转到删除页面
                    window.location.href = DELETE_URL;
                    return false;
                }
                if (obj && obj.json_url) {   //添加一个没有反馈的情况下// && obj.tpl_fbstate != 1  去掉有反馈不去读取静态文件
                    var jsonurl = obj.json_url;
                    var url = "";
                    if (dms.isJsonObject(jsonurl)) {
                        jsonurl = JSON.parse(jsonurl);
                        var postfix = jsonurl.postfix || "";
                        url = fileUrlConf + jsonurl.key + postfix + "?" + Date.now();
                    } else {
                        url = fileUrlConf + jsonurl + ".json?" + Date.now();
                    }
                    $.ajax({
                        type: "GET",
                        url: url,
                        dataType: "json",
                        success: function (data) {
                            try {

                                var _dataString = JSON.stringify(data);
                                //防止JS注入，把所有的< >转换成&lt; &gt;
                                _dataString = _dataString.replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
                                var _data = JSON.parse(_dataString);
                                var _objString = JSON.stringify(obj);
                                _objString = _objString.replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
                                var _obj = JSON.parse(_objString);
                                var client;
                                if (/Mac OS x/i.test(navigator.userAgent)) {
                                    client = "ios"
                                }
                                if (/Android/i.test(navigator.userAgent)) {
                                    client = "android"
                                }
                                debugger;
                                if (tplSign == 2) {
                                    //多组作品
                                    _obj.groups = _data.tplData.groups;
                                    tpl = _obj;

                                    if (tpl.adData && tpl.adData.length > 0 && typeof client !== "undefined") {
                                        //加广告
                                        translateTreeDepthTo2(_obj.groups)
                                        var ADsInfo = genADs(tpl.adData, client)
                                        addADsInGroups(tpl.groups, ADsInfo)
                                    }
                                    callback(tpl);
                                } else {
                                    //老单组作品
                                    _obj.page_value = _data.tplData.pages;
                                    tpl = _obj;
                                    if (tpl.adData && tpl.adData.length > 0 && typeof client !== "undefined") {
                                        //加广告
                                        var ADsInfo = genADs(tpl.adData, client)
                                        addADsInPages(tpl.page_value, ADsInfo)

                                    }
                                    callback(tpl);
                                }
                            } catch (e) {
                                location.reload()
                                // console.log("转换json失败：" + e);
                                // callback(null);
                            }
                        },
                        error: function (error) {
                            console.log(error, "load json_url error");
                            //旧的加载方式
                            self.oldLoadWay(obj, tplSign, tid, callback);
                        }
                    });
                } else {
                    if (!obj) {
                        alert("数据缺损，作品不可用");
                        return;
                    } else {
                        console.log("no json_url");
                        //旧的加载方式
                        self.oldLoadWay(obj, tplSign, tid, callback);
                    }
                }
            } else if (result.code === "10005") {
                // alert("该作品已删除");
                LoadingWave.end();
                var appealInfo = {};
                appealInfo.level = 1;       //出错等级 1 表示失效
                appealInfo.detail = "ME提醒你：作品已被删除";
                //TODO 存储本地localstorage
                window.localStorage.tpl_appeal_info = JSON.stringify(appealInfo);
                //跳转到删除页面
                window.location.href = DELETE_URL;
                return false;
            } else {
                alert("网络不好，请重试");
                return false;
            }
        });


    },
    /**
     * 老的加载方式去查询所有页的数据
     * @param obj       //作品数据
     * @param tplSign   //判断是否是期刊作品
     * @param tid       //作品id
     * @param callback  //回调函数
     */
    oldLoadWay: function (obj, tplSign, tid, callback) {
        var tpl = null;
        if (tplSign == 2) {       //ME期刊的查询
            fmacloud.Cloud.run('cld_get_tpl_data_book', { "tplid": tid }, {
                success: function (tpldata) {
                    obj.groups = tpldata.group;
                    tpl = obj;
                    callback(tpl);
                },
                error: function (error) {
                    console.log("页数据查询失败");
                }
            });
        } else {
            dms.model.getTplPagesById(tid, function (data) {
                if (data == null) {
                    alert("网络不好，请重试");
                    return false;
                } else {
                    obj.page_value = data.pages;
                    tpl = obj;
                    callback(tpl);
                }
            }, function (err) {
                console.log("页数据查询失败");
            });
        }
    }
};
/**
    *规范化作品（只有二层）
    * groups，原始树结构
    */
function translateTreeDepthTo2(groups) {
    groups.forEach(function (grp) {
        var pages = []
        grp.pages.forEach(function (page) {
            recursionPage(page, pages)
        })
        grp.pages = pages;
        function recursionPage(page, resultPages) {
            if (page.f_type === 1) {
                resultPages.push(page)
            } else {
                page.pages.forEach(function (subPage) {
                    recursionPage(subPage, resultPages)
                })

            }
        }
    })

}
/**
 * 生成广告
 * ADPoses广告信息数组
 */

function genADs(ADInfos, platform) {

    var platformADInfos = ADInfos.filter(function (ADInfo) {
        //此处返回广告信息,有计划不一定有内容,需要过滤
        return (typeof ADInfo["advertisements"] != "undefined") && (typeof ADInfo["advertisements"][platform] != "undefined")
    })
    var ADs = platformADInfos.map(function (ADInfo) {
        var adObj = {};
        var ADPose = ADInfo["advertising_plan"]
        adObj.ADIndex = ADPose.value;
        adObj.type = ADPose.category;
        var ADURL = ADInfo["advertisements"][platform][0].value;
        var backURL=ADInfo["advertisements"][platform][0].info;

        if (ADPose.category == "new_page") {
            ///添加空白页和广告
            var page = createBlankPageObj("");
            var item_obj = createBlankItemObj();
            item_obj.set("f_name", "背景1");
            item_obj.set("item_opacity", 100);
            item_obj.set("item_left", 0);
            item_obj.set("item_top", 0);
            item_obj.set("item_width", 640);
            item_obj.set("item_height", 1008);

            item_obj.set("item_val", backURL)

            var ad = genADElement(ADURL, ADInfo["advertisements"][platform][0]);
            page.set("item_object", [item_obj, ad])
            var pageObj = page.toJSON();
            var elements = page.get("item_object");
            var elementsObj = [];
            for (var j = 0; j < elements.length; j++) {
                var element = elements[j];
                elementsObj[j] = element.toJSON()
            }
            pageObj.item_object = elementsObj;
            adObj.page = pageObj;
        } else {
            ///添加广告元素
            adObj.el = genADElement(ADURL, ADInfo["advertisements"][platform][0]).toJSON();
        }
        return adObj

        ///生成广告元素
        ///value为广告地址
        ///poseInfo为广告展示定位信息
        function genADElement(value, poseInfo) {
            var ad = initAD(value);
            ad.set("item_left", poseInfo.left);
            ad.set("item_top", poseInfo.top);
            ad.set("item_width", poseInfo.width);
            ad.set("item_height", poseInfo.height);
            return ad;
        }

    })
    return ADs
}
/**
 * 添加广告
 * groups，规范化的作品（只有二层）
 * ADPoses广告信息数组
 */
function addADsInGroups(groups, ADs) {

    var gLen = groups.length;
    var count = 0;
    ///遍历所有页，如果有广告位置对应位置，插入广告
    var allPageLen = 0;
    for (var i = 0; i < gLen; i++) {
        var grp = groups[i];
        allPageLen += grp.pages.length;
    }
    for (var i = 0; i < gLen; i++) {
        var grp = groups[i];
        for (var j = 0; j < grp.pages.length; j++ , count++) {
            var ret = addAD(ADs, grp.pages, j, count, allPageLen);
            if (ret == 1) {
                return;
            } else if (ret == 2) {
                j++
            }

        }
    }


}
function addADsInPages(pages, ADs) {
    var pLen = pages.length;
    var count = 0;
    ///遍历所有页，如果有广告位置对应位置，插入广告
    var allPageLen = pLen;
    for (var j = 0; j < pages.length; j++ , count++) {
        var ret = addAD(ADs, pages, j, count, allPageLen);
        if (ret == 1) {
            return;
        }
        if (ret == 2) {
            j++;
        }
    }
}
/**
 * 对应位置添加广告
 * ADs 广告信息
 * pages，一个组的页
 * index，操作页下标
 * count，原始下标
 * allPageLen 作品总页数
 * 返回说明 0-没有添加广告 1-广告为空 2-添加了单页广告 3-添加了页内广告
 */
function addAD(ADs, pages, index, count, allPageLen) {
    if (ADs.length == 0) {
        return 1;
    }
    pages[index].f_order_num = index;
    for (var ADi = 0; ADi < ADs.length; ADi++) {
        //广告遍历
        var AD = ADs[ADi];
        var target = parseInt(AD.ADIndex);
        var addFlag = true;
        if (target < 0) {
            if ((0 - target) < allPageLen / 2) {
                target = allPageLen + target;
            } else {
                //
                addFlag = false;
            }
        }
        if (addFlag && count == target) {
            if (AD.type == "new_page") {
                //插入有广告元素的页
                pages.splice(index + 1, 0, AD.page);
                AD.page.f_order_num = index + 1
                ADs.splice(ADi, 1);
                return 2
            } else {
                ///添加广告元素
                var eleLen = pages[index].item_object.length;
                AD.el.item_layer = eleLen;
                pages[index].item_object.push(AD.el);
                ADs.splice(ADi, 1);
                return 3
            }
        }
    }
    return 0
}
function createBlankPageObj(pageName) {
    var page_obj = fmaobj.page.create();
    page_obj.set("page_uid", "nouid");
    page_obj.set("page_width", 640);
    page_obj.set("page_height", 1008);
    page_obj.set("page_no", 1);
    page_obj.set("size_type", 2);
    page_obj.set("item_int", 1);
    page_obj.set("move_type", "top");
    page_obj.set("item_object", []);
    page_obj.set("item_filter", "none");
    page_obj.set("line_off", false);
    page_obj.set("color_transp", 0);
    page_obj.set("img_off", false);
    page_obj.set("line_width", 0);
    page_obj.set("img_reshow", false);
    page_obj.set("color_off", false);
    page_obj.set("line_color", "0");
    page_obj.set("item_filter_val", "none");
    page_obj.set("line_radius", "none");
    page_obj.set("color_code", "0");
    page_obj.set("edited", true);
    page_obj.set("page_effect_img", "http://ac-hf3jpeco.clouddn.com/wy7k70ifPffxR0VoCjcctqgAXRGsG4roiQNk1w3c.jpg");

    page_obj.set("f_type", 1);
    // page_obj.set("createdAt", (new Date().toString));
    if (pageName) {
        page_obj.set("f_name", pageName)
    } else {
        page_obj.set("f_name", "页")
    }
    return page_obj;
}
/*
  * version 2.0
  * time 4/6 10:45
  * add : ydq
  * 创建一个白色背景图 avos 对象
  */
function createBlankItemObj() {
    var itemObj = fmaobj.elem.create();
    itemObj.set("item_id", 0);
    itemObj.set("item_val", "http://ac-hf3jpeco.clouddn.com/wy7k70ifPffxR0VoCjcctqgAXRGsG4roiQNk1w3c.jpg");
    itemObj.set("pic_replace", 1);//不可替换
    itemObj.set("item_state", "none");
    itemObj.set("item_width", 2);
    itemObj.set("item_height", 2);
    itemObj.set("item_type", 1);
    itemObj.set("item_top", 0);
    itemObj.set("item_left", -10000);
    itemObj.set("item_opacity", 0);
    itemObj.set("item_layer", 0);
    itemObj.set("item_filter", "none");
    itemObj.set("font_family", "宋体");
    itemObj.set("item_angle", false);
    itemObj.set("font_frame", false);
    itemObj.set("frame_style", 1);
    itemObj.set("mask_color", "0");
    itemObj.set("lock_level", 0);
    itemObj.set("mask_height", 0);
    itemObj.set("item_uuid", "nouuid");
    itemObj.set("item_cntype", 2);
    itemObj.set("mask_width", 0);
    itemObj.set("font_valight", "top");
    itemObj.set("font_halign", "left");
    itemObj.set("frame_color", "#ffffff");
    itemObj.set("item_color", "ffffff");
    itemObj.set("item_mirror", "null");
    itemObj.set("auto_play", false);
    itemObj.set("frame_pixes", 0);
    itemObj.set("use_mask", false);
    itemObj.set("x_scale", 1);
    itemObj.set("rotate_angle", 0);
    itemObj.set("y_scale", 1);
    itemObj.set("restart_play", false);
    itemObj.set("line_height", 0);
    itemObj.set("rotate_pos", "0.0");
    itemObj.set("font_dist", 0);
    itemObj.set("item_filter_val", "none");
    itemObj.set("font_size", "12");
    itemObj.set("item_animation", "none");
    // itemObj.set("createdAt", (new Date().toString));
    itemObj.set("bd_side", "top,right,bottom,left");
    return itemObj;
}

function initAD(url) {
    var el = fmaobj.elem.create();
    el.set("item_type", 48);
    el.set("item_val", url);
    el.set("item_top", 100);
    el.set("item_left", 0);
    el.set("item_width", 640);
    el.set("item_height", 100);
    el.set("item_opacity", 100);
    el.set("item_id", 0);
    el.set("item_display_status", 0);
    return el;
}
