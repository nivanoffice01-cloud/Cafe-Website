export const MAX_BLOBS = 25

const common = /* glsl */ `
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*vnoise(p);p=p*2.03+17.1;a*=.5;}return s;}
vec3 film(vec3 c){ c=max(c,0.); return c*(1.+c*.12)/(1.+c*.32); }
`

/** Shared by the relief surface and the stacked crumb shells that give it a real edge. */
export const pizzaVertex = /* glsl */ `
uniform sampler2D tMask; uniform float uHeat,uTime,uRise,uShell;
varying vec2 vUv; varying vec3 vW; varying float vLayer;
${common}
void main(){
  vUv=uv; vec3 p=position; vec3 m=texture2D(tMask,uv).rgb;
  float bubble=(vnoise(uv*26.+uTime*.35)-.5)*uHeat*.03*m.g;
  p.y+=m.b*.135*uRise+bubble; vLayer=0.;
  #ifdef SHELL
    float k=(float(gl_InstanceID)+1.)/9.; vLayer=k;
    // taper to a rolled lower edge instead of a vertical extrusion
    vec2 q=p.xz; p.xz=q*(1.-.05*k*k);
    p.y=mix(p.y,-.035,k);
  #endif
  vec4 w=modelMatrix*vec4(p,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w;
}`

export const pizzaFragment = /* glsl */ `
precision highp float;
uniform sampler2D tBaked,tRaw,tNormal,tMask;
uniform float uSauce,uBake,uHeat,uTime,uSide,uCut,uFlour;
uniform vec3 uKey,uCam; uniform vec4 uBlobs[${MAX_BLOBS}]; uniform mat3 uNM;
varying vec2 vUv; varying vec3 vW; varying float vLayer;
${common}
void main(){
  vec3 m=texture2D(tMask,vUv).rgb; float edgeA=clamp((m.r-.5)/max(fwidth(m.r),.001)+.5,0.,1.); if(edgeA<.02) discard;
  // wedge between two of the pizza's real cut lines
  vec2 d=vUv-vec2(.5098,1.-.4537); float ang=atan(-d.y,d.x);
  float jag=(vnoise(vUv*42.)-.5)*.012;
  bool inside=ang>1.553+jag && ang<2.454+jag;
  if(uCut>.001){ if((uSide>.5)!=inside) discard; } else if(uSide>.5) discard;
  vec3 N=texture2D(tNormal,vUv).xyz*2.-1.;
  vec3 raw=texture2D(tRaw,vUv).rgb, baked=texture2D(tBaked,vUv).rgb;
  float r=length(vUv-.5), th=atan(vUv.y-.5,vUv.x-.5);
  // ladled spiral front: wet lip leads, sauce settles behind it
  float ladle=r*1.95+.10*sin(th*2.+r*22.)+(fbm(vUv*9.)-.5)*.34;
  float front=uSauce*1.45-.12, cover=smoothstep(front,front-.035,ladle)*smoothstep(.05,.75,m.g);
  float lip=smoothstep(.10,0.,abs(front-.05-ladle))*m.g*step(.005,uSauce)*(1.-smoothstep(.9,1.,uSauce));
  float bk=smoothstep(0.,.5,uBake*1.5-(fbm(vUv*5.+3.)*.6+(.5-r)*.5));
  vec3 rich=pow(baked,vec3(1.08,1.28,1.25)); baked=mix(baked,rich,m.g); float dark=1.-smoothstep(.10,.42,baked.r), gold=smoothstep(.10,.30,baked.g);
  vec3 wetSauce=mix(baked*mix(vec3(.86,.62,.55),vec3(1.),bk),vec3(.50,.035,.016)*(.8+.4*vnoise(vUv*60.)),max(dark,gold*.8));
  vec3 dough=mix(raw,baked,bk*(1.-m.g*.999)+bk*m.g*cover);
  vec3 col=mix(dough,mix(wetSauce,baked,bk),cover);
  col=mix(col,dough*vec3(.80,.12,.05),cover*(1.-cover)*3.2*(1.-bk)); col*=1.-lip*.28;
  float nScale=mix(.35,mix(.8,.5,m.g),max(bk,cover*.8));
  vec3 n=normalize(uNM*normalize(vec3(N.x*nScale,1.,-N.y*nScale)));
  // occlusion that tightens as each ingredient approaches the surface
  float sh=1.; vec2 p=vec2(vUv.x*2.-1.,1.-vUv.y*2.);
  for(int i=0;i<${MAX_BLOBS};i++){ vec4 b=uBlobs[i]; if(b.w<.001) continue; float h=max(b.z,0.);
    float soft=b.w*(.55+h*1.3); vec2 q=p-(b.xy+vec2(.42,.36)*h+vec2(.015,.018));
    float k=smoothstep(b.w+soft,b.w-soft*.75,length(q)); sh*=1.-k*.66/(1.+h*3.2); }
  vec3 V=normalize(uCam-vW), L=normalize(uKey);
  float ndl=dot(n,L), wrap=clamp((ndl+.35)/1.35,0.,1.);
  vec3 warm=vec3(1.,.89,.74);
  vec3 light=vec3(.30,.33,.29)+warm*wrap*.92*mix(.42,1.,sh);
  vec3 c=col*light*mix(.72,1.,sh);
  vec3 H=normalize(L+V); float wet=cover*(1.-.35*bk)+.12*bk;
  float lum=dot(baked,vec3(.3,.59,.11));
  float sp=pow(max(dot(n,H),0.),46.)*wet*(.25+lum*.9)+pow(max(dot(n,H),0.),9.)*.06;
  c+=warm*sp*.5*sh; c+=warm*lip*pow(max(dot(n,H),0.),12.)*.08;
  // back-rim light in champagne + oven fire
  vec3 RL=normalize(vec3(-.35,.35,-1.)); float rimL=pow(1.-max(dot(n,V),0.),2.2)*max(dot(n,RL)+.25,0.);
  c+=vec3(.95,.72,.38)*rimL*.42;
  c+=vec3(1.,.30,.05)*uHeat*(max(dot(n,normalize(vec3(-.8,.28,-.7))),0.)*.75+.07)*col*1.7;
  c=mix(c,c*vec3(1.05,1.03,1.),uFlour);
  if(vLayer>0.){ // baked underside and torn crumb
    vec3 crumb=mix(vec3(.78,.60,.36),vec3(.80,.66,.45),1.-bk)*(.72+.55*vnoise(vUv*160.+vLayer*9.));
    vec3 crust=mix(col,vec3(.36,.20,.09),bk*.55);
    float edge=smoothstep(.36,.43,r);
    c=mix(crumb*.8,crust*.62,edge)*(1.-.62*vLayer)*(.6+.5*sh);
    c+=vec3(1.,.35,.08)*uHeat*.12*col;
  }
  gl_FragColor=vec4(film(c),edgeA);
  #include <colorspace_fragment>
}`

