import fs from 'fs';
import path from 'path';

const testFeatures = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

// Comprehensive dependency rules based on feature descriptions
const dependencyRules = {
  // AUTHENTICATION - Foundation
  'user-authentication': [],
  'login': ['user-authentication'],
  'logout': ['user-authentication'],
  'auth': ['user-authentication'],

  // DASHBOARD - Depends on auth
  'dashboard': ['user-authentication'],
  'case-list': ['user-authentication'],
  'overview': ['user-authentication'],

  // CASE CREATION - Depends on dashboard
  'case-creation': ['dashboard-case-list', 'user-authentication'],
  'new-case': ['dashboard-case-list'],
  'create-case': ['dashboard-case-list'],

  // DOCUMENT UPLOAD - Depends on case creation
  'upload': ['case-creation'],
  'document-upload': ['case-creation'],
  'drag-and-drop': ['case-creation'],
  'dropzone': ['case-creation'],

  // DOCUMENT PROCESSING - Depends on upload
  'ocr': ['document-upload'],
  'ocr-processing': ['document-upload'],
  'document-ai': ['document-upload'],
  'type-detection': ['document-upload'],
  'document-type': ['document-upload'],
  'preview': ['document-upload'],
  'document-preview': ['document-upload'],

  // ENTITY EXTRACTION - Depends on OCR
  'entity-extraction': ['ocr-processing', 'document-type-detection'],
  'entity-auto-creation': ['entity-extraction'],
  'person-entity': ['entity-extraction'],
  'property-entity': ['entity-extraction'],
  'person-card': ['person-entity-card'],
  'property-card': ['property-entity-card'],
  'person-entity-card': ['entity-extraction'],
  'property-entity-card': ['entity-extraction'],

  // CONSENSUS ENGINE - Depends on extraction
  'consensus': ['entity-extraction'],
  'consensus-engine': ['entity-extraction', 'ocr-processing'],
  'ocr-vs-llm': ['consensus-engine'],
  'pending': ['consensus-engine'],

  // EVIDENCE - Depends on extraction and OCR
  'evidence': ['entity-extraction', 'ocr-processing'],
  'evidence-modal': ['entity-extraction', 'ocr-processing'],
  'bounding-box': ['evidence-modal'],
  'highlight': ['evidence-modal'],
  'evidence-chain': ['evidence-modal', 'audit-trail'],
  'evidence-override': ['evidence-modal'],

  // ENTITY MANAGEMENT - Depends on entity cards
  'entity-merge': ['person-entity-card', 'property-entity-card'],
  'entity-split': ['person-entity-card', 'property-entity-card'],
  'entity-manual': ['person-entity-card', 'property-entity-card'],
  'merge': ['entity-merge'],
  'split': ['entity-split'],
  'duplicate': ['entity-merge'],
  'dedup': ['entity-merge'],

  // VALIDATION - Depends on entities
  'validation': ['entity-extraction'],
  'cpf-validation': ['person-entity-card'],
  'address-validation': ['property-entity-card'],
  'encumbrance': ['property-entity-card'],

  // CANVAS - Depends on entities
  'canvas': ['person-entity-card', 'property-entity-card'],
  'canvas-visualization': ['person-entity-card', 'property-entity-card'],
  'infinite-canvas': ['canvas-visualization'],
  'pan-zoom': ['canvas-visualization'],
  'minimap': ['canvas-visualization'],

  // CONNECTIONS - Depends on canvas
  'connection': ['canvas-visualization'],
  'canvas-connections': ['canvas-visualization'],
  'edge': ['canvas-connections'],
  'relationship': ['canvas-connections'],
  'spouse': ['canvas-connections'],
  'proxy': ['canvas-connections'],
  'represents': ['canvas-connections'],
  'owns': ['canvas-connections'],
  'sells': ['canvas-connections'],
  'buys': ['canvas-connections'],

  // CONNECTION TYPES - Depends on connections
  'connection-types': ['canvas-connections'],
  'canvas-connection-types': ['canvas-connections'],

  // CANVAS VALIDATION - Depends on connections and entities
  'canvas-validation': ['canvas-connections', 'entity-extraction'],
  'validation-warning': ['canvas-validation'],
  'spouse-consent': ['canvas-validation'],
  'graph-validation': ['canvas-validation'],

  // CANVAS SUGGESTIONS - Depends on validation
  'canvas-suggestions': ['entity-extraction', 'canvas-visualization'],
  'ai-suggestions': ['canvas-suggestions'],
  'auto-suggest': ['canvas-suggestions'],

  // DRAFT GENERATION - Depends on complete graph
  'draft-generation': ['canvas-validation', 'entity-extraction', 'canvas-connections'],
  'draft-generate': ['draft-generation'],
  'gemini-draft': ['draft-generation'],

  // DRAFT EDITOR - Depends on generation
  'draft-editor': ['draft-generation'],
  'tiptap': ['draft-editor'],
  'rich-text': ['draft-editor'],
  'formatting': ['draft-editor'],
  'draft-content': ['draft-editor'],

  // DRAFT FEATURES - Depend on editor
  'draft-versioning': ['draft-editor'],
  'section-navigation': ['draft-editor'],
  'track-changes': ['draft-editor'],
  'pending-items': ['draft-editor', 'consensus-engine'],
  'inline-editing': ['draft-editor'],
  'auto-save': ['draft-editor'],

  // CHAT INTERFACE - Depends on draft editor
  'chat': ['draft-editor'],
  'chat-interface': ['draft-editor'],
  'chat-panel': ['chat-interface'],
  'message-history': ['chat-interface'],

  // CHAT OPERATIONS - Depends on chat and draft
  'chat-operations': ['chat-interface', 'draft-editor'],
  'chat-edit': ['chat-operations'],
  'operation-preview': ['chat-operations'],
  'natural-language': ['chat-operations'],
  'function-calling': ['chat-operations'],
  'payment-terms': ['chat-operations'],
  'regenerate-section': ['chat-operations'],
  'add-clause': ['chat-operations'],
  'remove-clause': ['chat-operations'],
  'mark-pending': ['chat-operations', 'consensus-engine'],
  'resolve-pending': ['chat-operations'],
  'undo': ['chat-operations'],

  // AUDIT TRAIL - Depends on all modifications
  'audit-trail': ['draft-editor', 'chat-operations', 'entity-merge'],
  'audit': ['audit-trail'],
  'history': ['audit-trail'],
  'operations-log': ['audit-trail'],
  'audit-filtering': ['audit-trail'],
  'filter-section': ['audit-filtering'],
  'filter-user': ['audit-filtering'],
  'filter-date': ['audit-filtering'],
  'export-audit': ['audit-filtering'],

  // EXPORT - Depends on draft
  'export': ['draft-editor'],
  'export-html': ['draft-editor'],
  'export-pdf': ['draft-editor'],
  'print': ['draft-editor'],
  'print-stylesheet': ['draft-editor'],

  // COMPARISON - Depends on versioning
  'draft-comparison': ['draft-versioning'],
  'diff-view': ['draft-comparison'],
  'version-compare': ['draft-versioning'],

  // CASE MANAGEMENT - Depends on case creation
  'case-status': ['case-creation'],
  'case-deletion': ['case-creation'],
  'case-archival': ['case-creation'],
  'case-duplication': ['case-creation'],
  'status-transitions': ['case-creation'],
  'delete-case': ['case-creation'],
  'archive-case': ['case-creation'],

  // SEARCH/FILTER - Depends on case list
  'case-search': ['dashboard-case-list'],
  'sort-cases': ['dashboard-case-list'],
  'filter-cases': ['dashboard-case-list'],
  'pagination': ['dashboard-case-list'],
  'search': ['case-search'],
  'search-functionality': ['case-search'],

  // ROLES/PERMISSIONS - Depends on auth
  'user-roles': ['user-authentication'],
  'permissions': ['user-authentication'],
  'role-based': ['user-roles'],
  'clerk-cannot-approve': ['user-roles'],
  'supervisor-approve': ['user-roles'],
  'organization-settings': ['user-authentication'],
  'case-assignment': ['user-roles'],
  'assign': ['case-assignment'],

  // REAL-TIME - Depends on canvas/draft
  'realtime': ['canvas-visualization'],
  'realtime-presence': ['canvas-visualization', 'draft-editor'],
  'presence': ['realtime-presence'],
  'realtime-notifications': ['realtime-presence'],
  'notifications': ['realtime-notifications'],
  'collaborative-editing': ['realtime-presence'],

  // LEGAL FEATURES - Depend on entities and canvas
  'proxy-representation': ['canvas-connections', 'entity-extraction'],
  'power-of-attorney': ['proxy-representation'],
  'proxy-validity': ['proxy-representation'],
  'encumbrances-handling': ['property-entity-card'],
  'encumbrances-display': ['property-entity-card'],
  'property-lien': ['encumbrances-display'],

  // PERFORMANCE - Can be done anytime but touches many systems
  'performance-optimization': ['draft-generation', 'canvas-visualization'],
  'context-caching': ['chat-interface'],
  'bulk-processing': ['document-upload'],
  'batch-operations': ['document-upload'],

  // REPROCESSING - Depends on document processing
  'document-reprocessing': ['document-upload'],
  'retry': ['document-upload'],
  'error-recovery': ['document-upload'],

  // ERROR HANDLING - Depends on core features
  'offline-handling': ['user-authentication'],
  'session-timeout': ['user-authentication'],
  'error-messages': ['document-upload'],

  // ACCESSIBILITY - Can be implemented alongside others
  'keyboard-accessibility': [],
  'keyboard-shortcuts': [],
  'screen-reader': [],
  'reduced-motion': [],
  'high-contrast': [],
  'wcag': [],
  'color-contrast': [],
  'focus-visible': [],

  // LOCALIZATION - Independent
  'localization': [],
  'portuguese': [],
  'pt-br': [],
  'date-format': [],
  'currency-format': [],

  // UI/DESIGN - Can be mostly independent
  'design-system': [],
  'design-system-ui': [],
  'styling': [],
  'dark-mode': [],
  'animations': [],
  'responsive-design': [],
  'responsive': [],
  'mobile': [],
  'tablet': [],
  'button-styles': [],
  'modal': [],
  'form': [],
  'input': [],
  'badges': [],
  'cards': [],
  'breadcrumb': [],
  'tabs': [],
  'dropdown': [],
  'tooltip': [],
  'checkbox': [],
  'radio': [],
  'toggle': [],
  'progress-bar': [],
  'skeleton': [],
  'loading': [],
  'empty-state': [],
  'notification': [],
  'toast': [],

  // END-TO-END - Depends on everything
  'end-to-end': ['case-creation', 'document-upload', 'entity-extraction',
                 'canvas-visualization', 'draft-generation', 'chat-operations', 'audit-trail'],
};

