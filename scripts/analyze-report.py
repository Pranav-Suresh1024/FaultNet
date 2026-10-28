"""Recalculate statistics and figures from sanitized numerical analysis inputs."""
from pathlib import Path
import json, math, statistics as st, random, csv, sys
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.codex/final-report/python'))
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np

raw=json.loads((ROOT/'docs/reports/evidence/analysis-inputs.json').read_text())
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
summary['recordQuality']=raw['recordQuality']
assert summary['recordQuality']['accepted']==len(raw['runs'])
assert all(len(r['baselineMs'])==len(r['faultyMs'])==5 and len(r['recoveryMs'])==3 for r in raw['runs'])
assert all(isinstance(t,(float,int)) and math.isfinite(t) and t>=0 for r in raw['runs'] for t in r['baselineMs']+r['faultyMs']+r['recoveryMs'])
for name in dict.fromkeys(r['scenario'] for r in raw['runs']):
    records=[r for r in raw['runs'] if r['scenario']==name]
    obs=[(t,ok) for r in records for t,ok in zip(r['faultyMs'],r['faultySuccess'],strict=True)]
    times=[t for t,ok in obs if ok]
    base=[median(r['baselineMs']) for r in records]
    deltas=[median([t for t,ok in zip(r['faultyMs'],r['faultySuccess']) if ok])-median(r['baselineMs']) for r in records if any(r['faultySuccess'])]
    recovery=[r['confirmationMs'] for r in records if r['recoveryConfirmed']]
    residual=[median(r['recoveryMs'])-median(r['baselineMs']) for r in records]
    s={'runs':len(records),'attempts':len(obs),'successes':sum(ok for t,ok in obs),'availabilityPct':100*sum(ok for t,ok in obs)/len(obs),
       'medianMs':median(times),'meanMs':st.mean(times) if times else None,'p95Ms':p95(times),'minMs':min(times) if times else None,'maxMs':max(times) if times else None,
       'baselineMedianMs':median(base),'addedMedianMs':median(deltas),'addedBootstrap95Ms':bootstrap(deltas) if deltas else None,
       'goodputKiBps':st.mean(64/(t/1000) for t in times) if times else None,
       'recoveryConfirmed':len(recovery),'recoveryMedianMs':median(recovery),'recoveryResidualMs':median(residual),
       'failureMedianMs':median([t for t,ok in obs if not ok]),'fault':records[0]['fault'],
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
direct=[t for b in raw['overhead'] for t in b['directMs']]
proxied=[t for b in raw['overhead'] for t in b['proxiedMs']]
delta=[median(b['proxiedMs'])-median(b['directMs']) for b in raw['overhead']]
summary['overhead']={'pairs':len(direct),'directMedianMs':median(direct),'proxyMedianMs':median(proxied),'blockAddedMedianMs':median(delta),'blockAddedBootstrap95Ms':bootstrap(delta)}
summary['totals']={'workbenchRuns':len(raw['runs']),'workbenchAttempts':sum(len(r['baselineMs'])+len(r['faultyMs'])+len(r['recoveryMs']) for r in raw['runs']),
    'overheadRequests':len(direct)+len(proxied),'liveRequests':sum(len(x['observations']) for x in raw['live'])}
(out/'summary.json').write_text(json.dumps(summary,indent=2))
fields=['scenario','runs','attempts','successes','availabilityPct','baselineMedianMs','medianMs','p95Ms','addedMedianMs','goodputKiBps','recoveryConfirmed','recoveryMedianMs','recoveryResidualMs']
with (out/'scenario-comparison.csv').open('w',newline='') as f:
    w=csv.DictWriter(f,fields);w.writeheader()
    for name,s in summary['scenarios'].items():w.writerow({'scenario':name,**{k:s[k] for k in fields[1:]}})
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'axes.spines.top':False,'axes.spines.right':False,'figure.dpi':160,'savefig.dpi':240,'axes.grid':True,'grid.alpha':.2})
colors=['#176b56','#355e85','#ac503a','#6d648c']
def save(name):plt.tight_layout();plt.savefig(fig/(name+'.png'),bbox_inches='tight');plt.close()
figobj,ax=plt.subplots(figsize=(6.8,4.2));ax.set_xlim(0,10.6);ax.set_ylim(0,7.2);ax.axis('off')
nodes={
    'browser':(1.4,6,'Browser interfaces\nWorkbench / Cockpit'),
    'control':(4,6,'Control server\nPort 3000'),
    'runner':(6.6,6,'Experiment runner\nPhase coordination'),
    'records':(9.2,6,'Validated records\nLocal JSON files'),
    'experiment':(6.6,3.5,'Experiment proxy\nPort 3002'),
    'demo':(9.2,3.5,'Demo server\nPort 3001'),
    'client':(1.4,1,'Development client\nUses port 8080'),
    'live':(4,1,'Live proxy\nPort 8080'),
    'origin':(6.6,1,'Development origin\nDemo in this study')}
