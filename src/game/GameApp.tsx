import { useEffect, useMemo, useRef, useState } from "react";
import WebFont from "webfontloader";

import { RendererCanvas } from "../components/renderer/RendererCanvas";
import { fetchCacheList, loadCacheFiles } from "../mapviewer/Caches";
import { MapViewer } from "../mapviewer/MapViewer";
import { WEBGL } from "../mapviewer/MapViewerRenderers";
import { RenderDataWorkerPool } from "../mapviewer/worker/RenderDataWorkerPool";
import { DownloadProgress } from "../rs/cache/CacheFiles";
import { formatBytes } from "../util/BytesUtil";
import { isCoarsePointer } from "../util/DeviceUtil";
import "./GameApp.css";
import {
    GAME_CACHE_NAME,
    deleteOtherGameCaches,
    findGameCache,
    getCacheMismatch,
    shouldReloadForCache,
} from "./cache";
import { GameClient } from "./client/GameClient";
import { GameStore } from "./client/GameStore";
import { SaveLock } from "./client/SaveLock";
import { MAPS } from "./content/maps";
import { LocalSaveStore } from "./core/save";
import { t } from "./i18n";
import { GameWebGLRenderer } from "./render/GameWebGLRenderer";
import { GameUi } from "./ui/GameUi";
import { iconCache } from "./ui/ItemIcon";
import { GAME_VERSION } from "./ui/changelog";

WebFont.load({
    custom: {
        families: ["OSRS Bold", "OSRS Small"],
    },
});

// Each worker has its own heap, and a phone has little memory to spare for them
const workerPool = RenderDataWorkerPool.create(isCoarsePointer ? 2 : 4);

// The page's claim on the save, held until it closes
const saveLock = new SaveLock();

if (import.meta.hot) {
    // The renderer, workers and a run in progress can't be swapped out live, so
    // any code change reloads the page instead of hot updating it.
    import.meta.hot.on("vite:beforeUpdate", () => window.location.reload());
}

// Small enough that the top-down view never shows the fog edge, large enough to
// keep a ring of loaded map squares around the player.
const RENDER_DISTANCE = 72;

type Loaded = {
    mapViewer: MapViewer;
    renderer: GameWebGLRenderer;
};

async function loadViewer(
    signal: AbortSignal,
    onProgress: (progress: DownloadProgress) => void,
): Promise<Loaded> {
    // The cache is shared with the workers in a SharedArrayBuffer, which
    // browsers only allow on a cross-origin isolated page
    if (!window.crossOriginIsolated) {
        throw new Error(
            "This page has to be served with the headers Cross-Origin-Opener-Policy: same-origin " +
                "and Cross-Origin-Embedder-Policy: require-corp (see Hosting in the README).",
        );
    }
    const cacheList = await fetchCacheList(__BUILD_ID__);
    if (!cacheList) {
        throw new Error("Failed to load the cache list (caches/caches.json).");
    }
    const cacheInfo = findGameCache(cacheList.caches);
    if (!cacheInfo) {
        throw new Error(
            `Cache ${GAME_CACHE_NAME} is missing. Download it with bun run download-caches.`,
        );
    }
    const mismatch = getCacheMismatch(cacheInfo, __BUILD_ID__);
    if (shouldReloadForCache(mismatch)) {
        window.location.reload();
        return new Promise<never>(() => {});
    }
    if (mismatch) {
        throw new Error(mismatch);
    }
    const cache = await loadCacheFiles(cacheInfo, signal, onProgress);
    deleteOtherGameCaches(cacheInfo.name).catch(console.error);
    const mapImageCache = await caches.open("map-images");

    let renderer!: GameWebGLRenderer;
    const mapViewer = new MapViewer(
        workerPool,
        cacheList,
        [],
        [],
        mapImageCache,
        WEBGL,
        cache,
        (mapViewer) => {
            // Place the camera before the first map squares are queued
            mapViewer.camera.pos[0] = MAPS[0].spawn.x;
            mapViewer.camera.pos[2] = MAPS[0].spawn.y;
            mapViewer.renderDistance = RENDER_DISTANCE;
            renderer = new GameWebGLRenderer(mapViewer);
            return renderer;
        },
    );
    iconCache.setWorkerPool(workerPool);
    return { mapViewer, renderer };
}

