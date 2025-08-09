import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { CapacitorHttp } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';

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
  ) {
    // Log API URL for debugging
    console.log('🔧 AuthService initialized with API URL:', this.apiUrl);
    console.log('🔧 Environment production mode:', environment.production);
    console.log('🔧 Platform:', Capacitor.getPlatform());
    console.log('🔧 Is native platform:', Capacitor.isNativePlatform());
  }

  // Enhanced HTTP request method that works on both web and mobile
  private async makeHttpRequest(method: 'GET' | 'POST' | 'DELETE', url: string, data?: any): Promise<any> {
    const fullUrl = url.startsWith('http') ? url : this.apiUrl + url;
    
    console.log(`🌐 Making ${method} request to:`, fullUrl);
    console.log('🌐 Platform:', Capacitor.getPlatform());
    console.log('🌐 Is native platform:', Capacitor.isNativePlatform());
    
    if (data) {
      console.log('🌐 Request data:', JSON.stringify(data, null, 2));
    }
    
    if (Capacitor.isNativePlatform()) {
      // Use native HTTP for mobile
      console.log('📱 Using native HTTP (CapacitorHttp)');
      
      const options: any = {
        url: fullUrl,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        connectTimeout: 60000, // 60 seconds
        readTimeout: 60000     // 60 seconds
      };

      // Add authorization header if token exists
      const token = this.getToken();
      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }

      // Add body for POST requests
      if (method === 'POST' && data) {
        options.data = data;
      }
      
      console.log('📱 Native HTTP options:', JSON.stringify(options, null, 2));

      try {
        const response = await CapacitorHttp.request(options);
        console.log('✅ Native HTTP full response:', response);
        console.log('✅ Native HTTP response data:', response.data);
        console.log('✅ Native HTTP response status:', response.status);
        console.log('✅ Native HTTP response headers:', response.headers);
        
        // CapacitorHttp returns response in .data property
        // If the response.data is a string, parse it as JSON
        let responseData = response.data;
        if (typeof responseData === 'string') {
          try {
            responseData = JSON.parse(responseData);
            console.log('✅ Parsed JSON response:', responseData);
          } catch (parseError) {
            console.error('❌ Failed to parse response as JSON:', parseError);
            console.error('Raw response data:', responseData);
          }
        }
        
        return responseData;
      } catch (error) {
        console.error('❌ Native HTTP error:', error);
        throw error;
      }
    } else {
      // Use Angular HttpClient for web
      console.log('🌐 Using Angular HttpClient (web)');
      
      const options: any = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      if (method === 'GET') {
        return this.http.get(fullUrl, options).toPromise();
      } else if (method === 'POST') {
        return this.http.post(fullUrl, data, options).toPromise();
      } else if (method === 'DELETE') {
        return this.http.delete(fullUrl, options).toPromise();
      }
    }
  }

  // Test basic connectivity first
  async testBasicConnectivity(): Promise<boolean> {
    try {
      console.log('🧪 Testing basic connectivity...');
      
      // Test both deployed server and local server
      const testUrls = [
        'https://expense-tracker-t3cs.onrender.com',
        'http://192.168.0.105:3000'
      ];
      
      for (const testUrl of testUrls) {
        try {
          console.log(`🌐 Testing connectivity to: ${testUrl}`);
          
          if (Capacitor.isNativePlatform()) {
            const response = await CapacitorHttp.request({
              url: testUrl,
              method: 'GET',
              connectTimeout: 15000,
              readTimeout: 15000
            });
            console.log(`✅ Connectivity test to ${testUrl} - Status:`, response.status);
            
            if (response.status >= 200 && response.status < 400) {
              console.log(`✅ Successfully connected to: ${testUrl}`);
              return true;
            }
          } else {
            // Web test
            const response = await fetch(testUrl);
            console.log(`✅ Web connectivity test to ${testUrl} - Status:`, response.status);
            if (response.ok) {
              return true;
            }
          }
        } catch (error) {
          console.error(`❌ Failed to connect to ${testUrl}:`, error);
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ All connectivity tests failed:', error);
      return false;
    }
  }



  authAfterReferesh(isAuth: boolean, token: string) {
    this.isAuth = isAuth;
    this.token = token;
  }

  getToken() {
    // If token is in memory, return it
    if (this.token) {
      return this.token;
    }
    
    // If not in memory, try to get from localStorage
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      this.token = storedToken; // Store in memory for future use
      return storedToken;
    }
    
    return null;
  } 

  getIsAuth() {
    console.log('🔍 getIsAuth - in-memory isAuth:', this.isAuth);
    
    // First check in-memory auth state
    if (this.isAuth) {
      console.log('🔍 getIsAuth - returning true (in-memory)');
      return true;
    }
    
    // If not authenticated in memory, check localStorage for valid token
    const token = localStorage.getItem('token') || localStorage.getItem('LEAD_ID');
    const userId = localStorage.getItem('Id');
    
    console.log('🔍 getIsAuth - localStorage check:');
    console.log('  token:', token ? 'exists' : 'null');
    console.log('  userId:', userId ? 'exists' : 'null');
    
    if (token && userId) {
      console.log('🔍 getIsAuth - restoring auth from localStorage');
      // Restore authentication state from localStorage
      this.token = token;
      this.userId = userId;
      this.isAuth = true;
      this.emailAddress = localStorage.getItem('user_email') || '';
      return true;
    }
    
    console.log('🔍 getIsAuth - returning false (not authenticated)');
    return false;
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

  async onSignUp(values: any): Promise<any> {
    try {
      console.log('🔧 SIGNUP - Starting signup process...');
      
      const body = {
        name: values.name,
        username: values.username,
        gmail: values.gmail,
        password: values.password,
        pin: values.pin,
        role: values.role,
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

      console.log('🔧 SIGNUP - Request body prepared');

      const res = await this.makeHttpRequest('POST', 'USER/SIGN_UP', body);
      console.log('🔧 SIGNUP - FULL RESPONSE DEBUG:', JSON.stringify(res, null, 2));
      console.log('🔧 SIGNUP - Response type:', typeof res);
      console.log('🔧 SIGNUP - Response structure check:');
      console.log('  - Has data property:', !!(res && res.data));
      console.log('  - Has token directly:', !!(res && res.token));
      console.log('  - Has success property:', !!(res && res.success));
      console.log('  - Has message property:', !!(res && res.message));
      console.log('  - Has msg property:', !!(res && res.msg));
      console.log('  - Has error property:', !!(res && res.error));
      
      // Check if this is an error response
      if (res && (res.error || res.msg)) {
        console.error('❌ SIGNUP - Server returned error response:', res);
        const errorMessage = res.error || res.msg || 'Unknown server error';
        throw new Error(`Server Error: ${errorMessage}`);
      }
      
      // Temporary: Accept any response format and extract data
      let responseData = null;
      let token = null;
      
      if (res) {
        // Try different response formats
        if (res.data && res.data.token) {
          // Format: { data: { token: "...", userId: "..." } }
          responseData = res.data;
          token = res.data.token;
          console.log('✅ SIGNUP - Using wrapped format (res.data)');
        } else if (res.token) {
          // Format: { token: "...", userId: "..." }
          responseData = res;
          token = res.token;
          console.log('✅ SIGNUP - Using direct format (res)');
        } else {
          console.error('❌ SIGNUP - No token found in any format');
          console.error('Available properties:', Object.keys(res));
          console.error('Full response for debugging:', JSON.stringify(res, null, 2));
          throw new Error(`No token found in response. Available properties: ${Object.keys(res).join(', ')}. Response: ${JSON.stringify(res)}`);
        }
        
        this._snackBar.open('Msquare Portal Account Created Successfully', '', {
          duration: 4000,
        });

        this.token = token;
        this.userId = responseData.userId;
        this.setEmail(values.gmail);
        this.isAuth = true;

        const userMeta = {
          firstLoginDate: responseData.UserSince || new Date(),
          username: responseData.username || values.username,
          name: responseData.name || values.name,
          lastLoginDate: responseData.UserSince || new Date(),
          userId: responseData.userId,
          expenseLogged: 0,
          role: responseData.role || values.role,
        };

        this.saveAllData(userMeta);
        this.saveAuthDataonLocalStorage(responseData.expiredToken || 3600, responseData.userId);

        if (responseData.expiredToken) {
          this.expireTokenTime = setTimeout(() => {
            this.onLogout();
          }, responseData.expiredToken * 1000);
        }

        return responseData.role || values.role;
      } else {
        console.error('❌ SIGNUP - No response received at all');
        throw new Error('No response from server');
      }
    } catch (error: any) {
      console.error('❌ SIGNUP - Error details:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        url: error.url,
        error: error.error || error,
        fullError: error
      });
      
      let errorMessage = 'Signup failed: ';
      if (error.status === 0 || !error.status) {
        errorMessage += 'Network error - check connection and URL';
      } else if (error.message && error.message.includes('token')) {
        errorMessage += 'Server response error - please try again';
      } else if (error.error?.message) {
        errorMessage += error.error.message;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += `HTTP ${error.status} - ${error.statusText}`;
      }
      
      this._snackBar.open(errorMessage, '', {
        duration: 8000,
      });
      this.isAuth = false;
      throw error;
    }
  }

  async onLogin(body: any): Promise<any> {
    try {
      console.log('🔗 Attempting login...');
      
      const res = await this.makeHttpRequest('POST', 'USER/LOGIN', body);
      console.log('✅ Login response received:', res);
          
          const accountStatus = res?.data?.accountStatus || 'approved';

          if (accountStatus !== 'approved') {
            const statusMsg =
              accountStatus === 'pending'
                ? 'Your account is pending admin approval.'
                : 'Your account has been rejected. Please contact admin.';
            this._snackBar.open(statusMsg, '', { duration: 4000 });
            this.isAuth = false;
            throw new Error(statusMsg);
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

          return res.data;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      // Better error handling for network issues
      let errorMessage = 'Login failed';
      if (error.status === 0 || !error.status) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      this._snackBar.open(errorMessage, '', {
        duration: 5000,
      });
      this.isAuth = false;
      throw error;
    }
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

  // OTP-based login methods
  sendOtpForLogin(email: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.http.post(this.apiUrl + 'USER/SEND_OTP', { gmail: email }).subscribe(
        (res: any) => {
          this._snackBar.open(res.message || 'OTP sent successfully', '', {
            duration: 3000,
          });
          resolve(res);
        },
        (error) => {
          console.error('Send OTP error:', error);
          this._snackBar.open(error?.error?.message || 'Failed to send OTP', '', {
            duration: 4000,
          });
          reject(error);
        }
      );
    });
  }

  async verifyPasswordAndSendOtp(email: string, password: string): Promise<any> {
    try {
      console.log('🔧 LOGIN - Starting password verification and OTP send...');
      console.log('🔧 LOGIN - Email:', email);
      
      const body = {
        gmail: email, 
        password: password 
      };

      const res = await this.makeHttpRequest('POST', 'USER/VERIFY_PASSWORD_AND_SEND_OTP', body);
      console.log('✅ LOGIN - Password verified, OTP sent:', res);
      
      this._snackBar.open(res.message || 'Password verified, OTP sent', '', {
        duration: 3000,
      });
      
      return res;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      // Better error handling for network issues
      let errorMessage = 'Invalid credentials';
      if (error.status === 0 || !error.status) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      this._snackBar.open(errorMessage, '', {
        duration: 4000,
      });
      
      throw error;
    }
  }

  async verifyOtpAndLogin(email: string, otp: string): Promise<any> {
    try {
      console.log('🔧 OTP_LOGIN - Starting OTP verification...');
      console.log('🔧 OTP_LOGIN - Email:', email);
      console.log('🔧 OTP_LOGIN - OTP:', otp);
      
      const body = { gmail: email, otp };
      
      const res = await this.makeHttpRequest('POST', 'USER/VERIFY_OTP_LOGIN', body);
      console.log('✅ OTP_LOGIN - OTP verified successfully:', res);
      
      const accountStatus = res?.data?.accountStatus || 'approved';

      if (accountStatus !== 'approved') {
        const statusMsg =
          accountStatus === 'pending'
            ? 'Your account is pending admin approval.'
            : 'Your account has been rejected. Please contact admin.';
        this._snackBar.open(statusMsg, '', { duration: 4000 });
        this.isAuth = false;
        throw new Error(statusMsg);
      }

      this._snackBar.open(res.message || 'Login successful!', '', { duration: 3000 });

      this.token = res.data.token;
      this.userId = res.data.userId;
      this.isAuth = true;

      this.setEmail(res.data.gmail);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('status', res.data.accountStatus);
      localStorage.setItem('Id', res.data.userId);

      this.expireTokenTime = setTimeout(() => {
        this.onLogout();
      }, res.data.expiredToken * 1000);

      this.saveAuthDataonLocalStorage(res.data.expiredToken, res.data.userId);

      this.updateUserData(res.data.userId, {
        lastLoginDate: res.data.latestLoginDate,
      });

      return res.data;
    } catch (error: any) {
      console.error('❌ OTP verification error:', error);
      
      let errorMessage = 'OTP verification failed';
      if (error.status === 0 || !error.status) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      this._snackBar.open(errorMessage, '', {
        duration: 4000,
      });
      this.isAuth = false;
      throw error;
    }
  }
}