boxes={}
for name,(x,y,label) in nodes.items():
    box=FancyBboxPatch((x-1.05,y-.5),2.1,1,boxstyle='round,pad=0.02,rounding_size=0.07',fc='#f1f4f1',ec='#7c9188',lw=1)
    ax.add_patch(box);boxes[name]=box;ax.text(x,y,label,ha='center',va='center',fontsize=8)
assert len(boxes)==9 and all(abs(a[0]-b[0])>2.1 or abs(a[1]-b[1])>1 for i,a in enumerate(nodes.values()) for b in list(nodes.values())[i+1:])
for source,target,control in [('browser','control',False),('control','runner',True),('runner','records',True),
                              ('runner','experiment',False),('experiment','demo',False),
                              ('control','live',True),('client','live',False),('live','origin',False)]:
    ax.add_patch(FancyArrowPatch(nodes[source][:2],nodes[target][:2],patchA=boxes[source],patchB=boxes[target],
        arrowstyle='->' if control else '<->',mutation_scale=10,shrinkA=3,shrinkB=3,
        color='#67736e' if control else '#176b56',lw=1.2,linestyle='--' if control else '-'))
ax.text(5.3,6.7,'Run control',ha='center',fontsize=7)
ax.text(7.9,6.7,'Save / load',ha='center',fontsize=7)
ax.text(3.7,3.7,'Apply / reset',ha='right',fontsize=8)
ax.text(6.85,4.65,'HTTP probe',ha='left',fontsize=8)
ax.text(7.9,4.2,'HTTP',ha='center',fontsize=8)
ax.text(.35,.05,'Solid: HTTP request and reply     Dashed: internal control or storage access',fontsize=7.5,color='#46544e')
save('architecture')
names=['delay-0','delay-150','delay-500','delay-1500'];s=[summary['scenarios'][n] for n in names]
plt.figure(figsize=(6.6,3.6));positions=np.arange(len(s));excess=[v['addedMedianMs']-v['fault']['delayMs'] for v in s]
intervals=[[bound-v['fault']['delayMs'] for bound in v['addedBootstrap95Ms']] for v in s]
assert all(lo<=value<=hi for value,(lo,hi) in zip(excess,intervals))
plt.axvline(0,ls='--',color='gray',lw=1)
plt.errorbar(excess,positions,xerr=[[value-lo for value,(lo,hi) in zip(excess,intervals)],
    [hi-value for value,(lo,hi) in zip(excess,intervals)]],fmt='o',color=colors[0],capsize=4)
for pos,value,(lo,hi) in zip(positions,excess,intervals):plt.text(hi+.4,pos,f'{value:.2f}',va='center',fontsize=9)
plt.yticks(positions,[str(v['fault']['delayMs'])+' ms' for v in s]);plt.gca().invert_yaxis();plt.xlim(-1,20)
plt.gca().yaxis.grid(False);plt.xlabel('Paired added time minus configured delay (ms)');plt.ylabel('Configured delay')
plt.title('Deviation from configured delay; zero is exact calibration',fontsize=10);save('delay-calibration')
plt.figure(figsize=(6.6,3.6))
for name,color in zip(['delay-0','delay-150','delay-500','delay-1500'],colors):
    ts=sorted(t for r in raw['runs'] if r['scenario']==name for t,ok in zip(r['faultyMs'],r['faultySuccess']) if ok)
    plt.step(ts,np.arange(1,len(ts)+1)/len(ts),where='post',label=name.replace('delay-','')+' ms',color=color)
