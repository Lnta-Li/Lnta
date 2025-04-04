<?php
/**
 * 友情链接编辑
 *
 * @version        $Id: friendlink_edit.php 1 10:59 2010年7月13日 $
 * @package        DedeCMS.Administrator
 * @founder        IT柏拉图, https://weibo.com/itprato
 * @author         DedeCMS团队
 * @copyright      Copyright (c) 2004 - 2024, 上海卓卓网络科技有限公司 (DesDev, Inc.)
 * @license        http://help.dedecms.com/usersguide/license.html
 * @link           http://www.dedecms.com
 */
require_once(dirname(__FILE__)."/config.php");
CheckPurview('plus_友情链接模块');
$ENV_GOBACK_URL = empty($_COOKIE['ENV_GOBACK_URL']) ? 'friendlink_main.php' : $_COOKIE['ENV_GOBACK_URL'];
if(empty($dopost)) $dopost = "";

if(isset($allid))
{
    $aids = explode(',',$allid);
    if(count($aids)==1)
    {
        $id = $aids[0];
        $dopost = "delete";
    }
}
if($dopost=="delete")
{
    $id = preg_replace("#[^0-9]#", "", $id);
    $dsql->ExecuteNoneQuery("DELETE FROM `#@__flink` WHERE id='$id'");
    ShowMsg("成功删除一个链接！",$ENV_GOBACK_URL);
    exit();
}
else if($dopost=="delall")
{
    $aids = explode(',',$aids);
    if(isset($aids) && is_array($aids))
    {
        foreach($aids as $aid)
        {
            $aid = preg_replace("#[^0-9]#", "", $aid);
            $dsql->ExecuteNoneQuery("DELETE FROM `#@__flink` WHERE id='$aid'");
        }
        ShowMsg("成功删除指定链接！",$ENV_GOBACK_URL);
        exit();
    }
    else
    {
        ShowMsg("你没选定任何链接！",$ENV_GOBACK_URL);
        exit();
    }
}
else if($dopost=="saveedit")
{
	require_once DEDEINC.'/request.class.php';
	$request = new Request();
	$request->Init();
    $id = preg_replace("#[^0-9]#", "", $request->Item('id', 0));
	$logo = $request->Item('logo', '');
	$logoimg = $request->Upfile('logoimg', '');
	if(!empty($logoimg))
	{
		$request->MoveUploadFile('logoimg', DEDEROOT.'/uploads/flink/'.$request->GetFileInfo('logoimg', 'name'));
		$logo = $cfg_cmspath.'/uploads/flink/'.$request->GetFileInfo('logoimg', 'name');
	}
	$sortrank = $request->Item('sortrank', 1);
	$url = $request->Item('url', '');
	$webname = $request->Item('webname', '');
	$msg = $request->Item('msg', '');
	$email = $request->Item('email', '');
	$typeid = $request->Item('typeid', 0);
	$ischeck = $request->Item('ischeck', 0);
	
    $query = "UPDATE `#@__flink` SET sortrank='$sortrank',url='$url',webname='$webname',logo='$logo',msg='$msg',
                  email='$email',typeid='$typeid',ischeck='$ischeck' WHERE id='$id' ";
    $dsql->ExecuteNoneQuery($query);
    ShowMsg("成功更改一个链接！",$ENV_GOBACK_URL);
    exit();
}

$id = preg_replace("#[^0-9]#", "", $id);

$myLink = $dsql->GetOne("SELECT #@__flink.*,#@__flinktype.typename FROM #@__flink LEFT JOIN #@__flinktype ON #@__flink.typeid=#@__flinktype.id WHERE #@__flink.id=$id");
include DedeInclude('templets/friendlink_edit.htm');