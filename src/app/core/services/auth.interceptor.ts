import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);

  const accessToken = tokenService.getAccessToken();

  let clonedRequest = req;
  if (accessToken) {
    clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  return next(clonedRequest).pipe(
    catchError((error) => {
      // Handle 401 Unauthorized globally
      if (error.status === 401) {
        const refreshToken = tokenService.getRefreshToken();

        // If we have a refresh token and this isn't a refresh token request itself
        if (refreshToken && !req.url.includes('refresh-token')) {
          return authService.refreshToken(refreshToken).pipe(
            switchMap((response) => {
              // Retry the original request with new token
              const newRequest = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.data.accessToken}`,
                },
              });
              return next(newRequest);
            }),
            catchError((refreshError) => {
              authService.logout();
              return throwError(() => refreshError);
            }),
          );
        } else {
          // If no refresh token or refresh failed, just logout
          authService.logout();
        }
      }
      return throwError(() => error);
    }),
  );
};
