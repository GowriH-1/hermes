import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ShoppingCart, ExternalLink } from 'lucide-react';

export interface ExaProduct {
  title: string;
  url: string;
  description?: string;
  image_url?: string;
  price?: number;
  score?: number;
}

interface ProductCardProps {
  product: ExaProduct;
  onAdd: (product: ExaProduct) => void;
  isAdding?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd, isAdding }) => {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow border-pink-100/50">
      <div className="relative h-48 w-full overflow-hidden bg-gray-100 rounded-t-lg">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.title} 
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=No+Image';
            }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400">
            <ShoppingCart size={48} strokeWidth={1} />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-pink-500 text-white px-2 py-1 rounded text-xs font-bold shadow-sm">
          Exa Search
        </div>
      </div>
      
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-base line-clamp-2 leading-tight">
            {product.title}
          </CardTitle>
          {product.price !== null && product.price !== undefined && (
            <span className="text-purple-600 font-bold whitespace-nowrap">
              ${product.price.toFixed(2)}
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 flex-grow">
        <p className="text-sm text-gray-600 line-clamp-3 mb-2">
          {product.description || 'No description available.'}
        </p>
        <a 
          href={product.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-blue-500 flex items-center gap-1 hover:underline"
        >
          View Source <ExternalLink size={12} />
        </a>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={() => onAdd(product)} 
          className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white border-none"
          disabled={isAdding}
        >
          {isAdding ? 'Adding...' : '+ Add to Wishlist'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
