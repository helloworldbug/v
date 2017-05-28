<?php
include_once './config/config.inc.php';
include_once './function/function.php';
session_start();
session_set_cookie_params(1800, "/", ".agoodme.com");


header('Access-Control-Allow-Origin','*');
header('Access-Control-Allow-Methods', '*');


function FunApi(){
	$Action		= getAction("act");
	$Json		= array("status"=>false,"error"=>"");
	$Help		= array();
	
	
	//==============================================================================================================
	$Help["act=get_weixin_signature"]	= array(
			"exp"=>"获取微信签名对象",
			"get"=>"",
			"post"=>"to_url=需要分享的网页地址，不能包含#符号",
			"postexp"=>"",
			"run"=>array("status"=>"true|false","error"=>"错误代码","data"=>"JSON对象")
	);
	if( $Action=="get_weixin_signature" ){
		
		include_once('./jssdk.php');

		$ToURL = getAction("to_url");
		//if($ToURL == ""){
		//	$Json["error"] = "aaaaa";
		//	return $Json;
		//}
		$jssdk = new JSSDK(WeiXinAppID, WeiXinAppSecret, $ToURL);
		$signPackage = $jssdk->GetSignPackage();

		$Json["status"]		= true;
		$Json["data"] = $signPackage;
		
		return $Json;
	}
	
	
	//==============================================================================================================
	$Help["act=get_weixin_user"]	= array(
			"exp"=>"查询用户基本信息（无需登录）",
			"get"=>"",
			"post"=>"user_ids",
			"postexp"=>"user_ids=用逗号连接的一个或者多个用户序号,用户作品规则：第一，仅显示20个，第二，仅显示设置为公开的，也就是tpl_privacy为public的,排序规则为分享次数+阅读次数排序",
			"run"=>array("status"=>"true|false","error"=>"错误代码","data"=>array("array(用户对象(tpl=>array(tplobject,...)),用户对象,...)"))
	);
	if( $Action=="get_weixin_user" ){
		$routeUrl = getAction("routeUrl");
		if($routeUrl!=""){
			$_SESSION['routeUrl'] = $routeUrl;
		}
		$URL		= GetWeiXinLoginURL(WeiXinAppID, WeiXinRedirectURL);
		header("Location: {$URL}");
		exit();
	}

	return $Json;
}

$Run	= FunApi();
exit( json_encode( $Run ) );
?>