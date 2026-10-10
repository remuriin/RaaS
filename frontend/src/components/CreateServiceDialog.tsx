import { useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { useCreateService } from '../lib/queries'
import { MAX_NAME_LENGTH } from '../lib/types'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { Dialog } from './ui/Dialog'
import { Field } from './ui/Field'

/** The "New service" form. On success it goes straight to the new service, which is still being set up. */
export function CreateServiceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const create = useCreateService()
  const [name, setName] = useState('')
  const [productName, setProductName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)

  function close() {
    onClose()
    setName('')
    setProductName('')
    setNameError(null)
    create.reset()
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setNameError('Give the service a name')
      return
    }
    setNameError(null)
    create.mutate(
      { name: name.trim(), productName: productName.trim() || null },
      {
        onSuccess: (service) => {
          close()
          void navigate({ to: '/services/$id', params: { id: service.id } })
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      busy={create.isPending}
      title="New service"
      description="You get an address and room for your files. Setting it up takes about 15 seconds."
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {create.error && (
          <Alert tone="danger" title="The service wasn't created">
            {create.error.message}
          </Alert>
        )}
        <Field
          label="Service name"
          name="name"
          autoComplete="off"
          autoFocus
          maxLength={MAX_NAME_LENGTH}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={nameError}
          hint={`Only you see this. Up to ${MAX_NAME_LENGTH} characters.`}
        />
        <Field
          label="Product name (optional)"
          name="productName"
          autoComplete="off"
          maxLength={MAX_NAME_LENGTH}
          value={productName}
          onChange={(event) => setProductName(event.target.value)}
          hint="What the assistant calls itself: “the assistant for Acme”."
        />
        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={close} disabled={create.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending}>
            Create service
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