export const cutVertex = /* glsl */ `
uniform sampler2D tHeight; uniform vec4 uRect; uniform float uDepth,uBend,uTime,uLive,uDome,uDomeR,uOver;
varying vec2 vUv,vQ; varying vec3 vW;
void main(){
  vec2 ov=(uv-.5)*uOver+.5; vQ=ov; vUv=uRect.xy+vec2(ov.x,1.-ov.y)*uRect.zw; vec3 p=position; p.xy*=uOver;
  float h=texture2D(tHeight,uRect.xy+vec2(clamp(ov.x,0.,1.),1.-clamp(ov.y,0.,1.))*uRect.zw).r; vec2 dq=(ov-.5)*uDomeR; h=mix(h,sqrt(max(1.-dot(dq,dq),0.)),uDome); p.z+=h*uDepth;
  // a leaf curls about its midrib and breathes in the air
  vec2 c=ov-.5; p.z+=uBend*(dot(c,c)*1.15-.10)+uBend*uLive*.35*sin(uTime*1.3+c.x*4.+c.y*3.)*length(c);
  vec4 w=modelMatrix*vec4(p,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w;
}`

export const cutFragment = /* glsl */ `
precision highp float;
uniform sampler2D tAtlas,tHeight; uniform vec4 uRect; uniform float uDepth,uBlur,uKind,uFresh,uHeat,uOpacity,uSideSign,uTexel,uGlow,uShade,uCutFace,uSkin;
uniform vec3 uKey,uCam; uniform mat3 uNM;
varying vec2 vUv,vQ; varying vec3 vW;
${common}
vec4 tap(vec2 u){ vec2 lo=uRect.xy+uTexel*2., hi=uRect.xy+uRect.zw-uTexel*2.; vec4 s=texture2D(tAtlas,clamp(u,lo,hi)); float in_=step(lo.x,u.x)*step(u.x,hi.x)*step(lo.y,u.y)*step(u.y,hi.y); s.a*=in_; return vec4(s.rgb*s.a,s.a); }
void main(){
  vec4 t;
  if(uBlur>.002){ t=tap(vUv); float w=1.; float jit=hash(gl_FragCoord.xy)*6.28;
    for(int i=0;i<28;i++){ float f=float(i)+.5; float rr=sqrt(f/28.)*uBlur, a=f*2.39996+jit; t+=tap(vUv+vec2(cos(a),sin(a))*rr*uRect.z); w+=1.; } t/=w; }
  else t=tap(vUv);
  float a=t.a; if(uBlur<=.002) a=smoothstep(.28,.72,a);
  if(a<.02||(uBlur<=.002&&a<.12)) discard;
  vec3 col=t.rgb/max(t.a,.001); if(uSkin>.5) col=vec3(.62,.035,.012)*(.85+.3*vnoise(vQ*9.));
  float e=uTexel*2.5; vec2 g=vec2(texture2D(tHeight,vUv+vec2(e,0)).r-texture2D(tHeight,vUv-vec2(e,0)).r,texture2D(tHeight,vUv+vec2(0,e)).r-texture2D(tHeight,vUv-vec2(0,e)).r);
  float dome=uKind>.5&&uKind<1.5&&uCutFace<.5?1.:0.;
  vec3 nl; vec2 q=(vQ-.5)*2.2; float rr=dot(q,q);
  if(dome>.5) nl=vec3(q,sqrt(max(1.-rr,.02))); else nl=normalize(vec3(-g.x*(uKind>1.5?2.2:5.),g.y*(uKind>1.5?2.2:5.),1.));
  nl.z*=uSideSign; if(uKind<.5) nl=normalize(nl+vec3(0,0,.55*uSideSign)); vec3 n=normalize(uNM*nl);
  vec3 V=normalize(uCam-vW),L=normalize(uKey); if(uKind>1.5){ if(!gl_FrontFacing) n=-n; n=normalize(n+V*max(0.,.15-dot(n,V))); }
  float ndl=dot(n,L), wrap=clamp((ndl+.45)/1.45,0.,1.); vec3 warm=vec3(1.,.90,.77);
  if(uKind<.5){ float l=dot(col,vec3(.3,.59,.11)); vec3 fresh=mix(vec3(l)*vec3(1.10,1.06,.96),col,.36); fresh=mix(fresh,vec3(.97,.92,.82)*(.55+.45*smoothstep(.1,.75,l)),.5); col=mix(col,fresh,uFresh*.8); }
  vec3 c=uKind<.5?col*(vec3(.50,.50,.45)+warm*mix(.62,wrap,.62)*.82):col*(vec3(.27,.30,.26)+warm*wrap*1.12);
  vec3 H=normalize(L+V); float nh=max(dot(n,H),0.);
  if(uKind<.5) { c+=warm*pow(nh,38.)*.20; c+=vec3(.9,.72,.5)*col*.10*(1.-ndl*.5); }
  else if(uKind<1.5){ float fr=pow(1.-max(dot(n,V),0.),4.);
    if(uCutFace<.5){ vec2 hl=vec2(dot(n,normalize(L+V+vec3(.25,0,0))),0.); c+=vec3(1.,.95,.86)*(smoothstep(.972,.994,hl.x)*.75+pow(nh,18.)*.12); c+=vec3(.55,.68,.45)*fr*.35; c*=.95+.6*smoothstep(-.5,.6,ndl); }
    else { c+=warm*pow(nh,60.)*.30; c*=1.28; } }
  else { float back=clamp(-dot(n,L)*.6+.35,0.,1.)*max(dot(-V,L)+.65,0.); c+=col*vec3(.75,1.,.18)*back*.8; c+=vec3(.85,1.,.8)*pow(nh,24.)*.22; c*=1.12; }
  vec3 RL=normalize(vec3(-.35,.35,-1.)); c+=vec3(.95,.76,.44)*pow(1.-abs(dot(n,V)),2.6)*max(dot(n,RL)+.35,0.)*(uCutFace>.5?.08:uKind<.5?.2:.45);
  c+=vec3(1.,.32,.06)*uHeat*(max(dot(n,normalize(vec3(-.8,.28,-.7))),0.)*.9+.1)*col*1.1;
  c*=uShade; float o=a*uOpacity;
  gl_FragColor=vec4(film(c),1.);
  #include <colorspace_fragment>
  gl_FragColor=vec4(gl_FragColor.rgb*o,o);
}`

