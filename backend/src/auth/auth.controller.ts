import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";

import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { MeDto } from "./dto/me.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { TokenResponseDto } from "./dto/token-response.dto";
import type { AuthedRequest } from "./supabase-auth.guard";
import { SupabaseAuthGuard } from "./supabase-auth.guard";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: TokenResponseDto })
  login(@Body() dto: LoginDto): Promise<TokenResponseDto> {
    return this.auth.login(dto);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: TokenResponseDto })
  refresh(@Body() dto: RefreshDto): Promise<TokenResponseDto> {
    return this.auth.refresh(dto);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.auth.logout(dto);
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOkResponse({ type: MeDto })
  @UseGuards(SupabaseAuthGuard)
  me(@Req() req: AuthedRequest): Promise<MeDto> {
    return this.auth.me(req.user.sub);
  }
}
