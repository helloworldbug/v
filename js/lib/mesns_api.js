// 文件名称: mesns_api.js 
// 创 建 人: tony 
// 创建日期: 2015/06/05
// 版本号：V2.0
// 描    述: ME社交接口 

var sns_data = {};
sns_data.data_site = 0;//来源：0-ME App; 1-PC端;2-微信
//YJ111
/*********************************************** 获取当前登录对象  *****************************************************/
/** 
   返回当前登录用户对象,特别要注意接口在 外部使用浏览不需要账户系统的时候不能调用这个方法，需要更加用户id字符串去反查
**/
sns_data.getCurrentUser = function () {
    var currentUser = fmacloud.User.current();
    if (currentUser) {
        return currentUser;
    } else {
        return null;
    }
};

//YJ111
/** 消息中心interface ：app 应用内部 评论，点赞，私信，关注等点击事件操作： 1.发送推送消息（1.5.3版本不做），2.添加一条数据到me_messagetext消息文本,3.添加me_message消息
   msg_recid-消息接受方
   msg_type-消息类型
   msg_obj-消息对象（作品，页，效果图对象）
   mt_content-消息内容json格式
**/
sns_data.msgAdd = function (options, cb_ok, cb_err) {
    var _this = this;
    var currentLUser = this.getCurrentUser();
    var msg_recid = options.msg_recid,
        msg_type = options.msg_type,
        msg_obj = options.msg_obj,
        mt_content = options.mt_content;

    if (!currentLUser || !msg_recid) return;

    var Messagetext = fmacloud.Object.extend("me_messagetext");
    var msgtext = new Messagetext();
    msgtext.set("mt_content", mt_content);
    msgtext.save(null, {
        success: function (tobj) {
            //添加me_message表数据
            var ME_Message = fmacloud.Object.extend("me_message");
            var messageobj = new ME_Message();
            messageobj.set("msg_sendid", currentLUser);
            messageobj.set("msg_recid", msg_recid);
            messageobj.set("msg_textid", tobj);
            messageobj.set("msg_textid_str", tobj.id);
            messageobj.set("msg_type", msg_type);
            messageobj.set("msg_obj", msg_obj);
            messageobj.set("msg_status", 0);
            messageobj.save(null, {
                success: function (obj) {
                    
                    //V2.3app 对点赞评论聊天进行推送
                    var optionsPush = {
                        "uid": msg_recid
                        //"tpl_name": tpl_name,
                        //"push_type": push_type
                    }
                    var goPush = function (options_data) {
                        _this.mePush(options_data, function (obj) {
                            return cb_ok(obj);
                        }, function (error) {
                           return cb_ok("");//如果推送有问题则不影响程序执行
                        });
                    }

                    switch(msg_type)
                    {
                        case 1://点赞
                            optionsPush.push_type = "like";
                            goPush(optionsPush);
                            break;
                        case 2://评论 ，分评论进行评论需要对2方用户进行推送
                            var tpl_name = options.tpl_name || ""; 
                            optionsPush.tpl_name = tpl_name;
                            optionsPush.push_type = "comment";
                            var mt_content_data = JSON.parse(mt_content);
                            if (mt_content_data.old_userId) {//如果存在old_userId则说明是对评论进行的评论，需要作品原作者和那条评论的用户进行消息回复推送
                                var msg_obj_data = JSON.parse(msg_obj);

                                var options_tpl_author = {//作品作者用户推送
                                    "uid": msg_obj_data.tpl_user,
                                    "tpl_name": tpl_name,
                                    "push_type": "comment"
                                }

                                var options_comment_author = {//评论用户推送
                                    "uid": mt_content_data.old_userId,
                                    "tpl_name": tpl_name,
                                    "push_type": "comment"
                                }

                                _this.mePush(options_tpl_author, function (objA) {
                                    _this.mePush(options_comment_author, function (objB) {
                                        return cb_ok(objB)
                                    }, function (error) {
                                       return cb_ok("");//如果推送有问题则不影响程序执行
                                    });
                                }, function (error) {
                                    return cb_ok("");//如果推送有问题则不影响程序执行
                                });
                            } else {
                                goPush(optionsPush);
                            }
                            break;
                        case 4://关注
                            optionsPush.push_type = "followee";
                            goPush(optionsPush);
                            break; 
                    }//聊天在聊天组件里面进行推送
                },
                error: cb_err
            });
        },
        error: function (error) {
            console.log(error);
        }
    });
};

