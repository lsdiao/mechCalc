var fs = require('fs');
var html = fs.readFileSync('/workspace/.tmp_probe/wormandwormwheeldrive.html', 'utf8');

// Extract each form-group / row block containing label + input/select
var ids = ['power','torque','n1','n2','transmissionRatio','assumeZ1','assumeZ2','assumeEfficiency','torque2','kA','kV','kBeta','k','j','lifeTime','cycleTimes','wormWheelMaterial','basicSigmaHAllowable','kHN','sigmaHAllowable','zE','zRou','centerDisA','assumeD1A','d1A','centerDisAFinal','z1','z2','miu','deltaMiu','m','q','d2','gama','x2','m2d1','vS','phiV','efficiency','yBeta','zV2','yFa2','kFN','sigmaFAllowableBasic','sigmaFAllowable','sigmaF','forceT1','forceR1','dF1','inertia','distanceL','maxY','yAllowable','t0','t1','alphaD','coolingArea','minCoolingArea','wormHardness','torqueUnit'];

ids.forEach(function(id){
  var re = new RegExp('<(input|select)[^>]*id="'+id+'"[^>]*>', 'g');
  var m = html.match(re);
  var selRe = new RegExp('<select[^>]*id="'+id+'"[\\s\\S]*?</select>', 'g');
  var sel = html.match(selRe);
  if (m || sel) {
    console.log('### ' + id);
    if (m) m.forEach(function(x){console.log('  TAG: ' + x.replace(/\s+/g,' ').slice(0,220));});
    if (sel) sel.forEach(function(x){
      var opts = x.match(/<option[^>]*>[^<]*<\/option>/g);
      if (opts) console.log('  OPTS: ' + opts.map(function(o){return o.replace(/<[^>]*>/g,'');}).join(' | '));
    });
  } else {
    console.log('### ' + id + ' : NOT FOUND');
  }
});