function getKeywords(description) {
  return description.toLowerCase().split(/\s+/);
}

function findDirectDependencies(feature, allFeatures, ruleMap) {
  const description = feature.description.toLowerCase();
  const keywords = getKeywords(feature.description);
  const deps = new Set();

  // Check explicit keyword rules
  for (const [keyword, ruleDeps] of Object.entries(ruleMap)) {
    if (description.includes(keyword)) {
      ruleDeps.forEach(dep => deps.add(dep));
    }
  }

  // Smart analysis of description

  // If mentions editing draft, needs draft editor
  if (description.includes('chat editing') || description.includes('chat message') ||
      description.includes('chat panel') || description.includes('chat interface')) {
    if (!description.includes('message history') && !description.includes('persist')) {
      deps.add('draft-editor');
      deps.add('chat-interface');
    }
  }

  // If mentions evidence, needs extraction
  if (description.includes('evidence') || description.includes('bounding box') ||
      description.includes('highlighted')) {
    deps.add('entity-extraction');
    deps.add('ocr-processing');
  }

  // If mentions merging/splitting entities
  if (description.includes('merge') && description.includes('entit')) {
    deps.add('person-entity-card');
    deps.add('property-entity-card');
  }

  // If mentions creating connections/relationships
  if (description.includes('connection') || description.includes('relationship') ||
      description.includes('edge')) {
    deps.add('canvas-visualization');
    deps.add('entity-extraction');
  }

  // If mentions canvas validation
  if (description.includes('validation') && description.includes('canvas')) {
    deps.add('canvas-connections');
    deps.add('entity-extraction');
  }

  // If mentions draft generation
  if (description.includes('draft generation') || description.includes('generate draft')) {
    deps.add('canvas-validation');
    deps.add('entity-extraction');
  }

  // If mentions pending items
  if (description.includes('pending')) {
    if (description.includes('field')) {
      deps.add('consensus-engine');
    }
    if (description.includes('draft')) {
      deps.add('draft-editor');
    }
  }

  // If mentions audit trail/history
  if (description.includes('audit') || description.includes('operations log')) {
    if (!description.includes('filter')) {
      deps.add('draft-editor');
      deps.add('entity-merge');
    }
  }

  // If mentions person fields, needs person entity card
  if (description.includes('person card') ||
      (description.includes('person') && description.includes('field'))) {
    if (!description.includes('auto-creation')) {
      deps.add('person-entity-card');
    }
  }

  // If mentions property fields, needs property entity card
  if (description.includes('property card') ||
      (description.includes('property') && description.includes('field'))) {
    if (!description.includes('auto-creation')) {
      deps.add('property-entity-card');
    }
  }

  // Remove self-references
  const featureKeywords = [
    ...feature.description.toLowerCase().split(/\s+/).slice(0, 5),
  ];

  deps.forEach(dep => {
    if (featureKeywords.some(kw => dep.includes(kw) || kw.includes(dep))) {
      deps.delete(dep);
    }
  });

  return Array.from(deps).slice(0, 5); // Limit to 5 dependencies max
}

