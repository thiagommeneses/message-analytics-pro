
import { Button } from "@/components/ui/button";
import { useCampaign } from "@/context/CampaignContext";
import ExportOptions from "./ExportOptions";

const Header = () => {
  const { resetData, originalData } = useCampaign();
  
  return (
    <header className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Análise de Campanhas Enviadas Ominichat</h1>
        <p className="text-muted-foreground">
          {originalData.length > 0 
            ? `Analisando ${originalData.length} registros` 
            : "Carregue um arquivo CSV para iniciar a análise"}
        </p>
      </div>
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-3">
          <ExportOptions />
          
          {originalData.length > 0 && (
            <Button variant="ghost" onClick={resetData}>
              Limpar dados
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          Desenvolvido por <span className="font-medium">Thiago Marques Meneses</span> | <span className="font-medium">Pixmeyou</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
