<?php
/**
 * @version        $Id: story_edit.php 1 9:02 2010年9月25日 $
 * @package        DedeCMS.Module.Book
 * @founder        IT柏拉图, https://weibo.com/itprato
 * @author         DedeCMS团队
 * @copyright      Copyright (c) 2004 - 2024, 上海卓卓网络科技有限公司 (DesDev, Inc.)
 * @license        http://help.dedecms.com/usersguide/license.html
 * @link           http://www.dedecms.com
 */

require_once(dirname(__FILE__). "/config.php");
CheckPurview('story_Edit');
if(!isset($action)) $action = '';


//读取所有栏目
$dsql->SetQuery("SELECT id,classname,pid,rank FROM #@__story_catalog ORDER BY `rank` ASC");
$dsql->Execute();
$ranks = Array();
$btypes = Array();
$stypes = Array();
while($row = $dsql->GetArray())
{
    if($row['pid']==0)
    {
        $btypes[$row['id']] = $row['classname'];
    }
    else
    {
        $stypes[$row['pid']][$row['id']] = $row['classname'];
    }
    $ranks[$row['id']] = $row['rank'];
}
$lastid = $row['id'];
$msg = '';
$books = $dsql->GetOne("SELECT S.*,A.membername FROM #@__arcrank AS A LEFT JOIN #@__story_books AS S ON A.rank=S.arcrank WHERE S.bid='$bookid' ");
require_once(DEDEADMIN. '/templets/story_edit.htm');
?>