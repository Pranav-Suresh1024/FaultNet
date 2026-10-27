"""Validate report calculations and plot aggregate evidence; raw trials remain local."""
from pathlib import Path
from datetime import datetime
import json, math, statistics as st, random, csv, sys
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.codex/final-report/python'))
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

raw=json.loads((ROOT/'.codex/final-report/evaluation.json').read_text())
assert len(raw['runs'])==raw['protocol']['rounds']*10
assert len(raw['live'])==8
out=ROOT/'docs/reports/evidence';out.mkdir(parents=True,exist_ok=True)
fig=out/'figures';fig.mkdir(exist_ok=True)
def median(x):return st.median(x) if x else None
def p95(x):return sorted(x)[math.ceil(.95*len(x))-1] if x else None
def bootstrap(x):
    rng=random.Random(308)
    values=sorted(st.median(rng.choices(x,k=len(x))) for _ in range(3000))
    return [values[74],values[2924]]
assert p95([1,2,3,4,5])==5
assert median([1,2,3,4])==2.5
summary={'sourceCommit':raw['sourceCommit'],'environment':raw['environment'],'runtime':raw['runtime'],'protocol':raw['protocol'],'restored':raw['restored'],'scenarios':{},'live':{},'overhead':{}}
summary['recordQuality']={'accepted':len(raw['runs']),'rejected':len(raw.get('rejectedRuns',[])),
    'rejections':[{'id':r['record']['id'],'scenario':r['scenario'],'reason':r['reason'],
        'utcVsElapsedDifferenceMs':abs((datetime.fromisoformat(r['record']['recovery']['confirmedAt'].replace('Z','+00:00'))-datetime.fromisoformat(r['record']['recovery']['removedAt'].replace('Z','+00:00'))).total_seconds()*1000-r['record']['recovery']['durationMs'])} for r in raw.get('rejectedRuns',[])]}
assert all(r['record']['state']=='completed' and r['record']['persistence']['state']=='saved' for r in raw['runs'])
for name in dict.fromkeys(r['scenario'] for r in raw['runs']):
    records=[r['record'] for r in raw['runs'] if r['scenario']==name]
    obs=[o for r in records for o in r['observations'] if o['phase']=='faulty']
    times=[o['elapsedMs'] for o in obs if o['successful']]
    base=[r['summary']['baseline']['medianElapsedMs'] for r in records]
    deltas=[r['summary']['faulty']['medianElapsedMs']-r['summary']['baseline']['medianElapsedMs'] for r in records if r['summary']['faulty']['medianElapsedMs'] is not None]
    recovery=[r['recovery']['durationMs'] for r in records if r['recovery']['observed']]
    residual=[r['summary']['recovery']['medianElapsedMs']-r['summary']['baseline']['medianElapsedMs'] for r in records if r['summary']['recovery']['medianElapsedMs'] is not None]
    s={'runs':len(records),'attempts':len(obs),'successes':sum(o['successful'] for o in obs),'availabilityPct':100*sum(o['successful'] for o in obs)/len(obs),
       'medianMs':median(times),'meanMs':st.mean(times) if times else None,'p95Ms':p95(times),'minMs':min(times) if times else None,'maxMs':max(times) if times else None,
       'baselineMedianMs':median(base),'addedMedianMs':median(deltas),'addedBootstrap95Ms':bootstrap(deltas) if deltas else None,
       'goodputKiBps':st.mean(64/(t/1000) for t in times) if times else None,
       'recoveryConfirmed':len(recovery),'recoveryMedianMs':median(recovery),'recoveryResidualMs':median(residual),
       'failureMedianMs':median([o['elapsedMs'] for o in obs if not o['successful']]),'fault':records[0]['settings']['fault'],
       'representativeRun':records[0]['id']}
    if s['fault']['type']=='delay' and s['fault']['delayMs']>0 and deltas:
        s['calibrationErrorPct']=100*(s['addedMedianMs']-s['fault']['delayMs'])/s['fault']['delayMs']
    if s['fault']['type']=='bandwidth':s['rateAttainmentPct']=100*s['goodputKiBps']/s['fault']['rateKiBps']
    summary['scenarios'][name]=s
    assert s['runs']==raw['protocol']['rounds'] and s['attempts']==5*s['runs']
