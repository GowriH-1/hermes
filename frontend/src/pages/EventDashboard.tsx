import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export default function EventDashboard() {
  const { eventId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Event ID: {eventId}</p>
          <p className="text-gray-500 mt-2">Event dashboard coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
