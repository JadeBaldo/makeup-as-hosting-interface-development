// Both manual controls and gestures use the same fresh-title reset.
export function createInteraction(state,{resetTitle,clearStrokes,finishDrawing}){
 return {
  frame(pose,trace,dt,{navigationAllowed=true}={}){
   const navigated=state.gesture(pose==='open'&&!navigationAllowed?'blocked':pose,dt);
   if(navigated)resetTitle();
   const drawing=pose==='pointing'&&!navigated?trace:null;
   if(!drawing)finishDrawing();
   state.tick(dt,drawing);
   return {trace:drawing,mapped:state.control(drawing),navigated};
  },
  advance(direction=1){state.advance(direction);resetTitle();},
  select(index){state.index=index;state.reset();resetTitle();},
  clear(){clearStrokes();finishDrawing();},
  reset(){clearStrokes();state.reset();resetTitle();},
 };
}
