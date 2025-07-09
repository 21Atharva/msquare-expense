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

  managersList: any[] = [];
  departmentList: string[] = ['Development', 'Design', 'HR', 'Sales']; // Static list

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
      role: new FormControl('employee', Validators.required),
      department: new FormControl('', Validators.required)
    });

    // Fetch list of managers
  this.businessData.getManagers().subscribe({
  next: (res: any) => {
    this.managersList = (res.data || []).filter((mgr: any) => mgr.department?.trim());
  },
  error: (err) => {
    console.error('Error fetching managers:', err);
  }
});
  }

  getUniqueManagerDepartments(): string[] {
  const allDepartments = this.managersList.map(m => m.department);
  return [...new Set(allDepartments)]; // remove duplicates
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
  if (this.currentStep !== 3) return;

  // Ensure form is fully synced
  this.signUpForm.updateValueAndValidity();

  if (this.signUpForm.invalid) {
    this.signUpForm.markAllAsTouched();
    return;
  }

  this.SignUpContinue = true;

  // ✅ Add log to confirm department is included
  console.log("Payload being sent:", this.signUpForm.value);


   this.authService.onSignUp(this.signUpForm.getRawValue())

    .then((userRole: string) => {
      this.SignUpContinue = false;
      this.authService.saveSource(
        this.signUpForm.value.gmail,
        'signup',
        this.businessData.getComingSrc()
      );
       this.router.navigate(['/login']);
      // Navigate as required
    })
    .catch((error) => {
      this.SignUpContinue = false;
      console.error(error);
      this.snackbar.open('Signup failed. Try again.', 'Close', {
        duration: 3000
      });
    });
}

}
