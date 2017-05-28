<?php



//��ȡ����
function getAction($str){
	$action = null;
	if(isset($_POST[$str])){
		$action = trim($_POST[$str]);
	}else if(isset($_GET[$str])){
		$action = trim($_GET[$str]);
	}else{
		$action = "";
	}
	return $action;
}



/**
 * ��ȡ΢�ŵ�¼��ַ
 * @return string
 */
function GetWeiXinLoginURL($WeiXinAppID, $redirect_uri){
	$WXAPIST	= 	md5(time()+"abc");
	$URL					= 	"https://open.weixin.qq.com/connect/oauth2/authorize?appid=". $WeiXinAppID .
								"&redirect_uri=" . urlencode($redirect_uri) . "&response_type=code&scope=snsapi_userinfo&state=".$WXAPIST
								."#wechat_redirect";

	return $URL;
}

//��ȡaccessToKen
/**
{
"access_token":"ACCESS_TOKEN",
"expires_in":7200,
"refresh_token":"REFRESH_TOKEN",
"openid":"OPENID",
"scope":"SCOPE",
"unionid": "o6_bmasdasdsad6_2sgVt7hMZOPfL"
}
 */
function GetWeiXinAccessToKen( $Code ){
	$ToCode					= $Code;
	$ToURL					= "https://api.weixin.qq.com/sns/oauth2/access_token?appid=". WeiXinAppID ."&secret=". WeiXinAppSecret ."&code={$ToCode}&grant_type=authorization_code";

	$Run					= false;

	if( function_exists("curl_init") ){
		$cFs					= curl_init();

		curl_setopt($cFs,	CURLOPT_URL,		$ToURL);	//�趨���ʵ�ַ
		curl_setopt($cFs,	CURLOPT_HEADER,		false);		//�ر�ͷ���
		curl_setopt($cFs,	CURLOPT_TIMEOUT,	10);		//��ʱ10��
		curl_setopt($cFs,	CURLOPT_RETURNTRANSFER,	1);		//���ַ�����ʽ���
		curl_setopt($cFs,	CURLOPT_SSL_VERIFYPEER,	false);	//���ַ�����ʽ���

		$cHTML				= curl_exec($cFs);

		if( false!=$cHTML ){
			$Json			= json_decode($cHTML,true);

			if( is_array($Json)&&!empty($Json['access_token'])&&!empty($Json['expires_in'])&&!empty($Json['openid']) ){
				$Run					= $Json;
				$Run["expires_time"]	= time();
			}
		}
	}

	return $Run;
}


/**
 * ���ظ�����Ϣ
 * @param array $ToKen
 * @return Ambigous <boolean, string>
 *
 *
openid		��ͨ�û��ı�ʶ���Ե�ǰ�������ʺ�Ψһ
nickname	��ͨ�û��ǳ�
sex			��ͨ�û��Ա�1Ϊ���ԣ�2ΪŮ��
province	��ͨ�û�����������д��ʡ��
city		��ͨ�û�����������д�ĳ���
country		���ң����й�ΪCN
headimgurl	�û�ͷ�����һ����ֵ����������ͷ���С����0��46��64��96��132��ֵ��ѡ��0����640*640������ͷ�񣩣��û�û��ͷ��ʱ����Ϊ��
privilege	�û���Ȩ��Ϣ��json���飬��΢���ֿ��û�Ϊ��chinaunicom��
unionid		�û�ͳһ��ʶ�����һ��΢�ſ���ƽ̨�ʺ��µ�Ӧ�ã�ͬһ�û���unionid��Ψһ�ġ�
 *
 */
function GetWeiXinUserInfo( array $ToKen ){

	$AccessToKen			= $ToKen['access_token'];
	$OpenID					= $ToKen['openid'];

	if( empty($AccessToKen)||empty($OpenID) ){
		return "empty AccessToKen or OpenID";
	}

	$ToURL					= "https://api.weixin.qq.com/sns/userinfo?access_token={$AccessToKen}&openid={$OpenID}";
	$Run					= false;

	if( function_exists("curl_init") ){
		$cFs				= curl_init();

		curl_setopt($cFs,	CURLOPT_URL,		$ToURL);	//�趨���ʵ�ַ
		curl_setopt($cFs,	CURLOPT_HEADER,		false);		//�ر�ͷ���
		curl_setopt($cFs,	CURLOPT_TIMEOUT,	10);		//��ʱ10��
		curl_setopt($cFs,	CURLOPT_RETURNTRANSFER,	1);		//���ַ�����ʽ���
		curl_setopt($cFs,	CURLOPT_SSL_VERIFYPEER,	false);	//���ַ�����ʽ���

		$cHTML				= curl_exec($cFs);

		if( false!=$cHTML ){
			$Json			= json_decode($cHTML,true);
			if( is_array($Json)&&isset($Json['openid'])&&isset($Json['nickname'])&&isset($Json['sex']) ){
				$Run		= $Json;
			}
		}
	}

	return $Run;
}


?>