"""Convert a supplied Windows ANI/CUR pack to lossless web sprites and native fallbacks.
The installer is never extracted or executed. Source hotspots and ANI rate/sequence survive.
"""
import io
import json
import struct
import sys
import zipfile
from pathlib import Path
from PIL import IcoImagePlugin, Image

def chunks(data, start=0):
    while start + 8 <= len(data):
        tag = data[start:start + 4]
        size = struct.unpack_from('<I', data, start + 4)[0]
        yield tag, data[start + 8:start + 8 + size]
        start += 8 + size + size % 2

def decode_cur(data):
    reserved, kind, count = struct.unpack_from('<HHH', data)
    if reserved or kind != 2 or count < 1:
        raise ValueError('Expected a Windows cursor')
    # Pillow's ICO reader handles indexed DIB palettes and their AND transparency mask.
    converted = bytearray(data)
    struct.pack_into('<H', converted, 2, 1)
    for index in range(count):
        pos = 6 + index * 16
        offset = struct.unpack_from('<I', data, pos + 12)[0]
        bits = struct.unpack_from('<H', data, offset + 14)[0]
        struct.pack_into('<HH', converted, pos + 4, 1, bits)
    icon = IcoImagePlugin.IcoFile(io.BytesIO(converted))
    size = max(icon.sizes(), key=lambda size:size[0]*size[1])
    entry = next(6 + i*16 for i in range(count)
                 if (data[6+i*16] or 256, data[7+i*16] or 256) == size)
    hot_x, hot_y = struct.unpack_from('<HH', data, entry + 4)
    return icon.getimage(size).convert('RGBA'), hot_x, hot_y

def convert(source, destination):
    destination.mkdir(parents=True, exist_ok=True)
    result = {}
    with zipfile.ZipFile(source) as archive:
        for entry in archive.infolist():
            if Path(entry.filename).suffix.lower() not in ('.ani', '.cur'):
                continue
            name = Path(entry.filename).stem.lower()
            raw = archive.read(entry)
            frames, rates, sequence, default_rate = [], [], [], 6
            if raw[:4] == b'RIFF' and raw[8:12] == b'ACON':
                for tag, payload in chunks(raw, 12):
                    if tag == b'anih':
                        header = struct.unpack_from('<9I', payload)
                        default_rate = header[7]
                    elif tag in (b'rate', b'seq '):
                        values = list(struct.unpack('<'+'I'*(len(payload)//4),payload))
                        if tag == b'rate': rates = values
                        else: sequence = values
                    elif tag == b'LIST' and payload[:4] == b'fram':
                        frames.extend(frame for kind, frame in chunks(payload,4) if kind == b'icon')
            else:
                frames = [raw]
            if not frames:
                raise ValueError(f'No cursor frames in {entry.filename}')
            decoded = [decode_cur(frame) for frame in frames]
            cell_w = max(frame.width for frame,_,_ in decoded)
            cell_h = max(frame.height for frame,_,_ in decoded)
            atlas = Image.new('RGBA',(cell_w*len(frames),cell_h))
            bounds = []
            for index,(image,hot_x,hot_y) in enumerate(decoded):
                atlas.paste(image,(index*cell_w,0))
                bounds.append(dict(x=index*cell_w,y=0,width=image.width,height=image.height,hotX=hot_x,hotY=hot_y))
            atlas.save(destination / f'{name}.png', optimize=True)
            (destination / f'{name}.cur').write_bytes(frames[0])
            sequence = sequence or list(range(len(frames)))
            steps = [dict(frame=frame,duration=max(16.667,(rates[i] if i<len(rates) else default_rate)*1000/60)) for i,frame in enumerate(sequence)]
            if any(step['frame']>=len(frames) for step in steps):
                raise ValueError('Invalid ANI sequence')
            result[name] = dict(frames=bounds,steps=steps)
    (destination / 'manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps({name:dict(frames=len(item['frames']),hotspot=[item['frames'][0]['hotX'],item['frames'][0]['hotY']],duration=sum(step['duration'] for step in item['steps'])) for name,item in result.items()},indent=2))

if __name__ == '__main__':
    convert(Path(sys.argv[1]),Path(sys.argv[2]))
