<?php
$z[0]=Array("imgsrc","\n          if(@me!='') {\n            @me = '<div class=\"col-7 project-title mobile-full\"><img class=\"image project-header\" src=\"'.@me.'\" id=\"bigimg\"></div>';\n          } else {\n            global \$dsql;\n            \$row = \$dsql->GetOne(\"SELECT litpic FROM `#@__archives` WHERE id='\".\$GLOBALS['aid'].\"'\");\n            @me = '<div class=\"col-7 project-title mobile-full\"><img class=\"image project-header\" alt=\"'.\$GLOBALS['title'].'\" src=\"'.\$row['litpic'].'\"></div>';\n          }\n          ",0,529);
$z[0][4]=array();
$z[0][4]['runphp']="yes";

?>