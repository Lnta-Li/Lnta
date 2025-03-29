{dede:if condition='[field:imgsrc/] ne ""'}
          <div class="col-7 project-title mobile-full">
            <img class="image project-header" src='[field:imgsrc/]' id='bigimg'>
          </div>
          {dede:else/}
          <div class="col-7 project-title mobile-full">
            <img class="image project-header" src="{dede:field.imgsrc/}">
          </div>
          {/dede:if}