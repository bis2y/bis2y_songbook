(() => {
  "use strict";
  const STORAGE_KEY = "bis2y-song-manager-v1";
  const original = Array.isArray(window.SONGS) ? window.SONGS.map(x => ({...x})) : [];
  let songs;
  try { songs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || original; } catch { songs = original; }

  const body = document.querySelector("#managerBody");
  const count = document.querySelector("#managerCount");
  const toast = document.querySelector("#toast");
  const form = document.querySelector("#songForm");
  let timer;

  function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(songs)); }
  function show(message){ toast.textContent=message;toast.classList.add("show");clearTimeout(timer);timer=setTimeout(()=>toast.classList.remove("show"),2000); }
  function esc(value){ return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function render(){
    count.textContent = songs.length;
    body.innerHTML = songs.map((song,i)=>`<tr><td><strong>${esc(song.title)}</strong></td><td>${esc(song.artist)}</td><td>${esc(song.genre)}</td><td>${song.recommended?'✦':'-'}</td><td>${song.isNew?'✦ NEW':'-'}</td><td><button class="small-delete" data-index="${i}" type="button">삭제</button></td></tr>`).join("");
  }
  function download(name, content, type="text/plain;charset=utf-8"){
    const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);
  }
  function csvCell(v){ const s=String(v??""); return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; }
  function parseCsv(text){
    const rows=[];let row=[],cell="",quoted=false;
    for(let i=0;i<text.length;i++){const ch=text[i],next=text[i+1];if(ch==='"'&&quoted&&next==='"'){cell+='"';i++;}else if(ch==='"'){quoted=!quoted;}else if(ch===','&&!quoted){row.push(cell);cell="";}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&next==='\n')i++;row.push(cell);if(row.some(x=>x.trim()!==""))rows.push(row);row=[];cell="";}else cell+=ch;}
    row.push(cell);if(row.some(x=>x.trim()!==""))rows.push(row);return rows;
  }

  form.addEventListener("submit", e=>{e.preventDefault();const song={title:document.querySelector("#title").value.trim(),artist:document.querySelector("#artist").value.trim(),genre:document.querySelector("#genre").value.trim(),recommended:document.querySelector("#recommended").checked,isNew:document.querySelector("#isNew").checked};if(!song.title||!song.artist||!song.genre)return;songs.push(song);songs.sort((a,b)=>a.artist.localeCompare(b.artist,"ko")||a.title.localeCompare(b.title,"ko"));save();render();form.reset();show("노래를 추가했어요.");});
  body.addEventListener("click", e=>{const btn=e.target.closest("[data-index]");if(!btn)return;songs.splice(Number(btn.dataset.index),1);save();render();show("삭제했어요.");});
  document.querySelector("#downloadJs").addEventListener("click",()=>{const content=`// 빗시 노래책 데이터\nwindow.SONGS = ${JSON.stringify(songs,null,2)};\n`;download("songs.js",content,"text/javascript;charset=utf-8");show("songs.js를 내려받았어요.");});
  document.querySelector("#downloadCsv").addEventListener("click",()=>{const csv=["title,artist,genre,recommended,isNew",...songs.map(s=>[s.title,s.artist,s.genre,s.recommended,s.isNew].map(csvCell).join(","))].join("\n");download("bis2y-songs.csv","\uFEFF"+csv,"text/csv;charset=utf-8");});
  document.querySelector("#csvInput").addEventListener("change",async e=>{const file=e.target.files?.[0];if(!file)return;const rows=parseCsv(await file.text());const start=rows[0]?.[0]?.toLowerCase()==="title"?1:0;const imported=rows.slice(start).filter(r=>r.length>=3).map(r=>({title:r[0].trim(),artist:r[1].trim(),genre:r[2].trim(),recommended:String(r[3]).trim().toLowerCase()==="true",isNew:String(r[4]).trim().toLowerCase()==="true"})).filter(s=>s.title&&s.artist&&s.genre);if(!imported.length){show("불러올 노래가 없어요.");return;}songs=imported;save();render();show(`${songs.length}곡을 불러왔어요.`);e.target.value="";});
  document.querySelector("#resetSongs").addEventListener("click",()=>{songs=original.map(x=>({...x}));save();render();show("처음 목록으로 되돌렸어요.");});
  render();
})();
