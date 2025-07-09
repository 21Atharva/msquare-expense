import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BusinessDataService } from 'src/app/services/business-data.service';
import { AlertBoxComponent } from 'src/app/shared/alert-box/alert-box.component';
import { LeaveApplication } from '../admin-dashboard/admin-dashboard.component';
import { ProfileComponent } from '../shared/profile/profile.component';

@Component({
  selector: 'app-leave-management',
  templateUrl: './leave-management.component.html',
  styleUrls: ['./leave-management.component.scss']
})
export class LeaveManagementComponent implements OnInit {
  dataSource: LeaveApplication[] = [];
  originalDataSource: LeaveApplication[] = [];
  displayedColumns: string[] = [
    'employeeName', 'leaveType', 'totalDays', 'startDate', 'endDate', 'status', 'reason', 'actions'
  ];

  isExpanded = false;
  totalCount = 0;
  pendingCount = 0;
  approvedCount = 0;
  rejectedCount = 0;

  pageSize = 6;
  pageIndex = 0;
  pagedLeaves: LeaveApplication[] = [];

  userRole = '';
  searchQuery: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    public dialog: MatDialog,
    private route: Router,
    private snackBar: MatSnackBar,
    private businessData: BusinessDataService
  ) {}

  ngOnInit(): void {
    this.userRole = localStorage.getItem('role') || '';
    this.loadAllLeaves();
  }

  loadAllLeaves(): void {
    const userRole = (localStorage.getItem('role') || '').trim();
    const userId = localStorage.getItem('Id');

    if (!userId) {
      console.error('User ID not found in localStorage.');
      return;
    }

    if (userRole === 'admin') {
      this.businessData.getAllLeaves().subscribe({
        next: (leaves) => {
          this.originalDataSource = leaves;
          this.dataSource = [...leaves];
          this.updatePagedLeaves();
          this.calculateStatusCounts();
        },
        error: (error) => {
          console.error('Error loading leave applications:', error);
          this.dialog.open(AlertBoxComponent, {
            width: '300px',
            data: { message: 'Failed to load leave applications.', type: 'error' }
          });
        }
      });
    } else if (userRole === 'manager') {
      this.businessData.getUserById(userId).subscribe({
        next: (user: any) => {
          const department = (user?.department || '').trim();
          if (!department) {
            console.error('Department not found for manager.');
            return;
          }

          this.businessData.getLeavesByDepartment(department).subscribe({
            next: (leaves) => {
              this.originalDataSource = leaves;
              this.dataSource = [...leaves];
              this.updatePagedLeaves();
              this.calculateStatusCounts();
            },
            error: (error) => {
              console.error('Error loading leaves by department:', error);
            }
          });
        },
        error: (err) => {
          console.error('Error fetching manager data:', err);
        }
      });
    }
  }

  calculateStatusCounts(): void {
    this.pendingCount = this.dataSource.filter(leave => leave.status?.toLowerCase() === 'pending').length;
    this.approvedCount = this.dataSource.filter(leave => leave.status?.toLowerCase() === 'approved').length;
    this.rejectedCount = this.dataSource.filter(leave => leave.status?.toLowerCase() === 'rejected').length;
    this.totalCount = this.pendingCount + this.approvedCount + this.rejectedCount;
  }

  updatePagedLeaves(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.pagedLeaves = this.dataSource.slice(start, end);
  }

  pageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagedLeaves();
  }

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.split(' ');
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (!filterValue) {
      this.dataSource = [...this.originalDataSource];
    } else {
      this.dataSource = this.originalDataSource.filter(leave =>
        leave.employeeName.toLowerCase().includes(filterValue) ||
        leave.employeeId?.toLowerCase().includes(filterValue) ||
        leave.leaveType.toLowerCase().includes(filterValue) ||
        leave.status.toLowerCase().includes(filterValue)
      );
    }
    this.pageIndex = 0;
    this.updatePagedLeaves();
    this.calculateStatusCounts();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadAllLeaves();
  }

  updateStatus(leaveId: string, status: string): void {
    this.businessData.updateLeaveStatus(leaveId, status).subscribe({
      next: () => {
        this.dialog.open(AlertBoxComponent, {
          data: { type: 'success', message: `Leave status updated to ${status}` }
        });
        this.loadAllLeaves();
      },
      error: (error) => {
        console.error('Failed to update status', error);
        this.dialog.open(AlertBoxComponent, {
          data: { type: 'error', message: 'Failed to update leave status' }
        });
      }
    });
  }

  // Navigation methods (unchanged)
  openDialog(): void {
    this.dialog.open(ProfileComponent, { width: '100px' });
  }

  onView(): void {
    this.route.navigate(['dashboard']);
  }

  onProfile(): void {
    this.route.navigate(['profile']);
  }

  onLogout(): void {
    this.dialog.open(AlertBoxComponent, { data: { type: 'alert' } });
  }

  onLeaveApplication(): void {
    this.businessData.onNavigate('leave-management');
  }

  onEmpDashboard(): void {
    this.businessData.onNavigate('emp-dashboard');
  }

  addLeaveApplication(): void {
    this.businessData.onNavigate('leave-application');
  }

  onAdminDashboard(): void {
    this.businessData.onNavigate('admin-dashboard');
  }

  onAdd(): void {
    this.businessData.onNavigate('home');
  }
}
