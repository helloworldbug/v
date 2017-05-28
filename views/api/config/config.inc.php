<?php

define("host", "http://www.agoodme.com/");

/**
 * 微信第三方登录配置文件
 *
 */
define("WeiXinAppID",		"wxd2714a072abdd918");
//define("WeiXinAppSecret",	"8931787bcb61b7ee8d86c0c96158aece");
define("WeiXinAppSecret",	"6fc7cf32d3b5b292300e92ac79fe7871");
//define("WeiXinAppID",		'wxb85ee1e8978f42b2');
//define("WeiXinAppSecret",	"7faab838473d6d46efffc8c10fbd0d75");


//登录成功后微信回调地址，请保证与应用申请的域名地址保持一致
define("WeiXinRedirectURL",	host . "views/weixin_redirect.php");

//请设置登录成功跳转的地址http://www.agoodme.com/game/wechat/#mz/entrance
//define("LoginResultURL",	host . "views/#wx/login");
define("LoginResultURL",	host);

?>