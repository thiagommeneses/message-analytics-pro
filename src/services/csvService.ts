import { CampaignData, FilterOptions, CampaignMetrics } from '../types/campaign';

// Palavras que indicam descadastro
const UNSUBSCRIBE_KEYWORDS = ['sair', 'pare', 'não', 'nao', 'descadastrar', 'cancelar', 'remove', 'stop', 'unsubscribe'];

// Palavras que indicam desinteresse
const NO_INTEREST_KEYWORDS = ['não tenho interesse', 'não estou interessado', 'não me interessa', 'sem interesse', 'não quero'];

// Padrões para validação de números de telefone brasileiro
const BR_PHONE_REGEX = {
  // Formato: +55 + DDD(2 dígitos) + 9 + 8 dígitos
  VALID_FORMAT: /^\+?55(\d{2})(9\d{8})$/,
  // Formato que pode ser corrigido: +55 + DDD(2 dígitos) + 8 dígitos (começando com 8 ou 9)
  CORRECTABLE: /^\+?55(\d{2})([89]\d{7})$/
};

export const processCsvFile = (file: File): Promise<CampaignData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvData = event.target?.result as string;
        console.log("CSV carregado, tamanho:", csvData.length);
        console.log("Primeiros 100 caracteres:", csvData.substring(0, 100));
        
        if (!csvData || csvData.trim() === "") {
          throw new Error('O arquivo CSV está vazio');
        }
        
        const parsedData = parseCsv(csvData);
        console.log(`CSV processado com sucesso. ${parsedData.length} registros encontrados.`);
        
        if (parsedData.length === 0) {
          throw new Error('Nenhum registro válido encontrado no arquivo CSV');
        }
        
        resolve(parsedData);
      } catch (error) {
        console.error("Erro ao processar CSV:", error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error("Erro na leitura do arquivo:", error);
      reject(new Error('Erro ao ler o arquivo CSV'));
    };
    
    reader.readAsText(file);
  });
};

const parseCsv = (csvContent: string): CampaignData[] => {
  const lines = csvContent.split('\n');
  
  if (lines.length <= 1) {
    console.error("Arquivo CSV inválido: menos de 2 linhas");
    throw new Error('Arquivo CSV inválido ou vazio');
  }
  
  console.log(`Encontradas ${lines.length} linhas no CSV`);
  console.log("Cabeçalho:", lines[0]);
  
  // Normalizar cabeçalhos e remover caracteres especiais
  const headers = lines[0].split(',').map(header => 
    header.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
  );
  
  console.log("Cabeçalhos normalizados:", headers);
  
  // Mapear cabeçalhos para os campos esperados
  const phoneIndex = headers.findIndex(h => ['phone', 'fullnumber', 'phonenumber', 'telefone'].includes(h));
  const templateIndex = headers.findIndex(h => ['template_title', 'templatetitle', 'template', 'campanha'].includes(h));
  const statusIndex = headers.findIndex(h => ['campaign_message_status', 'campaignmessagestatus', 'status'].includes(h));
  const dateIndex = headers.findIndex(h => ['campaign_message_created_at', 'campaignmessagecreatedat', 'dataenvio', 'sentdate'].includes(h));
  const replyIndex = headers.findIndex(h => ['reply_message_text', 'replymessagetext', 'resposta'].includes(h));
  const nameIndex = headers.findIndex(h => ['name', 'nome'].includes(h));
  const replyTypeIndex = headers.findIndex(h => ['reply_message_type', 'replymessagetype', 'tiporesposta'].includes(h)); // Nova coluna
  
  console.log("Índices encontrados:", {
    phoneIndex,
    templateIndex,
    statusIndex,
    dateIndex,
    replyIndex,
    nameIndex,
    replyTypeIndex // Novo índice
  });
  
  // Verificar se temos pelo menos os índices essenciais
  if (phoneIndex === -1 || templateIndex === -1 || statusIndex === -1) {
    console.error("Cabeçalhos essenciais ausentes. Índices:", {phoneIndex, templateIndex, statusIndex});
    throw new Error('Formato de CSV inválido: cabeçalhos obrigatórios ausentes. Verifique se o arquivo contém as colunas de telefone, template e status.');
  }
  
  const data: CampaignData[] = [];
  
  // Processar linhas de dados (pular o cabeçalho)
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = parseCSVLine(lines[i]);
    
    // Verificar se temos valores suficientes
    if (values.length < Math.max(phoneIndex, templateIndex, statusIndex) + 1) {
      console.warn(`Linha ${i}: número insuficiente de valores, pulando.`);
      continue;
    }
    
    // Montar o objeto com os dados encontrados
    const entry: CampaignData = {
      fullNumber: values[phoneIndex],
      templateTitle: values[templateIndex] || 'Desconhecido',
      campaignMessageStatus: normalizeStatus(values[statusIndex]),
      sentDate: dateIndex !== -1 && values[dateIndex] ? formatDate(values[dateIndex]) : new Date().toISOString()
    };
    
    // Adicionar campos opcionais se existirem
    if (nameIndex !== -1 && values[nameIndex]) {
      entry.name = values[nameIndex];
    }
    
    if (replyIndex !== -1 && values[replyIndex]) {
      entry.replyMessageText = values[replyIndex];
    }
    
    // Adicionar campo do tipo de resposta se existir
    if (replyTypeIndex !== -1 && values[replyTypeIndex]) {
      entry.replyMessageType = values[replyTypeIndex];
    }
    
    data.push(entry);
  }
  
  console.log(`Processamento concluído: ${data.length} registros válidos de ${lines.length-1} linhas`);
  return data;
};