//YJ111
/** 点赞，聊天，回复，评论，关注 出于安全考虑次接口也可以从客户端调用，所以不能处理全发推送，只处理点对点的推送
    uid,接收者用户id（被点赞，评论，关注用户的用户objectId
    tpl_name，作品名字（只用于评论） 
    push_type,推送类型like，comment，followee,chat_reply,chat_start
**/
sns_data.mePush = function (options, cb_ok, cb_err) { 
    var author_name = "";
    var current_uid = "";
    if (this.getCurrentUser()) {
        author_name = this.getCurrentUser().get("user_nick") || "";
        current_uid = this.getCurrentUser().id || "";
        options.author_name = author_name;
    }
    if (options.uid && current_uid == options.uid) {
        return;
    }
    //push_action 用于android手机推送正式服测试服辨别
    if (window.fmawr) {
        options.push_action = window.fmawr;
    } else {
        options.push_action = "999";//如果获取不到保证正式服能够推送
    }
    fmacloud.Cloud.run('me_push', { options: options }, {
        success: cb_ok,
        error: cb_err
    });
}

/**********************************************************  点  赞  ******************************************************/
//YJ111
/** 根据被赞对象id查询赞总数
  like_tplid
**/
sns_data.getSnsLikeCount = function (like_tplid, cb_ok, cb_err) {
    if (!like_tplid) return;
    var query = new fmacloud.Query("me_like");
    query.equalTo("like_tplid", like_tplid);
    query.equalTo("like_state", 0);
    query.count({
        success: cb_ok,
        error: cb_err
    });
};


//YJ111
/** 点赞提交信息
     like_opration, 赞类型 like 点赞，cancerlike 取消赞
     like_type, 0-H5微场景作品，1-众创页点赞，2-评论，3-拓展后续添加 
     like_tplid,点赞对象id
     data_site,来自哪个终端 0-ME App; 1-PC端;2-微信
 **/
