import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BusinessDataService } from 'src/app/services/business-data.service';
import { AlertBoxComponent } from 'src/app/shared/alert-box/alert-box.component';
import { ProfileComponent } from 'src/app/shared/profile/profile.component';
import { LayoutConfig } from 'src/app/shared/layout/layout.interface';

interface Leave {
  [key: string]: any;
  _id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  reason: string;
  totalDays?: number;
  leaveId?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-leave-application',
  templateUrl: './leave-application.component.html',
  styleUrls: ['./leave-application.component.scss']
})
export class LeaveApplicationComponent implements OnInit {
  layoutConfig!: LayoutConfig;
  leaveForm!: FormGroup;
  totalLeaves = 24;
  minDate: string = '';
  maxDate: string = '';
  leaveTypes = ['Sick Leave', 'Casual Leave', 'Earned Leave', 'Maternity Leave', 'Paternity Leave'];
  selectedFileName: string = '';
  leavesTaken = 0;
  totalLeaveDays: number = 0;
  leaveSummary: { date: string, label: string, type: string }[] = [];
  remainingDays = 8.5;
  pendingLeaves = 0;

  allLeaves: Leave[] = [];
  pagedLeaves: Leave[] = [];

  columnsToDisplay: string[] = ['leaveType', 'startDate', 'endDate', 'status', 'reason', 'actions'];
  dateFilter = (date: Date | null): boolean => {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};
  holidayList: { month: number; day: number }[] = [
    { month: 4, day: 1 },   // 1 May
    { month: 5, day: 30 },  // 30 June
    { month: 6, day: 12 },  // 12 July
    { month: 7, day: 15 }   // 15 August
  ];

  pageSize = 5;
  currentPage = 0;

  constructor(
    private fb: FormBuilder,
    private route: Router,
    public dialog: MatDialog,
    public businessData: BusinessDataService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setMonth(today.getMonth() + 3);

    this.minDate = today.toISOString().split('T')[0];
    this.maxDate = futureDate.toISOString().split('T')[0];

    this.leaveForm = this.fb.group({
      leaveType: ['', Validators.required],
      startDate: [new Date().toISOString().split('T')[0], Validators.required],
      endDate: [new Date().toISOString().split('T')[0], Validators.required],
      reason: ['', [Validators.required, Validators.maxLength(200)]],
      halfDay: [false],
      attachment: [null]
    });

    this.leaveForm.valueChanges.subscribe(() => {
      const { startDate, endDate, halfDay } = this.leaveForm.value;
      if (startDate && endDate) {
        this.totalLeaveDays = this.calculateTotalLeaveDays(startDate, endDate, halfDay);
        this.generateLeaveSummary();
      }
    });

    // Initial calculation when component loads
    setTimeout(() => {
      const { startDate, endDate, halfDay } = this.leaveForm.value;
      if (startDate && endDate) {
        this.totalLeaveDays = this.calculateTotalLeaveDays(startDate, endDate, halfDay);
        this.generateLeaveSummary();
      }
    }, 0);

    const gmail = localStorage.getItem('user_email');
    if (gmail) {
      this.businessData.getLeavesByEmployeeId(gmail).subscribe({
        next: (res: any) => {
          if (res?.data) {
            this.allLeaves = res.data;
            this.leavesTaken = this.allLeaves.filter((leave: Leave) => leave.status === 'Approved')
              .reduce((sum: number, leave: Leave) => sum + (leave.totalDays || 0), 0);
            this.pendingLeaves = this.totalLeaves - this.leavesTaken;
            this.updatePagedLeaves();
          }
        },
        error: (err) => {
          console.error('Error fetching leave data:', err);
        }
      });
    }
    this.setupLayoutConfig();
  }

  isHoliday(date: Date): boolean {
    return this.holidayList.some(holiday =>
      date.getMonth() === holiday.month && date.getDate() === holiday.day
    );
  }

  dateClass = (d: Date): string => {
    const date = new Date(d);
    return this.isHoliday(date) ? 'holiday-date' : '';
  };

  hasPendingLeaves(): boolean {
    return this.pagedLeaves.some(leave => leave.status === 'Pending');
  }

  updatePagedLeaves(): void {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.pagedLeaves = this.allLeaves.slice(start, end);
    const hasPending = this.pagedLeaves.some(leave => leave.status === 'Pending');
    this.columnsToDisplay = hasPending
      ? ['leaveType', 'startDate', 'endDate', 'status', 'reason', 'actions']
      : ['leaveType', 'startDate', 'endDate', 'status', 'reason'];
  }

