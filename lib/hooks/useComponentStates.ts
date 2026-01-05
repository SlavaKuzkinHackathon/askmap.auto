// lib/hooks/useComponentStates.ts
import { useQuery } from '@tanstack/react-query';
import { ComponentCategory, ComponentStatus } from '@prisma/client';

export interface ComponentState {
  componentId: string;
  name: string;
  slug: string;
  category: ComponentCategory;
  status: ComponentStatus;
  notes: string | null;
  lastChecked: string;
}
const fetchComponentStates = async (carId: string): Promise<ComponentState[]> => {
  const response = await fetch(`/api/cars/${carId}/component-states`);
  if (!response.ok) {
    throw new Error('Failed to fetch component states');
  }
  return response.json();
};
export const useComponentStates = (carId: string) => {
  return useQuery<ComponentState[], Error>({
    queryKey: ['componentStates', carId],
    queryFn: () => fetchComponentStates(carId),
    enabled: !!carId,
  });
};