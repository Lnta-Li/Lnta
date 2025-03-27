[field:imgsrc runphp='yes']
            if(@me) {
                @me = '<img class="image project-header" alt="[field:alttext /]" src="[field:imgsrc/]" />';
            } else {
                @me = '<img class="image project-header" alt="[field:title /]" src="[field:litpic/]" />';
            }
            [/field:imgsrc]
          </div>
          <h1 class="col-7 project-title mobile-full"><strong>{dede:field.title