function detectCategory(description) {
  const desc = description.toLowerCase();

  if (desc.includes('login') || desc.includes('logout') || desc.includes('authentication')) return 'Authentication';
  if (desc.includes('dashboard') || desc.includes('case list') || desc.includes('search')) return 'Case Management';
  if (desc.includes('upload') || desc.includes('ocr') || desc.includes('document') || desc.includes('processing')) return 'Document Processing';
  if (desc.includes('entity') || desc.includes('person') || desc.includes('property') || desc.includes('merge')) return 'Entity Management';
  if (desc.includes('canvas') || desc.includes('graph') || desc.includes('connection') || desc.includes('relationship')) return 'Graph Visualization';
  if (desc.includes('draft') || desc.includes('editor') || desc.includes('tiptap')) return 'Draft Editor';
  if (desc.includes('chat') || desc.includes('ai') || desc.includes('natural language')) return 'AI Assistant';
  if (desc.includes('export') || desc.includes('pdf') || desc.includes('html') || desc.includes('print')) return 'Export';
  if (desc.includes('audit') || desc.includes('history') || desc.includes('trail')) return 'Audit';
  if (desc.includes('evidence')) return 'Evidence';
  if (desc.includes('keyboard') || desc.includes('screen reader') || desc.includes('accessibility')) return 'Accessibility';
  if (desc.includes('dark') || desc.includes('theme')) return 'UI Theme';
  if (desc.includes('real-time') || desc.includes('realtime') || desc.includes('presence') || desc.includes('notification')) return 'Collaboration';
  if (desc.includes('proxy') || desc.includes('encumbrance') || desc.includes('power of attorney')) return 'Legal Features';
  if (desc.includes('performance') || desc.includes('cache')) return 'Performance';
  if (desc.includes('offline') || desc.includes('timeout') || desc.includes('error')) return 'UX';
  if (desc.includes('localization') || desc.includes('date format') || desc.includes('currency')) return 'Localization';
  if (desc.includes('role') || desc.includes('permission') || desc.includes('approve')) return 'Authentication';
  if (desc.includes('design') || desc.includes('styling') || desc.includes('button') || desc.includes('animation') || desc.includes('responsive')) return 'UI Design';

  return 'Core';
}

