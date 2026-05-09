/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';
import { AuditLogService } from './services/AuditLogService';
import { AuthService } from './services/AuthService';
import { CommitmentsService } from './services/CommitmentsService';
import { HealthService } from './services/HealthService';
import { MeetingsService } from './services/MeetingsService';
import { MinutesService } from './services/MinutesService';
import { ReportsService } from './services/ReportsService';
import { SignaturesService } from './services/SignaturesService';
import { UsersService } from './services/UsersService';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export class ApiClient {
  public readonly auditLog: AuditLogService;
  public readonly auth: AuthService;
  public readonly commitments: CommitmentsService;
  public readonly health: HealthService;
  public readonly meetings: MeetingsService;
  public readonly minutes: MinutesService;
  public readonly reports: ReportsService;
  public readonly signatures: SignaturesService;
  public readonly users: UsersService;
  public readonly request: BaseHttpRequest;
  constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = FetchHttpRequest) {
    this.request = new HttpRequest({
      BASE: config?.BASE ?? '',
      VERSION: config?.VERSION ?? '0.1.0',
      WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
      CREDENTIALS: config?.CREDENTIALS ?? 'include',
      TOKEN: config?.TOKEN,
      USERNAME: config?.USERNAME,
      PASSWORD: config?.PASSWORD,
      HEADERS: config?.HEADERS,
      ENCODE_PATH: config?.ENCODE_PATH,
    });
    this.auditLog = new AuditLogService(this.request);
    this.auth = new AuthService(this.request);
    this.commitments = new CommitmentsService(this.request);
    this.health = new HealthService(this.request);
    this.meetings = new MeetingsService(this.request);
    this.minutes = new MinutesService(this.request);
    this.reports = new ReportsService(this.request);
    this.signatures = new SignaturesService(this.request);
    this.users = new UsersService(this.request);
  }
}

