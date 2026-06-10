import { useReducer } from "react";
import type { ScreenRect } from "@/lib/pdf/coordinates";

export type SignaturePayload = { dataUrl: string };
export type TextPayload = { text: string; fontSizePx: number; color: string };

export type Annotation =
  | {
      id: string;
      type: "signature";
      pageIndex: number;
      rect: ScreenRect;
      payload: SignaturePayload;
    }
  | { id: string; type: "text"; pageIndex: number; rect: ScreenRect; payload: TextPayload };

export interface AnnotationsState {
  items: Annotation[];
}

export const initialAnnotationsState: AnnotationsState = { items: [] };

export type AnnotationAction =
  | { type: "add"; annotation: Annotation }
  | {
      type: "update";
      id: string;
      patch: Partial<Pick<Annotation, "rect">> & { payload?: Annotation["payload"] };
    }
  | { type: "remove"; id: string }
  | { type: "clear" };

export function annotationsReducer(
  state: AnnotationsState,
  action: AnnotationAction,
): AnnotationsState {
  switch (action.type) {
    case "add":
      return { items: [...state.items, action.annotation] };
    case "update":
      return {
        items: state.items.map((a) =>
          a.id === action.id
            ? ({ ...a, ...action.patch, payload: action.patch.payload ?? a.payload } as Annotation)
            : a,
        ),
      };
    case "remove":
      return { items: state.items.filter((a) => a.id !== action.id) };
    case "clear":
      return initialAnnotationsState;
    default:
      return state;
  }
}

export function useAnnotations() {
  const [state, dispatch] = useReducer(annotationsReducer, initialAnnotationsState);
  return { items: state.items, dispatch };
}
