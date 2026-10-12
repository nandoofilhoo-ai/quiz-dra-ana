const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const workflowPath = path.join(root, 'n8n_workflow.json');
const workflowSource = fs.readFileSync(workflowPath, 'utf8');

function readWorkflow() {
    return JSON.parse(workflowSource);
}

function nodeByType(workflow, type) {
    return workflow.nodes.filter(node => node.type === type);
}

function nodeByName(workflow, name) {
    const node = workflow.nodes.find(candidate => candidate.name === name);
    assert.ok(node, `nó não encontrado: ${name}`);
    return node;
}

test('export do n8n permanece um JSON estruturalmente importável', () => {
    const workflow = readWorkflow();

    assert.ok(Array.isArray(workflow.nodes));
    assert.equal(typeof workflow.connections, 'object');
    assert.equal(typeof workflow.settings, 'object');
    assert.equal(workflow.staticData, null);
});

test('workflow é explicitamente um template inativo', () => {
    const workflow = readWorkflow();

    assert.equal(workflow.active, false);
    assert.match(workflow.name, /template/i);
    assert.match(workflow.name, /inativ/i);
});

test('todos os nós que escrevem em serviços externos estão desabilitados', () => {
    const workflow = readWorkflow();
    const externalWriters = workflow.nodes.filter(node =>
        ['n8n-nodes-base.googleSheets', 'n8n-nodes-base.httpRequest'].includes(node.type)
    );

    assert.equal(externalWriters.length, 3);
    for (const node of externalWriters) {
        assert.equal(node.disabled, true, `${node.name} deve ter disabled: true`);
    }
});

test('PipeZ não contém endpoint, token literal ou fallback de configuração', () => {
    const workflow = readWorkflow();
    const crm = nodeByType(workflow, 'n8n-nodes-base.httpRequest')[0];
    const serialized = JSON.stringify(crm.parameters);

    assert.equal(crm.parameters.url, '={{ $vars.PIPEZ_API_URL }}');
    assert.equal(
        crm.parameters.headerParameters.parameters.find(parameter => parameter.name === 'Authorization').value,
        '=Bearer {{ $vars.PIPEZ_API_KEY }}'
    );
    assert.doesNotMatch(serialized, /https?:\/\//i);
    assert.doesNotMatch(serialized, /SEU_TOKEN_PIPEZ_AQUI|\|\|/i);
});

test('Switch roteia pelo campo canônico event_type', () => {
    const workflow = readWorkflow();
    const switchNode = nodeByName(workflow, 'Switch (Tipo de Evento)');

    assert.equal(switchNode.parameters.value1, '={{ $json.body.event_type }}');
});

test('mapeamentos usam os campos canônicos do contrato de eventos', () => {
    const workflow = readWorkflow();
    const analytics = nodeByName(workflow, 'Google Sheets - Analytics Funil');
    const leads = nodeByName(workflow, 'Google Sheets - Leads Qualificados');
    const crm = nodeByName(workflow, 'HTTP Request - CRM PipeZ');
    const serialized = JSON.stringify([analytics.parameters, leads.parameters, crm.parameters]);
    const canonicalFields = [
        'event_type', 'session_id', 'event_id', 'timestamp', 'branch', 'branch_label',
        'urgent', 'tags', 'value_range', 'utm_source', 'utm_medium', 'utm_campaign',
        'answers', 'consent_version', 'consent_timestamp', 'channel', 'channel_user_id',
        'name', 'whatsapp', 'city', 'state', 'contact_period'
    ];

    for (const field of canonicalFields) {
        assert.match(serialized, new RegExp(`\\$json\\.body\\.${field}\\b`), `campo ausente: ${field}`);
    }
    assert.doesNotMatch(serialized, /body\.(sessionId|nome|problema|detalhe_origem|valor_divida)\b/);

    const crmPayload = JSON.parse(crm.parameters.jsonBody.slice(1));
    assert.equal(crmPayload.whatsapp, '{{ $json.body.whatsapp }}');
    assert.equal(crmPayload.phone, undefined);
});

test('analytics usa exatamente os campos permitidos e exclui PII de lead', () => {
    const workflow = readWorkflow();
    const analytics = nodeByName(workflow, 'Google Sheets - Analytics Funil');
    const mappings = analytics.parameters.columns.value;
    const allowedColumns = [
        'Branch', 'Branch_Label', 'Event_ID', 'Event_Type', 'Session_ID', 'Tags',
        'Timestamp', 'UTM_Campaign', 'UTM_Medium', 'UTM_Source', 'Urgent', 'Value_Range'
    ];
    const allowedBodyFields = [
        'branch', 'branch_label', 'event_id', 'event_type', 'session_id', 'tags',
        'timestamp', 'utm_campaign', 'utm_medium', 'utm_source', 'urgent', 'value_range'
    ];
    const forbiddenBodyFields = [
        'answers', 'consent_version', 'consent_timestamp', 'name', 'whatsapp', 'city',
        'state', 'contact_period', 'channel_user_id'
    ];
    const referencedBodyFields = [...JSON.stringify(mappings).matchAll(/\$json\.body\.([a-z_]+)/g)]
        .map(match => match[1])
        .sort();

    assert.deepEqual(Object.keys(mappings).sort(), allowedColumns.sort());
    assert.deepEqual([...new Set(referencedBodyFields)], allowedBodyFields.sort());
    for (const field of forbiddenBodyFields) {
        assert.equal(referencedBodyFields.includes(field), false, `analytics não pode mapear ${field}`);
    }
});

test('workflow não contém segredos reais, hosts privados ou credenciais embutidas', () => {
    const workflow = readWorkflow();
    const serialized = JSON.stringify(workflow);

    assert.doesNotMatch(serialized, /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/);
    assert.doesNotMatch(serialized, /\b\d{6,}:[A-Za-z0-9_-]{16,}\b/);
    assert.doesNotMatch(serialized, /"(?:api[_-]?key|token|secret|authorization)"\s*:\s*"(?!={{)[^"]{16,}"/i);
    assert.doesNotMatch(serialized, /https?:\/\//i);
});

test('somente os destinos adiados aparecem como escritores externos', () => {
    const workflow = readWorkflow();
    const writers = nodeByType(workflow, 'n8n-nodes-base.googleSheets')
        .concat(nodeByType(workflow, 'n8n-nodes-base.httpRequest'));

    assert.deepEqual(writers.map(node => node.name).sort(), [
        'Google Sheets - Analytics Funil',
        'Google Sheets - Leads Qualificados',
        'HTTP Request - CRM PipeZ'
    ].sort());
});
