<?php
header('Content-Type: text/html;charset=utf-8');
header('Access-Control-Allow-Origin:*'); // *代表允许任何网址请求
header('Access-Control-Allow-Methods:POST,GET,OPTIONS,DELETE'); // 允许请求的类型
header('Access-Control-Allow-Credentials: true'); // 设置是否允许发送 cookies
header('Access-Control-Allow-Headers: Content-Type,Content-Length,Accept-Encoding,X-Requested-with, Origin'); // 设置允许自定义请求头的字段
include('api.class.php');//创建实例
$api= new api();
//获取调用的接口
$action=$_REQUEST['action'];
//获取帖子id
if($action=='getpostid'){
	$posturl=$_REQUEST['url'];
	$res=$api->getPostId($posturl);
	ajaxReturn($res);
}
//获取用户头像
if($action=='getavatar'){
	$userid=$_REQUEST['userid'];
	$res=$api->getAvatar($userid);
	showImg($res);
}
//获取关注前十
if($action=='getfriendship'){
    $userid=$_REQUEST['userid'];
	$count=$_REQUEST['count'];
	$res=$api->getFriendship($userid,$count);
	ajaxReturn($res);
}
//获取收藏前十
if($action=='getfavorite'){
    $userid=$_REQUEST['userid'];
	$count=$_REQUEST['count'];
	$res=$api->getFavorite($userid,$count);
	ajaxReturn($res);
}

//其他异常信息
ajaxReturn(array('code'=>500,'msg'=>'请检查接口参数'));
//输出json格式的返回值
function ajaxReturn($array){
    $content=json_encode($array,JSON_UNESCAPED_UNICODE);
    if(empty($_GET['callback'])){
        echo $content;
		exit;
    }else{
        echo $_GET['callback']."(".$content.")";
		exit;
    }
}

//输出图片
function showImg($img){
    $info = getimagesize($img);
    $imgExt = image_type_to_extension($info[2], false);  //获取文件后缀
    $fun = "imagecreatefrom{$imgExt}";
    $imgInfo = $fun($img);                  //1.由文件或 URL 创建一个新图象。如:imagecreatefrompng ( string $filename )
    //$mime = $info['mime'];
    $mime = image_type_to_mime_type(exif_imagetype($img)); //获取图片的 MIME 类型
    header('Content-Type:'.$mime);
    $quality = 100;
    if($imgExt == 'png') $quality = 9;      //输出质量,JPEG格式(0-100),PNG格式(0-9)
    $getImgInfo = "image{$imgExt}";
    $getImgInfo($imgInfo, null, $quality);  //2.将图像输出到浏览器或文件。如: imagepng ( resource $image )
    imagedestroy($imgInfo);
    exit;
}




