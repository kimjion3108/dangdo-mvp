// Transparent exposure baseline. No fabricated road, intersection or signal features.
export function baselineRisk(s){const overlap=s.overlapMeters/s.distance,near=s.nearestHotspotMeters===null?0:Math.max(0,1-s.nearestHotspotMeters/100);const severity=Math.min(1,(s.accidentCount+s.casualties+s.seriousInjuries*2+s.fatalities*4)/30);return Math.min(100,70*overlap+20*near+10*severity);}
