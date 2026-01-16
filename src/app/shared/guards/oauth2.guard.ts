import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import {UserService} from '../../modulos/Seguridad/services/user.service';
import { JwtHelperService } from '@auth0/angular-jwt';


@Injectable({
  providedIn: 'root'
})
export class Oauth2Guard implements CanActivate {

  constructor(private jwtHelper: JwtHelperService, private userService: UserService) { }
  canActivate() {
    const token = localStorage.getItem("jwt");
   if (token && !this.jwtHelper.isTokenExpired(token)){
      return true;
    } else {
      this.userService.logout();
      return false;
    }
  }
}
