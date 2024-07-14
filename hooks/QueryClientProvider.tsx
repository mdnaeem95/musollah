import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider as RQQueryClientProvider } from 'react-query';

const queryClient = new QueryClient();

const QueryClientProvider = ({ children }: { children: ReactNode }) => {
  return (
    <RQQueryClientProvider client={queryClient}>
      {children}
    </RQQueryClientProvider>
  );
};

export default QueryClientProvider;
