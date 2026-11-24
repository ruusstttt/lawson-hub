(() => {
  const simplePanel = $('simple-generator');
  const editorPanel = $('thumbnail-editor');
  const simpleTab = $('simple-mode');
  const editorTab = $('editor-mode');
  const week = $('simple-week');
  const left = $('simple-left');
  const right = $('simple-right');
  const canvas = $('simple-canvas');
  const context = canvas.getContext('2d');
  const downloadButton = $('simple-download');
  const status = $('simple-status');
  const photoInputs = new Map();
  let assetsReady = false;
  let photoSelection = {status:'loading'};
  let rendered = null;
  let exporting = false;

  function showMode(editor){
    simplePanel.hidden = editor;
    editorPanel.hidden = !editor;
    simpleTab.setAttribute('aria-selected', String(!editor));
    editorTab.setAttribute('aria-selected', String(editor));
    simpleTab.tabIndex = editor ? -1 : 0;
    editorTab.tabIndex = editor ? 0 : -1;
    if(editor) initializeEditorPhoto();
    window.scrollTo(0, 0);
  }
  simpleTab.addEventListener('click', () => showMode(false));
  editorTab.addEventListener('click', () => showMode(true));
  simpleTab.parentElement.addEventListener('keydown', event => {
    const { key, target } = event;
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(key)) return;
    event.preventDefault();
    const next = key === 'End' || (key !== 'Home' && target === simpleTab) ? editorTab : simpleTab;
    showMode(next === editorTab);
    next.focus();
  });

  for(const select of [left, right]){
    for(const [team, color] of Object.entries(TEAMS)){
      if(color) select.add(new Option(team.split(' ').at(-1), team));
    }
  }
  left.value = 'Buffalo Bills';
  right.value = 'Los Angeles Rams';

  function showStatus(message, error = false){
    status.textContent = message;
    status.classList.toggle('error', error);
  }

  function updatePreview(){
    rendered = null;
    downloadButton.disabled = true;

    // Disable the selected opponent in each list, while leaving all other matchups available.
    for(const option of left.options) option.disabled = option.value === right.value;
    for(const option of right.options) option.disabled = option.value === left.value;

    const leftLogo = LOGOS[findTeamLogo(left.value)];
    const rightLogo = LOGOS[findTeamLogo(right.value)];
    for(const [mark, logo] of [[$('simple-left-mark'), leftLogo], [$('simple-right-mark'), rightLogo]]){
      mark.hidden = !logo;
      if(logo) mark.src = logo.src;
    }

    if(!week.validity.valid) return showStatus('Enter a week number from 1 to 18.', true);
    if(left.value === right.value) return showStatus('Choose two different teams.', true);
    if(photoSelection.status === 'error') return showStatus('The photo couldn’t load. Choose another photo or reload the page.', true);
    if(!assetsReady || photoSelection.status === 'loading') return showStatus('Loading your preview…');

    if(!leftLogo || !rightLogo) return showStatus('A team logo couldn’t load. Reload the page or choose another team.', true);

    render(context, 1, {week:week.valueAsNumber, photo:photoSelection.image, leftLogo, rightLogo});
    canvas.setAttribute('aria-label', `NFL Week ${week.valueAsNumber}, ${left.value} vs ${right.value}, Best Bets`);
    rendered = {
      filename: `nfl-week-${week.valueAsNumber}-${left.value.toLowerCase().replaceAll(' ', '-')}-vs-${right.value.toLowerCase().replaceAll(' ', '-')}.png`
    };
    downloadButton.disabled = exporting;
    showStatus('');
  }

  async function choosePhoto(item){
    const selection = {status:'loading'};
    photoSelection = selection;
    photoInputs.get(item.id).checked = true;
    updatePreview();
    try {
      selection.image = await getPhoto(item);
      selection.status = 'ready';
    } catch {
      selection.status = 'error';
    }
    if(photoSelection === selection) updatePreview();
  }

  for(const [index, item] of catalog.entries()){
    const tile = document.createElement('label');
    const input = document.createElement('input');
    const image = document.createElement('img');
    tile.title = item.label;
    input.type = 'radio';
    input.name = 'simple-photo';
    input.setAttribute('aria-label', item.label);
    input.addEventListener('change', () => choosePhoto(item));
    image.src = `assets/photo-previews/${item.id}.png`;
    image.alt = '';
    image.width = image.height = 144;
    image.decoding = 'async';
    image.loading = index < 12 ? 'eager' : 'lazy';
    tile.append(input, image);
    photoInputs.set(item.id, input);
    $('simple-photos').append(tile);
  }

  week.addEventListener('input', updatePreview);
  left.addEventListener('change', updatePreview);
  right.addEventListener('change', updatePreview);
  downloadButton.addEventListener('click', async () => {
    if(!rendered || exporting) return;
    const snapshot = rendered;
    exporting = true;
    downloadButton.disabled = true;
    try {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(result => result ? resolve(result) : reject(new Error('PNG encoding failed.')), 'image/png');
      });
      const {downloadBlob} = await import('../assets/download.mjs');
      downloadBlob(blob, snapshot.filename);
    } catch {
      if(rendered === snapshot) showStatus('The PNG couldn’t be saved. Try downloading again.', true);
    } finally {
      exporting = false;
      downloadButton.disabled = !rendered;
    }
  });

  const initialPhoto = catalog.find(item => item.id === '02-angry-scream-brown') || catalog[0];
  if(initialPhoto) choosePhoto(initialPhoto);
  else photoSelection = {status:'error'};

  // Explicitly load the canvas fonts, even when Editor mode has not been opened.
  Promise.all([bundledLogosReady, document.fonts.load('400 146px "Archivo Black"'), document.fonts.load('700 48px "Barlow Condensed"')])
    .then(() => { assetsReady = true; updatePreview(); })
    .catch(() => showStatus('The preview couldn’t load. Reload the page and try again.', true));
})();
