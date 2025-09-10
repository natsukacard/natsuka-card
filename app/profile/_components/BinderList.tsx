'use client';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useState } from 'react';

import { BinderCard } from '@/components/binders/BinderCard';
import { Binder } from '@/lib/types';

// Droppable wrapper for each position
function DroppableBinderSlot({
  index,
  children,
  isOwner,
}: {
  index: number;
  children: React.ReactNode;
  isOwner: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${index}`,
    data: {
      type: 'droppable',
      index: index,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] transition-all duration-200 ${
        isOver && isOwner
          ? 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg'
          : ''
      }`}
    >
      {children}
    </div>
  );
}

// Draggable Binder Item Component
function DraggableBinderItem({
  binder,
  index,
  children,
  isOwner,
}: {
  binder: Binder;
  index: number;
  children: React.ReactNode;
  isOwner: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `binder-${binder.id}`,
      data: {
        type: 'binder',
        binder: binder,
        index: index,
      },
      disabled: !isOwner, // Disable dragging for non-owners
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
        cursor: 'grabbing',
      }
    : {};

  return (
    <div
      ref={setNodeRef}
      {...(isOwner ? { ...listeners, ...attributes } : {})} // Only add listeners for owners
      style={style}
      className={`transition-all duration-200 ${
        isDragging && isOwner
          ? 'opacity-30 scale-105 shadow-xl rotate-2'
          : isOwner
            ? 'opacity-100 hover:shadow-md cursor-grab active:cursor-grabbing'
            : 'opacity-100' // No hover effects for non-owners
      }`}
    >
      {children}
    </div>
  );
}

// Main Binders List Component
export function BindersList({
  binders,
  onReorder,
  isOwner = true, // Default to true for backward compatibility
}: {
  binders: Binder[];
  onReorder?: (updatedBinders: { id: string; order: number }[]) => void;
  isOwner?: boolean;
}) {
  const [activeBinder, setActiveBinder] = useState<Binder | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (!isOwner) return; // Prevent drag start for non-owners

    const { active } = event;

    if (active.data.current?.type === 'binder') {
      setActiveBinder(active.data.current.binder);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isOwner) return; // Prevent drag end for non-owners

    const { active, over } = event;

    setActiveBinder(null);

    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    if (!activeData) return;

    const activeIndex = activeData.index;
    let overIndex: number;

    if (over.data.current?.type === 'droppable') {
      overIndex = over.data.current.index;
    } else {
      return;
    }

    if (
      activeIndex !== undefined &&
      overIndex !== undefined &&
      activeIndex !== overIndex &&
      onReorder
    ) {
      // Simple swap approach like cards - much faster!
      const updatedBinders = binders.map((binder, index) => {
        if (index === activeIndex) {
          return { id: binder.id, order: overIndex };
        }
        if (index === overIndex) {
          return { id: binder.id, order: activeIndex };
        }
        return { id: binder.id, order: index };
      });

      onReorder(updatedBinders);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {binders.map((binder, index) => (
          <DroppableBinderSlot
            key={`slot-${index}`}
            index={index}
            isOwner={isOwner}
          >
            <DraggableBinderItem
              binder={binder}
              index={index}
              isOwner={isOwner}
            >
              <BinderCard binder={binder} />
            </DraggableBinderItem>
          </DroppableBinderSlot>
        ))}
      </div>

      <DragOverlay>
        {activeBinder && isOwner ? (
          <div className="opacity-95 rotate-6 scale-110 shadow-2xl">
            <BinderCard binder={activeBinder} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