for item in raw['live']:
    obs=item['observations'];times=[o['elapsedMs'] for o in obs]
    summary['live'][item['scenario']]={'attempts':len(obs),'completed':sum(o['outcome']=='completed' for o in obs),
       'http200':sum(o['status']==200 and o['outcome']=='completed' for o in obs),'http503':sum(o['status']==503 for o in obs),
       'medianMs':median(times),'minMs':min(times),'maxMs':max(times),'sdMs':st.stdev(times),
       'medianBytes':median([o['bytes'] for o in obs]),'config':item['config']}
direct=[o['elapsedMs'] for b in raw['overhead'] for o in b['direct']]
proxied=[o['elapsedMs'] for b in raw['overhead'] for o in b['proxied']]
delta=[median([o['elapsedMs'] for o in b['proxied']])-median([o['elapsedMs'] for o in b['direct']]) for b in raw['overhead']]
summary['overhead']={'pairs':len(direct),'directMedianMs':median(direct),'proxyMedianMs':median(proxied),'blockAddedMedianMs':median(delta),'blockAddedBootstrap95Ms':bootstrap(delta)}
summary['totals']={'workbenchRuns':len(raw['runs']),'workbenchAttempts':sum(len(r['record']['observations']) for r in raw['runs']),
    'overheadRequests':len(direct)+len(proxied),'liveRequests':sum(len(x['observations']) for x in raw['live'])}
(out/'summary.json').write_text(json.dumps(summary,indent=2))
fields=['scenario','runs','attempts','successes','availabilityPct','baselineMedianMs','medianMs','p95Ms','addedMedianMs','goodputKiBps','recoveryConfirmed','recoveryMedianMs','recoveryResidualMs']
with (out/'scenario-comparison.csv').open('w',newline='') as f:
    w=csv.DictWriter(f,fields);w.writeheader()
    for name,s in summary['scenarios'].items():w.writerow({'scenario':name,**{k:s[k] for k in fields[1:]}})
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'axes.spines.top':False,'axes.spines.right':False,'figure.dpi':160,'savefig.dpi':240,'axes.grid':True,'grid.alpha':.2})
colors=['#176b56','#355e85','#ac503a','#6d648c']
def save(name):plt.tight_layout();plt.savefig(fig/(name+'.png'),bbox_inches='tight');plt.close()
figobj,ax=plt.subplots(figsize=(6.6,3.6));ax.set_xlim(0,10);ax.set_ylim(0,6);ax.axis('off')
for x,y,label in [(1.5,5,'Browser interfaces\nWorkbench | Cockpit'),(7.5,5,'Control server :3000\nProtected settings and evidence'),
                  (1.5,2.9,'Experiment runner\nReal HTTP probe'),(4.6,2.9,'Experiment proxy :3002\nDelay / pacing / interruption'),
                  (8,2.9,'Demo server :3001\n65,536 synthetic bytes'),(4.6,.8,'Live proxy :8080\nIndependent applied settings'),
                  (8,.8,'Development origin\nDemo used in this evaluation')]:
    ax.text(x,y,label,ha='center',va='center',fontsize=8.5,bbox=dict(boxstyle='round,pad=.5',fc='#f1f4f1',ec='#9caaa4'))
for start,end in [((3.05,5),(5.6,5)),((7.5,4.35),(4.6,3.6)),((2.6,2.9),(3.1,2.9)),((6.1,2.9),(6.8,2.9)),((6.1,.8),(6.8,.8))]:
    ax.annotate('',xy=end,xytext=start,arrowprops=dict(arrowstyle='->',color='#176b56',lw=1.4))
