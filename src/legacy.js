import { marked } from 'marked';
import DOMPurify from 'dompurify';

const qs=(s,c=document)=>c.querySelector(s);const qsa=(s,c=document)=>[...c.querySelectorAll(s)];
const header=qs('.site-header');window.addEventListener('scroll',()=>header.classList.toggle('scrolled',scrollY>30));
const menuBtn=qs('.menu-toggle'),mobileMenu=qs('.mobile-menu');menuBtn.addEventListener('click',()=>{const open=mobileMenu.classList.toggle('open');mobileMenu.setAttribute('aria-hidden',String(!open));menuBtn.setAttribute('aria-expanded',String(open));});qsa('.mobile-menu a').forEach(a=>a.addEventListener('click',()=>{mobileMenu.classList.remove('open');mobileMenu.setAttribute('aria-hidden','true');menuBtn.setAttribute('aria-expanded','false')}));
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.14});qsa('.reveal').forEach(el=>observer.observe(el));
const glow=qs('.cursor-glow');window.addEventListener('pointermove',e=>{glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px'});
const contactModal=qs('#contactModal'),demoModal=qs('#demoModal'),eventModal=qs('#eventModal');qsa('.contact-trigger').forEach(b=>b.addEventListener('click',()=>contactModal.showModal()));qsa('.demo-trigger').forEach(b=>b.addEventListener('click',()=>demoModal.showModal()));qsa('.register-trigger').forEach(b=>b.addEventListener('click',()=>{qs('#eventTitle').textContent=b.dataset.event;const description=qs('#eventDescription');if(description)description.textContent=b.dataset.description||'Get session details and reserve your seat.';eventModal.showModal()}));qsa('.modal-close').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));qsa('dialog').forEach(d=>d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}));
function validateVisibleForm(form){
  let valid=true;
  let firstInvalid=null;
  qsa('input,textarea',form).forEach(field=>{
    field.classList.remove('field-error');
    field.removeAttribute('aria-invalid');
    const value=field.value.trim();
    const invalidRequired=field.required&&!value;
    const invalidEmail=field.type==='email'&&value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if(invalidRequired||invalidEmail){
      valid=false;
      firstInvalid??=field;
      field.classList.add('field-error');
      field.setAttribute('aria-invalid','true');
    }
  });
  firstInvalid?.focus();
  return valid;
}
function handleForm(id){
  const form=qs(id);
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(!validateVisibleForm(form))return;
    const success=qs('.form-success',form);
    success.hidden=false;
    qsa('input,textarea,button[type="submit"]',form).forEach(control=>control.disabled=true);
    setTimeout(()=>{
      form.closest('dialog').close();
      form.reset();
      success.hidden=true;
      qsa('input,textarea,button[type="submit"]',form).forEach(control=>control.disabled=false);
    },1800);
  });
}
handleForm('#contactForm');
handleForm('#eventForm');
const canvas=qs('#terrain'),ctx=canvas.getContext('2d');let t=0;function resizeCanvas(){const dpr=Math.min(devicePixelRatio||1,2),r=canvas.getBoundingClientRect();canvas.width=Math.floor(r.width*dpr);canvas.height=Math.floor(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}window.addEventListener('resize',resizeCanvas);resizeCanvas();
function noise(x,y,z){return Math.sin(x*.018+z)*28+Math.cos(y*.025-z*.6)*20+Math.sin((x+y)*.013+z*.4)*15}
function drawTerrain(){const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);const grad=ctx.createLinearGradient(0,0,0,h);grad.addColorStop(0,'rgba(255,255,255,.05)');grad.addColorStop(1,'rgba(255,255,255,.01)');ctx.strokeStyle='rgba(210,216,211,.24)';ctx.lineWidth=.7;for(let row=0;row<48;row++){ctx.beginPath();for(let col=0;col<70;col++){const x=(col/69)*w;const depth=row/47;const base=h*.22+depth*h*.74;const amp=(1-depth)*.65+depth*.15;const y=base-noise(x,row*20,t)*amp-Math.exp(-Math.pow((x-w*.5)/(w*.17),2))*h*.35*(1-depth*.35);if(col===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke()}ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);t+=.008;requestAnimationFrame(drawTerrain)}drawTerrain();

// Secure AI chat demo. Requests are sent only to the local server proxy.
// Secure AI chat demo. Requests are sent only to the same-origin server/proxy.
const chatForm=qs('#chatForm');
const chatInput=qs('#chatInput');
const chatLog=qs('#chatLog');
const aiStatus=qs('#aiStatus');
const apiDiagnostic=qs('#apiDiagnostic');
const chatHistory=[];

function setAIStatus(text,state=''){
  aiStatus.textContent='';
  const dot=document.createElement('span');
  aiStatus.append(dot,document.createTextNode(text));
  aiStatus.className=`ai-status ${state}`.trim();
}

function showDiagnostic(message=''){
  if(!apiDiagnostic)return;
  apiDiagnostic.hidden=!message;
  apiDiagnostic.textContent=message;
}

function renderMarkdown(markdown=''){
  marked.setOptions({breaks:true,gfm:true});
  return DOMPurify.sanitize(marked.parse(String(markdown||'')));
}

function appendThinkingBlock(item,thinking){
  if(!thinking)return;
  const details=document.createElement('details');
  details.className='thinking-block';
  const summary=document.createElement('summary');
  const seconds=Number(thinking.seconds)||1;
  summary.innerHTML=`<span class="thinking-spinner"></span><span><b>Thinking for ${seconds} second${seconds===1?'':'s'}</b><small>Tap to read process summary</small></span>`;
  const body=document.createElement('p');
  body.textContent=thinking.summary||'Astra analyzed the request and prepared the answer.';
  details.append(summary,body);
  item.append(details);
}

function appendChat(role,content,loading=false,thinking=null){
  const item=document.createElement('div');
  item.className=`chat-message ${role}${loading?' loading':''}`;
  const label=document.createElement('strong');
  label.textContent=role==='user'?'You':'Astra';
  const text=document.createElement('div');
  text.className='markdown-body';
  if(role==='assistant'&&!loading){
    text.innerHTML=renderMarkdown(content);
  }else{
    text.textContent=content;
  }
  item.append(label);
  appendThinkingBlock(item,thinking);
  item.append(text);
  chatLog.append(item);
  requestAnimationFrame(()=>{chatLog.scrollTop=chatLog.scrollHeight});
  return item;
}

function cleanAssistantContent(content=''){
  let text=String(content);
  if(text.includes('</think>'))text=text.split('</think>').pop();
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi,'')
    .replace(/<think>[\s\S]*$/gi,'')
    .replace(/<\/think>/gi,'')
    .replace(/<\/?SPECIAL_\d+>/gi,'')
    .trim();
}

