let initialized = false;

export function initCollections() {
  if(initialized)return;
  initialized=true;
  function updateIndicator(button:HTMLElement|null) {
    const nav=button?.closest('[data-tools-tab-nav]');
    const indicator=nav?.querySelector<HTMLElement>('[data-tools-tab-indicator]');
    if(!button||!indicator)return;
    Object.assign(indicator.style,{left:`${button.offsetLeft}px`,top:`${button.offsetTop}px`,width:`${button.offsetWidth}px`,height:`${button.offsetHeight}px`,opacity:'1'});
  }
  function activateTab(name:string) {
    const buttons=[...document.querySelectorAll<HTMLButtonElement>('[data-tools-tab]')];
    const target=buttons.find(button=>button.dataset.toolsTab===name);
    if(!target)return;
    buttons.forEach(button=>{
      const active=button===target;
      button.classList.toggle('tools-tab-btn-active',active);
      button.classList.toggle('tools-tab-btn-inactive',!active);
      button.disabled=active;
    });
    document.querySelectorAll<HTMLElement>('[data-tools-section]').forEach(section=>section.classList.toggle('hidden',section.dataset.toolsSection!==name));
    requestAnimationFrame(()=>updateIndicator(target));
    const hash=`#tools-${encodeURIComponent(name)}`;
    if(location.hash!==hash)history.replaceState(history.state,'',hash);
  }
  function scrollToGroup(fold:HTMLDetailsElement) {
    const group=fold.closest<HTMLElement>('.tools-category-group')||fold.closest<HTMLElement>('[data-tools-group]');
    if(!group)return;
    const top=group.getBoundingClientRect().top;
    if(top<96)window.scrollTo({top:Math.max(0,scrollY+top-104),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  function setExpanded(fold:HTMLDetailsElement,expanded:boolean) {
    document.querySelectorAll<HTMLDetailsElement>('[data-tools-fold]').forEach(other=>{
      if(other.dataset.toolsFold===fold.dataset.toolsFold)other.open=expanded;
    });
    if(!expanded)scrollToGroup(fold);
  }
  document.addEventListener('click',event=>{
    const element=event.target instanceof Element?event.target:null;
    const collapse=element?.closest('[data-tools-collapse]');
    if(collapse){
      const fold=collapse.closest<HTMLDetailsElement>('[data-tools-fold]');
      if(fold){fold.querySelector<HTMLElement>('summary')?.focus({preventScroll:true});setExpanded(fold,false);}
      return;
    }
    const summary=element?.closest('[data-tools-fold-toggle]');
    if(summary){
      const fold=summary.closest<HTMLDetailsElement>('[data-tools-fold]');
      if(fold){event.preventDefault();setExpanded(fold,!fold.open);}
      return;
    }
    const tab=element?.closest<HTMLElement>('[data-tools-tab]');
    if(tab?.dataset.toolsTab)activateTab(tab.dataset.toolsTab);
  });
  // Native details remains usable without JS. With JS, both views change atomically
  // from user intent rather than bouncing asynchronous toggle events between copies.
  function init() {
    document.querySelectorAll<HTMLButtonElement>('[data-tools-collapse]').forEach(button=>{button.hidden=false;});
    let name='all';
    if(location.hash.startsWith('#tools-')){try{name=decodeURIComponent(location.hash.slice(7));}catch{ /* Fall back to the full index. */ }}
    activateTab(name);
  }
  window.addEventListener('hashchange',init);
  window.addEventListener('resize',()=>updateIndicator(document.querySelector('.tools-tab-btn-active')));
  document.addEventListener('astro:page-load',init);
  let bound=false;
  const bind=()=>{if(bound||!window.swup?.hooks)return;bound=true;window.swup.hooks.on('page:view',init);};
  document.addEventListener('swup:enable',bind);
  bind();init();
}