function detectPriority(desc) {
  const d = desc.toLowerCase();
  if (d.includes('essential') || d.includes('critical') || d.includes('foundation')) return 1;
  if (d.includes('core') && !d.includes('core features')) return 1;
  if (d.includes('mvp')) return 1;
  if (d.includes('optional') || d.includes('nice-to-have')) return 3;

  // Infer from feature importance
  if (d.includes('login') || d.includes('dashboard') || d.includes('upload') ||
      d.includes('ocr') || d.includes('entity') || d.includes('canvas') ||
      d.includes('draft generation') || d.includes('chat')) return 1;

  if (d.includes('merge') || d.includes('split') || d.includes('export') ||
      d.includes('filter') || d.includes('search') || d.includes('sort')) return 2;

  if (d.includes('dark mode') || d.includes('animation') || d.includes('tooltip')) return 3;

  return 2; // Default to medium
}

function detectComplexity(desc) {
  const d = desc.toLowerCase();

  if (d.includes('ocr') || d.includes('gemini') || d.includes('llm') ||
      d.includes('consensus') || d.includes('auto-detection') ||
      d.includes('extract') || d.includes('react flow') ||
      d.includes('real-time') || d.includes('realtime') || d.includes('function calling')) {
    return 'complex';
  }

  if (d.includes('filter') || d.includes('sort') || d.includes('delete') ||
      d.includes('copy') || d.includes('dark mode') || d.includes('localization') ||
      d.includes('export html') || d.includes('print')) {
    return 'simple';
  }

  return 'moderate';
}

console.log('Building comprehensive dependency graph...\n');

const featureMap = new Map();
const newFeatures = [];

