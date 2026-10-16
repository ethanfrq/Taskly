"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconGripVertical } from "@tabler/icons-react";
import { useState, useTransition } from "react";
import { reorderTasksAction } from "@/app/(app)/actions";
import { GroupList } from "@/components/ui/group";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/format";
import type { TaskView } from "@/lib/tasks/service";
import { TaskRow } from "./task-row";

function SortableRow({
  task,
  today,
  onToggle,
  showDate,
}: {
  task: TaskView;
  today: string;
  onToggle: (task: TaskView) => void;
  showDate: boolean;
}) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });
  return (
    <TaskRow
      task={task}
      today={today}
      onToggle={onToggle}
      showDate={showDate}
      itemRef={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "relative z-10 shadow-lg" : ""}
      trailing={
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={format(t.task.reorder, { title: task.title })}
          className="-mr-2 flex h-9 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-text-secondary active:cursor-grabbing"
        >
          <IconGripVertical size={18} stroke={1.6} aria-hidden />
        </button>
      }
    />
  );
}

/** Tasks the user can reorder by dragging the handle (or with the keyboard). */
export function SortableTaskList({
  tasks,
  today,
  onToggle,
  showDate = false,
}: {
  tasks: TaskView[];
  today: string;
  onToggle: (task: TaskView) => void;
  showDate?: boolean;
}) {
  const [order, setOrder] = useState(tasks);
  const [source, setSource] = useState(tasks);
  const [, startTransition] = useTransition();
  // New tasks from the server replace the local order (React's "adjust state on prop change").
  if (tasks !== source) {
    setSource(tasks);
    setOrder(tasks);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = order.findIndex((task) => task.id === active.id);
    const to = order.findIndex((task) => task.id === over.id);
    const next = arrayMove(order, from, to);
    setOrder(next);
    startTransition(() => reorderTasksAction(next.map((task) => task.id)));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
      <SortableContext items={order.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <GroupList>
          {order.map((task) => (
            <SortableRow key={task.id} task={task} today={today} onToggle={onToggle} showDate={showDate} />
          ))}
        </GroupList>
      </SortableContext>
    </DndContext>
  );
}
