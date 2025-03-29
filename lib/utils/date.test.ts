/**
 * Testes manuais para as funções de utilidades de data
 * 
 * Este arquivo pode ser executado diretamente com ts-node ou similar para
 * verificar o comportamento das funções de manipulação de data.
 * 
 * Uso: npx ts-node lib/utils/date.test.ts
 */

import {
  toLocalTime,
  toUTCString,
  formatDate,
  formatDateTimeInput,
  parseInputToUTC,
  formatDistanceToNow,
  isBeforeNow
} from './date';

// Função auxiliar para imprimir resultados formatados
function testFunction(name: string, result: any) {
  console.log(`\n=== ${name} ===`);
  console.log(result);
  console.log("==============");
}

// 1. Criar uma data UTC fixa para teste
const testUTCDate = new Date('2023-06-15T18:00:00Z'); // 15h00 em GMT-3
console.log("Data UTC para testes:", testUTCDate.toISOString());

// 2. Teste de toLocalTime
const localTimeResult = toLocalTime(testUTCDate);
testFunction("toLocalTime", {
  result: localTimeResult,
  isoString: localTimeResult?.toISOString(),
  localString: localTimeResult?.toString(),
  hours: localTimeResult?.getHours(),
  minutes: localTimeResult?.getMinutes()
});

// 3. Teste de toUTCString
const localDate = new Date('2023-06-15T15:00:00-03:00'); // Horário de Brasília
const utcStringResult = toUTCString(localDate);
testFunction("toUTCString", {
  input: localDate.toString(),
  result: utcStringResult
});

// 4. Teste de formatDate com diversos formatos
testFunction("formatDate (padrão)", formatDate(testUTCDate));
testFunction("formatDate (dd/MM/yyyy)", formatDate(testUTCDate, 'dd/MM/yyyy'));
testFunction("formatDate (dd/MM/yyyy HH:mm)", formatDate(testUTCDate, 'dd/MM/yyyy HH:mm'));
testFunction("formatDate (EEEE, dd 'de' MMMM)", formatDate(testUTCDate, "EEEE, dd 'de' MMMM"));

// 5. Teste de formatDateTimeInput
const dateTimeInputResult = formatDateTimeInput(testUTCDate);
testFunction("formatDateTimeInput", {
  result: dateTimeInputResult,
  explanation: "Use este valor em inputs datetime-local"
});

// 6. Teste de parseInputToUTC
const localInputValue = '2023-06-15T15:00'; // Input de formulário em GMT-3
const parsedUTCResult = parseInputToUTC(localInputValue);
testFunction("parseInputToUTC", {
  input: localInputValue,
  result: parsedUTCResult,
  explanation: "Deve ser aproximadamente 18:00 UTC"
});

// 7. Teste de formatDistanceToNow
// Criar datas passadas para teste
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

testFunction("formatDistanceToNow (1 dia atrás)", formatDistanceToNow(oneDayAgo));
testFunction("formatDistanceToNow (1 semana atrás)", formatDistanceToNow(oneWeekAgo));
testFunction("formatDistanceToNow (1 hora atrás)", formatDistanceToNow(oneHourAgo));

// 8. Teste de isBeforeNow
const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 dia no futuro
const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 dia no passado

testFunction("isBeforeNow (data futura)", {
  date: futureDate.toISOString(),
  isBeforeNow: isBeforeNow(futureDate),
  expectation: "Deve ser false"
});

testFunction("isBeforeNow (data passada)", {
  date: pastDate.toISOString(),
  isBeforeNow: isBeforeNow(pastDate),
  expectation: "Deve ser true"
});

// 9. Teste de ciclo completo: UTC -> Local -> UTC
console.log("\n=== TESTE DE CICLO COMPLETO ===");
console.log("Início: Data UTC original:", testUTCDate.toISOString());

// Converter para local (GMT-3)
const convertedToLocal = toLocalTime(testUTCDate);
console.log("Meio: Convertida para local (GMT-3):", convertedToLocal?.toString());

// Converter de volta para UTC
const convertedBackToUTC = toUTCString(convertedToLocal);
console.log("Fim: Convertida de volta para UTC:", convertedBackToUTC);

console.log("\nVERIFICAÇÃO: As datas UTC inicial e final devem ser próximas (pode haver pequenas diferenças devido a milissegundos)");

// 10. Teste com input de formulário
console.log("\n=== TESTE DE FLUXO DE FORMULÁRIO ===");
// Simulação de um fluxo de formulário:
// 1. Temos data UTC do banco
// 2. Formatamos para exibir no input
// 3. Usuário edita e submete o formulário
// 4. Convertemos de volta para UTC para salvar

const dbDate = '2023-06-15T18:00:00Z'; // Data vinda do banco (UTC)
console.log("1. Data do banco (UTC):", dbDate);

const formattedForInput = formatDateTimeInput(dbDate);
console.log("2. Formatada para input:", formattedForInput);

const userModifiedInput = '2023-06-20T16:30'; // Usuário alterou para 20/06 às 16:30 (GMT-3)
console.log("3. Após edição do usuário:", userModifiedInput);

const readyToSaveInDB = parseInputToUTC(userModifiedInput);
console.log("4. Pronta para salvar no banco (UTC):", readyToSaveInDB);

console.log("\nO resultado final deve mostrar 19:30 UTC (16:30 + 3 horas)"); 