sns_data.snsSaveLike = function (options, cb_ok, cb_err) {
    var currentuser = this.getCurrentUser();
    var like_opration = options.like_opration,
        like_type = options.like_type,
        like_tplid = options.like_tplid,
        data_site = options.data_site || 0,
        belong_tpl = options.belong_tpl || "",
        belong_tplpage = options.belong_tplpage || "",
        belong_comment = options.belong_comment || "";

    if (!like_tplid || !currentuser) {
        cb_err("参数错误，或者没有登录！");
        return;
    } 

    var user_id = currentuser.id;

    //操作内容：tplobj 赞like_int属性加1
    var save_like = function () {
        var query = new fmacloud.Query("me_like");
        query.equalTo("like_userid", user_id);
        query.equalTo("like_tplid", like_tplid);
        query.first({
            success: function (likeobj) {
                if (likeobj) {//如果已经存在该数据说明为0状态 
                    if (like_opration == "like") {
                        likeobj.set("like_state", 0);
                        likeobj.save(null, {
                            success: cb_ok,
                            error: cb_err
                        });
                    } else if (like_opration == "cancerlike") {
                        likeobj.set("like_state", 1);
                        likeobj.save(null, {
                            success: cb_ok,
                            error: cb_err
                        });
                    }
                } else {//如果不存在新增
                    var likeobj = fmacloud.Object.extend("me_like");
                    var obj = new likeobj();
                    obj.set("like_userid", user_id);
                    obj.set("like_tplid", like_tplid);
                    obj.set("like_type", like_type);
                    obj.set("like_state", 0);
                    obj.set("like_uid_pointer", currentuser);//user_obj 可优化为先判断是否在currentUser里有缓存，没有就查询表数据库
                    obj.set("data_site", data_site);//0为来自ME app端的点赞数据 
                    obj.set("belong_tpl", belong_tpl);
                    obj.set("belong_tplpage", belong_tplpage)
                    obj.set("belong_comment", belong_comment)
                    obj.save(null, {
                        success: function (obj) {
                            cb_ok(obj);

                        },
                        error: cb_err
                    });
                }
            },
            error: cb_err
        });
    }

    //tplobj赞总计
    var like_tplobj = function () {
        var query = new fmacloud.Query("tplobj");
        query.descending("cratedAt");
        if (like_type == 0) {
            query.equalTo("tpl_id", like_tplid);
        } else if (belong_tpl.length > 0) {
            query.equalTo("tpl_id", belong_tpl);
        }
        query.first({
            success: function (tpl) {
                if (tpl) {
                    var like_int = tpl.get("like_int") || 0;
                    if (like_opration == "like") {
                        tpl.set("like_int", like_int + 1);
                    } else if (like_opration == "cancerlike") {
                        if (like_int > 0) {
                            tpl.set("like_int", like_int - 1);
                        }
                    }
                    tpl.save(null, {
                        success: function (obj) {
                            if (like_type == 1 || belong_tplpage.length > 0) {
                                like_page();
                            } else {
                                save_like();
                            }
                        },
                        error: cb_err
                    });
                } else {
                    save_like();
                }
            },
            error: cb_err
        });
    }

    //page赞总计
    var like_page = function () {
        var query = new fmacloud.Query("page");
        query.descending("cratedAt");
        if (like_type == 1) {
            query.equalTo("objectId", like_tplid);
        } else if (belong_tplpage.length > 0) {
            query.equalTo("objectId", belong_tplpage);
        }
        query.first({
            success: function (pageobj) {
                if (pageobj) {
                    var page_like_int = pageobj.get("page_like_int") || 0;
                    if (like_opration == "like") {
                        pageobj.set("page_like_int", page_like_int + 1);
                    } else if (like_opration == "cancerlike") {
                        if (page_like_int > 0) {
                            pageobj.set("page_like_int", page_like_int - 1);
                        }
                    }
                    pageobj.save(null, {
                        success: function (obj) {
                            if (like_type == 2 || belong_comment.length > 0) {
                                like_comment();
                            } else {
                                save_like();
                            }
                        },
                        error: cb_err
                    });
                } else {
                    save_like();
                }
            },
            error: cb_err
        });
    }

    //comment赞总计
    var like_comment = function () {
        var query = new fmacloud.Query("me_comment");
        query.descending("cratedAt");
        if (like_type == 2) {
            query.equalTo("objectId", like_tplid);
        } else if (belong_comment.length > 0) {
            query.equalTo("objectId", belong_comment);
        }
        query.first({
            success: function (cobj) {
                if (cobj) {
                    var like_int = cobj.get("like_int") || 0;
                    if (like_opration == "like") {
                        cobj.set("like_int", like_int + 1);
                    } else if (like_opration == "cancerlike") {
                        if (like_int > 0) {
                            cobj.set("like_int", like_int - 1);
                        }
                    }
                    cobj.save(null, {
                        success: function (obj) {
                            save_like();
                        },
                        error: cb_err
                    });
                } else {
                    save_like();
                }
            },
            error: cb_err
        });
    }

    if (like_type == 0 || belong_tpl.length > 0) {// tplobj对象在保存数据的时候是存了 like_int 点赞总数的所以这边需要对其做增减
        like_tplobj();

    } else { // 众创页，和评论点赞表数据未冗余点赞总数字段，是根据编号去赞表反查数据获得的总数
        save_like();
    }
};

/**************************************************    评论  ************************************************************/
//YJ111
/** 根据评论对象id查询评论总数 
 comment_id,评论对象id
**/
sns_data.getSnsCommentCountByCid = function (field_name, comment_id, cb_ok, cb_err) {
    //查询用户评论过的所有数据总数，以便进行分页查询，获取所有的点赞数据集。
    var query = new fmacloud.Query("me_comment");
    query.equalTo(field_name, comment_id);
    query.count({
        success: cb_ok,
        error: cb_err
    });
};


