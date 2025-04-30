import { useCampaign } from "@/context/CampaignContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Filter, Check, PhoneCall } from "lucide-react";
import { useState } from "react";
import { MessageStatus, ResponseFilter } from "@/types/campaign";

const FilterPanel = () => {
  const { 
    filters, 
    updateFilters, 
    availableTemplates, 
    availableStatuses,
    isLoading
  } = useCampaign();
  
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);
  const [dateFilterMode, setDateFilterMode] = useState<'single' | 'range'>('single');

  const handleTemplateChange = (template: string) => {
    const currentTemplates = [...filters.templates];
    const index = currentTemplates.indexOf(template);
    
    if (index === -1) {
      currentTemplates.push(template);
    } else {
      currentTemplates.splice(index, 1);
    }
    
    updateFilters({ templates: currentTemplates });
  };
  
  const handleSelectAllTemplates = () => {
    // Se todos já estão selecionados ou alguns estão selecionados, desmarca todos
    if (filters.templates.length > 0) {
      updateFilters({ templates: [] });
    } else {
      // Caso contrário, seleciona todos
      updateFilters({ templates: [...availableTemplates] });
    }
  };
  
  const handleStatusChange = (status: MessageStatus) => {
    const currentStatuses = [...filters.statuses];
    const index = currentStatuses.indexOf(status);
    
    if (index === -1) {
      currentStatuses.push(status);
    } else {
      currentStatuses.splice(index, 1);
    }
    
    updateFilters({ statuses: currentStatuses });
  };
  
  const handleResponseFilterChange = (value: ResponseFilter) => {
    updateFilters({ responseFilter: value });
  };
  
  const handleDateRangeChange = (date: Date | undefined) => {
    if (!date) return;
    
    if (dateFilterMode === 'single') {
      updateFilters({
        dateRange: {
          startDate: date,
          endDate: date
        }
      });
      setCalendarOpen(false);
    } else {
      const { startDate } = filters.dateRange;
      
      if (!startDate || (startDate && filters.dateRange.endDate)) {
        updateFilters({
          dateRange: {
            startDate: date,
            endDate: null
          }
        });
      } else {
        if (date >= startDate) {
          updateFilters({
            dateRange: {
              startDate,
              endDate: date
            }
          });
          setCalendarOpen(false);
        } else {
          updateFilters({
            dateRange: {
              startDate: date,
              endDate: startDate
            }
          });
          setCalendarOpen(false);
        }
      }
    }
  };
  
  const handleRemoveDuplicatesChange = (checked: boolean) => {
    updateFilters({ removeDuplicates: checked });
  };

  const handleRemoveInvalidNumbersChange = (checked: boolean) => {
    updateFilters({ removeInvalidNumbers: checked });
  };

  const areAllTemplatesSelected = availableTemplates.length > 0 && 
    filters.templates.length === availableTemplates.length;

  return (
    <div className="bg-card rounded-lg border shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filtros
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearFilters}
          disabled={isLoading}
        >
          Limpar filtros
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={["templates", "statuses", "responses", "dates", "duplicates", "phoneNumbers"]}>
        {/* Filtro de Templates */}
        <AccordionItem value="templates">
          <AccordionTrigger className="text-sm font-medium">
            Campanhas
          </AccordionTrigger>
          <AccordionContent>
            <div className="mb-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSelectAllTemplates}
                disabled={isLoading || availableTemplates.length === 0}
                className="w-full justify-between"
              >
                {areAllTemplatesSelected ? "Desmarcar todos" : "Selecionar todos"}
                <Check className={cn(
                  "h-4 w-4", 
                  areAllTemplatesSelected ? "opacity-100" : "opacity-0"
                )} />
              </Button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {availableTemplates.map((template) => (
                <div key={template} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`template-${template}`} 
                    checked={filters.templates.includes(template)}
                    onCheckedChange={() => handleTemplateChange(template)}
                    disabled={isLoading}
                  />
                  <Label htmlFor={`template-${template}`} className="text-sm">
                    {template}
                  </Label>
                </div>
              ))}
              {availableTemplates.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Carregue um arquivo para ver as campanhas disponíveis
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Filtro de Status */}
        <AccordionItem value="statuses">
          <AccordionTrigger className="text-sm font-medium">
            Status da mensagem
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {availableStatuses.map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`status-${status}`} 
                    checked={filters.statuses.includes(status)}
                    onCheckedChange={() => handleStatusChange(status)}
                    disabled={isLoading}
                  />
                  <Label htmlFor={`status-${status}`} className="text-sm capitalize">
                    {status === 'delivered' ? 'Entregue' : 
                     status === 'read' ? 'Lido' :
                     status === 'replied' ? 'Respondido' :
                     status === 'failed' ? 'Falha' :
                     status === 'pending' ? 'Pendente' :
                     status === 'sent' ? 'Enviado' : status}
                  </Label>
                </div>
              ))}
              {availableStatuses.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Carregue um arquivo para ver os status disponíveis
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Filtro de Respostas */}
        <AccordionItem value="responses">
          <AccordionTrigger className="text-sm font-medium">
            Respostas do contato
          </AccordionTrigger>
          <AccordionContent>
            <RadioGroup 
              value={filters.responseFilter} 
              onValueChange={(value) => handleResponseFilterChange(value as ResponseFilter)}
              disabled={isLoading}
            >
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="all" id="r-all" />
                <Label htmlFor="r-all">Todos os contatos</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="responded" id="r-responded" />
                <Label htmlFor="r-responded">Somente quem respondeu</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="not_responded" id="r-not-responded" />
                <Label htmlFor="r-not-responded">Somente quem não respondeu</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unsubscribed" id="r-unsubscribed" />
                <Label htmlFor="r-unsubscribed">Somente descadastros</Label>
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        {/* Filtro de Datas */}
        <AccordionItem value="dates">
          <AccordionTrigger className="text-sm font-medium">
            Período de envio
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <RadioGroup 
                value={dateFilterMode} 
                onValueChange={(value: 'single' | 'range') => {
                  setDateFilterMode(value);
                  updateFilters({
                    dateRange: {
                      startDate: null,
                      endDate: null
                    }
                  });
                }}
                disabled={isLoading}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="single" id="date-single" />
                  <Label htmlFor="date-single">Dia específico</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="range" id="date-range" />
                  <Label htmlFor="date-range">Intervalo de datas</Label>
                </div>
              </RadioGroup>

              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal w-full",
                      !filters.dateRange.startDate && "text-muted-foreground"
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.startDate ? (
                      dateFilterMode === 'single' ? (
                        format(filters.dateRange.startDate, "dd/MM/yyyy", { locale: ptBR })
                      ) : filters.dateRange.endDate ? (
                        <>
                          {format(filters.dateRange.startDate, "dd/MM/yyyy", { locale: ptBR })}
                          {" - "}
                          {format(filters.dateRange.endDate, "dd/MM/yyyy", { locale: ptBR })}
                        </>
                      ) : (
                        format(filters.dateRange.startDate, "dd/MM/yyyy", { locale: ptBR })
                      )
                    ) : (
                      dateFilterMode === 'single' ? "Selecione uma data" : "Selecione um período"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.startDate || undefined}
                    onSelect={handleDateRangeChange}
                    disabled={isLoading}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {dateFilterMode === 'range' && filters.dateRange.startDate && !filters.dateRange.endDate && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Selecione a data final do intervalo
                </p>
              )}
              
              {filters.dateRange.startDate && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => updateFilters({
                    dateRange: { startDate: null, endDate: null }
                  })}
                  disabled={isLoading}
                >
                  Limpar datas
                </Button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Filtro de Números Duplicados */}
        <AccordionItem value="duplicates">
          <AccordionTrigger className="text-sm font-medium">
            Números duplicados
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remove-duplicates" 
                checked={filters.removeDuplicates}
                onCheckedChange={handleRemoveDuplicatesChange}
                disabled={isLoading}
              />
              <Label htmlFor="remove-duplicates">Remover números duplicados</Label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Quando ativado, mantém apenas a primeira ocorrência de cada número de telefone.
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Novo Filtro de Números de Telefone */}
        <AccordionItem value="phoneNumbers">
          <AccordionTrigger className="text-sm font-medium">
            <div className="flex items-center">
              <PhoneCall className="h-4 w-4 mr-2" />
              Validação de números
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remove-invalid-numbers" 
                checked={filters.removeInvalidNumbers}
                onCheckedChange={handleRemoveInvalidNumbersChange}
                disabled={isLoading}
              />
              <Label htmlFor="remove-invalid-numbers">Validar números de telefone</Label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Quando ativado, valida e corrige números para o formato WhatsApp brasileiro (+55 DDD 9XXXXXXXX).
              Números que começam com 8 após o DDD receberão um 9 adicional automaticamente.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default FilterPanel;
