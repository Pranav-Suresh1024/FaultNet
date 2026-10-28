"""Verify publication DOIs and complete, freely retrievable PDF copies."""
from pathlib import Path
import hashlib, io, json, re, unicodedata, urllib.request
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1]
papers=json.loads((ROOT/'docs/reports/scholarly-references.json').read_text(encoding='utf-8'))['papers']
local=ROOT/'.codex/report-references';local.mkdir(parents=True,exist_ok=True)
def normalize(text):return re.sub('[^a-z0-9]','',unicodedata.normalize('NFKD',text).lower())
assert normalize('Network-Defined')==normalize('Network Defined')
verified=[]
for paper in papers:
    with urllib.request.urlopen('https://api.crossref.org/works/'+paper['doi'],timeout=40) as response:
        metadata=json.load(response)['message']
    assert metadata['DOI'].casefold()==paper['doi'].casefold()
    assert metadata['type'] in ['journal-article','proceedings-article']
    assert normalize(metadata['title'][0]) in normalize(paper['title'])
    with urllib.request.urlopen(paper['fullTextUrl'],timeout=40) as response:
        status=response.status;payload=response.read();url=response.geturl()
    assert status==200 and payload.startswith(b'%PDF-')
    reader=PdfReader(io.BytesIO(payload));text='\n'.join(page.extract_text() for page in reader.pages)
    assert len(reader.pages)==paper['verifiedPdfPages']
    assert normalize(paper['title']) in normalize(text[:6000])
    assert len(text.split())>1500 and 'reference' in text.lower(), 'Full paper, not abstract/slides, required'
    (local/f'paper-{paper["number"]}.pdf').write_bytes(payload)
    verified.append({'number':paper['number'],'doi':metadata['DOI'],'crossrefType':metadata['type'],
        'registeredTitle':metadata['title'][0],'registeredVenue':metadata['container-title'][0],
        'registeredPages':metadata.get('page'),'fullTextUrl':url,'httpStatus':status,
        'pdfPages':len(reader.pages),'pdfWords':len(text.split()),'sha256':hashlib.sha256(payload).hexdigest(),
        'version':paper['fullTextVersion']})
    if paper.get('additionalFullTextUrl'):
        with urllib.request.urlopen(paper['additionalFullTextUrl'],timeout=40) as response:
            extra=response.read();assert response.status==200 and extra.startswith(b'%PDF-')
        extraReader=PdfReader(io.BytesIO(extra));extraText='\n'.join(p.extract_text() for p in extraReader.pages)
        assert len(extraReader.pages)==paper['verifiedPdfPages'] and normalize(paper['title']) in normalize(extraText[:6000])
        verified[-1]['additionalFullText']={'url':paper['additionalFullTextUrl'],'httpStatus':200,
            'pdfPages':len(extraReader.pages),'sha256':hashlib.sha256(extra).hexdigest()}
    print(paper['number'],paper['doi'],len(reader.pages),'pages; DOI and free PDF verified',flush=True)
assert len(verified)==6 and len({p['doi'] for p in verified})==6
(ROOT/'docs/reports/evidence/reference-verification.json').write_text(json.dumps(verified,indent=2),encoding='utf-8')
