import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useDeleteService } from '../lib/queries'
import type { Service } from '../lib/types'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { Dialog } from './ui/Dialog'
import { Field } from './ui/Field'

interface DeleteServiceDialogProps {
  service: Service
  open: boolean
  onClose: () => void
  /** Ask for the service's name to be typed first. Off for a service that never worked, which has nothing to lose. */
  confirmName?: boolean
}

export function DeleteServiceDialog({ service, open, onClose, confirmName = true }: DeleteServiceDialogProps) {
  const navigate = useNavigate()
  const remove = useDeleteService(service.id)
  const [typed, setTyped] = useState('')
  const confirmed = !confirmName || typed.trim() === service.name

  function close() {
    onClose()
    setTyped('')
    remove.reset()
  }

  function confirm() {
    remove.mutate(undefined, {
      onSuccess: () => {
        close()
        // the overview shows the "deleting" state and leaves for the list once the service is gone
        void navigate({ to: '/services/$id', params: { id: service.id } })
      },
    })
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      busy={remove.isPending}
      title="Delete this service?"
      description={
        <>
          <span className="font-medium text-fg">{service.name}</span> is removed for good, with its files, its API key
          and its address. Apps using it will stop getting answers.
        </>
      }
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={remove.isPending}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirm} loading={remove.isPending} disabled={!confirmed}>
            Delete service
          </Button>
        </>
      }
    >
      {remove.error && (
        <Alert tone="danger" title="The service wasn't deleted" className="mb-4">
          {remove.error.message}
        </Alert>
      )}
      {confirmName && (
        <Field
          label="Type the service name to confirm"
          autoComplete="off"
          spellCheck={false}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          hint={<span className="font-mono text-fg-2">{service.name}</span>}
        />
      )}
    </Dialog>
  )
}
