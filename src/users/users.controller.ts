import { Controller, Get, UseGuards, Request, Res, Req } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('api/v1/user')
export class UserController {
  constructor(private readonly userService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req) {
    const { password, ...result } = await this.userService.user({
      id: req.user.id,
    });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('isLoggedIn')
  isLoggedIn(@Req() req, @Res() res) {
    return res.send(true);
  }
}
