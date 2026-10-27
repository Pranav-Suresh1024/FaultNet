"""Match synthetic loopback requests to validated probes; never publish the capture."""
from pathlib import Path
from datetime import datetime
import csv, json, statistics as st, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
TMP=ROOT/'.codex/final-report'
OUT=ROOT/'docs/reports/evidence'
OUT.mkdir(parents=True,exist_ok=True)
fields=['frame.number','frame.time_epoch','tcp.stream','tcp.srcport','tcp.dstport','tcp.len',
        'http.request.method','http.request.uri','http.response.code','http.time','http.request_in','http.response_in']
command=['C:/Program Files/Wireshark/tshark.exe','-r',str(TMP/'evaluation.pcapng'),
         '-d','tcp.port==3002,http','-d','tcp.port==3001,http','-d','tcp.port==8080,http','-T','fields']
for field in fields:command+=['-e',field]
with (TMP/'packets.tsv').open('w') as output:
    subprocess.run(command,stdout=output,check=True)
rows=[]
with (TMP/'packets.tsv').open() as f:
    for values in csv.reader(f,delimiter='\t'):
        if len(values)!=len(fields):raise ValueError('Unexpected packet field count')
        row=dict(zip(fields,values))
        row['epoch']=float(row['frame.time_epoch']);rows.append(row)
assert rows and len({r['frame.number'] for r in rows})==len(rows)
streams={}
for row in rows:streams.setdefault(row['tcp.stream'],[]).append(row)
requests=[r for r in rows if r['http.request.method']=='GET' and r['tcp.dstport']=='3002' and r['http.request.uri']=='/payload']
raw=json.loads((TMP/'evaluation.json').read_text())
matches=[]
for scenario in ['delay-500','delay-1500','bandwidth-32']:
    for trial in [r for r in raw['runs'] if r['scenario']==scenario]:
        pairs=[]
        for probe in [o for o in trial['record']['observations'] if o['phase']=='faulty']:
            start=datetime.fromisoformat(probe['startedAt'].replace('Z','+00:00')).timestamp()
            candidates=[r for r in requests if -.001<=r['epoch']-start<.1]
            if len(candidates)!=1:break
            request=candidates[0]
            packets=streams[request['tcp.stream']]
            responses=[r for r in packets if r['http.request_in']==request['frame.number'] and r['http.response.code']=='200']
            data=[r for r in packets if r['tcp.srcport']=='3002' and int(r['tcp.len'] or 0)>0 and r['epoch']>=request['epoch']]
            if len(responses)!=1 or not data:break
            response=responses[0]
            interval=(response['epoch']-request['epoch'])*1000
            assert abs(float(response['http.time'])*1000-interval)<.01
            assert abs(interval-probe['elapsedMs'])<100, 'Wrong request match or unusually delayed local consumption'
            pairs.append({'stream':int(request['tcp.stream']),'getFrame':int(request['frame.number']),
                'firstDataFrame':int(data[0]['frame.number']),'responseFrame':int(response['frame.number']),
                'firstDataMs':(data[0]['epoch']-request['epoch'])*1000,
                'httpMs':float(response['http.time'])*1000,'probeMs':probe['elapsedMs']})
        if len(pairs)==5:
            assert len({p['stream'] for p in pairs})==5
            matches.append({'scenario':scenario,'run':trial['record']['id'],'matched':5,
                'packetMedianMs':st.median(p['httpMs'] for p in pairs),
                'firstDataMedianMs':st.median(p['firstDataMs'] for p in pairs),
                'probeMedianMs':st.median(p['probeMs'] for p in pairs),'streams':pairs})
            break
    else:raise ValueError('No fully captured run for '+scenario)
summary={'packetCount':len(rows),'controlPackets':sum('3000' in [r['tcp.srcport'],r['tcp.dstport']] for r in rows),
    'matchingRule':'Exactly one GET /payload to 3002 within -1 to +100 ms of millisecond UTC probe start; unique stream; response request_in linkage.',
    'matches':matches}
assert summary['controlPackets']==0
(OUT/'packet-summary.json').write_text(json.dumps(summary,indent=2))
sys.path.insert(0,str(TMP/'python'))
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
fig,ax=plt.subplots(figsize=(6.6,3.8));x=np.arange(3)
ax.bar(x-.24,[r['firstDataMedianMs'] for r in matches],.24,label='GET to first response data',color='#b8c5bd')
ax.bar(x,[r['packetMedianMs'] for r in matches],.24,label='GET to HTTP reconstruction',color='#176b56')
ax.bar(x+.24,[r['probeMedianMs'] for r in matches],.24,label='Application full response',color='#355e85')
ax.set_xticks(x,['Delay 500 ms','Delay 1,500 ms','32 KiB/s']);ax.set_ylabel('Median interval (ms)')
ax.legend(fontsize=8);ax.spines[['top','right']].set_visible(False)
ax.set_xlabel('Five matched requests in each representative run');fig.tight_layout()
(OUT/'figures').mkdir(exist_ok=True)
fig.savefig(OUT/'figures/packet-evidence.png',dpi=240,bbox_inches='tight')
print(json.dumps(summary,indent=2))
