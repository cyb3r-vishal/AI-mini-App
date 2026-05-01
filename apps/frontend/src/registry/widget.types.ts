import type { ComponentType } from 'react';
import type { AppConfig, Widget, WidgetType } from '@ai-gen/shared';

export interface WidgetRendererProps<TWidget extends Widget = Widget> {
  widget: TWidget;
  config: AppConfig;
  /** App id — required by data widgets (metric / list / chart) so they can
   *  hit the records API. Undefined in standalone previews. */
  appId?: string;
}

export type WidgetRenderer<TWidget extends Widget = Widget> = ComponentType<
  WidgetRendererProps<TWidget>
>;

// eslint-disable-next-line @typescript-eslint/ban-types
export type WidgetKey = WidgetType | (string & {});
