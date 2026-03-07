import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Star, Trash2, Globe, Lock, ExternalLink, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

export interface WishlistItem {
  id: number;
  wishlist_id: number;
  title: string;
  description?: string;
  url?: string;
  image_url?: string;
  price_min?: number;
  price_max?: number;
  category?: string;
  priority: number;
  privacy_level: 'public' | 'event_only';
  is_fulfilled: boolean;
  event_ids: number[];
}

interface Event {
  id: number;
  name: string;
}

interface WishlistItemCardProps {
  item: WishlistItem;
  events: Event[];
  onUpdate: (itemId: number, updates: any) => Promise<void>;
  onDelete: (itemId: number) => Promise<void>;
}

const WishlistItemCard: React.FC<WishlistItemCardProps> = ({ item, events, onUpdate, onDelete }) => {
  const renderPriority = () => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={16}
          className={cn(
            "cursor-pointer transition-colors",
            i <= item.priority ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-200"
          )}
          onClick={() => onUpdate(item.id, { priority: i })}
        />
      ))}
    </div>
  );

  const getEventName = (eventId: number) => {
    return events.find(e => e.id === eventId)?.name || 'Unknown Event';
  };

  return (
    <Card className="overflow-hidden bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-purple-200 transition-all group">
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-32 h-32 bg-gray-50 flex-shrink-0">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/150x150?text=Gift';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Star size={32} />
            </div>
          )}
        </div>
        
        <div className="flex-grow p-4">
          <div className="flex justify-between items-start gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg font-bold leading-tight line-clamp-1">
                  {item.title}
                </CardTitle>
                {item.category && (
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold uppercase rounded-full">
                    {item.category}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500 font-medium">Priority:</span>
                  {renderPriority()}
                </div>
                
                {(item.price_min !== null || item.price_max !== null) && (
                  <div className="text-sm font-semibold text-purple-600">
                    {item.price_min !== null && item.price_max !== null ? (
                      item.price_min === item.price_max ? (
                        `$${item.price_min.toFixed(2)}`
                      ) : (
                        `$${item.price_min.toFixed(2)} - $${item.price_max.toFixed(2)}`
                      )
                    ) : item.price_min !== null ? (
                      `$${item.price_min.toFixed(2)}+`
                    ) : (
                      `Up to $${item.price_max?.toFixed(2)}`
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 -mt-2 -mr-2"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 size={18} />
            </Button>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {item.description || 'No description provided.'}
          </p>
          
          <div className="flex flex-wrap items-center gap-3 mt-auto">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-7 text-[11px] font-bold px-2",
                item.privacy_level === 'public' 
                  ? "text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-50" 
                  : "text-amber-600 border-amber-100 bg-amber-50/50 hover:bg-amber-50"
              )}
              onClick={() => onUpdate(item.id, {
                privacy_level: item.privacy_level === 'public' ? 'event_only' : 'public'
              })}
            >
              {item.privacy_level === 'public' ? (
                <><Globe size={12} className="mr-1" /> PUBLIC</>
              ) : (
                <><Lock size={12} className="mr-1" /> EVENT ONLY</>
              )}
            </Button>

            {item.url && (
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-gray-400 flex items-center gap-1 hover:text-purple-600"
              >
                WEBSITE <ExternalLink size={10} />
              </a>
            )}

            {item.event_ids && item.event_ids.length > 0 && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-purple-500">
                <Calendar size={10} /> {item.event_ids.length} EVENT{item.event_ids.length > 1 ? 'S' : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WishlistItemCard;
