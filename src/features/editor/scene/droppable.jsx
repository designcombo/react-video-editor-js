import { dispatch } from "@designcombo/events";
import { ADD_AUDIO, ADD_IMAGE, ADD_VIDEO } from "@designcombo/state";
import { generateId } from "@designcombo/timeline";
import React, { useCallback, useState } from "react";

const useDragAndDrop = (onDragStateChange) => {
  const [isPointerInside, setIsPointerInside] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDrop = useCallback((draggedData) => {
    const payload = { ...draggedData, id: generateId() };
    switch (draggedData.type) {
      case AcceptedDropTypes.IMAGE:
        dispatch(ADD_IMAGE, { payload });
        break;
      case AcceptedDropTypes.VIDEO:
        dispatch(ADD_VIDEO, { payload });
        break;
      case AcceptedDropTypes.AUDIO:
        dispatch(ADD_AUDIO, { payload });
        break;
    }
  }, []);

  const onDragEnter = useCallback(
    (e) => {
      e.preventDefault();
      try {
        const draggedDataString = e.dataTransfer?.types[0];
        if (!draggedDataString) return;
        const draggedData = JSON.parse(draggedDataString);

        if (!Object.values(AcceptedDropTypes).includes(draggedData.type))
          return;
        setIsDraggingOver(true);
        setIsPointerInside(true);
        onDragStateChange?.(true);
      } catch (error) {
        console.error("Error parsing dragged data:", error);
      }
    },
    [onDragStateChange]
  );

  const onDragOver = useCallback(
    (e) => {
      e.preventDefault();
      if (isPointerInside) {
        setIsDraggingOver(true);
        onDragStateChange?.(true);
      }
    },
    [isPointerInside, onDragStateChange]
  );

  const onDrop = useCallback(
    (e) => {
      if (!isDraggingOver) return;
      e.preventDefault();
      setIsDraggingOver(false);
      onDragStateChange?.(false);

      try {
        const draggedDataString = e.dataTransfer?.types[0];
        const draggedData = JSON.parse(
          e.dataTransfer.getData(draggedDataString)
        );
        handleDrop(draggedData);
      } catch (error) {
        console.error("Error parsing dropped data:", error);
      }
    },
    [isDraggingOver, onDragStateChange, handleDrop]
  );

  const onDragLeave = useCallback(
    (e) => {
      e.preventDefault();
      if (!e.currentTarget.contains(e.relatedTarget)) {
        setIsDraggingOver(false);
        setIsPointerInside(false);
        onDragStateChange?.(false);
      }
    },
    [onDragStateChange]
  );

  return { onDragEnter, onDragOver, onDrop, onDragLeave, isDraggingOver };
};

export const DroppableArea = ({
  children,
  className,
  style,
  onDragStateChange,
  id,
}) => {
  const { onDragEnter, onDragOver, onDrop, onDragLeave } =
    useDragAndDrop(onDragStateChange);

  return (
    <div
      id={id}
      onDragEnter={onDragEnter}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={className}
      style={style}
      role="region"
      aria-label="Droppable area for images, videos, and audio"
    >
      {children}
    </div>
  );
};
