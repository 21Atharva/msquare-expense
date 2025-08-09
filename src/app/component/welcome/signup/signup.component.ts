import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { BusinessDataService } from 'src/app/services/business-data.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  signUpForm!: FormGroup;
  SignUpContinue: boolean = false;
  currentStep: number = 1;
  @Output() switchToLogin = new EventEmitter<void>();



  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private snackbar: MatSnackBar,
    public businessData: BusinessDataService
  ) {}

  ngOnInit(): void {
    this.signUpForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.pattern(/^[A-Za-z\s]+$/)]),
      username: new FormControl('', [Validators.required]),
      gmail: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      pin: new FormControl('', [Validators.required, Validators.pattern(/^\d{4}$/)]),
      role: new FormControl('employee', Validators.required)
    });

  }

  nextStep(): void {
    if (this.currentStep === 1 && (
        this.signUpForm.get('name')?.invalid ||
        this.signUpForm.get('username')?.invalid ||
        this.signUpForm.get('gmail')?.invalid
      )) {
      this.signUpForm.get('name')?.markAsTouched();
      this.signUpForm.get('username')?.markAsTouched();
      this.signUpForm.get('gmail')?.markAsTouched();
      return;
    }

    if (this.currentStep === 2 && (
        this.signUpForm.get('password')?.invalid ||
        this.signUpForm.get('pin')?.invalid
      )) {
      this.signUpForm.get('password')?.markAsTouched();
      this.signUpForm.get('pin')?.markAsTouched();
      return;
    }

    this.currentStep++;
  }

  prevStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

onProceed() {
  console.log('Signup button clicked!');
  
  if (this.currentStep !== 3) {
    console.log('Not on final step, current step:', this.currentStep);
    return;
  }

  // Ensure form is fully synced
  this.signUpForm.updateValueAndValidity();

  if (this.signUpForm.invalid) {
    console.log('Form is invalid:', this.signUpForm.errors);
    console.log('Invalid fields:', Object.keys(this.signUpForm.controls).filter(key => 
      this.signUpForm.get(key)?.invalid
    ));
    this.signUpForm.markAllAsTouched();
    return;
  }

  this.SignUpContinue = true;

  const formData = this.signUpForm.getRawValue();
  console.log("Signup payload being sent:", formData);
  console.log('🔧 SIGNUP - Using environment API URL');

  this.authService.onSignUp(formData)
    .then((userRole: string) => {
      console.log('Signup success, user role:', userRole);
      this.SignUpContinue = false;
      this.authService.saveSource(
        this.signUpForm.value.gmail,
        'signup',
        this.businessData.getComingSrc()
      );
      
      this.snackbar.open('Account created successfully! Please login.', 'Close', {
        duration: 3000
      });
      
      this.router.navigate(['/login']);
    })
    .catch((error) => {
      console.error('Signup error:', error);
      this.SignUpContinue = false;
      
      // Show detailed error message
      const errorMsg = error?.error?.message || error?.message || 'Signup failed. Please check if backend server is running.';
      this.snackbar.open(errorMsg, 'Close', {
        duration: 5000
      });
    });
}

}