export function GameApp(): JSX.Element {
    const saveStore = useMemo(() => new LocalSaveStore(GAME_VERSION), []);
    // Read again once this tab has the save lock
    const store = useMemo(() => new GameStore(saveStore.load().save), [saveStore]);
    const [errorMessage, setErrorMessage] = useState<string>();
    // What was going on when the graphics went (GameClient.onGraphicsLost)
    const [graphicsLost, setGraphicsLost] = useState<"none" | "solo" | "coop">();
    const [loaded, setLoaded] = useState<Loaded>();
    const [client, setClient] = useState<GameClient>();
    const overlayRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const abortController = new AbortController();
        loadViewer(abortController.signal, (progress: DownloadProgress) => {
            const doing = progress.saving ? "canvas.saving_cache" : "canvas.downloading_cache";
            store.set({
                loadingText: t(doing, { size: formatBytes(progress.total) }),
                loadingProgress: ((progress.current / progress.total) * 100) | 0,
            });
        })
            .then((loaded) => {
                store.set({ loadingText: t("canvas.loading_lumbridge"), loadingProgress: 0 });
                setLoaded(loaded);
                if (import.meta.env.DEV) {
                    (window as any).mapViewer = loaded.mapViewer;
                }
            })
            .catch((e) => {
                console.error(e);
                setErrorMessage(e instanceof Error ? e.message : String(e));
            });
        return () => abortController.abort();
    }, [store]);

    useEffect(() => {
        if (!loaded || !overlayRef.current) {
            return;
        }
        let disposed = false;
        let created: GameClient | undefined;
        const params = new URLSearchParams(window.location.search);
        GameClient.create(
            loaded.mapViewer,
            loaded.renderer,
            overlayRef.current,
            store,
            saveStore,
            saveLock,
            {
                stress: parseInt(params.get("stress") ?? "0") || 0,
                autostart: params.get("autostart") ?? undefined,
                invade: import.meta.env.DEV ? (params.get("invade") ?? undefined) : undefined,
                director: (import.meta.env.DEV && params.get("director")) || undefined,
                raidTest:
                    import.meta.env.DEV && params.has("raidtest")
                        ? params.get("raidtest") === "short"
                            ? "short"
                            : "max"
                        : undefined,
            },
        )
            .then((gameClient) => {
                if (disposed) {
                    gameClient.dispose();
                    return;
                }
                created = gameClient;
                loaded.renderer.game = gameClient;
                setClient(gameClient);
                if (params.has("movementDiagnostics")) {
                    gameClient.setMovementDiagnostics(true);
                    (window as any).movementDiagnostics = {
                        start: () => gameClient.setMovementDiagnostics(true),
                        snapshot: () => gameClient.getMovementDiagnostics(),
                        stop: () => {
                            const snapshot = gameClient.getMovementDiagnostics();
                            gameClient.setMovementDiagnostics(false);
                            return snapshot;
                        },
                    };
                }
                if (import.meta.env.DEV) {
                    (window as any).game = gameClient;
                    import("./render/FrameProbe").then(({ FrameProbe }) => {
                        (window as any).frameProbe = new FrameProbe(loaded.renderer, gameClient);
                    });
                }
            })
            .catch((e) => {
                console.error(e);
                setErrorMessage(e instanceof Error ? e.message : String(e));
            });
        return () => {
            disposed = true;
            created?.dispose();
            if (params.has("movementDiagnostics")) delete (window as any).movementDiagnostics;
        };
    }, [loaded, store, saveStore]);

    // A phone can take the GPU back from a game it's put away, or when it's short
    // of memory. preventDefault lets the browser offer the context back, but the
    // game's textures, map squares and baked actors were all on it, and there's no
    // making those again short of loading again. So the run stops (solo) and the
    // player keeps what they found when they reload.
    useEffect(() => {
        const renderer = loaded?.renderer;
        const canvas = renderer?.canvas;
        const onLost = (e: Event) => {
            e.preventDefault();
            console.warn("WebGL context lost");
            renderer!.contextLost = true;
            setGraphicsLost(client?.onGraphicsLost() ?? "none");
        };
        canvas?.addEventListener("webglcontextlost", onLost);
        return () => canvas?.removeEventListener("webglcontextlost", onLost);
    }, [loaded, client]);

    const reloadAfterLoss = () => {
        try {
            client?.endRunForReload();
        } finally {
            window.location.reload();
        }
    };

    return (
        <div className="game-root">
            {loaded && <RendererCanvas renderer={loaded.renderer} focusable={false} />}
            <canvas className="game-overlay" ref={overlayRef} />
            {errorMessage ? (
                <div className="game-status game-status-lost content-text">
                    <p>{t("canvas.start_failed")}</p>
                    <p>{errorMessage}</p>
                    <button className="ui-button" onClick={() => window.location.reload()}>
                        {t("save.reload")}
                    </button>
                </div>
            ) : graphicsLost ? (
                <div className="game-status game-status-lost content-text">
                    <p>
                        {t("canvas.graphics_lost")}
                        {graphicsLost === "solo" && t("canvas.run_paused")}
                        {graphicsLost === "none"
                            ? t("canvas.reload_continue")
                            : t("canvas.reload_kept")}
                    </p>
                    <button className="ui-button" onClick={reloadAfterLoss}>
                        {t("save.reload")}
                    </button>
                </div>
            ) : (
                <GameUi store={store} client={client} />
            )}
        </div>
    );
}