//YJ111
/** 评论
    comment_id,评论对象id
    comment_type,0-H5微场景作品，1-众创页评论，2-评论
    comment_uid,评论该H5微场景的用户的uid
    comment_content,评论内容 
    data_site, 来源：0-ME App; 1-PC端;2-微信
    comment_parentid,父评论id（对评论进行评论时,评论信息还存在评论表，当然数据comment_type=2 评论）
**/
sns_data.snsSaveComment = function (options, cb_ok, cb_err) {
    var comment_id = options.comment_id,
        comment_type = options.comment_type,
        comment_uid = options.comment_uid,
        comment_content = options.comment_content,
        data_site = options.data_site || 0,
        belong_comment = options.belong_comment || "",
        belong_tpl = options.belong_tpl || "",
        belong_tplpage = options.belong_tplpage || "";

    if (!comment_uid || !comment_id || !this.getCurrentUser()) {
        cb_err("参数错误，或者没有登录！");
        return;
    } 
    var current_user = this.getCurrentUser();
    if (current_user) {

        var save_commentobj = function () {
            var commentobj = fmacloud.Object.extend("me_comment");
            var obj = new commentobj();
            obj.set("comment_id", comment_id);
            obj.set("comment_type", parseInt(comment_type));
            obj.set("comment_uid", comment_uid);
            obj.set("comment_display", 0);//
            obj.set("comment_content", comment_content);//comment_content为JSON格式数据
            obj.set("data_site", parseInt(data_site));
            obj.set("comment_uid_pointer", current_user);
            if (belong_comment.length != 0) {
                obj.set("belong_comment", belong_comment);
            }
            if (belong_tpl.length != 0) {
                obj.set("belong_tpl", belong_tpl);
            }
            if (belong_tplpage.length != 0) {
                obj.set("belong_tplpage", belong_tplpage);
            }
            obj.save(null, {
                success: cb_ok,//当回调成功后需要给H5微场景作者发送推送通知
                error: cb_err
            });
        }

        //保存tplobj评论计总数
        var save_tplobj = function () {
            var query = new fmacloud.Query("tplobj");
            query.equalTo("tpl_id", belong_tpl);
            query.descending("createdAt");
            query.first({
                success: function (tpl) {
                    if (tpl) {
                        var comment_int = tpl.get("comment_int") || 0;
                        tpl.set("comment_int", comment_int + 1);
                        tpl.save(null, {
                            success: function (cbobj) {
                                if (belong_tplpage.length > 0) {//如果是对页进行评论则页评论数加1 
                                    //去保存页对象的评论总数
                                    save_page();
                                } else {
                                    save_commentobj();
                                }
                            }, error: cb_err
                        });
                    } else {
                        save_commentobj();
                    }
                },
                error: cb_err
            });
        }

        //保存页评论计总数
        var save_page = function () {
            var query = new fmacloud.Query("page");
            query.equalTo("objectId", belong_tplpage);
            query.descending("createdAt");
            query.first({
                success: function (pageobj) {
                    var page_comment_int = pageobj.get("page_comment_int") || 0;
                    pageobj.set("page_comment_int", page_comment_int + 1);
                    pageobj.save(null, {
                        success: function (cbobj) {
                            if (belong_comment.length > 0) {//如果是对页进行评论则页评论数加1 
                                //去保存页对象的评论总数
                                save_comment();
                            } else {
                                save_commentobj();
                            }

                        }, error: cb_err
                    });
                }, error: cb_err
            });
        }

        //保存评论计总数
        var save_comment = function () {
            var query = new fmacloud.Query("me_comment");
            query.equalTo("objectId", belong_comment);
            query.descending("createdAt");
            query.first({
                success: function (commentobj) {
                    var comment_int = commentobj.get("comment_int") || 0;
                    commentobj.set("comment_int", comment_int + 1);
                    commentobj.save(null, {
                        success: function (cbobj) {
                            save_commentobj();
                        },
                        error: cb_err
                    });
                }, error: cb_err
            });
        }

        if (belong_tpl.length > 0) {
            save_tplobj();
        } else {
            save_commentobj();
        }
    }
};

//YJ111
/** 根据对象id（对象可以为tplobj,pages,评论等对象）查询出该对象是否被当前用户点过赞
    user_id,用户id
    tpl_id,作品id 
**/
sns_data.getSnsLike = function (user_id, like_tplid, orderby, isdesc, skip, limit, cb_ok, cb_err) {
    if (!limit || !skip) {
        skip = 0;
        limit = 1000;
    }
    var query = new fmacloud.Query("me_like");
    if (user_id) {
        query.equalTo("like_userid", user_id);
    }
    if (like_tplid) {
        query.equalTo("like_tplid", like_tplid);
    }
    query.equalTo("like_state", 0); //状态. 0-有效赞  1-已取消赞
    //翻页
    if (skip >= 0 && limit > 0) {
        query.limit(limit);
        query.skip(skip);
    }
    //排序
    if (orderby.length > 0) {
        if (isdesc) {
            query.descending(orderby);
        } else {
            query.ascending(orderby);
        };
    }
    query.find({
        success: cb_ok,
        error: cb_err
    });
};

/**************************************************  关注  ************************************************************/

/** 关注某个用户
    userid,用户id
**/
sns_data.meFollow = function (userid, cb_ok, cb_err) {
    if (!userid || !this.getCurrentUser()) {
        cb_err("请先登录!");
        return;
    }
    fmacloud.User.current().follow(userid).then(
        cb_ok,
        cb_err
        );
};
/** 取消关注某个用户
    userid,用户id
**/
sns_data.meUnfollow = function (userid, cb_ok, cb_err) {
    if (!this.getCurrentUser()) {
        cb_err("请先登录!");
        return;
    }
    fmacloud.User.current().unfollow(userid).then(
        cb_ok,
        cb_err
        );
};

