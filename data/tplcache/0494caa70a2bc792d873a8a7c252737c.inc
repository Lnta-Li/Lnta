[field:imgsrc runphp='yes'][/field:imgsrc]
            if(@me) != '' {
                @me = '<div class="image-container"><img class="image project-header" alt="[field:alttext /]" src="[field:imgsrc/]" /></div>';
            } else {
                @me = '<div class="image-container">';
                @me .= '<img class="image project-header" alt="[field:title /]" src="[field:litpic/]" />';
                @me .= '</div>';
            }