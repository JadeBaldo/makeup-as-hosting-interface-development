const KEY='altered-images-programme-v1';
export function validProgramme(value){
 return Array.isArray(value)&&value.length>0&&value.length<=100&&value.every(s=>s&&typeof s.title==='string'&&s.title.trim().length>0&&s.title.length<=200&&typeof s.subtitle==='string'&&s.subtitle.length<=200);
}
export function loadProgramme(defaults,storage){
 try{storage=storage||globalThis.localStorage;const saved=JSON.parse(storage.getItem(KEY));if(validProgramme(saved))return saved.map(s=>({title:s.title,subtitle:s.subtitle}));}catch{}
 return defaults.map(s=>({...s}));
}
export function saveProgramme(slides,storage=globalThis.localStorage){
 if(!validProgramme(slides))throw Error('Use 1–100 slides, with a title and up to 200 characters per field.');
 storage.setItem(KEY,JSON.stringify(slides));
}
