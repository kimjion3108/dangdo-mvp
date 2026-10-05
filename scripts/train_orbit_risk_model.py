"""Optional exposure-proxy training only. No model is trained or shipped without a dataset.
Input JSON: {source:{url,year}, samples:[{area, overlapMeters, nearestHotspotMeters,
 accidentCount, casualties, fatalities, seriousInjuries, distance, label}]}
label is a documented weak label (0/1) for accident-area exposure, NOT accident probability.
Holdout is by area, not randomly mixed neighboring segments. Requires scikit-learn.
"""
import argparse,json,datetime
p=argparse.ArgumentParser();p.add_argument('dataset');p.add_argument('output');a=p.parse_args()
d=json.load(open(a.dataset));rows=d['samples'];assert d.get('source',{}).get('url') and len(rows)>=200,'Need >=200 sourced samples'
features=['overlapMeters','nearestHotspotMeters','accidentCount','casualties','fatalities','seriousInjuries']
assert all(all(r.get(k) is not None for k in features) and r.get('label') in [0,1] and r.get('area') for r in rows)
assert len({r['area'] for r in rows})>=5,'Need >=5 areas for geographic holdout'
from sklearn.model_selection import GroupShuffleSplit
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import balanced_accuracy_score
import numpy as np
X=np.array([[r[k] for k in features] for r in rows]);y=np.array([r['label'] for r in rows]);groups=[r['area'] for r in rows]
train,test=next(GroupShuffleSplit(n_splits=1,test_size=.25,random_state=42).split(X,y,groups))
assert len(set(y[train]))==2 and len(set(y[test]))==2,'Both classes required in train and validation'
scaler=StandardScaler().fit(X[train]);model=LogisticRegression(class_weight='balanced',max_iter=1000).fit(scaler.transform(X[train]),y[train])
artifact={'name':'ORBIT Exposure Proxy','version':'experimental-1','trainedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'features':features,'source':d['source'],'sampleCount':len(rows),'labelType':'weak accident-area exposure; not accident probability','validation':{'split':'geographic area holdout','samples':len(test),'balancedAccuracy':balanced_accuracy_score(y[test],model.predict(scaler.transform(X[test])))},'mean':scaler.mean_.tolist(),'scale':scaler.scale_.tolist(),'coefficients':model.coef_[0].tolist(),'intercept':float(model.intercept_[0]),'deployed':False}
json.dump(artifact,open(a.output,'w'),ensure_ascii=False,indent=2)
