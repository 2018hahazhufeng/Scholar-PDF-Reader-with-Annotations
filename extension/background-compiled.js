(function(){class m{get(a,b){chrome.storage.local.get(a,c=>{b(chrome.runtime.lastError?null:c)})}set(a){chrome.storage.local.set(a,function(){})}remove(a){chrome.storage.local.remove(a)}};const n=chrome.runtime.getURL("reader.html"),p=/^scholar[.]google[.][^.]+([.][^.]+)?$/,r="chrome-extension://"+chrome.runtime.id,t=["chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj/viewer.html","chrome-extension://oemmndcbldboiebfnladdacbdfmadadm/content/web/viewer.html","chrome-extension://ieepebpjnkhaiioojkepfniodjmjjihl/data/pdf.js/web/viewer.html"];function u(a,b){if(!a)return"";for(const {name:c,value:d}of a)if(c&&c.toLowerCase()===b)return d||"";return""}
var v=function(a){a.g.size+a.i.size<=0||a.o||(a.o=!0,setTimeout(()=>{a.o=!1;a.i=a.g;a.g=new Map;v(a)},36E4))},z=function(a,b){var c=w;a=`${a} ${b}`;b=c.g.get(a);b||(b={},c.g.set(a,b),v(c));return b},A=function(a){a.h.size+a.j.size<=0||a.m||(a.m=!0,setTimeout(()=>{a.m=!1;const b=[];for(const c of a.j.values())b.push(c.ruleId);chrome.declarativeNetRequest.updateSessionRules({removeRuleIds:b});a.j=a.h;a.h=new Map;A(a)},15E3))},B=function(a,b){var c=w;b=`${a} ${b}`;({D:b}=c.g.get(b)||c.i.get(b)||{});
if(!b)return Promise.resolve({v:"",A:"",B:"",parentFrameId:NaN});const d=Number(b.split(" ")[1]),{u:e}=c.g.get(b)||c.i.get(b)||{};a=`${a} ${0}`;a=c.g.get(a)||c.i.get(a)||{};const g=a.u||"";let h;const f=((h=a.l)==null?void 0:h.G)||"";c=c.h.get(b)||c.j.get(b);return(c?c.promise:Promise.resolve()).then(()=>({v:e||"",A:g,B:f,parentFrameId:d}))};
class C{constructor(){this.i=new Map;this.g=new Map;this.j=new Map;this.h=new Map;const a=chrome.extension.inIncognitoContext;this.C=a?1E8:1;this.m=this.o=!1;chrome.declarativeNetRequest.getSessionRules().then(b=>{const c=[];for(const d of b)(a&&d.id>=1E8||!a&&d.id<1E8)&&c.push(d.id);c.length<=0||chrome.declarativeNetRequest.updateSessionRules({removeRuleIds:c})})}}const w=new C;
chrome.webRequest.onBeforeSendHeaders.addListener(a=>{if(!(a.tabId<0||a.type==="xmlhttprequest")){var b=u(a.requestHeaders,"referer"),c=a.url;z(a.tabId,a.frameId).F={url:c,referrer:b}}},{urls:["<all_urls>"]},["requestHeaders","extraHeaders"]);
chrome.webRequest.onHeadersReceived.addListener(a=>{if(a.tabId>=0&&a.type==="main_frame"){var b=a.url,c=a.statusCode,d=z(a.tabId,a.frameId);if(d.l&&d.l.s){if(c<300||c>=400)d.l.s=!1}else c>=300&&c<400?d.l={s:!0,G:b}:d.l=void 0}if(!(a.tabId<0||a.type==="xmlhttprequest"||(a.initiator||"").startsWith("chrome-extension://")||u(a.responseHeaders,"content-type").split(";",1)[0].trim().toLowerCase()!=="application/pdf")){c=a.tabId;d=a.url;b=w;a=`${c} ${a.frameId}`;var {F:e}=b.g.get(a)||b.i.get(a)||{};let g=
(e==null?void 0:e.referrer)||"";(e==null?void 0:e.url)!==d&&(g="");(e=b.h.get(a)||b.j.get(a))&&chrome.declarativeNetRequest.updateSessionRules({removeRuleIds:[e.ruleId]});e=b.C++;c=chrome.declarativeNetRequest.updateSessionRules({addRules:[{action:{requestHeaders:[{header:"referer",operation:"set",value:g}],type:"modifyHeaders"},condition:{initiatorDomains:[(new URL(d)).hostname],tabIds:[c],urlFilter:`|${d}|`},id:e}]})||Promise.resolve();b.h.set(a,{ruleId:e,promise:c});A(b)}},{urls:["<all_urls>"]},
["responseHeaders"]);chrome.webNavigation.onCommitted.addListener(a=>{if(a.url!==n){var b=a.url;z(a.tabId,a.frameId).u=b}else{b=a.tabId;var c=a.parentFrameId;z(b,a.frameId).D=`${b} ${c}`}});
function D(a){chrome.windows.getCurrent(b=>{const c=Math.min(b.height,560),d=Math.min(b.width,650);chrome.windows.create({focused:!0,left:Math.round(b.left+Math.max(0,(b.width-d)/2)),top:Math.round(b.top+Math.max(0,(b.height-c)/2)),height:c,width:d,url:"local_file_access.html#wid="+b.id,type:"normal"});b={};b.fac=`${a+1}:${Date.now()}`;(new m).set(b)})}
chrome.extension.isAllowedFileSchemeAccess(function(a){a||chrome.webNavigation.onBeforeNavigate.addListener(function(){(new m).get(["fac"],b=>{b=((b||{}).fac||"").split(":");const c=Number(b[0])||0;b=(Number(b[1])||0)+12096E5*2**c;c>=4||Date.now()<b||chrome.extension.isAllowedFileSchemeAccess(function(d){d||D(c)})})},{url:[{urlPrefix:"file://",pathSuffix:".pdf"},{urlPrefix:"file://",pathSuffix:".PDF"}]})});
function E(a){const b={credentials:"include"};switch(a.method){case "GET":break;case "POST":if(typeof a.body!=="string")return null;b.method="POST";b.body=a.body;break;default:return null}typeof a.timeout==="number"&&(b.signal=AbortSignal.timeout(a.timeout));return b}function F(a){return[".proquest.com",".wiley.com",".ieee.org",".ebscohost.com"].find(b=>a.endsWith(b))}
function G(a,b){return new Promise(c=>{chrome.webNavigation.getAllFrames({tabId:b},d=>{d||c(!1);const e=new Map;var g=0;for(var h of d)d=h.frameId,e.set(d,h),h.url===a&&(g=d);g===0&&c(!0);h=g;var f=e.get(g);for(f||c(!1);h!==0;){h=f.parentFrameId;if(d=g=e.get(h))a:{let l=d=void 0;f=f.url;var k=g.url;try{l=new URL(f),d=new URL(k)}catch(x){d=!1;break a}f=F(l.origin);d=F(d.origin);d=!!f&&f===d}d||c(!1);f=g}c(!0)})})}
function H(a,b,c,d){a=a!==b;let e;try{e=new URL(b)}catch(g){}b=e?e.hash:"BAD";b=b===""||b.match(/^#page=([0-9]+(.[0-9]+)?)$/);return a&&d&&b?chrome.scripting.executeScript({target:{tabId:c},files:["historyscript-compiled.js"]}).then(g=>!!g[0].result).catch(()=>!1):Promise.resolve(!1)}
function I(a,b,c,d){return a!==b&&d?chrome.scripting.executeScript({target:{tabId:c},func:function(){return{width:window.innerWidth,height:window.innerHeight}}}).then(e=>e[0].result).catch(()=>Promise.resolve({width:0,height:0})):Promise.resolve({width:0,height:0})}function J(a){return chrome.scripting.executeScript({target:{tabId:a},func:function(){return document.referrer}}).then(b=>p.test((new URL(b[0].result+"")).host)).catch(()=>!1)}
chrome.runtime.onConnect.addListener(a=>{const b=a.sender,c=b.tab.id;if(b.id===chrome.runtime.id){var d=!0;a.onMessage.addListener(e=>{if(b.tab&&b.frameId!==void 0&&e&&typeof e==="object")switch(e.type){case "getUrl":B(b.tab.id,b.frameId).then(f=>{const k=f.v,l=f.A,x=f.B,L=f.parentFrameId;k||console.error("Failed to get URL to load",b);const M=J(c);G(k,c).then(q=>{const N=H(k,l,c,q),O=I(k,l,c,q);Promise.all([N,O,M]).then(([P,y,Q])=>{d&&a.postMessage({pdfUrl:k,topWindowUrlBeforeRedirects:x||l,isScholarTopReferrer:Q,
isHistoryOnTopWindow:P,shouldShowSignedInFeatures:q,topWindowWidth:y.width,topWindowHeight:y.height,parentFrameId:L})})})},f=>{console.error("Failed to get URL to load, reason:",f,b)});break;case "fetch":const g=e.url,h=e.id;typeof g==="string"&&typeof h==="number"&&(e=E(e))&&fetch(g,e).then(f=>f.json()).then(f=>{d&&a.postMessage({type:"fetch",id:h,json:f})}).catch(f=>{d&&a.postMessage({type:"fetch",id:h,error:f.message})})}});a.onDisconnect.addListener(()=>{d=!1})}});let K=null;
async function R(){const a=chrome.runtime.getURL("offscreen.html");if((await chrome.runtime.getContexts({contextTypes:["OFFSCREEN_DOCUMENT"],documentUrls:[a]})).length>0)return Promise.resolve();K?await K:(K=chrome.offscreen.createDocument({url:"offscreen.html",reasons:[chrome.offscreen.Reason.CLIPBOARD],justification:"Write text to the clipboard."}),await K,K=null)}async function S(a,b){await R();chrome.runtime.sendMessage({type:"offscreen-copy",text:a,timestamp:b})}
chrome.runtime.onMessage.addListener((a,b)=>{a&&b.origin===r&&typeof a==="object"&&typeof a.timestamp==="number"&&a.type==="background-copy"&&S(a.text,a.timestamp)});async function T(){for(const a of t)try{return await fetch(a),!0}catch(b){}return!1}chrome.runtime.onInstalled.addListener(a=>{a.reason===chrome.runtime.OnInstalledReason.INSTALL&&T().then(b=>{b&&chrome.tabs.create({url:"https://scholar.google.com/scholar/reader-install.pdf"})})});}).call(this);
