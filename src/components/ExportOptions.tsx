import { useState } from "react";
import { useCampaign } from "@/context/CampaignContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Download, FileText, MessageSquare } from "lucide-react";
import { ExportOptions as ExportOptionsType, ZenviaExportOptions } from "@/types/campaign";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ExportOptions = () => {
  const { exportData, exportToZenvia, filteredData, isLoading } = useCampaign();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isZenviaDialogOpen, setIsZenviaDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptionsType>({
    onlyPhoneNumber: true,
    includeNames: false,
    customColumns: [],
    splitFiles: false,
    recordsPerFile: 1000
  });
  const [zenviaOptions, setZenviaOptions] = useState<ZenviaExportOptions>({
    messageText: "",
    splitFiles: false,
    recordsPerFile: 1000
  });
  const [exportType, setExportType] = useState<'simple' | 'custom'>('simple');

  const availableColumns = filteredData.length > 0 
    ? Object.keys(filteredData[0]) 
    : [];

  const handleExport = () => {
    exportData(exportOptions);
    // Fechamos o diálogo com um pequeno delay para garantir que o processo de exportação inicie primeiro
    setTimeout(() => {
      setIsDialogOpen(false);
    }, 100);
  };

  const handleZenviaExport = () => {
    exportToZenvia(zenviaOptions);
    // Fechamos o diálogo com um pequeno delay para garantir que o processo de exportação inicie primeiro
    setTimeout(() => {
      setIsZenviaDialogOpen(false);
    }, 100);
  };

  const handleExportTypeChange = (value: string) => {
    const type = value as 'simple' | 'custom';
    setExportType(type);
    
    if (type === 'simple') {
      setExportOptions({
        ...exportOptions,
        onlyPhoneNumber: true,
        includeNames: false,
        customColumns: [],
      });
    } else {
      setExportOptions({
        ...exportOptions,
        onlyPhoneNumber: false,
        includeNames: false,
        customColumns: [...availableColumns],
      });
    }
  };

  const toggleColumn = (column: string) => {
    const currentColumns = [...exportOptions.customColumns];
    const index = currentColumns.indexOf(column);
    
    if (index === -1) {
      currentColumns.push(column);
    } else {
      currentColumns.splice(index, 1);
    }
    
    setExportOptions({
      ...exportOptions,
      customColumns: currentColumns
    });
  };

  const handleNameOption = (option: 'onlyPhone' | 'withNames') => {
    if (option === 'onlyPhone') {
      setExportOptions({
        ...exportOptions,
        onlyPhoneNumber: true,
        includeNames: false,
        customColumns: [],
      });
    } else {
      setExportOptions({
        ...exportOptions,
        onlyPhoneNumber: false,
        includeNames: true,
        customColumns: [],
      });
    }
  };

  const toggleSplitFiles = (checked: boolean) => {
    setExportOptions({
      ...exportOptions,
      splitFiles: checked
    });
  };

  const toggleZenviaSplitFiles = (checked: boolean) => {
    setZenviaOptions({
      ...zenviaOptions,
      splitFiles: checked
    });
  };

  const handleRecordsPerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 1000;
    setExportOptions({
      ...exportOptions,
      recordsPerFile: value
    });
  };

  const handleZenviaRecordsPerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 1000;
    setZenviaOptions({
      ...zenviaOptions,
      recordsPerFile: value
    });
  };

  const handleSmsTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setZenviaOptions({
      ...zenviaOptions,
      messageText: e.target.value.slice(0, 130)
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2" disabled={filteredData.length === 0 || isLoading}>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            <span>Exportar CSV</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsZenviaDialogOpen(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>Exportar para zEnvia</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog para exportação padrão CSV - Usando onOpenChange com tratamento melhorado */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setTimeout(() => setIsDialogOpen(false), 0);
        } else {
          setIsDialogOpen(true);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Opções de exportação</DialogTitle>
            <DialogDescription>
              Escolha quais dados você deseja exportar do total de {filteredData.length} registros.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="export-type">Tipo de exportação</Label>
              <Select
                value={exportType}
                onValueChange={handleExportTypeChange}
              >
                <SelectTrigger id="export-type">
                  <SelectValue placeholder="Selecione o tipo de exportação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Exportação simples</SelectItem>
                  <SelectItem value="custom">Exportação personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {exportType === 'simple' ? (
              <div className="grid gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="phone-only" 
                    checked={exportOptions.onlyPhoneNumber}
                    onCheckedChange={() => handleNameOption('onlyPhone')}
                  />
                  <Label htmlFor="phone-only">Apenas números de telefone</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="with-names" 
                    checked={exportOptions.includeNames}
                    onCheckedChange={() => handleNameOption('withNames')}
                  />
                  <Label htmlFor="with-names">Números de telefone e nomes</Label>
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>Selecione as colunas</Label>
                <div className="border rounded-md h-40 overflow-y-auto p-2">
                  {availableColumns.map(column => (
                    <div key={column} className="flex items-center space-x-2 py-1">
                      <Checkbox 
                        id={`col-${column}`} 
                        checked={exportOptions.customColumns.includes(column)}
                        onCheckedChange={() => toggleColumn(column)}
                      />
                      <Label htmlFor={`col-${column}`} className="capitalize">
                        {column === 'fullNumber' ? 'Telefone' :
                         column === 'name' ? 'Nome' :
                         column === 'templateTitle' ? 'Título do template' :
                         column === 'campaignMessageStatus' ? 'Status da mensagem' :
                         column === 'replyMessageText' ? 'Texto de resposta' :
                         column === 'sentDate' ? 'Data de envio' : column}
                      </Label>
                    </div>
                  ))}
                </div>
                {exportOptions.customColumns.length === 0 && (
                  <p className="text-sm text-red-500">
                    Selecione pelo menos uma coluna para exportar
                  </p>
                )}
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox 
                  id="split-files" 
                  checked={exportOptions.splitFiles}
                  onCheckedChange={toggleSplitFiles}
                />
                <Label htmlFor="split-files">Dividir em múltiplos arquivos</Label>
              </div>
              
              {exportOptions.splitFiles && (
                <div className="ml-6">
                  <div className="grid gap-2">
                    <Label htmlFor="records-per-file">Registros por arquivo</Label>
                    <Input 
                      id="records-per-file" 
                      type="number" 
                      value={exportOptions.recordsPerFile} 
                      onChange={handleRecordsPerFileChange}
                      min={1}
                    />
                    <p className="text-sm text-muted-foreground">
                      Total de arquivos: {Math.ceil(filteredData.length / exportOptions.recordsPerFile)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleExport}
              disabled={
                exportType === 'custom' && exportOptions.customColumns.length === 0
              }
            >
              Exportar dados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para exportação Zenvia - Usando onOpenChange com tratamento melhorado */}
      <Dialog open={isZenviaDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setTimeout(() => setIsZenviaDialogOpen(false), 0);
        } else {
          setIsZenviaDialogOpen(true);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Exportar para zEnvia</DialogTitle>
            <DialogDescription>
              Exporte os {filteredData.length} registros filtrados para o formato zEnvia.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sms-text">Texto do SMS</Label>
              <Textarea 
                id="sms-text"
                placeholder="Digite a mensagem do SMS"
                value={zenviaOptions.messageText}
                onChange={handleSmsTextChange}
                maxLength={130}
                className="resize-none"
                rows={4}
              />
              <p className="text-sm text-muted-foreground flex justify-end">
                {zenviaOptions.messageText.length}/130 caracteres
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox 
                  id="zenvia-split-files" 
                  checked={zenviaOptions.splitFiles}
                  onCheckedChange={toggleZenviaSplitFiles}
                />
                <Label htmlFor="zenvia-split-files">Dividir em múltiplos arquivos</Label>
              </div>
              
              {zenviaOptions.splitFiles && (
                <div className="ml-6">
                  <div className="grid gap-2">
                    <Label htmlFor="zenvia-records-per-file">Registros por arquivo</Label>
                    <Input 
                      id="zenvia-records-per-file" 
                      type="number" 
                      value={zenviaOptions.recordsPerFile} 
                      onChange={handleZenviaRecordsPerFileChange}
                      min={1}
                    />
                    <p className="text-sm text-muted-foreground">
                      Total de arquivos: {Math.ceil(filteredData.length / zenviaOptions.recordsPerFile)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm">
              <p className="font-medium mb-1">Informações sobre o formato:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>O arquivo CSV terá as colunas "celular" e "sms"</li>
                <li>O separador usado será ponto e vírgula (;)</li>
                <li>Todos os números serão incluídos conforme filtro atual</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsZenviaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleZenviaExport}
              disabled={zenviaOptions.messageText.trim().length === 0}
            >
              Exportar para zEnvia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExportOptions;
