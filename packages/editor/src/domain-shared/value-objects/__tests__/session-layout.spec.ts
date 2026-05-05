import { describe, expect, it } from 'vitest';
import { SessionLayout } from '../session-layout';

describe('SessionLayout', () => {
  it('creates default layout', () => {
    const layout = SessionLayout.createDefault();
    expect(layout.splitType).toBe('Horizontal');
    expect(layout.groupCount).toBe(1);
    expect(layout.activeGroupIndex).toBe(0);
    expect(layout.isSingleGroup).toBe(true);
    expect(layout.isHorizontalSplit).toBe(true);
    expect(layout.isVerticalSplit).toBe(false);
    expect(layout.isGridLayout).toBe(false);
  });

  it('creates split layout', () => {
    const layout = SessionLayout.createSplit('Vertical');
    expect(layout.splitType).toBe('Vertical');
    expect(layout.groupCount).toBe(2);
    expect(layout.isVerticalSplit).toBe(true);
  });

  it('adds and removes groups', () => {
    let layout = SessionLayout.createDefault();
    layout = layout.addGroup();
    expect(layout.groupCount).toBe(2);
    expect(layout.isSingleGroup).toBe(false);

    layout = layout.removeGroup();
    expect(layout.groupCount).toBe(1);

    layout = layout.removeGroup();
    expect(layout.groupCount).toBe(1); // Should not go below 1
  });

  it('changes active group index', () => {
    let layout = SessionLayout.createSplit('Horizontal');
    layout = layout.setActiveGroup(1);
    expect(layout.activeGroupIndex).toBe(1);

    layout = layout.setActiveGroup(-1);
    expect(layout.activeGroupIndex).toBe(1); // Should remain unchanged
  });

  it('changes split type', () => {
    let layout = SessionLayout.createDefault();
    layout = layout.setSplitType('Grid');
    expect(layout.splitType).toBe('Grid');
    expect(layout.isGridLayout).toBe(true);
  });

  it('adjusts active group on remove', () => {
    let layout = SessionLayout.createSplit('Horizontal').addGroup(); // 3 groups
    layout = layout.setActiveGroup(2);
    layout = layout.removeGroup(); // 2 groups, active index should cap at 1
    expect(layout.activeGroupIndex).toBe(1);
  });

  it('converts to/from DTO', () => {
    const layout = SessionLayout.createDefault();
    const dto = layout.toDTO();
    expect(dto.splitType).toBe('Horizontal');

    const layoutFromDto = SessionLayout.fromDTO(dto);
    expect(layoutFromDto.splitType).toBe('Horizontal');

    const layoutCreated = SessionLayout.create(dto);
    expect(layoutCreated.splitType).toBe('Horizontal');
  });

});
