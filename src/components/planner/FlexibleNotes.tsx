import { useEffect,useRef,useState } from "react";
import { CalendarDays,GripVertical,ImagePlus,Palette,Plus,Printer,Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language";

type Note={id:string;title:string;date:string;html:string;order:number;backgroundColor?:string};
type FlexImageEvent=CustomEvent<{noteId:string;src:string;left?:number;top?:number}>;
type FlexFormatEvent=CustomEvent<{command:string;value?:string}>;
type SavedSelection={noteId:string;startPath:number[];startOffset:number;endPath:number[];endOffset:number};
const KEY="planner-flex-notes-v1";
const HIGHLIGHT_CLEANUP_KEY="planner-flex-highlight-cleanup-v1";
const clearLegacyHighlightStyles=(html:string)=>{
 const box=document.createElement("div");box.innerHTML=html;
 box.querySelectorAll<HTMLElement>("span").forEach(span=>{
  const hasHighlight=
   !!span.dataset.plannerHighlight||
   !!span.style.backgroundColor||
   (!!span.style.background&&span.style.background!=="none");
  if(!hasHighlight)return;
  span.style.backgroundColor="";
  span.style.background="";
  span.style.removeProperty("box-decoration-break");
  span.style.removeProperty("-webkit-box-decoration-break");
  span.style.removeProperty("padding");
  span.style.removeProperty("border-radius");
  if(span.style.display==="inline-block")span.style.display="";
  if(span.style.lineHeight==="1.15")span.style.lineHeight="";
  if(span.style.verticalAlign==="baseline")span.style.verticalAlign="";
  delete span.dataset.plannerHighlight;
  if(!span.getAttribute("style")?.trim()&&!span.attributes.length){
   span.replaceWith(...Array.from(span.childNodes));
  }
 });
 return box.innerHTML;
};
const NOTE_BACKGROUNDS=["#FFFFFF","#FFF8E7","#FCE8EC","#F7E5DF","#EAF4E4","#E4F1F5","#EEE8F6","#F4E8DE"];
const SIZE_PX:Record<string,string>={"1":"10px","2":"13px","3":"16px","4":"18px","5":"24px","6":"32px","7":"48px"};
const read=():Note[]=>{try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}};
const flexDeleteHandle=`<button type="button" class="flex-image-delete" contenteditable="false" data-action="delete" aria-label="Eliminar imagen" title="Eliminar imagen"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M19 6l-1 14c-.1 1.1-1 2-2.1 2H8.1C7 22 6.1 21.1 6 20L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></button>`;
const flexResizeHandle=`<span class="flex-resize-handle" contenteditable="false" data-resize="se" aria-label="Cambiar tamaño"></span>`;
const imageHtml=(src:string)=>`<span class="planner-flex-free-image" contenteditable="false" data-selected="false" style="position:absolute;left:16px;top:52px;width:180px;display:block;z-index:20;touch-action:none;user-select:none;"><img src="${src}" alt="Imagen" draggable="false" style="display:block;width:100%;height:auto;border-radius:10px;pointer-events:auto;"/>${flexDeleteHandle}${flexResizeHandle}</span>`;
const trimLegacyTrailingSpace=(html:string)=>{
 const box=document.createElement("div");box.innerHTML=html;
 const isEmpty=(el:Element)=>{const clone=el.cloneNode(true) as HTMLElement;clone.querySelectorAll(".planner-flex-free-image").forEach(x=>x.remove());return (clone.textContent||"").replace(/\u200B|\u00A0/g,"").trim()===""&&!clone.querySelector("img,video,audio,canvas,svg,table,hr")};
 let last=box.lastElementChild;
 while(last&&isEmpty(last)){const prev=last.previousElementSibling;last.remove();last=prev}
 while(box.lastChild&&box.lastChild.nodeType===Node.TEXT_NODE&&!(box.lastChild.textContent||"").replace(/\u200B|\u00A0/g,"").trim())box.lastChild.remove();
 return box.innerHTML;
};
const splitHtml=(html:string)=>{const box=document.createElement("div");box.innerHTML=html;const images=Array.from(box.querySelectorAll<HTMLElement>(".planner-flex-free-image")).map(x=>{x.dataset.selected="false";return x.outerHTML}).join("");box.querySelectorAll(".planner-flex-free-image").forEach(x=>x.remove());return{text:trimLegacyTrailingSpace(box.innerHTML),images}};
function deselectAllImages(except?:HTMLElement){document.querySelectorAll<HTMLElement>(".planner-free-image, .planner-flex-free-image").forEach(w=>{if(w!==except)w.dataset.selected="false"})}
function nodePath(root:Node,node:Node){const path:number[]=[];let cur:Node|null=node;while(cur&&cur!==root){const parent=cur.parentNode;if(!parent)return null;path.unshift(Array.prototype.indexOf.call(parent.childNodes,cur));cur=parent}return cur===root?path:null}
function nodeFromPath(root:Node,path:number[]){let cur:Node=root;for(const i of path){const next=cur.childNodes[i];if(!next)return null;cur=next}return cur}
function saveSelectionSnapshot(noteId:string,text:HTMLElement){const s=window.getSelection();if(!s||!s.rangeCount)return null;const r=s.getRangeAt(0);if(!text.contains(r.startContainer)||!text.contains(r.endContainer))return null;const startPath=nodePath(text,r.startContainer),endPath=nodePath(text,r.endContainer);if(!startPath||!endPath)return null;return{noteId,startPath,startOffset:r.startOffset,endPath,endOffset:r.endOffset} as SavedSelection}
function applyFlexInlineStyle(text:HTMLElement,styles:Record<string,string>){
 const s=window.getSelection();if(!s||!s.rangeCount)return;const r=s.getRangeAt(0);if(r.collapsed||!text.contains(r.startContainer)||!text.contains(r.endContainer))return;
 try{
  const common=r.commonAncestorContainer.nodeType===Node.ELEMENT_NODE?r.commonAncestorContainer as HTMLElement:r.commonAncestorContainer.parentElement;
  const selected=r.toString(),candidate=common?.closest<HTMLElement>('span[data-planner-stroke="1"],span');
  if(candidate&&candidate.textContent===selected){if("WebkitTextStroke" in styles)candidate.dataset.plannerStroke="1";Object.assign(candidate.style,styles);const nr=document.createRange();nr.selectNodeContents(candidate);s.removeAllRanges();s.addRange(nr);return}
  const span=document.createElement("span");Object.assign(span.style,styles);if("WebkitTextStroke" in styles)span.dataset.plannerStroke="1";
  const frag=r.extractContents();if("WebkitTextStroke" in styles)frag.querySelectorAll?.("*").forEach((node:any)=>{if(node?.style){node.style.webkitTextStroke="";node.style.setProperty("-webkit-text-stroke","");node.style.paintOrder=""}if(node?.dataset?.plannerStroke)delete node.dataset.plannerStroke});
  span.appendChild(frag);r.insertNode(span);const nr=document.createRange();nr.selectNodeContents(span);s.removeAllRanges();s.addRange(nr)
 }catch{}
}

