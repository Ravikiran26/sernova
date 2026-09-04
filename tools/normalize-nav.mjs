import fs from 'node:fs';

const treatmentLinks = [
  ['Skin Rejuvenation', 'skin-rejuvenation.html'],
  ['Acne & Acne Scars', 'acne-and-acne-scars.html'],
  ['Pigmentation & Melasma', 'pigmentation-and-melasma.html'],
  ['Anti-Aging Treatments', 'anti-aging-treatments.html'],
  ['Botox & Dermal Fillers', 'botox-and-dermal-fillers.html'],
  ['Laser Hair Removal', 'laser-hair-removal.html'],
  ['Hair Loss Treatment', 'hair-loss-treatment.html'],
  ['Hair Transplant FUE/DHI', 'hair-transplant-fue-dhi.html'],
  ['PRP & GFC Therapy', 'prp-and-gfc-therapy.html'],
  ['Body Contouring', 'body-contouring.html'],
  ['Liposuction', 'liposuction.html'],
  ['Rhinoplasty', 'rhinoplasty.html']
];

const files = fs.readdirSync('.').filter((file) => file.endsWith('.html'))
  .concat(fs.readdirSync('treatments').filter((file) => file.endsWith('.html')).map((file) => `treatments/${file}`));

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  const inTreatments = file.startsWith('treatments/');
  const prefix = inTreatments ? '../' : '';
  const pageName = file.split('/').pop();
  const cls = (name) => {
    if (inTreatments && name === 'treatments') return ' class="active"';
    if (!inTreatments && pageName === `${name}.html`) return ' class="active"';
    if (!inTreatments && pageName === 'index.html' && name === 'index') return ' class="active"';
    return '';
  };
  const dropActive = cls('treatments') ? 'active ' : '';
  const items = treatmentLinks.map(([label, href]) => `<a href="${prefix}treatments/${href}">${label}</a>`).join('');
  const nav = `<nav class="nav-links" aria-label="Primary"><a${cls('index')} href="${prefix}index.html">Home</a><a${cls('about')} href="${prefix}about.html">About</a><a${cls('services')} href="${prefix}services.html">Services</a><div class="nav-drop"><a class="${dropActive}nav-drop-toggle" href="${prefix}treatments.html" aria-haspopup="true" aria-expanded="false">Treatments</a><div class="nav-menu" aria-label="Treatment pages">${items}</div></div><a href="${prefix}index.html#journal">Journal</a><a href="${prefix}index.html#contact">Contact</a></nav>`;
  html = html.replace(/<nav class="nav-links"[^>]*>[\s\S]*?<\/nav>/, nav);
  html = html.replace(/styles\.css\?v=20260904f/g, 'styles.css?v=20260904g');
  fs.writeFileSync(file, html);
}
