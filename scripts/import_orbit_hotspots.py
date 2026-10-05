"""Normalize a lawfully obtained KoROAD/TAAS GeoJSON export; never download with browser keys.
Usage: python scripts/import_orbit_hotspots.py input.geojson output.json --year 2024 --bounds 126,36,129,38
Input must contain Polygon/MultiPolygon features. Preserve source fields and map known count fields.
"""
import argparse,json
p=argparse.ArgumentParser();p.add_argument('input');p.add_argument('output');p.add_argument('--year',type=int,required=True);p.add_argument('--bounds',required=True);a=p.parse_args()
d=json.load(open(a.input));assert d['type']=='FeatureCollection' and isinstance(d['features'],list)
bounds=list(map(float,a.bounds.split(',')));assert len(bounds)==4 and bounds[0]<bounds[2] and bounds[1]<bounds[3]
keys={'accidentCount':'occrrnc_cnt','casualties':'caslt_cnt','fatalities':'dth_dnv_cnt','seriousInjuries':'se_dnv_cnt'}
for i,f in enumerate(d['features']):
 assert f['geometry']['type'] in ('Polygon','MultiPolygon')
 props=f.setdefault('properties',{});f['id']=str(f.get('id',props.get('spot_fid',i)))
 for target,source in keys.items():
  value=props.get(target,props.get(source))
  if value is not None: props[target]=max(0,int(value))
d.update(source={'name':'한국도로교통공단 자전거 교통사고 다발지역','url':'https://www.data.go.kr/data/15056681/openapi.do','year':a.year},coverageBounds=bounds)
with open(a.output,'w') as f:json.dump(d,f,ensure_ascii=False)