plt.xlabel('Successful full-response time (ms)');plt.ylabel('Cumulative fraction');plt.legend(title='Configured delay',fontsize=8);save('latency-distribution')
names=['bandwidth-16','bandwidth-32','bandwidth-128'];s=[summary['scenarios'][n] for n in names]
plt.figure(figsize=(6.6,3.6));xx=np.arange(3);plt.bar(xx-.18,[v['fault']['rateKiBps'] for v in s],.36,label='Configured',color='#b8c5bd');plt.bar(xx+.18,[v['goodputKiBps'] for v in s],.36,label='Measured',color=colors[0]);plt.xticks(xx,['16','32','128']);plt.xlabel('Configured restriction (KiB/s)');plt.ylabel('Payload goodput (KiB/s)');plt.legend();save('bandwidth-calibration')
figobj,axs=plt.subplots(1,2,figsize=(6.6,3.4));names=['timeout-500','timeout-2000'];s=[summary['scenarios'][n] for n in names]
axs[0].bar(['500','2000'],[v['availabilityPct'] for v in s],color=[colors[2],colors[0]]);axs[0].set_ylabel('Successful faulty requests (%)');axs[0].set_ylim(0,110);axs[0].set_xlabel('Client timeout (ms)')
axs[1].bar(['500','2000'],[v['failureMedianMs'] if v['medianMs'] is None else v['medianMs'] for v in s],color=[colors[2],colors[0]]);axs[1].set_ylabel('Observed attempt duration (ms)');axs[1].set_xlabel('Client timeout (ms)');axs[1].set_title('Failed wait / successful response',fontsize=9);save('timeout-tradeoff')
names=['delay-150','delay-500','delay-1500','bandwidth-16','bandwidth-32','bandwidth-128','interruption'];s=[summary['scenarios'][n] for n in names]
plt.figure(figsize=(6.6,3.7));xx=np.arange(len(s));plt.bar(xx-.2,[v['baselineMedianMs'] for v in s],.4,label='Baseline',color='#b8c5bd')
recovery=[median([median(r['recoveryMs']) for r in raw['runs'] if r['scenario']==n]) for n in names]
plt.bar(xx+.2,recovery,.4,label='Recovery',color=colors[0]);plt.xticks(xx,['D150','D500','D1500','B16','B32','B128','Close']);plt.ylabel('Median successful response (ms)');plt.xlabel('Fault condition');plt.legend();save('recovery-comparison')
plt.figure(figsize=(6.6,3.5));xx=np.arange(3);plt.bar(xx-.18,[100,100,100],.36,label='Settled baseline',color='#b8c5bd');plt.bar(xx+.18,[0,100,100],.36,label='Settled direct-link failure',color=colors[0]);plt.xticks(xx,['Static without backup','RIPv2','OSPF']);plt.ylabel('Replies in reviewed ping batch (%)');plt.ylim(0,115);plt.legend(fontsize=8);plt.xlabel('Four requests per settled batch; descriptive evidence');save('routing-comparison')
plt.figure(figsize=(6.6,3.5));names=['normal','delay-500','jitter-100','download-32']
for i,name in enumerate(names):
    values=[o['elapsedMs'] for item in raw['live'] if item['scenario']==name for o in item['observations']]
    plt.scatter([i+(j-4.5)*.018 for j in range(10)],values,color=colors[i],s=22,alpha=.8)
    plt.plot([i-.18,i+.18],[median(values)]*2,color='black',lw=1.5)
plt.xticks(range(4),['Normal','Delay 500','Delay + jitter','32 KiB/s']);plt.ylabel('Individual attempt duration (ms)');plt.xlabel('10 observations per condition; black line = median');save('live-comparison')
print(json.dumps(summary,indent=2))