export const tableVertex = /* glsl */ `varying vec2 vP; varying vec3 vW; void main(){vP=position.xy; vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`
export const tableFragment = /* glsl */ `
precision highp float; uniform sampler2D tCol,tNor; uniform vec3 uCam,uKey; uniform float uLift,uHeat,uShow,uFlour; uniform vec3 uSlice; varying vec2 vP; varying vec3 vW;
${common}
void main(){
  vec2 uv=vW.xz*.42; vec3 c=texture2D(tCol,uv).rgb; float l=dot(c,vec3(.33));
  vec3 n=texture2D(tNor,uv).xyz*2.-1.; n=normalize(vec3(n.x,n.z*1.1,-n.y));
  vec3 V=normalize(uCam-vW),L=normalize(uKey),H=normalize(L+V);
  float d=length(vW.xz), pool=exp(-d*d*.16);
  vec3 base=mix(vec3(.004,.013,.008),vec3(.030,.066,.042),pow(l,.75)*1.3);
  vec3 o=base*(.25+1.35*max(dot(n,L),0.)*pool)+vec3(.80,.70,.48)*pow(max(dot(n,H),0.),22.)*.07*pool;
  // penumbra widens as the pizza leaves the stone
  vec2 off=vec2(.42,.36)*uLift; float s=smoothstep(1.03+uLift*.8,.82-uLift*.5,length(vW.xz-off));
  float s2=smoothstep(.42+uSlice.z*.5,.18,length(vW.xz-uSlice.xy))*step(.01,uSlice.z);
  float ca=smoothstep(1.12,.90,d)*exp(-uLift*9.);
  o*=1.-max(s*(.86-.4*uSlice.z)/(1.+uLift*.9),s2*.6); o*=1.-ca*.6;
  float fl=smoothstep(.50,.78,fbm(vW.xz*3.)+.35*exp(-pow(d-1.15,2.)*5.))*smoothstep(2.6,.9,d); fl*=smoothstep(.35,.8,vnoise(vW.xz*130.)*.6+vnoise(vW.xz*51.)*.4);
  o=mix(o,vec3(.62,.60,.50),fl*uFlour*.16*(1.-s*.7));
  o+=vec3(1.,.28,.05)*uHeat*.42*exp(-d*.6)*(.5+.5*n.x)*(1.-s);
  float a=smoothstep(4.3,1.3,d)*uShow;
  gl_FragColor=vec4(film(o),1.);
  #include <colorspace_fragment>
  gl_FragColor=vec4(gl_FragColor.rgb*a,a);
}`

