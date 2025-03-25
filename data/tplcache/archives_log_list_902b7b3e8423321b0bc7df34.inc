<?php
if(!isset($GLOBALS['_vars'])) $GLOBALS['_vars'] = array(); 
$fields = array();
?><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=<?php echo $cfg_soft_lang; ?>">
<title>文档日志管理</title>
<link href="css/base.css" rel="stylesheet" type="text/css">
</head>
<body background='images/allbg.gif' leftmargin='8' topmargin='8'>
<table width="98%" border="0" cellpadding="2" cellspacing="1" bgcolor="#D6D6D6" align="center">
  <tr> 
    <td height="28" colspan="7" background='images/tbg.gif'>
    	<table width="96%" border="0" cellpadding="0" cellspacing="0">
        <tr> 
          <td width="20%" height="18" style="padding-left:10px;"><strong>文档日志管理：</strong></td>
          <td width="80%" align="right">
            <b>
              <a href="archives_log_export.php">
                <u>文档日志导出</u>
              </a>
            </b>
          </td>
        </tr>
      </table></td>
  </tr>
  <tr align="center" bgcolor="#FBFCE2"> 
    <td width="20%">文章ID</td>
    <td width="80%">文章标题</td>
  </tr>
  <form name="form1">
    <?php
$atts = array();
$atts['tagname'] = 'datalist';
$blockValue = $this->refObj->GetArcList($atts,$this->refObj,$fields); 
if(is_array($blockValue)){
foreach( $blockValue as $key=>$fields )
{
?>
      <tr align="center" bgcolor="#FFFFFF" height="26" align="center" onMouseMove="javascript:this.bgColor='#FCFDEE';" onMouseOut="javascript:this.bgColor='#FFFFFF';"> 
        <td>
          <?php echo $fields['archives_id']; ?>
        </td>
        <td>
          <a href='archives_log_detail.php?archives_id=<?php echo $fields['archives_id']; ?>'>
            <u><?php echo $fields['title']; ?></u>
          </a>
        </td>
      </tr>
    <?php
}
}?>
  </form>
  <tr bgcolor="#F9FCEF"> 
    <td height="24" colspan="7" align="center"> 
      <?php
$atts = array();
$atts['tagname'] = 'pagelist';
$atts['listsize'] = '5';
 echo $this->refObj->GetPageList($atts,$this->refObj,$fields); 
?>

    </td>
  </tr>
</table>
</body>
</html>