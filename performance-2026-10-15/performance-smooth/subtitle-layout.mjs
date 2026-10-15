// Fit all slide text into at most two lines using the same font metrics in screen and capture.
export function subtitleLayout(text,width,requestedSize,ctx){
 const content=text.replace(/\s+/g,' ').trim();
 function wrap(size){
  ctx.font=`italic ${size}px Georgia, "Times New Roman", serif`;
  const lines=[];let line='';
  for(const word of content.split(' ')){
   const next=line?line+' '+word:word;
   if(ctx.measureText(next).width<=width){line=next;continue;}
   if(line){lines.push(line);line='';}
   for(const char of word){
    if(line&&ctx.measureText(line+char).width>width){lines.push(line);line='';}
    line+=char;
   }
  }
  if(line)lines.push(line);
  return lines;
 }
 let size=Math.max(1,Number(requestedSize)||22),lines=wrap(size);
 while(lines.length>2&&size>1){size=Math.max(1,size-.5);lines=wrap(size);}
 return {size,lines};
}
