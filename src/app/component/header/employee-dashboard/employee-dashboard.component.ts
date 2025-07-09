import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BusinessDataService } from 'src/app/services/business-data.service';
import { AlertBoxComponent } from 'src/app/shared/alert-box/alert-box.component';
import { ProfileComponent } from 'src/app/shared/profile/profile.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from './confirm.component';

interface Leave {
  [key: string]: any; 
  _id:string;
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
  selector: 'app-employee-dashboard',
  templateUrl: './employee-dashboard.component.html',
  styleUrls: ['./employee-dashboard.component.scss']
})
export class EmployeeDashboardComponent implements OnInit {
  totalLeaves = 24;
  leavesTaken = 0;
  pendingLeaves = 0;
  employees: any[] = [];
  employeesInDept: any[] = [];
showEmployees = false;
isEmployeesLoaded = false;
employeeLeaveStatus: { [key: string]: string } = {}; // Map of email -> status

employeeColumns: string[] = ['name', 'email', 'department', 'role'];
  allLeaves: Leave[] = [];
  pagedLeaves: Leave[] = [];

  columnsToDisplay: string[] = ['leaveType', 'startDate', 'endDate', 'status', 'reason', 'actions'];

  // Paginator
  pageSize = 5;
  currentPage = 0;

  // Editing
 editingIndex: number | null = null;
pageIndex: number = 0; 
editedLeave: Leave | null = null;
userRole: string = '';


  constructor(
    private route: Router,
    public dialog: MatDialog,
    public businessData: BusinessDataService,
     private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const gmail = localStorage.getItem('user_email');

    if (gmail) {
      this.businessData.getLeavesByEmployeeId(gmail).subscribe({
        next: (res: any) => {
          if (res?.data) {
            this.allLeaves = res.data;

            this.leavesTaken = this.allLeaves
              .filter((leave: Leave) => leave.status === 'Approved')
              .reduce((sum: number, leave: Leave) => sum + (leave.totalDays || 0), 0);

            this.pendingLeaves = this.totalLeaves - this.leavesTaken;

            this.updatePagedLeaves();
          }
        },
        error: (err) => {
          console.error('Error fetching leave data:', err);
        }
      });

       const userId = localStorage.getItem('Id');
    if (userId) {
      this.businessData.getUserById(userId).subscribe({
        next: (user: any) => {
          this.userRole = user?.role || '';
        },
        error: (err) => {
          console.error('Error fetching user role:', err);
        }
      });
    }
    }
  }

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

  pageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagedLeaves();
  }

  // openDialog(): void {
  //   this.dialog.open(ProfileComponent, { width: '100px' });
  // }

  onView(): void {
    this.route.navigate(['dashboard']);
  }

  onProfile(): void{
    this.route.navigate(['profile']);
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

  // Start Editing a row
 originalLeave: Leave | null = null;

startEditing(index: number) {
  const leaveToEdit = this.pagedLeaves[index];
  if (leaveToEdit.status !== 'Pending') return;

  this.editingIndex = index;
  this.editedLeave = { ...leaveToEdit };        // clone to edit
  this.originalLeave = { ...leaveToEdit };      // clone to compare
}

  // Cancel editing
  cancelEditing(): void {
    this.editingIndex = null;
    this.editedLeave = {} as Leave;
  }

submitEdit() {
  if (!this.editedLeave || !this.originalLeave || !this.editedLeave._id || !this.editedLeave.leaveId) return;

  const updatedFields: any = {};
  const editableKeys = [
    'leaveType',
    'startDate',
    'endDate',
    'reason',
    'totalDays',
    'isStartHalfDay',
    'startHalfDayType',
    'isEndHalfDay',
    'endHalfDayType',
    'status'
  ];

  editableKeys.forEach((key) => {
    if (this.editedLeave![key] !== this.originalLeave![key]) {
      updatedFields[key] = this.editedLeave![key];
    }
  });

  if (Object.keys(updatedFields).length === 0) {
    alert('No changes made.');
    return;
  }

  this.businessData.updateLeaveApplication(this.editedLeave.leaveId, updatedFields).subscribe({
    next: (response) => {
      this.snackBar.open('Leave Updated successfully!', 'Close', {
            duration: 3000,
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
      console.log('Leave updated successfully', response);

      if (this.editingIndex !== null) {
        this.allLeaves[this.editingIndex] = {
          ...this.allLeaves[this.editingIndex],
          ...updatedFields
        };
      }

      this.updatePagedLeaves();
      this.editingIndex = null;
      this.editedLeave = null;
      this.originalLeave = null;
    },
    error: (err) => {
      console.error('Error updating leave:', err);
      alert('Failed to update leave. Please try again.');
    }
  });
}

onDeleteLeave(index: number) {
  const leave = this.pagedLeaves[index];
if (!leave.leaveId) return;

  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    width: '300px',
    data: { message: 'Are you sure you want to delete this leave application?' }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.businessData.deleteLeaveApplication(leave.leaveId!).subscribe({
        next: (res) => {
          this.snackBar.open('Leave deleted successfully!', 'Close', {
            duration: 3000,
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          const globalIndex = this.allLeaves.findIndex(l => l.leaveId === leave.leaveId);
          if (globalIndex !== -1) {
            this.allLeaves.splice(globalIndex, 1);
            this.updatePagedLeaves();
          }
        },
        error: (err) => {
          console.error('Error deleting leave:', err);
          this.snackBar.open('Failed to delete leave.', 'Close', {
            duration: 3000,
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  });
}


toggleEmployees(): void {
  this.showEmployees = !this.showEmployees;

  if (this.showEmployees && !this.isEmployeesLoaded) {
    const userId = localStorage.getItem('Id');
    if (!userId) return;

    this.businessData.getUserById(userId).subscribe({
      next: (user: any) => {
        const department = user?.department?.trim();
        if (!department) return;

        this.businessData.getEmployeesByDepartment(department).subscribe({
          next: (res) => {
            this.employeesInDept = res.data || [];
            this.isEmployeesLoaded = true;
          },
          error: (err) => {
            console.error('Error loading employees:', err);
          }
        });
      },
      error: (err) => {
        console.error('Error fetching user:', err);
      }
    });
  }
}

}
