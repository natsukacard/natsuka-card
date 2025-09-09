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
}: {
  index: number;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id: `droppable-${index}`,
    data: {
      type: 'droppable',
      index: index,
    },
  });

  return (
    <div ref={setNodeRef} className="min-h-[200px]">
      {children}
    </div>
  );
}

// Draggable Binder Item Component
function DraggableBinderItem({
  binder,
  index,
  children,
}: {
  binder: Binder;
  index: number;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `binder-${binder.id}`,
      data: {
        type: 'binder',
        binder: binder,
        index: index,
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
      }
    : {};

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`transition-all duration-200 ${
        isDragging ? 'opacity-50' : ''
      } cursor-grab active:cursor-grabbing`}
    >
      {children}
    </div>
  );
}

// Main Binders List Component
export function BindersList({
  binders,
  onReorder,
}: {
  binders: Binder[];
  onReorder: (updatedBinders: { id: string; order: number }[]) => void;
}) {
  const [activeBinder, setActiveBinder] = useState<Binder | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setIsDragging(true);

    if (active.data.current?.type === 'binder') {
      setActiveBinder(active.data.current.binder);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveBinder(null);
    setIsDragging(false);

    if (!over || active.id === over.id) {
      return;
    }

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
      activeIndex !== overIndex
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
          <DroppableBinderSlot key={`slot-${index}`} index={index}>
            <DraggableBinderItem binder={binder} index={index}>
              <BinderCard binder={binder} />
            </DraggableBinderItem>
          </DroppableBinderSlot>
        ))}
      </div>

      <DragOverlay>
        {activeBinder ? (
          <div className="opacity-80 rotate-3 shadow-lg">
            <BinderCard binder={activeBinder} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
