const projects = [
  {id:'cord', title:'To Sever a Cord', medium:'Narrative game'},
  {id:'chameleon', title:'Chameleon’s Leave', medium:'2D mobile game'},
  {id:'drawing', title:'2D Daily Practice', medium:'Drawing studies'},
  {id:'model', title:'3D Daily Practice', medium:'3D modeling'}
];
const el = id => document.getElementById(id);
const gallery = el('gallery');
const selector = el('selector');
const covers = gallery.querySelectorAll('[data-cover]');
const strip = el('slides');
const reader = el('reader');
const about = el('about');
const stage = el('stage');
const pad = n => String(n).padStart(2,'0');
const imagePath = (project, name) => './assets/' + project.id + '/' + name;
const pdfPath = project => './assets/' + project.id + '.pdf';
let current = null;
let slideIndex = 0;
let returnFocus = null;
function selectProject(project) {
  if (project === current) return;
  current = project;
  gallery.dataset.project = project.id;
  for (const cover of covers) {
    cover.hidden = cover.dataset.cover !== project.id;
    if (!cover.hidden) cover.fetchPriority = 'high';
  }
  el('title').textContent = project.title;
  el('medium').textContent = project.medium;
  el('full').href = pdfPath(project);
  const slides = slideSets[project.id];
  el('total').textContent = pad(slides.length);
  [...selector.children].forEach(tile => tile.setAttribute('aria-pressed',String(tile.dataset.project === project.id)));
  strip.classList.toggle('five', slides.length === 5);
  strip.replaceChildren(...slides.map((slide,i) => {
    const card = document.createElement('a');
    card.className = 'slide-card';
    card.href = '#slide/' + project.id + '/' + (i+1);
    card.setAttribute('aria-label','Open slide ' + (i+1) + ', ' + slide.title);
    card.innerHTML = '<img src="' + imagePath(project,'thumb-' + (i+1) + '.webp') + '" alt=""><span class="caption"><span class="ordinal">' + pad(i+1) + '</span><span>' + slide.title + '</span></span>';
    return card;
  }));
  strip.scrollLeft = 0;
}
function choose(project) {
  selectProject(project);
  history.replaceState(null,'','#work/' + project.id);
}
for (const project of projects) {
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = 'project-tile';
  tile.dataset.project = project.id;
  tile.setAttribute('aria-label',project.title);
  tile.innerHTML = '<img src="' + imagePath(project,'tile.webp') + '" alt=""><span class="tile-label" aria-hidden="true">' + project.title + '</span>';
  tile.addEventListener('click',() => choose(project));
  selector.append(tile);
  const li = document.createElement('li');
  const link = document.createElement('a');
  link.href = '#work/' + project.id;
  link.textContent = project.title;
  li.append(link);
  el('about-projects').append(li);
}
function setZoom(enabled) {
  stage.classList.toggle('zoomed',enabled);
  el('zoom').setAttribute('aria-pressed',String(enabled));
  el('zoom').textContent = enabled ? 'Fit slide' : 'Actual size';
  stage.scrollTo(0,0);
}
function showSlide(i) {
  const slides = slideSets[current.id];
  slideIndex = Math.max(0,Math.min(i,slides.length-1));
  const slide = slides[slideIndex];
  el('reader-project').textContent = current.title;
  el('slide-title').textContent = slide.title;
  el('slide-image').src = imagePath(current,slide.file);
  el('slide-image').alt = current.title + ' — ' + slide.title + ', original portfolio slide ' + (slideIndex+1);
  el('reader-pdf').href = pdfPath(current);
  el('position').textContent = pad(slideIndex+1) + ' / ' + pad(slides.length);
  reader.querySelector('.prev').disabled = slideIndex === 0;
  reader.querySelector('.next').disabled = slideIndex === slides.length-1;
  setZoom(false);
}
function stepSlide(delta) {
  const next = slideIndex + delta;
  if (next < 0 || next >= slideSets[current.id].length) return;
  showSlide(next);
  history.replaceState(null,'','#slide/' + current.id + '/' + (next+1));
}
function route() {
  const [view,id,num] = location.hash.slice(1).split('/');
  const project = projects.find(p => p.id === id);
  if (project) selectProject(project);
  const reading = project && (view === 'slide' || view === 'project');
  const modal = reading ? reader : view === 'about' ? about : null;
  const previousModal = reader.open ? reader : about.open ? about : null;
  if (modal !== previousModal && previousModal) previousModal.close();
  if (reading) showSlide(/^\d+$/.test(num || '') ? Number(num)-1 : 0);
  if (modal && !modal.open) {
    if (!previousModal) returnFocus = document.activeElement;
    modal.showModal();
    modal.querySelector('.close').focus({preventScroll:true});
  } else if (!modal && previousModal) {
    const target = returnFocus?.isConnected && returnFocus !== document.body ? returnFocus : selector.querySelector('[aria-pressed=true]');
    target.focus({preventScroll:true});
  }
}
function dismiss() {
  history.replaceState(null,'','#work/' + current.id);
  route();
}
for (const dialog of [reader,about]) {
  dialog.querySelector('.close').addEventListener('click',dismiss);
  dialog.addEventListener('cancel',e => {e.preventDefault();dismiss()});
  dialog.addEventListener('click',e => {
    if (e.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dismiss();
  });
}
reader.querySelector('.prev').addEventListener('click',() => stepSlide(-1));
reader.querySelector('.next').addEventListener('click',() => stepSlide(1));
el('zoom').addEventListener('click',() => setZoom(!stage.classList.contains('zoomed')));
document.addEventListener('keydown',e => {
  if (e.altKey || e.ctrlKey || e.metaKey || !['ArrowLeft','ArrowRight'].includes(e.key)) return;
  const delta = e.key === 'ArrowRight' ? 1 : -1;
  if (reader.open) {
    if (stage.classList.contains('zoomed') && e.target === stage) return;
    e.preventDefault();stepSlide(delta);
  } else if (!about.open) {
    e.preventDefault();
    if (strip.contains(e.target)) {
      const cards = [...strip.children];
      cards[(cards.indexOf(e.target.closest('a')) + delta + cards.length) % cards.length].focus();
    } else {
      const index = (projects.indexOf(current) + delta + projects.length) % projects.length;
      choose(projects[index]);
      if (selector.contains(e.target)) selector.children[index].focus({preventScroll:true});
    }
  }
});
window.addEventListener('hashchange',route);
selectProject(projects[0]);
route();
