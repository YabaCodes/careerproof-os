/** Dialog lifecycle survives shell replacement and the iOS visual viewport. */
export class DialogController {
  private lockedScroll:number|null=null;
  private invoker:{selector:string,index:number}|null=null;
  private viewportFrame=0;
  private revealFrame=0;
  private revealTimer=0;
  private restingViewportHeight=0;

  trackViewport():void {
    const refresh=(event?:Event)=>{
      cancelAnimationFrame(this.viewportFrame);
      this.viewportFrame=requestAnimationFrame(()=>{
        const viewport=window.visualViewport;
        const height=viewport?.height??window.innerHeight;
        const editable=Boolean(document.activeElement?.matches('input:not([type=file]),textarea,select'));
        // iOS standalone PWAs can shrink the layout viewport *as well* as
        // VisualViewport. Keep the last unobstructed height as a second signal.
        if(!editable&&height>0)this.restingViewportHeight=height;
        const unobstructedHeight=Math.max(this.restingViewportHeight,document.documentElement.clientHeight);
        const keyboardOpen=editable&&(viewport?.scale??1)===1&&unobstructedHeight-height>150;
        document.documentElement.style.setProperty('--visual-height',height+'px');
        document.documentElement.style.setProperty('--visual-top',(viewport?.offsetTop??0)+'px');
        document.documentElement.dataset.compactDialog=String(height<500);
        document.documentElement.dataset.keyboardOpen=String(keyboardOpen);
        // Updating the visual-height/footer changes the flex scrollport.
        // Measure the focused field on a *later* frame, not against its old
        // geometry. iOS keyboard animation can send several resize events.
        this.queueReveal(event?.type!=='scroll');
      });
    };
    window.addEventListener('resize',refresh,{passive:true});
    window.visualViewport?.addEventListener('resize',refresh,{passive:true});
    window.visualViewport?.addEventListener('scroll',refresh,{passive:true});
    window.addEventListener('orientationchange',()=>{
      this.restingViewportHeight=0;
      refresh();
    },{passive:true});
    document.addEventListener('focusin',refresh);
    document.addEventListener('focusout',refresh);
    // The browser scrolls the caret inside a textarea; keep the textarea's
    // outer scrollport visible as text accumulates, without scrolling the page.
    document.addEventListener('input',event=>{
      if(event.target instanceof HTMLTextAreaElement&&event.target===document.activeElement)this.queueReveal(false);
    });
    refresh();
  }

  private queueReveal(delayed:boolean):void {
    cancelAnimationFrame(this.revealFrame);
    this.revealFrame=requestAnimationFrame(()=>{
      this.revealFrame=requestAnimationFrame(()=>this.revealFocusedField());
    });
    if(delayed){
      window.clearTimeout(this.revealTimer);
      // Safari may finish animating the keyboard after its last resize event.
      // This is a fallback, not a fixed scroll offset or a polling loop.
      this.revealTimer=window.setTimeout(()=>this.queueReveal(false),180);
    }
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
    const active=document.activeElement;
    if(!(active instanceof HTMLElement)||!active.matches('input:not([type=file]),textarea,select'))return;
    const field=active.closest<HTMLElement>('.field');
    const body=field?.closest<HTMLElement>('.modal-body');
    if(!field||!body)return;

    const fieldRect=field.getBoundingClientRect();
    const bodyRect=body.getBoundingClientRect();
    const bodyStyle=getComputedStyle(body);
    const top=bodyRect.top+Math.min(parseFloat(bodyStyle.paddingTop)||0,12)+4;
    const bottom=bodyRect.bottom-Math.min(parseFloat(bodyStyle.paddingBottom)||0,12)-4;
    const available=bottom-top;
    if(available<40)return;

    let delta=0;
    if(fieldRect.height<=available){
      // If the entire field (label + control) fits, show both.
      if(fieldRect.top<top)delta=fieldRect.top-top;
      else if(fieldRect.bottom>bottom)delta=fieldRect.bottom-bottom;
    }else{
      // In a short keyboard viewport the full Outcome textarea may be taller
      // than the remaining form scrollport. The old Math.min(top,bottom)
      // could yield zero and leave the active control covered. Show the field
      // label and at least the first lines; let the native textarea scroll
      // its own caret as more text is entered.
      const control=active.getBoundingClientRect();
      const visible=Math.max(0,Math.min(control.bottom,bottom)-Math.max(control.top,top));
      const minimumVisible=Math.min(56,Math.max(28,available/2));
      if(visible<minimumVisible){
        delta=fieldRect.top-top;
      }
    }
    if(Math.abs(delta)>1)body.scrollTop+=delta;
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
