const fs = require('fs');

const targets = {
  tp: ['/workspace/.tmp_probe/timingbeltdrive.html', ['pitchB','beltVelocity','z1Min','z1','z2Cal','z2','d1','d2','a0min','a0max','calBeltLen','beltLen','a','zB','zM','kZ','power0','bs0','bsMin','bs','beltMass','kF','powerR','force1','force2','alpha1','forceQ','power','n1','n2','transmissionRatio','kA','tp_z','tp_decimals','tp_beltType','tp_toothProfile']],
  pv: ['/workspace/.tmp_probe/polyvbeltdesign.html', ['pv_powerD','pv_beltSize','pv_deltaE','pv_epsilon','pv_beltVelocity','pv_de1','pv_de2Cal','pv_de2','pv_a0min','pv_a0max','pv_calBeltLen','pv_beltLen','pv_a','pv_alpha1','pv_aMin','pv_aMax','pv_calcMethodSelect','pv_power1','pv_rawP1','pv_deltaP1','pv_kAlpha','pv_kr','pv_kL','pv_z','pv_zCalc','pv_Ft','pv_forceG','pv_F1','pv_F2','pv_forceF0','pv_forceQ','power','n1','n2','transmissionRatio','pv_kA']],
  fb: ['/workspace/.tmp_probe/flatbelt.html', ['elasticSlidingRate','beltVelocity','fb_d1Coeff','fb_d1Cal','fb_d1','fb_d2Cal','fb_d2','a0min','a0max','fb_nylonDelta','fb_delta','calBeltLen','li','a','beltLen','fb_pulleyNum','fb_y','alpha1','kA','fb_d1OverDelta','fb_P0','fb_kAlpha','fb_kBeta','fb_A','fb_sigma0','fb_bCal','fb_bstandard','fb_Fr','fb_Frmax','power','n1','n2','transmissionRatio','fb_nylonBeltTypeDisplay']]
};

function decodeSub(s) {
  return s.replace(/<sub[^>]*>([\s\S]*?)<\/sub>/g, '[$1]').replace(/<sup[^>]*>([\s\S]*?)<\/sup>/g, '^$1').replace(/&alpha;/g,'α').replace(/&beta;/g,'β').replace(/&delta;/g,'δ').replace(/&sigma;/g,'σ').replace(/&pi;/g,'π').replace(/&epsilon;/g,'ε').replace(/&le;/g,'≤').replace(/&times;/g,'×').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
}

for (const [tag, [f, ids]] of Object.entries(targets)) {
  const html = fs.readFileSync(f, 'utf8');
  console.log('\n########## ' + tag + ' ##########');
  for (const id of ids) {
    const re = new RegExp(`id="${id}"`);
    const m = re.exec(html);
    if (!m) { console.log(`#${id} | NOT FOUND`); continue; }
    const idx = m.index;
    const before = html.slice(Math.max(0, idx - 1500), idx);
    // 找之前最后一个 >文本< 形式的 label（含 sub/sup，跨标签）
    const lm = [...before.matchAll(/>([^<>]*(?:<sub[^>]*>[^<]*<\/sub>[^<>]*)*[^<>]*)</g)];
    let lab = '';
    for (let i = lm.length - 1; i >= 0; i--) {
      const t = decodeSub(lm[i][1]);
      if (t && t.length >= 2 && !/^[ dne,.\-–≤≥/]+$/.test(t)) { lab = t; break; }
    }
    // 单位：向后找 300 字符内 的 (单位) 或 纯文本
    const after = html.slice(idx, idx + 350);
    const um = after.match(/<\/(?:input|select)>((?:(?!<\/div>|<\/label>|<input|<select)[\s\S]){0,80}?)(?:<\/div>|<div|<label|$)/);
    let unit = um ? decodeSub(um[1]).replace(/^[)\s]+|[()\s]+$/g,'') : '';
    if (unit.length > 12) unit = unit.slice(0, 12);
    console.log(`#${id} = ${lab} | 单位:${unit}`);
  }
}
