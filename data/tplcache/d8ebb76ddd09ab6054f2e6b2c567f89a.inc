[field:imgsrc runphp='yes']
          if(@me!='') {
            @me = '<div class="col-7 project-title mobile-full"><img class="image project-header" src="'.@me.'" id="bigimg"></div>';
          } else {
            @me = '<div class="col-7 project-title mobile-full"><img class="image project-header" alt="'.@me.'" src="'.@me.'"></div>';
          }
          [/field:imgsrc]