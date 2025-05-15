
import React from "react";
import { useCampaign } from "@/context/CampaignContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ResponseFilter } from "@/types/campaign";

interface FilterOptionsProps {
  disabled?: boolean;
}

const ResponseFilterOptions = ({ disabled = false }: FilterOptionsProps) => {
  const { filters, updateFilters } = useCampaign();
  
  const handleResponseFilterChange = (value: ResponseFilter) => {
    updateFilters({ responseFilter: value });
  };
  
  return (
    <RadioGroup 
      value={filters.responseFilter} 
      onValueChange={(value) => handleResponseFilterChange(value as ResponseFilter)}
      disabled={disabled}
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
      <div className="flex items-center space-x-2 mb-2">
        <RadioGroupItem value="unsubscribed" id="r-unsubscribed" />
        <Label htmlFor="r-unsubscribed">Somente descadastros</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="responded_and_unsubscribed" id="r-responded-unsubscribed" />
        <Label htmlFor="r-responded-unsubscribed">Respondidos e descadastros</Label>
      </div>
    </RadioGroup>
  );
};

export default ResponseFilterOptions;
