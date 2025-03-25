<li class="project col-8 nested mobile-full mob-over"><a class="project-link fixed mobile-flex-column" href="[field:arcurl/]">
                        <div class="project-number col-1 mobile-full">
                            <h3>[field:global.autoindex runphp='yes'] if(@me < 10) { @me = "0".@me; } [/field:global.autoindex]</h3>
                        </div>
                        <div class="col-3 project-thumb-fixed mobile-full">
                            <img class="project-thumb" alt="[field:title/]" src="[field:litpic/]"></div>
                        <div class="col-4 project-title mobile-full">
                            <h6 class="active">[field:pubdate function="MyDate('Y-m-d',@me)"/]</h6>
                            <h2>[field:title function="cutStr(@me,60)"/]</h2>
                            <p>[field:description function="cutStr(@me,120)"/]</p>
                        </div>
                    </a></li>