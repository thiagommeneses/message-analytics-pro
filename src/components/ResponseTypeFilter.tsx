
import { useCampaign } from "@/context/CampaignContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ResponseTypeFilterProps {
  disabled?: boolean;
}

const ResponseTypeFilter = ({ disabled = false }: ResponseTypeFilterProps) => {
  const { filters, updateFilters, availableResponseTypes } = useCampaign();
  
  const handleResponseTypeChange = (responseType: string) => {
    const currentTypes = [...filters.responseTypes];
    const index = currentTypes.indexOf(responseType);
    
    if (index === -1) {
      currentTypes.push(responseType);
    } else {
      currentTypes.splice(index, 1);
    }
    
    updateFilters({ responseTypes: currentTypes });
  };
  
  const handleSelectAllTypes = () => {
    // Se todos já estão selecionados ou alguns estão selecionados, desmarca todos
    if (filters.responseTypes.length > 0) {
      updateFilters({ responseTypes: [] });
    } else {
      // Caso contrário, seleciona todos
      updateFilters({ responseTypes: [...availableResponseTypes] });
    }
  };
  
  const areAllTypesSelected = availableResponseTypes.length > 0 && 
    filters.responseTypes.length === availableResponseTypes.length;
  
  if (availableResponseTypes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum tipo de resposta encontrado no arquivo importado
      </p>
    );
  }
  
  return (
    <div className="space-y-3">
      <button
        onClick={handleSelectAllTypes}
        disabled={disabled}
        className="text-sm underline text-blue-600 hover:text-blue-800 disabled:text-gray-400"
      >
        {areAllTypesSelected ? "Desmarcar todos" : "Selecionar todos"}
      </button>
      
      <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
        {availableResponseTypes.map((type) => (
          <div key={type} className="flex items-center space-x-2">
            <Checkbox 
              id={`type-${type}`} 
              checked={filters.responseTypes.includes(type)}
              onCheckedChange={() => handleResponseTypeChange(type)}
              disabled={disabled}
            />
            <Label htmlFor={`type-${type}`} className="text-sm">
              {type}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponseTypeFilter;
