<?php
/**
 * 聚合api
 */
class api {
    public $key="";
	/**
	 * 获取帖子ID
	 * @param {Object} $posturl 帖子链接
	 */
	public function getPostId($posturl){
		//格式验证
		if(empty($posturl)){
			return array('code'=>500,'msg'=>'帖子链接不能为空');
		}
		if(strstr($posturl,'bbs.huluxia.com')==''){
			return array('code'=>500,'msg'=>'帖子链接不正确');
		}
		if(strstr($posturl,'http://')=='' && strstr($posturl,'https://')==''){
			return array('code'=>500,'msg'=>'帖子链接需包含http://或https://');
		}
		$res=file_get_contents($posturl);
		preg_match_all('<input type="hidden" value="(.*?)" id ="postid"/>',$res, $postids);
		$postid = $postids[1][0];
		if(empty($postid)){
			return array('code'=>500,'msg'=>'很抱歉该帖子已经删除');
		}
		return array('code'=>200,'msg'=>$postid);
	}
	/**
	 * 获取用户头像
	 * @param {Object} $posturl 帖子链接
	 */
	public function getAvatar($userid){
		//格式验证
		$url = "http://floor.huluxia.com/user/info/ANDROID/2.1?_key=".$this->key."&user_id=".$userid; //api
        $res = $this->get_url($url);
        $res = json_decode($res, true);
		return $res['avatar'];
	}
	
	/**
	 * 获取关注前十
	 * @param {Object} $userid 用户id
	 */
	public function getFriendship($userid,$count = 10){
		//格式验证
		if(empty($userid)){
			return array('code'=>500,'msg'=>'用户ID不可为空');
		}
		if($count>50){
			return array('code'=>500,'msg'=>'查询数量不能大于50');
		}
		$url = "http://floor.huluxia.com/friendship/following/list/ANDROID/2.0?user_id=".$userid."&count=".$count; //api
        $res = json_decode($this->get_url($url), true);
        if(empty($res)){
			return array('code'=>500,'msg'=>'未知异常');
		}
		if(count($res['friendships'])==0){
		    return array('code'=>500,'msg'=>'关注列表为空或用户ID不存在');
		}
		return array('code'=>200,'msg'=>$res['friendships']);
	}
	
	/**
	 * 获取收藏前十
	 * @param {Object} $userid 用户id
	 */
	public function getFavorite($userid,$count = 10){
		//格式验证
		if(empty($userid)){
			return array('code'=>500,'msg'=>'用户ID不可为空');
		}
		if($count>50){
			return array('code'=>500,'msg'=>'查询数量不能大于50');
		}
		$url = "http://floor.huluxia.com/post/favorite/list/ANDROID/2.0?count=".$count."&user_id=".$userid; //api
	    $res = json_decode($this->get_url($url), true);
	    if(empty($res)){
			return array('code'=>500,'msg'=>'未知异常');
		}
		if(count($res['posts'])==0){
		    return array('code'=>500,'msg'=>'收藏列表为空或用户ID不存在');
		}
		return array('code'=>200,'msg'=>$res['posts']);
	}
	
	/**
	 * 通过URL获取页面信息
	 * @param $url 地址
	 * @return mixed 返回页面信息
	 */
	function get_url($url)
	{
	    $ch = curl_init();
	    curl_setopt($ch, CURLOPT_URL, $url); //设置访问的url地址
	    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
	    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
	    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); //不输出内容
	    $result = curl_exec($ch);
	    curl_close($ch);
	    return $result;
	}
}