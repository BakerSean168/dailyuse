import { describe, expect, it } from 'vitest';
import { TabViewState } from '../tab-view-state';

describe('TabViewState', () => {
  it('creates default state', () => {
    const state = TabViewState.createDefault();
    expect(state.scrollTop).toBe(0);
    expect(state.scrollLeft).toBe(0);
    expect(state.cursorPosition).toEqual({ line: 1, column: 1 });
    expect(state.isAtTop).toBe(true);
    expect(state.cursorLine).toBe(1);
    expect(state.cursorColumn).toBe(1);
    expect(state.selections).toBeNull();
    expect(state.hasSelections).toBe(false);
    expect(state.selectionCount).toBe(0);
  });

  it('updates scroll position', () => {
    const state = TabViewState.createDefault().setScrollPosition(100, 50);
    expect(state.scrollTop).toBe(100);
    expect(state.scrollLeft).toBe(50);
    expect(state.isAtTop).toBe(false);

    const stateOnlyTop = TabViewState.createDefault().setScrollPosition(200);
    expect(stateOnlyTop.scrollTop).toBe(200);
    expect(stateOnlyTop.scrollLeft).toBe(0);
  });

  it('updates cursor position', () => {
    const state = TabViewState.createDefault().setCursorPosition(10, 5);
    expect(state.cursorPosition).toEqual({ line: 10, column: 5 });
    expect(state.cursorLine).toBe(10);
    expect(state.cursorColumn).toBe(5);
  });

  it('updates selections', () => {
    let state = TabViewState.createDefault();
    const selections = [
      { start: { line: 1, column: 1 }, end: { line: 1, column: 10 } }
    ];
    state = state.setSelections(selections);
    expect(state.selections).toEqual(selections);
    expect(state.hasSelections).toBe(true);
    expect(state.selectionCount).toBe(1);

    state = state.clearSelections();
    expect(state.selections).toBeNull();
    expect(state.hasSelections).toBe(false);
  });

  it('handles null selections properly', () => {
    const state = TabViewState.create({
      scrollTop: 0,
      scrollLeft: 0,
      cursorPosition: { line: 1, column: 1 },
      selections: null
    });
    expect(state.hasSelections).toBe(false);
    expect(state.selectionCount).toBe(0);
  });

  it('converts to/from Server DTO', () => {
    const state = TabViewState.createDefault();
    const dto = state.toServerDTO();
    expect(dto.scrollTop).toBe(0);

    const stateFromDto = TabViewState.fromDTO(dto);
    expect(stateFromDto.scrollTop).toBe(0);

    // test with selections
    const stateWithSelections = state.setSelections([{ start: { line: 1, column: 1 }, end: { line: 1, column: 10 } }]);
    const dto2 = stateWithSelections.toServerDTO();
    expect(dto2.selections).not.toBeNull();
  });

  it('converts to/from Persistence DTO', () => {
    const state = TabViewState.createDefault();
    const pdto = state.toPersistenceDTO();
    expect(pdto.scroll_top).toBe(0);
    expect(pdto.selections).toBeNull();

    const stateFromPdto = TabViewState.fromPersistenceDTO(pdto);
    expect(stateFromPdto.scrollTop).toBe(0);

    const stateWithSelections = state.setSelections([{ start: { line: 1, column: 1 }, end: { line: 1, column: 10 } }]);
    const pdto2 = stateWithSelections.toPersistenceDTO();
    expect(pdto2.selections).not.toBeNull();

    const stateFromPdto2 = TabViewState.fromPersistenceDTO(pdto2);
    expect(stateFromPdto2.selections).toHaveLength(1);
  });
});
