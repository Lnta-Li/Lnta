[field:imgsrc runphp='yes']
			if(@me == '') {
				@me = '<a href="[field:linkurl/]" class="pic"><img src="[field:litpic/]" alt="[field:alttext /]" /></a>';
			} else {
				@me = '<a href="[field:linkurl/]" class="pic"><img src="[field:imgsrc/]" alt="[field:alttext /]" /></a>';
			}
			[/field:imgsrc]
			<a href='[field:linkurl/]' class="title">
				[field:title /]
			</a>