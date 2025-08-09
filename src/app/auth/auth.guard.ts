import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(public authService:AuthService,public router:Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    let isAuth = this.authService.getIsAuth();
    console.log('🔒 AuthGuard - isAuthenticated:', isAuth);
    console.log('🔒 AuthGuard - trying to access:', state.url);
    
    if (!isAuth) {
      console.log('🔒 AuthGuard - Not authenticated, redirecting to welcome');
      this.router.navigate(['welcome']);
      return false;
    }
    
    console.log('🔒 AuthGuard - Access granted');
    return true;
  }
}