export const dustVertex = /* glsl */ `
attribute vec4 aSeed; uniform float uTime,uScroll,uFlour,uHeat,uPx; varying float vA,vB; varying vec3 vC;
void main(){
  float sp=.25+aSeed.w; vec3 p=(aSeed.xyz-.5)*vec3(7.,4.6,6.); float rise=mix(.035,.42,uHeat)*sp;
  p.y=mod(p.y+uTime*rise+uScroll*(.5+sp)+10.,4.6)-1.4; p.x+=sin(uTime*.25*sp+aSeed.y*20.)*.22; p.z+=cos(uTime*.2+aSeed.x*18.)*.18;
  vec4 mv=viewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; float z=-mv.z;
  float coc=clamp(abs(z-5.2)*.5,0.,2.2); vB=coc; float sz=mix(.010,.021,aSeed.w*aSeed.w)*(1.+coc*1.5);
  gl_PointSize=clamp(sz*uPx/z,1.,70.);
  vC=mix(mix(vec3(.93,.80,.52),vec3(1.,.97,.9),uFlour),vec3(1.,.36,.08)*1.5,uHeat*step(.35,aSeed.x));
  vA=(.42+.5*sin(uTime*(.5+sp)+aSeed.z*30.)*.5)*(.5+uFlour*.5+uHeat*.9)/(1.+coc*coc*1.5); vA*=smoothstep(.4,1.4,z);
}`
export const dustFragment = /* glsl */ `precision highp float; varying float vA,vB; varying vec3 vC; void main(){float d=length(gl_PointCoord-.5)*2.; float a=mix(exp(-d*d*4.),smoothstep(1.,.8,d)*.7,clamp(vB,0.,1.))*smoothstep(1.,.85,d)*vA; gl_FragColor=vec4(vC*a,0.);}`

