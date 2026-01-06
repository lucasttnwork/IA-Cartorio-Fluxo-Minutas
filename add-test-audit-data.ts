import { useAuditStore } from './src/stores/auditStore';

// This is a test script to add sample audit entries with section metadata
const store = useAuditStore.getState();

// Add some test entries for draft section updates
const testCaseId = 'test-case-1';
const testDraftId = 'test-draft-1';

// Section 1: Parties
store.logDraftSectionUpdate(
  testCaseId,
  testDraftId,
  'Minuta de Compra e Venda',
  'parties',
  'Qualificação das Partes',
  [
    {
      fieldName: 'Nome do Comprador',
      fieldPath: 'people[0].full_name',
      previousValue: 'João Silva',
      newValue: 'João Pedro Silva',
      previousDisplayValue: 'João Silva',
      newDisplayValue: 'João Pedro Silva',
      source: 'user',
    },
  ],
  'user-1',
  'Ana Santos'
);

// Section 2: Price
store.logDraftSectionUpdate(
  testCaseId,
  testDraftId,
  'Minuta de Compra e Venda',
  'price',
  'Preço e Forma de Pagamento',
  [
    {
      fieldName: 'Valor Total',
      fieldPath: 'deal.price',
      previousValue: 500000,
      newValue: 550000,
      previousDisplayValue: 'R$ 500.000,00',
      newDisplayValue: 'R$ 550.000,00',
      source: 'user',
    },
  ],
  'user-1',
  'Ana Santos'
);

// Section 3: Object
store.logDraftSectionUpdate(
  testCaseId,
  testDraftId,
  'Minuta de Compra e Venda',
  'object',
  'Do Objeto',
  [
    {
      fieldName: 'Endereço',
      fieldPath: 'properties[0].address.street',
      previousValue: 'Rua das Flores, 123',
      newValue: 'Rua das Flores, 125',
      previousDisplayValue: 'Rua das Flores, 123',
      newDisplayValue: 'Rua das Flores, 125',
      source: 'user',
    },
  ],
  'user-1',
  'Ana Santos'
);

console.log('Test audit entries added!');
