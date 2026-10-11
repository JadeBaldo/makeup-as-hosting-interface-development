// One full local-Y turn every six minutes; independent of drawing and slides.
// Small fixed offsets keep adjacent glyphs from rotating as one rigid block.
export const LETTER_ROTATION_SECONDS=360;
export function letterRotation(seconds,index=0){
 return {x:0,y:seconds*Math.PI*2/LETTER_ROTATION_SECONDS+Math.sin(index*2.399963)*.12,z:0};
}
