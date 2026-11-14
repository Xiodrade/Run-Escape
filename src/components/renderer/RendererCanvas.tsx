import { useEffect, useRef } from "react";

import { Renderer } from "./Renderer";

export interface RendererCanvasProps {
    renderer: Renderer;
    // Off for the game, which reads its keys from the window: the canvas is then no stop for
    // Tab or a pad's highlight ahead of the menus over it, though a click still focuses it.
    // The viewer reads its keys from the canvas.
    focusable?: boolean;
}

export function RendererCanvas({ renderer, focusable = true }: RendererCanvasProps): JSX.Element {
    const divRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!divRef.current) {
            return;
        }
        divRef.current.appendChild(renderer.canvas);

        renderer.init().then(() => {
            renderer.start();
        });

        return () => {
            renderer.stop();
            divRef.current?.removeChild(renderer.canvas);
        };
    }, [renderer]);

    useEffect(() => {
        renderer.canvas.tabIndex = focusable ? 0 : -1;
    }, [renderer, focusable]);

    return (
        <div
            ref={divRef}
            style={{ width: "100%", height: "100%" }}
            tabIndex={focusable ? 0 : undefined}
        />
    );
}
