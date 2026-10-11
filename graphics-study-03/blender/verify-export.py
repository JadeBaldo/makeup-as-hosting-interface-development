"""Validate the browser asset without requiring a Blender process."""
import json,struct,math
from pathlib import Path
path=Path(__file__).resolve().parent/'output'/'altered-r-shapes.glb'
data=path.read_bytes();magic,version,size=struct.unpack_from('<III',data)
assert magic==0x46546c67 and version==2 and size==len(data)
length,kind=struct.unpack_from('<II',data,12);assert kind==0x4e4f534a
doc=json.loads(data[20:20+length]);offset=20+length
blen,bkind=struct.unpack_from('<II',data,offset);assert bkind==0x004e4942
binary=data[offset+8:offset+8+blen]
def values(index):
 a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']];n={'SCALAR':1,'VEC3':3}[a['type']]
 assert a['componentType']==5126
 start=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',n*4)
 return [struct.unpack_from('<'+'f'*n,binary,start+i*stride) for i in range(a['count'])]
count=0
for mesh in doc['meshes']:
 assert mesh['extras']['targetNames']==['Stretched','Collapsed']
 for p in mesh['primitives']:
  rest=values(p['attributes']['POSITION']);count+=len(rest)
  assert all(math.isfinite(v) for xyz in rest for v in xyz)
  assert len(p['targets'])==2
  for target in p['targets']:
   delta=values(target['POSITION']);assert len(delta)==len(rest)
   assert all(math.isfinite(v) for xyz in delta for v in xyz)
   assert max(abs(v) for xyz in delta for v in xyz)>.005
print(f'PASS GLB: {len(doc["meshes"])} meshes, {count} exported vertices, two matching nonzero finite morph targets, {len(data)/1024/1024:.2f} MB')
