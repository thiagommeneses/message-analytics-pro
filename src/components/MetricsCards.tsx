
import { useCampaign } from "@/context/CampaignContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const MetricsCards = () => {
  const { metrics, isLoading } = useCampaign();
  
  if (!metrics) return null;
  
  // Dados para o gráfico de distribuição de status
  const statusData = Object.entries(metrics.statusDistribution).map(([status, count]) => ({
    name: status === 'delivered' ? 'Entregue' : 
          status === 'read' ? 'Lido' :
          status === 'replied' ? 'Respondido' :
          status === 'failed' ? 'Falha' :
          status === 'pending' ? 'Pendente' : 'Desconhecido',
    value: count
  }));
  
  // Dados para o gráfico de respostas
  const responseData = [
    { name: 'Respondeu', value: metrics.responseDistribution.responded },
    { name: 'Não respondeu', value: metrics.responseDistribution.notResponded }
  ];
  
  // Cores para os gráficos
  const STATUS_COLORS = {
    'Entregue': '#3B82F6', // blue-500
    'Lido': '#10B981', // emerald-500
    'Respondido': '#8B5CF6', // violet-500
    'Falha': '#EF4444', // red-500
    'Pendente': '#F59E0B', // amber-500
    'Desconhecido': '#6B7280', // gray-500
  };
  
  const RESPONSE_COLORS = ['#8B5CF6', '#E5E7EB']; // purple for responded, gray for not

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card de Contatos Totais */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Contatos totais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.totalContacts.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total de registros no arquivo
          </p>
        </CardContent>
      </Card>
      
      {/* Card de Contatos Filtrados */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Contatos filtrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.filteredContacts.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.filteredContacts === metrics.totalContacts ? (
              'Nenhum filtro aplicado'
            ) : (
              `${((metrics.filteredContacts / metrics.totalContacts) * 100).toFixed(1)}% do total`
            )}
          </p>
        </CardContent>
      </Card>
      
      {/* Card de Não Responderam */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Não responderam</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.notResponded.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.filteredContacts > 0 ? (
              `${((metrics.notResponded / metrics.filteredContacts) * 100).toFixed(1)}% dos filtrados`
            ) : '0%'}
          </p>
        </CardContent>
      </Card>
      
      {/* Card de Descadastros */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Descadastros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.unsubscribed.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.filteredContacts > 0 ? (
              `${((metrics.unsubscribed / metrics.filteredContacts) * 100).toFixed(1)}% dos filtrados`
            ) : '0%'}
          </p>
        </CardContent>
      </Card>
      
      {/* Gráficos em Cards mais largos */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Distribuição por status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={1}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || '#6B7280'} 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Quantidade']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Gráfico de Respostas */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Distribuição de respostas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={responseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={1}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {responseData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={RESPONSE_COLORS[index % RESPONSE_COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Quantidade']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricsCards;
