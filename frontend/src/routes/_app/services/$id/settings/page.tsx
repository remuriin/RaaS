import { createFileRoute } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { DeleteServiceDialog } from '../../../../../components/DeleteServiceDialog'
import { NotReady } from '../../../../../components/NotReady'
import { Alert } from '../../../../../components/ui/Alert'
import { Button } from '../../../../../components/ui/Button'
import { Card } from '../../../../../components/ui/Card'
import { Field } from '../../../../../components/ui/Field'
import { useService, useUpdateService } from '../../../../../lib/queries'
import { toast } from '../../../../../lib/toast'
import { MAX_NAME_LENGTH, type Service } from '../../../../../lib/types'

export const Route = createFileRoute('/_app/services/$id/settings/')({
  component: SettingsPage,
})

function SettingsPage() {
  const { id } = Route.useParams()
  const { data: service } = useService(id)
  const [deleting, setDeleting] = useState(false)

  if (!service) return null
  if (service.status === 'deleting') return <NotReady service={service} what="Settings" />

  return (
    <div className="flex flex-col gap-6">
      {/* the key makes the form start over from the saved values whenever they change */}
      <DetailsForm key={`${service.name}|${service.productName ?? ''}`} service={service} />

      <Card className="border-danger/40 p-6">
        <h2 className="text-h3">Delete this service</h2>
        <p className="mt-2 max-w-2xl text-fg-2">
          Removes its files, its API key and its address for good. Apps using this service will stop getting answers.
        </p>
        <Button variant="danger" className="mt-5" onClick={() => setDeleting(true)}>
          Delete service
        </Button>
      </Card>

      <DeleteServiceDialog
        service={service}
        open={deleting}
        onClose={() => setDeleting(false)}
        // a service that never became active has nothing in it worth a second check
        confirmName={service.status === 'active'}
      />
    </div>
  )
}

function DetailsForm({ service }: { service: Service }) {
  const update = useUpdateService(service.id)
  const [name, setName] = useState(service.name)
  const [productName, setProductName] = useState(service.productName ?? '')
  const [nameError, setNameError] = useState<string | null>(null)

  const changed = name.trim() !== service.name || productName.trim() !== (service.productName ?? '')

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setNameError('The service needs a name')
      return
    }
    setNameError(null)
    const productChanged = productName.trim() !== (service.productName ?? '')
    update.mutate(
      { name: name.trim(), productName: productName.trim() || null },
      {
        onSuccess: () =>
          toast.success(
            'Changes saved',
            productChanged ? 'The new product name is used from the next question.' : undefined,
          ),
      },
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-h3">Details</h2>
      <form onSubmit={submit} noValidate className="mt-5 flex max-w-md flex-col gap-4">
        {update.error && (
          <Alert tone="danger" title="The changes weren't saved">
            {update.error.message}
          </Alert>
        )}
        <Field
          label="Service name"
          name="name"
          autoComplete="off"
          maxLength={MAX_NAME_LENGTH}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={nameError}
          hint="Only you see this."
        />
        <Field
          label="Product name"
          name="productName"
          autoComplete="off"
          maxLength={MAX_NAME_LENGTH}
          value={productName}
          onChange={(event) => setProductName(event.target.value)}
          hint="What the assistant calls itself. Used from the very next question. Leave empty for none."
        />
        <div>
          <Button type="submit" loading={update.isPending} disabled={!changed} className="mt-1">
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  )
}
