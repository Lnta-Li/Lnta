<a href='[field:linkurl/]' class="pic">
					[field:global runphp='yes']
					$imgsrc = empty(@me['imgsrc']) ? @me['litpic'] : @me['imgsrc'];
					@me = "<img src='{$imgsrc}' alt='{$fields['alttext']}' />";
					[/field:global]
				</a>
				<a href='[field:linkurl/]' class="title">
					[field:title /]
				</a>