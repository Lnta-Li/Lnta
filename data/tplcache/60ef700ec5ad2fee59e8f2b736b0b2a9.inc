@me = !empty(@me) ? '<div class="picbox">
				{dede:field name="imgurls" alt="图片输出区"}
				<li>
					<img src="[field:imgsrc/]" id="bigimg" [field:imgwidth /] alt="[field:alttext /]"
						border="0" />[field:alttext /]
				</li>