  calculateTotalLeaveDays(start: string | Date, end: string | Date, isHalfDay: boolean = false): number {
    // Normalize dates to ensure proper comparison
    let startDate: Date, endDate: Date;
    
    if (start instanceof Date) {
      startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    } else {
      const startParts = start.split('-');
      startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
    }
    
    if (end instanceof Date) {
      endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    } else {
      const endParts = end.split('-');
      endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
    }
    
    let count = 0;
    const current = new Date(startDate.getTime());

    // Use date comparison with proper loop termination
    while (current.getTime() <= endDate.getTime()) {
      const day = current.getDay();
      const isSaturday = day === 6;
      const isSunday = day === 0;
      const isHoliday = this.isHoliday(current);

      if (isHoliday || isSunday) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      // Saturday is always half day
      if (isSaturday) {
        count += 0.5;
      } else {
        // Apply half day logic for regular working days
        count += isHalfDay ? 0.5 : 1;
      }

      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  generateLeaveSummary(): void {
    const { startDate, endDate, halfDay } = this.leaveForm.value;
    if (!startDate || !endDate) {
      this.leaveSummary = [];
      return;
    }
    
    // Normalize dates to ensure proper comparison
    let start: Date, end: Date;
    
    if (startDate instanceof Date) {
      start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    } else {
      const startParts = startDate.split('-');
      start = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
    }
    
    if (endDate instanceof Date) {
      end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    } else {
      const endParts = endDate.split('-');
      end = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
    }
    
    const summary: { date: string, label: string, type: string }[] = [];
    const current = new Date(start.getTime());

    // Use date comparison with proper loop termination
    while (current.getTime() <= end.getTime()) {
      const day = current.getDay();
      const isSaturday = day === 6;
      const isSunday = day === 0;
      const isHoliday = this.isHoliday(current);

      const dateLabel = current.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit'
      });

      let label = 'All Day';
      let type = 'blue';

      if (isHoliday) {
        label = 'Holiday';
        type = 'red';
      } else if (isSunday) {
        label = 'Non working day';
        type = 'gray';
      } else if (isSaturday) {
        label = 'Half Day (Saturday)';
        type = 'yellow';
      } else if (halfDay) {
        // Apply half day to regular working days when checkbox is checked
        label = 'Half Day';
        type = 'yellow';
      }

      summary.push({ date: dateLabel, label, type });
      current.setDate(current.getDate() + 1);
    }

    this.leaveSummary = summary;
  }

  getFormattedDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  }



  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.leaveForm.patchValue({ attachment: file });
      this.selectedFileName = file.name;
    }
  }

  onSubmit(): void {
    if (this.leaveForm.valid) {
      const leaveData = this.leaveForm.value;
      const totalDays = this.calculateTotalLeaveDays(leaveData.startDate, leaveData.endDate, leaveData.halfDay);
      const employeeId = localStorage.getItem('Id')?.trim();
      const emailId = localStorage.getItem('user_email') || '';

      if (!employeeId || employeeId.length !== 24) {
        this.dialog.open(AlertBoxComponent, {
          width: '300px',
          data: { type: 'error', message: 'Employee ID is missing or invalid.' }
        });
        return;
      }

      const formData = new FormData();
      formData.append('employeeId', employeeId);
      formData.append('emailId', emailId);
      formData.append('leaveType', leaveData.leaveType);
      formData.append('startDate', leaveData.startDate);
      formData.append('endDate', leaveData.endDate);
      formData.append('reason', leaveData.reason);
      formData.append('totalDays', totalDays.toString());

      if (leaveData.attachment) {
        formData.append('attachment', leaveData.attachment);
      }

      this.businessData.applyLeave(formData).subscribe({
        next: (response) => {
          const dialogRef = this.dialog.open(AlertBoxComponent, {
            width: '300px',
            data: { type: 'success', message: 'Leave application submitted successfully!' }
          });
          
          dialogRef.afterClosed().subscribe(() => {
            // Redirect to leave dashboard after dialog closes
            this.onEmpDashboard();
          });
          
          this.resetForm();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Failed to submit leave application. Please try again.';
          this.dialog.open(AlertBoxComponent, {
            width: '300px',
            data: { type: 'error', message: errorMessage }
          });
        }
      });
    } else {
      this.leaveForm.markAllAsTouched();
      const firstError = this.getFirstFormError();
      if (firstError) {
        this.dialog.open(AlertBoxComponent, {
          width: '300px',
          data: { type: 'error', message: firstError }
        });
      }
    }
  }

  private getFirstFormError(): string {
    const controls = this.leaveForm.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        const control = controls[name];
        if (control.errors?.['required']) {
          return `${this.getFieldDisplayName(name)} is required.`;
        }
        if (control.errors?.['maxlength']) {
          return `${this.getFieldDisplayName(name)} is too long.`;
        }
      }
    }
    return 'Please fill all required fields correctly.';
  }

  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      'leaveType': 'Leave Type',
      'startDate': 'Start Date',
      'endDate': 'End Date',
      'reason': 'Reason'
    };
    return fieldNames[fieldName] || fieldName;
  }

  cancel(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.leaveForm.reset({
      leaveType: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reason: '',
      halfDay: false,
      attachment: null
    });
    
    // Clear all validation states
    this.leaveForm.markAsUntouched();
    this.leaveForm.markAsPristine();
    Object.keys(this.leaveForm.controls).forEach(key => {
      this.leaveForm.get(key)?.setErrors(null);
    });
    
    this.selectedFileName = '';
    this.totalLeaveDays = 0;
    this.leaveSummary = [];
  }

  openDialog(): void {
    this.dialog.open(ProfileComponent, { width: '600px' });
  }

  onView(): void {
    this.route.navigate(['dashboard']);
  }

  onLogout(): void {
    this.dialog.open(AlertBoxComponent, {
      data: { type: 'alert' }
    });
  }

  onLeaveApplication(): void {
    this.businessData.onNavigate('leave-application');
  }

  onEmpDashboard(): void {
    this.businessData.onNavigate('emp-dashboard');
  }

  onAdd(): void {
    this.businessData.onNavigate('home');
  }

  onLeaveManagement(): void {
    this.businessData.onNavigate('leave-management');
  }

  onAdminDashboard(): void {
    this.businessData.onNavigate('admin-dashboard');
  }

  onPendingApprovals(): void {
    this.businessData.onNavigate('pending-approvals');
  }

  // Check if current user is a manager
  isManager(): boolean {
    return localStorage.getItem('role') === 'manager';
  }

  private setupLayoutConfig() {
    const userRole = localStorage.getItem('role') || 'employee';
    
    const employeeNavigationItems = [
      { label: 'Profile', icon: 'perm_identity', action: () => this.openDialog(), isActive: () => false },
      { label: 'View Expenses', icon: 'bar_chart', action: () => this.onView(), isActive: () => false },
      { label: 'Add Expenses', icon: 'add', action: () => this.onAdd(), isActive: () => false },
      { label: 'Leave Application', icon: 'event_note', action: () => this.onLeaveApplication(), isActive: () => true },
      { label: 'Leave Dashboard', icon: 'dashboard', action: () => this.onEmpDashboard(), isActive: () => false },
      { label: 'Logout', icon: 'logout', action: () => this.onLogout(), isActive: () => false }
    ];

    const adminNavigationItems = [
      { label: 'Profile', icon: 'perm_identity', action: () => this.openDialog(), isActive: () => false },
      { label: 'View Expenses', icon: 'bar_chart', action: () => this.onView(), isActive: () => false },
      { label: 'Add Expenses', icon: 'add', action: () => this.onAdd(), isActive: () => false },
      { label: 'Pending Approvals', icon: 'approval', action: () => this.onPendingApprovals(), isActive: () => false },
      { label: 'Manage Employee Leaves', icon: 'assignment', action: () => this.onLeaveManagement(), isActive: () => false },
      { label: 'Admin Dashboard', icon: 'dashboard', action: () => this.onAdminDashboard(), isActive: () => false },
      { label: 'Logout', icon: 'logout', action: () => this.onLogout(), isActive: () => false }
    ];

    const managerNavigationItems = [
      { label: 'Profile', icon: 'perm_identity', action: () => this.openDialog(), isActive: () => false },
      { label: 'View Expenses', icon: 'bar_chart', action: () => this.onView(), isActive: () => false },
      { label: 'Add Expenses', icon: 'add', action: () => this.onAdd(), isActive: () => false },
      { label: 'Leave Dashboard', icon: 'dashboard', action: () => this.onEmpDashboard(), isActive: () => false },
      { label: 'Leave Application', icon: 'event_note', action: () => this.onLeaveApplication(), isActive: () => true },
      { label: 'Manage Employee Leaves', icon: 'assignment', action: () => this.onLeaveManagement(), isActive: () => false },
      { label: 'Logout', icon: 'logout', action: () => this.onLogout(), isActive: () => false }
    ];

    let navigationItems;
    if (userRole === 'admin') {
      navigationItems = adminNavigationItems;
    } else if (userRole === 'manager') {
      navigationItems = managerNavigationItems;
    } else {
      navigationItems = employeeNavigationItems;
    }

    this.layoutConfig = {
      title: 'Msquare Portal',
      logoPath: '../../../../assets/image/msquare.png',
      navigationItems: navigationItems,
      userRole: userRole
    };
  }
}