testFeatures.forEach((testFeature, index) => {
  const category = detectCategory(testFeature.description);
  const id = testFeature.description
    .toLowerCase()
    .substring(0, 50)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 35) + '-' + (index + 1);

  featureMap.set(testFeature.description, id);

  const feature = {
    id,
    category,
    title: testFeature.description.substring(0, 100),
    description: testFeature.description,
    priority: detectPriority(testFeature.description),
    complexity: detectComplexity(testFeature.description),
    dependencies: [],
    steps: testFeature.steps || [],
    testCase: true
  };

  newFeatures.push({ ...feature, origDescription: testFeature.description });
});

// Now resolve dependencies with the complete map
newFeatures.forEach(feature => {
  const deps = findDirectDependencies(feature, newFeatures, dependencyRules);

  // Map dependency names to actual feature IDs
  const resolvedDeps = [];
  deps.forEach(depKeyword => {
    // Find matching feature
    newFeatures.forEach(otherFeature => {
      if (otherFeature.id === feature.id) return;

      const descLower = otherFeature.description.toLowerCase();
      if (depKeyword && descLower.includes(depKeyword)) {
        resolvedDeps.push(otherFeature.id);
      }
    });
  });

  // Fallback: match by category relationships
  if (resolvedDeps.length === 0 && feature.category === 'Draft Editor') {
    const draft = newFeatures.find(f => f.description.includes('Draft generation'));
    if (draft && draft.id !== feature.id) resolvedDeps.push(draft.id);
  }

  if (resolvedDeps.length === 0 && feature.category === 'AI Assistant') {
    const draft = newFeatures.find(f => f.description.includes('Draft editor'));
    if (draft && draft.id !== feature.id) resolvedDeps.push(draft.id);
  }

  feature.dependencies = [...new Set(resolvedDeps)].slice(0, 5);
});

// Validate and report
console.log('=== DEPENDENCY ANALYSIS ===\n');

let complexChains = 0;
let simpleFeatures = 0;

newFeatures.forEach(f => {
  if (f.dependencies.length === 0) {
    simpleFeatures++;
  }
  if (f.dependencies.length > 3) {
    complexChains++;
  }
});

console.log(`Total features analyzed: ${newFeatures.length}`);
console.log(`Features with no dependencies: ${simpleFeatures}`);
console.log(`Features with 4+ dependencies: ${complexChains}`);

console.log(`\n=== SAMPLE DEPENDENCIES (First 10) ===\n`);

newFeatures.slice(0, 10).forEach(f => {
  console.log(`${f.id}:`);
  console.log(`  Title: ${f.title}`);
  console.log(`  Dependencies: ${f.dependencies.length > 0 ? f.dependencies.join(', ') : 'None'}`);
  console.log();
});

// Write updated features.json
const featuresJson = {
  features: newFeatures.map(({ origDescription, ...f }) => f),
  metadata: {
    totalFeatures: newFeatures.length,
    generatedAt: new Date().toISOString(),
    source: 'feature_list.json',
    dependencyResolution: 'intelligent-text-analysis',
    categories: [...new Set(newFeatures.map(f => f.category))].sort()
  }
};

fs.writeFileSync('features.json', JSON.stringify(featuresJson, null, 2) + '\n');
console.log('✓ Wrote updated features.json with intelligent dependencies');

// Create individual files
const now = new Date().toISOString();
let counter = 0;

newFeatures.forEach(({ origDescription, ...feature }) => {
  const featureDir = path.join('features', feature.id);

  if (!fs.existsSync(featureDir)) {
    fs.mkdirSync(featureDir, { recursive: true });
  }

  const featureRecord = {
    id: feature.id,
    category: feature.category,
    title: feature.title,
    description: feature.description,
    status: 'backlog',
    priority: feature.priority,
    complexity: feature.complexity,
    dependencies: feature.dependencies,
    steps: feature.steps,
    testCase: feature.testCase,
    createdAt: now,
    updatedAt: now
  };

  fs.writeFileSync(
    path.join(featureDir, 'feature.json'),
    JSON.stringify(featureRecord, null, 2) + '\n'
  );

  counter++;
  if (counter % 25 === 0) {
    console.log(`✓ Created ${counter}/${newFeatures.length} feature files...`);
  }
});

console.log(`\n✓ Created all ${newFeatures.length} feature files with intelligent dependencies`);

console.log('\n=== DEPENDENCY STATISTICS ===\n');

const depStats = {};
newFeatures.forEach(f => {
  const count = f.dependencies.length;
  depStats[count] = (depStats[count] || 0) + 1;
});

Object.entries(depStats).sort((a, b) => a[0] - b[0]).forEach(([count, num]) => {
  console.log(`Features with ${count} dependencies: ${num}`);
});

console.log('\n✅ Dependency graph built successfully!');
