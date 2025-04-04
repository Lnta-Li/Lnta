<?php
//function GetTags($num,$ltype='new',$InnerText='')
/**
 * TAG调用标签
 *
 * @version        $Id: tag.lib.php 1 9:29 2010年7月6日 $
 * @package        DedeCMS.Taglib
 * @founder        IT柏拉图, https://weibo.com/itprato
 * @author         DedeCMS团队
 * @copyright      Copyright (c) 2004 - 2024, 上海卓卓网络科技有限公司 (DesDev, Inc.)
 * @license        http://help.dedecms.com/usersguide/license.html
 * @link           http://www.dedecms.com
 */
 
/*>>dede>>
<name>TAG调用</name>
<type>全局标记</type>
<for>V55,V56,V57</for>
<description>TAG调用标签</description>
<demo>
{dede:tag sort='new' getall='0'}
<a href='[field:link/]'>[field:tag /]</a>
{/dede:tag}
</demo>
<attributes>
    <iterm>row:调用条数</iterm> 
    <iterm>sort:排序方式 month，rand，week</iterm>
    <iterm>getall:获取类型 0 为当前内容页TAG标记，1为获取全部TAG标记</iterm>
</attributes> 
>>dede>>*/
 
function lib_tag(&$ctag,&$refObj)
{
    global $dsql,$envs,$cfg_cmsurl,$cfg_rewrite;
    //属性处理
    $attlist="row|30,sort|new,getall|0,typeid|0";
    FillAttsDefault($ctag->CAttribute->Items,$attlist);
    extract($ctag->CAttribute->Items, EXTR_SKIP);

    $InnerText = $ctag->GetInnerText();
    if(trim($InnerText)=='') $InnerText = GetSysTemplets('tag_one.htm');
    $revalue = '';

    $ltype = $sort;
    $num = $row;

    $addsql = '';

    if($getall==0 && isset($refObj->Fields['tags']) && !empty($refObj->Fields['aid']))
    {
        $dsql->SetQuery("SELECT tid FROM `#@__taglist` WHERE aid = '{$refObj->Fields['aid']}' ");
        $dsql->Execute();
        $ids = '';
        while($row = $dsql->GetArray())
      {
          $ids .= ( $ids=='' ? $row['tid'] : ','.$row['tid'] );
        }
        if($ids != '')
        {
            $addsql = " WHERE id IN($ids) ";
        }
        if($addsql=='') return '';
    }
    else
    {
        if(!empty($typeid))
        {
            $addsql = " WHERE typeid='$typeid' ";
        }
  }
  
    if($ltype=='rand') $orderby = 'rand() ';
    else if($ltype=='week') $orderby=' weekcc DESC ';
    else if($ltype=='month') $orderby=' monthcc DESC ';
    else if($ltype=='hot') $orderby=' count DESC ';
    else if($ltype=='total') $orderby=' total DESC ';
    else $orderby = 'addtime DESC  ';

    $dsql->SetQuery("SELECT * FROM `#@__tagindex` $addsql ORDER BY $orderby LIMIT 0,$num");
    $dsql->Execute();

    $ctp = new DedeTagParse();
    $ctp->SetNameSpace('field','[',']');
    $ctp->LoadSource($InnerText);
    while($row = $dsql->GetArray())
    {
        $row['keyword'] = $row['tag'];
        $row['tag'] = dede_htmlspecialchars($row['tag']);
        $row['link'] = $cfg_cmsurl."/tags/".urlencode($row['keyword']).".html";
        $row['link_alias'] = $cfg_cmsurl."/tags.php?/alias/".urlencode($row['tag_alias'])."/";
        $row['highlight'] = 0;
        if($row['monthcc']>1000 || $row['weekcc']>300 )
        {
            $row['highlight'] = mt_rand(3,4);
        }
        else if($row['count']>3000)
        {
            $row['highlight'] = mt_rand(5,6);
        }
        else
        {
            $row['highlight'] = mt_rand(1,2);
        }

        // 使用伪静态
        if($cfg_rewrite == 'Y')
        {
            $row['link'] = $cfg_cmsurl."/tags/".urlencode($row['keyword']).".html";
            $row['link_alias'] = $cfg_cmsurl."/tags/".urlencode($row['tag_alias']).".html";
        }

        foreach($ctp->CTags as $tagid=>$ctag)
        {
            if(isset($row[$ctag->GetName()]))
            {
                $ctp->Assign($tagid,$row[$ctag->GetName()]);
            }
        }
        $revalue .= $ctp->GetResult();
    }
    return $revalue;
}