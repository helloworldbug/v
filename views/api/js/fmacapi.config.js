var fms_api_file = "fmsapi.interface.php";

var fms_api_host = "undefined";
var fms_api_path = "undefined";
var fms_api_url = "undefined";

var fms_file_store = "../filestore/";
var fms_res_store = "../filestore/res/";
var fms_tpl_store = "../filestore/tpl/";

var fms_res_host = "undefined";
var fms_res_path = "undefined";
var me_logo_path = "undefined";

var me_logo_ok = true;
var fms_debug = true;

var fmalocal_cache = false; //是否开启缓存

var meType = 1; //0:app项目 1:众创项目
var meApp = 0;
var mePublic = 1;
//分享跳转地址
var wxHost = "http://www.agoodme.com/wetpl/";

var qnHostTs = "http://ac-syrskc2g.clouddn.com/";
var qnHost = "http://ac-hf3jpeco.clouddn.com/";
var qnhomeisHost = "http://ac-m1mab2gt.clouddn.com/";

var fma_type_tpl = 0;
var fma_type_works = 1;
var fma_type_sign = 2;
var fma_type_checked = 3;
var fma_type_tpl_and_works = [0,1];

var script_path = "js/common/api/";

var fma_waterpage_size = 15;

function fmacapi_initconfig(fms_server){

    fms_api_host = fms_server;
    fms_api_path = "http://"+fms_api_host+"/fms/";
    fms_api_url = fms_api_path+fms_api_file;

    fms_res_host = fms_server;
    fms_res_path = "http://"+fms_res_host+"/";
    me_logo_path = fms_res_host + "/logo/me_logo.png";

}
var fmawr = "999";

var qiniuImageHost = qnHostTs;
if(fmawr == "999"){
    qiniuImageHost = qnHost;
    wxHost = "http://www.agoodme.com/wetpl/";
}
if(fmawr=="10000"){
    qiniuImageHost = qnhomeisHost;
    wxHost = "http://www.agoodme.com/wetpl/"; 
}
