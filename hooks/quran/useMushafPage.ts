import { useQuery } from '@tanstack/react-query';
import { fetchMushafPage, type MushafPageData } from '../../api/services/quran/mushafPage';

export function useMushafPage(pageNumber: number) {
  return useQuery<MushafPageData>({
    queryKey: ['mushaf-page', pageNumber],
    queryFn: () => fetchMushafPage(pageNumber),
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: pageNumber >= 1 && pageNumber <= 604,
  });
}