// Função para interpretar corretamente as linhas CSV (considerando campos com vírgulas dentro de aspas)
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let currentValue = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      result.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Adiciona o último valor
  result.push(currentValue.trim());
  return result;
};

// Normaliza o status da mensagem para um valor padrão
const normalizeStatus = (status: string): CampaignData['campaignMessageStatus'] => {
  status = status.toLowerCase();
  
  if (status.includes('deliver')) return 'delivered';
  if (status.includes('read')) return 'read';
  if (status.includes('reply') || status.includes('respond')) return 'replied';
  if (status.includes('fail') || status.includes('error')) return 'failed';
  if (status.includes('pend')) return 'pending';
  
  return 'sent'; // Mudou de 'unknown' para 'sent'
};

// Formata a data para um formato consistente
const formatDate = (dateStr: string): string => {
  try {
    // Tentar vários formatos de data
    let date;
    
    // Formato ISO
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      date = new Date(dateStr);
    } 
    // Formato DD/MM/YYYY
    else if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
      const parts = dateStr.split('/');
      date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    // Outros formatos
    else {
      date = new Date(dateStr);
    }
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.warn(`Data inválida: ${dateStr}`);
      return new Date().toISOString();
    }
    
    return date.toISOString();
  } catch (e) {
    console.warn(`Erro ao processar data: ${dateStr}`, e);
    return new Date().toISOString(); // Data atual como fallback
  }
};

// Verifica se um número de telefone é válido para WhatsApp no Brasil
export const isValidBrazilianMobileNumber = (phoneNumber: string): boolean => {
  // Remove espaços, traços e parênteses
  const cleanNumber = phoneNumber.replace(/[\s\-()]/g, '');
  
  // Verifica o formato válido para WhatsApp brasileiro
  return BR_PHONE_REGEX.VALID_FORMAT.test(cleanNumber);
};

// Tenta corrigir um número de telefone brasileiro para o padrão WhatsApp
export const correctBrazilianMobileNumber = (phoneNumber: string): string => {
  // Remove espaços, traços e parênteses
  const cleanNumber = phoneNumber.replace(/[\s\-()]/g, '');
  
  // Se já é válido, retorna como está
  if (BR_PHONE_REGEX.VALID_FORMAT.test(cleanNumber)) {
    return cleanNumber;
  }
  
  // Tenta corrigir números que começam com 8 após o DDD, adicionando o 9
  const correctableMatch = cleanNumber.match(BR_PHONE_REGEX.CORRECTABLE);
  if (correctableMatch) {
    const ddd = correctableMatch[1];
    const number = correctableMatch[2];
    
    // Se começa com 8 ou 9, adiciona o 9 na frente (se necessário)
    if (number.startsWith('8') || number.startsWith('9')) {
      // Se começar com 9, já tem 8 dígitos, precisamos garantir que tenha 9 dígitos no total
      if (number.startsWith('9') && number.length === 8) {
        return `+55${ddd}${number}`;
      }
      // Para números que começam com 8, adicionamos o 9
      if (number.startsWith('8')) {
        return `+55${ddd}9${number}`;
      }
    }
  }
  
  // Se não conseguiu corrigir, retorna o número original
  return phoneNumber;
};

// Verifica se a mensagem é de descadastro
export const isUnsubscribeMessage = (message: string): boolean => {
  const lowerMessage = message.toLowerCase().trim();
  return UNSUBSCRIBE_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
};

// Nova função: Verifica se a mensagem é de desinteresse
export const isNoInterestMessage = (message: string): boolean => {
  if (!message) return false;
  
  const lowerMessage = message.toLowerCase().trim();
  
  return NO_INTEREST_KEYWORDS.some(keyword => lowerMessage.includes(keyword)) ||
         lowerMessage.startsWith('não,');
};

