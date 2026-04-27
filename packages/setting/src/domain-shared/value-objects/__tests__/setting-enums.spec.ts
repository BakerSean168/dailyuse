import { describe, expect, it } from 'vitest';
import { FontSize } from '../font-size';
import { GoalViewType } from '../goal-view-type';
import { OperatorType } from '../operator-type';
import { ProfileVisibility } from '../profile-visibility';
import { ScheduleViewType } from '../schedule-view-type';
import { SettingCategory } from '../setting-category';
import { SettingScope } from '../setting-scope';
import { SettingValueType } from '../setting-value-type';
import { TaskViewType } from '../task-view-type';
import { ThemeMode } from '../theme-mode';
import { TimeFormat } from '../time-format';
import { UIInputType } from '../ui-input-type';

describe('setting enum-like value objects', () => {
  it('covers font size behavior', () => {
    expect(FontSize.getAll()).toEqual([FontSize.Small, FontSize.Medium, FontSize.Large]);
    expect(FontSize.of('Medium')).toBe(FontSize.Medium);
    expect(FontSize.isValid('Small')).toBe(true);
    expect(FontSize.isValid('Huge')).toBe(false);
    expect(FontSize.toPx(FontSize.Small)).toBe(12);
    expect(FontSize.toPx(FontSize.Medium)).toBe(14);
    expect(FontSize.toPx(FontSize.Large)).toBe(16);
    expect(FontSize.isSmall(FontSize.Small)).toBe(true);
    expect(FontSize.isLarge(FontSize.Large)).toBe(true);
    expect(() => FontSize.of('Huge')).toThrow('Invalid FontSize');
  });

  it('covers theme and scope helpers', () => {
    expect(ThemeMode.getAll()).toEqual([ThemeMode.Light, ThemeMode.Dark, ThemeMode.Auto]);
    expect(ThemeMode.of('Dark')).toBe(ThemeMode.Dark);
    expect(ThemeMode.isValid('Auto')).toBe(true);
    expect(ThemeMode.isValid('Solarized')).toBe(false);
    expect(ThemeMode.isLight(ThemeMode.Light)).toBe(true);
    expect(ThemeMode.isDark(ThemeMode.Dark)).toBe(true);
    expect(ThemeMode.isAuto(ThemeMode.Auto)).toBe(true);
    expect(ThemeMode.isManual(ThemeMode.Light)).toBe(true);
    expect(ThemeMode.isManual(ThemeMode.Auto)).toBe(false);
    expect(() => ThemeMode.of('Solarized')).toThrow('Invalid ThemeMode');

    expect(SettingScope.getAll()).toEqual([
      SettingScope.System,
      SettingScope.User,
      SettingScope.Device,
    ]);
    expect(SettingScope.of('User')).toBe(SettingScope.User);
    expect(SettingScope.isValid('Device')).toBe(true);
    expect(SettingScope.isValid('Global')).toBe(false);
    expect(SettingScope.isSystem(SettingScope.System)).toBe(true);
    expect(SettingScope.isUser(SettingScope.User)).toBe(true);
    expect(SettingScope.isDevice(SettingScope.Device)).toBe(true);
    expect(SettingScope.isPersonal(SettingScope.Device)).toBe(true);
    expect(SettingScope.isPersonal(SettingScope.System)).toBe(false);
    expect(() => SettingScope.of('Global')).toThrow('Invalid SettingScope');
  });

  it('covers setting metadata helpers', () => {
    expect(SettingValueType.getAll()).toEqual([
      SettingValueType.String,
      SettingValueType.Number,
      SettingValueType.Boolean,
      SettingValueType.Password,
      SettingValueType.Json,
      SettingValueType.Array,
      SettingValueType.Object,
    ]);
    expect(SettingValueType.of('Json')).toBe(SettingValueType.Json);
    expect(SettingValueType.isValid('Object')).toBe(true);
    expect(SettingValueType.isValid('Map')).toBe(false);
    expect(SettingValueType.isPrimitive(SettingValueType.String)).toBe(true);
    expect(SettingValueType.isPrimitive(SettingValueType.Array)).toBe(false);
    expect(SettingValueType.isComplex(SettingValueType.Object)).toBe(true);
    expect(SettingValueType.isComplex(SettingValueType.Boolean)).toBe(false);
    expect(SettingValueType.isSensitive(SettingValueType.Password)).toBe(true);
    expect(SettingValueType.isSensitive(SettingValueType.String)).toBe(false);
    expect(() => SettingValueType.of('Map')).toThrow('Invalid SettingValueType');

    expect(OperatorType.getAll()).toEqual([
      OperatorType.User,
      OperatorType.System,
      OperatorType.Api,
    ]);
    expect(OperatorType.of('Api')).toBe(OperatorType.Api);
    expect(OperatorType.isValid('User')).toBe(true);
    expect(OperatorType.isValid('Robot')).toBe(false);
    expect(OperatorType.isUser(OperatorType.User)).toBe(true);
    expect(OperatorType.isSystem(OperatorType.System)).toBe(true);
    expect(OperatorType.isApi(OperatorType.Api)).toBe(true);
    expect(OperatorType.isAutomatic(OperatorType.System)).toBe(true);
    expect(OperatorType.isAutomatic(OperatorType.User)).toBe(false);
    expect(() => OperatorType.of('Robot')).toThrow('Invalid OperatorType');

    expect(SettingCategory.getAll()).toEqual([
      SettingCategory.Appearance,
      SettingCategory.Editor,
      SettingCategory.Task,
      SettingCategory.Goal,
      SettingCategory.Repository,
      SettingCategory.Notification,
      SettingCategory.System,
      SettingCategory.Privacy,
    ]);
    expect(SettingCategory.of('Task')).toBe(SettingCategory.Task);
    expect(SettingCategory.isValid('Privacy')).toBe(true);
    expect(SettingCategory.isValid('Audio')).toBe(false);
    expect(SettingCategory.isAppearance(SettingCategory.Appearance)).toBe(true);
    expect(SettingCategory.isEditor(SettingCategory.Editor)).toBe(true);
    expect(SettingCategory.isFeature(SettingCategory.Notification)).toBe(true);
    expect(SettingCategory.isFeature(SettingCategory.System)).toBe(false);
    expect(SettingCategory.isSecurity(SettingCategory.Privacy)).toBe(true);
    expect(SettingCategory.isSecurity(SettingCategory.Goal)).toBe(false);
    expect(() => SettingCategory.of('Audio')).toThrow('Invalid SettingCategory');
  });

  it('covers presentation helpers', () => {
    expect(TimeFormat.getAll()).toEqual([TimeFormat.H12, TimeFormat.H24]);
    expect(TimeFormat.of('H24')).toBe(TimeFormat.H24);
    expect(TimeFormat.isValid('H12')).toBe(true);
    expect(TimeFormat.isValid('ISO')).toBe(false);
    expect(TimeFormat.is12Hour(TimeFormat.H12)).toBe(true);
    expect(TimeFormat.is24Hour(TimeFormat.H24)).toBe(true);
    expect(() => TimeFormat.of('ISO')).toThrow('Invalid TimeFormat');

    expect(ProfileVisibility.getAll()).toEqual([
      ProfileVisibility.Public,
      ProfileVisibility.Private,
      ProfileVisibility.FriendsOnly,
    ]);
    expect(ProfileVisibility.of('FriendsOnly')).toBe(ProfileVisibility.FriendsOnly);
    expect(ProfileVisibility.isValid('Private')).toBe(true);
    expect(ProfileVisibility.isValid('Team')).toBe(false);
    expect(ProfileVisibility.isPublic(ProfileVisibility.Public)).toBe(true);
    expect(ProfileVisibility.isPrivate(ProfileVisibility.Private)).toBe(true);
    expect(ProfileVisibility.isFriendsOnly(ProfileVisibility.FriendsOnly)).toBe(true);
    expect(ProfileVisibility.isRestricted(ProfileVisibility.Private)).toBe(true);
    expect(ProfileVisibility.isRestricted(ProfileVisibility.Public)).toBe(false);
    expect(() => ProfileVisibility.of('Team')).toThrow('Invalid ProfileVisibility');

    expect(GoalViewType.getAll()).toEqual([
      GoalViewType.List,
      GoalViewType.Tree,
      GoalViewType.Timeline,
    ]);
    expect(GoalViewType.of('Timeline')).toBe(GoalViewType.Timeline);
    expect(GoalViewType.isValid('Tree')).toBe(true);
    expect(GoalViewType.isValid('Board')).toBe(false);
    expect(GoalViewType.isList(GoalViewType.List)).toBe(true);
    expect(GoalViewType.isTree(GoalViewType.Tree)).toBe(true);
    expect(GoalViewType.isTimeline(GoalViewType.Timeline)).toBe(true);
    expect(() => GoalViewType.of('Board')).toThrow('Invalid GoalViewType');

    expect(ScheduleViewType.getAll()).toEqual([
      ScheduleViewType.Day,
      ScheduleViewType.Week,
      ScheduleViewType.Month,
    ]);
    expect(ScheduleViewType.of('Week')).toBe(ScheduleViewType.Week);
    expect(ScheduleViewType.isValid('Month')).toBe(true);
    expect(ScheduleViewType.isValid('Agenda')).toBe(false);
    expect(ScheduleViewType.isDay(ScheduleViewType.Day)).toBe(true);
    expect(ScheduleViewType.isWeek(ScheduleViewType.Week)).toBe(true);
    expect(ScheduleViewType.isMonth(ScheduleViewType.Month)).toBe(true);
    expect(() => ScheduleViewType.of('Agenda')).toThrow('Invalid ScheduleViewType');

    expect(TaskViewType.getAll()).toEqual([
      TaskViewType.List,
      TaskViewType.Kanban,
      TaskViewType.Calendar,
    ]);
    expect(TaskViewType.of('Calendar')).toBe(TaskViewType.Calendar);
    expect(TaskViewType.isValid('Kanban')).toBe(true);
    expect(TaskViewType.isValid('Table')).toBe(false);
    expect(TaskViewType.isList(TaskViewType.List)).toBe(true);
    expect(TaskViewType.isKanban(TaskViewType.Kanban)).toBe(true);
    expect(TaskViewType.isCalendar(TaskViewType.Calendar)).toBe(true);
    expect(() => TaskViewType.of('Table')).toThrow('Invalid TaskViewType');

    expect(UIInputType.getAll()).toEqual([
      UIInputType.Text,
      UIInputType.Number,
      UIInputType.Switch,
      UIInputType.Select,
      UIInputType.Radio,
      UIInputType.Checkbox,
      UIInputType.Slider,
      UIInputType.Color,
      UIInputType.File,
    ]);
    expect(UIInputType.of('Slider')).toBe(UIInputType.Slider);
    expect(UIInputType.isValid('Text')).toBe(true);
    expect(UIInputType.isValid('Textarea')).toBe(false);
    expect(UIInputType.isSelection(UIInputType.Select)).toBe(true);
    expect(UIInputType.isSelection(UIInputType.Text)).toBe(false);
    expect(UIInputType.isTextInput(UIInputType.Color)).toBe(true);
    expect(UIInputType.isTextInput(UIInputType.Switch)).toBe(false);
    expect(UIInputType.isToggle(UIInputType.Switch)).toBe(true);
    expect(UIInputType.isSlider(UIInputType.Slider)).toBe(true);
    expect(UIInputType.isFile(UIInputType.File)).toBe(true);
    expect(() => UIInputType.of('Textarea')).toThrow('Invalid UIInputType');
  });
});
