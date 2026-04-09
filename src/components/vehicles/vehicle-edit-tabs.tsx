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
    <Tabs defaultValue="dados" className="w-full gap-4">
      <TabsList variant="line" className="w-full flex-wrap justify-start">
        <TabsTrigger value="dados">Dados</TabsTrigger>
        <TabsTrigger value="fotos">Fotos</TabsTrigger>
        <TabsTrigger value="custos">Custos</TabsTrigger>
        <TabsTrigger value="historico">Histórico de preço</TabsTrigger>
      </TabsList>
      <TabsContent value="dados" className="mt-4">
        {dados}
      </TabsContent>
      <TabsContent value="fotos" className="mt-4">
        {fotos}
      </TabsContent>
      <TabsContent value="custos" className="mt-4">
        {custos}
      </TabsContent>
      <TabsContent value="historico" className="mt-4">
        {historico}
      </TabsContent>
    </Tabs>
  );
}
