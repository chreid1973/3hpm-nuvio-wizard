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

    settingsGrid.insertAdjacentHTML('afterend', `
      <fieldset id="meteorOptions" class="checks meteorOptions isHiddenForSelection">
        <legend>Meteor options</legend>
        <p class="helperText"><strong>Provider: Torrent (P2P)</strong> · locked for TB Instant compatibility. No debrid API key is added to Meteor.</p>
        <div class="optionsGrid">
          <label><input id="meteorRemoveSamples" type="checkbox"><span>Remove sample releases</span></label>
          <label><input id="meteorExclude3D" type="checkbox"><span>Exclude 3D releases</span></label>
          <label><input id="meteorAllowAdult" type="checkbox" checked><span>Allow adult results</span></label>
        </div>
        <div class="settingsGrid" style="margin-top:14px;">
          <div class="field">
            <label for="meteorMinSeeders">Minimum seeders</label>
            <input id="meteorMinSeeders" type="number" min="0" step="1" value="0">
            <small>0 means no minimum.</small>
          </div>
          <div class="field">
            <label for="meteorMaxResults">Maximum total results</label>
            <input id="meteorMaxResults" type="number" min="0" step="1" value="0">
            <small>0 means unlimited.</small>
          </div>
          <div class="field">
            <label for="meteorPreferredLangs">Preferred languages</label>
            <select id="meteorPreferredLangs">
              <option value="en-multi" selected>English + Multi · recommended</option>
              <option value="en">English only preferred</option>
              <option value="none">No preference</option>
            </select>
            <small>Preferred languages are sorted higher; this does not require them.</small>
          </div>
        </div>
      </fieldset>
    `);
  }

  function buildMeteorConfig() {
    const selectedResolutions = getSelectedResolutions();
    const allSelected = resolutionKeys.every(key => selectedResolutions.includes(key));
    const preferredSetting = document.getElementById('meteorPreferredLangs')?.value || 'en-multi';
    const preferredLangs = preferredSetting === 'en' ? ['en'] : preferredSetting === 'none' ? [] : ['en', 'multi'];

    return {
      cachedOnly: document.getElementById('cachedOnly')?.checked ?? true,
      skipReleaseFilter: true,
      removeTrash: document.getElementById('removeTrash')?.checked ?? false,
      removeSamples: document.getElementById('meteorRemoveSamples')?.checked ?? false,
      allowAdult: document.getElementById('meteorAllowAdult')?.checked ?? true,
      exclude3D: document.getElementById('meteorExclude3D')?.checked ?? false,
      enableSeaDex: false,
      showYourMedia: false,
      yourMediaLegacyMode: false,
      minSeeders: Number(document.getElementById('meteorMinSeeders')?.value) || 0,
      maxResults: Number(document.getElementById('meteorMaxResults')?.value) || 0,
      maxPerResolution: Number(document.getElementById('maxResults')?.value) || 0,
      resolutions: allSelected ? [] : selectedResolutions.map(key => meteorResolutionMap[key]).filter(Boolean),
      preferredLangs,
      languages: [],
      excludedLangs: [],
      resultFormat: ['title', 'quality', 'size', 'audio'],
      languageFormat: 'flags',
      sortOrder: ['cached', 'quality', 'resolution', 'seadex', 'language', 'seeders', 'size', 'pack'],
      allowP2P: false,
      excludedSources: []
    };
  }

  function buildMeteorManifestUrl() {
    const encoded = base64EncodeUnicode(JSON.stringify(buildMeteorConfig()));
    return `${meteorBaseUrl}/${encoded}/manifest.json`;
  }

  addMeteorChoice();
  addMeteorOptions();

  const originalBuildSelectedManifests = window.buildSelectedManifests;
  window.buildSelectedManifests = function () {
    const selected = getSelectedAddons();
    if (selected.has('meteor')) {
      return [{
        id: 'meteor',
        label: 'Meteor',
        name: '3HPM | Meteor TB Instant',
        description: 'Generated from the Meteor Torrent (P2P) baseline and your selected wizard settings.',
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
      options?.classList.remove('isHiddenForSelection');
      maxResultsField?.classList.remove('isHiddenForSelection');
      maxSizeField?.classList.add('isHiddenForSelection');
      presetField?.classList.add('isHiddenForSelection');

      const maxResultsLabel = maxResultsField?.querySelector('label');
      const maxResultsHelp = maxResultsField?.querySelector('small');
      if (maxResultsLabel) maxResultsLabel.textContent = 'Max results per resolution';
      if (maxResultsHelp) maxResultsHelp.textContent = 'Meteor setting. 0 means unlimited.';

      const note = document.getElementById('addonSettingsNote');
      if (note) note.textContent = 'Meteor uses Torrent (P2P) as its provider for TB Instant. Configure the filters below, then generate one Meteor manifest.';
    } else {
      maxSizeField?.classList.remove('isHiddenForSelection');
      const maxResultsLabel = maxResultsField?.querySelector('label');
      const maxResultsHelp = maxResultsField?.querySelector('small');
      if (maxResultsLabel) maxResultsLabel.textContent = 'Max results per resolution';
      if (maxResultsHelp) maxResultsHelp.textContent = '10 is a strong tested value. 0 means unlimited. This setting applies to Comet only.';
    }
  };

  const originalUpdatePageCopy = window.updatePageCopy;
  window.updatePageCopy = function () {
    originalUpdatePageCopy();
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Generate one keyless Comet, Torrentio, StremThru Torz, or Meteor manifest at a time for Nuvio Connected Services.');
  };

  updateOutput();
})();
