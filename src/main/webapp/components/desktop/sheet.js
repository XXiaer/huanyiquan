import { navIcon } from "./icons.js";
import { $ } from "../../utils/desktop/dom.js";

var sheetTrigger=null;

function openSheet(html) {
    if(!$('#modal .sheet'))sheetTrigger=document.activeElement;
    $('#modal').innerHTML='<div class="mask" data-act="mask-close"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-heading" tabindex="-1"><div class="sheet-grip"></div><button class="sheet-close icon-action" type="button" data-act="sheet-close" aria-label="关闭">'+navIcon('close')+'</button>'+html+'</div></div>';
    var panel=$('#modal .sheet');
    var heading=panel.querySelector('h1,h2,h3');
    if(heading)heading.id='sheet-heading';
    else{panel.removeAttribute('aria-labelledby');panel.setAttribute('aria-label','操作面板');}
    panel.focus();
}

function closeSheet() {
    if(!$('#modal .sheet'))return;
    $('#modal').innerHTML='';
    if(sheetTrigger?.isConnected)sheetTrigger.focus();
    sheetTrigger=null;
}

export { closeSheet, openSheet };
