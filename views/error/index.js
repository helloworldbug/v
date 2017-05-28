var appealInfo = window.localStorage.getItem("tpl_appeal_info");
var appealLayer = $("#appeal-layer");   //申诉内容层
var infoLayer = $("#info-layer");       //提交信息成功层
var submit = $("#submit-appeal");       //提交按钮
var email = $("#email-input");            //邮箱
var author = $("#author-input");        //用户名
var content = $("#content-input");      //申诉内容
var errObj = $(".error-info");      //错误提示
try{
    if(appealInfo){
        appealInfo = JSON.parse(appealInfo);
        var title = appealInfo.title || "";   //作品标题
        var fmawr = appealInfo.fmawr || "0";
        var tid = appealInfo.tid || "";   //作品ID
        //初始化AV
        if (fmawr == "999") {
            //正式服
            AV.initialize("hf3jpecovudrg8t7phw3xbt1osqfrmfhnwu22xs8jo1ia3hn", "b9nndoind1e7tjrhj7owyg4m55d9uyymcqprklb5w9qxo9rr");  //正式服获取数据
            var fileUrlConf = "http://ac-hf3jpeco.clouddn.com/";    //正式服的jsonurl域名
        } else {
            //测试服
            AV.initialize("syrskc2gecvz24qjemgzqk8me6yenon2layp11tdnskosxg9", "c56r8qz274bct8jlb924v2b05xaysxytfmt2ff0vfgulmks7");  //测试服获取数据
            var fileUrlConf = "http://ac-syrskc2g.clouddn.com/";    //测试服的jsonurl域名
        }
        //预防直接打开链接申诉。
        window.localStorage.removeItem("tpl_appeal_info");
    }
}catch(e){
    console.log(e);
}

$(document).ready(function(){
    submit.on("click", function(e){
        e.stopPropagation();
        e.preventDefault();
        if(!tid){
            alert("非法途径申诉不予理会");
            return;
        }
        submitAppealHandler();
    });
    email.on("focus", resetErrorInfo);
    author.on("focus", resetErrorInfo);
    content.on("focus", resetErrorInfo);
});


/**
 * 检测身份证的输入是否正确
 * @param {object|obj} 身份证输入框的jquery对象
 */
function checkEmpty(obj){
    var val = obj.val();
    var fix = "姓名";
    if(obj[0].tagName === "TEXTAREA"){
        fix = "申诉原因";
    }
    if(val.length === 0){
        errObj.text(fix + "不能为空").show();
        obj.addClass("change-color");
        return false;
    }
    return true;
}
/**
 * 检测邮箱的输入是否正确
 * @param {object|obj} 身份证输入框的jquery对象
 */
function checkEmail(obj){
    //邮箱正则表达式
    var myReg=/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
    var val = obj.val();
    if(val.length === 0){
        errObj.text("邮箱不能为空").show();
        obj.addClass("change-color");
        return false;
    }
    if(!myReg.test(val)){
        errObj.text("邮箱格式不正确").show();
        obj.addClass("change-color");
        return false;
    }
    return true;
}
/**
 * 还原错误信息
 * @param {object|e} 事件对象 
 */
function resetErrorInfo(e){
    e.stopPropagation();
    $(e.target).removeClass("change-color");
    errObj.text("").hide();
}
/**
 * 提交申诉数据
 */
function submitAppealHandler (){
    if( checkEmpty(author) && checkEmail(email) && checkEmpty(content)){
        var authorName = author.val();
        var authorEmail = email.val();
        var appealContent = content.val();
        //TODO 保存数据到数据库
        var currentUser = AV.User.current();
        var userId = currentUser ? currentUser.id : "";
        var AppealObj =  AV.Object.extend("appeal");  //申诉表名
        var appealObj = new AppealObj();
        appealObj.set("tpl_id", tid);        //作品ID
        appealObj.set("tpl_name", title);  //作品名称
        appealObj.set("user_name", authorName);   //申诉人姓名
        appealObj.set("user_id", userId); //申诉来源
        appealObj.set("email", authorEmail);//申诉人email
        appealObj.set("reason", appealContent); //申诉内容
        appealObj.set("source", 2); //申诉来源
        appealObj.save(null, {
            success: function(data) {
                //TODO 需要保存提交的数据到申诉表里面
                infoLayer.show();
                appealLayer.hide();
                console.log("申诉提交信息",data);
            },
            error: function(error) {
                console.log(error);
            }
        });
        //TODO 更新作品信息
        var query = new AV.Query("tplobj");
        query.equalTo("tpl_id", tid);
        query.first({
            success: function (results) {
                //TODO 需要保存作品状态变迁履历表
                var reviewStatus = results.get("review_status");
                var deleteStatus = results.get("tpl_delete");
                var changeStatus = reviewStatus+"-5申诉";
                var RecordObj =  AV.Object.extend("tpl_record");  //履历表名
                var recordObj = new RecordObj();
                recordObj.set("tpl_id", tid);        //作品ID
                recordObj.set("user_name", authorName);   //申诉人姓名
                recordObj.set("user_id", userId); //申诉人ID
                recordObj.set("delete_status", deleteStatus);//删除状态
                recordObj.set("action", 5); //变迁动作
                recordObj.set("tpl_state", changeStatus); //履历变迁状态
                recordObj.save(null, {
                    success: function(data) {
                        console.log("审核状态履历表", data);
                    },
                    error: function(error) {
                        console.log(error);
                    }
                });
                //修改作品的状态
                results.set("review_status", 5);    //改变tpl_state 状态，为申诉状态
                results.increment('appeal_int', 1); //新增tpl字段
                results.save(null, {
                    success: function (msg) {
                        console.log("修改审核状态",msg);
                    }
                });
            },
            error: function (error) {
                console.log(err.message);
            }
        });
    }
}