function applyFlexHighlight(text:HTMLElement,color:string){
 const s=window.getSelection();if(!s||!s.rangeCount)return;
 const r=s.getRangeAt(0);if(r.collapsed||!text.contains(r.startContainer)||!text.contains(r.endContainer))return;
 try{
  const selected=r.toString();
  const startEl=r.startContainer.nodeType===Node.ELEMENT_NODE?r.startContainer as HTMLElement:r.startContainer.parentElement;
  const endEl=r.endContainer.nodeType===Node.ELEMENT_NODE?r.endContainer as HTMLElement:r.endContainer.parentElement;

  // Limpia resaltados antiguos de spans ancestros que corresponden exactamente
  // a la selección actual. No toca borde, sombra, fuente, color ni otros estilos.
  const clearAncestor=(el:HTMLElement|null)=>{
   let cur=el?.closest<HTMLElement>("span")||null;
   while(cur&&text.contains(cur)){
    if(cur.textContent===selected){
     cur.style.backgroundColor="";
     cur.style.background="";
     cur.style.removeProperty("box-decoration-break");
     cur.style.removeProperty("-webkit-box-decoration-break");
     cur.style.removeProperty("padding");
     cur.style.removeProperty("border-radius");
     if(cur.style.display==="inline-block")cur.style.display="";
     if(cur.style.lineHeight==="1.15")cur.style.lineHeight="";
     if(cur.style.verticalAlign==="baseline")cur.style.verticalAlign="";
    }
    cur=cur.parentElement?.closest<HTMLElement>("span")||null;
   }
  };
  clearAncestor(startEl); if(endEl!==startEl)clearAncestor(endEl);

  const frag=r.extractContents();

  // Borra cualquier resaltado viejo que haya quedado anidado DENTRO de la selección.
  frag.querySelectorAll?.("span").forEach((node:any)=>{
   if(!node?.style)return;
   node.style.backgroundColor="";
   node.style.background="";
   node.style.removeProperty("box-decoration-break");
   node.style.removeProperty("-webkit-box-decoration-break");
   node.style.removeProperty("padding");
   node.style.removeProperty("border-radius");
   if(node.style.display==="inline-block")node.style.display="";
   if(node.style.lineHeight==="1.15")node.style.lineHeight="";
   if(node.style.verticalAlign==="baseline")node.style.verticalAlign="";
  });

  const isClear=!color||color==="transparent";
  let inserted:Node;

  if(isClear){
   // Chrome sabe dividir correctamente un resaltado cuando la selección
   // ocupa solo una parte de un span antiguo. Hacemos primero esa división.
   try{
    document.execCommand("styleWithCSS",false,"true");
    document.execCommand("hiliteColor",false,"transparent");
    document.execCommand("backColor",false,"transparent");
   }catch{}
   // Luego limpiamos cualquier capa de resaltado que el HTML histórico
   // haya dejado dentro de la selección actual.
   const current=window.getSelection();
   if(current&&current.rangeCount){
    const cr=current.getRangeAt(0);
    const cfrag=cr.cloneContents();
    const hasNested=!!cfrag.querySelector?.("[data-planner-highlight],span[style*='background']");
    if(!hasNested){
     const nextSaved=document.createRange();
     try{nextSaved.setStart(cr.startContainer,cr.startOffset);nextSaved.setEnd(cr.endContainer,cr.endOffset);current.removeAllRanges();current.addRange(nextSaved)}catch{}
    }
   }
   // "Sin resaltado": vuelve a insertar el contenido limpio, sin crear otra capa.
   inserted=frag;
   r.insertNode(frag);
  }else{
   // Un único resaltado nuevo, reemplazando los anteriores.
   const span=document.createElement("span");
   span.dataset.plannerHighlight="1";
   span.style.backgroundColor=color;
   span.style.display="inline-block";
   span.style.lineHeight="1.15";
   span.style.verticalAlign="baseline";
   span.style.boxDecorationBreak="clone";
   span.style.setProperty("-webkit-box-decoration-break","clone");
   span.style.padding="0 .06em";
   span.style.borderRadius=".12em";
   span.appendChild(frag);
   r.insertNode(span);
   inserted=span;
  }

  const nr=document.createRange();
  if(isClear){
   // Reselecciona por texto alrededor del punto de inserción sin alterar undo/redo.
   const parent=r.startContainer.nodeType===Node.ELEMENT_NODE?r.startContainer as Node:r.startContainer.parentNode;
   if(parent){
    const walker=document.createTreeWalker(parent,NodeFilter.SHOW_TEXT);
    let first:Node|null=null,last:Node|null=null,total="";
    let n=walker.nextNode();
    while(n){
     const t=n.textContent||"";
     if(t&&selected.includes(t.trim())&&t.trim()){if(!first)first=n;last=n;total+=t}
     n=walker.nextNode();
    }
    if(first&&last){nr.setStart(first,0);nr.setEnd(last,last.textContent?.length||0)}
    else{nr.setStart(r.startContainer,r.startOffset);nr.collapse(true)}
   }else{nr.setStart(r.startContainer,r.startOffset);nr.collapse(true)}
  }else{
   nr.selectNodeContents(inserted);
  }
  s.removeAllRanges();s.addRange(nr);
 }catch{}
}
function applyFlexFontSizePx(text:HTMLElement,value:string){
 const s=window.getSelection();if(!s||!s.rangeCount)return;
 const r=s.getRangeAt(0);if(r.collapsed||!text.contains(r.startContainer)||!text.contains(r.endContainer))return;
 const px=value.endsWith("px")?value:`${value}px`;
 try{
  const selected=r.toString();
  const startEl=r.startContainer.nodeType===Node.ELEMENT_NODE?r.startContainer as HTMLElement:r.startContainer.parentElement;
  const endEl=r.endContainer.nodeType===Node.ELEMENT_NODE?r.endContainer as HTMLElement:r.endContainer.parentElement;
  const exact=startEl?.closest<HTMLElement>("span,font");
  if(exact&&exact===endEl?.closest<HTMLElement>("span,font")&&exact.textContent===selected){
   exact.querySelectorAll<HTMLElement>("span,font,[style]").forEach(node=>{
    node.style.removeProperty("font-size");
    if(node.tagName==="FONT")node.removeAttribute("size");
   });
   exact.style.setProperty("font-size",px,"important");
   if(exact.tagName==="FONT")exact.removeAttribute("size");
   const nr=document.createRange();nr.selectNodeContents(exact);s.removeAllRanges();s.addRange(nr);return;
  }
  const frag=r.extractContents();
  frag.querySelectorAll?.("font").forEach((node:any)=>node.removeAttribute?.("size"));
  frag.querySelectorAll?.("[style]").forEach((node:any)=>node.style?.removeProperty?.("font-size"));
  const span=document.createElement("span");span.style.setProperty("font-size",px,"important");span.appendChild(frag);r.insertNode(span);
  const nr=document.createRange();nr.selectNodeContents(span);s.removeAllRanges();s.addRange(nr);
 }catch{}
}
function restoreSelectionSnapshot(text:HTMLElement,saved:SavedSelection){const start=nodeFromPath(text,saved.startPath),end=nodeFromPath(text,saved.endPath);if(!start||!end)return false;const r=document.createRange();try{r.setStart(start,Math.min(saved.startOffset,start.nodeType===Node.TEXT_NODE?(start.textContent?.length||0):start.childNodes.length));r.setEnd(end,Math.min(saved.endOffset,end.nodeType===Node.TEXT_NODE?(end.textContent?.length||0):end.childNodes.length))}catch{return false}const s=window.getSelection();if(!s)return false;s.removeAllRanges();s.addRange(r);return true}
export function FlexibleNotes(){
 const {lang}=useLanguage(); const [notes,setNotes]=useState<Note[]>([]); const [drag,setDrag]=useState<string|null>(null); const [backgroundPicker,setBackgroundPicker]=useState<string|null>(null); const fileRef=useRef<HTMLInputElement>(null); const uploadNote=useRef<string|null>(null); const selectionRef=useRef<SavedSelection|null>(null); const activeNoteRef=useRef<string|null>(null); const transformRef=useRef<{noteId:string;wrap:HTMLElement;root:HTMLElement;mode:"move"|"resize";corner:string;x:number;y:number;left:number;top:number;width:number;ratio:number}|null>(null); const selectedImageKeyRef=useRef<{noteId:string;src:string}|null>(null); const selectedImageRef=useRef<HTMLElement|null>(null); const historyRef=useRef<Record<string,{undo:string[];redo:string[]}>>({});
 useEffect(()=>{
 const loaded=read();
 if(localStorage.getItem(HIGHLIGHT_CLEANUP_KEY)!=="done"){
  const cleaned=loaded.map(n=>({...n,html:clearLegacyHighlightStyles(n.html||"")}));
  localStorage.setItem(KEY,JSON.stringify(cleaned));
  localStorage.setItem(HIGHLIGHT_CLEANUP_KEY,"done");
  setNotes(cleaned);
 }else setNotes(loaded);
},[]);
 useEffect(()=>{document.querySelectorAll<HTMLElement>(".planner-flex-free-image").forEach(w=>{w.querySelectorAll(".flex-resize-handle").forEach(h=>h.remove());w.querySelectorAll(".flex-image-delete").forEach(h=>h.remove());w.insertAdjacentHTML("beforeend",flexDeleteHandle+flexResizeHandle);w.dataset.selected=(selectedImageRef.current===w)?"true":"false"});requestAnimationFrame(()=>document.querySelectorAll<HTMLElement>("[data-flex-note-body]").forEach(root=>fitNoteHeight(root)))},[notes.map(n=>n.id).join("|")]);
 const persist=(next:Note[])=>{setNotes(next);localStorage.setItem(KEY,JSON.stringify(next))};
 const patch=(id:string,p:Partial<Note>)=>setNotes(prev=>{const next=prev.map(n=>n.id===id?{...n,...p}:n);localStorage.setItem(KEY,JSON.stringify(next));return next});
 const fitNoteHeight=(root:HTMLElement)=>{
  const card=root.closest<HTMLElement>(".planner-flex-note");
  if(card){card.style.height="auto";card.style.minHeight="0px"}
  root.style.height="auto";root.style.minHeight="0px";
  const text=root.querySelector<HTMLElement>(".planner-flex-text");
  const images=Array.from(root.querySelectorAll<HTMLElement>(".planner-flex-free-image"));
  let bottom=0;
  if(text){
   const rootRect=root.getBoundingClientRect();
   const walker=document.createTreeWalker(text,NodeFilter.SHOW_TEXT);
   let node:Node|null=walker.nextNode();
   while(node){
    if((node.textContent||"").replace(/\u200B|\u00A0/g,"").trim()){
     const r=document.createRange();
     try{
      r.selectNodeContents(node);
      Array.from(r.getClientRects()).forEach(rect=>{if(rect.width||rect.height)bottom=Math.max(bottom,rect.bottom-rootRect.top)})
     }catch{}
    }
    node=walker.nextNode();
   }
   text.querySelectorAll<HTMLElement>("img,video,canvas,svg,table,hr").forEach(el=>{
    const r=el.getBoundingClientRect();if(r.width||r.height)bottom=Math.max(bottom,r.bottom-rootRect.top)
   });
  }
  images.forEach(w=>{const top=parseFloat(w.style.top||"0")||0;bottom=Math.max(bottom,top+w.offsetHeight)});
  const compact=Math.max(96,Math.ceil(bottom+16));
  root.style.minHeight=`${compact}px`;root.style.height=`${compact}px`;
 };
 const historyFor=(id:string)=>historyRef.current[id]||(historyRef.current[id]={undo:[],redo:[]});
 const snapshot=(root:HTMLElement)=>{const text=root.querySelector<HTMLElement>(".planner-flex-text")?.innerHTML||"";const images=Array.from(root.querySelectorAll<HTMLElement>(".planner-flex-free-image")).map(x=>{const clone=x.cloneNode(true) as HTMLElement;clone.dataset.selected="false";return clone.outerHTML}).join("");return text+images};
 const pushHistory=(id:string,root:HTMLElement)=>{const h=historyFor(id),html=snapshot(root);if(h.undo[h.undo.length-1]!==html)h.undo.push(html);if(h.undo.length>60)h.undo.shift();h.redo=[]};
 const restoreHistory=(id:string,html:string)=>{const root=document.querySelector<HTMLElement>(`[data-flex-note-body="${id}"]`);if(!root)return;const parts=splitHtml(html),text=root.querySelector<HTMLElement>(".planner-flex-text"),layer=root.querySelector<HTMLElement>(".planner-flex-image-layer");if(text)text.innerHTML=parts.text;if(layer)layer.innerHTML=parts.images;fitNoteHeight(root);patch(id,{html});requestAnimationFrame(()=>{root.querySelectorAll<HTMLElement>(".planner-flex-free-image").forEach(w=>{w.querySelectorAll(".flex-resize-handle,.flex-image-delete").forEach(h=>h.remove());w.insertAdjacentHTML("beforeend",flexDeleteHandle+flexResizeHandle);w.dataset.selected="false"})})};
 const historyAction=(id:string,action:"undo"|"redo")=>{const root=document.querySelector<HTMLElement>(`[data-flex-note-body="${id}"]`);if(!root)return;const h=historyFor(id);if(action==="undo"){if(!h.undo.length)return;h.redo.push(snapshot(root));restoreHistory(id,h.undo.pop()!)}else{if(!h.redo.length)return;h.undo.push(snapshot(root));restoreHistory(id,h.redo.pop()!)}};
 useEffect(()=>{requestAnimationFrame(()=>document.querySelectorAll<HTMLElement>("[data-flex-note-body]").forEach(root=>fitNoteHeight(root)))},[notes]);
 const saveDom=(id:string,root:HTMLElement)=>{fitNoteHeight(root);const text=root.querySelector<HTMLElement>(".planner-flex-text")?.innerHTML||"";const images=Array.from(root.querySelectorAll<HTMLElement>(".planner-flex-free-image")).map(x=>{const clone=x.cloneNode(true) as HTMLElement;clone.dataset.selected="false";return clone.outerHTML}).join("");patch(id,{html:text+images})};
 const add=()=>persist([...notes,{id:crypto.randomUUID(),title:lang==="en"?"New note":"Nueva nota",date:new Date().toISOString().slice(0,10),html:"",order:notes.length,backgroundColor:"#FFFFFF"}]);
 const remove=(id:string)=>{if(transformRef.current?.noteId===id)transformRef.current=null;document.querySelectorAll<HTMLElement>(`[data-note-id="${id}"] .planner-flex-free-image`).forEach(x=>x.remove());document.querySelectorAll<HTMLElement>(".planner-flex-free-image").forEach(x=>x.dataset.selected="false");persist(notes.filter(n=>n.id!==id))};

 const overDrag=(e:React.PointerEvent)=>{if(!drag)return;const el=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>("[data-note-id]");const overId=el?.dataset.noteId;if(!overId||overId===drag)return;setNotes(prev=>{const a=[...prev].sort((x,y)=>x.order-y.order);const from=a.findIndex(n=>n.id===drag),to=a.findIndex(n=>n.id===overId);if(from<0||to<0)return prev;const[item]=a.splice(from,1);if(item)a.splice(to,0,item);return a.map((n,k)=>({...n,order:k}))})}; const endDrag=()=>{if(!drag)return;setDrag(null);persist(notes)};
 const markActive=(id:string)=>{activeNoteRef.current=id;document.body.dataset.activeFlexNoteId=id};
 const rememberSelection=(id:string)=>{const text=document.querySelector<HTMLElement>(`[data-flex-note-body="${id}"] .planner-flex-text`);if(!text)return;const saved=saveSelectionSnapshot(id,text);if(saved){markActive(id);selectionRef.current=saved}};
 useEffect(()=>{const onSelectionChange=()=>{const s=window.getSelection();if(!s||!s.rangeCount||s.isCollapsed)return;const r=s.getRangeAt(0);const startEl=r.startContainer.nodeType===Node.ELEMENT_NODE?r.startContainer as Element:r.startContainer.parentElement;const endEl=r.endContainer.nodeType===Node.ELEMENT_NODE?r.endContainer as Element:r.endContainer.parentElement;const startText=startEl?.closest<HTMLElement>(".planner-flex-text"),endText=endEl?.closest<HTMLElement>(".planner-flex-text");if(!startText||startText!==endText)return;const body=startText.closest<HTMLElement>("[data-flex-note-body]");const id=body?.dataset.flexNoteBody;if(!id)return;const saved=saveSelectionSnapshot(id,startText);if(saved){markActive(id);selectionRef.current=saved}};document.addEventListener("selectionchange",onSelectionChange);return()=>document.removeEventListener("selectionchange",onSelectionChange)},[]);
 const chooseImage=(id:string)=>{markActive(id);uploadNote.current=id;fileRef.current?.click()};
 const insertImageSrc=(id:string,src:string,left?:number,top?:number)=>{const root=document.querySelector<HTMLElement>(`[data-flex-note-body="${id}"]`);if(!root)return;pushHistory(id,root);deselectAllImages();const layer=root.querySelector<HTMLElement>(".planner-flex-image-layer");layer?.insertAdjacentHTML("beforeend",imageHtml(src));if(left!==undefined||top!==undefined){const inserted=layer?.lastElementChild as HTMLElement|null;if(inserted){if(left!==undefined)inserted.style.left=`${Math.max(0,left)}px`;if(top!==undefined)inserted.style.top=`${Math.max(0,top)}px`}}saveDom(id,root)};
 const addImage=(file?:File)=>{const id=uploadNote.current;if(!file||!id)return;const r=new FileReader();r.onload=()=>insertImageSrc(id,String(r.result));r.readAsDataURL(file)};
 useEffect(()=>{const imageHandler=(ev:Event)=>{const e=ev as FlexImageEvent;if(e.detail?.noteId&&e.detail?.src)insertImageSrc(e.detail.noteId,e.detail.src,e.detail.left,e.detail.top)};const formatHandler=(ev:Event)=>{const e=ev as FlexFormatEvent,id=activeNoteRef.current||document.body.dataset.activeFlexNoteId;if(!id||!e.detail?.command)return;const root=document.querySelector<HTMLElement>(`[data-flex-note-body="${id}"]`),text=root?.querySelector<HTMLElement>(".planner-flex-text");if(!root||!text)return;pushHistory(id,root);text.focus({preventScroll:true});const saved=selectionRef.current;if(saved?.noteId===id)restoreSelectionSnapshot(text,saved);if(e.detail.command==="fontSizePx"){applyFlexFontSizePx(text,e.detail.value||"16px")}
else if(e.detail.command==="fontSize"){document.execCommand("fontSize",false,"7");const px=SIZE_PX[e.detail.value||"3"]||"16px";text.querySelectorAll<HTMLElement>('font[size="7"]').forEach(font=>{font.removeAttribute("size");font.style.fontSize=px})}
else if(e.detail.command==="textShadow"){const n=Number(e.detail.value||0);applyFlexInlineStyle(text,{textShadow:n?`0 ${n}px ${Math.max(1,n*2)}px rgba(0,0,0,.45)`:"none"})}
else if(e.detail.command==="textStroke"){const n=Number(e.detail.value||0);localStorage.setItem("planner-flex-stroke-width",String(n));const color=localStorage.getItem("planner-flex-stroke-color")||"#111111";applyFlexInlineStyle(text,{WebkitTextStroke:n?`${n}px ${color}`:"0 transparent",paintOrder:"stroke fill"})}
else if(e.detail.command==="strokeColor"){const color=e.detail.value||"#111111";localStorage.setItem("planner-flex-stroke-color",color);const n=Number(localStorage.getItem("planner-flex-stroke-width")||1);applyFlexInlineStyle(text,{WebkitTextStroke:n?`${n}px ${color}`:"0 transparent",paintOrder:"stroke fill"})}
else if(e.detail.command==="hiliteColor"){applyFlexHighlight(text,e.detail.value||"transparent")}
else{document.execCommand(e.detail.command,false,e.detail.value)}const nextSaved=saveSelectionSnapshot(id,text);if(nextSaved)selectionRef.current=nextSaved;saveDom(id,root)};const saveHandler=()=>{const id=activeNoteRef.current||document.body.dataset.activeFlexNoteId;if(!id)return;const root=document.querySelector<HTMLElement>(`[data-flex-note-body="${id}"]`);if(root)saveDom(id,root)};const removeSelectedHandler=()=>{const id=activeNoteRef.current||document.body.dataset.activeFlexNoteId;if(!id)return;const root=document.querySelector<HTMLElement>(`[data-flex-note-body="${id}"]`);const sel=root?.querySelector<HTMLElement>('.planner-flex-free-image[data-selected="true"]');if(!root||!sel)return;sel.remove();saveDom(id,root)};window.addEventListener("planner:flex-add-image",imageHandler as EventListener);window.addEventListener("planner:flex-format",formatHandler as EventListener);window.addEventListener("planner:flex-save",saveHandler as EventListener);window.addEventListener("planner:flex-remove-selected",removeSelectedHandler as EventListener);const historyHandler=(ev:Event)=>{const e=ev as CustomEvent<{action:"undo"|"redo"}>,id=activeNoteRef.current||document.body.dataset.activeFlexNoteId;if(id&&e.detail?.action)historyAction(id,e.detail.action)};const sampleColorHandler=()=>{const id=activeNoteRef.current||document.body.dataset.activeFlexNoteId;if(!id)return;const text=document.querySelector<HTMLElement>(`[data-flex-note-body="${id}"] .planner-flex-text`),s=window.getSelection();if(!text||!s||!s.rangeCount)return;const r=s.getRangeAt(0),node=r.startContainer.nodeType===Node.ELEMENT_NODE?r.startContainer as Element:r.startContainer.parentElement;if(!node||!text.contains(node))return;const color=getComputedStyle(node).color,m=color.match(/\d+/g);if(!m||m.length<3)return;const hex="#"+m.slice(0,3).map(v=>Number(v).toString(16).padStart(2,"0")).join("").toUpperCase();window.dispatchEvent(new CustomEvent("planner:sampled-color",{detail:{color:hex}}))};window.addEventListener("planner:flex-history",historyHandler as EventListener);window.addEventListener("planner:flex-sample-color",sampleColorHandler as EventListener);return()=>{window.removeEventListener("planner:flex-add-image",imageHandler as EventListener);window.removeEventListener("planner:flex-format",formatHandler as EventListener);window.removeEventListener("planner:flex-save",saveHandler as EventListener);window.removeEventListener("planner:flex-remove-selected",removeSelectedHandler as EventListener);window.removeEventListener("planner:flex-history",historyHandler as EventListener);window.removeEventListener("planner:flex-sample-color",sampleColorHandler as EventListener)}},[]);
 const startTransform=(noteId:string,e:React.PointerEvent<HTMLDivElement>)=>{markActive(noteId);const prev=transformRef.current;if(prev){prev.wrap.style.zIndex="";prev.wrap.style.filter="";prev.wrap.style.opacity="";saveDom(prev.noteId,prev.root);transformRef.current=null}const target=e.target as HTMLElement;const wrap=target.closest<HTMLElement>(".planner-flex-free-image");const root=e.currentTarget;if(!wrap){deselectAllImages();return;}pushHistory(noteId,root);e.preventDefault();e.stopPropagation();if(target.dataset.action==="delete"){wrap.remove();saveDom(noteId,root);return;}document.querySelectorAll<HTMLElement>(".planner-flex-free-image,.planner-free-image").forEach(x=>x.dataset.selected="false");window.getSelection()?.removeAllRanges();wrap.dataset.selected="true";selectedImageRef.current=wrap;selectedImageKeyRef.current={noteId,src:wrap.querySelector<HTMLImageElement>("img")?.src||""};e.preventDefault();e.stopPropagation();const rect=wrap.getBoundingClientRect(),img=wrap.querySelector("img") as HTMLImageElement|null;transformRef.current={noteId,wrap,root,mode:target.dataset.resize?"resize":"move",corner:target.dataset.resize||"",x:e.clientX,y:e.clientY,left:parseFloat(wrap.style.left)||0,top:parseFloat(wrap.style.top)||0,width:rect.width,ratio:img?.naturalWidth&&img?.naturalHeight?img.naturalWidth/img.naturalHeight:rect.width/Math.max(rect.height,1)};root.setPointerCapture?.(e.pointerId)};
 const moveTransform=(e:React.PointerEvent<HTMLDivElement>)=>{const t=transformRef.current;if(!t)return;e.preventDefault();e.stopPropagation();const dx=e.clientX-t.x,dy=e.clientY-t.y;if(t.mode==="move"){const rootRect=t.root.getBoundingClientRect(),wrapRect=t.wrap.getBoundingClientRect();const maxLeft=Math.max(0,rootRect.width-wrapRect.width),maxTop=Math.max(0,rootRect.height-wrapRect.height);const nextLeft=Math.min(Math.max(0,t.left+dx),maxLeft),nextTop=Math.min(Math.max(0,t.top+dy),maxTop);t.wrap.style.left=`${nextLeft}px`;t.wrap.style.top=`${nextTop}px`;}else{const west=t.corner.includes("w"),north=t.corner.includes("n");const width=Math.max(55,t.width+(west?-dx:dx));t.wrap.style.width=`${width}px`;t.wrap.style.left=`${west?t.left+(t.width-width):t.left}px`;t.wrap.style.top=`${Math.max(0,north?t.top+(t.width-width)/t.ratio:t.top)}px`;}};
 const endTransform=(e?:React.PointerEvent<HTMLDivElement>)=>{const t=transformRef.current;if(!t)return;if(e){e.stopPropagation();try{t.root.releasePointerCapture?.(e.pointerId)}catch{/* ignore */}}if(t.mode==="move"&&e){const prevPE=t.wrap.style.pointerEvents;t.wrap.style.pointerEvents="none";const dropEl=document.elementFromPoint(e.clientX,e.clientY) as HTMLElement|null;t.wrap.style.pointerEvents=prevPE;const dropNote=dropEl?.closest<HTMLElement>("[data-flex-note-body]");const dropNoteId=dropNote?.dataset.flexNoteBody;if(dropNote&&dropNoteId&&dropNoteId!==t.noteId){const layer=dropNote.querySelector<HTMLElement>(".planner-flex-image-layer");if(layer){const oldRect=t.wrap.getBoundingClientRect(),newRect=dropNote.getBoundingClientRect();const width=Math.min(t.wrap.getBoundingClientRect().width,Math.max(80,newRect.width-24));layer.appendChild(t.wrap);document.querySelectorAll<HTMLElement>(".planner-flex-free-image,.planner-free-image").forEach(x=>x.dataset.selected="false");t.wrap.style.width=`${width}px`;t.wrap.style.left=`${Math.min(Math.max(0,oldRect.left-newRect.left),Math.max(0,newRect.width-width))}px`;t.wrap.style.top=`${Math.max(0,oldRect.top-newRect.top)}px`;t.wrap.dataset.selected="true";const movedSrc=t.wrap.querySelector<HTMLImageElement>("img")?.src||"";saveDom(t.noteId,t.root);saveDom(dropNoteId,dropNote);markActive(dropNoteId);transformRef.current=null;requestAnimationFrame(()=>{const card=document.querySelector<HTMLElement>(`[data-note-id="${dropNoteId}"]`);const found=card?Array.from(card.querySelectorAll<HTMLElement>(".planner-flex-free-image")).find(w=>(w.querySelector<HTMLImageElement>("img")?.src||"")===movedSrc):undefined;if(found){document.querySelectorAll<HTMLElement>(".planner-flex-free-image").forEach(x=>x.dataset.selected="false");found.dataset.selected="true";selectedImageRef.current=found}});return}}const dropBox=dropEl?.closest<HTMLElement>("[data-box-id]");if(dropBox){const boxId=dropBox.dataset.boxId;const img=t.wrap.querySelector("img") as HTMLImageElement|null;if(boxId&&img){const oldRect=t.wrap.getBoundingClientRect(),newRect=dropBox.getBoundingClientRect();const left=Math.max(0,oldRect.left-newRect.left+dropBox.scrollLeft),top=Math.max(0,oldRect.top-newRect.top+dropBox.scrollTop);window.dispatchEvent(new CustomEvent("planner:base-add-image",{detail:{box:boxId,src:img.src,left,top}}));t.wrap.remove();saveDom(t.noteId,t.root);transformRef.current=null;return}}}const selectedSrc=t.wrap.querySelector<HTMLImageElement>("img")?.src||"";saveDom(t.noteId,t.root);transformRef.current=null;requestAnimationFrame(()=>{const card=document.querySelector<HTMLElement>(`[data-note-id="${t.noteId}"]`);if(!card)return;document.querySelectorAll<HTMLElement>(".planner-flex-free-image").forEach(x=>x.dataset.selected="false");const found=Array.from(card.querySelectorAll<HTMLElement>(".planner-flex-free-image")).find(w=>(w.querySelector<HTMLImageElement>("img")?.src||"")===selectedSrc);if(found){found.dataset.selected="true";selectedImageRef.current=found}});
};
 const print=(e:React.MouseEvent)=>{const card=(e.currentTarget as HTMLElement).closest("article");if(!card)return;document.body.dataset.printMode="single-flex-note";card.setAttribute("data-print-selected","true");window.print();setTimeout(()=>{delete document.body.dataset.printMode;card.removeAttribute("data-print-selected")},500)};
 return <section className="mt-8 border-t border-border pt-6"><style>{`.planner-flex-note{overflow:visible!important}.planner-flex-note-body{overflow:visible!important;isolation:isolate}.planner-flex-text{position:relative;z-index:2;min-height:0;white-space:pre-wrap;direction:ltr;text-align:left;user-select:text;-webkit-user-select:text;cursor:text}.planner-flex-text:empty:before{content:attr(data-placeholder);color:hsl(var(--muted-foreground));pointer-events:none}.planner-flex-image-layer{position:absolute;inset:0;pointer-events:none;z-index:10}.planner-flex-free-image{pointer-events:auto;touch-action:none;-webkit-user-select:none;user-select:none;border:2px solid transparent;border-radius:14px;box-sizing:border-box}.planner-flex-free-image img{cursor:move;touch-action:none;-webkit-user-drag:none}.planner-flex-free-image[data-selected="true"]{border-color:#df9b82;outline:none!important}.planner-flex-free-image .flex-resize-handle,.planner-flex-free-image .flex-image-delete{display:none}.planner-flex-free-image[data-selected="true"] .flex-resize-handle,.planner-flex-free-image[data-selected="true"] .flex-image-delete{display:flex}.flex-resize-handle{position:absolute;right:-9px;bottom:-9px;width:20px;height:20px;border:2px solid #fff;background:#df9b82;border-radius:999px;z-index:8;cursor:nwse-resize;box-shadow:0 1px 3px rgba(0,0,0,.18)}.flex-image-delete{position:absolute;right:-11px;top:-13px;width:28px;height:28px;padding:0;border:1px solid #ead3ca;border-radius:999px;background:#fff;color:#d56f61;align-items:center;justify-content:center;font-size:14px;line-height:1;z-index:9;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.15)}.planner-flex-free-image[data-selected="true"] img{cursor:move}.flex-resize-handle[data-resize="nw"],.flex-resize-handle[data-resize="se"]{cursor:nwse-resize}.flex-resize-handle[data-resize="ne"],.flex-resize-handle[data-resize="sw"]{cursor:nesw-resize}.planner-flex-grip{touch-action:none}@media print{.planner-flex-free-image{pointer-events:auto;outline:none!important}.flex-resize-handle,.flex-image-delete{display:none!important}}`}</style><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-display text-xl font-bold">{lang==="en"?"My dated notes":"Mis notas con fecha"}</h2><p className="text-sm text-muted-foreground">{lang==="en"?"Square cards you can date, move and reorder.":"Tarjetas cuadradas que podés fechar, subir, bajar y reordenar."}</p></div><Button onClick={add}><Plus className="h-4 w-4"/>{lang==="en"?"New note":"Nueva nota"}</Button></div><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e=>{addImage(e.target.files?.[0]);e.currentTarget.value=""}}/><div className="grid items-start gap-8 sm:grid-cols-2" onPointerDown={e=>{if(!(e.target as HTMLElement).closest(".planner-flex-free-image")){document.querySelectorAll<HTMLElement>(".planner-flex-free-image").forEach(x=>x.dataset.selected="false");selectedImageRef.current=null}}}>{[...notes].sort((a,b)=>a.date.localeCompare(b.date)||a.order-b.order).map(n=>{const parts=splitHtml(n.html);return <article key={n.id} data-note-id={n.id} onPointerMove={overDrag} onPointerUp={endDrag} onPointerCancel={endDrag} style={{backgroundColor:n.backgroundColor||"#FFFFFF"}} className="planner-flex-note self-start rounded-2xl border border-border shadow-sm"><header onPointerDown={()=>markActive(n.id)} className="flex flex-wrap items-center gap-2 border-b border-border bg-white/35 p-3"><span className="planner-flex-grip cursor-grab touch-none" title={lang==="en"?"Drag note":"Arrastrar nota"} onPointerDown={e=>{e.stopPropagation();setDrag(n.id);(e.target as HTMLElement).setPointerCapture?.(e.pointerId)}}><GripVertical className="h-5 w-5 text-muted-foreground"/></span><input value={n.title} onChange={e=>patch(n.id,{title:e.target.value})} className="min-w-[120px] flex-1 bg-transparent font-bold outline-none"/><CalendarDays className="h-4 w-4 text-muted-foreground"/><input type="date" value={n.date} onChange={e=>{const date=e.target.value;setNotes(prev=>{const changed=prev.map(x=>x.id===n.id?{...x,date}:x);const sorted=[...changed].sort((a,b)=>a.date.localeCompare(b.date)||a.order-b.order).map((x,i)=>({...x,order:i}));localStorage.setItem(KEY,JSON.stringify(sorted));return sorted})}} className="rounded-lg border border-border bg-card px-2 py-1 text-sm"/><div className="ml-auto flex flex-wrap gap-1 print:hidden"><div className="relative"><Button size="sm" variant="ghost" title={lang==="en"?"Note background":"Fondo de la nota"} onClick={()=>{markActive(n.id);setBackgroundPicker(backgroundPicker===n.id?null:n.id)}}><Palette className="h-4 w-4"/><span className="ml-1 hidden sm:inline">{lang==="en"?"Background":"Fondo"}</span></Button>{backgroundPicker===n.id&&<div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-xl border border-border bg-card p-3 shadow-xl"><div className="mb-2 text-xs font-semibold">{lang==="en"?"Note background":"Fondo de la nota"}</div><div className="flex flex-wrap gap-2">{NOTE_BACKGROUNDS.map(c=><button key={c} type="button" title={c} aria-label={`Fondo ${c}`} className="h-8 w-8 rounded-full border border-border shadow-sm" style={{backgroundColor:c}} onClick={()=>{patch(n.id,{backgroundColor:c});setBackgroundPicker(null)}}/>)}</div><label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"><span className="h-5 w-5 rounded-full border" style={{background:"conic-gradient(red,yellow,lime,cyan,blue,magenta,red)"}}></span>{lang==="en"?"More colors":"Más colores"}<input type="color" className="h-0 w-0 opacity-0" value={n.backgroundColor||"#FFFFFF"} onChange={e=>patch(n.id,{backgroundColor:e.target.value})}/></label></div>}</div><Button size="icon" variant="ghost" onClick={()=>chooseImage(n.id)}><ImagePlus className="h-4 w-4"/></Button><Button size="icon" variant="ghost" onClick={print}><Printer className="h-4 w-4"/></Button><Button size="icon" variant="ghost" onClick={()=>remove(n.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div></header><div data-flex-note-body={n.id} onPointerDown={e=>{const target=e.target as HTMLElement;if(!target.closest(".planner-flex-free-image")){document.querySelectorAll<HTMLElement>(".planner-flex-free-image").forEach(x=>x.dataset.selected="false");selectedImageRef.current=null;selectedImageKeyRef.current=null}startTransform(n.id,e)}} onPointerMove={moveTransform} onPointerUp={endTransform} onPointerCancel={endTransform} className="planner-flex-note-body relative p-4"><div key={`${n.id}-text`} className="planner-flex-text outline-none" contentEditable suppressContentEditableWarning dir="ltr" onFocus={()=>markActive(n.id)} onMouseUp={()=>rememberSelection(n.id)} onKeyUp={()=>rememberSelection(n.id)} onBeforeInput={e=>{const root=e.currentTarget.parentElement;if(root)pushHistory(n.id,root)}} onInput={e=>{const root=e.currentTarget.parentElement;if(!root)return;fitNoteHeight(root);const text=root.querySelector<HTMLElement>(".planner-flex-text")?.innerHTML||"";const images=Array.from(root.querySelectorAll<HTMLElement>(".planner-flex-free-image")).map(x=>{const clone=x.cloneNode(true) as HTMLElement;clone.dataset.selected="false";return clone.outerHTML}).join("");const html=text+images;const next=read().map(note=>note.id===n.id?{...note,html}:note);localStorage.setItem(KEY,JSON.stringify(next))}} onBlur={e=>{const root=e.currentTarget.parentElement;if(root)saveDom(n.id,root)}} dangerouslySetInnerHTML={{__html:parts.text}} data-placeholder={lang==="en"?"Write here…":"Escribí acá…"}/><div className="planner-flex-image-layer" dangerouslySetInnerHTML={{__html:parts.images}} /></div></article>})}</div></section>;
}
