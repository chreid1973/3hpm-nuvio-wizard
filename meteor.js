(function () {
  const meteorBaseUrl = 'https://meteorfortheweebs.midnightignite.me';
  const meteorResolutionMap = {
    r2160p: '2160p',
    r1440p: '1440p',
    r1080p: '1080p',
    r720p: '720p',
    r576p: '576p',
    r480p: '480p',
    r360p: '360p',
    r240p: '240p',
    unknown: 'Unknown'
  };

  const meteorLanguageOptions = [
    ['en', 'English'],
    ['multi', 'Multi'],
    ['fr', 'French'],
    ['es', 'Spanish'],
    ['de', 'German'],
    ['it', 'Italian'],
    ['pt', 'Portuguese'],
    ['ja', 'Japanese'],
    ['ko', 'Korean'],
    ['ru', 'Russian']
  ];

  const meteorSortLabels = {
    cached: 'Cached',
    seadex: 'SeaDex',
    resolution: 'Resolution',
    quality: 'Quality',
    language: 'Language',
    seeders: 'Peers',
    size: 'Size',
    pack: 'Season Pack'
  };

  const meteorDefaultSort = ['cached', 'seadex', 'resolution', 'language', 'seeders', 'size', 'pack', 'quality'];
  let meteorDefaultsApplied = false;

  function languageOptionsHtml() {
    return meteorLanguageOptions
      .map(([value, label]) => `<option value="${value}">${label}</option>`)
      .join('');
  }

  function addMeteorChoice() {
    const picker = document.querySelector('.addonPicker');
    if (!picker || picker.querySelector('.addonOption[value="meteor"]')) return;

    picker.insertAdjacentHTML('beforeend', `
      <label class="addonChoice">
        <input class="addonOption" type="checkbox" value="meteor" />
        <span><strong>Meteor</strong><small>Configurable Meteor manifest using the Torrent (P2P) provider path required for TB Instant.</small></span>
      </label>
    `);
  }

  function addMeteorOptions() {
    const settingsGrid = document.querySelector('.settingsGrid');
    if (!settingsGrid || document.getElementById('meteorOptions')) return;

    const sortRows = meteorDefaultSort.map((key, index) => `
      <div class="field meteorSortField">
        <label for="meteorSort${index}">Priority ${index + 1}</label>
        <select id="meteorSort${index}" class="meteorSortSelect" data-sort-index="${index}">
          ${Object.entries(meteorSortLabels).map(([value, label]) =>
            `<option value="${value}"${value === key ? ' selected' : ''}>${label}</option>`
          ).join('')}
        </select>
      </div>
    `).join('');

    settingsGrid.insertAdjacentHTML('afterend', `
      <fieldset id="meteorOptions" class="checks meteorOptions isHiddenForSelection">
        <legend>Meteor options</legend>
        <p class="helperText"><strong>Provider: Torrent (P2P)</strong> · locked for TB Instant compatibility. No debrid API key is added to Meteor.</p>

        <div class="optionsGrid">
          <label><input id="meteorSmartFilter" type="checkbox" checked><span>Smart Filter · remove CAM/TS/Screener</span></label>
          <label><input id="meteorRemoveSamples" type="checkbox" checked><span>Remove Samples</span></label>
          <label><input id="meteorHideAdult" type="checkbox" checked><span>Hide Adult</span></label>
          <label><input id="meteorExclude3D" type="checkbox" checked><span>Exclude 3D</span></label>
          <label><input id="meteorDigitalRelease" type="checkbox" checked><span>Digital Release filter</span></label>
        </div>

        <div class="settingsGrid" style="margin-top:14px;">
          <div class="field">
            <label for="meteorMaxResults">Maximum total results</label>
            <input id="meteorMaxResults" type="number" min="0" step="1" value="0">
            <small>0 means unlimited.</small>
          </div>
          <div class="field">
            <label for="meteorMinSeeders">Minimum seeders</label>
            <input id="meteorMinSeeders" type="number" min="0" step="1" value="0">
            <small>0 means no minimum.</small>
          </div>
          <div class="field">
            <label>Maximum size per file</label>
            <input type="text" value="No limit · use Meteor site for custom size" readonly>
            <small>Meteor's non-zero size serialization has not been verified, so the wizard will not guess it.</small>
          </div>
        </div>

        <div class="settingsGrid meteorLanguageGrid" style="margin-top:14px;">
          <div class="field">
            <label for="meteorPreferredLangs">Preferred languages</label>
            <select id="meteorPreferredLangs" multiple size="5">
              ${languageOptionsHtml()}
            </select>
            <small>Preferred languages sort matching releases higher without filtering other languages.</small>
          </div>
          <div class="field">
            <label for="meteorRequiredLangs">Required languages</label>
            <select id="meteorRequiredLangs" multiple size="5">
              ${languageOptionsHtml()}
            </select>
            <small>Keep only results matching at least one selected language.</small>
          </div>
          <div class="field">
            <label for="meteorExcludedLangs">Excluded languages</label>
            <select id="meteorExcludedLangs" multiple size="5">
              ${languageOptionsHtml()}
            </select>
            <small>Drop results matching any selected language.</small>
          </div>
          <div class="field">
            <label for="meteorLanguageFormat">Language display</label>
            <select id="meteorLanguageFormat">
              <option value="flags" selected>Country flags</option>
              <option value="codes">ISO codes</option>
            </select>
          </div>
        </div>

        <fieldset class="checks" style="margin-top:14px;">
          <legend>Show in results</legend>
          <div class="optionsGrid">
            <label><input class="meteorResultFormat" type="checkbox" value="title" checked><span>Title</span></label>
            <label><input class="meteorResultFormat" type="checkbox" value="quality" checked><span>Quality</span></label>
            <label><input class="meteorResultFormat" type="checkbox" value="size" checked><span>Size</span></label>
            <label><input class="meteorResultFormat" type="checkbox" value="audio" checked><span>Audio</span></label>
          </div>
        </fieldset>

        <details class="advanced meteorAdvanced" style="margin-top:14px;">
          <summary>Advanced · Ranking priority</summary>
          <div class="advancedBody">
            <p>Choose a unique value for each priority. The order is encoded directly into Meteor's <code>sortOrder</code>.</p>
            <div class="settingsGrid">${sortRows}</div>
            <p id="meteorSortWarning" class="addonSettingsNote"></p>
          </div>
        </details>
      </fieldset>
    `);
  }

  function selectValues(select, values) {
    if (!select) return;
    const wanted = new Set(values);
    [...select.options].forEach(option => { option.selected = wanted.has(option.value); });
  }

  function getMultiSelectValues(id) {
    const select = document.getElementById(id);
    return select ? [...select.selectedOptions].map(option => option.value) : [];
  }

  function getMeteorSortOrder() {
    const selects = [...document.querySelectorAll('.meteorSortSelect')];
    const values = selects.map(select => select.value);
    const unique = new Set(values);
    const warning = document.getElementById('meteorSortWarning');

    if (unique.size !== values.length) {
      if (warning) warning.textContent = 'Each ranking priority must be unique. Meteor default order will be used until duplicates are removed.';
      return meteorDefaultSort;
    }

    if (warning) warning.textContent = '';
    return values;
  }

  function applyWorkingMeteorDefaults() {
    if (meteorDefaultsApplied) return;
    meteorDefaultsApplied = true;

    setSelectedResolutions(resolutionKeys);
    if (document.getElementById('cachedOnly')) document.getElementById('cachedOnly').checked = false;
    if (document.getElementById('removeTrash')) document.getElementById('removeTrash').checked = true;
    if (document.getElementById('maxResults')) document.getElementById('maxResults').value = 0;

    if (document.getElementById('meteorSmartFilter')) document.getElementById('meteorSmartFilter').checked = true;
    if (document.getElementById('meteorRemoveSamples')) document.getElementById('meteorRemoveSamples').checked = true;
    if (document.getElementById('meteorHideAdult')) document.getElementById('meteorHideAdult').checked = true;
    if (document.getElementById('meteorExclude3D')) document.getElementById('meteorExclude3D').checked = true;
    if (document.getElementById('meteorDigitalRelease')) document.getElementById('meteorDigitalRelease').checked = true;
    if (document.getElementById('meteorMinSeeders')) document.getElementById('meteorMinSeeders').value = 0;
    if (document.getElementById('meteorMaxResults')) document.getElementById('meteorMaxResults').value = 0;

    selectValues(document.getElementById('meteorPreferredLangs'), ['en', 'multi']);
    selectValues(document.getElementById('meteorRequiredLangs'), []);
    selectValues(document.getElementById('meteorExcludedLangs'), []);

    if (document.getElementById('meteorLanguageFormat')) document.getElementById('meteorLanguageFormat').value = 'flags';
    document.querySelectorAll('.meteorResultFormat').forEach(input => { input.checked = true; });

    document.querySelectorAll('.meteorSortSelect').forEach((select, index) => {
      select.value = meteorDefaultSort[index];
    });
  }

  function buildMeteorConfig() {
    const selectedResolutions = getSelectedResolutions();
    const allSelected = resolutionKeys.every(key => selectedResolutions.includes(key));
    const resultFormat = [...document.querySelectorAll('.meteorResultFormat:checked')].map(input => input.value);

    return {
      cachedOnly: document.getElementById('cachedOnly')?.checked ?? false,
      skipReleaseFilter: !(document.getElementById('meteorDigitalRelease')?.checked ?? true),
      removeTrash: document.getElementById('meteorSmartFilter')?.checked ?? true,
      removeSamples: document.getElementById('meteorRemoveSamples')?.checked ?? true,
      allowAdult: !(document.getElementById('meteorHideAdult')?.checked ?? true),
      exclude3D: document.getElementById('meteorExclude3D')?.checked ?? true,
      enableSeaDex: false,
      showYourMedia: false,
      yourMediaLegacyMode: false,
      minSeeders: Number(document.getElementById('meteorMinSeeders')?.value) || 0,
      maxResults: Number(document.getElementById('meteorMaxResults')?.value) || 0,
      maxPerResolution: Number(document.getElementById('maxResults')?.value) || 0,
      resolutions: allSelected ? [] : selectedResolutions.map(key => meteorResolutionMap[key]).filter(Boolean),
      preferredLangs: getMultiSelectValues('meteorPreferredLangs'),
      languages: getMultiSelectValues('meteorRequiredLangs'),
      excludedLangs: getMultiSelectValues('meteorExcludedLangs'),
      resultFormat: resultFormat.length ? resultFormat : ['title', 'quality', 'size', 'audio'],
      languageFormat: document.getElementById('meteorLanguageFormat')?.value || 'flags',
      sortOrder: getMeteorSortOrder(),
      allowP2P: false,
      excludedSources: []
    };
  }

  function buildMeteorManifestUrl() {
    const encoded = base64EncodeUnicode(JSON.stringify(buildMeteorConfig())).replace(/=+$/, '');
    return `${meteorBaseUrl}/${encoded}/manifest.json`;
  }

  addMeteorChoice();
  addMeteorOptions();

  const meteorInput = document.querySelector('.addonOption[value="meteor"]');
  meteorInput?.addEventListener('change', () => {
    if (!meteorInput.checked) return;
    applyWorkingMeteorDefaults();
    updateOutput();
  });

  const originalBuildSelectedManifests = window.buildSelectedManifests;
  window.buildSelectedManifests = function () {
    const selected = getSelectedAddons();
    if (selected.has('meteor')) {
      return [{
        id: 'meteor',
        label: 'Meteor',
        name: '3HPM | Meteor TB Instant',
        description: 'Generated from Meteor with Torrent (P2P) locked for TB Instant and your selected filters.',
        url: buildMeteorManifestUrl()
      }];
    }
    return originalBuildSelectedManifests();
  };

  const originalUpdateSelectionUi = window.updateSelectionUi;
  window.updateSelectionUi = function () {
    originalUpdateSelectionUi();

    const selected = getSelectedAddons();
    const hasMeteor = selected.has('meteor');
    const meteorOptions = document.getElementById('meteorOptions');
    meteorOptions?.classList.toggle('isHiddenForSelection', !hasMeteor);

    const resolutions = document.querySelector('.resolutions');
    const settingsGrid = document.querySelector('#step2 > .stepBody .settingsGrid');
    const options = document.querySelector('.checks.options');
    const maxResultsField = document.getElementById('maxResults')?.closest('.field');
    const maxSizeField = document.getElementById('maxSize')?.closest('.field');
    const presetField = document.getElementById('preset')?.closest('.field');

    if (hasMeteor) {
      resolutions?.classList.remove('isHiddenForSelection');
      settingsGrid?.classList.remove('isHiddenForSelection');
      options?.classList.add('isHiddenForSelection');
      maxResultsField?.classList.remove('isHiddenForSelection');
      maxSizeField?.classList.add('isHiddenForSelection');
      presetField?.classList.add('isHiddenForSelection');

      const maxResultsLabel = maxResultsField?.querySelector('label');
      const maxResultsHelp = maxResultsField?.querySelector('small');
      if (maxResultsLabel) maxResultsLabel.textContent = 'Max results per resolution';
      if (maxResultsHelp) maxResultsHelp.textContent = 'Meteor setting. 0 means unlimited.';

      const note = document.getElementById('addonSettingsNote');
      if (note) note.textContent = 'Meteor uses Torrent (P2P) as its provider for TB Instant. Configure Meteor below, then generate one manifest.';
    } else {
      maxSizeField?.classList.remove('isHiddenForSelection');
      const maxResultsLabel = maxResultsField?.querySelector('label');
      const maxResultsHelp = maxResultsField?.querySelector('small');
      if (maxResultsLabel) maxResultsLabel.textContent = 'Max results per resolution';
      if (maxResultsHelp) maxResultsHelp.textContent = '10 is a strong tested value. 0 means unlimited. This setting applies to Comet only.';
    }
  };

  updateOutput();
})();