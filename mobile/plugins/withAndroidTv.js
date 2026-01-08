const { withAndroidManifest } = require('expo/config-plugins');

// Enables installing & launching the app on Android TV / Google TV.
// - Adds Leanback launcher category
// - Declares leanback as optional feature
// - Declares touchscreen as not required (so TVs without touch can install)
//
// Note: This is a minimal manifest augmentation. A production TV app should
// also provide a correctly-sized TV banner and validate overscan-safe layouts.

function ensureArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function hasCategory(intentFilter, categoryName) {
  const categories = ensureArray(intentFilter.category);
  return categories.some((c) => c?.$?.['android:name'] === categoryName);
}

function addCategory(intentFilter, categoryName) {
  intentFilter.category = ensureArray(intentFilter.category);
  if (!hasCategory(intentFilter, categoryName)) {
    intentFilter.category.push({ $: { 'android:name': categoryName } });
  }
}

function ensureUsesFeature(manifest, featureName, required) {
  manifest['uses-feature'] = ensureArray(manifest['uses-feature']);

  const existing = manifest['uses-feature'].find((f) => f?.$?.['android:name'] === featureName);
  if (existing) {
    existing.$['android:required'] = String(required);
    return;
  }

  manifest['uses-feature'].push({
    $: {
      'android:name': featureName,
      'android:required': String(required),
    },
  });
}

function withAndroidTv(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Allow install on devices that support Leanback (Android TV) but don't require it.
    ensureUsesFeature(manifest, 'android.software.leanback', false);

    // TVs generally don't have touch screens.
    ensureUsesFeature(manifest, 'android.hardware.touchscreen', false);

    const app = manifest.application?.[0];
    if (!app) return config;

    const activities = ensureArray(app.activity);
    const mainActivity = activities.find((a) => a?.$?.['android:name'] === '.MainActivity') || activities[0];
    if (!mainActivity) return config;

    const intentFilters = ensureArray(mainActivity['intent-filter']);

    // Add LEANBACK_LAUNCHER category to the main launcher intent filter.
    intentFilters.forEach((filter) => {
      const actions = ensureArray(filter.action);
      const hasMainAction = actions.some((a) => a?.$?.['android:name'] === 'android.intent.action.MAIN');
      if (!hasMainAction) return;

      addCategory(filter, 'android.intent.category.LEANBACK_LAUNCHER');
    });

    mainActivity['intent-filter'] = intentFilters;

    return config;
  });
}

module.exports = withAndroidTv;
