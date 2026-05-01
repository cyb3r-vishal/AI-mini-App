/**
 * Shared TypeScript types.
 *
 * NOTE: Concrete type bodies are intentionally left as placeholders.
 * Business logic (app config schema, runtime model, etc.) will be added later.
 */

// Re-export inferred types from schemas for convenience.
export type {
  AppConfig,
  AppConfigInput,
  Theme,
  ThemeMode,
  AuthSettings,
  AuthProvider,
  Entity,
  Field,
  FieldType,
  SelectOption,
  Page,
  PageType,
  FormPage,
  TablePage,
  DashboardPage,
  Widget,
  WidgetType,
  NormalizeIssue,
  NormalizeResult,
} from '../schemas/app-config/index.js';
export type { ApiError, ApiSuccess, ApiResponse } from '../schemas/api.schema.js';
export type {
  RegisterInput,
  LoginInput,
  PublicUser,
  AuthTokens,
  AuthResponse,
} from '../schemas/auth.schema.js';
export type {
  CreateAppInput,
  UpdateAppInput,
  PublishAppConfigInput,
  PublicApp,
  ListRecordsQuery,
} from '../schemas/app.schema.js';
export type {
  ImportPreview,
  ImportCommitInput,
  ImportRowError,
  ImportCommitResult,
} from '../schemas/import.schema.js';
export type {
  Notification,
  NotificationType,
  NotificationListQuery,
  NotificationListResult,
  MarkReadInput,
} from '../schemas/notification.schema.js';
