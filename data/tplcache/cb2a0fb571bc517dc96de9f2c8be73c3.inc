<a href='[field:linkurl/]' class="pic">
					[field:global name=autoindex runphp='yes']
					if(empty($fields['imgsrc'])) {
						@me = "<img src='".$fields['litpic']."' alt='".$fields['alttext']."' />";
					} else {
						@me = "<img src='".$fields['imgsrc']."' alt='".$fields['alttext']."' />";
					}
					[/field:global]
				</a>
				<a href='[field:linkurl/]' class="title">
					[field:title /]
				</a>