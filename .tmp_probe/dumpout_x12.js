const fs = require('fs');

const targets = {
  tp: ['/workspace/.tmp_probe/timingbeltdrive.html', ['pitchB','beltVelocity','z1Min','z1','z2Cal','z2','d1','d2','a0min','a0','a0max','calBeltLen','beltLen','a','zB','zM','kZ','power0','bs0','bsMin','bs','beltMass','kF','powerR','force1','force2','alpha1','forceQ','power','n1','n2','transmissionRatio','kA','tp_z','tp_decimals']],
  pv: ['/workspace/.tmp_probe/polyvbeltdesign.html', ['pv_powerD','pv_beltSize','pv_deltaE','pv_epsilon','pv_beltVelocity','pv_de1','pv_de2Cal','pv_de2','pv_a0min','pv_a0','pv_a0max','pv_calBeltLen','pv_beltLen','pv_a','pv_alpha1','pv_aMin','pv_aMax','pv_calcMethodSelect','pv_power1','pv_rawP1','pv_deltaP1','pv_kAlpha','pv_kr','pv_kL','pv_z','pv_zCalc','pv_Ft','pv_forceG','pv_F1','pv_F2','pv_forceF0','pv_forceQ','power','n1','n2','transmissionRatio','pv_kA']],
  fb: ['/workspace/.tmp_probe/flatbelt.html', ['elasticSlidingRate','beltVelocity','fb_d1Coeff','fb_d1Cal','fb_d1','fb_d2Cal','fb_d2','a0min','a0','a0max','fb_nylonDelta','fb_delta','calBeltLen','li','a','beltLen','fb_pulleyNum','fb_y','alpha1','kA','fb_d1OverDelta','fb_P0','fb_P0Unit','fb_kAlpha','fb_kBeta','fb_A','fb_sigma0','fb_bCal','fb_bstandard','fb_Fr','fb_Frmax','power','n1','n2','transmissionRatio','fb_nylonBeltTypeDisplay']]
};

for (const [tag, [f, ids]] of Object.entries(targets)) {
  const html = fs.readFileSync(f, 'utf8');
  console.log('\n########## ' + tag + ' ##########');
  for (const id of ids) {
    const idx = html.indexOf(`id="${id}"`);
    if (idx < 0) { console.log(`#${id} | NOT FOUND`); continue; }
    let ctx = html.slice(Math.max(0, idx - 1200), idx + 150);
    let lab = '';
    const before = html.slice(Math.max(0, idx - 800), idx);
    const forLabel = html.match(new RegExp(`<label[^>]*for="${id}"[^>]*>([\\s\\S]*?)<\\/label>`));
    if (forLabel) lab = forLabel[1];
    else {
      const texts = [...before.matchAll(/>([^<>{}]{2,40})</g)].map(x => x[1].trim()).filter(t => t && !/^[\d\s.,-]+$/.test(t));
      lab = texts.length ? texts[texts.length - 1] : '';
    }
    lab = lab.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    // 单位：input 之后的第一个非空文本
    const after = html.slice(idx, idx + 400);
    const am = after.match(/<\/(?:input|select)>\s*(?:<\/div>\s*)?([^<>{}]{1,15})</);
    const unit = am ? am[1].trim() : '';
    const ro = /readonly/.test(after) || /readonly/.test(before.slice(-200)) ? 'RO' : '';
    console.log(`#${id} | ${lab} | unit:${unit} ${ro}`);
  }
}
