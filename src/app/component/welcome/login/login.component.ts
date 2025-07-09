import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  LoginContinue = false;
  role: 'admin' | 'employee' = 'employee'; // Default role
  msg = '';

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

    // Setup form
   this.loginForm = new FormGroup({
  gmail: new FormControl('', [Validators.required, Validators.email]),
  password: new FormControl('', [Validators.required]),
  pin: new FormControl('', [
    Validators.required,
    Validators.pattern('^[0-9]{4}$'),
  ]),
  otpSenderEmail: new FormControl('', [Validators.required, Validators.email]),  // 🔑
  otpSenderPassword: new FormControl('', [Validators.required]) // 🔑
});
  }

  onLogin() {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  this.LoginContinue = true;
  this.msg = 'Logging in...';

  const formData = {
    ...this.loginForm.value,
    role: this.role,
  };

  this.authService.onLogin(formData).then((res: any) => {
    this.LoginContinue = false;

    const { role, accountStatus } = res;

    if (accountStatus !== 'approved') {
      this.snackbar.open(`Your account is ${accountStatus}. Please wait for admin approval.`, 'Close', {
        duration: 3000,
      });
      return;
    }

    if (role === 'admin') {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/emp-dashboard']);
    }
  }).catch((error) => {
    this.LoginContinue = false;
    console.error('Login error:', error);
  });
}

onSendOtp() {
  const gmail = this.loginForm.get('gmail')?.value;

  if (!gmail || this.loginForm.get('gmail')?.invalid) {
    this.snackbar.open('Please enter a valid email first.', 'Close', { duration: 3000 });
    return;
  }

  const otpSender = {
    email: 'your_otp_sender@gmail.com', // ✅ You can make this dynamic from env or form input
    password: 'app_specific_password_here',
  };

  this.LoginContinue = true;
  this.msg = 'Sending OTP...';

  this.authService.sendOtp(gmail, otpSender)
    .then(() => {
      this.LoginContinue = false;
    })
    .catch(() => {
      this.LoginContinue = false;
    });
}


}