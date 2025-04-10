import { useCallback, useEffect, useRef, useState } from "react";

function useZoom(containerRef, viewerRef, size) {
  const [zoom, setZoom] = useState(0.01);
  const currentZoomRef = useRef(0.01);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const PADDING = 96;
    const containerHeight = container.clientHeight - PADDING;
    const containerWidth = container.clientWidth - PADDING;
    const { width, height } = size;

    viewerRef.current?.infiniteViewer.scrollCenter();
    const desiredZoom = Math.min(
      containerWidth / width,
      containerHeight / height
    );
    currentZoomRef.current = desiredZoom;
    setZoom(desiredZoom);
  }, [size, containerRef]);

  const handlePinch = useCallback((e) => {
    const deltaY = e.inputEvent.deltaY;
    const changer = deltaY > 0 ? 0.0085 : -0.0085;
    const currentZoom = currentZoomRef.current;
    const newZoom = currentZoom + changer;
    if (newZoom >= 0.001 && newZoom <= 10) {
      currentZoomRef.current = newZoom;
      setZoom(newZoom);
    }
  }, []);

  return { zoom, handlePinch };
}

export default useZoom;
