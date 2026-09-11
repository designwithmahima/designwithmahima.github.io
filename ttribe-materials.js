const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const packaging = document.querySelector('#chapter-6 > img');
const crop = document.createElement('div');
crop.className = 'packaging-art';
packaging.before(crop); crop.append(packaging);

function installation(panel) {
  const section = document.createElement('section');
  section.className = 'chime-installation';
  section.innerHTML = `<div class="chime-heading"><span>THE IDENTITY / IN MOTION</span><button type="button" class="chime-toggle" aria-pressed="false">Pause motion</button></div><div class="chime-stage" role="img" aria-label="Six TTribe paper tags suspended on braided cotton threads, moving independently in a gentle breeze"><div class="chime-fallback"></div></div><div class="chime-caption"><span>PAPER. THREAD. A LITTLE AIR.</span><span>Drag gently to stir the air ↗</span></div>`;
  panel.append(section);
  const observer = new IntersectionObserver(entries => {
    if(entries.some(e=>e.isIntersecting)) { observer.disconnect(); buildChimes(section).catch(error=>{console.warn('TTribe static fallback:', error.message);section.querySelector('.chime-toggle').hidden=true;}); }
  },{rootMargin:'300px'});
  observer.observe(section);
  return section;
}
const caseInstallation=installation(document.querySelector('#case-study-tab'));
// The original composite already contains tags. Crop only that tail; show one installation.
document.querySelector('#chapter-6').classList.add('has-chime-installation');
installation(document.querySelector('#storefront-tab'));

