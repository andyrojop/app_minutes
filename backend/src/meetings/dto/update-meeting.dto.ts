import { IsIn, IsOptional, IsString } from "class-validator";

const MEETING_STATUSES = ["SCHEDULED", "ONGOING", "FINISHED", "CANCELLED"] as const;

export class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  agenda?: string | null;

  @IsOptional()
  @IsString()
  location?: string | null;

  @IsOptional()
  @IsString()
  scheduled_at?: string | null;

  @IsOptional()
  @IsIn([...MEETING_STATUSES])
  status?: (typeof MEETING_STATUSES)[number];
}