//YJ111
/** 阅读计数
 read_pv_area,倍数区间,倍数数组 [2,3, 4, 5]
 param_type,参数类型,tplobj（tplobj对象），tplid（tplid反查）
 param_val, 对象值
 page_int,页数
 **/
sns_data.setTplPv = function (param_type, param_val, page_int, cb_ok, cb_err) {
    page_int = page_int > 0 ? page_int : 1;

    var setPv = function (tplobj) {
        var total_num = 0;
        //算法 页数*（2~5的随机倍数）
        var arr = [3, 4, 5];
        var read_int = tplobj.get("read_int") || 0;
        var lens = arr.length;
        total_num = arr[Math.floor((Math.random()) * lens)] * page_int;
        if (total_num == "NaN" || total_num == NaN) {
            total_num = page_int;
        }
        if (tplobj.get("read_pv")) {
            tplobj.increment('read_pv',total_num);
        } else {
            tplobj.increment('read_pv', read_int + total_num);//兼容加上老数据的read_int计数
        }
        tplobj.increment('read_int',1);//阅读数+1
        tplobj.save(null, {
            success: cb_ok,
            error: cb_err
        });
    }

    if (param_type == "tplobj") {
        //获得老数据read_int
        if (param_val) {
            setPv(param_val);
        } else {
            cb_err("对象为空！");
            return;
        }
    } else if (param_type == "tplid") {
        var queryTpl = new AV.Query("tplobj");
        queryTpl.equalTo("tpl_id", param_val);
        queryTpl.first({
            success: function (obj) {
                if (obj) {
                    setPv(obj);
                } else {
                    cb_err("对象为空！");
                    return;
                }
            },
            error: cb_err
        });
    } else {
        cb_err("参数错误！");
        return;
    }
};

/**
 阅读次数加1 share_int,read_int
 tpl_id, 作品id
 field, 字段名称如 share_int,read_int
 */
sns_data.tplFieldAddNum = function (tpl_id, field, cb_ok, cb_err) {
    var query = new fmacloud.Query("tplobj");
    query.equalTo("tpl_id",tpl_id);
    query.first({
        success: function (tpl) {
            var before_num=tpl.get(field);
            tpl.set(field, parseInt(before_num) + 1);
            tpl.save(null, {
                success: cb_ok,
                error: cb_err
            });
        },
        error: function (error) {
            console.log(error.message);
        }
    });
};

/** 新增反馈数据
 fb_type,类别：0-反馈信息，其他为举报信息：1-appH5微场景，2-众创，3-pcH5微场景，4-页举报，5-评论举报
 fb_objid ,举报对象id
 context，反馈或举报内容（意见描述，意见补充等）
 fb_contact，联系方式
 f_username, 用户昵称
 f_software_version,软件版本
 f_model,手机型号
 f_sys_version,系统版本
 f_networks,网络环境
 f_screenshots,截图,多张截图用，隔开
 **/
sns_data.addFeedback = function (options, cb_ok, cb_err) {
//    if (!this.getCurrentUser()) {
//        cb_err("请先登录!");
//        return;
//    }
    var currentUser = this.getCurrentUser() || null;
    var userId = "";
    if(currentUser){
        userId = currentUser.id;
    }
    var fb_type = options.fb_type || 0;
    var fb_objid = options.fb_objid || "";
    var context = options.context || "";
    var fb_contact = options.fb_contact || "";

    var f_username = options.f_username || "";
    var f_software_version = options.f_software_version || "";
    var f_model = options.f_model || "";
    var f_sys_version = options.f_sys_version || "";
    var f_networks = options.f_networks || "";
    var f_screenshots = options.f_screenshots || "";

    var feedbackobj = fmacloud.Object.extend("feedback_obj");
    var feedback = new feedbackobj();
    feedback.set("fb_objid", fb_objid);
    feedback.set("fb_type", parseInt(fb_type));
    feedback.set("fb_fromuser", userId);
    feedback.set("fb_contact", fb_contact);
    feedback.set("context", context);
    feedback.set("fb_user_pointer", currentUser);

    feedback.set("f_username", f_username);
    feedback.set("f_software_version", f_software_version);
    feedback.set("f_model", f_model);
    feedback.set("f_sys_version", f_sys_version);
    feedback.set("f_networks", f_networks);
    feedback.set("f_screenshots", f_screenshots);

    feedback.save(null, {
        success: cb_ok,
        error: cb_err
    });
};

window.sns_data = sns_data;