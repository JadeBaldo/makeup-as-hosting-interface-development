from pathlib import Path
import urllib.request,subprocess,sys,time,webbrowser
root=Path(__file__).resolve().parent.parent
url='http://127.0.0.1:8772/'+Path(__file__).resolve().parent.name+'/'
try:
 urllib.request.urlopen(url,timeout=2).close()
except Exception:
 subprocess.Popen([sys.executable,'-m','http.server','8772','--bind','127.0.0.1','--directory',str(root)],creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
 for i in range(30):
  try:urllib.request.urlopen(url,timeout=.5).close();break
  except Exception:time.sleep(.1)
 else:raise SystemExit('Could not start the study server on port 8772. Check whether another project uses that port.')
webbrowser.open(url)