// Função para filtrar os dados com base nas opções selecionadas
export const filterCampaignData = (
  data: CampaignData[], 
  filters: FilterOptions
): CampaignData[] => {
  // Primeiro criamos uma cópia dos dados para não modificar o original
  let processedData = [...data];
  
  // Aplicamos a correção de números se o filtro estiver ativado
  if (filters.removeInvalidNumbers) {
    processedData = processedData.map(item => ({
      ...item,
      fullNumber: correctBrazilianMobileNumber(item.fullNumber)
    }));
  }
  
  let filteredData = processedData.filter(item => {
    // Filtro de template
    if (filters.templates.length && !filters.templates.includes(item.templateTitle)) {
      return false;
    }
    
    // Filtro de status
    if (filters.statuses.length && !filters.statuses.includes(item.campaignMessageStatus)) {
      return false;
    }
    
    // Filtro de resposta
    switch(filters.responseFilter) {
      case 'responded':
        if (!item.replyMessageText) return false;
        if (isUnsubscribeMessage(item.replyMessageText)) return false; // Exclui descadastros
        break;
      case 'not_responded':
        if (item.replyMessageText) return false;
        break;
      case 'unsubscribed':
        if (!item.replyMessageText || !isUnsubscribeMessage(item.replyMessageText)) return false;
        break;
      case 'responded_and_unsubscribed':
        // Nova opção: combina respondidos com descadastros
        if (!item.replyMessageText) return false;
        // Não filtramos pelo conteúdo, apenas garantimos que existe resposta
        break;
    }
    
    // Novo filtro: filtrar pelo tipo de resposta
    if (filters.responseTypes.length > 0 && (!item.replyMessageType || !filters.responseTypes.includes(item.replyMessageType))) {
      return false;
    }
    
    // Novo filtro: remover contatos que responderam com "Não tenho interesse"
    if (filters.removeNoInterest && item.replyMessageText && isNoInterestMessage(item.replyMessageText)) {
      return false;
    }
    
    // Filtro de data
    if (filters.dateRange.startDate && filters.dateRange.endDate) {
      const messageDate = new Date(item.sentDate);
      const startDate = new Date(filters.dateRange.startDate);
      const endDate = new Date(filters.dateRange.endDate);
      
      // Ajustar o final do dia para a data final
      endDate.setHours(23, 59, 59, 999);
      
      if (messageDate < startDate || messageDate > endDate) {
        return false;
      }
    }
    
    // Filtro de números inválidos - após tentativa de correção
    if (filters.removeInvalidNumbers && !isValidBrazilianMobileNumber(item.fullNumber)) {
      return false;
    }
    
    return true;
  });
  
  // Aplicar filtro de números duplicados
  if (filters.removeDuplicates && filteredData.length > 0) {
    const uniqueNumbers = new Set<string>();
    filteredData = filteredData.filter(item => {
      if (uniqueNumbers.has(item.fullNumber)) {
        return false;
      }
      uniqueNumbers.add(item.fullNumber);
      return true;
    });
  }
  
  return filteredData;
};

// Calcula métricas baseadas nos dados
export const calculateMetrics = (
  allData: CampaignData[], 
  filteredData: CampaignData[]
): CampaignMetrics => {
  // Contagem total
  const totalContacts = allData.length;
  const filteredContacts = filteredData.length;
  
  // Contagem de não respondidos
  const notResponded = filteredData.filter(item => !item.replyMessageText).length;
  
  // Contagem de descadastros
  const unsubscribed = filteredData.filter(
    item => item.replyMessageText && isUnsubscribeMessage(item.replyMessageText)
  ).length;
  
  // Contagem de números inválidos
  const invalidNumbers = allData.filter(
    item => !isValidBrazilianMobileNumber(correctBrazilianMobileNumber(item.fullNumber))
  ).length;
  
  // Distribuição por status
  const statusDistribution: Record<string, number> = {};
  filteredData.forEach(item => {
    statusDistribution[item.campaignMessageStatus] = 
      (statusDistribution[item.campaignMessageStatus] || 0) + 1;
  });
  
  // Distribuição de respostas
  const responded = filteredData.filter(item => item.replyMessageText).length;
  
  return {
    totalContacts,
    filteredContacts,
    notResponded,
    unsubscribed,
    invalidNumbers,
    statusDistribution,
    responseDistribution: {
      responded,
      notResponded
    }
  };
};

// Prepara os dados para exportação
export const prepareDataForExport = (
  filteredData: CampaignData[],
  exportOptions: { columns: string[] }
): string => {
  // Cria o cabeçalho
  const header = exportOptions.columns.join(',');
  
  // Cria as linhas de dados
  const rows = filteredData.map(item => {
    return exportOptions.columns.map(col => {
      const value = (item as any)[col] || '';
      // Se o valor contém vírgula, envolve em aspas
      return value.includes(',') ? `"${value}"` : value;
    }).join(',');
  });
  
  // Junta tudo em uma string CSV
  return [header, ...rows].join('\n');
};

// Prepara os dados para exportação para o formato Zenvia
export const prepareZenviaExport = (
  filteredData: CampaignData[],
  messageText: string
): string => {
  // Cabeçalho específico para Zenvia
  const header = 'celular;sms';
  
  // Cria as linhas de dados
  const rows = filteredData.map(item => {
    // Remove o + do número se existir
    const phoneNumber = item.fullNumber.startsWith('+') 
      ? item.fullNumber.substring(1) 
      : item.fullNumber;
    
    // Não colocamos aspas no texto da mensagem para o formato Zenvia
    return `${phoneNumber};${messageText}`;
  });
  
  // Junta tudo em uma string CSV com separador ponto e vírgula
  return [header, ...rows].join('\n');
};
