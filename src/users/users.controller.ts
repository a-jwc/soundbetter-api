import {
  Controller,
  Get,
  UseGuards,
  Res,
  Req,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  Body,
  Put,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { SoundsService } from 'src/sounds/sounds.service';
import { hashPassword } from 'src/helpers/auth';
import { createFileName } from 'src/utils/fileUtils';

@Controller('api/v1/user')
export class UserController {
  constructor(
    private readonly userService: UsersService,
    private readonly soundsService: SoundsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req) {
    const { password, ...result } = await this.userService.user({
      id: req.user.id,
    });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('likes')
  async getLikes(@Req() req) {
    const result = await this.userService.getUserLikesSoundObject({
      id: req.user.id,
    });
    return result.likes;
  }

  @UseGuards(JwtAuthGuard)
  @Get('is-logged-in')
  isLoggedIn(@Req() req, @Res() res) {
    return res.send(true);
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-avatar')
  @UseInterceptors(FileInterceptor('file'))
  async updateAvatar(@Req() req, @UploadedFile() file: Express.Multer.File) {
    const filename = createFileName(file);
    const avatar = await this.userService.updateUserAvatar(
      {
        where: { id: req.user.id },
        data: { avatar: filename },
      },
      file,
    );
    return avatar;
  }

  @UseGuards(JwtAuthGuard)
  @Get('get-avatar')
  async getAvatar(@Req() req, @Res() res: Response) {
    const { avatar } = await this.userService.user({
      id: req.user.id,
    });
    if (avatar === null) return res.sendStatus(HttpStatus.NOT_FOUND);
    return await this.userService.getUserAvatar(avatar, res);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update-user')
  async updateUserInfo(
    @Req() req,
    @Res() res: Response,
    @Body() data: Prisma.UserUpdateInput,
  ) {
    await this.userService.updateUser({
      where: { id: req.user.id },
      data,
    });
    if (data.username) {
      const updateUserSounds: Prisma.SoundUpdateManyWithoutAuthorInput = {
        updateMany: { where: {}, data: { authorName: data.username } },
      };
      await this.userService.updateUser({
        where: { id: req.user.id },
        data: { sounds: updateUserSounds },
      });
    }
    if (data.password) {
      const hashedPassword = await hashPassword(data.password as string);
      await this.userService.updateUser({
        where: { id: req.user.id },
        data: { password: hashedPassword },
      });
    }

    return res.sendStatus(HttpStatus.OK);
  }
}
