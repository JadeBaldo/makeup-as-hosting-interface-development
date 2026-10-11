"""Local reference sampling. Optical flow measures screen motion, not material physics."""
from pathlib import Path
import json, csv
import cv2
import numpy as np
ROOT=Path(__file__).resolve().parent
desktop=Path.home()/'Desktop'; recordings=Path.home()/'Videos'/'Grabaciones de pantalla'
clips=[('jelly',next(desktop.glob('*204932.mp4'))),('softness',next(recordings.glob('*180540.mp4'))),('bubbles',next(desktop.glob('*bubbles*.mp4')))]
report=[]
for name,path in clips:
 cap=cv2.VideoCapture(str(path));fps=cap.get(cv2.CAP_PROP_FPS);duration=cap.get(cv2.CAP_PROP_FRAME_COUNT)/fps
 rows=[];previous=None;contacts=[]
 for i in range(int(duration*12)):
  t=i/12;cap.set(cv2.CAP_PROP_POS_MSEC,t*1000);ok,frame=cap.read()
  if not ok:break
  resized=cv2.resize(frame,(360,round(frame.shape[0]*360/frame.shape[1])))
  hsv=cv2.cvtColor(resized,cv2.COLOR_BGR2HSV)
  # Saturated cool material only; excludes white captions and neutral scenery.
  mask=cv2.inRange(hsv,np.array([85,80,35]),np.array([165,255,255]))
  count,labels,stats,centroids=cv2.connectedComponentsWithStats(mask)
  if count>1:
   idx=1+np.argmax(stats[1:,cv2.CC_STAT_AREA]);x,y,w,h,area=stats[idx];cx,cy=centroids[idx]
   objectmask=(labels==idx).astype(np.uint8)*255
  else:x=y=w=h=area=cx=cy=0;objectmask=mask
  gray=cv2.cvtColor(resized,cv2.COLOR_BGR2GRAY)
  flow_mean=0;difference=0
  if previous is not None:
   difference=float(np.mean(cv2.absdiff(gray,previous)))
   flow=cv2.calcOpticalFlowFarneback(previous,gray,None,.5,3,15,3,5,1.2,0)
   magnitude=np.linalg.norm(flow,axis=2)
   if area:flow_mean=float(np.median(magnitude[objectmask>0]))
  rows.append({'seconds':round(t,3),'width_px':int(w),'height_px':int(h),'area_px':int(area),'centroid_x':float(cx),'centroid_y':float(cy),'flow_px_per_sample':flow_mean,'frame_difference':difference})
  previous=gray
 for i in range(12):
  t=duration*i/12;cap.set(cv2.CAP_PROP_POS_MSEC,t*1000);ok,frame=cap.read()
  if ok:
   # Fit rather than stretch portrait footage.
   canvas=np.zeros((320,400,3),np.uint8);scale=min(400/frame.shape[1],288/frame.shape[0]);im=cv2.resize(frame,(round(frame.shape[1]*scale),round(frame.shape[0]*scale)))
   left=(400-im.shape[1])//2;canvas[32:32+im.shape[0],left:left+im.shape[1]]=im
   cv2.putText(canvas,f'{name} {t:.2f}s',(8,23),cv2.FONT_HERSHEY_SIMPLEX,.55,(240,240,240),1);contacts.append(canvas)
 cv2.imwrite(str(ROOT/f'{name}-sampled.jpg'),np.vstack([np.hstack(contacts[i:i+4]) for i in range(0,12,4)]))
 with (ROOT/f'{name}-screen-motion.csv').open('w',newline='') as f:
  writer=csv.DictWriter(f,fieldnames=rows[0].keys());writer.writeheader();writer.writerows(rows)
 report.append({'name':name,'source':str(path),'duration_seconds':duration,'sample_fps':12,'samples':len(rows),'warning':'Screen-space metrics include camera motion, highlights, cropping and editing. They do not recover forces, viscosity or 3D geometry.'})
 cap.release()
(ROOT/'analysis-report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
