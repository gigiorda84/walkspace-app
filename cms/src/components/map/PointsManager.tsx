'use client';

import { useState } from 'react';
import { Trash2, Edit2, MapPin, ChevronUp, ChevronDown } from 'lucide-react';

interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  sequenceOrder: number;
  triggerRadiusMeters: number;
}

interface PointsManagerProps {
  points: MapPoint[];
  onPointsChange: (points: MapPoint[]) => void;
  onPointSelect?: (point: MapPoint) => void;
}

export function PointsManager({ points, onPointsChange, onPointSelect }: PointsManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRadius, setEditRadius] = useState<number>(150);

  const handleDeletePoint = (id: string) => {
    const updatedPoints = points
      .filter(p => p.id !== id)
      .map((p, index) => ({ ...p, sequenceOrder: index + 1 }));
    onPointsChange(updatedPoints);
  };

  const handleEditRadius = (id: string, radius: number) => {
    const updatedPoints = points.map(p =>
      p.id === id ? { ...p, triggerRadiusMeters: radius } : p
    );
    onPointsChange(updatedPoints);
    setEditingId(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newPoints = [...points];
    [newPoints[index - 1], newPoints[index]] = [newPoints[index], newPoints[index - 1]];
    // Update sequence orders
    const reordered = newPoints.map((p, i) => ({ ...p, sequenceOrder: i + 1 }));
    onPointsChange(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index === points.length - 1) return;
    const newPoints = [...points];
    [newPoints[index], newPoints[index + 1]] = [newPoints[index + 1], newPoints[index]];
    // Update sequence orders
    const reordered = newPoints.map((p, i) => ({ ...p, sequenceOrder: i + 1 }));
    onPointsChange(reordered);
  };

  return (
    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto w-80">
      {points.length === 0 ? (
        <p className="text-sm text-gray-900">No points yet</p>
      ) : (
        <div className="space-y-2">
          {points.map((point, index) => (
            <div
              key={point.id}
              className="border border-gray-200 rounded-lg p-3 hover:border-indigo-500 cursor-pointer"
              onClick={() => onPointSelect?.(point)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2 flex-1">
                  <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {point.sequenceOrder}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-900 truncate">
                      <MapPin className="inline w-3 h-3 mr-1" />
                      {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                    </p>
                    <p className="text-xs text-gray-900 mt-1">
                      Radius: {point.triggerRadiusMeters}m
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveUp(index);
                    }}
                    disabled={index === 0}
                    className="p-1 text-gray-900 hover:text-gray-900 disabled:opacity-30"
                    title="Move up"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveDown(index);
                    }}
                    disabled={index === points.length - 1}
                    className="p-1 text-gray-900 hover:text-gray-900 disabled:opacity-30"
                    title="Move down"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(point.id);
                      setEditRadius(point.triggerRadiusMeters);
                    }}
                    className="p-1 text-indigo-600 hover:text-indigo-800"
                    title="Edit radius"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this point?')) {
                        handleDeletePoint(point.id);
                      }
                    }}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {editingId === point.id && (
                <div className="mt-3 pt-3 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                  <label className="block text-xs font-medium text-gray-900 mb-1">
                    Trigger Radius (meters)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={editRadius}
                      onChange={(e) => setEditRadius(Number(e.target.value))}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      min="5"
                      max="500"
                      step="10"
                    />
                    <button
                      onClick={() => handleEditRadius(point.id, editRadius)}
                      className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 bg-gray-200 text-gray-900 text-xs rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