async function buildChimes(section) {
  const THREE = await import('three');
  const stage = section.querySelector('.chime-stage');
  const logo = new Image(); logo.src='/ttribe/assets/ttribe-logo-reference.png'; await logo.decode();
  // Use the supplied artwork as ink on the paper, with its original silhouette and lettering.
  const ink = document.createElement('canvas'); ink.width=logo.width;ink.height=logo.height;
  const ic=ink.getContext('2d');ic.drawImage(logo,0,0);
  const pixels=ic.getImageData(0,0,ink.width,ink.height);
  for(let i=0;i<pixels.data.length;i+=4){const tone=pixels.data[i];pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=18;pixels.data[i+3]=Math.max(0,Math.min(255,(185-tone)*2));}
  ic.putImageData(pixels,0,0);
  function paperTexture(back=false){
    const c=document.createElement('canvas'); c.width=768;c.height=512; const ctx=c.getContext('2d');
    ctx.fillStyle='#f2f0ea';ctx.fillRect(0,0,768,512);
    let seed=52;for(let i=0;i<90000;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%768;seed=(seed*1664525+1013904223)>>>0;const y=seed%512;ctx.fillStyle=i%2?'rgba(82,72,54,.035)':'rgba(255,255,255,.18)';ctx.fillRect(x,y,1,1);}
    if(back){ctx.drawImage(ink,20,15,160,128);ctx.fillStyle='#292824';ctx.textAlign='right';ctx.font='bold 25px Arial';ctx.fillText('Ttribe',715,407);ctx.font='10px Arial';ctx.fillText('YOUR VIBE. YOUR TRIBE.',715,430);ctx.fillText('TTRIBE / EVERYDAY ESSENTIALS',715,449);}
    else ctx.drawImage(ink,134,55,500,402);
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
  }
  const front=paperTexture(),back=paperTexture(true);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0xf7f7f5);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.VSMShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(35,1,1,3000);camera.position.set(0,0,1100);
  scene.add(new THREE.HemisphereLight(0xffffff,0xdeddda,2.6));
  const light=new THREE.DirectionalLight(0xffffff,.95);light.position.set(-350,480,650);light.castShadow=true;
  light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-800,right:800,top:600,bottom:-600,near:1,far:2000});light.shadow.normalBias=1;light.shadow.bias=-.0001;light.shadow.radius=6;light.shadow.blurSamples=12;scene.add(light);
  const wall=new THREE.Mesh(new THREE.PlaneGeometry(3000,2200),new THREE.MeshStandardMaterial({color:0xf7f7f5,roughness:1}));wall.position.z=-100;wall.receiveShadow=true;scene.add(wall);
  const edge=new THREE.MeshStandardMaterial({color:0xd7d3c8,roughness:.95});
  const face=new THREE.MeshStandardMaterial({map:front,roughness:.94});const reverse=new THREE.MeshStandardMaterial({map:back,roughness:.94});
  const metal=new THREE.MeshStandardMaterial({color:0xbcbab2,metalness:.8,roughness:.27});
  const threadMaterial=new THREE.MeshStandardMaterial({color:0xa69477,roughness:1});
  const fiberMaterial=new THREE.LineBasicMaterial({color:0xdacdb5});
  const configs=[[-.38,335,1.02,.27,100],[-.22,105,-.28,.82,30],[-.16,455,-.45,-.13,20],[.08,300,.1,-.66,60],[.26,190,.38,1.49,0],[.39,405,-.55,.25,70]];
  let width=1200,height=650,viewWidth=1200,viewHeight=650;
  const tags=configs.map(([x,length,yaw,roll,z],i)=>{
    const pivot=new THREE.Group();scene.add(pivot);
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(148,98,.85),[edge,edge,edge,edge,i%3===2?reverse:face,i%3===2?face:reverse]);mesh.position.y=-47;mesh.castShadow=true;mesh.receiveShadow=true;pivot.add(mesh);
    // A bent wire clip, rounded at both ends, wrapping over the top edge.
    const clipPoints=[[-3,8,2],[-3,-19,2],[0,-23,2],[4,-21,2],[5,-18,2],[5,11,2],[2,15,1],[-2,14,-1],[-5,10,-1],[-5,-15,-1]];
    const clip=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(clipPoints.map(p=>new THREE.Vector3(...p))),36,.65,6,false),metal);clip.castShadow=true;pivot.add(clip);
    const ropeGeometry=new THREE.BufferGeometry();const positions=new Float32Array(49*6*3);const indices=[];
    for(let j=0;j<48;j++)for(let k=0;k<6;k++){const a=j*6+k,b=j*6+(k+1)%6;indices.push(a,b,a+6,b,b+6,a+6);}
    ropeGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));ropeGeometry.setIndex(indices);
    const rope=new THREE.Mesh(ropeGeometry,threadMaterial);rope.frustumCulled=false;scene.add(rope);
    const fibers=[0,Math.PI].map(phase=>{const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(49*3),3).setUsage(THREE.DynamicDrawUsage));const line=new THREE.Line(geo,fiberMaterial);line.frustumCulled=false;scene.add(line);return {line,phase};});
    const knot=new THREE.Mesh(new THREE.TorusGeometry(2.5,.8,5,14),threadMaterial);knot.position.set(0,13,0);pivot.add(knot);
    const tail=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0,14,0),new THREE.Vector3(5,10,0),new THREE.Vector3(10,12,1),new THREE.Vector3(17,10,2)]),12,.65,5,false),threadMaterial);pivot.add(tail);
    return {pivot,mesh,rope, fibers,x,length,yaw,roll,z,angle:Math.sin(i)*.035,v:0,twist:yaw,tv:0,phase:i*1.93};
  });
  let visible=false,frame=0,last=0,elapsed=0,paused=reduced.matches;
  const button=section.querySelector('.chime-toggle');
  const syncButton=()=>{button.textContent=paused?'Resume motion':'Pause motion';button.setAttribute('aria-pressed',String(paused));};syncButton();
  function draw(dt=0){
    elapsed+=dt;const compact=width<600;const scale=compact?.75:1;
    tags.forEach((tag,i)=>{
      tag.pivot.visible=tag.rope.visible=i<(compact?3:6);tag.fibers.forEach(f=>f.line.visible=tag.pivot.visible);if(!tag.pivot.visible)return;
      const len=tag.length*(compact?.77:1);const anchorX=compact?[-.28,0,.28][i]*viewWidth:tag.x*viewWidth;
      if(dt){const gust=Math.sin(elapsed*.72+tag.phase)*.08+Math.sin(elapsed*1.13)*.045;tag.v+=(-tag.angle*(2.8*300/len)+gust)*dt;tag.v*=Math.exp(-.28*dt);tag.angle=THREE.MathUtils.clamp(tag.angle+tag.v*dt,-.28,.28);
      tag.tv+=((tag.yaw+Math.sin(elapsed*.42+tag.phase)*.34-tag.twist)*1.4+tag.v*.8)*dt;tag.tv*=Math.exp(-.5*dt);tag.twist+=tag.tv*dt;}
      const top=viewHeight/2+12;const sway=Math.sin(tag.angle)*len;
      tag.pivot.position.set(anchorX+sway,top-Math.cos(tag.angle)*len,tag.z+Math.sin(elapsed*.5+tag.phase)*8);
      tag.pivot.scale.setScalar(scale);tag.pivot.rotation.set(Math.sin(elapsed*.6+tag.phase)*.1,tag.twist,tag.roll+tag.angle*.85);
      tag.pivot.updateMatrixWorld(true);const end=tag.pivot.localToWorld(new THREE.Vector3(0,15,0));
      const pos=tag.rope.geometry.attributes.position;
      for(let j=0;j<=48;j++){const t=j/48;const bow=Math.sin(t*Math.PI)*(4+Math.sin(elapsed*.9+tag.phase)*4+sway*.1);const cx=anchorX+(end.x-anchorX)*t+bow;const cy=top+(end.y-top)*t;const cz=end.z*t+Math.sin(t*Math.PI)*5;
        for(let k=0;k<6;k++){const a=k/6*Math.PI*2;pos.setXYZ(j*6+k,cx+Math.cos(a)*.72,cy,cz+Math.sin(a)*.72);}
        tag.fibers.forEach(({line,phase})=>{const a=t*len*1.5+phase;line.geometry.attributes.position.setXYZ(j,cx+Math.cos(a)*.82,cy,cz+Math.sin(a)*.82);});}
      pos.needsUpdate=true;tag.rope.geometry.computeVertexNormals();tag.fibers.forEach(({line})=>line.geometry.attributes.position.needsUpdate=true);
    });
    renderer.render(scene,camera);
  }
  function resize(){const rect=stage.getBoundingClientRect();if(!rect.width)return;width=rect.width;height=rect.height;camera.aspect=width/height;viewHeight=width<600?530:690;camera.position.z=viewHeight/(2*Math.tan(THREE.MathUtils.degToRad(17.5)));viewWidth=viewHeight*camera.aspect;camera.updateProjectionMatrix();renderer.setSize(width,height);draw();}
  const tick=time=>{frame=0;if(!visible||paused||document.hidden)return;const dt=Math.min((time-last)/1000,.035);last=time;draw(dt);frame=requestAnimationFrame(tick);};
  const start=()=>{if(visible&&!paused&&!document.hidden&&!frame){last=performance.now();frame=requestAnimationFrame(tick);}};
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible){resize();start();}else{cancelAnimationFrame(frame);frame=0;}},{threshold:.01}).observe(stage);
  button.addEventListener('click',()=>{paused=!paused;syncButton();if(paused){cancelAnimationFrame(frame);frame=0;}else start();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;syncButton();if(paused){cancelAnimationFrame(frame);frame=0;draw();}else start();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();});
  let drag=false,lastX=0;const ray=new THREE.Raycaster();let selected=null;
  renderer.domElement.addEventListener('pointerdown',e=>{if(paused)return;const r=stage.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects(tags.filter(t=>t.pivot.visible).map(t=>t.mesh))[0];selected=tags.find(t=>t.mesh===hit?.object);drag=true;lastX=e.clientX;renderer.domElement.setPointerCapture(e.pointerId);if(selected)selected.v+=.12;});
  renderer.domElement.addEventListener('pointermove',e=>{if(!drag||paused)return;const impulse=THREE.MathUtils.clamp((e.clientX-lastX)*.004,-.12,.12);lastX=e.clientX;tags.forEach(tag=>{tag.v+=impulse*(selected?(tag===selected?1:.1):.35);tag.tv+=impulse*.6;});});
  ['pointerup','pointercancel'].forEach(event=>renderer.domElement.addEventListener(event,()=>{drag=false;selected=null;}));
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);frame=0;paused=true;section.classList.remove('chime-ready');button.hidden=true;});
  stage.append(renderer.domElement);resize();section.classList.add('chime-ready');
}

