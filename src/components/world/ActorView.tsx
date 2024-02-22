import React, { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import SpriteSheetCanvas from "./SpriteSheetCanvas";

import { DMG_PALETTE, MIDDLE_MOUSE } from "consts";
import {
  actorSelectors,
  paletteSelectors,
} from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import { getSettings } from "store/features/settings/settingsState";
import styled, { css } from "styled-components";
import { RootState } from "store/configureStore";
import { Palette } from "store/features/entities/entitiesTypes";

interface ActorViewProps {
  id: string;
  sceneId: string;
  palettes?: Palette[];
  editable?: boolean;
}

interface WrapperProps {
  x: number;
  y: number;
  selected?: boolean;
}

const Wrapper = styled.div<WrapperProps>`
  position: absolute;
  width: 16px;
  height: 8px;
  background-color: rgba(247, 45, 220, 0.5);
  outline: 1px solid rgba(140, 0, 177, 0.8);
  -webkit-transform: translate3d(0, 0, 0);
  left: ${(props) => props.x * 8}px;
  top: ${(props) => props.y * 8}px;

  ${(props) =>
    props.selected
      ? css`
          background-color: rgba(247, 45, 220, 0.8);
          outline: 1px solid rgba(140, 0, 177, 1);
          z-index: 100;
        `
      : ""}
`;

const PinScreenPreview = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 160px;
  height: 144px;
  pointer-events: none;
  z-index: 100;
  outline: 2000px solid rgba(0, 0, 0, 0.5);
`;

const CanvasWrapper = styled.div`
  pointer-events: none;
`;

const ActorView = ({ id, sceneId, palettes, editable }: ActorViewProps) => {
  const dispatch = useDispatch();
  const actor = useSelector((state: RootState) =>
    actorSelectors.selectById(state, id)
  );
  const selected = useSelector(
    (state: RootState) =>
      state.editor.type === "actor" &&
      state.editor.scene === sceneId &&
      state.editor.entityId === id
  );
  const settings = useSelector((state: RootState) => getSettings(state));
  const palettesLookup = useSelector((state: RootState) =>
    paletteSelectors.selectEntities(state)
  );
  const showSprite = useSelector((state: RootState) => state.editor.zoom > 80);
  const gbcEnabled = settings.customColorsEnabled;
  const palette: Palette = useMemo(
    () =>
      gbcEnabled
        ? (palettesLookup[actor?.paletteId ?? ""] ||
            palettesLookup[settings.defaultSpritePaletteId]) ??
          DMG_PALETTE
        : DMG_PALETTE,
    [
      actor?.paletteId,
      gbcEnabled,
      palettesLookup,
      settings.defaultSpritePaletteId,
    ]
  );

  const onMouseUp = useCallback(() => {
    dispatch(editorActions.dragActorStop());
    window.removeEventListener("mouseup", onMouseUp);
  }, [dispatch]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (editable && e.nativeEvent.which !== MIDDLE_MOUSE) {
        dispatch(editorActions.dragActorStart({ sceneId, actorId: id }));
        dispatch(editorActions.setTool({ tool: "select" }));
        window.addEventListener("mouseup", onMouseUp);
      }
    },
    [dispatch, editable, id, onMouseUp, sceneId]
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseUp]);

  if (!actor) {
    return <></>;
  }

  return (
    <>
      {selected && actor.isPinned && <PinScreenPreview />}
      <Wrapper
        x={actor.x}
        y={actor.y}
        selected={selected}
        onMouseDown={onMouseDown}
      >
        {showSprite && (
          <CanvasWrapper>
            <SpriteSheetCanvas
              spriteSheetId={actor.spriteSheetId}
              direction={actor.direction}
              frame={0}
              palette={palette}
              palettes={palettes}
              offsetPosition
            />
          </CanvasWrapper>
        )}
      </Wrapper>
    </>
  );
};

export default ActorView;