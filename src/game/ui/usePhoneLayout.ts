import { useSyncExternalStore } from "react";

// A phone held sideways: Mobile.css's own query, so a screen laid out for one in React and its
// rules there always agree
export const PHONE_QUERY = "(pointer: coarse) and (max-height: 520px)";

function subscribe(onChange: () => void): () => void {
    const query = window.matchMedia?.(PHONE_QUERY);
    query?.addEventListener?.("change", onChange);
    return () => query?.removeEventListener?.("change", onChange);
}

function isPhone(): boolean {
    return window.matchMedia?.(PHONE_QUERY).matches ?? false;
}

// Whether the screen's a phone's, following it as the phone turns
export function usePhoneLayout(): boolean {
    return useSyncExternalStore(subscribe, isPhone, () => false);
}
