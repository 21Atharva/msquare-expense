import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private isAuth: boolean = false;
  private token!: string;
  private expireTokenTime: any;
  private userId: string = '';
  private emailAddress: string = '';

  constructor(
    public http: HttpClient,
    public _snackBar: MatSnackBar,
    public route: Router
  ) {}

  authAfterReferesh(isAuth: boolean, token: string) {
    this.isAuth = isAuth;
    this.token = token;
  }

  getToken() {
    return this.token;
  }

  getIsAuth() {
    return this.isAuth;
  }

  getUSerId() {
    return this.userId;
  }

  getEmail() {
    return this.emailAddress;
  }

  setEmail(gmail: string) {
    localStorage.setItem('user_email', gmail);
    this.emailAddress = gmail;
  }

  onSignUp(values: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const body = {
        name: values.name,
        username: values.username,
        gmail: values.gmail,
        password: values.password,
        pin: values.pin,
        role: values.role,
          department: values.department,
        userFirstSignUp: new Date(),
        category: [
          'Travelling',
          'Conveyance',
          'Food allowance',
          'Printing and Stationary',
          'Medical Exp',
          'Laundry',
          'Lodging Exp',
        ],
      };

      this.http.post(this.apiUrl + 'USER/SIGN_UP', body).subscribe(
        (res: any) => {
          this._snackBar.open('Msquare Portal Account Created Successfully', '', {
            duration: 4000,
          });

          this.token = res.data.token;
          this.userId = res.data.userId;
          this.setEmail(values.gmail);
          this.isAuth = true;

          const userMeta = {
            firstLoginDate: res.data.UserSince,
            username: res.data.username,
            name: res.data.name,
            lastLoginDate: res.data.UserSince,
            userId: res.data.userId,
            expenseLogged: 0,
            role: res.data.role,
          };

          this.saveAllData(userMeta);
          this.saveAuthDataonLocalStorage(res.data.expiredToken, res.data.userId);

          this.expireTokenTime = setTimeout(() => {
            this.onLogout();
          }, res.data.expiredToken * 1000);

          resolve(res.data.role);
        },
        (error) => {
          this._snackBar.open('Email Already Exists! Please Login.', '', {
            duration: 5000,
          });
          this.isAuth = false;
          reject(error);
        }
      );
    });
  }

  onLogin(body: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.http.post(this.apiUrl + 'USER/LOGIN', body).subscribe(
        (res: any) => {
          const accountStatus = res?.data?.accountStatus || 'approved';

          if (accountStatus !== 'approved') {
            const statusMsg =
              accountStatus === 'pending'
                ? 'Your account is pending admin approval.'
                : 'Your account has been rejected. Please contact admin.';
            this._snackBar.open(statusMsg, '', { duration: 4000 });
            this.isAuth = false;
            reject({ message: statusMsg });
            return;
          }

          this._snackBar.open(res.message, '', { duration: 3000 });

          this.token = res.data.token;
          this.userId = res.data.userId;
          this.isAuth = true;

          this.setEmail(res.data.gmail);
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('role', res.data.role);
          localStorage.setItem('status', res.data.status);
          localStorage.setItem('Id', res.data.userId); // ✅ Save ID directly

          this.expireTokenTime = setTimeout(() => {
            this.onLogout();
          }, res.data.expiredToken * 1000);

          this.saveAuthDataonLocalStorage(res.data.expiredToken, res.data.userId);

          this.updateUserData(res.data.userId, {
            lastLoginDate: res.data.latestLoginDate,
          });

          resolve(res.data);
        },
        (error) => {
          this._snackBar.open(error?.error?.message || 'Login failed', '', {
            duration: 3000,
          });
          this.isAuth = false;
          reject(error);
        }
      );
    });
  }

sendOtp(
  recipientEmail: string,
  senderCredentials: { email: string; password: string }
): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    const payload = {
      toEmail: recipientEmail,           // 📩 Who will receive the OTP
      email_user: senderCredentials.email,  // 📨 Gmail ID sending the OTP
      pass: senderCredentials.password      // 🔐 Gmail app password
    };

    this.http.post(`${this.apiUrl}USER/send-otp`, payload).subscribe(
      (res: any) => {
        this._snackBar.open(`✅ OTP sent successfully to ${recipientEmail}`, '', {
          duration: 3000,
        });
        resolve(res);
      },
      (error) => {
        const msg = error.error?.message || 'Unknown error';
        this._snackBar.open(`❌ Failed to send OTP: ${msg}`, '', {
          duration: 3000,
        });
        reject(error);
      }
    );
  });
}


  onLogout() {
    this.token = '';
    this.isAuth = false;
    clearTimeout(this.expireTokenTime);
    this.route.navigate(['welcome']);

    localStorage.removeItem('token');
    localStorage.removeItem('Id');
    localStorage.removeItem('role');
    localStorage.removeItem('status');
    localStorage.removeItem('user_email');
    localStorage.removeItem('LEAD_ID');
  }

  private saveAuthDataonLocalStorage(expiryTime: number, userId: string) {
    localStorage.setItem('LEAD_ID', this.token);
    localStorage.setItem('Id', userId);
    setTimeout(() => {
      this.onLogout();
    }, expiryTime * 1000);
  }

  updateUserData(id: string, body: any) {
    this.http.post(this.apiUrl + 'UPDATE_SAVE_DATA/' + id, body).subscribe();
  }

  saveAllData(body: any) {
    this.http.post(this.apiUrl + 'SAVE_DATA', body).subscribe();
  }

  deleteUserAccount() {
    const id = localStorage.getItem('Id');
    return this.http.delete(this.apiUrl + 'USER/DELETE_ACCOUNT/' + id);
  }

  onGetAppVersion() {
    return this.http.get(this.apiUrl + 'USER/APP_VERSION/');
  }

  private onCollectSource(body: any) {
    return this.http.post(this.apiUrl + 'USER/USER_SOURCE/', body);
  }

  saveSource(email: string, action: string, source: string) {
    const body = {
      email,
      source,
      action,
      createdAt: new Date(),
    };
    this.onCollectSource(body).subscribe(
      (res: any) => {
        console.log(res.message);
      },
      (error: any) => {
        console.error(error);
      }
    );
  }

  onProvideFeedback(body: any) {
    return this.http.post(this.apiUrl + 'USER/USER_FEEDBACK/', body);
  }

  onConfirmAccess(body: any) {
    return this.http.post(this.apiUrl + 'USER/CONFIRM_ACCESS/', body);
  }
}
