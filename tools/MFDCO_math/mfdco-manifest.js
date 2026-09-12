/* MFDCO_math v2.3 module/capability manifest */
(function(global){
"use strict";
const manifest={
  app:"MFDCO_math",
  version:"1.0.0",
  projectFormat:2,
  modules:[
    ["project-schema","MFDCOProjectSchema","2.9"],
    ["storage","MFDCOStorage","3.1"],
    ["workspace","MFDCOWorkspace","3.4"],
    ["symbolic","MFDCOSymbolic","3.7"],
    ["advanced","MFDCOAdvanced","3.8"],
    ["functions","MFDCOFunctions","3.8"],
    ["engine","MFDCOEngine","3.7"],
    ["units","MFDCOUnits","3.6"],
    ["quantities","MFDCOQuantities","3.7"],
    ["templates","MFDCOTemplates","3.8.2"],
    ["language","MFDCOLanguage","3.4"],
    ["syntax","MFDCOSyntax","2.7"],
    ["registry-search","MFDCORegistrySearch","2.9"],
    ["ui","MFDCOUI","2.4"],
    ["calendar","MFDCOCalendar","2.2"],
    ["shell","MFDCOShell","2.9"],
    ["results","MFDCOResults","3.8.2"],
    ["release-tests","MFDCOReleaseTests","3.0"]
  ],
  capabilities:[
    "expression-evaluation","ans-history","variables","deg-rad",
    "if-else","for","while","plot","graph-rendering","png-export",
    "unit-conversion","custom-units","calendar-conversion",
    "project-save","project-import-export","wiki-registry","function-regression-tests","metadata-driven-candidates","unit-regression-tests","template-regression-tests","project-schema-validation","language-registry","language-regression-tests","registry-driven-syntax-highlighting","storage-roundtrip-tests","wiki-registry-tables","shared-base-css","shared-results-controller","page-specific-css","shared-registry-search","candidate-search","storage-adapter","memory-storage-tests","storage-crud-regression","shared-code-workspace","shared-result-workspace","project-import-rollback","library-crud-unification","workspace-dirty-state","import-size-limit","deep-project-validation","shared-state-indicator","file-url-workspace-bridge","body-overlay-file-menu","broadcast-channel-code-sync","peer-state-handshake","bidirectional-live-edit","shared-variable-environment","code-highlighter-fix","autosave-mode","beforeunload-warning","project-backups","deep-plot-validation","project-name-chip","shared-undo-redo","user-defined-functions","advanced-control-flow","vector-matrix-math","formula-aware-plots","graph-resampling","graph-analysis","csv-export","svg-export","unit-aware-values","dimensional-analysis","quantity-conversion","quantity-variables","quantity-aware-engineering","prime-factorization","polynomial-algebra","symbolic-calculus","taylor-series","maclaurin-series","complex-numbers","equation-solving","statistics","probability","advanced-engineering","large-code-templates"
  ]
};
function status(){
  return manifest.modules.map(([id,globalName,expected])=>{
    const mod=global[globalName];
    return {id,globalName,expected,loaded:!!mod,actual:mod?.version||null,
      ok:!!mod&&String(mod.version)===String(expected)};
  });
}
global.MFDCOManifest={
  productName:"MFDCO_math",
  publicVersion:"1.0.0",...manifest,status};
})(typeof window!=="undefined"?window:globalThis);
