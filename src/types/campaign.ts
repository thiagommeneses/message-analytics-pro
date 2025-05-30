export interface CampaignData {
  fullNumber: string;
  name?: string;
  templateTitle: string;
  campaignMessageStatus: MessageStatus;
  replyMessageText?: string;
  replyMessageType?: string; // Nova coluna para o tipo de resposta
  sentDate: string;
  // Outros campos que possam estar no CSV
}

export type MessageStatus = 
  | 'delivered' 
  | 'read' 
  | 'replied' 
  | 'failed' 
  | 'pending' 
  | 'sent';

export interface FilterOptions {
  templates: string[];
  statuses: MessageStatus[];
  responseFilter: ResponseFilter;
  dateRange: DateRange;
  removeDuplicates: boolean;
  removeInvalidNumbers: boolean;
  removeNoInterest: boolean;
  responseTypes: string[]; // Novo campo para filtrar por tipo de resposta
}

export type ResponseFilter = 
  | 'all' 
  | 'responded' 
  | 'not_responded' 
  | 'unsubscribed'
  | 'responded_and_unsubscribed'; // Nova opção de filtro combinado

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface CampaignMetrics {
  totalContacts: number;
  filteredContacts: number;
  notResponded: number;
  unsubscribed: number;
  invalidNumbers: number;
  statusDistribution: Record<MessageStatus, number>;
  responseDistribution: {
    responded: number;
    notResponded: number;
  };
}

export interface ExportOptions {
  onlyPhoneNumber: boolean;
  includeNames: boolean;
  customColumns: string[];
  splitFiles: boolean;
  recordsPerFile: number;
}

export interface ZenviaExportOptions {
  messageText: string;
  splitFiles: boolean;
  recordsPerFile: number;
}

export interface ExcelExportOptions {
  splitFiles: boolean;
  recordsPerFile: number;
}
