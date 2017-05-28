<?php
session_start();
session_set_cookie_params(1800, "/", ".agoodme.com");

require_once './api/config/config.inc.php';
require_once './api/function/function.php';
$RefCode		= getAction('code');
$RefState		= getAction('state');
$url = LoginResultURL;
if(isset($_SESSION['routeUrl'])){
	$routeUrl = $_SESSION['routeUrl'];
}else{
	$routeUrl = "";
}
//获取ACCESS_TOKEN 访问令牌
$AccessToKen					= GetWeiXinAccessToKen( $RefCode );
if( $AccessToKen==false ){
	//header("Location: {$url}");
	echo "获取ACCESS_TOKEN 访问令牌 失败";
	exit();
}

//获取用户信息
$UserInfo						= GetWeiXinUserInfo( $AccessToKen );
if( false==$UserInfo ){
	//header("Location: {$url}");
	echo "获取用户信息 失败";
	exit();
}
$url = $url . $routeUrl;
?>

<!doctype html>
<html lang="zh">
<head>
    <meta charset="utf-8">

    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Expires" content="0" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	<meta http-equiv="pragma" CONTENT="no-cache">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />

    <meta name="viewport" content="width=640, initial-scale=0.5, minimum-scale=0.5, maximum-scale=0.5, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <meta name="renderer" content="webkit">
    <meta name="format-detection" content="telephone=no" />
    <title>登录中...</title>

	<script src="api/js/jquery-2.1.4.min.js"></script>
	<script src="api/js/fmacapi.config.js?r=<?php echo rand(0, 999999);?>"></script>
    <script src="api/js/fmacapi.interface.min.js?r=<?php echo rand(0, 999999);?>"></script>
	<script src="api/js/wxLogin_api.js"></script>

</head>
<body>
	<script > //PHP变量能赋值给JS编程运算
	$(document).ready(function() {
		var url=<?php echo "'" . $url . "'" ?>; //php值赋值给js变量 mun
		var wxUser = {};
		wxUser["unionid"] = <?php echo "'" . $UserInfo["unionid"] . "'" ?>;
		wxUser["nickname"] = <?php echo "'" . $UserInfo["nickname"] . "'" ?>;
		wxUser["headimgurl"] = <?php echo "'" . $UserInfo["headimgurl"] . "'" ?>;
		wxUser["sex"] = <?php echo "'" . $UserInfo["sex"] . "'" ?>;
		wxUser["sex"] = parseInt(wxUser["sex"]);

		var wxData = {};
		wxData["access_token"] = <?php echo "'" . $AccessToKen["access_token"] . "'" ?>;
		wxData["expires_in"] = <?php echo "'" . $AccessToKen["expires_in"] . "'" ?>;
		wxPhpLogin(wxUser, wxData, function(){
			location.href = url;
		});
	});

</script>

</body>
</html>

