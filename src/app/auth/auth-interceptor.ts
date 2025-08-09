import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = this.authService.getToken(); // just a string or null

    // Debug logging for CREATE_EXPENSE requests
    if (req.url.includes('CREATE_EXPENSE')) {
      console.log('🔍 Auth Interceptor - CREATE_EXPENSE Request:');
      console.log('  URL:', req.url);
      console.log('  Token exists:', !!token);
      console.log('  Token preview:', token ? `${token.substring(0, 20)}...` : 'null');
    }

    let authReq = req;
    if (token) {
      authReq = req.clone({
        headers: req.headers.set('Authorization', 'Bearer ' + token),
      });
      
      if (req.url.includes('CREATE_EXPENSE')) {
        console.log('  Authorization header added:', `Bearer ${token.substring(0, 20)}...`);
      }
    } else if (req.url.includes('CREATE_EXPENSE')) {
      console.log('  ❌ No token available - request will fail');
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // JWT token expired or invalid
          console.log('🔒 JWT Token expired - redirecting to login');
          
          // Show user-friendly message
          this.snackBar.open('Your session has expired. Please log in again.', 'Close', {
            duration: 4000,
            panelClass: ['warning-snackbar']
          });
          
          // Clear expired token and redirect to login
          this.authService.onLogout();
          
          return throwError(() => error);
        }
        
        return throwError(() => error);
      })
    );
  }
}
