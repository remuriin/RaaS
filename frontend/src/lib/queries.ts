import { QueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { ApiError, api, type ServiceDetails } from './api'
import { shownKeys } from './session'
import type { Service, StoredFile } from './types'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      // a 4xx will not get better by asking again; network trouble and 5xx get two more tries
      retry: (failures, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
        return failures < 2
      },
    },
  },
})

export const keys = {
  services: ['services'] as const,
  service: (id: string) => ['services', id] as const,
  files: (id: string) => ['services', id, 'files'] as const,
}

const changing = (service: Service | undefined) => service?.status === 'pending' || service?.status === 'deleting'

/** Every service of the signed-in account, oldest first. */
export function useServices() {
  return useQuery({
    queryKey: keys.services,
    queryFn: api.listServices,
    // keep asking while one is still being set up or torn down
    refetchInterval: (query) => (query.state.data?.some(changing) ? 2000 : false),
  })
}

/** One service. While it is pending or deleting, it is asked for again every 1.5 seconds. */
export function useService(id: string) {
  return useQuery({
    queryKey: keys.service(id),
    queryFn: () => api.getService(id),
    // show what the list already knows while the fresh copy is on its way
    placeholderData: () => queryClient.getQueryData<Service[]>(keys.services)?.find((service) => service.id === id),
    refetchInterval: (query) => {
      if (query.state.error) return false // a deleted service answers 404; stop there
      return changing(query.state.data) ? 1500 : false
    },
  })
}

export function useCreateService() {
  return useMutation({
    mutationFn: (details: ServiceDetails) => api.createService(details),
    onSuccess: (service) => {
      queryClient.setQueryData(keys.service(service.id), service)
      queryClient.setQueryData<Service[]>(keys.services, (list) => (list ? [...list, service] : [service]))
    },
  })
}

function storeService(service: Service) {
  queryClient.setQueryData(keys.service(service.id), service)
  queryClient.setQueryData<Service[]>(keys.services, (list) =>
    list?.map((item) => (item.id === service.id ? service : item)),
  )
}

export function useUpdateService(id: string) {
  return useMutation({
    mutationFn: (details: Partial<ServiceDetails>) => api.updateService(id, details),
    onSuccess: storeService,
  })
}

export function useDeleteService(id: string) {
  return useMutation({
    mutationFn: () => api.deleteService(id),
    onSuccess: () => {
      const service = queryClient.getQueryData<Service>(keys.service(id))
      if (service) storeService({ ...service, status: 'deleting' })
      shownKeys.set(({ [id]: _removed, ...rest }) => rest)
    },
  })
}

/** First key and "regenerate" are the same call. Only ever run from a button press. */
export function useGenerateKey(id: string) {
  return useMutation({
    mutationFn: () => api.generateKey(id),
    onSuccess: (key) => {
      shownKeys.set((all) => ({ ...all, [id]: key.apiKey }))
      const service = queryClient.getQueryData<Service>(keys.service(id))
      if (service) storeService({ ...service, keyPrefix: key.keyPrefix })
    },
  })
}

/** The files stored in a service. Asked for again every 2 seconds while one is still being indexed. */
export function useFiles(id: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.files(id),
    queryFn: () => api.listFiles(id),
    enabled,
    refetchInterval: (query) => (query.state.data?.some((file) => file.status === 'processing') ? 2000 : false),
  })
}

export function useDeleteFile(id: string) {
  return useMutation({
    mutationFn: (name: string) => api.deleteFile(id, name),
    onSuccess: (_nothing, name) => {
      queryClient.setQueryData<StoredFile[]>(keys.files(id), (list) => list?.filter((file) => file.source !== name))
      // the file and chunk counts on the service changed too
      void queryClient.invalidateQueries({ queryKey: keys.service(id), exact: true })
    },
  })
}
