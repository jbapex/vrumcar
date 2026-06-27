'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

type VehicleEditTabsProps = {
  dados: React.ReactNode;
  fotos: React.ReactNode;
  custos: React.ReactNode;
  historico: React.ReactNode;
};

export function VehicleEditTabs({
  dados,
  fotos,
  custos,
  historico,
}: VehicleEditTabsProps) {
  return (
    <Tabs defaultValue="dados" className="w-full gap-0">
      <div className="border-b border-border/50 px-4 md:px-5">
        <TabsList
          variant="line"
          className="h-10 w-full justify-start gap-1 bg-transparent p-0"
        >
          <TabsTrigger value="dados" className="px-3 text-xs">
            Dados
          </TabsTrigger>
          <TabsTrigger value="fotos" className="px-3 text-xs">
            Fotos
          </TabsTrigger>
          <TabsTrigger value="custos" className="px-3 text-xs">
            Custos
          </TabsTrigger>
          <TabsTrigger value="historico" className="px-3 text-xs">
            Histórico de preço
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="dados" className="p-4 md:p-5">
        {dados}
      </TabsContent>
      <TabsContent value="fotos" className="p-4 md:p-5">
        {fotos}
      </TabsContent>
      <TabsContent value="custos" className="p-4 md:p-5">
        {custos}
      </TabsContent>
      <TabsContent value="historico" className="p-4 md:p-5">
        {historico}
      </TabsContent>
    </Tabs>
  );
}
