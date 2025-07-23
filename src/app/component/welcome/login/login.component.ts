import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  LoginContinue = false;
  role: 'admin' | 'employee' = 'employee'; // Default role
  msg = '';
  
  // 3-step login properties
  isPasswordVerified = false;
  isOtpSent = false;
  userEmail = '';
  otpTimer = 0;
  otpTimerInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private snackbar:MatSnackBar
  ) {}
  @Output() switchToSignup = new EventEmitter<void>();

  ngOnInit(): void {
    // Get role from query param (?role=admin)
    this.route.queryParams.subscribe((params) => {
      const r = params['role'];
      this.role = r === 'admin' ? 'admin' : 'employee';
    });

    // Setup form for 3-step login: Email → Password → OTP
    this.loginForm = new FormGroup({
      gmail: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
      otp: new FormControl('', [
        Validators.required,
        Validators.pattern('^[0-9]{6}$'),
      ]),
    });
  }

  onVerifyPassword() {
    const gmail = this.loginForm.get('gmail')?.value;
    const password = this.loginForm.get('password')?.value;

    if (!gmail || this.loginForm.get('gmail')?.invalid) {
      this.snackbar.open('Please enter a valid email address.', 'Close', { duration: 3000 });
      this.loginForm.get('gmail')?.markAsTouched();
      return;
    }

    if (!password || this.loginForm.get('password')?.invalid) {
      this.snackbar.open('Please enter your password.', 'Close', { duration: 3000 });
      this.loginForm.get('password')?.markAsTouched();
      return;
    }

    this.LoginContinue = true;
    this.msg = 'Verifying credentials...';

    // Use the new verify password and send OTP method
    this.authService.verifyPasswordAndSendOtp(gmail, password)
      .then((res: any) => {
        this.LoginContinue = false;
        this.isPasswordVerified = true;
        this.isOtpSent = true;
        this.userEmail = gmail;
        this.startOtpTimer();
        
        // Show development OTP if available
        if (res.developmentMode && res.otp) {
          this.loginForm.patchValue({ otp: res.otp });
          this.snackbar.open(`Development Mode: OTP is ${res.otp}`, 'Close', { duration: 10000 });
        } else {
          this.snackbar.open('Password verified! OTP sent to your email.', 'Close', { duration: 3000 });
        }
      })
      .catch((error) => {
        this.LoginContinue = false;
        console.error('Password verification error:', error);
      });
  }

  onVerifyOtp() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const otp = this.loginForm.get('otp')?.value;

    this.LoginContinue = true;
    this.msg = 'Verifying OTP...';

    this.authService.verifyOtpAndLogin(this.userEmail, otp)
      .then((res: any) => {
        this.LoginContinue = false;
        this.clearOtpTimer();

        const { role } = res;

        if (role === 'admin') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/emp-dashboard']);
        }
      })
      .catch((error) => {
        this.LoginContinue = false;
        console.error('OTP verification error:', error);
      });
  }

  resendOtp() {
    this.clearOtpTimer();
    this.onVerifyPassword();
  }

  resetLogin() {
    this.isPasswordVerified = false;
    this.isOtpSent = false;
    this.userEmail = '';
    this.clearOtpTimer();
    this.loginForm.reset();
  }

  startOtpTimer() {
    this.otpTimer = 300; // 5 minutes
    this.otpTimerInterval = setInterval(() => {
      this.otpTimer--;
      if (this.otpTimer <= 0) {
        this.clearOtpTimer();
      }
    }, 1000);
  }

  clearOtpTimer() {
    if (this.otpTimerInterval) {
      clearInterval(this.otpTimerInterval);
      this.otpTimerInterval = null;
    }
    this.otpTimer = 0;
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  ngOnDestroy() {
    this.clearOtpTimer();
  }


}