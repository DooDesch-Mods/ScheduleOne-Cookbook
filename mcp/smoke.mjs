// Quick offline check of the corpus + query logic (no MCP transport).
import { loadCorpus, search, getPage, listPages, listSections } from './lib.mjs';

const corpus = loadCorpus();
let failures = 0;
const check = (cond, msg) => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${msg}`);
  if (!cond) failures++;
};

check(corpus.pages.length >= 50, `indexed ${corpus.pages.length} pages`);
check(listSections(corpus).length >= 9, `${listSections(corpus).length} sections`);

for (const q of ['custom RPC codegen', 'IL2CPP List interop', 'MelonPreferences hot reload', 'vehicle enter exit', 'furniture grid']) {
  const r = search(corpus, q, { limit: 3 });
  check(r.length > 0, `search "${q}" -> ${r.length} hit(s); top: ${r[0]?.slug} (${r[0]?.score})`);
}

const veh = getPage(corpus, 'snippets/vehicles');
check(!!veh && /VehicleEvents/.test(veh.markdown), 'get_page snippets/vehicles has VehicleEvents');
check(veh?.sources?.length > 0, `vehicles page exposes ${veh?.sources?.length} source credit(s)`);

const byUrl = getPage(corpus, 'https://doodesch-mods.github.io/ScheduleOne-Cookbook/il2cpp/interop-and-types/');
check(!!byUrl, 'get_page accepts a full URL');

const filtered = listPages(corpus, { section: 'networking' });
check(filtered.length >= 5, `list_pages section=networking -> ${filtered.length}`);

console.log(failures === 0 ? '\nALL SMOKE CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
