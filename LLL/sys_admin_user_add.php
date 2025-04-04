<?php
/**
 * 添加系统管理员
 *
 * @version        $Id: sys_admin_user_add.php 1 16:22 2010年7月20日 $
 * @package        DedeCMS.Administrator
 * @founder        IT柏拉图, https://weibo.com/itprato
 * @author         DedeCMS团队
 * @copyright      Copyright (c) 2004 - 2024, 上海卓卓网络科技有限公司 (DesDev, Inc.)
 * @license        http://help.dedecms.com/usersguide/license.html
 * @link           http://www.dedecms.com
 */
require_once(dirname(__FILE__)."/config.php");
CheckPurview('sys_User');
require_once(DEDEINC."/typelink.class.php");
if(empty($dopost)) $dopost='';
$id = preg_replace("#[^0-9]#", '', $id);

if($dopost=='add')
{
    csrf_check();
    if(preg_match("#[^0-9a-zA-Z_@!\.-]#", $pwd) || preg_match("#[^0-9a-zA-Z_@!\.-]#", $userid))
    {
        ShowMsg('密码或或用户名不合法，<br />请使用[0-9a-zA-Z_@!.-]内的字符！', '-1', 0, 3000);
        exit();
    }
    if($pwd!='' && !preg_match("#^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).*$#", $pwd))
    {
        ShowMsg('密码必须包含1个数字，1个小写字母，1个大写字母！', '-1', 0, 3000);
        exit();
    }
    if($pwd!='' && !preg_match("#^.{8,128}$#", $pwd))
    {
        ShowMsg('密码必须大于8位小于128位！', '-1', 0, 3000);
        exit();
    }
    $safecodeok = substr(md5($cfg_cookie_encode.$randcode), 0, 24);
    if($safecodeok != $safecode)
    {
        ShowMsg('请填写正确的安全验证串！', '-1', 0, 3000);
        exit();
    }
    $row = $dsql->GetOne("SELECT COUNT(*) AS dd FROM `#@__member` WHERE userid LIKE '$userid' ");
    if($row['dd']>0)
    {
        ShowMsg('用户名已存在！','-1');
        exit();
    }
    $mpwd = md5($pwd);
    $pwd = substr(md5($pwd), 5, 20);

    $typeid = join(',', $typeids);
    if($typeid=='0') $typeid = '';
    
    //关连前台会员帐号
    $adminquery = "INSERT INTO `#@__member` (`mtype`,`userid`,`pwd`,`uname`,`sex`,`rank`,`money`,`email`,
                   `scores` ,`matt` ,`face`,`safequestion`,`safeanswer` ,`jointime` ,`joinip` ,`logintime` ,`loginip` )
               VALUES ('个人','$userid','$mpwd','$uname','男','100','0','$email','1000','10','','0','','0','','0',''); ";
    $dsql->ExecuteNoneQuery($adminquery);

    $mid = $dsql->GetLastID();
    if($mid <= 0 )
    {
        die($dsql->GetError().' 数据库出错！');
    }
    
    //后台管理员
    $inquery = "INSERT INTO `#@__admin`(id,usertype,userid,pwd,uname,typeid,tname,email)
                                                    VALUES('$mid','$usertype','$userid','$pwd','$uname','$typeid','$tname','$email'); ";
    $rs = $dsql->ExecuteNoneQuery($inquery);

    $adminquery = "INSERT INTO `#@__member_person` (`mid`,`onlynet`,`sex`,`uname`,`qq`,`msn`,`tel`,`mobile`,`place`,`oldplace`,`birthday`,`star`,
                   `income` , `education` , `height` , `bodytype` , `blood` , `vocation` , `smoke` , `marital` , `house` ,`drink` , `datingtype` , `language` , `nature` , `lovemsg` , `address`,`uptime`)
                VALUES ('$mid', '1', '男', '{$userid}', '', '', '', '', '0', '0','1980-01-01', '1', '0', '0', '160', '0', '0', '0', '0', '0', '0','0', '0', '', '', '', '','0'); ";
    $dsql->ExecuteNoneQuery($adminquery);

    $adminquery = "INSERT INTO `#@__member_tj` (`mid`,`article`,`album`,`archives`,`homecount`,`pagecount`,`feedback`,`friend`,`stow`)
                     VALUES ('$mid','0','0','0','0','0','0','0','0'); ";
    $dsql->ExecuteNoneQuery($adminquery);
    
    $adminquery = "Insert Into `#@__member_space`(`mid` ,`pagesize` ,`matt` ,`spacename` ,`spacelogo` ,`spacestyle`, `sign` ,`spacenews`)
                Values('$mid','10','0','{$uname}的空间','','person','',''); ";
    $dsql->ExecuteNoneQuery($adminquery);

    $row = $dsql->GetOne("SELECT * FROM `#@__admin` WHERE `userid` = '{$userid}'");
    $id = $row['id'];
    
    // 定期更换密码提醒
    $arr_password = array();
    $filename = DEDEDATA.'/password.data.php';
    if (file_exists($filename)) {
        require_once(DEDEDATA . '/password.data.php');
        $arr_password = json_decode($str_password, true);
    }

    $timestamp = time();
    $arr_password[$id] = "{$timestamp}";
    $content = "<?php\r\n\$str_password='".json_encode($arr_password)."';";

    $fp = fopen($filename, 'w') or die("写入文件失败，请检查权限！");
    fwrite($fp, $content);
    fclose($fp);

    ShowMsg('成功增加一个用户！', 'sys_admin_user.php');
    exit();
}
$randcode = mt_rand(10000, 99999);
$safecode = substr(md5($cfg_cookie_encode.$randcode), 0, 24);
$typeOptions = '';
$dsql->SetQuery(" SELECT id,typename FROM `#@__arctype` WHERE reid=0 AND (ispart=0 OR ispart=1) ");
$dsql->Execute('op');
while($row = $dsql->GetObject('op'))
{
    $topc = $row->id;
    $typeOptions .= "<option value='{$row->id}' class='btype'>{$row->typename}</option>\r\n";
    $dsql->SetQuery(" SELECT id,typename FROM `#@__arctype` WHERE reid={$row->id} AND (ispart=0 OR ispart=1) ");
    $dsql->Execute('s');
    while($row = $dsql->GetObject('s'))
    {
        $typeOptions .= "<option value='{$row->id}' class='stype'>—{$row->typename}</option>\r\n";
    }
}
make_hash();
include DedeInclude('templets/sys_admin_user_add.htm');