async function readJsonSafely(response){
  const type=response.headers.get('content-type')||'';
  if(!type.includes('application/json'))return {};
  return response.json().catch(()=>({}));
}

async function checkAI(){
  showDiagnostic('');
  setAIStatus(' Checking gateway…');
  try{
    const response=await fetch('/api/agentic-health',{headers:{Accept:'application/json'},cache:'no-store'});
    const data=await readJsonSafely(response);
    if(!response.ok)throw new Error(data.error||`Health check failed (${response.status})`);
    if(data.configured){
      setAIStatus(' Gateway ready','ready');
    }else{
      setAIStatus(' Gateway needs an API key','error');
      showDiagnostic('Add LITELLM_API_KEY, LITELLM_API_BASE, and LITELLM_MODEL to the server environment, then restart the app.');
    }
  }catch(error){
    setAIStatus(' Local API unavailable','error');
    showDiagnostic('The web UI is running, but the local API is unavailable. Start both services with “npm run dev” from the project root. The Vite port may change automatically when its preferred port is occupied.');
  }
}

qsa('.demo-trigger').forEach(button=>button.addEventListener('click',()=>{
  checkAI();
  setTimeout(()=>chatInput?.focus(),80);
}));

chatInput?.addEventListener('keydown',event=>{
  if(event.key==='Enter'&&!event.shiftKey){
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

chatForm?.addEventListener('submit',async event=>{
  event.preventDefault();
  const content=chatInput.value.trim();
  if(!content)return;

  showDiagnostic('');
  appendChat('user',content);
  chatHistory.push({role:'user',content});
  chatInput.value='';
  chatInput.disabled=true;
  const submit=qs('button[type="submit"]',chatForm);
  submit.disabled=true;
  setAIStatus(' Astra is thinking…');
  const pending=appendChat('assistant','Thinking',true);

  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),50000);

  try{
    const response=await fetch('/api/agentic-chat',{
      method:'POST',
      headers:{'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify({messages:chatHistory}),
      signal:controller.signal
    });
    const data=await readJsonSafely(response);
    if(!response.ok){
      if(response.status===404)throw new Error('Chat API not found. Use “npm run dev” or “npm start”; do not open index.html directly.');
      throw new Error(data.error||`Request failed (${response.status})`);
    }
    const assistantContent=cleanAssistantContent(data.content);
    if(!assistantContent)throw new Error('The gateway returned an empty response.');
    pending.remove();
    appendChat('assistant',assistantContent,false,data.thinking);
    chatHistory.push({role:'assistant',content:assistantContent});
    setAIStatus(' Gateway ready','ready');
  }catch(error){
    pending.remove();
    const aborted=error?.name==='AbortError';
    const message=aborted?'The request timed out after 50 seconds.':(error.message||'The AI service is unavailable.');
    appendChat('assistant',message);
    setAIStatus(' Gateway request failed','error');
    showDiagnostic(message);
  }finally{
    clearTimeout(timeout);
    chatInput.disabled=false;
    submit.disabled=false;
    chatInput.focus();
  }
});

qsa('.quick-prompts button').forEach(button=>button.addEventListener('click',()=>{
  if(!chatInput)return;
  chatInput.value=button.dataset.prompt||'';
  chatInput.focus();
}));

// Optional ambience; playback always requires an explicit user gesture.
const ambientAudio=qs('#ambientAudio');
const audioToggle=qs('#audioToggle');
if(ambientAudio&&audioToggle){
  ambientAudio.volume=.22;
  ambientAudio.load();
  const syncAudio=playing=>{
    audioToggle.classList.toggle('playing',playing);
    audioToggle.setAttribute('aria-pressed',String(playing));
    audioToggle.setAttribute('aria-label',playing?'Pause galactic ambience':'Play galactic ambience');
    audioToggle.title=playing?'Pause ambience':'Play ambience';
  };
  audioToggle.addEventListener('click',async()=>{
    try{
      if(ambientAudio.paused)await ambientAudio.play();
      else ambientAudio.pause();
    }catch(error){
      syncAudio(false);
      showDiagnostic(`Audio could not start: ${error?.message||'the browser blocked playback or the file could not be loaded.'}`);
    }
  });
  ambientAudio.addEventListener('play',()=>syncAudio(true));
  ambientAudio.addEventListener('pause',()=>syncAudio(false));
  ambientAudio.addEventListener('error',()=>{
    syncAudio(false);
    showDiagnostic('Audio could not be loaded. Check that the ambient audio asset is being served by the app.');
  });
}
