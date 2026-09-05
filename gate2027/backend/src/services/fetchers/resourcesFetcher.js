// Fetch internships and placement resources
const { upsertMany } = require('./fetchUtils');
const { INTERNSHIPS, PLACEMENT_RESOURCES, STUDY_MATERIALS } = require('../../data/liveDataSeed');

async function fetchInternships() {
  const items = INTERNSHIPS.map((i) => ({ ...i, status: 'published', sourceUrl: i.url }));
  return upsertMany(items, true);
}

async function fetchPlacementResources() {
  const items = PLACEMENT_RESOURCES.map((p) => ({ ...p, status: 'published', sourceUrl: p.url }));
  return upsertMany(items, true);
}

async function fetchStudyMaterials() {
  const items = STUDY_MATERIALS.map((s) => ({ ...s, status: 'published', sourceUrl: s.url }));
  return upsertMany(items, true);
}

module.exports = { fetchInternships, fetchPlacementResources, fetchStudyMaterials };
