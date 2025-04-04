<?php
/**
 * 文档编辑验证
 * 
 * @version        $Id: archives_check_edit.php 1 13:52 2010年7月9日 $
 * @package        DedeCMS.Member
 * @founder        IT柏拉图, https://weibo.com/itprato
 * @author         DedeCMS团队
 * @copyright      Copyright (c) 2004 - 2024, 上海卓卓网络科技有限公司 (DesDev, Inc.)
 * @license        http://help.dedecms.com/usersguide/license.html
 * @link           http://www.dedecms.com
 */
if(!defined('DEDEMEMBER')) exit('DedeCMS Error: Request Error!');

require_once(DEDEINC."/image.func.php");
require_once(DEDEINC."/oxwindow.class.php");

$flag = '';
$typeid = isset($typeid) && is_numeric($typeid) ? $typeid : 0;
$userip = GetIP();
$svali = GetCkVdValue();
if(preg_match("/3/",$safe_gdopen)){
    if(strtolower($vdcode)!=$svali || $svali=='')
    {
        ResetVdValue();
        ShowMsg('验证码错误！', '-1');
        exit();
    }
}
if($typeid==0)
{
    ShowMsg('请指定文档隶属的栏目！','-1');
    exit();
}
$query = "SELECT tp.ispart,tp.channeltype,tp.issend,ch.issend as cissend,ch.sendrank,ch.arcsta,ch.addtable,ch.fieldset,ch.usertype
         FROM `#@__arctype` tp LEFT JOIN `#@__channeltype` ch ON ch.id=tp.channeltype WHERE tp.id='$typeid' ";
$cInfos = $dsql->GetOne($query);
$addtable = $cInfos['addtable'];

//检测栏目是否有投稿权限
if($cInfos['issend']!=1 || $cInfos['ispart']!=0|| $cInfos['channeltype']!=$channelid || $cInfos['cissend']!=1)
{
    ShowMsg("你所选择的栏目不支持投稿！","-1");
    exit();
}

//文档的默认状态
if($cInfos['arcsta']==0)
{
    $ismake = 0;
    $arcrank = 0;
}
else if($cInfos['arcsta']==1)
{
    $ismake = -1;
    $arcrank = 0;
}
else
{
    $ismake = 0;
    $arcrank = -1;
}

//对保存的内容进行处理
$title = cn_substrR(HtmlReplace($title,1),$cfg_title_maxlen);
$writer =  cn_substrR(HtmlReplace($writer,1),20);
if(empty($description)) $description = '';
$description = cn_substrR(HtmlReplace($description,1),250);
$keywords = cn_substrR(HtmlReplace($tags,1),30);
$mid = $cfg_ml->M_ID;

$midQuery = "SELECT mid FROM `#@__arctiny` WHERE id='$aid'";
$midRow = $dsql->GetOne($midQuery);
if($midRow['mid'] != $mid)
{
    ShowMsg('您暂无权限在这里进行修改文档！','javascript:;');
    exit;
}

$isadmin = ($cfg_ml->fields['matt']==10 ? true : false);
if (empty($oldlitpic))
{
    $oldlitpic = '';
}

//处理上传的缩略图
if($litpic != '')
{
    $litpic = MemberUploads('litpic', $oldlitpic, $mid, 'image', '', $cfg_ddimg_width, $cfg_ddimg_height, false, $isadmin);
    SaveUploadInfo($title, $litpic, 1);
}
else
{
    $litpic =$oldlitpic;
}