export const steamVertex = /* glsl */ `varying vec2 vUv; uniform float uScale; void main(){vUv=uv; vec4 c=modelMatrix*vec4(0,0,0,1); vec3 r=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]); vec3 w=c.xyz+(r*position.x+vec3(0,1,0)*position.y)*uScale; gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}`
export const steamFragment = /* glsl */ `precision highp float; varying vec2 vUv; uniform float uTime,uAmt,uSeed,uSpeed; uniform vec3 uTint;
${common}
void main(){ float uT=uTime*uSpeed; vec2 u=vUv; u.x+= (fbm(vec2(u.y*2.2-uT*.18,uSeed))-.5)*.42*u.y; vec2 q=vec2(u.x*3.2+uSeed,u.y*1.5-uT*.16);
  float f=fbm(q+fbm(q*1.4-uT*.07)*1.3); float m=smoothstep(.5,.15,abs(u.x-.5))*smoothstep(0.,.22,u.y)*smoothstep(1.,.35,u.y);
  float a=smoothstep(.40,.95,f)*m*uAmt; gl_FragColor=vec4(mix(uTint,uTint.rrr*vec3(1.,.82,.42),a*a*step(1.5,uSpeed))*a,0.); }`

export const strandVertex = /* glsl */ `
attribute vec3 aA,aB; attribute vec2 aT; attribute float aSeed; uniform float uPull,uWide; uniform mat4 uMA,uMB; varying float vX,vT,vGone; 
void main(){ float t=aT.x; vec3 A=(uMA*vec4(aA,1.)).xyz,B=(uMB*vec4(aB,1.)).xyz; vec3 p=mix(A,B,t); float len=distance(A,B), sg=len*(.10+.22*aSeed);
  p.y-=sin(t*3.14159)*sg; float brk=smoothstep(.92+.1*aSeed,1.1+.1*aSeed,uPull);
  float mid=pow(abs(t-.5)*2.,2.2); float w=uWide*(.35+aSeed*.75)*mix(1.,mix(.12,1.,mid),smoothstep(.02,.35,len)); w*=1.-brk*smoothstep(1.,.2,mid);
  vec4 c=viewMatrix*vec4(p,1.), cb=viewMatrix*vec4(p+(B-A)*.02-vec3(0,cos(t*3.14159)*3.14159*.02*sg,0),1.); vec2 dir=normalize(cb.xy/-cb.z-c.xy/-c.z+vec2(1e-6)); c.xy+=vec2(-dir.y,dir.x)*aT.y*w;
  vX=aT.y; vT=t; vGone=w; gl_Position=projectionMatrix*c; }`
export const strandFragment = /* glsl */ `precision highp float; varying float vX,vT,vGone; uniform float uHeat; 
${common}
void main(){ if(vGone<.0006) discard; float n=sqrt(max(1.-vX*vX,0.)); vec3 c=mix(vec3(.50,.28,.09),vec3(.80,.62,.34),n)*(.55+.5*n); c+=vec3(1.,.93,.8)*pow(max(1.-abs(vX+.35)*1.6,0.),4.)*.28; gl_FragColor=vec4(film(c),1.);
  #include <colorspace_fragment>
}`
