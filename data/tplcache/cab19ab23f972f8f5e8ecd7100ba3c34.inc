[field:imgsrc runphp='yes']
          if(@me!='') {
            @me = '<div class="col-7 project-title mobile-full"><img class="image project-header" src="'.@me.'" id="bigimg"></div>';
          } else {
            global $dsql;
            $row = $dsql->GetOne("SELECT litpic FROM `#@__archives` WHERE id='".$GLOBALS['aid']."'");
            @me = '<div class="col-7 project-title mobile-full"><img class="image project-header" alt="'.$GLOBALS['title'].'" src="'.$row['litpic'].'"></div>';
          }
          [/field:imgsrc]