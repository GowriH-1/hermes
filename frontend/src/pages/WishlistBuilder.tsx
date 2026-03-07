import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export default function WishlistBuilder() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Wishlist Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Wishlist builder with Exa search coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
