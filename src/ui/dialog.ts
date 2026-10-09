/** Dialog lifecycle survives shell replacement and the iOS visual viewport. */
export class DialogController {
  private lockedScroll:number|null=null;
  private invoker:{selector:string,index:number}|null=null;
  private viewportFrame=0;

  trackViewport():void {
    const refresh=(event?:Event)=>{
      cancelAnimationFrame(this.viewportFrame);
      this.viewportFrame=requestAnimationFrame(()=>{
        const viewport=window.visualViewport;
        const height=viewport?.height??window.innerHeight;
        document.documentElement.style.setProperty('--visual-height',height+'px');
        document.documentElement.style.setProperty('--visual-top',(viewport?.offsetTop??0)+'px');
        document.documentElement.dataset.compactDialog=String(height<500);
        const editable=document.activeElement?.matches('input:not([type=file]),textarea,select');
        // Browser toolbars and pinch zoom are not a software keyboard. The
        // threshold is deliberately larger than ordinary browser chrome.
        document.documentElement.dataset.keyboardOpen=String(Boolean(editable&&(viewport?.scale??1)===1&&document.documentElement.clientHeight-height>150));
        if(event?.type!=='scroll')this.revealFocusedField();
      });
    };
    window.addEventListener('resize',refresh,{passive:true});
    window.visualViewport?.addEventListener('resize',refresh,{passive:true});
    window.visualViewport?.addEventListener('scroll',refresh,{passive:true});
    document.addEventListener('focusin',refresh);
    document.addEventListener('focusout',refresh);
    refresh();
  }

  rememberInvoker():void {
    const node=document.activeElement;
    if(!(node instanceof HTMLElement)||!node.dataset.action){this.invoker=null;return;}
    const region=node.closest('.mobile-nav')?'.mobile-nav':node.closest('.side-links')?'.side-links':node.closest('.topbar')?'.topbar':node.closest('#main-content')?'#main-content':'.sidebar';
    let selector=region+' [data-action="'+CSS.escape(node.dataset.action)+'"]';
    for(const key of ['id','screen'] as const)if(node.dataset[key])selector+='[data-'+key+'="'+CSS.escape(node.dataset[key]!)+'"]';
    const matches=this.visibleMatches(selector);
    this.invoker={selector,index:Math.max(0,matches.indexOf(node))};
  }

  update(open:boolean):void {
    for(const region of document.querySelectorAll<HTMLElement>('.sidebar,.content-wrap,.mobile-nav'))region.inert=open;
    if(open&&this.lockedScroll===null){
      this.lockedScroll=window.scrollY;
      document.body.style.setProperty('--page-scroll-lock',-this.lockedScroll+'px');
      document.body.classList.add('dialog-open');
    }else if(!open&&this.lockedScroll!==null){
      const scroll=this.lockedScroll;
      this.lockedScroll=null;
      document.body.classList.remove('dialog-open');
      document.body.style.removeProperty('--page-scroll-lock');
      window.scrollTo(0,scroll);
    }
  }

  focusFirst():void {
    requestAnimationFrame(()=>{
      // Phone autofocus can open the keyboard and pan past the first label even
      // with preventScroll. Start at the named dialog; typing is a deliberate tap.
      const node=window.matchMedia('(max-width:767px)').matches?document.querySelector<HTMLElement>('.modal'):
        document.querySelector<HTMLElement>('.modal input:not([type=file]),.modal textarea,.modal select')??document.querySelector<HTMLElement>('.modal button,.modal');
      node?.focus({preventScroll:true});
    });
  }

  private revealFocusedField():void {
    const field=document.activeElement?.closest<HTMLElement>('.field');
    const body=field?.closest<HTMLElement>('.modal-body');
    if(!field||!body)return;
    const context=field.getBoundingClientRect(),viewport=body.getBoundingClientRect();
    const top=context.top-viewport.top-8;
    const bottom=context.bottom-viewport.bottom+8;
    // Scroll this body only, keeping its label with the control. Oversized
    // textareas start at the label; manual scrolling/caret movement remain native.
    if(top<0)body.scrollTop+=top;
    else if(bottom>0)body.scrollTop+=Math.min(top,bottom);
  }

  restoreFocus():void {
    const matches=this.invoker?this.visibleMatches(this.invoker.selector):[];
    const node=matches[this.invoker?.index??0]??matches[0]??document.querySelector<HTMLElement>('#main-content h1');
    if(node){if(node.tagName==='H1')node.tabIndex=-1;node.focus({preventScroll:true});}
    this.invoker=null;
  }

  private visibleMatches(selector:string):HTMLElement[] {
    return [...document.querySelectorAll<HTMLElement>(selector)].filter(node=>node.getClientRects().length>0);
  }
}
