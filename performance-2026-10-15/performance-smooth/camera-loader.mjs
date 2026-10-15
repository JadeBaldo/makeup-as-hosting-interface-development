let pending;
export function loadCameraTrackers(){
 if(pending)return pending;
 pending=(async()=>{let handTracker,faceTracker;try{
  const {FilesetResolver,HandLandmarker,FaceLandmarker}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/vision_bundle.mjs');
  const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm');
  handTracker=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'},runningMode:'VIDEO',numHands:1});
  faceTracker=await FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'},runningMode:'VIDEO',numFaces:1});
  return {handTracker,faceTracker};
 }catch(error){handTracker?.close();faceTracker?.close();pending=undefined;throw error;}})();
 return pending;
}
export function cameraError(error){
 const advice={NotAllowedError:'Camera permission was blocked. Allow camera access in the browser site settings, then click Start webcam again.',NotFoundError:'No camera is available. Connect or enable a camera, then retry.',NotReadableError:'The camera could not start. Close other apps or tabs using it, then retry.',OverconstrainedError:'The requested camera settings are unavailable. Try another camera.'};
 return advice[error.name]||`Camera/tracking setup failed: ${error.message}. Check the connection and retry. Rehearsal remains available.`;
}
