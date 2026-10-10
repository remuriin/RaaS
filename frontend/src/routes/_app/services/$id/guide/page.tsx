import { Link, createFileRoute } from '@tanstack/react-router'
import { ApiReference } from '../../../../../components/ApiReference'
import { NotReady } from '../../../../../components/NotReady'
import { Alert } from '../../../../../components/ui/Alert'
import { Card } from '../../../../../components/ui/Card'
import { CopyField } from '../../../../../components/ui/Copy'
import { useService } from '../../../../../lib/queries'

export const Route = createFileRoute('/_app/services/$id/guide/')({
  component: GuidePage,
})

function GuidePage() {
  const { id } = Route.useParams()
  const { data: service } = useService(id)
  if (!service) return null
  if (service.status !== 'active') return <NotReady service={service} what="The API guide" />

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <h2 className="text-h3">Connect your app</h2>
        <p className="mt-2 max-w-2xl text-fg-2">
          Send questions to this service from your own application. Every request carries your API key in the
          Authorization header. The examples below already use this service&rsquo;s address.
        </p>
        <p className="mt-5 mb-1.5 text-caption text-fg-2">Base URL</p>
        <CopyField value={service.url} name="base URL" className="max-w-2xl" />

        {service.keyPrefix === null && (
          <Alert tone="info" title="This service has no API key yet" className="mt-5 max-w-2xl">
            Generate one on the{' '}
            <Link to="/services/$id" params={{ id }} className="rounded text-accent-fg underline underline-offset-2">
              overview tab
            </Link>{' '}
            before calling it from your app.
          </Alert>
        )}
        <Alert tone="warning" title="Keep the key on your server" live={false} className="mt-5 max-w-2xl">
          It gives full access to this service, including its files. Don&rsquo;t put it in browser or mobile app code.
        </Alert>
      </Card>

      <ApiReference url={service.url} />
    </div>
  )
}
