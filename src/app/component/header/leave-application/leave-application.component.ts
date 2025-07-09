import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BusinessDataService } from 'src/app/services/business-data.service';
import { AlertBoxComponent } from 'src/app/shared/alert-box/alert-box.component';
import { ProfileComponent } from 'src/app/shared/profile/profile.component';

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
  isStartHalfDay?: boolean;
  startHalfDayType?: string;
  isEndHalfDay?: boolean;
  endHalfDayType?: string;
}

@Component({
  selector: 'app-leave-application',
  templateUrl: './leave-application.component.html',
  styleUrls: ['./leave-application.component.scss']
})
export class LeaveApplicationComponent implements OnInit {
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
      isStartHalfDay: [false],
      startHalfDayType: [''],
      isEndHalfDay: [false],
      endHalfDayType: [''],
      attachment: [null]
    });

    this.leaveForm.valueChanges.subscribe(() => {
      const { startDate, endDate } = this.leaveForm.value;
      if (startDate && endDate) {
        this.totalLeaveDays = this.calculateTotalLeaveDays(startDate, endDate);
        this.generateLeaveSummary();
      }
    });

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

  calculateTotalLeaveDays(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const day = current.getDay();
      const isSaturday = day === 6;
      const isSunday = day === 0;
      const isHoliday = this.isHoliday(current);

      if (isHoliday || isSunday) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      if (
        current.toDateString() === startDate.toDateString() &&
        this.leaveForm.value.isStartHalfDay
      ) {
        count += 0.5;
      } else if (
        current.toDateString() === endDate.toDateString() &&
        this.leaveForm.value.isEndHalfDay
      ) {
        count += 0.5;
      } else if (isSaturday) {
        count += 0.5;
      } else {
        count += 1;
      }

      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  generateLeaveSummary(): void {
    const { startDate, endDate, isStartHalfDay, isEndHalfDay } = this.leaveForm.value;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const summary: { date: string, label: string, type: string }[] = [];

    while (start <= end) {
      const current = new Date(start);
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
      }

      if (
        current.toDateString() === new Date(startDate).toDateString() &&
        isStartHalfDay &&
        !isHoliday &&
        !isSunday &&
        !isSaturday
      ) {
        label = 'Half Day (Start)';
        type = 'yellow';
      }

      if (
        current.toDateString() === new Date(endDate).toDateString() &&
        isEndHalfDay &&
        !isHoliday &&
        !isSunday &&
        !isSaturday
      ) {
        label = 'Half Day (End)';
        type = 'yellow';
      }

      summary.push({ date: dateLabel, label, type });
      start.setDate(start.getDate() + 1);
    }

    this.leaveSummary = summary;
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
      const totalDays = this.calculateTotalLeaveDays(leaveData.startDate, leaveData.endDate);
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
      formData.append('isStartHalfDay', leaveData.isStartHalfDay ? 'true' : 'false');
      formData.append('startHalfDayType', leaveData.startHalfDayType || '');
      formData.append('isEndHalfDay', leaveData.isEndHalfDay ? 'true' : 'false');
      formData.append('endHalfDayType', leaveData.endHalfDayType || '');
      formData.append('totalDays', totalDays.toString());

      if (leaveData.attachment) {
        formData.append('attachment', leaveData.attachment);
      }

      this.businessData.applyLeave(formData).subscribe({
        next: (response) => {
          this.dialog.open(AlertBoxComponent, {
            width: '300px',
            data: { type: 'success', message: 'Leave application submitted successfully!' }
          });
          this.leaveForm.reset();
          this.selectedFileName = '';
          this.totalLeaveDays = 0;
          this.leaveSummary = [];
          this.ngOnInit();
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
    this.leaveForm.reset();
    this.selectedFileName = '';
    this.totalLeaveDays = 0;
    this.leaveSummary = [];
  }

  openDialog(): void {
    this.dialog.open(ProfileComponent, { width: '100px' });
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
}