// Brief, monochrome scan-slice reveal, once each loaded image enters the viewport.
const imageObserver=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{if(!isIntersecting)return;imageObserver.unobserve(target);const reveal=()=>{if(reduced.matches)return;target.classList.remove('image-signal');void target.offsetWidth;target.classList.add('image-signal');};if(target.complete&&target.naturalWidth)reveal();else target.addEventListener('load',reveal,{once:true});}),{threshold:.06});
document.querySelectorAll('.figma-art-slice img,.editorial-fabric,.gallery-main img,.rec-img-wrap img').forEach(img=>{imageObserver.observe(img);img.addEventListener('animationend',()=>img.classList.remove('image-signal'));});
const gallery=document.querySelector('.gallery-main img');gallery.addEventListener('load',()=>{if(!reduced.matches){gallery.classList.remove('image-signal');void gallery.offsetWidth;gallery.classList.add('image-signal');}});
const hero=document.querySelector('.store-editorial');let scrollFrame=0;
const parallax=()=>{scrollFrame=0;if(reduced.matches)return;const rect=hero.getBoundingClientRect();if(rect.height&&rect.bottom>0&&rect.top<innerHeight)hero.style.setProperty('--fabric-y',`${Math.max(-45,Math.min(45,-rect.top*.12))}px`);};
addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(parallax);},{passive:true});