ax.text(1.5,.8,'Manual development client\nuses port 8080',ha='center',va='center',fontsize=8.5)
ax.annotate('',xy=(3.1,.8),xytext=(2.75,.8),arrowprops=dict(arrowstyle='->',color='#176b56',lw=1.4))
save('architecture')
names=['delay-150','delay-500','delay-1500'];s=[summary['scenarios'][n] for n in names]
plt.figure(figsize=(6.6,3.6));x=[v['fault']['delayMs'] for v in s];y=[v['addedMedianMs'] for v in s]
plt.plot([0,1550],[0,1550],'--',color='gray',label='Ideal added delay')
plt.errorbar(x,y,yerr=[[v['addedMedianMs']-v['addedBootstrap95Ms'][0] for v in s],[v['addedBootstrap95Ms'][1]-v['addedMedianMs'] for v in s]],fmt='o-',color=colors[0],capsize=4,label='Measured paired run medians')
plt.xlabel('Configured delay (ms)');plt.ylabel('Added full-response time (ms)');plt.legend(fontsize=8);save('delay-calibration')
plt.figure(figsize=(6.6,3.6))
for name,color in zip(['delay-0','delay-150','delay-500','delay-1500'],colors):
    ts=sorted(o['elapsedMs'] for r in raw['runs'] if r['scenario']==name for o in r['record']['observations'] if o['phase']=='faulty' and o['successful'])
    plt.step(ts,np.arange(1,len(ts)+1)/len(ts),where='post',label=name.replace('delay-','')+' ms',color=color)
plt.xlabel('Successful full-response time (ms)');plt.ylabel('Cumulative fraction');plt.legend(title='Configured delay',fontsize=8);save('latency-distribution')
names=['bandwidth-16','bandwidth-32','bandwidth-128'];s=[summary['scenarios'][n] for n in names]
plt.figure(figsize=(6.6,3.6));xx=np.arange(3);plt.bar(xx-.18,[v['fault']['rateKiBps'] for v in s],.36,label='Configured',color='#b8c5bd');plt.bar(xx+.18,[v['goodputKiBps'] for v in s],.36,label='Measured',color=colors[0]);plt.xticks(xx,['16','32','128']);plt.xlabel('Configured restriction (KiB/s)');plt.ylabel('Payload goodput (KiB/s)');plt.legend();save('bandwidth-calibration')
figobj,axs=plt.subplots(1,2,figsize=(6.6,3.4));names=['timeout-500','timeout-2000'];s=[summary['scenarios'][n] for n in names]
axs[0].bar(['500','2000'],[v['availabilityPct'] for v in s],color=[colors[2],colors[0]]);axs[0].set_ylabel('Successful faulty requests (%)');axs[0].set_ylim(0,110);axs[0].set_xlabel('Client timeout (ms)')
axs[1].bar(['500','2000'],[v['failureMedianMs'] if v['medianMs'] is None else v['medianMs'] for v in s],color=[colors[2],colors[0]]);axs[1].set_ylabel('Observed attempt duration (ms)');axs[1].set_xlabel('Client timeout (ms)');axs[1].set_title('Failed wait / successful response',fontsize=9);save('timeout-tradeoff')
names=['delay-150','delay-500','delay-1500','bandwidth-16','bandwidth-32','bandwidth-128','interruption'];s=[summary['scenarios'][n] for n in names]
plt.figure(figsize=(6.6,3.7));xx=np.arange(len(s));plt.bar(xx-.2,[v['baselineMedianMs'] for v in s],.4,label='Baseline',color='#b8c5bd')
recovery=[median([r['record']['summary']['recovery']['medianElapsedMs'] for r in raw['runs'] if r['scenario']==n]) for n in names]
plt.bar(xx+.2,recovery,.4,label='Recovery',color=colors[0]);plt.xticks(xx,['D150','D500','D1500','B16','B32','B128','Close']);plt.ylabel('Median successful response (ms)');plt.xlabel('Fault condition');plt.legend();save('recovery-comparison')
plt.figure(figsize=(6.6,3.5));xx=np.arange(3);plt.bar(xx-.18,[100,100,100],.36,label='Settled baseline',color='#b8c5bd');plt.bar(xx+.18,[0,100,100],.36,label='Settled direct-link failure',color=colors[0]);plt.xticks(xx,['Static without backup','RIPv2','OSPF']);plt.ylabel('Replies in reviewed ping batch (%)');plt.ylim(0,115);plt.legend(fontsize=8);plt.xlabel('Four requests per settled batch; descriptive evidence');save('routing-comparison')
plt.figure(figsize=(6.6,3.5));names=['normal','delay-500','jitter-100','download-32'];vals=[summary['live'][n] for n in names];plt.bar(range(4),[v['medianMs'] for v in vals],color=colors);plt.xticks(range(4),['Normal','Delay 500','Delay + jitter','32 KiB/s']);plt.ylabel('Median sample duration (ms)');plt.xlabel('Live configuration; 10 finished requests each');save('live-comparison')
print(json.dumps(summary,indent=2))
